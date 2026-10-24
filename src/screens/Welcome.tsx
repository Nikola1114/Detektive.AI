import { motion } from "framer-motion";
import { Briefcase, Play, RotateCcw, Settings, Volume2, VolumeX } from "lucide-react";
import { useGame } from "../game/GameContext";

export function Welcome() {
  const { go, startCase, state, caseId, cases, settings, setSettings, busy } = useGame();
  const canContinue = Boolean(caseId && state);
  const case1 = cases.find((c) => c.id === "case-001");

  const start = async () => {
    // Start Investigation opens Case 001 (resuming if already underway).
    if (await startCase("case-001")) go(case1?.status === "new" || !case1 ? "office?briefing" : "office");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
        <defs>
          <linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#05070b" /><stop offset="0.7" stopColor="#111c2e" /><stop offset="1" stopColor="#1d2a3e" /></linearGradient>
          <radialGradient id="wglow" cx="0.5" cy="0.9" r="0.6"><stop offset="0" stopColor="#e7b45a" stopOpacity="0.18" /><stop offset="1" stopColor="#e7b45a" stopOpacity="0" /></radialGradient>
        </defs>
        <rect width="1600" height="900" fill="url(#wsky)" />
        <rect width="1600" height="900" fill="url(#wglow)" />
        {Array.from({ length: 48 }, (_, i) => {
          const x = i * 34 + ((i * 13) % 20);
          const h = 120 + ((i * 97) % 330);
          return <rect key={i} x={x} y={900 - h} width={30 + (i % 3) * 8} height={h} fill={i % 2 ? "#070a10" : "#0a0e16"} />;
        })}
        <rect x="760" y="210" width="60" height="690" fill="#04060a" />
        <rect x="780" y="150" width="20" height="70" fill="#04060a" />
        <circle cx="790" cy="146" r="5" fill="#ff5a4a" className="animate-flicker" />
        {Array.from({ length: 140 }, (_, i) => <rect key={i} x={(i * 113) % 1600} y={420 + ((i * 71) % 460)} width="3" height="5" fill="#e7b45a" opacity={0.15 + ((i * 7) % 10) / 25} />)}
        <rect x="766" y="226" width="48" height="4" fill="#f3cf85" opacity="0.6" />
      </svg>
      <div className="rain" />
      <div className="vignette" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <div className="label-caps mb-4 !tracking-[0.5em] !text-amber-400/80">Blackwood City · 2026</div>
          <h1 className="font-display text-6xl font-extrabold tracking-[0.12em] text-paper-100 drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] sm:text-8xl">
            DETECTIVE <span className="text-amber-400">AI</span>
          </h1>
          <p className="mt-5 font-display text-xl italic text-smoke-200 sm:text-2xl">Every Secret Leaves a Trace.</p>
        </motion.div>

        <motion.div className="mt-12 flex w-full max-w-xs flex-col gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 0.8 }}>
          <button onClick={start} disabled={busy} className="group flex items-center justify-center gap-3 rounded-md bg-gradient-to-b from-amber-400 to-amber-600 px-6 py-3.5 font-semibold tracking-wider text-char-900 shadow-[0_0_40px_rgba(231,180,90,0.35)] transition hover:from-amber-300 hover:to-amber-500">
            <Play size={18} className="transition group-hover:translate-x-0.5" /> Start Investigation
          </button>
          <button onClick={() => go("office")} disabled={!canContinue} className="flex items-center justify-center gap-3 rounded-md border border-amber-500/40 bg-black/40 px-6 py-3 font-semibold tracking-wider text-amber-300 backdrop-blur transition hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-35">
            <RotateCcw size={17} /> Continue Case
          </button>
          <button onClick={() => go("cases")} className="flex items-center justify-center gap-3 rounded-md border border-white/10 bg-black/40 px-6 py-3 font-semibold tracking-wider text-smoke-100 backdrop-blur transition hover:bg-white/5">
            <Briefcase size={17} /> Case Files
          </button>
          <button onClick={() => go("settings")} className="flex items-center justify-center gap-3 rounded-md border border-white/10 bg-black/40 px-6 py-3 font-semibold tracking-wider text-smoke-100 backdrop-blur transition hover:bg-white/5">
            <Settings size={17} /> Settings
          </button>
        </motion.div>
      </div>

      <div className="relative z-10 flex items-center justify-between px-6 pb-5 text-xs text-smoke-400">
        <span>A work of fiction. All characters and events are invented.</span>
        <button onClick={() => setSettings({ sound: !settings.sound })} className="flex items-center gap-2 rounded px-2 py-1 hover:text-smoke-100" aria-pressed={settings.sound}>
          {settings.sound ? <Volume2 size={15} /> : <VolumeX size={15} />} {settings.sound ? "Sound on" : "Sound off"}
        </button>
      </div>
    </div>
  );
}
