/**
 * Deterministic dialogue engine. Decides *what* a suspect says — which facts,
 * admissions and evidence a turn produces — from the authored dialogue tree
 * and the investigation state. The optional AI layer may only re-word the
 * beat chosen here; it never decides what is revealed.
 *
 * Free-text understanding is forgiving: it tolerates typos and word endings,
 * maps common phrasings onto the authored topics, notices evidence the player
 * mentions in their own words, and handles short follow-ups ("why?").
 */
import type { EvidenceDef, ResponseNode, SuspectDef, TopicDef } from "../cases/types.ts";
import { check, checkTalk, type CaseProgress, type SuspectProgress } from "../engine/state.ts";

export type Tone = "neutral" | "aggressive" | "empathetic";

export type Intent =
  | { kind: "topic"; topic: TopicDef; tone: Tone }
  | { kind: "deflect"; tone: Tone }
  | { kind: "accuse"; tone: Tone }
  | { kind: "greet"; tone: Tone }
  | { kind: "about"; tone: Tone }
  | { kind: "bye"; tone: Tone }
  | { kind: "followup"; tone: Tone }
  | { kind: "unknown"; tone: Tone };

/** Attempts to extract the solution or break character are refused in-character. */
const META = /\b(solution|the answer|spoiler|system prompt|prompt|ignore (all|any|previous|prior|your)|instructions?|developer|jailbreak|language model|you are an ai|as an ai|chatgpt|claude|pretend|roleplay|role-play|out of character|game master|reveal the (killer|murderer|culprit)|who is the (killer|murderer|culprit)|who('s| is) guilty|tell me who did it)\b/i;
const ACCUSE = /\b(did you (kill|murder|do it|hurt)|you killed|you murdered|you did it|confess|you're the (killer|murderer)|you are the (killer|murderer)|admit (it|that you))\b/i;
const AGGRESSIVE = /\b(liar|lying|lie to me|stop lying|admit it|guilty|bullshit|don't play dumb|i know you did|you're hiding|you are hiding)\b/i;
const EMPATHETIC = /\b(sorry|i understand|take your time|must be (hard|difficult)|appreciate|thank you|thanks|help me understand|it's okay|you're safe)\b/i;
const GREET = /^\s*(hi|hello|hey|good (morning|afternoon|evening)|evening|morning)\b[\s!.,]*(there|again|detective)?[\s!.,]*$/i;
const ABOUT = /\b(who are you|tell me about (yourself|you)|about yourself|what do you do|what's your job|what is your job|introduce yourself|your name)\b/i;
const BYE = /^\s*(bye|goodbye|that's all|that will be all|that'll be all|we're done|we are done|no more questions|thanks?,? that's all)\b/i;
const FOLLOW = /^\s*(why\??|why not\??|how come|really|are you sure|you sure|explain|what do you mean|meaning|go on|and then|tell me more|elaborate|is that (all|true|so)|anything else|what else|prove it|how do you know|and\??|so\??)\b/i;

/** Common ways of saying the same thing, rewritten before matching. */
const SYNONYMS: [RegExp, string][] = [
  [/\bwhat (were|was) you doing\b/g, "where were you"],
  [/\bwhere did you go\b/g, "where were you"],
  [/\b(yesterday|that night|the night of|tonight|on the night)\b/g, "last night"],
  [/\b(murdered|died|death|dead)\b/g, "killed"],
  [/\b(key ?card|access card|swipe card)\b/g, "keycard"],
  [/\b(cctv|cams?)\b/g, "camera"],
  [/\b(videos?|recordings?)\b/g, "footage"],
  [/\bsee him\b/g, "see"],
  [/\b(talk|talked|speak|spoken) to (him|daniel|mercer)\b/g, "spoke"],
  [/\b(financ\w*|money trouble|cash)\b/g, "finances"],
];

const GENERIC = new Set(["last night", "night", "evening", "tonight", "where", "who", "what", "think", "know", "about", "else", "anyone", "him", "how", "when", "last", "see", "do", "did it", "daniel", "mercer", "victim"]);

const STOP = new Set(["the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with", "is", "was", "were", "be", "you", "your", "i", "me", "my", "it", "this", "that", "did", "do", "does", "what", "why", "how", "when", "who", "about", "from", "by", "s", "mercer's", "log", "report"]);

function tone(text: string): Tone {
  if (AGGRESSIVE.test(text)) return "aggressive";
  if (EMPATHETIC.test(text)) return "empathetic";
  return "neutral";
}

export function normalise(text: string): string {
  let t = text.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9:'\- ]+/g, " ");
  for (const [re, rep] of SYNONYMS) t = t.replace(re, rep);
  return t.replace(/\s+/g, " ").trim();
}

export function stem(w: string): string {
  let s = w.replace(/'s$/, "").replace(/'$/, "");
  if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("es")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

interface Parsed { norm: string; words: string[]; stems: string[]; stemText: string; }

function parse(text: string): Parsed {
  const norm = normalise(text);
  const words = norm.split(" ").filter(Boolean);
  const stems = words.map(stem);
  return { norm, words, stems, stemText: ` ${stems.join(" ")} ` };
}

/** Does a keyword or phrase occur in the text, allowing word endings and small typos? */
function hits(keyword: string, p: Parsed): boolean {
  const k = normalise(keyword);
  if (!k) return false;
  if (k.includes(" ") || k.includes(":")) {
    const phrase = ` ${k.split(" ").map(stem).join(" ")} `;
    if (p.stemText.includes(phrase) || ` ${p.norm} `.includes(` ${k} `)) return true;
    // Every word of the phrase present, in any order.
    const parts = k.split(" ").filter((w) => !STOP.has(w));
    return parts.length > 1 && parts.every((w) => hits(w, p));
  }
  const ks = stem(k);
  return p.stems.some((s, i) => {
    if (s === ks) return true;
    const w = p.words[i];
    if (k.length > 4 && w.startsWith(k)) return true;
    if (ks.length >= 5 && s.length >= 4) return lev(s, ks) <= (ks.length >= 8 ? 2 : 1);
    return false;
  });
}

export function availableTopics(def: SuspectDef, p: CaseProgress): TopicDef[] {
  return def.topics.filter((t) => check(p, t.requires));
}

export function detectIntent(def: SuspectDef, p: CaseProgress, text: string): Intent {
  const t = tone(text);
  if (META.test(text)) return { kind: "deflect", tone: t };
  if (ACCUSE.test(text)) return { kind: "accuse", tone: t };
  if (GREET.test(text)) return { kind: "greet", tone: t };
  if (BYE.test(text)) return { kind: "bye", tone: t };
  const parsed = parse(text);
  if (parsed.words.length <= 6 && FOLLOW.test(text)) return { kind: "followup", tone: t };
  if (ABOUT.test(text)) return { kind: "about", tone: t };
  let best: { topic: TopicDef; score: number; specific: number } | null = null;
  for (const topic of availableTopics(def, p)) {
    let score = 0;
    let specific = 0;
    for (const kw of topic.keywords) {
      if (!hits(kw, parsed)) continue;
      // Generic words ("last night", "who") count for less than specific ones ("calendar").
      if (GENERIC.has(kw.toLowerCase())) score += 0.5;
      else { score += kw.includes(" ") ? 2 : 1; specific++; }
    }
    // Specific (gated) topics win ties over generic ones.
    if (topic.requires && score > 0) score += 0.5;
    if (score > 0 && (!best || score > best.score || (score === best.score && specific > best.specific))) best = { topic, score, specific };
  }
  if (best) return { kind: "topic", topic: best.topic, tone: t };
  return { kind: "unknown", tone: t };
}

/**
 * Finds a discovered piece of evidence the player refers to in their own words
 * ("why was your car in the garage at 22:03?"). Only items the suspect has a
 * reaction to are considered, so casual words don't misfire.
 */
export function findEvidenceMention(text: string, candidates: EvidenceDef[]): string | null {
  const parsed = parse(text);
  let best: { id: string; score: number } | null = null;
  for (const e of candidates) {
    let score = 0;
    for (const a of e.aliases ?? []) if (hits(a, parsed)) score = Math.max(score, a.includes(" ") ? 3 : 2);
    // The full title, or all of its distinctive words, also count.
    const words = normalise(e.title).split(" ").filter((w) => w.length >= 4 && !STOP.has(w));
    if (words.length >= 2 && words.every((w) => hits(w, parsed))) score = Math.max(score, 3);
    if (score > 0 && (!best || score > best.score)) best = { id: e.id, score };
  }
  return best?.id ?? null;
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

const PRESSED = [
  "I've told you what I know about that, detective.",
  "Because that's what happened. I don't know what else you want me to say.",
  "You can ask it ten ways. The answer won't change.",
  "I've said all I'm going to say about that.",
];
export function pressed(n: number): string {
  return PRESSED[n % PRESSED.length];
}

const GOODBYES = ["Are we done? Good.", "Then I'll be going.", "Call me if you need anything else, detective.", "Finally."];
export function goodbye(n: number): string {
  return GOODBYES[n % GOODBYES.length];
}
