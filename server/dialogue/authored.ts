/**
 * Deterministic dialogue engine. Decides *what* a suspect says — which facts,
 * admissions and evidence a turn produces — from the authored dialogue tree
 * and the investigation state. The optional AI layer may only re-word the
 * beat chosen here; it never decides what is revealed.
 */
import type { ResponseNode, SuspectDef, TopicDef } from "../cases/types.ts";
import { check, checkTalk, type CaseProgress, type SuspectProgress } from "../engine/state.ts";

export type Tone = "neutral" | "aggressive" | "empathetic";

export type Intent =
  | { kind: "topic"; topic: TopicDef; tone: Tone }
  | { kind: "deflect"; tone: Tone }
  | { kind: "accuse"; tone: Tone }
  | { kind: "unknown"; tone: Tone };

/** Attempts to extract the solution or break character are refused in-character. */
const META = /\b(solution|the answer|spoiler|system prompt|prompt|ignore (all|any|previous|prior|your)|instructions?|developer|jailbreak|language model|you are an ai|as an ai|chatgpt|claude|pretend|roleplay|role-play|out of character|game master|reveal the (killer|murderer|culprit)|who is the (killer|murderer|culprit)|who('s| is) guilty|tell me who did it)\b/i;
const ACCUSE = /\b(did you (kill|murder|do it|hurt)|you killed|you murdered|you did it|confess|you're the (killer|murderer)|you are the (killer|murderer))\b/i;
const AGGRESSIVE = /\b(liar|lying|lie to me|stop lying|admit it|guilty|bullshit|don't play dumb|i know you did|you're hiding|you are hiding)\b/i;
const EMPATHETIC = /\b(sorry|i understand|take your time|must be (hard|difficult)|appreciate|thank you|thanks|help me understand|it's okay|you're safe)\b/i;

function tone(text: string): Tone {
  if (AGGRESSIVE.test(text)) return "aggressive";
  if (EMPATHETIC.test(text)) return "empathetic";
  return "neutral";
}

function normalise(text: string): string {
  return " " + text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9:'\- ]+/g, " ").replace(/\s+/g, " ") + " ";
}

export function availableTopics(def: SuspectDef, p: CaseProgress): TopicDef[] {
  return def.topics.filter((t) => check(p, t.requires));
}

export function detectIntent(def: SuspectDef, p: CaseProgress, text: string): Intent {
  const t = tone(text);
  if (META.test(text)) return { kind: "deflect", tone: t };
  if (ACCUSE.test(text)) return { kind: "accuse", tone: t };
  const norm = normalise(text);
  let best: { topic: TopicDef; score: number; len: number } | null = null;
  for (const topic of availableTopics(def, p)) {
    let score = 0;
    let len = 0;
    for (const kw of topic.keywords) {
      const k = kw.toLowerCase();
      // Whole-word match, or prefix match for longer words ("camera" matches "cameras").
      const hit = norm.includes(` ${k} `) || (k.length > 4 && norm.includes(` ${k}`));
      if (hit) { score += k.includes(" ") ? 2 : 1; len = Math.max(len, k.length); }
    }
    // Specific (gated) topics win ties over generic ones.
    if (topic.requires && score > 0) score += 0.5;
    if (score > 0 && (!best || score > best.score || (score === best.score && len > best.len))) best = { topic, score, len };
  }
  if (best) return { kind: "topic", topic: best.topic, tone: t };
  return { kind: "unknown", tone: t };
}

export function pickNode(nodes: ResponseNode[], p: CaseProgress, s: SuspectProgress): { node: ResponseNode; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (checkTalk(p, s, nodes[i].when)) return { node: nodes[i], index: i };
  }
  return null;
}

const DENIALS = [
  "No. I did not kill Daniel Mercer. And if that's your theory, detective, you'd better have more than a hunch.",
  "That's an ugly accusation. No.",
  "You're fishing. I didn't kill him.",
];

export function denial(n: number): string {
  return DENIALS[n % DENIALS.length];
}
