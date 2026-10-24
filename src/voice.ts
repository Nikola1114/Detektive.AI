/**
 * Spoken dialogue using the browser's built-in Web Speech API:
 *  - text-to-speech gives each suspect their own voice (neural "Natural"/"Online"
 *    voices are preferred when the browser has them, e.g. Microsoft Edge);
 *  - speech recognition lets the player ask questions out loud.
 * Both are free and need no API key. Unsupported browsers simply hide the controls.
 */
import type { VoiceProfile } from "../shared/api";
import { audio } from "./audio";

const synth: SpeechSynthesis | null = typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null;
let voices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  if (!synth) return;
  voices = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
}
if (synth) {
  loadVoices();
  synth.addEventListener?.("voiceschanged", loadVoices);
}

const FEMALE = /\b(female|woman|aria|jenny|sonia|libby|michelle|ava|emma|zira|samantha|karen|serena|susan|hazel|moira|tessa|fiona|victoria|allison|natasha|clara|sara|nancy|jane|amber|ashley|cora|elizabeth|monica|maisie|olivia|emily|catherine|kate|joanna|salli|kimberly|ivy|amy|heera|neerja)\b/i;
const MALE = /\b(male|man|guy|ryan|davis|andrew|brian|christopher|eric|roger|steffan|thomas|david|mark|daniel|george|alex|fred|oliver|arthur|liam|william|tony|jason|ethan|james|noah|connor|brandon|jacob|kai|luke|ralph|rishi|matthew|joey|justin|russell|prabhat)\b/i;

function genderOf(v: SpeechSynthesisVoice): "female" | "male" | null {
  if (FEMALE.test(v.name)) return "female";
  if (MALE.test(v.name)) return "male";
  return null;
}

/** Picks a good English voice for this profile, varying by seed so suspects sound different. */
export function voiceFor(p: VoiceProfile): SpeechSynthesisVoice | null {
  if (!voices.length) loadVoices();
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (genderOf(v) === p.gender ? 10 : genderOf(v) === null ? 2 : 0) +
    (/natural|neural|online|premium|enhanced/i.test(v.name) ? 5 : 0) +
    (/^en-(gb|us)/i.test(v.lang) ? 1 : 0) +
    (/google/i.test(v.name) ? 1 : 0);
  const ranked = [...voices].sort((a, b) => score(b) - score(a));
  const top = ranked.filter((v) => score(v) >= score(ranked[0]) - 1).slice(0, 6);
  return top[p.seed % top.length] ?? ranked[0];
}

export const voiceSupported = Boolean(synth);

export interface SpeakOptions { volume: number; rate: number; onStart?: () => void; onEnd?: () => void; }

export function speak(text: string, profile: VoiceProfile, opts: SpeakOptions) {
  if (!synth) return;
  stopSpeaking();
  // Read the words, not the punctuation flourishes.
  const clean = text.replace(/["“”]/g, "").replace(/—/g, ", ").replace(/\.\.\./g, "… ");
  const u = new SpeechSynthesisUtterance(clean);
  const v = voiceFor(profile);
  if (v) { u.voice = v; u.lang = v.lang; }
  // When no matching-gender voice exists, pitch carries the difference.
  const genderMatched = v && genderOf(v) === profile.gender;
  u.pitch = Math.max(0.1, Math.min(2, profile.pitch * (genderMatched ? 1 : profile.gender === "female" ? 1.25 : 0.75)));
  u.rate = Math.max(0.5, Math.min(1.6, profile.rate * opts.rate));
  u.volume = opts.volume;
  u.onstart = () => { audio.duck(true); opts.onStart?.(); };
  u.onend = u.onerror = () => { audio.duck(false); opts.onEnd?.(); };
  synth.speak(u);
}

export function stopSpeaking() {
  if (synth && (synth.speaking || synth.pending)) synth.cancel();
  audio.duck(false);
}

// ── Speech recognition (player's microphone) ──

type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const RecognitionCtor: (new () => Recognition) | undefined =
  typeof window !== "undefined" ? ((window as unknown as Record<string, unknown>).SpeechRecognition ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as (new () => Recognition) | undefined : undefined;

export const micSupported = Boolean(RecognitionCtor);

export interface Listener { stop: () => void; }

export function listen(handlers: { onInterim: (t: string) => void; onFinal: (t: string) => void; onError: (msg: string) => void; onEnd: () => void }): Listener | null {
  if (!RecognitionCtor) return null;
  stopSpeaking();
  const r = new RecognitionCtor();
  r.lang = navigator.language?.startsWith("en") ? navigator.language : "en-US";
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  let finalText = "";
  r.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) finalText += res[0].transcript;
      else interim += res[0].transcript;
    }
    handlers.onInterim((finalText + interim).trim());
  };
  r.onerror = (e) => {
    const msg = e.error === "not-allowed" || e.error === "service-not-allowed"
      ? "Microphone access was blocked. Allow it in your browser's address bar to speak to suspects."
      : e.error === "no-speech" ? "I didn't hear anything — try again." : e.error === "network" ? "Speech recognition needs an internet connection." : `Microphone error: ${e.error}`;
    handlers.onError(msg);
  };
  r.onend = () => { if (finalText.trim()) handlers.onFinal(finalText.trim()); handlers.onEnd(); };
  r.start();
  return { stop: () => r.stop() };
}
