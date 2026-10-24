/**
 * Projects canonical case data + player progress into the sanitised view the
 * browser receives. Nothing here may expose undiscovered evidence, deduction
 * rules, suspect secrets or the solution while a case is active.
 */
import type { CaseState, EvidenceView, Resolution, TimelineEntry } from "../../shared/api.ts";
import type { CaseDef } from "../cases/types.ts";
import { availableTopics } from "../dialogue/authored.ts";
import { MAX_ACCUSATIONS, MIN_EVIDENCE, currentHint, ev } from "./engine.ts";
import { has, type CaseProgress } from "./state.ts";

function timeKey(t: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(t);
  if (!m) return -1;
  // The case night runs past midnight; early-morning hours sort after the evening.
  const h = Number(m[1]);
  return (h < 6 ? h + 24 : h) * 60 + Number(m[2]);
}

export function buildCaseState(def: CaseDef, p: CaseProgress): CaseState {
  const evidence: EvidenceView[] = Object.entries(p.discovered)
    .sort((a, b) => a[1] - b[1])
    .map(([id, at]) => {
      const e = ev(def, id)!;
      return {
        id, title: e.title, type: e.type, reliability: e.type === "testimony" ? "testimony" : "confirmed",
        summary: e.summary, detail: e.detail, locationName: e.source, icon: e.icon, importance: e.importance,
        discoveredAt: at, photographed: p.photographed.includes(id),
      };
    });

  const timeline: TimelineEntry[] = [];
  for (const e of evidence) {
    for (const t of ev(def, e.id)!.timeline ?? []) {
      timeline.push({ time: t.time, text: t.text, kind: e.reliability === "testimony" || t.text.startsWith("(Claim)") ? "testimony" : "confirmed", source: e.id, sourceTitle: e.title });
    }
  }
  for (const n of p.notes) {
    const m = /^(\d{1,2}:\d{2})\s*[-—:]?\s*(.+)$/s.exec(n.text);
    if (m && !n.auto) timeline.push({ time: m[1], text: m[2], kind: "theory", source: n.id, sourceTitle: "Your note" });
  }
  timeline.sort((a, b) => timeKey(a.time) - timeKey(b.time));

  return {
    caseId: def.id,
    title: def.title,
    subtitle: def.subtitle,
    setting: def.setting,
    date: def.date,
    difficulty: def.difficulty,
    synopsis: def.synopsis,
    stamp: def.stamp ?? "Homicide",
    briefing: def.briefing,
    victim: def.victim,
    status: p.status,
    currentLocation: p.currentLocation,
    locations: def.locations.map((l) => {
      const unlocked = p.unlocked.includes(l.id);
      const clueSpots = l.hotspots.filter((h) => h.evidence);
      return {
        id: l.id, name: l.name, district: l.district, scene: l.scene, unlocked,
        visited: p.visited.includes(l.id),
        description: unlocked ? l.description : "",
        unlockHint: unlocked ? "" : l.unlockHint,
        mapPos: l.mapPos,
        cluesFound: clueSpots.filter((h) => has(p, h.evidence!)).length,
        cluesTotal: clueSpots.length,
        isNew: unlocked && !p.visited.includes(l.id),
      };
    }),
    evidence,
    evidenceTotal: def.evidence.filter((e) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === e.id))).length,
    cluesFound: Object.keys(p.discovered).filter((id) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === id))).length,
    suspects: def.suspects.map((s) => {
      const sp = p.suspects[s.id];
      return {
        id: s.id, name: s.name, age: s.age, height: s.height, profession: s.profession, relation: s.relation,
        personality: s.personality, bio: s.bio, motive: s.motive, alibi: s.alibi, portrait: s.portrait, greeting: s.greeting,
        voice: s.voice ?? { gender: "male", pitch: 1, rate: 1, seed: s.id.length },
        mood: sp.mood, stress: sp.stress, trust: sp.trust, interviewed: sp.interviewed, history: sp.history,
        suggestions: availableTopics(s, p).map((t) => ({ id: t.id, label: t.label, asked: sp.asked.includes(t.id) })),
      };
    }),
    deductions: Object.entries(p.deductions)
      .sort((a, b) => a[1].at - b[1].at)
      .map(([id, d]) => {
        const def_ = def.deductions.find((x) => x.id === id)!;
        return { id, title: def_.title, text: def_.text, contradiction: Boolean(def_.contradiction), from: d.from, at: d.at };
      }),
    deductionTotal: def.deductions.length,
    contradictionsFound: Object.keys(p.deductions).filter((id) => def.deductions.find((d) => d.id === id)?.contradiction).length,
    board: p.board,
    notes: p.notes,
    timeline,
    accusation: {
      motives: def.accusation.motives,
      methods: def.accusation.methods,
      sequences: def.accusation.sequences,
      minEvidence: MIN_EVIDENCE,
      attemptsLeft: p.mode === "easy" ? 99 : Math.max(0, MAX_ACCUSATIONS - p.accusations.length),
    },
    accusations: p.accusations.map((a) => ({ at: a.at, suspectId: a.suspectId, verdict: a.verdict })),
    hint: currentHint(def, p),
    mode: p.mode ?? "normal",
    hintsUsed: p.hintsUsed ?? 0,
    startedAt: p.startedAt,
    updatedAt: p.updatedAt,
  };
}

/** Only available once the case is no longer active. */
export function buildResolution(def: CaseDef, p: CaseProgress): Resolution | null {
  if (p.status === "active") return null;
  const culprit = def.suspects.find((s) => s.id === def.solution.culprit)!;
  const fieldTotal = def.evidence.filter((e) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === e.id))).length;
  const fieldFound = Object.keys(p.discovered).filter((id) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === id))).length;
  return {
    caseId: def.id,
    title: def.title,
    status: p.status,
    culprit: { id: culprit.id, name: culprit.name },
    verdict: p.verdict,
    scenes: def.solution.scenes,
    truths: def.suspects.map((s) => ({ suspect: s.name, text: s.truth })),
    stats: {
      cluesFound: fieldFound,
      cluesTotal: fieldTotal,
      deductions: Object.keys(p.deductions).length,
      deductionTotal: def.deductions.length,
      contradictions: Object.keys(p.deductions).filter((id) => def.deductions.find((d) => d.id === id)?.contradiction).length,
      accusations: p.accusations.length,
      hints: p.hintsUsed ?? 0,
      mode: p.mode ?? "normal",
      minutes: Math.max(1, Math.round((p.updatedAt - p.startedAt) / 60000)),
    },
  };
}

