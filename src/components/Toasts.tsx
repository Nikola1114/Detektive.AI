/** Feedback overlay: clue discoveries, new leads, deductions, achievements. */
import { AnimatePresence, motion } from "framer-motion";
import { Award, Lightbulb, MapPin, Search, Sparkles, TriangleAlert, Info, ChevronsUp } from "lucide-react";
import { useGame, type Toast } from "../game/GameContext";

export function Toasts() {
  const { toasts, dismiss } = useGame();
  const big = toasts.filter((t) => t.kind === "deduction" || t.kind === "contradiction" || t.kind === "rank");
  const small = toasts.filter((t) => !big.includes(t));
  return (
    <>
      <div className="pointer-events-none fixed right-3 top-3 z-[70] flex w-[min(92vw,300px)] flex-col gap-2 md:bottom-4 md:top-auto" aria-live="polite">
        <AnimatePresence initial={false}>
          {small.slice(-4).map((t) => <SmallToast key={t.id} t={t} onClose={() => dismiss(t.id)} />)}
        </AnimatePresence>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex flex-col items-center gap-3 px-4" aria-live="assertive">
        <AnimatePresence>
          {big.slice(-1).map((t) => (
            <motion.button
              key={t.id}
              onClick={() => dismiss(t.id)}
              initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
              className={`pointer-events-auto w-full max-w-lg overflow-hidden rounded-lg border text-left shadow-2xl ${t.kind === "contradiction" ? "border-blood-500/60 bg-gradient-to-br from-[#2a1212] to-char-900" : "border-amber-500/50 bg-gradient-to-br from-[#2a2114] to-char-900"}`}
            >
              <div className="flex items-start gap-4 p-5">
                <div className={`mt-1 rounded-full p-2 ${t.kind === "contradiction" ? "bg-blood-500/20 text-blood-400" : "bg-amber-500/20 text-amber-300"}`}>
                  {t.kind === "contradiction" ? <TriangleAlert size={22} /> : t.kind === "rank" ? <ChevronsUp size={22} /> : <Lightbulb size={22} />}
                </div>
                <div>
                  <div className={`label-caps ${t.kind === "contradiction" ? "!text-blood-400" : "!text-amber-400"}`}>
                    {t.kind === "contradiction" ? "Contradiction exposed" : t.kind === "rank" ? "Promotion" : "New deduction"}
                  </div>
                  <div className="font-display text-xl font-bold text-paper-100">{t.kind === "rank" ? `You are now: ${t.title}` : t.title}</div>
                  {t.text && <p className="mt-1 text-sm text-smoke-200">{t.text}</p>}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function SmallToast({ t, onClose }: { t: Toast; onClose: () => void }) {
  const cfg = {
    discovery: { icon: <Search size={16} />, label: "Evidence collected", cls: "border-amber-500/40 text-amber-300" },
    unlock: { icon: <MapPin size={16} />, label: "New lead", cls: "border-emerald-500/40 text-emerald-300" },
    xp: { icon: <Sparkles size={16} />, label: "", cls: "border-white/10 text-amber-200" },
    achievement: { icon: <Award size={16} />, label: "Achievement unlocked", cls: "border-amber-300/60 text-amber-200" },
    error: { icon: <TriangleAlert size={16} />, label: "", cls: "border-blood-500/50 text-blood-400" },
    info: { icon: <Info size={16} />, label: "", cls: "border-steel-500/40 text-steel-300" },
  }[t.kind as "discovery"] ?? { icon: <Info size={16} />, label: "", cls: "border-white/10 text-smoke-200" };
  return (
    <motion.button
      layout
      onClick={onClose}
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      className={`pointer-events-auto flex items-center gap-3 rounded-lg border bg-char-900/95 px-3 py-2 text-left shadow-card backdrop-blur ${cfg.cls}`}
    >
      {cfg.icon}
      <div className="min-w-0">
        {cfg.label && <div className="text-[0.6rem] font-semibold uppercase tracking-widest opacity-80">{cfg.label}</div>}
        <div className="truncate text-sm font-semibold text-paper-100">{t.title}</div>
      </div>
    </motion.button>
  );
}
