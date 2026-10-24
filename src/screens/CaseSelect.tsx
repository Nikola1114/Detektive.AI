import { motion } from "framer-motion";
import { ArrowLeft, FolderOpen, Sparkles, Wand2 } from "lucide-react";
import { useState } from "react";
import type { CaseSummary } from "../../shared/api";
import { api } from "../api";
import { Badge, Button, SectionTitle } from "../components/ui";
import type { GameMode } from "../../shared/api";
import { ModePicker } from "../components/CaseHelp";
import { useGame } from "../game/GameContext";

const SETTINGS = [
  { id: "small-town", label: "Small-town murder mystery" },
  { id: "hotel", label: "Luxury hotel disappearance" },
  { id: "museum", label: "Art museum theft" },
  { id: "missing", label: "Missing-person investigation" },
  { id: "espionage", label: "Corporate espionage" },
  { id: "inheritance", label: "Inheritance dispute" },
  { id: "historical", label: "Historical mystery (1920s)" },
];

const DIFFICULTY = [
  { id: "Beginner", desc: "3 suspects · 3 locations · 10–15 clues" },
  { id: "Intermediate", desc: "5 suspects · 5 locations · 20–30 clues" },
  { id: "Expert", desc: "7–10 suspects · 6+ locations · 35+ clues" },
];

export function CaseSelect() {
  const { cases, startCase, go, refreshCases, notify, caseId } = useGame();
  const [setting, setSetting] = useState(SETTINGS[0].id);
  const [difficulty, setDifficulty] = useState("Beginner");
  const [generating, setGenerating] = useState(false);

  const [picking, setPicking] = useState<CaseSummary | null>(null);
  const begin = async (c: CaseSummary, mode?: GameMode) => {
    setPicking(null);
    if (await startCase(c.id, { mode })) go(c.status === "new" ? (mode === "story" ? "office" : "office?briefing") : c.status === "active" ? "office" : "resolution");
  };
  const open = (c: CaseSummary) => (c.status === "new" ? setPicking(c) : void begin(c));

  const generate = async () => {
    setGenerating(true);
    try {
      const r = await api<{ caseId: string }>("POST", "/api/generate", { setting, difficulty });
      await refreshCases();
      notify("unlock", "New case file generated");
      setPicking({ id: r.caseId, status: "new" } as CaseSummary);
    } catch (e) {
      notify("error", (e as Error).message);
    } finally { setGenerating(false); }
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-4 sm:p-8">
      <button onClick={() => go(caseId ? "office" : "welcome")} className="mb-6 inline-flex items-center gap-2 text-sm text-smoke-400 hover:text-white"><ArrowLeft size={16} />Back</button>
      <SectionTitle kicker="Archive" title="Case Files" />

      <div className="grid gap-4 md:grid-cols-2">
        {cases.map((c, i) => (
          <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => open(c)}
            className="panel-paper group relative overflow-hidden p-6 text-left transition hover:-translate-y-0.5">
            <div className="absolute right-4 top-4">
              <span className={`stamp ${c.status === "solved" ? "border-emerald-700 text-emerald-700" : c.status === "new" ? "border-char-500 text-char-500" : c.status === "active" ? "border-blood-600 text-blood-600" : "border-amber-700 text-amber-700"}`}>
                {c.status === "new" ? "Unopened" : c.status === "active" ? "In progress" : c.status}
              </span>
            </div>
            <div className="font-type text-xs uppercase tracking-widest text-char-500">{c.subtitle} · {c.setting}{c.generated ? " · generated" : ""}</div>
            <h2 className="mt-1 font-display text-2xl font-bold text-char-900">{c.title}</h2>
            <p className="mt-2 max-w-md font-type text-sm leading-relaxed text-char-700">{c.synopsis}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-type text-xs text-char-600">Difficulty: {c.difficulty}</span>
              {c.status !== "new" && <span className="font-type text-xs text-char-600">· {Math.round(c.progress * 100)}% of clues found</span>}
            </div>
            <div className="mt-4 inline-flex items-center gap-2 font-type text-sm text-char-900 group-hover:underline"><FolderOpen size={15} />{c.status === "new" ? "Open case file" : c.status === "active" ? "Resume" : "Review"}</div>
          </motion.button>
        ))}
      </div>

      <ModePicker open={Boolean(picking)} onClose={() => setPicking(null)} onPick={(m) => picking && void begin(picking, m)} />
      <section className="panel mt-8 p-6" aria-labelledby="gen-title">
        <div className="flex flex-wrap items-center gap-3">
          <Wand2 className="text-amber-400" />
          <h2 id="gen-title" className="font-display text-2xl text-paper-100">Case Generator</h2>
          <Badge tone="amber">Experimental</Badge>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-smoke-300">Generate a new investigation. Every generated case has its solution fixed before you begin, and must pass the same consistency checks as Case 001 — reachable evidence, a consistent timeline and exactly one culprit — before it is playable.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div>
            <div className="label-caps mb-2">Setting</div>
            <div className="flex flex-col gap-1.5">
              {SETTINGS.map((s) => (
                <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${setting === s.id ? "border-amber-400 bg-amber-500/10 text-amber-200" : "border-white/10 text-smoke-200 hover:border-amber-500/30"}`}>
                  <input type="radio" name="setting" className="accent-amber-500" checked={setting === s.id} onChange={() => setSetting(s.id)} />{s.label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="label-caps mb-2">Difficulty</div>
            <div className="flex flex-col gap-1.5">
              {DIFFICULTY.map((d) => (
                <label key={d.id} className={`flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm ${difficulty === d.id ? "border-amber-400 bg-amber-500/10 text-amber-200" : "border-white/10 text-smoke-200 hover:border-amber-500/30"}`}>
                  <input type="radio" name="difficulty" className="accent-amber-500" checked={difficulty === d.id} onChange={() => setDifficulty(d.id)} />
                  <span><span className="font-semibold">{d.id}</span><span className="block text-xs text-smoke-400">{d.desc}</span></span>
                </label>
              ))}
            </div>
            <Button variant="primary" className="mt-5 w-full" onClick={generate} disabled={generating}><Sparkles size={16} />{generating ? "Building and verifying the case…" : "Generate case"}</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
