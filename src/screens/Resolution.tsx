import { AnimatePresence, motion } from "framer-motion";
import { Award, ChevronLeft, ChevronRight, FastForward, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { Resolution as Res } from "../../shared/api";
import { api } from "../api";
import { Button } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

const VERDICT: Record<string, string> = {
  solved: "Case Solved", incomplete: "Correct Suspect — Incomplete Reasoning", incorrect: "Incorrect Accusation", insufficient: "Insufficient Evidence",
};

export function Resolution() {
  const { state, caseId, go, profile, startCase } = useGame();
  const [res, setRes] = useState<Res | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [i, setI] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!caseId) return;
    api<Res>("GET", `/api/cases/${caseId}/resolution`).then(setRes).catch((e) => setError(e.message));
  }, [caseId, state?.status]);

  if (!state) return <NoCase />;
  if (error || !res) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-smoke-300">{error ?? "Loading the case file…"}</p>
        <Button onClick={() => go("office")}>Back to the office</Button>
      </div>
    );
  }

  const scene = res.scenes[i];
  const headline = res.status === "abandoned" ? "Case Abandoned" : res.status === "failed" ? "Case Taken Off Your Desk" : VERDICT[res.verdict ?? "solved"];
  const won = res.status === "solved";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="rain" />
      <div className="vignette" />
      {!finished ? (
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center p-6">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.7 }} className="max-w-2xl text-center">
              {scene.time && <div className="font-type text-lg text-amber-400">{scene.time}</div>}
              <h2 className="mt-1 font-display text-4xl font-bold text-paper-100 sm:text-5xl">{scene.heading}</h2>
              <p className="mt-6 text-lg leading-relaxed text-smoke-100">{scene.text}</p>
            </motion.div>
          </AnimatePresence>
          <div className="mt-12 flex items-center gap-3">
            <Button variant="ghost" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0} aria-label="Previous"><ChevronLeft size={18} /></Button>
            <span className="text-xs text-smoke-400">{i + 1} / {res.scenes.length}</span>
            {i < res.scenes.length - 1
              ? <Button variant="outline" onClick={() => setI((x) => x + 1)}>Continue<ChevronRight size={16} /></Button>
              : <Button variant="primary" onClick={() => setFinished(true)}>Close the file<ChevronRight size={16} /></Button>}
            <Button variant="ghost" onClick={() => setFinished(true)}><FastForward size={15} />Skip</Button>
          </div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto max-w-5xl p-6">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="label-caps">{state.subtitle} · {res.title}</div>
            <h1 className={`mt-2 font-display text-5xl font-extrabold ${won ? "text-amber-300" : "text-paper-100"}`}>{headline}</h1>
            <p className="mt-3 text-lg text-smoke-200">The killer was <span className="font-semibold text-paper-100">{res.culprit.name}</span>.</p>
          </motion.div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Clues found", `${res.stats.cluesFound}/${res.stats.cluesTotal}`],
              ["Deductions", `${res.stats.deductions}/${res.stats.deductionTotal}`],
              ["Contradictions", `${res.stats.contradictions}`],
              ["Accusations", `${res.stats.accusations}`],
              ["Clues asked for", `${res.stats.hints}${res.stats.mode === "easy" ? " · Easy" : ""}`],
            ].map(([k, v]) => (
              <div key={k} className="panel p-3 text-center"><div className="font-display text-2xl font-bold text-paper-100">{v}</div><div className="text-[0.65rem] uppercase tracking-wider text-smoke-400">{k}</div></div>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="mb-3 font-display text-2xl text-paper-100">What everyone was hiding</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {res.truths.map((t) => (
                <div key={t.suspect} className={`panel p-4 ${t.suspect === res.culprit.name ? "border-blood-500/40" : ""}`}>
                  <div className={`font-display text-lg ${t.suspect === res.culprit.name ? "text-blood-400" : "text-paper-100"}`}>{t.suspect}{t.suspect === res.culprit.name ? " — the killer" : ""}</div>
                  <p className="mt-1 text-sm leading-relaxed text-smoke-200">{t.text}</p>
                </div>
              ))}
            </div>
          </section>

          {profile && (
            <section className="mt-8 panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="label-caps">Detective rank</div>
                  <div className="font-display text-2xl text-amber-300">{profile.rank}</div>
                  <div className="text-sm text-smoke-400">{profile.xp} XP{profile.nextRank ? ` · ${profile.nextRank.xp - profile.xp} to ${profile.nextRank.title}` : ""}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.achievements.filter((a) => a.unlockedAt).map((a) => (
                    <span key={a.id} className="flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"><Award size={13} />{a.title}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3 pb-10">
            <Button variant="primary" onClick={() => go("cases")}>Case files</Button>
            <Button onClick={() => go("profile")}>Detective profile</Button>
            <Button variant="ghost" onClick={() => { setFinished(false); setI(0); }}>Replay the reveal</Button>
            <Button variant="ghost" onClick={async () => { if (caseId && (await startCase(caseId, { reset: true }))) go("office?briefing"); }}><RotateCcw size={15} />Restart this case</Button>
          </div>
        </div>
      )}
    </div>
  );
}
