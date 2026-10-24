/**
 * Interrogation room. Monochrome, cinematic: the suspect sits across the table,
 * replies appear in speech bubbles with a line of body language, questions are
 * listed on the left, and other suspects wait on the right. Suspects speak
 * aloud and the player can answer by microphone (browser speech APIs).
 */
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Bot, FileSearch, Mic, MicOff, ScrollText, Send, Volume2, VolumeX, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InterrogateResult, SuspectView } from "../../shared/api";
import { audio } from "../audio";
import { InterrogationRoom, bodyLanguage } from "../components/InterrogationRoom";
import { Portrait } from "../components/Portrait";
import { EvidenceCard } from "../components/bits";
import { Modal } from "../components/ui";
import { ClueButton } from "../components/CaseHelp";
import { useGame } from "../game/GameContext";
import { listen, loadNeuralVoices, micSupported, neural, neuralSupported, onNeuralChange, speak, stopSpeaking, voiceSupported, type Listener } from "../voice";
import { NoCase } from "./NoCase";

export function Interrogation() {
  const { state, route, go } = useGame();
  useEffect(() => { audio.setAmbience("interrogation"); return () => { stopSpeaking(); audio.setAmbience("office"); }; }, []);
  if (!state) return <NoCase />;
  const suspect = state.suspects.find((s) => s.id === route.param) ?? null;
  return suspect ? <Room key={suspect.id} suspect={suspect} /> : <LineUp onPick={(id) => go(`interrogate/${id}`)} />;
}

/** Choosing who to question. */
function LineUp({ onPick }: { onPick: (id: string) => void }) {
  const { state, go } = useGame();
  return (
    <div className="relative min-h-screen bg-black">
      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        <button onClick={() => go("office")} className="font-story mb-6 inline-flex items-center gap-2 text-lg text-smoke-300 hover:text-white"><ArrowLeft size={18} />Back to the office</button>
        <h1 className="font-story text-4xl text-paper-100">Who do you want to question?</h1>
        <p className="font-story mt-2 text-lg text-smoke-400">Demeanour is a cue, not proof. Innocent people lie too.</p>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {state!.suspects.map((s) => (
            <button key={s.id} onClick={() => onPick(s.id)} className="group text-left">
              <div className="sketch-box overflow-hidden bg-[#111] p-1 transition group-hover:-translate-y-1" style={{ filter: "grayscale(1)" }}>
                <Portrait spec={s.portrait} mood={s.mood} size={220} className="h-auto w-full" name={s.name} />
              </div>
              <div className="font-story mt-3 text-xl text-paper-100">{s.name}</div>
              <div className="font-story text-smoke-400">{s.relation}</div>
              <div className="font-story text-sm italic text-smoke-500">{s.interviewed ? `Last seen: ${s.mood}` : "Not yet questioned"}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Room({ suspect }: { suspect: SuspectView }) {
  const { state, go, mutate, info, settings, setSettings, notify } = useGame();
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [presentOpen, setPresentOpen] = useState(false);
  const [transcript, setTranscript] = useState(false);
  const [listening, setListening] = useState(false);
  const listener = useRef<Listener | null>(null);
  const closed = state!.status !== "active";

  const history = suspect.history;
  const lastReplyIdx = history.map((m) => m.role).lastIndexOf("suspect");
  const lastReply = lastReplyIdx >= 0 ? history[lastReplyIdx] : null;
  const lastQuestion = lastReplyIdx > 0 ? history[lastReplyIdx - 1] : null;
  const hint = history.at(-1)?.role === "system" ? history.at(-1)!.text : null;
  const replyText = lastReply?.text ?? suspect.greeting;
  const cue = useMemo(() => bodyLanguage(suspect.mood, history.length), [suspect.mood, history.length]);
  const citedTitle = lastQuestion?.evidenceId && !lastQuestion.text.startsWith("Presents evidence") ? state!.evidence.find((e) => e.id === lastQuestion.evidenceId)?.title : null;

  const say = useCallback((line: string) => {
    if (!settings.voices || !voiceSupported) return;
    speak(line, suspect.voice, { volume: settings.voiceVolume, rate: settings.voiceRate, engine: settings.voiceEngine, onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false) });
  }, [settings.voices, settings.voiceVolume, settings.voiceRate, settings.voiceEngine, suspect.voice]);

  // Greet the detective when the interview starts.
  useEffect(() => {
    if (history.length === 0) { const t = window.setTimeout(() => say(suspect.greeting), 400); return () => window.clearTimeout(t); }
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => { listener.current?.stop(); stopSpeaking(); }, []);

  const send = async (body: { topicId?: string; text?: string; evidenceId?: string }) => {
    if (thinking || closed) return;
    stopSpeaking();
    setThinking(true);
    const r = await mutate<InterrogateResult>("POST", `/interrogate/${suspect.id}`, body);
    setThinking(false);
    if (r) say(r.reply);
  };

  const toggleMic = () => {
    if (listening) { listener.current?.stop(); return; }
    setText("");
    listener.current = listen({
      onInterim: (t) => setText(t),
      onFinal: (t) => { if (settings.micAutoSend) { setText(""); void send({ text: t }); } else setText(t); },
      onError: (m) => notify("error", m),
      onEnd: () => setListening(false),
    });
    setListening(Boolean(listener.current));
  };

  const others = state!.suspects.filter((s) => s.id !== suspect.id);

  return (
    <div className="relative flex min-h-screen flex-col bg-black text-paper-100 lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* ── Questions (left) ── */}
      <section className="order-2 flex flex-col px-5 pb-28 pt-4 sm:px-8 lg:order-1 lg:w-[38%] lg:overflow-y-auto lg:pb-6 lg:pt-6" aria-label="Your questions">
        <div className="mb-4 flex items-center justify-between">
          <button onClick={() => go("interrogate")} className="font-story inline-flex items-center gap-2 text-lg text-smoke-300 hover:text-white"><ArrowLeft size={18} />Leave the room</button>
          <div className="flex items-center gap-4">
            <button onClick={() => setTranscript(true)} className="font-story inline-flex items-center gap-2 text-smoke-400 hover:text-white"><ScrollText size={16} />Transcript</button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {lastQuestion && (
            <motion.div key={lastQuestion.ts} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative mb-6 ml-4">
              <svg className="absolute -left-5 -top-3" width="48" height="34" viewBox="0 0 48 34" aria-hidden><path d="M46 30 L2 2 L26 30" fill="#000" stroke="#e6e6e6" strokeWidth="3" strokeLinejoin="round" /></svg>
              <div className="sketch-box bg-black px-6 py-4 text-center">
                <p className="font-story text-xl leading-snug text-paper-100 sm:text-2xl">{lastQuestion.text}</p>
                {citedTitle && <p className="font-story mt-2 text-sm italic text-amber-300">You confront them with: {citedTitle}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!closed ? (
          <>
            <ul className="flex flex-col">
              {suspect.suggestions.map((q) => (
                <li key={q.id}>
                  <button onClick={() => send({ topicId: q.id })} disabled={thinking}
                    className={`font-story w-full px-2 py-3 text-center text-xl leading-snug transition hover:text-white disabled:opacity-40 sm:text-[1.4rem] ${q.asked ? "text-smoke-500" : "text-paper-100"}`}>
                    {q.label}
                  </button>
                  <div className="sketch-rule mx-6" />
                </li>
              ))}
              <li>
                <button onClick={() => setPresentOpen(true)} disabled={thinking || state!.evidence.length === 0}
                  className="font-story flex w-full items-center justify-center gap-3 px-2 py-4 text-xl text-amber-300 transition hover:text-amber-200 disabled:opacity-40">
                  <FileSearch size={20} />Show them a piece of evidence…
                </button>
              </li>
            </ul>

            <form className="mt-4 lg:sticky lg:bottom-0" onSubmit={(e) => { e.preventDefault(); if (text.trim()) { void send({ text }); setText(""); } }}>
              <div className="sketch-box flex items-center gap-2 bg-black p-2">
                <label htmlFor="ask" className="sr-only">Ask your own question</label>
                <input id="ask" value={text} onChange={(e) => setText(e.target.value)} maxLength={600}
                  placeholder={listening ? "Listening…" : "Ask your own question…"}
                  className="font-story min-w-0 flex-1 bg-transparent px-2 py-1.5 text-lg text-paper-100 placeholder:text-smoke-500 focus:outline-none" />
                {micSupported && (
                  <button type="button" onClick={toggleMic} aria-pressed={listening} aria-label={listening ? "Stop listening" : "Speak your question"}
                    className={`rounded-full p-2.5 transition ${listening ? "animate-pulse bg-blood-500 text-white" : "text-smoke-200 hover:bg-white/10"}`}>
                    {listening ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>
                )}
                <button type="submit" disabled={!text.trim() || thinking} aria-label="Ask" className="rounded-full p-2.5 text-smoke-200 hover:bg-white/10 disabled:opacity-30"><Send size={20} /></button>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-smoke-500">
                {info?.aiDialogue ? <><Bot size={12} />Suspects answer in their own words (AI), grounded in the case facts.</> : <>Type or speak naturally — mention evidence you've found to confront them with it.</>}
              </p>
            </form>
          </>
        ) : <p className="font-story text-lg italic text-smoke-400">The case is closed. Open the transcript to review this interview.</p>}
      </section>

      {/* ── The room (right) ── */}
      <section className="relative order-1 w-full lg:order-2 lg:flex-1" aria-label={`Interview with ${suspect.name}`}>
        <div className="relative aspect-[4/3] w-full overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto">
        <InterrogationRoom spec={suspect.portrait} mood={suspect.mood} name={suspect.name} speaking={speaking} />
        </div>

        {/* reply bubble: below the room on phones, over it on large screens */}
        <div className="relative flex flex-col items-center px-4 pb-2 pt-5 lg:pointer-events-none lg:absolute lg:left-[5%] lg:right-[240px] lg:top-[4%] lg:p-0">
          <AnimatePresence mode="wait">
            <motion.div key={`${history.length}-${thinking}`} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-auto relative w-full max-w-[640px]">
              {!thinking && <div className="sketch-box font-story relative z-10 mb-[-6px] ml-[-4%] inline-block bg-black px-4 py-1.5 text-base italic text-paper-200 sm:text-lg">{cue}</div>}
              <div className="sketch-box relative bg-black px-5 py-4 sm:px-7 sm:py-5" aria-live="polite">
                {thinking ? (
                  <p className="font-story text-center text-2xl tracking-[0.4em] text-smoke-300">…</p>
                ) : (
                  <p className="font-story max-h-[34vh] overflow-y-auto text-center text-lg leading-snug text-paper-100 sm:text-[1.35rem]">{replyText}</p>
                )}
                {!thinking && voiceSupported && settings.voices && (
                  <button onClick={() => say(replyText)} className="absolute -bottom-3 right-4 rounded-full border-2 border-[#e6e6e6] bg-black p-1.5 text-paper-100 hover:bg-white/10" aria-label="Replay line">
                    <Volume2 size={14} className={speaking ? "animate-pulse" : ""} />
                  </button>
                )}
              </div>
              <svg className="absolute -bottom-[34px] right-[18%] hidden lg:block" width="44" height="40" viewBox="0 0 44 40" aria-hidden><path d="M4 2 L30 38 L26 2" fill="#000" stroke="#e6e6e6" strokeWidth="3" strokeLinejoin="round" /></svg>
            </motion.div>
          </AnimatePresence>
          {hint && !thinking && <p className="font-story pointer-events-auto mt-5 lg:mt-10 max-w-[560px] rounded bg-black/80 px-3 py-2 text-center text-sm italic text-amber-300">{hint}</p>}
        </div>

        {/* status column */}
        <div className="absolute right-3 top-3 max-lg:origin-top-right max-lg:scale-75 flex flex-col items-end gap-3 sm:right-5 sm:top-5">
          <div className="flex items-center gap-3">
            {voiceSupported && (
              <button onClick={() => { if (settings.voices) stopSpeaking(); setSettings({ voices: !settings.voices }); }} aria-pressed={settings.voices} aria-label={settings.voices ? "Mute voices" : "Turn voices on"} className="rounded p-1 text-smoke-300 hover:text-white">
                {settings.voices ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            )}
            <span className="led text-xl sm:text-2xl">● REC</span>
          </div>
          <StressMonitor stress={suspect.stress} trust={suspect.trust} />
          {settings.voices && settings.voiceEngine === "neural" && <VoiceStatus />}
          <div className="hidden flex-col gap-3 sm:flex" aria-label="Other suspects">
            {others.map((o) => (
              <button key={o.id} onClick={() => go(`interrogate/${o.id}`)} title={`Question ${o.name}`} aria-label={`Question ${o.name}`}
                className="border-2 border-[#d9d9d9] bg-black p-0.5 opacity-80 transition hover:opacity-100" style={{ filter: "grayscale(1)" }}>
                <Portrait spec={o.portrait} mood={o.mood} size={64} name={o.name} />
              </button>
            ))}
          </div>
        </div>

        {settings.voices && settings.voiceEngine === "browser" && !settings.voicePromptDismissed && neuralSupported && (
          <div className="absolute left-3 right-3 top-12 z-10 max-w-sm border-2 border-[#d9d9d9] bg-black/90 p-3 lg:bottom-4 lg:left-4 lg:right-auto lg:top-auto">
            <p className="font-story text-base text-paper-100">Want suspects to sound like real people?</p>
            <p className="mt-1 text-xs text-smoke-400">Downloads a realistic voice model once (about 90 MB). Free, and it runs on your computer.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => { setSettings({ voiceEngine: "neural", voicePromptDismissed: true }); loadNeuralVoices(); notify("info", "Downloading realistic voices — built-in voices are used until it's ready."); }} className="rounded bg-paper-100 px-3 py-1 text-sm font-semibold text-black hover:bg-white">Yes, download</button>
              <button onClick={() => setSettings({ voicePromptDismissed: true })} className="px-2 py-1 text-sm text-smoke-400 hover:text-white">No thanks</button>
            </div>
          </div>
        )}
        <ClueButton className="absolute bottom-3 right-3 z-10 !px-3 !py-1.5 lg:bottom-4 lg:right-5" />
        <div className="font-story absolute left-4 top-3 text-sm text-smoke-400 sm:text-base lg:bottom-3 lg:top-auto"><span className="text-paper-100">{suspect.name}</span> · {suspect.profession}</div>
      </section>

      <Modal open={presentOpen} onClose={() => setPresentOpen(false)} title="Which evidence do you show them?" wide>
        <div className="grid gap-2 sm:grid-cols-2">
          {state!.evidence.map((e) => (
            <EvidenceCard key={e.id} e={e} compact onClick={() => { setPresentOpen(false); void send({ evidenceId: e.id }); }} />
          ))}
        </div>
      </Modal>

      <AnimatePresence>
        {transcript && (
          <motion.div className="fixed inset-0 z-50 flex justify-end bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) setTranscript(false); }}>
            <motion.aside initial={{ x: 40 }} animate={{ x: 0 }} exit={{ x: 40 }} className="h-full w-full max-w-lg overflow-y-auto border-l-2 border-[#d9d9d9] bg-black p-6" role="dialog" aria-label="Transcript">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-story text-2xl text-paper-100">Transcript — {suspect.name}</h2>
                <button onClick={() => setTranscript(false)} aria-label="Close" className="text-smoke-300 hover:text-white"><X size={20} /></button>
              </div>
              <p className="font-story mb-3 italic text-smoke-300">{suspect.name.split(" ")[0].toUpperCase()}: {suspect.greeting}</p>
              {history.map((m, i) => (
                <p key={i} className={`font-story mb-3 text-lg leading-snug ${m.role === "player" ? "text-amber-200" : m.role === "system" ? "text-sm italic text-smoke-500" : "text-paper-100"}`}>
                  {m.role === "player" ? "YOU: " : m.role === "suspect" ? `${suspect.name.split(" ")[0].toUpperCase()}: ` : ""}{m.text}
                </p>
              ))}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Heart-rate style readout: the line speeds up as stress rises. */
function StressMonitor({ stress, trust }: { stress: number; trust: number }) {
  const beat = "M0 20 L30 20 L36 20 L40 6 L46 34 L52 14 L56 20 L100 20";
  const duration = Math.max(0.6, 2.6 - (stress / 100) * 2);
  return (
    <div className="w-40 border-2 border-[#3a3a3a] bg-black/80 p-2 sm:w-48" aria-label={`Stress ${Math.round(stress)}, trust ${Math.round(trust)}`} role="img">
      <div className="relative h-10 overflow-hidden">
        <svg className="ecg absolute left-0 top-0 h-10" width="400" viewBox="0 0 400 40" style={{ animationDuration: `${duration}s` }} aria-hidden>
          {[0, 100, 200, 300].map((x) => <path key={x} d={beat} transform={`translate(${x},0)`} fill="none" stroke={stress > 60 ? "#ff6b5e" : "#d9d9d9"} strokeWidth="2" />)}
        </svg>
      </div>
      <div className="mt-1 flex justify-between font-type text-[0.65rem] uppercase tracking-widest text-smoke-400"><span>Stress {Math.round(stress)}</span><span>Trust {Math.round(trust)}</span></div>
    </div>
  );
}

/** Shows whether the realistic voices are downloading, ready, or failed (with the reason). */
function VoiceStatus() {
  const [, force] = useState(0);
  useEffect(() => onNeuralChange(() => force((n) => n + 1)), []);
  const box = "w-40 border-2 border-[#3a3a3a] bg-black/85 p-2 text-[0.7rem] leading-snug sm:w-48";
  if (neural.status === "loading") return (
    <div className={box} role="status">
      <div className="text-smoke-200">Downloading realistic voices… {Math.round(neural.progress * 100)}%</div>
      <div className="mt-1 h-1 overflow-hidden bg-white/10"><div className="h-full bg-paper-100 transition-all" style={{ width: `${Math.round(neural.progress * 100)}%` }} /></div>
      <div className="mt-1 text-smoke-500">Standard voices until it's done.</div>
    </div>
  );
  if (neural.status === "error") return (
    <div className={box} role="status">
      <div className="text-blood-400">Realistic voices failed to load.</div>
      <div className="mt-1 break-words text-smoke-400">{neural.error}</div>
      <button className="mt-1 underline text-paper-100" onClick={() => { neural.status = "off"; loadNeuralVoices(); }}>Try again</button>
    </div>
  );
  if (neural.status === "ready") return <div className={`${box} text-emerald-300`} role="status">Realistic voices on{neural.error ? ` (last line fell back: ${neural.error})` : ""}</div>;
  return null;
}
