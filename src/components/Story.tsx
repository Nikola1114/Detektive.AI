/** Story mode: plays each chapter's cutscene once, and shows the chapter's objectives. */
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronDown, Circle, Clapperboard, Film } from "lucide-react";
import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext";
import { CinematicPlayer } from "./CinematicPlayer";

const REPLAY = "story:replay";
const seenKey = (caseId: string, startedAt: number) => `bw.story.${caseId}.${startedAt}`;

function readSeen(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? "[]"); } catch { return []; }
}
function markSeen(key: string, id: string) {
  try { localStorage.setItem(key, JSON.stringify([...new Set([...readSeen(key), id])])); } catch { /* private mode: it just plays again */ }
}

export function replayChapter() {
  window.dispatchEvent(new Event(REPLAY));
}

/** Mounted once at the top of the app. */
export function StoryDirector() {
  const { state, route } = useGame();
  const [playing, setPlaying] = useState<string | null>(null);
  const story = state?.mode === "story" && state.status === "active" ? state.story : undefined;
  const key = state ? seenKey(state.caseId, state.startedAt) : "";
  const inCase = !["welcome", "cases", "resolution", "settings", "profile"].includes(route.name);

  useEffect(() => {
    if (story && inCase && !playing && !readSeen(key).includes(story.id)) setPlaying(story.id);
  }, [story?.id, inCase, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onReplay = () => story && setPlaying(story.id);
    window.addEventListener(REPLAY, onReplay);
    return () => window.removeEventListener(REPLAY, onReplay);
  }, [story]);

  if (!state || !story || playing !== story.id) return null;
  return <CinematicPlayer shots={story.intro} cast={state.suspects} onDone={() => { markSeen(key, story.id); setPlaying(null); }} />;
}

/** The current chapter and its checklist. `compact` collapses it to a pill (mobile, interrogation). */
export function StoryBar({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  const { state } = useGame();
  const [open, setOpen] = useState(!compact);
  const story = state?.mode === "story" && state.status === "active" ? state.story : undefined;
  if (!story) return null;
  const done = story.objectives.filter((o) => o.done).length;
  return (
    <div className={`rounded-lg border border-amber-500/25 bg-black/70 backdrop-blur ${className}`}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left" aria-expanded={open}>
        <Clapperboard size={15} className="shrink-0 text-amber-400" />
        <span className="min-w-0 flex-1">
          <span className="block whitespace-nowrap text-[0.6rem] uppercase tracking-[0.15em] text-amber-400/80">Chapter {story.index + 1} / {story.total}</span>
          <span className="block truncate font-display text-sm font-bold text-paper-100">{story.title}</span>
        </span>
        <span className="text-[0.7rem] text-smoke-400">{done}/{story.objectives.length}</span>
        <ChevronDown size={14} className={`text-smoke-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <ul className="space-y-1.5 px-3 pb-2">
              {story.objectives.map((o) => (
                <li key={o.text} className={`flex items-start gap-2 text-xs leading-snug ${o.done ? "text-smoke-500 line-through" : "text-smoke-100"}`}>
                  {o.done ? <CheckCircle2 size={14} className="mt-px shrink-0 text-emerald-400" /> : <Circle size={14} className="mt-px shrink-0 text-amber-400/70" />}
                  {o.text}
                </li>
              ))}
            </ul>
            <button onClick={replayChapter} className="flex w-full items-center gap-1.5 border-t border-white/5 px-3 py-1.5 text-[0.7rem] text-smoke-400 hover:text-amber-300">
              <Film size={12} />Replay chapter scene
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
