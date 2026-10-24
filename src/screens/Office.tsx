import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Gavel, Map as MapIcon, MessageSquareQuote, Network, Search, TriangleAlert, Users, Flag } from "lucide-react";
import { useEffect, useState } from "react";
import { GameLayout } from "../components/GameLayout";
import { Portrait } from "../components/Portrait";
import { MoodTag } from "../components/bits";
import { Button, Modal } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

export function Office() {
  const { state, go, route, mutate, profile } = useGame();
  const [briefing, setBriefing] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);

  useEffect(() => {
    if (window.location.hash.includes("briefing")) { setBriefing(true); window.history.replaceState(null, "", "#/office"); }
  }, [route]);

  if (!state) return <NoCase />;
  const loc = state.locations.find((l) => l.id === state.currentLocation);
  const latestNotes = [...state.notes].reverse().slice(0, 3);
  const closed = state.status !== "active";

  return (
    <GameLayout active="office">
      <div className="relative min-h-screen overflow-hidden">
        {/* office ambience: window, rain, lamp light */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden opacity-60">
          <div className="absolute inset-0 bg-gradient-to-b from-navy-800 to-transparent" />
          <div className="rain" />
        </div>
        <div className="pointer-events-none absolute -left-40 top-40 h-[600px] w-[600px] rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="label-caps">{state.subtitle} · {state.setting} · {state.date}</div>
              <h1 className="font-display text-4xl font-extrabold text-paper-100 sm:text-5xl">{state.title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`stamp ${closed ? "border-amber-400 text-amber-400" : "border-blood-500 text-blood-400"}`}>{closed ? `Case ${state.status}` : "Open investigation"}</span>
            </div>
          </header>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Case file */}
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="panel-paper relative overflow-hidden p-6 lg:col-span-2" aria-label="Case file">
              <div className="absolute -right-6 top-6 rotate-12 border-4 border-blood-500/50 px-4 py-1 font-type text-2xl text-blood-500/50">HOMICIDE</div>
              <div className="font-type text-xs uppercase tracking-widest text-char-500">Blackwood City Police Dept. — Case File</div>
              <h2 className="mt-1 font-display text-2xl font-bold text-char-900">Victim: {state.victim.name}, {state.victim.age}</h2>
              <p className="mt-1 max-w-xl font-type text-sm text-char-700">{state.victim.description}</p>
              <p className="mt-4 max-w-2xl font-type text-[0.95rem] leading-relaxed text-char-800">{state.synopsis}</p>

              <div className="mt-6 rounded border border-char-900/10 bg-white/40 p-4">
                <div className="font-hand text-xl text-char-700">Sgt. Kane's note:</div>
                <p className="font-hand text-xl leading-snug text-char-900">"{state.hint}"</p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!closed ? (
                  <Button variant="primary" size="lg" onClick={() => go(`scene/${state.currentLocation}`)}>
                    Continue Investigation <ArrowRight size={18} />
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" onClick={() => go("resolution")}>Review the case outcome <ArrowRight size={18} /></Button>
                )}
                <span className="font-type text-sm text-char-600">{closed ? "" : `Last position: ${loc?.name ?? "—"}`}</span>
                <button onClick={() => setBriefing(true)} className="ml-auto font-type text-sm text-char-700 underline decoration-dotted underline-offset-4 hover:text-char-900">Reread briefing</button>
              </div>
            </motion.section>

            {/* Status */}
            <section className="panel flex flex-col gap-4 p-5" aria-label="Investigation status">
              <div className="label-caps">Investigation status</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat icon={<Search size={16} />} value={`${state.cluesFound}/${state.evidenceTotal}`} label="Clues" sub={`${state.evidence.length - state.cluesFound} statements`} />
                <Stat icon={<Network size={16} />} value={`${state.deductions.length}`} label="Deductions" />
                <Stat icon={<TriangleAlert size={16} />} value={`${state.contradictionsFound}`} label="Contradictions" />
              </div>
              <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm">
                <div className="flex justify-between"><span className="text-smoke-400">Locations unlocked</span><span>{state.locations.filter((l) => l.unlocked).length}/{state.locations.length}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-smoke-400">Suspects interviewed</span><span>{state.suspects.filter((s) => s.interviewed).length}/{state.suspects.length}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-smoke-400">Accusations left</span><span>{state.accusation.attemptsLeft}</span></div>
                <div className="mt-1 flex justify-between"><span className="text-smoke-400">Your rank</span><span className="text-amber-300">{profile?.rank}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => go("map")}><MapIcon size={16} />City map</Button>
                <Button onClick={() => go("board")}><Network size={16} />Board</Button>
                <Button onClick={() => go("notebook")}><BookOpen size={16} />Notebook</Button>
                <Button onClick={() => go("accuse")} disabled={closed}><Gavel size={16} />Accuse</Button>
              </div>
            </section>

            {/* Suspects */}
            <section className="panel p-5 lg:col-span-2" aria-label="Suspect database">
              <div className="mb-3 flex items-center justify-between">
                <div className="label-caps flex items-center gap-2"><Users size={14} />Persons of interest</div>
                <button onClick={() => go("interrogate")} className="text-xs text-amber-300 hover:underline">Open suspect database →</button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {state.suspects.map((s) => (
                  <button key={s.id} onClick={() => go(`interrogate/${s.id}`)} className="group flex flex-col justify-start rounded-lg border border-white/5 bg-black/20 p-2 text-left transition hover:border-amber-500/40">
                    <div className="overflow-hidden rounded"><Portrait spec={s.portrait} mood={s.mood} size={160} className="h-auto w-full transition group-hover:scale-105" name={s.name} /></div>
                    <div className="mt-2 text-sm font-semibold leading-tight text-paper-100">{s.name}</div>
                    <div className="text-[0.7rem] text-smoke-400">{s.relation}</div>
                    <div className="mt-1">{s.interviewed ? <MoodTag mood={s.mood} /> : <span className="text-[0.7rem] text-smoke-500">Not yet interviewed</span>}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Notebook preview */}
            <section className="panel-paper lined p-5" aria-label="Notebook">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-type text-xs uppercase tracking-widest text-char-600">Notebook</div>
                <button onClick={() => go("notebook")} className="font-type text-xs text-char-700 hover:underline">Open →</button>
              </div>
              {latestNotes.length === 0 ? (
                <p className="font-hand text-xl text-char-600">Nothing yet. Every discovery and deduction will be written down here.</p>
              ) : latestNotes.map((n) => (
                <p key={n.id} className="mb-2 line-clamp-3 font-hand text-lg leading-[28px] text-char-900">
                  <MessageSquareQuote size={13} className="mr-1 inline text-char-500" />{n.text}
                </p>
              ))}
            </section>
          </div>

          {!closed && (
            <div className="mt-6 text-right">
              <button onClick={() => setAbandonOpen(true)} className="inline-flex items-center gap-2 text-xs text-smoke-500 hover:text-blood-400"><Flag size={13} />Abandon case and reveal the solution</button>
            </div>
          )}
        </div>
      </div>

      <Modal open={briefing} onClose={() => setBriefing(false)} title={`${state.subtitle}: ${state.title}`} wide labelledBy="brief-title">
        <div className="space-y-4">
          {state.briefing.map((p, i) => (
            <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.6 }} className={`typewriter ${i === 0 ? "text-amber-300" : "text-smoke-100"}`}>{p}</motion.p>
          ))}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + state.briefing.length * 0.6 }} className="flex flex-wrap gap-3 pt-2">
            <Button variant="primary" onClick={() => { setBriefing(false); go(`scene/${state.currentLocation}`); }}>Go to the crime scene <ArrowRight size={16} /></Button>
            <Button onClick={() => setBriefing(false)}>Stay in the office</Button>
          </motion.div>
        </div>
      </Modal>

      <Modal open={abandonOpen} onClose={() => setAbandonOpen(false)} title="Abandon the case?">
        <p className="text-smoke-200">The solution will be revealed and the case closed without credit. This can't be undone (though you can restart the case from Case Files).</p>
        <div className="mt-5 flex gap-3">
          <Button variant="danger" onClick={async () => { await mutate("POST", "/abandon"); setAbandonOpen(false); go("resolution"); }}>Abandon and reveal</Button>
          <Button variant="ghost" onClick={() => setAbandonOpen(false)}>Keep investigating</Button>
        </div>
      </Modal>
    </GameLayout>
  );
}

function Stat({ icon, value, label, sub }: { icon: React.ReactNode; value: string; label: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
      <div className="flex justify-center text-amber-400">{icon}</div>
      <div className="font-display text-2xl font-bold text-paper-100">{value}</div>
      <div className="text-[0.62rem] uppercase tracking-wider text-smoke-400">{label}</div>
      {sub && <div className="text-[0.6rem] text-smoke-500">{sub}</div>}
    </div>
  );
}
