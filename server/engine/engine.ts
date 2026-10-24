/**
 * Game rules. Every mutation of investigation state goes through here so that
 * unlocks, experience, auto-notes and achievements stay consistent.
 */
import type {
  AccuseResult, BoardState, ConnectResult, GameEvents, HotspotView, InspectResult, InterrogateResult, Mood, NoteTag, Verdict,
} from "../../shared/api.ts";
import type { CaseDef, DeductionDef, EvidenceDef, ResponseNode, SuspectDef, TopicDef } from "../cases/types.ts";
import { availableTopics, denial, detectIntent, findEvidenceMention, goodbye, pickNode, pressed, type Intent } from "../dialogue/authored.ts";
import { voiceTurn } from "../dialogue/ai.ts";
import { XP, checkAchievements, grantXp, unlockAchievement } from "./progression.ts";
import { check, clamp, has, uid, type CaseProgress, type PlayerSave, type SuspectProgress } from "./state.ts";

export class GameError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export interface Ctx { save: PlayerSave; def: CaseDef; p: CaseProgress; ev: GameEvents; }

export const MAX_ACCUSATIONS = 3;
export const MIN_EVIDENCE = 3;

const evidenceById = new WeakMap<CaseDef, Map<string, EvidenceDef>>();
export function ev(def: CaseDef, id: string): EvidenceDef | undefined {
  let m = evidenceById.get(def);
  if (!m) { m = new Map(def.evidence.map((e) => [e.id, e])); evidenceById.set(def, m); }
  return m.get(id);
}

function requireActive(ctx: Ctx) {
  if (ctx.p.status !== "active") throw new GameError("This case is closed.", 409);
}

function suspectOf(ctx: Ctx, id: string): { sdef: SuspectDef; sp: SuspectProgress } {
  const sdef = ctx.def.suspects.find((s) => s.id === id);
  const sp = ctx.p.suspects[id];
  if (!sdef || !sp) throw new GameError("Unknown suspect.", 404);
  return { sdef, sp };
}

// ───────────────────────── discovery & unlocks ─────────────────────────

export function discover(ctx: Ctx, id: string): boolean {
  const e = ev(ctx.def, id);
  if (!e || has(ctx.p, id)) return false;
  ctx.p.discovered[id] = Date.now();
  ctx.ev.discoveries.push({ id, title: e.title });
  ctx.save.stats.clues++;
  grantXp(ctx.save, ctx.ev, XP.evidence[e.importance]);
  if (e.type === "testimony") addAutoNote(ctx, `${e.source}: ${e.summary}`, "claim", id);
  refreshUnlocks(ctx);
  return true;
}

export function refreshUnlocks(ctx: Ctx) {
  for (const loc of ctx.def.locations) {
    if (ctx.p.unlocked.includes(loc.id)) continue;
    if (loc.unlock && check(ctx.p, loc.unlock)) {
      ctx.p.unlocked.push(loc.id);
      ctx.ev.unlocks.push({ id: loc.id, name: loc.name });
      addAutoNote(ctx, `New lead: ${loc.name} (${loc.district}) is now open to investigate.`, "fact", loc.id);
    }
  }
}

function learnDeduction(ctx: Ctx, id: string, from: [string, string]): boolean {
  const d = ctx.def.deductions.find((x) => x.id === id);
  if (!d || id in ctx.p.deductions) return false;
  ctx.p.deductions[id] = { at: Date.now(), from };
  ctx.save.stats.deductions++;
  if (d.contradiction) ctx.save.stats.contradictions++;
  grantXp(ctx.save, ctx.ev, XP.deduction + (d.contradiction ? XP.contradictionBonus : 0));
  ctx.ev.deductions.push({ id, title: d.title, text: d.text, contradiction: Boolean(d.contradiction) });
  addAutoNote(ctx, `${d.contradiction ? "CONTRADICTION" : "DEDUCTION"} — ${d.title}: ${d.text}`, "fact", id);
  refreshUnlocks(ctx);
  return true;
}

function addAutoNote(ctx: Ctx, text: string, tag: NoteTag, ref: string) {
  ctx.p.notes.push({ id: uid("n"), text, tag, relevant: false, createdAt: Date.now(), ref, auto: true });
}

export function currentHint(def: CaseDef, p: CaseProgress): string {
  for (const h of def.hints) {
    if (h.when && !check(p, h.when)) continue;
    if (h.unless && check(p, h.unless)) continue;
    return h.text;
  }
  return def.hints[def.hints.length - 1]?.text ?? "";
}

// ───────────────────────── exploration ─────────────────────────

export function travel(ctx: Ctx, locationId: string) {
  requireActive(ctx);
  const loc = ctx.def.locations.find((l) => l.id === locationId);
  if (!loc) throw new GameError("Unknown location.", 404);
  if (!ctx.p.unlocked.includes(locationId)) throw new GameError(`Locked: ${loc.unlockHint}`, 403);
  ctx.p.currentLocation = locationId;
  if (!ctx.p.visited.includes(locationId)) ctx.p.visited.push(locationId);
  if (!ctx.p.seenLocations.includes(locationId)) ctx.p.seenLocations.push(locationId);
}

export function hotspots(def: CaseDef, p: CaseProgress, locationId: string): HotspotView[] {
  const loc = def.locations.find((l) => l.id === locationId);
  if (!loc) throw new GameError("Unknown location.", 404);
  if (!p.unlocked.includes(locationId)) throw new GameError("Location locked.", 403);
  return loc.hotspots
    .filter((h) => check(p, h.requires))
    .map((h) => ({
      id: h.id, label: h.label, x: h.x, y: h.y, w: h.w, h: h.h, prop: h.prop,
      subtle: Boolean(h.subtle) && !p.inspected.includes(h.id) && p.mode !== "easy",
      inspected: p.inspected.includes(h.id),
      resolved: h.evidence ? has(p, h.evidence) : p.inspected.includes(h.id),
    }));
}

function findHotspot(ctx: Ctx, hotspotId: string) {
  for (const loc of ctx.def.locations) {
    const h = loc.hotspots.find((x) => x.id === hotspotId);
    if (h) {
      if (!ctx.p.unlocked.includes(loc.id)) throw new GameError("Location locked.", 403);
      if (!check(ctx.p, h.requires)) throw new GameError("Nothing there yet.", 404);
      return { loc, h };
    }
  }
  throw new GameError("Unknown object.", 404);
}

export function inspect(ctx: Ctx, hotspotId: string): InspectResult {
  requireActive(ctx);
  const { h } = findHotspot(ctx, hotspotId);
  if (!ctx.p.inspected.includes(h.id)) ctx.p.inspected.push(h.id);
  for (const f of h.setsFlags ?? []) if (!ctx.p.flags.includes(f)) ctx.p.flags.push(f);
  const e = h.evidence ? ev(ctx.def, h.evidence) : undefined;
  const description = h.description === "KANE_HINT" ? `"${currentHint(ctx.def, ctx.p)}"` : h.description;
  return {
    hotspotId: h.id,
    label: h.label,
    description,
    action: h.action,
    evidenceId: e?.id,
    evidenceTitle: e?.title,
    resolved: e ? has(ctx.p, e.id) : true,
    noteText: `${h.label}: ${description}`,
  };
}

export function act(ctx: Ctx, hotspotId: string, action: "collect" | "photograph") {
  requireActive(ctx);
  const { h } = findHotspot(ctx, hotspotId);
  if (!ctx.p.inspected.includes(h.id)) ctx.p.inspected.push(h.id);
  if (action === "photograph" && h.evidence && !ctx.p.photographed.includes(h.evidence)) ctx.p.photographed.push(h.evidence);
  if (!h.evidence) return;
  // Fixed objects are logged by photograph; portable ones must be collected.
  if (h.action === action || (action === "collect" && h.action === "photograph")) discover(ctx, h.evidence);
}

// ───────────────────────── evidence board ─────────────────────────

function boardIdValid(ctx: Ctx, id: string): boolean {
  if (id.startsWith("S:")) return ctx.def.suspects.some((s) => `S:${s.id}` === id);
  if (id.startsWith("N:")) return ctx.p.board.notes.some((n) => `N:${n.id}` === id);
  return has(ctx.p, id);
}

function matchDeduction(def: CaseDef, a: string, b: string) {
  return def.deductions.find((d) => d.pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a)));
}

export function connect(ctx: Ctx, a: string, b: string): ConnectResult {
  requireActive(ctx);
  if (a === b || !boardIdValid(ctx, a) || !boardIdValid(ctx, b)) throw new GameError("Pick two different items from your board.");
  let conn = ctx.p.board.connections.find((c) => (c.a === a && c.b === b) || (c.a === b && c.b === a));
  if (!conn) {
    conn = { id: uid("c"), a, b };
    ctx.p.board.connections.push(conn);
  }
  const d = matchDeduction(ctx.def, a, b);
  if (d) {
    learnDeduction(ctx, d.id, [a, b]);
    conn.deductionId = d.id;
    conn.label = d.title;
    conn.contradiction = Boolean(d.contradiction);
    const learned = ctx.p.deductions[d.id];
    return {
      connection: conn,
      deduction: { id: d.id, title: d.title, text: d.text, contradiction: Boolean(d.contradiction), from: learned.from, at: learned.at },
      message: d.contradiction ? `Contradiction exposed: ${d.title}` : `Deduction: ${d.title}`,
    };
  }
  return { connection: conn, message: "You pin a string between them. No firm conclusion yet — it stays on the board as a working theory." };
}

/** Saves card positions, notes and connections. Deduction labels are always re-derived server-side. */
export function saveBoard(ctx: Ctx, board: BoardState) {
  if (!board || !Array.isArray(board.items) || !Array.isArray(board.connections) || !Array.isArray(board.notes)) throw new GameError("Malformed board.");
  if (board.items.length > 200 || board.connections.length > 400 || board.notes.length > 100) throw new GameError("Board is too large.");
  const notes = board.notes.slice(0, 100).map((n) => ({
    id: String(n.id).slice(0, 40), x: Number(n.x) || 0, y: Number(n.y) || 0,
    text: String(n.text ?? "").slice(0, 400), kind: n.kind === "hypothesis" ? "hypothesis" as const : "note" as const,
  }));
  ctx.p.board.notes = notes;
  ctx.p.board.items = board.items
    .filter((i) => boardIdValid(ctx, String(i.id)))
    .map((i) => ({ id: String(i.id), x: Number(i.x) || 0, y: Number(i.y) || 0 }));
  ctx.p.board.connections = board.connections
    .filter((c) => boardIdValid(ctx, String(c.a)) && boardIdValid(ctx, String(c.b)))
    .map((c) => {
      const d = matchDeduction(ctx.def, c.a, c.b);
      const known = d && d.id in ctx.p.deductions;
      if (known) return { id: String(c.id).slice(0, 40), a: String(c.a), b: String(c.b), deductionId: d!.id, label: d!.title, contradiction: Boolean(d!.contradiction) };
      // Unconfirmed strings keep the player's own annotation (e.g. "Suspected contradiction").
      return { id: String(c.id).slice(0, 40), a: String(c.a), b: String(c.b), label: c.label ? String(c.label).slice(0, 60) : undefined, contradiction: c.contradiction ? true : undefined };
    });
}

// ───────────────────────── notebook ─────────────────────────

const TAGS: NoteTag[] = ["note", "fact", "claim", "theory"];

export function addNote(ctx: Ctx, text: string, tag: NoteTag, ref?: string) {
  const t = String(text ?? "").trim().slice(0, 2000);
  if (!t) throw new GameError("Empty note.");
  if (ctx.p.notes.length > 500) throw new GameError("Notebook is full.");
  const note = { id: uid("n"), text: t, tag: TAGS.includes(tag) ? tag : "note", relevant: false, createdAt: Date.now(), ref: ref ? String(ref).slice(0, 60) : undefined };
  ctx.p.notes.push(note);
  return note;
}

export function updateNote(ctx: Ctx, id: string, patch: { text?: string; tag?: NoteTag; relevant?: boolean }) {
  const n = ctx.p.notes.find((x) => x.id === id);
  if (!n) throw new GameError("Note not found.", 404);
  if (patch.text !== undefined && !n.auto) n.text = String(patch.text).slice(0, 2000);
  if (patch.tag && TAGS.includes(patch.tag)) n.tag = patch.tag;
  if (patch.relevant !== undefined) n.relevant = Boolean(patch.relevant);
}

export function deleteNote(ctx: Ctx, id: string) {
  ctx.p.notes = ctx.p.notes.filter((n) => n.id !== id);
}

// ───────────────────────── interrogation ─────────────────────────

export interface TalkInput { topicId?: string; text?: string; evidenceId?: string; }

function applyNode(ctx: Ctx, sdef: SuspectDef, sp: SuspectProgress, node: ResponseNode, key: string): boolean {
  if (sp.usedNodes.includes(key)) return false;
  sp.usedNodes.push(key);
  sp.stress = clamp(sp.stress + (node.stress ?? 0));
  sp.trust = clamp(sp.trust + (node.trust ?? 0));
  for (const r of node.reveals ?? []) {
    if (sp.revealed.includes(r)) continue;
    sp.revealed.push(r);
    if (!r.startsWith("rapport")) {
      grantXp(ctx.save, ctx.ev, XP.revelation);
      ctx.ev.revelations.push(`${sdef.name} revealed something new.`);
    }
  }
  for (const g of node.grants ?? []) discover(ctx, g);
  for (const f of node.setsFlags ?? []) if (!ctx.p.flags.includes(f)) ctx.p.flags.push(f);
  for (const dId of node.deductions ?? []) {
    const d = ctx.def.deductions.find((x) => x.id === dId);
    const pair = d?.pairs.find(([a, b]) => has(ctx.p, a) && has(ctx.p, b));
    if (d && pair) learnDeduction(ctx, d.id, pair);
  }
  return true;
}

/** Collects lines this suspect is currently willing to say, for the AI layer. */
function sayableLines(ctx: Ctx, sdef: SuspectDef, sp: SuspectProgress): string[] {
  const lines = [sdef.greeting, `Your stated alibi: ${sdef.alibi}`];
  for (const t of availableTopics(sdef, ctx.p)) {
    const pick = pickNode(t.nodes, ctx.p, sp);
    if (pick && !pick.node.reveals?.some((r) => !r.startsWith("rapport"))) lines.push(pick.node.text);
  }
  for (const m of sp.history) if (m.role === "suspect") lines.push(m.text);
  return [...new Set(lines)].slice(-40);
}

export async function interrogate(ctx: Ctx, suspectId: string, input: TalkInput): Promise<InterrogateResult> {
  requireActive(ctx);
  const { sdef, sp } = suspectOf(ctx, suspectId);
  if (!sp.interviewed) { sp.interviewed = true; ctx.save.stats.interviews++; }

  let playerText = "";
  let node: ResponseNode | null = null;
  let reply = "";
  let mood: Mood = sp.mood;
  let evidenceId: string | undefined;
  let cited: string | undefined;
  let freeText = false;
  let hint: string | undefined;

  /** The suspect's reaction to a piece of evidence, whether shown or mentioned. */
  const react = (e: EvidenceDef) => {
    evidenceId = e.id;
    sp.lastTopic = `ev:${e.id}`;
    const pick = pickNode(sdef.reactions[e.id] ?? [], ctx.p, sp);
    if (pick) {
      node = pick.node;
      applyNode(ctx, sdef, sp, pick.node, `ev:${e.id}:${pick.index}`);
      reply = pick.node.text;
      mood = pick.node.mood;
    } else {
      const repeated = sp.presented.includes(e.id);
      reply = sdef.defaultReaction[sp.presented.length % sdef.defaultReaction.length];
      if (repeated) { sp.trust = clamp(sp.trust - 2); mood = "irritated"; reply = "You've already shown me that. It still means nothing to me."; }
    }
    if (!sp.presented.includes(e.id)) sp.presented.push(e.id);
  };

  const askTopic = (t: TopicDef) => {
    if (!sp.asked.includes(t.id)) sp.asked.push(t.id);
    sp.lastTopic = `t:${t.id}`;
    const pick = pickNode(t.nodes, ctx.p, sp);
    if (!pick) { reply = sdef.unknown[0]; return; }
    node = pick.node;
    const fresh = applyNode(ctx, sdef, sp, pick.node, `t:${t.id}:${pick.index}`);
    reply = fresh || !t.repeat ? pick.node.text : t.repeat;
    mood = pick.node.mood;
  };

  if (input.evidenceId) {
    const e = ev(ctx.def, input.evidenceId);
    if (!e || !has(ctx.p, e.id)) throw new GameError("You haven't found that evidence.");
    playerText = `Presents evidence: ${e.title}`;
    react(e);
  } else {
    let intent: Intent;
    if (input.topicId) {
      const topic = availableTopics(sdef, ctx.p).find((t) => t.id === input.topicId);
      if (!topic) throw new GameError("You can't ask that yet.");
      intent = { kind: "topic", topic, tone: "neutral" };
      playerText = topic.label;
    } else {
      playerText = String(input.text ?? "").trim().slice(0, 600);
      if (!playerText) throw new GameError("Say something.");
      freeText = true;
      intent = detectIntent(sdef, ctx.p, playerText);
    }

    // Evidence mentioned in the player's own words counts as confronting them with it.
    const mentioned = freeText && !["deflect", "accuse", "greet", "bye", "followup"].includes(intent.kind)
      ? findEvidenceMention(playerText, Object.keys(ctx.p.discovered).filter((id) => sdef.reactions[id]).map((id) => ev(ctx.def, id)!))
      : null;

    if (mentioned) {
      cited = mentioned;
      react(ev(ctx.def, mentioned)!);
    } else if (intent.kind === "topic") {
      askTopic(intent.topic);
    } else if (intent.kind === "followup") {
      const last = sp.lastTopic;
      if (last?.startsWith("ev:")) {
        const e = ev(ctx.def, last.slice(3))!;
        const pick = pickNode(sdef.reactions[e.id] ?? [], ctx.p, sp);
        if (pick && !sp.usedNodes.includes(`ev:${e.id}:${pick.index}`)) react(e);
        else { reply = pressed(sp.history.length); mood = sp.mood; }
      } else if (last?.startsWith("t:")) {
        const t = availableTopics(sdef, ctx.p).find((x) => `t:${x.id}` === last);
        const pick = t && pickNode(t.nodes, ctx.p, sp);
        if (t && pick && !sp.usedNodes.includes(`t:${t.id}:${pick.index}`)) askTopic(t);
        else { reply = pressed(sp.history.length); mood = sp.mood; }
      } else {
        reply = sdef.unknown[sp.history.length % sdef.unknown.length];
      }
      // Pressing a point raises the temperature once per subject, not every time.
      if (last && !node && !sp.usedNodes.includes(`fu:${last}`)) { sp.usedNodes.push(`fu:${last}`); sp.stress = clamp(sp.stress + 3); }
    } else if (intent.kind === "greet") {
      reply = sp.history.length === 0 ? sdef.greeting : "Detective.";
    } else if (intent.kind === "about") {
      reply = sdef.about ?? `You've read my file, detective. ${sdef.profession}. That's who I am.`;
    } else if (intent.kind === "bye") {
      reply = goodbye(sp.history.length);
    } else if (intent.kind === "deflect") {
      reply = sdef.deflection;
      mood = "irritated";
    } else if (intent.kind === "accuse") {
      reply = denial(sp.history.length);
      sp.stress = clamp(sp.stress + 5);
      sp.trust = clamp(sp.trust - 5);
      mood = "defensive";
    } else {
      reply = sdef.unknown[sp.history.length % sdef.unknown.length];
      const options = availableTopics(sdef, ctx.p).sort((a, b) => Number(sp.asked.includes(a.id)) - Number(sp.asked.includes(b.id))).slice(0, 2);
      if (options.length) hint = `Try asking about something they can answer — for example: "${options.map((o) => o.label).join('" or "')}" You can also name evidence you've found.`;
    }

    // The player's approach matters, but only a little, and empathy can't be farmed.
    if (intent.tone === "aggressive") { sp.stress = clamp(sp.stress + 5); sp.trust = clamp(sp.trust - 3); }
    if (intent.tone === "empathetic") {
      const used = sp.usedNodes.filter((k) => k.startsWith("tone:")).length;
      if (used < 3) { sp.usedNodes.push(`tone:${used}`); sp.trust = clamp(sp.trust + 2); }
    }
  }

  let engine: "authored" | "ai" = "authored";
  if (freeText) {
    const voiced = await voiceTurn({
      suspect: sdef, progress: sp, playerText, budgetKey: ctx.save.id,
      beat: node ? { text: reply, mood } : null,
      sayable: sayableLines(ctx, sdef, sp),
    });
    if (voiced) { reply = voiced.reply; mood = voiced.mood; engine = "ai"; hint = undefined; }
  }

  sp.mood = mood;
  const now = Date.now();
  sp.history.push({ role: "player", text: playerText, ts: now, evidenceId });
  sp.history.push({ role: "suspect", text: reply, mood, ts: now + 1 });
  if (hint) sp.history.push({ role: "system", text: hint, ts: now + 2 });
  if (sp.history.length > 400) sp.history.splice(0, sp.history.length - 400);
  return { reply, mood, stress: sp.stress, trust: sp.trust, engine, citedEvidence: cited };
}

// ───────────────────────── accusation ─────────────────────────

export interface AccusePayload { suspectId: string; motive: string; method: string; sequence: string; evidence: string[]; }

export function accuse(ctx: Ctx, a: AccusePayload): AccuseResult {
  requireActive(ctx);
  const { def, p, save } = ctx;
  if (!def.suspects.some((s) => s.id === a.suspectId)) throw new GameError("Choose a suspect.");
  const opt = def.accusation;
  if (!opt.motives.some((m) => m.id === a.motive) || !opt.methods.some((m) => m.id === a.method) || !opt.sequences.some((s) => s.id === a.sequence)) {
    throw new GameError("Complete every part of the accusation.");
  }
  const evidence = [...new Set(a.evidence ?? [])];
  if (evidence.length < MIN_EVIDENCE) throw new GameError(`Support your accusation with at least ${MIN_EVIDENCE} pieces of evidence.`);
  if (!evidence.every((e) => has(p, e))) throw new GameError("You can only cite evidence you have found.");

  const sol = def.solution;
  const support = sol.support;
  const relevant = evidence.filter((e) => support.opportunity.includes(e) || support.means.includes(e) || support.motive.includes(e));
  const categories = (["opportunity", "means", "motive"] as const).filter((k) => evidence.some((e) => support[k].includes(e)));
  const keyCount = evidence.filter((e) => ev(def, e)?.importance === "key").length;
  const suspectOk = a.suspectId === sol.culprit;
  const motiveOk = a.motive === sol.motive;
  const methodOk = a.method === sol.method;
  const sequenceOk = a.sequence === sol.sequence;
  const name = def.suspects.find((s) => s.id === a.suspectId)!.name;

  const easy = p.mode === "easy";
  let verdict: Verdict;
  if (easy ? relevant.length < 1 && keyCount < 1 : keyCount < 2 || (suspectOk && (relevant.length < 2 || categories.length < 2))) verdict = "insufficient";
  else if (!suspectOk) verdict = "incorrect";
  else if (motiveOk && methodOk && sequenceOk) verdict = "solved";
  else verdict = "incomplete";

  const firstTry = p.accusations.length === 0;
  p.accusations.push({ at: Date.now(), suspectId: a.suspectId, motive: a.motive, method: a.method, sequence: a.sequence, evidence, verdict });

  const feedback: string[] = [];
  let title = "";
  let summary = "";
  let caseClosed = false;

  if (verdict === "solved") {
    title = "Case Solved";
    summary = `The District Attorney reviews your file and nods slowly. ${name} is charged with the murder of ${def.victim.name}. Every piece fits.`;
    p.status = "solved";
    caseClosed = true;
    save.stats.casesSolved++;
    save.stats.casesClosed++;
    grantXp(save, ctx.ev, XP.solved + XP.solvedPerSupport * Math.min(relevant.length, 6) + (firstTry ? XP.firstTryBonus : 0));
    unlockAchievement(save, ctx.ev, "first_case");
    if (!p.accusations.some((x) => x.verdict === "incorrect")) unlockAchievement(save, ctx.ev, "no_false");
    if (firstTry && categories.length === 3) unlockAchievement(save, ctx.ev, "perfect_deduction");
  } else if (verdict === "incomplete" && easy) {
    // Easy mode: say exactly which parts are wrong and let the player try again.
    title = "Right Suspect — Almost There";
    summary = `You've got the right person. The DA just needs the rest of the story to match the evidence.`;
    feedback.push(`Motive: ${motiveOk ? "correct ✔" : "not right yet ✘"}`);
    feedback.push(`Method: ${methodOk ? "correct ✔" : "not right yet ✘"}`);
    feedback.push(`Sequence of events: ${sequenceOk ? "correct ✔" : "not right yet ✘"}`);
    feedback.push("Fix the parts marked ✘ and accuse again.");
  } else if (verdict === "incomplete") {
    title = "Correct Suspect, Incomplete Reasoning";
    summary = `${name} is charged — but the DA is uneasy. Parts of your theory don't match the evidence, and the defence will exploit every gap.`;
    if (!motiveOk) feedback.push("The motive you described doesn't match what the evidence shows.");
    if (!methodOk) feedback.push("The method you described isn't consistent with the forensic findings.");
    if (!sequenceOk) feedback.push("Your sequence of events conflicts with the established timeline.");
    p.status = "closed";
    caseClosed = true;
    save.stats.casesClosed++;
    grantXp(save, ctx.ev, XP.incomplete + 10 * relevant.length);
  } else {
    if (verdict === "incorrect") {
      save.stats.falseAccusations++;
      title = "Incorrect Accusation";
      summary = `The DA reads your file twice, then slides it back across the desk. The case against ${name} doesn't hold: the evidence doesn't put them in that office when it mattered.`;
      feedback.push("Revisit the alibis. Which of them are actually backed by hard evidence?");
      feedback.push("Remember that people lie for reasons other than murder.");
      if (easy) feedback.push(`${name} has an alibi the evidence supports. Look for the suspect whose story the evidence breaks.`);
    } else {
      title = "Insufficient Evidence";
      summary = "The DA won't take this to a jury. Your evidence doesn't establish enough of the case.";
      feedback.push("Cite hard evidence, not just impressions — key evidence carries the most weight.");
      feedback.push("A strong file shows opportunity, plus means or motive.");
    }
    const remaining = easy ? Infinity : MAX_ACCUSATIONS - p.accusations.length;
    if (easy) {
      feedback.push("Easy mode: you can accuse as many times as you like.");
    } else if (remaining <= 0) {
      p.status = "failed";
      caseClosed = true;
      save.stats.casesClosed++;
      summary += " You've exhausted the DA's patience. The case is taken off your desk.";
    } else {
      feedback.push(`The investigation remains open. ${remaining} accusation${remaining === 1 ? "" : "s"} left before the case is taken from you.`);
    }
  }
  p.verdict = verdict;
  checkAchievements(save, def, p, ctx.ev);
  return {
    verdict, title, summary, feedback, caseClosed,
    score: {
      suspect: suspectOk,
      motive: (caseClosed || easy) && suspectOk ? motiveOk : null,
      method: (caseClosed || easy) && suspectOk ? methodOk : null,
      sequence: (caseClosed || easy) && suspectOk ? sequenceOk : null,
      evidenceStrength: Math.min(1, relevant.length / 6),
    },
  };
}

export function abandon(ctx: Ctx) {
  requireActive(ctx);
  ctx.p.status = "abandoned";
  ctx.save.stats.casesClosed++;
}

// ───────────────────────── easy mode & clues ─────────────────────────

/** Easy mode: any deduction whose evidence has been found is made automatically. */
export function autoDeduce(ctx: Ctx) {
  if (ctx.p.mode !== "easy" || ctx.p.status !== "active") return;
  for (let changed = true; changed;) {
    changed = false;
    for (const d of ctx.def.deductions) {
      if (d.id in ctx.p.deductions) continue;
      const pair = d.pairs.find(([a, b]) => has(ctx.p, a) && has(ctx.p, b));
      if (pair && learnDeduction(ctx, d.id, pair)) changed = true;
    }
  }
}

export function setMode(ctx: Ctx, mode: "easy" | "normal") {
  requireActive(ctx);
  ctx.p.mode = mode === "easy" ? "easy" : "normal";
  autoDeduce(ctx);
}

interface Clue { target: string; vague: string; specific: string; }

/** Finds the most useful next step for a stuck player. */
function findClue(ctx: Ctx): Clue {
  const { def, p } = ctx;
  const first = (n: string) => n.split(" ")[0];

  // 1. Evidence still lying around in places you can reach (current location first).
  const locs = [...def.locations].sort((a, b) => Number(b.id === p.currentLocation) - Number(a.id === p.currentLocation));
  for (const loc of locs) {
    if (!p.unlocked.includes(loc.id)) continue;
    const h = loc.hotspots.find((x) => x.evidence && !has(p, x.evidence) && check(p, x.requires));
    if (h) return {
      target: `loc:${h.id}`,
      vague: `There's still something to find at ${loc.name}.`,
      specific: `Go to ${loc.name} and examine the ${h.label.charAt(0).toLowerCase() + h.label.slice(1)}${h.subtle && p.mode !== "easy" ? " — switch on Search closely to spot it" : ""}.`,
    };
  }

  // 2. Deductions that open up new leads.
  const gating = new Set(def.locations.flatMap((l) => [...(l.unlock?.deductions ?? []), ...(l.unlock?.anyDeductions ?? []), ...l.hotspots.flatMap((h) => [...(h.requires?.deductions ?? []), ...(h.requires?.anyDeductions ?? [])])]));
  const linkable = def.deductions.filter((d) => !(d.id in p.deductions) && d.pairs.some(([a, b]) => has(p, a) && has(p, b)));
  const linkClue = (d: DeductionDef): Clue => {
    const [a, b] = d.pairs.find(([x, y]) => has(p, x) && has(p, y))!;
    return { target: `ded:${d.id}`, vague: "Two things you've found belong together. Try connecting them on the evidence board.", specific: `On the evidence board, link ‘${ev(def, a)!.title}’ with ‘${ev(def, b)!.title}’.` };
  };
  const urgent = linkable.find((d) => gating.has(d.id));
  if (urgent) return linkClue(urgent);

  // 3. Questions that will get someone talking.
  const useful = (n: ResponseNode) => Boolean(n.grants?.length || n.reveals?.some((r) => !r.startsWith("rapport")));
  for (const s of def.suspects) {
    const sp = p.suspects[s.id];
    for (const t of availableTopics(s, p)) {
      const pick = pickNode(t.nodes, p, sp);
      if (pick && useful(pick.node) && !sp.usedNodes.includes(`t:${t.id}:${pick.index}`)) {
        return { target: `topic:${s.id}:${t.id}`, vague: `${s.name} hasn't told you everything yet. Question ${first(s.name)} again.`, specific: `Ask ${s.name}: ‘${t.label}’` };
      }
    }
  }

  // 4. Evidence that will make someone crack (possibly after more than one try).
  for (const s of def.suspects) {
    const sp = p.suspects[s.id];
    for (const id of Object.keys(p.discovered)) {
      const nodes = s.reactions[id];
      if (!nodes) continue;
      const pick = pickNode(nodes, p, sp);
      if (!pick || sp.usedNodes.includes(`ev:${id}:${pick.index}`) && !useful(pick.node)) continue;
      const fresh = !sp.usedNodes.includes(`ev:${id}:${pick.index}`);
      const pressure = !useful(pick.node) && (pick.node.stress ?? 0) > 0 && nodes.some((n) => n.reveals?.some((r) => !r.startsWith("rapport") && !sp.revealed.includes(r)));
      if (fresh && (useful(pick.node) || pressure)) {
        return { target: `ev:${s.id}:${id}`, vague: `Something you've found could make ${first(s.name)} talk.`, specific: `Show ${s.name} the ${ev(def, id)!.title}${pressure ? " — and keep pressing if they deny it" : ""}.` };
      }
    }
  }

  // 5. Any other connections on the board.
  if (linkable.length) return linkClue(linkable[0]);

  // 6. Locked places.
  const locked = def.locations.find((l) => !p.unlocked.includes(l.id));
  if (locked) return { target: `lock:${locked.id}`, vague: `There's a lead you haven't opened yet. ${locked.unlockHint}`, specific: `To open the next location: ${locked.unlockHint}` };

  return {
    target: "accuse",
    vague: "You've found what there is to find. Who had the opportunity, the means and the motive? Time to make your accusation.",
    specific: "Look at your contradictions: whose lies hide the crime, and whose hide something else? Then make your accusation.",
  };
}

export function askForClue(ctx: Ctx): { text: string; specific: boolean } {
  requireActive(ctx);
  const c = findClue(ctx);
  // Asking twice about the same thing (or playing in easy mode) gets the precise version.
  const specific = ctx.p.mode === "easy" || ctx.p.lastClue === c.target;
  ctx.p.lastClue = c.target;
  ctx.p.hintsUsed = (ctx.p.hintsUsed ?? 0) + 1;
  return { text: specific ? c.specific : `${c.vague} (Ask again for a more exact clue.)`, specific };
}
