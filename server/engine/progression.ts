/** Detective ranks, experience and achievements. */
import type { Achievement, GameEvents, Profile } from "../../shared/api.ts";
import type { CaseDef } from "../cases/types.ts";
import type { CaseProgress, PlayerSave } from "./state.ts";

export const RANKS: { title: string; xp: number }[] = [
  { title: "Rookie Detective", xp: 0 },
  { title: "Investigator", xp: 300 },
  { title: "Senior Detective", xp: 900 },
  { title: "Inspector", xp: 1800 },
  { title: "Chief Inspector", xp: 3000 },
  { title: "Master Detective", xp: 4800 },
  { title: "Legendary Detective", xp: 7500 },
];

/** Experience is only awarded once per discovery; repeating actions earns nothing. */
export const XP = {
  evidence: { key: 15, supporting: 10, minor: 5 },
  deduction: 30,
  contradictionBonus: 20,
  revelation: 15,
  solved: 400,
  solvedPerSupport: 25,
  firstTryBonus: 100,
  incomplete: 150,
};

export const ACHIEVEMENTS: Omit<Achievement, "unlockedAt">[] = [
  { id: "first_deduction", title: "Elementary", description: "Make your first valid deduction on the evidence board." },
  { id: "locked_room", title: "The Locked Room", description: "Explain how a 'locked' crime scene was really sealed." },
  { id: "contradiction_hunter", title: "Contradiction Hunter", description: "Expose 8 contradictions in a single case." },
  { id: "sharp_eye", title: "Sharp Eye", description: "Discover every piece of physical, documentary and digital evidence in a case." },
  { id: "master_interrogator", title: "Master Interrogator", description: "Draw every major admission out of every suspect in a case." },
  { id: "first_case", title: "First Case Solved", description: "Close your first case with a correct accusation." },
  { id: "perfect_deduction", title: "Perfect Deduction", description: "Solve a case on the first accusation with every element correct and evidence covering opportunity, means and motive." },
  { id: "no_false", title: "No False Accusations", description: "Solve a case without ever accusing an innocent person." },
  { id: "legendary", title: "Legendary Investigator", description: "Reach the rank of Legendary Detective." },
];

export function rankIndex(xp: number): number {
  let i = 0;
  RANKS.forEach((r, idx) => { if (xp >= r.xp) i = idx; });
  return i;
}

export function emptyEvents(): GameEvents {
  return { discoveries: [], unlocks: [], deductions: [], revelations: [], xp: 0, achievements: [] };
}

export function grantXp(save: PlayerSave, ev: GameEvents, amount: number) {
  if (amount <= 0) return;
  const before = rankIndex(save.xp);
  save.xp += amount;
  ev.xp += amount;
  const after = rankIndex(save.xp);
  if (after > before) ev.rankUp = RANKS[after].title;
}

export function unlockAchievement(save: PlayerSave, ev: GameEvents, id: string) {
  if (save.achievements[id]) return;
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return;
  save.achievements[id] = Date.now();
  ev.achievements.push({ id, title: a.title });
}

/** Re-evaluates achievements that depend on case progress. */
export function checkAchievements(save: PlayerSave, def: CaseDef, p: CaseProgress, ev: GameEvents) {
  const deds = Object.keys(p.deductions);
  if (deds.length > 0) unlockAchievement(save, ev, "first_deduction");
  if (deds.includes("locked_room")) unlockAchievement(save, ev, "locked_room");
  const contradictions = def.deductions.filter((d) => d.contradiction && deds.includes(d.id)).length;
  if (contradictions >= 8) unlockAchievement(save, ev, "contradiction_hunter");
  const fieldEvidence = def.evidence.filter((e) => e.type !== "testimony" && def.locations.some((l) => l.hotspots.some((h) => h.evidence === e.id)));
  if (fieldEvidence.length > 0 && fieldEvidence.every((e) => e.id in p.discovered)) unlockAchievement(save, ev, "sharp_eye");
  const allTalked = def.suspects.every((s) => s.majorReveals.every((r) => p.suspects[s.id]?.revealed.includes(r)));
  if (allTalked) unlockAchievement(save, ev, "master_interrogator");
  if (rankIndex(save.xp) === RANKS.length - 1) unlockAchievement(save, ev, "legendary");
}

export function profileView(save: PlayerSave): Profile {
  const idx = rankIndex(save.xp);
  return {
    id: save.id,
    displayName: save.displayName,
    xp: save.xp,
    rank: RANKS[idx].title,
    rankIndex: idx,
    rankFloor: RANKS[idx].xp,
    nextRank: RANKS[idx + 1] ? { title: RANKS[idx + 1].title, xp: RANKS[idx + 1].xp } : undefined,
    achievements: ACHIEVEMENTS.map((a) => ({ ...a, unlockedAt: save.achievements[a.id] })),
    stats: save.stats,
    createdAt: save.createdAt,
  };
}
