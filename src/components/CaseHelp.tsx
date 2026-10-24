/** Help when you're stuck: a difficulty picker, "Ask for a clue", and "I give up". */
import { AnimatePresence, motion } from "framer-motion";
import { Flag, Lightbulb, X } from "lucide-react";
import { useState } from "react";
import { useGame } from "../game/GameContext";
import { speak, voiceSupported } from "../voice";
import { Button, Modal } from "./ui";

const KANE = { gender: "female" as const, pitch: 0.95, rate: 1, seed: 6, neural: "af_sarah" };

export function ModePicker({ open, onClose, onPick, title = "How do you want to play?" }: { open: boolean; onClose: () => void; onPick: (mode: "easy" | "normal") => void; title?: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title} wide>
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => onPick("easy")} className="flex flex-col justify-start rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-500/10">
          <div className="font-display text-2xl font-bold text-emerald-300">Easy</div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-smoke-200">
            <li>Every clue in a room is shown — nothing is hidden</li>
            <li>Connections between evidence are made for you</li>
            <li>Suspects confess as soon as you show the right evidence</li>
            <li>Clues tell you exactly what to do</li>
            <li>Accuse as many times as you like, and see which parts were right</li>
          </ul>
        </button>
        <button onClick={() => onPick("normal")} className="flex flex-col justify-start rounded-xl border border-amber-500/40 bg-amber-500/5 p-5 text-left transition hover:border-amber-400 hover:bg-amber-500/10">
          <div className="font-display text-2xl font-bold text-amber-300">Detective</div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-smoke-200">
            <li>Search rooms closely to find hidden clues</li>
            <li>Connect evidence yourself on the board</li>
            <li>Suspects need pressure or trust before they crack</li>
            <li>Clues start vague — ask twice for the exact step</li>
            <li>Three wrong accusations and the case is taken off you</li>
          </ul>
        </button>
      </div>
      <p className="mt-4 text-xs text-smoke-400">You can switch any time in Settings.</p>
    </Modal>
  );
}

/** Floating "Ask for a clue" button with Sergeant Kane's answer. */
export function ClueButton({ className = "" }: { className?: string }) {
  const { state, mutate, settings } = useGame();
  const [clue, setClue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!state || state.status !== "active") return null;
  const ask = async () => {
    setLoading(true);
    const r = await mutate<{ text: string }>("POST", "/clue");
    setLoading(false);
    if (r) {
      setClue(r.text);
      if (settings.voices && voiceSupported) speak(r.text, KANE, { volume: settings.voiceVolume, rate: settings.voiceRate, engine: settings.voiceEngine });
    }
  };
  return (
    <>
      <button onClick={ask} disabled={loading} className={`inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-black/80 px-4 py-2 text-sm font-semibold text-amber-300 shadow-lg backdrop-blur transition hover:bg-amber-500/15 disabled:opacity-50 ${className}`}>
        <Lightbulb size={16} />{loading ? "Thinking…" : "Ask for a clue"}
      </button>
      <AnimatePresence>
        {clue && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-24 left-1/2 z-[65] w-[min(92vw,520px)] -translate-x-1/2 md:bottom-8" role="status">
            <div className="panel-paper relative p-5 pr-10">
              <button onClick={() => setClue(null)} className="absolute right-3 top-3 text-char-600 hover:text-char-900" aria-label="Close"><X size={18} /></button>
              <div className="font-type text-xs uppercase tracking-widest text-char-500">Sgt. Kane</div>
              <p className="mt-1 font-hand text-2xl leading-snug text-char-900">{clue}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="paper" className="!bg-char-900 !text-amber-300" onClick={ask}>Another clue</Button>
                <Button size="sm" variant="paper" className="border border-char-900/20" onClick={() => setClue(null)}>Got it</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** "I give up": reveals the solution after confirmation. */
export function GiveUpButton({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const { state, mutate, go } = useGame();
  const [open, setOpen] = useState(false);
  if (!state || state.status !== "active") return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className={`inline-flex items-center gap-2 text-sm text-smoke-400 transition hover:text-blood-400 ${className}`}>
        <Flag size={15} />{compact ? "Give up" : "I give up"}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Give up and see the solution?">
        <p className="text-smoke-200">You'll see who did it and how, and the case will be closed without credit. You can restart it afterwards from Case Files.</p>
        {state.mode !== "easy" && <p className="mt-3 text-sm text-emerald-300">Tip: you could also switch to Easy mode in Settings, or use "Ask for a clue".</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="danger" onClick={async () => { await mutate("POST", "/abandon"); setOpen(false); go("resolution"); }}>Yes — show me the solution</Button>
          <Button variant="ghost" onClick={() => setOpen(false)}>Keep investigating</Button>
        </div>
      </Modal>
    </>
  );
}
