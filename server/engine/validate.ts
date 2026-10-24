/**
 * Case consistency checker. Used by the test suite for hand-authored cases and
 * by the generator before any generated case becomes playable.
 *
 * It (1) checks referential integrity, (2) plays the case to exhaustion with the
 * real engine — exploring every unlocked location, asking every question,
 * presenting every item to every suspect and linking every valid pair — and
 * then (3) checks that the solution is reachable, well supported and unique.
 */
import type { CaseDef, Cond, ResponseNode } from "../cases/types.ts";
import { accuse, act, connect, hotspots, inspect, interrogate, travel, type Ctx } from "./engine.ts";
import { emptyEvents } from "./progression.ts";
import { has, newCaseProgress, newPlayer, type CaseProgress } from "./state.ts";

export interface ValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  stats: { evidence: number; reachableEvidence: number; deductions: number; reachableDeductions: number; contradictions: number; locations: number; suspects: number; misleading: number };
  progress: CaseProgress;
}

const TIME = /^(\d{2}:\d{2}|—)$/;

export async function validateCase(def: CaseDef): Promise<ValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const evIds = new Set(def.evidence.map((e) => e.id));
  const dedIds = new Set(def.deductions.map((d) => d.id));
  const locIds = new Set(def.locations.map((l) => l.id));
  const susIds = new Set(def.suspects.map((s) => s.id));

  const dupes = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) { if (seen.has(id)) errors.push(`Duplicate ${label} id: ${id}`); seen.add(id); }
  };
  dupes("evidence", def.evidence.map((e) => e.id));
  dupes("deduction", def.deductions.map((d) => d.id));
  dupes("location", def.locations.map((l) => l.id));
  dupes("suspect", def.suspects.map((s) => s.id));
  dupes("hotspot", def.locations.flatMap((l) => l.hotspots.map((h) => h.id)));

  const checkCond = (c: Cond | undefined, where: string) => {
    if (!c) return;
    for (const e of [...(c.evidence ?? []), ...(c.anyEvidence ?? [])]) if (!evIds.has(e)) errors.push(`${where}: unknown evidence '${e}'`);
    for (const d of [...(c.deductions ?? []), ...(c.anyDeductions ?? [])]) if (!dedIds.has(d)) errors.push(`${where}: unknown deduction '${d}'`);
  };
  const checkNode = (n: ResponseNode, where: string) => {
    checkCond(n.when, where);
    for (const g of n.grants ?? []) if (!evIds.has(g)) errors.push(`${where}: grants unknown evidence '${g}'`);
    for (const d of n.deductions ?? []) if (!dedIds.has(d)) errors.push(`${where}: unknown deduction '${d}'`);
  };

  for (const s of def.startLocations) if (!locIds.has(s)) errors.push(`Unknown start location ${s}`);
  for (const l of def.locations) {
    checkCond(l.unlock, `location ${l.id}`);
    if (l.unlock && !l.unlockHint) errors.push(`Location ${l.id} is lockable but has no unlock hint`);
    for (const h of l.hotspots) {
      checkCond(h.requires, `hotspot ${h.id}`);
      if (h.evidence && !evIds.has(h.evidence)) errors.push(`hotspot ${h.id}: unknown evidence '${h.evidence}'`);
      if (h.evidence && h.action === "none") errors.push(`hotspot ${h.id}: has evidence but no way to take it`);
    }
  }
  for (const d of def.deductions) {
    for (const [a, b] of d.pairs) for (const x of [a, b]) if (!evIds.has(x)) errors.push(`deduction ${d.id}: unknown evidence '${x}'`);
    for (const s of [...(d.clears ?? []), ...(d.implicates ?? [])]) if (!susIds.has(s)) errors.push(`deduction ${d.id}: unknown suspect '${s}'`);
  }
  for (const s of def.suspects) {
    for (const t of s.topics) { checkCond(t.requires, `${s.id}/${t.id}`); t.nodes.forEach((n, i) => checkNode(n, `${s.id}/${t.id}#${i}`)); }
    for (const [k, nodes] of Object.entries(s.reactions)) {
      if (!evIds.has(k)) errors.push(`${s.id}: reaction to unknown evidence '${k}'`);
      nodes.forEach((n, i) => checkNode(n, `${s.id}/reaction:${k}#${i}`));
    }
  }
  for (const e of def.evidence) for (const t of e.timeline ?? []) if (!TIME.test(t.time)) errors.push(`evidence ${e.id}: bad time '${t.time}'`);

  const sol = def.solution;
  if (!susIds.has(sol.culprit)) errors.push(`Solution culprit '${sol.culprit}' is not a suspect`);
  if (!def.accusation.motives.some((m) => m.id === sol.motive)) errors.push("Solution motive is not an option");
  if (!def.accusation.methods.some((m) => m.id === sol.method)) errors.push("Solution method is not an option");
  if (!def.accusation.sequences.some((m) => m.id === sol.sequence)) errors.push("Solution sequence is not an option");
  for (const k of ["opportunity", "means", "motive"] as const) for (const e of sol.support[k]) if (!evIds.has(e)) errors.push(`support.${k}: unknown evidence '${e}'`);
  const times = sol.timeline.map((t) => t.time);
  for (let i = 1; i < times.length; i++) if (times[i] < times[i - 1]) errors.push(`Canonical timeline out of order at ${times[i]}`);

  // ── exhaustive playthrough ──
  const save = newPlayer("validator");
  const p = newCaseProgress(def);
  const ctx: Ctx = { save, def, p, ev: emptyEvents() };
  if (errors.length === 0) {
    for (let round = 0; round < 40; round++) {
      const before = JSON.stringify([Object.keys(p.discovered).length, Object.keys(p.deductions).length, p.unlocked.length, Object.values(p.suspects).map((s) => s.revealed.length + s.stress)]);
      for (const locId of [...p.unlocked]) {
        travel(ctx, locId);
        for (const h of hotspots(def, p, locId)) {
          const r = inspect(ctx, h.id);
          if (r.action !== "none") act(ctx, h.id, r.action);
        }
      }
      for (const s of def.suspects) {
        for (const t of s.topics) {
          try { await interrogate(ctx, s.id, { topicId: t.id }); } catch { /* topic not yet available */ }
        }
        for (const e of Object.keys(p.discovered)) await interrogate(ctx, s.id, { evidenceId: e });
      }
      for (const d of def.deductions) {
        const pair = d.pairs.find(([a, b]) => has(p, a) && has(p, b));
        if (pair && !(d.id in p.deductions)) connect(ctx, pair[0], pair[1]);
      }
      const after = JSON.stringify([Object.keys(p.discovered).length, Object.keys(p.deductions).length, p.unlocked.length, Object.values(p.suspects).map((s) => s.revealed.length + s.stress)]);
      if (before === after) break;
    }

    for (const l of def.locations) if (!p.unlocked.includes(l.id)) errors.push(`Location '${l.id}' can never be unlocked`);
    for (const e of def.evidence) if (!has(p, e.id)) errors.push(`Evidence '${e.id}' can never be discovered`);
    for (const d of def.deductions) if (!(d.id in p.deductions)) errors.push(`Deduction '${d.id}' can never be made`);
    for (const s of def.suspects) for (const r of s.majorReveals) if (!p.suspects[s.id].revealed.includes(r)) errors.push(`${s.id}: major admission '${r}' unreachable`);

    // A solvable case: the culprit is implicated and every other suspect can be ruled out.
    const learned = def.deductions.filter((d) => d.id in p.deductions);
    const implicating = learned.filter((d) => d.implicates?.includes(sol.culprit)).length;
    if (implicating < 2) errors.push(`Culprit is implicated by only ${implicating} deduction(s); need at least 2`);
    if (learned.some((d) => d.clears?.includes(sol.culprit))) errors.push("A deduction clears the true culprit — contradictory case");
    for (const s of def.suspects) {
      if (s.id === sol.culprit) continue;
      if (!learned.some((d) => d.clears?.includes(s.id))) errors.push(`Multiple solutions: nothing rules out ${s.name}`);
      if (learned.some((d) => d.implicates?.includes(s.id))) errors.push(`Multiple solutions: a deduction implicates innocent ${s.name}`);
    }
    const reachable = (k: "opportunity" | "means" | "motive") => sol.support[k].filter((e) => has(p, e)).length;
    if (reachable("opportunity") < 1) errors.push("No discoverable evidence of the culprit's opportunity");
    if (reachable("means") + reachable("motive") < 1) errors.push("No discoverable evidence of means or motive");

    // The correct accusation must succeed, using only evidence found above.
    if (errors.length === 0) {
      const pick = [...sol.support.opportunity.filter((e) => has(p, e)).slice(0, 2), ...sol.support.means.filter((e) => has(p, e)).slice(0, 1), ...sol.support.motive.filter((e) => has(p, e)).slice(0, 1)];
      const trial = structuredClone(p);
      const result = accuse({ save: newPlayer("v2"), def, p: trial, ev: emptyEvents() }, { suspectId: sol.culprit, motive: sol.motive, method: sol.method, sequence: sol.sequence, evidence: pick });
      if (result.verdict !== "solved") errors.push(`The canonical accusation does not succeed (verdict: ${result.verdict})`);
    }
  }

  const fieldEvidence = def.evidence.filter((e) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === e.id)));
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      evidence: fieldEvidence.length,
      reachableEvidence: fieldEvidence.filter((e) => has(p, e.id)).length,
      deductions: def.deductions.length,
      reachableDeductions: Object.keys(p.deductions).length,
      contradictions: def.deductions.filter((d) => d.contradiction).length,
      locations: def.locations.length,
      suspects: def.suspects.length,
      misleading: def.deductions.filter((d) => d.clears?.length && !d.implicates?.length).length,
    },
    progress: p,
  };
}
