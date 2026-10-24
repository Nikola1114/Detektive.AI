/**
 * Story cutscenes, shot like an old film: letterbox bars, grain, flicker and
 * scratches, slow camera moves over the case's artwork, typewriter subtitles
 * and a narrator (plus the characters' own voices) reading every line.
 */
import { AnimatePresence, motion } from "framer-motion";
import { FastForward, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SceneKind, Shot, SuspectView, VoiceProfile } from "../../shared/api";
import { audio } from "../audio";
import { useGame } from "../game/GameContext";
import { speak, stopSpeaking, voiceSupported } from "../voice";
import { KANE } from "./CaseHelp";
import { InterrogationRoom } from "./InterrogationRoom";
import { Portrait } from "./Portrait";
import { Backdrop, SCENE_H, SCENE_W } from "./scene/Backdrops";

export const NARRATOR: VoiceProfile = { gender: "male", pitch: 0.8, rate: 0.9, seed: 3, neural: "bm_fable" };

const CAMERA = {
  push: { from: { scale: 1.04, x: "0%", y: "0%" }, to: { scale: 1.22, x: "0%", y: "-2%" } },
  pull: { from: { scale: 1.25, x: "0%", y: "-2%" }, to: { scale: 1.04, x: "0%", y: "0%" } },
  "pan-left": { from: { scale: 1.18, x: "5%", y: "0%" }, to: { scale: 1.18, x: "-5%", y: "0%" } },
  "pan-right": { from: { scale: 1.18, x: "-5%", y: "0%" }, to: { scale: 1.18, x: "5%", y: "0%" } },
  still: { from: { scale: 1.06, x: "0%", y: "0%" }, to: { scale: 1.08, x: "0%", y: "0%" } },
};

/** How long a line takes to read when no voice is speaking it. */
function readingTime(shot: Shot): number {
  const words = shot.text.split(/\s+/).filter(Boolean).length;
  if (!words) return shot.visual === "title" ? 4200 : 3200;
  return Math.max(2800, words * 380);
}

export function CinematicPlayer({ shots, cast, onDone }: { shots: Shot[]; cast: SuspectView[]; onDone: () => void }) {
  const { settings, setSettings } = useGame();
  const [i, setI] = useState(0);
  const shot = shots[i];
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const voiced = settings.voices && voiceSupported;

  const finish = useCallback(() => { stopSpeaking(); doneRef.current(); }, []);
  const at = useRef(0);
  at.current = i;
  const next = useCallback(() => { if (at.current + 1 < shots.length) setI(at.current + 1); else finish(); }, [shots.length, finish]);

  const profileFor = useCallback((speaker?: string): VoiceProfile | null => {
    if (!speaker) return null;
    if (speaker === "narrator") return NARRATOR;
    if (speaker === "kane") return KANE;
    return cast.find((s) => s.id === speaker)?.voice ?? null;
  }, [cast]);

  // Rain and the city outside while the film plays.
  useEffect(() => {
    audio.setAmbience("street");
    audio.sfx("projector");
    return () => { stopSpeaking(); audio.setAmbience("office"); };
  }, []);

  // Each shot: sound cue, then the voice (or reading time) decides when to cut.
  useEffect(() => {
    if (!shot) return;
    let cut = false;
    const timers: number[] = [];
    const advance = () => { if (!cut) { cut = true; next(); } };
    if (shot.visual === "title" || (shot.visual === "black" && shot.caption)) audio.sfx("sting");
    if (shot.visual === "rain" && i === 0) audio.sfx("thunder");
    const est = readingTime(shot);
    const profile = profileFor(shot.speaker);
    if (voiced && profile && shot.text) {
      // Cut when the line has been spoken, but never before the subtitle could be read.
      const started = Date.now();
      const minimum = 500 + (shot.text.length / 34) * 1000 + 1800;
      timers.push(window.setTimeout(() => {
        speak(shot.text, profile, {
          volume: settings.voiceVolume, rate: settings.voiceRate, engine: settings.voiceEngine,
          onEnd: () => timers.push(window.setTimeout(advance, Math.max(700, minimum - (Date.now() - started)))),
        });
      }, 500));
      timers.push(window.setTimeout(advance, est * 2.2 + 8000)); // never get stuck if a voice fails silently
    } else {
      timers.push(window.setTimeout(advance, est + 600));
    }
    return () => { cut = true; timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, voiced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); finish(); }
      else if (e.key === " " || e.key === "Enter" || e.key === "ArrowRight") { e.preventDefault(); stopSpeaking(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, finish]);

  if (!shot) return null;
  const speakerName = shot.speaker === "kane" ? "Sgt. Iris Kane" : shot.speaker && shot.speaker !== "narrator" ? cast.find((s) => s.id === shot.speaker)?.name : undefined;
  const card = shot.visual === "black" || shot.visual === "title";
  const cam = CAMERA[shot.camera ?? "still"];
  const dur = readingTime(shot) / 1000 + 3;

  return (
    <div className="fixed inset-0 z-[80] select-none overflow-hidden bg-black" role="dialog" aria-label="Story cutscene" onClick={() => { stopSpeaking(); next(); }}>
      {/* the picture */}
      <AnimatePresence>
        <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }}>
          <motion.div className="absolute inset-0" initial={cam.from} animate={cam.to} transition={{ duration: dur, ease: "linear" }}>
            <Visual visual={shot.visual} cast={cast} />
          </motion.div>
          {!card && <div className="rain slow" style={{ opacity: shot.visual === "rain" || shot.visual === "city" || shot.visual === "tower" ? 0.9 : 0.25 }} />}
          <div className="vignette" />
        </motion.div>
      </AnimatePresence>

      {/* film damage */}
      <div className="film-flicker pointer-events-none absolute inset-0 bg-white" />
      <div className="film-scratch" /><div className="film-scratch b" />

      {/* chapter cards and title */}
      <AnimatePresence mode="wait">
        {card && shot.caption && (
          <motion.div key={`c${i}`} className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center"
            initial={{ opacity: 0, letterSpacing: "0.5em" }} animate={{ opacity: 1, letterSpacing: shot.visual === "title" ? "0.12em" : "0.25em" }} exit={{ opacity: 0 }} transition={{ duration: 2.2, ease: "easeOut" }}>
            {shot.visual === "title"
              ? <h1 className="font-display text-5xl font-extrabold uppercase text-paper-100 drop-shadow-[0_0_30px_rgba(255,190,90,0.35)] sm:text-7xl">{shot.caption}</h1>
              : <div className="font-display text-2xl uppercase text-amber-300 sm:text-4xl">{shot.caption}</div>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* letterbox */}
      <motion.div className="absolute inset-x-0 top-0 z-10 bg-black" initial={{ height: 0 }} animate={{ height: "11vh" }} transition={{ duration: 1.2, ease: "easeOut" }} />
      <motion.div className="absolute inset-x-0 bottom-0 z-10 bg-black" initial={{ height: 0 }} animate={{ height: "13vh" }} transition={{ duration: 1.2, ease: "easeOut" }} />

      {/* location slug */}
      {!card && shot.caption && (
        <div className="pointer-events-none absolute left-[6%] top-[13vh] z-20 font-type text-xs tracking-[0.3em] text-paper-100/80 sm:text-sm">
          <Typewriter key={`s${i}`} text={shot.caption} speed={22} />
        </div>
      )}

      {/* subtitles */}
      {shot.text && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[14vh] z-20 flex justify-center px-4 sm:px-10">
          <div className="max-w-3xl text-center">
            {speakerName && <div className="mb-1 font-type text-[0.7rem] uppercase tracking-[0.3em] text-amber-300/90">{speakerName}</div>}
            <p className="text-lg leading-snug text-paper-100 [text-shadow:0_2px_6px_#000,0_0_2px_#000] sm:text-2xl">
              <Typewriter key={`t${i}`} text={shot.text} speed={shot.speaker === "narrator" ? 34 : 40} delay={500} />
            </p>
          </div>
        </div>
      )}

      {/* controls, in the bottom bar */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex h-[13vh] items-center justify-between gap-3 px-4 sm:px-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5" aria-hidden>
          {shots.map((_, k) => <span key={k} className={`h-1 rounded-full transition-all ${k === i ? "w-6 bg-amber-400" : k < i ? "w-2 bg-smoke-400" : "w-2 bg-white/15"}`} />)}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-smoke-500 sm:inline">Click or press Space to continue</span>
          {voiceSupported && (
            <button onClick={() => { stopSpeaking(); setSettings({ voices: !settings.voices }); }} className="rounded-full p-2 text-smoke-300 hover:text-white" aria-label={settings.voices ? "Mute voices" : "Turn voices on"}>
              {settings.voices ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
          )}
          <button onClick={finish} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-sm text-smoke-200 hover:border-amber-400 hover:text-amber-300">
            <FastForward size={15} />Skip
          </button>
        </div>
      </div>
    </div>
  );
}

function Typewriter({ text, speed, delay = 0 }: { text: string; speed: number; delay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let id = 0;
    const start = window.setTimeout(() => { id = window.setInterval(() => setN((x) => (x >= text.length ? (clearInterval(id), x) : x + 1)), 1000 / speed); }, delay);
    return () => { clearTimeout(start); clearInterval(id); };
  }, [text, speed, delay]);
  return <>{text.slice(0, n)}<span className="opacity-0">{text.slice(n)}</span></>;
}

function Visual({ visual, cast }: { visual: Shot["visual"]; cast: SuspectView[] }) {
  if (visual === "black" || visual === "title") return <div className="absolute inset-0 bg-black" />;
  if (visual === "rain" || visual === "city") return <Skyline lightning={visual === "rain"} />;
  if (visual === "tower") return <Skyline tower />;
  const [kind, id] = visual.split(":");
  if (kind === "scene") {
    return (
      <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" style={{ filter: "grayscale(0.75) sepia(0.35) contrast(1.15) brightness(0.8)" }} aria-hidden>
        <Backdrop kind={id as SceneKind} />
      </svg>
    );
  }
  const s = cast.find((x) => x.id === id);
  if (!s) return <Skyline />;
  if (kind === "room") return <div className="absolute inset-0"><InterrogationRoom spec={s.portrait} mood="guarded" name={s.name} speaking={false} /></div>;
  return (
    <div className="absolute inset-0 flex items-end justify-center bg-[radial-gradient(ellipse_at_50%_35%,#3a3a3a_0%,#0b0b0b_60%)]" style={{ filter: "grayscale(1) contrast(1.1)" }}>
      <Portrait spec={s.portrait} mood="calm" size={560} bare className="max-h-[85%] w-auto" name={s.name} />
    </div>
  );
}

/** A rain-soaked skyline; with `tower`, Blackwood Tower rises in the middle with one lit window. */
function Skyline({ tower = false, lightning = false }: { tower?: boolean; lightning?: boolean }) {
  const buildings = useMemo(() => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    const out: { x: number; w: number; h: number; layer: number; windows: { x: number; y: number }[] }[] = [];
    for (const layer of [0, 1]) {
      for (let x = -40; x < 1640;) {
        const w = 60 + rnd() * (layer ? 130 : 90);
        const h = (layer ? 220 : 340) + rnd() * (layer ? 260 : 300);
        const windows: { x: number; y: number }[] = [];
        if (layer) for (let wy = 900 - h + 20; wy < 880; wy += 22) for (let wx = x + 10; wx < x + w - 12; wx += 18) if (rnd() < 0.13) windows.push({ x: wx, y: wy });
        out.push({ x, w, h, layer, windows });
        x += w + (layer ? 8 : 4);
      }
    }
    return out;
  }, []);
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#05070a" /><stop offset="0.6" stopColor="#141922" /><stop offset="1" stopColor="#2a2418" /></linearGradient>
        <radialGradient id="cs-glow" cx="0.5" cy="1" r="0.7"><stop offset="0" stopColor="#c98a3a" stopOpacity="0.28" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#cs-sky)" />
      <ellipse cx="1180" cy="170" rx="260" ry="70" fill="#9aa3b3" opacity="0.06" />
      <ellipse cx="420" cy="120" rx="320" ry="60" fill="#9aa3b3" opacity="0.05" />
      <rect width="1600" height="900" fill="url(#cs-glow)" />
      {buildings.filter((b) => b.layer === 0).map((b, k) => <rect key={`f${k}`} x={b.x} y={900 - b.h} width={b.w} height={b.h} fill="#0f1218" />)}
      {tower && (
        <g>
          <rect x="730" y="250" width="140" height="650" fill="#07090c" />
          <rect x="770" y="200" width="60" height="60" fill="#07090c" />
          <line x1="800" y1="150" x2="800" y2="200" stroke="#07090c" strokeWidth="5" />
          <circle cx="800" cy="152" r="4" fill="#d33" className="animate-flicker" />
          {Array.from({ length: 30 }, (_, r) => <line key={r} x1="740" y1={290 + r * 21} x2="860" y2={290 + r * 21} stroke="#1a1f27" strokeWidth="2" />)}
          <rect x="790" y="272" width="26" height="14" fill="#ffcf7a" className="film-window" />
          <rect x="770" y="264" width="66" height="30" fill="#ffcf7a" opacity="0.12" />
        </g>
      )}
      {buildings.filter((b) => b.layer === 1).map((b, k) => (
        <g key={`n${k}`}>
          <rect x={b.x} y={900 - b.h} width={b.w} height={b.h} fill="#050608" />
          {b.windows.map((w, j) => <rect key={j} x={w.x} y={w.y} width="7" height="10" fill="#e8b866" opacity={0.35 + (j % 3) * 0.15} />)}
        </g>
      ))}
      {lightning && <rect width="1600" height="900" fill="#dfe8ff" className="film-lightning" />}
    </svg>
  );
}
