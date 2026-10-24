import { AnimatePresence, motion } from "framer-motion";
import { Bot, FileSearch, Info, Send, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { InterrogateResult } from "../../shared/api";
import { audio } from "../audio";
import { GameLayout } from "../components/GameLayout";
import { Portrait } from "../components/Portrait";
import { EvidenceCard, MoodTag } from "../components/bits";
import { Badge, Button, Meter, Modal } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

export function Interrogation() {
  const { state, route, go, mutate, info, busy } = useGame();
  const [text, setText] = useState("");
  const [presentOpen, setPresentOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [lastEngine, setLastEngine] = useState<"authored" | "ai" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const suspect = state?.suspects.find((s) => s.id === route.param) ?? null;

  useEffect(() => { audio.setAmbience("interrogation"); return () => audio.setAmbience("office"); }, []);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [suspect?.history.length, thinking]);

  if (!state) return <NoCase />;
  const closed = state.status !== "active";

  const send = async (body: { topicId?: string; text?: string; evidenceId?: string }) => {
    if (!suspect || thinking) return;
    setThinking(true);
    const r = await mutate<InterrogateResult>("POST", `/interrogate/${suspect.id}`, body);
    setThinking(false);
    if (r) setLastEngine(r.engine);
  };

  return (
    <GameLayout active="interrogate">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 p-3 sm:p-6 lg:h-screen lg:flex-row">
        {/* Suspect list */}
        <aside className="panel shrink-0 p-3 lg:w-60 lg:overflow-y-auto" aria-label="Suspects">
          <div className="label-caps mb-2 px-1">Suspect database</div>
          <div className="flex gap-2 overflow-x-auto lg:flex-col">
            {state.suspects.map((s) => (
              <button key={s.id} onClick={() => go(`interrogate/${s.id}`)} aria-current={suspect?.id === s.id}
                className={`flex shrink-0 items-center gap-3 rounded-lg border p-2 text-left transition ${suspect?.id === s.id ? "border-amber-500/50 bg-amber-500/10" : "border-transparent hover:bg-white/5"}`}>
                <Portrait spec={s.portrait} mood={s.mood} size={40} className="rounded" name={s.name} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-paper-100">{s.name}</div>
                  <div className="text-[0.7rem]">{s.interviewed ? <MoodTag mood={s.mood} /> : <span className="text-smoke-500">Not interviewed</span>}</div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {!suspect ? (
          <section className="panel flex flex-1 flex-col items-center justify-center p-10 text-center">
            <UserRound size={42} className="text-smoke-500" />
            <h1 className="mt-3 font-display text-2xl text-paper-100">Interrogation Room</h1>
            <p className="mt-2 max-w-md text-smoke-300">Choose a person of interest. Ask questions in your own words or pick a suggested line, and present evidence to test their story. Demeanour is a cue — not proof.</p>
          </section>
        ) : (
          <>
            {/* Conversation */}
            <section className="panel flex min-h-[70vh] flex-1 flex-col overflow-hidden lg:min-h-0" aria-label={`Interview with ${suspect.name}`}>
              <div className="relative flex items-center gap-4 border-b border-white/5 bg-gradient-to-r from-black/40 to-transparent p-4">
                <div className="pointer-events-none absolute left-6 top-0 h-full w-40 bg-amber-400/10 blur-2xl" />
                <motion.div key={suspect.id + suspect.mood} initial={{ opacity: 0.6, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                  <Portrait spec={suspect.portrait} mood={suspect.mood} size={86} className="rounded-md shadow-card" name={suspect.name} />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-2xl font-bold text-paper-100">{suspect.name}</h1>
                  <div className="text-sm text-smoke-400">{suspect.profession}</div>
                  <div className="mt-1.5 flex items-center gap-3"><MoodTag mood={suspect.mood} /></div>
                </div>
                <div className="hidden w-40 flex-col gap-2 sm:flex">
                  <Meter label="Stress" value={suspect.stress} tone="red" />
                  <Meter label="Trust" value={suspect.trust} tone="blue" />
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
                <p className="text-center text-xs italic text-smoke-500">{suspect.name.split(" ")[0]} sits down across the table.</p>
                <Bubble role="suspect" text={suspect.greeting} />
                {suspect.history.map((m, i) => <Bubble key={i} role={m.role} text={m.text} evidence={Boolean(m.evidenceId)} />)}
                <AnimatePresence>{thinking && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm italic text-smoke-400">{suspect.name.split(" ")[0]} considers the question…</motion.div>}</AnimatePresence>
              </div>

              {!closed ? (
                <div className="border-t border-white/5 p-3">
                  <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                    {suspect.suggestions.map((q) => (
                      <button key={q.id} onClick={() => send({ topicId: q.id })} disabled={thinking}
                        className={`shrink-0 rounded-full border px-3 py-1 text-xs transition ${q.asked ? "border-white/10 text-smoke-400 hover:text-smoke-200" : "border-amber-500/40 text-amber-200 hover:bg-amber-500/10"}`}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                  <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { void send({ text }); setText(""); } }}>
                    <Button type="button" onClick={() => setPresentOpen(true)} disabled={thinking || state.evidence.length === 0} title="Present evidence"><FileSearch size={16} /><span className="hidden sm:inline">Present evidence</span></Button>
                    <label htmlFor="ask" className="sr-only">Ask a question</label>
                    <input id="ask" value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder={`Ask ${suspect.name.split(" ")[0]} anything…`}
                      className="min-w-0 flex-1 rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-paper-100 placeholder:text-smoke-500 focus:border-amber-500/50 focus:outline-none" />
                    <Button type="submit" variant="primary" disabled={thinking || busy || !text.trim()} aria-label="Ask"><Send size={16} /></Button>
                  </form>
                  <div className="mt-2 flex items-center gap-1.5 text-[0.68rem] text-smoke-500">
                    {info?.aiDialogue ? <><Bot size={12} />Natural-language dialogue by AI, grounded in the case facts{lastEngine === "authored" ? " (authored fallback used for the last reply)" : ""}.</> : <><Info size={12} />Authored dialogue engine: free-text questions are matched to what this character knows.</>}
                  </div>
                </div>
              ) : <div className="border-t border-white/5 p-4 text-center text-sm text-smoke-400">The case is closed. The transcript is preserved.</div>}
            </section>

            {/* Dossier */}
            <aside className="panel shrink-0 p-4 lg:w-72 lg:overflow-y-auto" aria-label="Dossier">
              <div className="label-caps mb-2">Dossier</div>
              <dl className="space-y-2.5 text-sm">
                <Row k="Age / height" v={`${suspect.age} · ${suspect.height}`} />
                <Row k="Relationship" v={suspect.relation} />
                <Row k="Personality" v={suspect.personality} />
                <Row k="Background" v={suspect.bio} />
                <Row k="Possible motive" v={suspect.motive} />
                <Row k="Stated alibi" v={suspect.alibi} />
              </dl>
              <div className="mt-4 flex flex-col gap-2 sm:hidden">
                <Meter label="Stress" value={suspect.stress} tone="red" />
                <Meter label="Trust" value={suspect.trust} tone="blue" />
              </div>
              <div className="mt-4 rounded-md border border-white/5 bg-white/[0.02] p-3 text-xs text-smoke-400">
                <Badge tone="blue">Tip</Badge> Present evidence that contradicts what they've told you. Pressure raises stress; respect builds trust. Innocent people lie too.
              </div>
            </aside>
          </>
        )}
      </div>

      <Modal open={presentOpen} onClose={() => setPresentOpen(false)} title="Present evidence" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {state.evidence.map((e) => (
            <EvidenceCard key={e.id} e={e} compact onClick={() => { setPresentOpen(false); void send({ evidenceId: e.id }); }} />
          ))}
        </div>
      </Modal>
    </GameLayout>
  );
}

function Bubble({ role, text, evidence }: { role: string; text: string; evidence?: boolean }) {
  const player = role === "player";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${player ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${player ? (evidence ? "border border-amber-500/40 bg-amber-500/10 font-type text-amber-200" : "bg-navy-700/80 text-paper-100") : "border border-white/5 bg-black/40 text-smoke-100"}`}>
        {text}
      </div>
    </motion.div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div><dt className="text-[0.65rem] uppercase tracking-wider text-smoke-500">{k}</dt><dd className="text-smoke-200">{v}</dd></div>;
}
