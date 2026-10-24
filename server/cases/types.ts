/**
 * Authoring schema for a case. Every case — hand-written or generated — is a
 * CaseDef. These objects contain the canonical solution and every secret, so
 * they must never be serialised to the client wholesale; the engine projects
 * a sanitised view (see server/engine/view.ts).
 */
import type { EvidenceType, Mood, PortraitSpec, ResolutionScene, SceneKind, Shot, VoiceProfile } from "../../shared/api.ts";

/** A condition over investigation progress. Every listed clause must hold. */
export interface Cond {
  evidence?: string[]; // all discovered
  anyEvidence?: string[]; // at least one discovered
  deductions?: string[];
  anyDeductions?: string[];
  flags?: string[];
  notFlags?: string[];
  interviewed?: string[]; // suspects questioned at least once
  visited?: string[]; // locations entered
  minDeductions?: number;
}

/** Extra conditions that only make sense inside a conversation. */
export interface TalkCond extends Cond {
  revealed?: string[]; // this suspect has already revealed these
  notRevealed?: string[];
  minTrust?: number;
  minStress?: number;
}

export interface HotspotDef {
  id: string;
  label: string;
  x: number; y: number; w: number; h: number;
  prop: string;
  /** Only visible when the player searches the room closely. */
  subtle?: boolean;
  /** Hidden entirely (not even sent to the client) until this holds. */
  requires?: Cond;
  description: string;
  /** Shown instead of `description` when `requires` was needed but evidence prerequisites are missing. */
  action: "collect" | "photograph" | "none";
  evidence?: string;
  setsFlags?: string[];
}

export interface LocationDef {
  id: string;
  name: string;
  district: string;
  scene: SceneKind;
  description: string;
  mapPos: { x: number; y: number };
  unlock?: Cond;
  unlockHint: string;
  hotspots: HotspotDef[];
}

export interface TimelineSeed { time: string; text: string; }

export interface EvidenceDef {
  id: string;
  title: string;
  type: EvidenceType;
  summary: string;
  detail: string;
  importance: "key" | "supporting" | "minor";
  icon: string;
  /** Where it was found, for display. Testimony uses the speaker. */
  source: string;
  timeline?: TimelineSeed[];
  /** Words or phrases a player might use for this item in a typed question ("garage", "car park"). */
  aliases?: string[];
}

export interface ResponseNode {
  when?: TalkCond;
  text: string;
  mood: Mood;
  stress?: number; // delta
  trust?: number; // delta
  reveals?: string[]; // reveal ids recorded for this suspect
  grants?: string[]; // testimony / document evidence handed over
  deductions?: string[]; // deductions recognised directly in the room
  setsFlags?: string[];
}

export interface TopicDef {
  id: string;
  label: string;
  keywords: string[];
  requires?: Cond;
  /** First node whose `when` holds is used. */
  nodes: ResponseNode[];
  /** Said when the topic is asked again and the chosen node was already used. */
  repeat?: string;
}

export interface SuspectDef {
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
  voice?: VoiceProfile;
  /** First-person answer to "tell me about yourself". */
  about?: string;
  initial: { stress: number; trust: number; mood: Mood };
  greeting: string;
  topics: TopicDef[];
  reactions: Record<string, ResponseNode[]>;
  defaultReaction: string[];
  deflection: string; // when asked to reveal the solution / break character
  unknown: string[]; // free-text that matched nothing
  /** Material for the optional language model. Only this suspect's own knowledge. */
  ai: {
    voice: string;
    knows: string[];
    hides: string[];
    /** Phrases the model must not use unless the reveal id has happened. */
    guarded: { term: string; unlockedBy: string }[];
  };
  /** Reveal ids that count as this suspect's major admissions (achievements). */
  majorReveals: string[];
  truth: string; // shown only in the resolution
}

export interface DeductionDef {
  id: string;
  pairs: [string, string][];
  title: string;
  text: string;
  contradiction?: boolean;
  /** Suspects this deduction rules out / points toward. Used by the validator to prove a unique solution. */
  clears?: string[];
  implicates?: string[];
}

export interface Option { id: string; label: string; }

/** Story mode: a chapter opens with a cutscene and ends when every objective is done. */
export interface ChapterDef {
  id: string;
  title: string;
  intro: Shot[];
  objectives: { text: string; done: Cond }[];
}

export interface CaseDef {
  id: string;
  title: string;
  subtitle: string;
  setting: string;
  date: string;
  difficulty: "Beginner" | "Intermediate" | "Expert";
  synopsis: string;
  /** Stamp on the case file, e.g. "Homicide", "Theft". */
  stamp?: string;
  briefing: string[];
  victim: { name: string; age: number; description: string };
  startLocations: string[];
  locations: LocationDef[];
  evidence: EvidenceDef[];
  suspects: SuspectDef[];
  deductions: DeductionDef[];
  accusation: { motives: Option[]; methods: Option[]; sequences: Option[] };
  solution: {
    culprit: string;
    motive: string;
    method: string;
    sequence: string;
    /** Evidence that genuinely supports the true theory, grouped by what it proves. */
    support: { opportunity: string[]; means: string[]; motive: string[] };
    scenes: ResolutionScene[];
    /** Minute-by-minute canonical timeline. Never sent before the case closes. */
    timeline: { time: string; who: string; event: string }[];
  };
  /** Progress-sensitive hints from the partner character. First match wins. */
  hints: { when?: Cond; unless?: Cond; text: string }[];
  /** Story mode chapters. Cases without one get a generic story (see engine/story.ts). */
  story?: ChapterDef[];
  generated?: boolean;
}
