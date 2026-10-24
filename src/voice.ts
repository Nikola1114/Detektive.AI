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

export interface SpeakOptions { volume: number; rate: number; engine?: "browser" | "neural"; onStart?: () => void; onEnd?: () => void; }

export function speak(text: string, profile: VoiceProfile, opts: SpeakOptions) {
  stopSpeaking();
  if (opts.engine === "neural") {
    if (neural.status === "ready") { void speakNeural(text, profile, opts); return; }
    if (neural.status === "off") loadNeuralVoices(); // fall back to built-in voices while it downloads
  }
  speakBrowser(text, profile, opts);
}

function speakBrowser(text: string, profile: VoiceProfile, opts: SpeakOptions) {
  if (!synth) return;
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
  stopNeural();
  audio.duck(false);
}

// ── Realistic voices: the Kokoro neural model, run in a background worker ──

export type NeuralStatus = "off" | "loading" | "ready" | "error";
export const neural = { status: "off" as NeuralStatus, progress: 0, error: "" };
const neuralListeners = new Set<() => void>();
export function onNeuralChange(fn: () => void) { neuralListeners.add(fn); return () => { neuralListeners.delete(fn); }; }
const emit = () => neuralListeners.forEach((f) => f());

let worker: Worker | null = null;
let playCtx: AudioContext | null = null;
let session = 0; // increments on every new line or stop, cancelling stale audio
let source: AudioBufferSourceNode | null = null;
const pending = new Map<number, (r: { samples: Float32Array; rate: number } | null) => void>();
let nextId = 1;

const FEMALE_VOICES = ["af_heart", "af_bella", "bf_emma", "af_nicole", "af_sarah", "bf_isabella"];
const MALE_VOICES = ["am_michael", "bm_george", "am_fenrir", "bm_fable", "am_puck", "bm_lewis"];

export const neuralSupported = typeof Worker !== "undefined" && typeof WebAssembly !== "undefined";

export function loadNeuralVoices() {
  if (!neuralSupported || neural.status === "loading" || neural.status === "ready") return;
  neural.status = "loading"; neural.progress = 0; neural.error = ""; emit();
  worker = new Worker(new URL("./tts.worker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (e: MessageEvent) => {
    const m = e.data;
    if (m.type === "progress") { neural.progress = m.progress; emit(); }
    else if (m.type === "ready") { neural.status = "ready"; neural.progress = 1; emit(); }
    else if (m.type === "audio") { pending.get(m.id)?.({ samples: m.samples, rate: m.rate }); pending.delete(m.id); }
    else if (m.type === "error") {
      console.warn("[voice] realistic voice error:", m.message);
      if (m.id !== undefined) { pending.get(m.id)?.(null); pending.delete(m.id); neural.error = m.message; emit(); }
      if (neural.status !== "ready") { neural.status = "error"; neural.error = m.message; emit(); worker?.terminate(); worker = null; }
    }
  };
  worker.onerror = (e) => { console.warn("[voice] worker failed:", e.message); neural.status = "error"; neural.error = e.message || "The voice model could not start in this browser."; emit(); };
  worker.postMessage({ type: "load" });
}

/** Asks the worker for one sentence of audio; resolves null on failure or after a timeout. */
function generate(text: string, voice: string, speed: number): Promise<{ samples: Float32Array; rate: number } | null> {
  return new Promise((resolve) => {
    if (!worker) return resolve(null);
    const id = nextId++;
    const timer = window.setTimeout(() => { pending.delete(id); console.warn("[voice] realistic voice timed out"); resolve(null); }, 30000);
    pending.set(id, (r) => { window.clearTimeout(timer); resolve(r); });
    worker.postMessage({ type: "speak", id, text, voice, speed });
  });
}

function neuralVoiceFor(p: VoiceProfile): string {
  if (p.neural) return p.neural;
  const list = p.gender === "female" ? FEMALE_VOICES : MALE_VOICES;
  return list[p.seed % list.length];
}

/** Generates sentence by sentence so the first words play quickly. */
async function speakNeural(text: string, profile: VoiceProfile, opts: SpeakOptions) {
  const my = ++session;
  playCtx ??= new AudioContext();
  if (playCtx.state === "suspended") await playCtx.resume();
  const clean = text.replace(/["“”]/g, "").replace(/—/g, ", ");
  const sentences = clean.match(/[^.!?…]+[.!?…]+["')\]]*|\S[^.!?…]*$/g)?.map((s) => s.trim()).filter(Boolean) ?? [clean];
  const voice = neuralVoiceFor(profile);
  const speed = Math.max(0.7, Math.min(1.4, profile.rate * opts.rate));
  let started = false;
  let upcoming = generate(sentences[0], voice, speed);
  for (let i = 0; i < sentences.length; i++) {
    const clip = await upcoming;
    if (my !== session) return;
    if (!clip) {
      // Never leave the player in silence: read the rest with the built-in voice.
      speakBrowser(sentences.slice(i).join(" "), profile, { ...opts, onStart: started ? undefined : opts.onStart });
      return;
    }
    if (i + 1 < sentences.length) upcoming = generate(sentences[i + 1], voice, speed);
    if (!started) { started = true; audio.duck(true); opts.onStart?.(); }
    await play(clip, opts.volume, my);
    if (my !== session) return;
  }
  audio.duck(false);
  opts.onEnd?.();
}

function play(clip: { samples: Float32Array; rate: number }, volume: number, my: number): Promise<void> {
  return new Promise((resolve) => {
    if (!playCtx || my !== session) return resolve();
    const buf = playCtx.createBuffer(1, clip.samples.length, clip.rate);
    buf.copyToChannel(new Float32Array(clip.samples), 0);
    const gain = playCtx.createGain();
    gain.gain.value = volume;
    source = playCtx.createBufferSource();
    source.buffer = buf;
    source.connect(gain).connect(playCtx.destination);
    source.onended = () => resolve();
    source.start();
  });
}

function stopNeural() {
  session++;
  try { source?.stop(); } catch { /* already stopped */ }
  source = null;
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
