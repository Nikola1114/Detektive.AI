/** Persistent per-player state and helpers for evaluating case conditions. */
import type { BoardState, ChatMessage, Mood, NotebookNote, Verdict } from "../../shared/api.ts";
import type { CaseDef, Cond, TalkCond } from "../cases/types.ts";

export interface SuspectProgress {
  stress: number;
  trust: number;
  mood: Mood;
  revealed: string[];
  usedNodes: string[];
  asked: string[];
  presented: string[];
  history: ChatMessage[];
  interviewed: boolean;
  /** "t:<topic>" or "ev:<evidence>" of the last exchange, for follow-up questions like "why?". */
  lastTopic?: string;
}

export interface AccusationEntry {
  at: number;
  suspectId: string;
  motive: string;
  method: string;
  sequence: string;
  evidence: string[];
  verdict: Verdict;
}

export interface CaseProgress {
  caseId: string;
  status: "active" | "solved" | "closed" | "failed" | "abandoned";
  startedAt: number;
  updatedAt: number;
  currentLocation: string;
  visited: string[];
  unlocked: string[];
  seenLocations: string[];
  discovered: Record<string, number>;
  photographed: string[];
  inspected: string[];
  deductions: Record<string, { at: number; from: [string, string] }>;
  flags: string[];
  suspects: Record<string, SuspectProgress>;
  board: BoardState;
  notes: NotebookNote[];
  accusations: AccusationEntry[];
  verdict?: Verdict;
}

export interface PlayerStats {
  casesSolved: number;
  casesClosed: number;
  falseAccusations: number;
  clues: number;
  deductions: number;
  contradictions: number;
  interviews: number;
}

export interface PlayerSave {
  id: string;
  displayName: string;
  createdAt: number;
  xp: number;
  achievements: Record<string, number>;
  stats: PlayerStats;
  cases: Record<string, CaseProgress>;
  generatedCases: string[];
}

export function newPlayer(id: string): PlayerSave {
  return {
    id,
    displayName: "Detective",
    createdAt: Date.now(),
    xp: 0,
    achievements: {},
    stats: { casesSolved: 0, casesClosed: 0, falseAccusations: 0, clues: 0, deductions: 0, contradictions: 0, interviews: 0 },
    cases: {},
    generatedCases: [],
  };
}

export function newCaseProgress(def: CaseDef): CaseProgress {
  const now = Date.now();
  const suspects: Record<string, SuspectProgress> = {};
  for (const s of def.suspects) {
    suspects[s.id] = {
      stress: s.initial.stress, trust: s.initial.trust, mood: s.initial.mood,
      revealed: [], usedNodes: [], asked: [], presented: [], history: [], interviewed: false,
    };
  }
  return {
    caseId: def.id,
    status: "active",
    startedAt: now,
    updatedAt: now,
    currentLocation: def.startLocations[0],
    visited: [],
    unlocked: [...def.startLocations],
    seenLocations: [...def.startLocations],
    discovered: {},
    photographed: [],
    inspected: [],
    deductions: {},
    flags: [],
    suspects,
    board: { items: [], connections: [], notes: [] },
    notes: [],
    accusations: [],
  };
}

export function has(p: CaseProgress, evidenceId: string): boolean {
  return evidenceId in p.discovered;
}

export function check(p: CaseProgress, c: Cond | undefined): boolean {
  if (!c) return true;
  if (c.evidence && !c.evidence.every((e) => has(p, e))) return false;
  if (c.anyEvidence && !c.anyEvidence.some((e) => has(p, e))) return false;
  if (c.deductions && !c.deductions.every((d) => d in p.deductions)) return false;
  if (c.anyDeductions && !c.anyDeductions.some((d) => d in p.deductions)) return false;
  if (c.flags && !c.flags.every((f) => p.flags.includes(f))) return false;
  if (c.notFlags && c.notFlags.some((f) => p.flags.includes(f))) return false;
  return true;
}

export function checkTalk(p: CaseProgress, s: SuspectProgress, c: TalkCond | undefined): boolean {
  if (!c) return true;
  if (!check(p, c)) return false;
  if (c.revealed && !c.revealed.every((r) => s.revealed.includes(r))) return false;
  if (c.notRevealed && c.notRevealed.some((r) => s.revealed.includes(r))) return false;
  if (c.minTrust !== undefined && s.trust < c.minTrust) return false;
  if (c.minStress !== undefined && s.stress < c.minStress) return false;
  return true;
}

export const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function uid(prefix = ""): string {
  return prefix + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
