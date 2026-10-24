/**
 * Shapes exchanged between the game server and the browser client.
 *
 * This file must only ever contain *types*. Canonical case data (solutions,
 * suspect secrets, deduction rules) lives exclusively in /server and is never
 * imported by client code.
 */

export type EvidenceType = "physical" | "document" | "digital" | "forensic" | "testimony";
/** How reliable an item is: hard evidence, someone's word, or the player's own idea. */
export type Reliability = "confirmed" | "testimony";
export type Mood = "calm" | "cooperative" | "guarded" | "nervous" | "defensive" | "irritated" | "shaken" | "silent";
export type CaseStatus = "active" | "solved" | "closed" | "failed" | "abandoned";
export type Verdict = "solved" | "incomplete" | "incorrect" | "insufficient";
export type SceneKind = "office" | "police" | "security" | "bar" | "penthouse" | "newsroom" | "flat" | "hotel" | "museum" | "manor" | "shop";
export type NoteTag = "note" | "fact" | "claim" | "theory";

/** How a suspect's lines are read aloud by the browser's speech engine. */
export interface VoiceProfile {
  gender: "female" | "male";
  pitch: number; // 0.5–1.5
  rate: number; // 0.7–1.3
  seed: number; // picks a distinct voice among good candidates
}

export interface PortraitSpec {
  skin: string;
  hair: "bob" | "short" | "slick" | "bald" | "long" | "bun" | "messy" | "receding" | "wavy";
  hairColor: string;
  outfit: "suit" | "turtleneck" | "blouse" | "uniform" | "coat" | "jacket" | "dress" | "sweater";
  outfitColor: string;
  glasses?: boolean;
  beard?: "stubble" | "full" | "moustache";
  earrings?: boolean;
  age?: "young" | "mid" | "older";
  build?: "slim" | "broad";
}

export interface TimelineEntry {
  time: string; // "HH:MM"
  text: string;
  kind: Reliability | "theory";
  source: string; // evidence id or note id
  sourceTitle: string;
}

export interface EvidenceView {
  id: string;
  title: string;
  type: EvidenceType;
  reliability: Reliability;
  summary: string;
  detail: string;
  locationName: string;
  icon: string;
  importance: "key" | "supporting" | "minor";
  discoveredAt: number;
  photographed: boolean;
}

export interface HotspotView {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number; // percentages of the scene
  prop: string;
  subtle: boolean;
  inspected: boolean;
  resolved: boolean; // its evidence (if any) has been collected
}

export interface LocationView {
  id: string;
  name: string;
  district: string;
  scene: SceneKind;
  unlocked: boolean;
  visited: boolean;
  description: string; // empty while locked
  unlockHint: string;
  mapPos: { x: number; y: number };
  cluesFound: number;
  cluesTotal: number;
  isNew: boolean;
}

export interface ChatMessage {
  role: "player" | "suspect" | "system";
  text: string;
  mood?: Mood;
  evidenceId?: string;
  ts: number;
}

export interface SuspectView {
  id: string;
  name: string;
  age: number;
  height: string;
  profession: string;
  relation: string;
  personality: string;
  bio: string;
  motive: string;
  alibi: string;
  portrait: PortraitSpec;
  voice: VoiceProfile;
  greeting: string;
  mood: Mood;
  stress: number;
  trust: number;
  interviewed: boolean;
  history: ChatMessage[];
  suggestions: { id: string; label: string; asked: boolean }[];
}

export interface DeductionView {
  id: string;
  title: string;
  text: string;
  contradiction: boolean;
  from: [string, string];
  at: number;
}

export interface BoardItem { id: string; x: number; y: number; }
export interface BoardConnection { id: string; a: string; b: string; deductionId?: string; label?: string; contradiction?: boolean; }
export interface BoardNote { id: string; x: number; y: number; text: string; kind: "note" | "hypothesis"; }
export interface BoardState { items: BoardItem[]; connections: BoardConnection[]; notes: BoardNote[]; }

export interface NotebookNote {
  id: string;
  text: string;
  tag: NoteTag;
  relevant: boolean;
  createdAt: number;
  ref?: string;
  auto?: boolean;
}

export interface AccusationOptions {
  motives: { id: string; label: string }[];
  methods: { id: string; label: string }[];
  sequences: { id: string; label: string }[];
  minEvidence: number;
  attemptsLeft: number;
}

export interface AccusationRecord { at: number; suspectId: string; verdict: Verdict; }

export interface CaseState {
  caseId: string;
  title: string;
  subtitle: string;
  setting: string;
  date: string;
  difficulty: string;
  synopsis: string;
  briefing: string[];
  victim: { name: string; age: number; description: string };
  status: CaseStatus;
  currentLocation: string;
  locations: LocationView[];
  evidence: EvidenceView[];
  evidenceTotal: number;
  /** Field evidence found so far (comparable with evidenceTotal). */
  cluesFound: number;
  suspects: SuspectView[];
  deductions: DeductionView[];
  deductionTotal: number;
  contradictionsFound: number;
  board: BoardState;
  notes: NotebookNote[];
  timeline: TimelineEntry[];
  accusation: AccusationOptions;
  accusations: AccusationRecord[];
  hint: string;
  startedAt: number;
  updatedAt: number;
}

export interface GameEvents {
  discoveries: { id: string; title: string }[];
  unlocks: { id: string; name: string }[];
  deductions: { id: string; title: string; text: string; contradiction: boolean }[];
  revelations: string[];
  xp: number;
  achievements: { id: string; title: string }[];
  rankUp?: string;
}

export interface InspectResult {
  hotspotId: string;
  label: string;
  description: string;
  action: "collect" | "photograph" | "none";
  evidenceId?: string;
  evidenceTitle?: string;
  resolved: boolean;
  noteText: string;
}

export interface ConnectResult {
  connection: BoardConnection;
  deduction?: DeductionView;
  message: string;
}

export interface InterrogateResult {
  reply: string;
  mood: Mood;
  stress: number;
  trust: number;
  engine: "authored" | "ai";
  /** Set when the player's own words cited a piece of evidence. */
  citedEvidence?: string;
}

export interface ResolutionScene { heading: string; time?: string; text: string; }

export interface AccuseResult {
  verdict: Verdict;
  title: string;
  summary: string;
  feedback: string[];
  caseClosed: boolean;
  score: { suspect: boolean; motive: boolean | null; method: boolean | null; sequence: boolean | null; evidenceStrength: number };
}

export interface Resolution {
  caseId: string;
  title: string;
  status: CaseStatus;
  culprit: { id: string; name: string };
  verdict?: Verdict;
  scenes: ResolutionScene[];
  truths: { suspect: string; text: string }[];
  stats: { cluesFound: number; cluesTotal: number; deductions: number; deductionTotal: number; contradictions: number; accusations: number; minutes: number };
}

export interface Achievement { id: string; title: string; description: string; unlockedAt?: number; }

export interface Profile {
  id: string;
  displayName: string;
  xp: number;
  rank: string;
  rankIndex: number;
  nextRank?: { title: string; xp: number };
  rankFloor: number;
  achievements: Achievement[];
  stats: { casesSolved: number; casesClosed: number; falseAccusations: number; clues: number; deductions: number; contradictions: number; interviews: number };
  createdAt: number;
}

export interface CaseSummary {
  id: string;
  title: string;
  subtitle: string;
  synopsis: string;
  difficulty: string;
  setting: string;
  generated: boolean;
  status: CaseStatus | "new";
  progress: number; // 0..1 clue progress
}

export interface ServerInfo {
  aiDialogue: boolean;
  aiModel?: string;
  storage: "file" | "supabase";
}
