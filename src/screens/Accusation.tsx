import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Gavel, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { AccuseResult } from "../../shared/api";
import { GameLayout } from "../components/GameLayout";
import { Portrait } from "../components/Portrait";
import { EvidenceCard } from "../components/bits";
import { Badge, Button, Modal, SectionTitle } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

const STEPS = ["Culprit", "Motive", "Method", "Sequence", "Evidence", "Review"];

export function Accusation() {
  const { state, mutate, go } = useGame();
  const [step, setStep] = useState(0);
  const [suspectId, setSuspect] = useState("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [sequence, setSequence] = useState("");
  const [evidence, setEvidence] = useState<string[]>([]);
  const [result, setResult] = useState<AccuseResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!state) return <NoCase />;
  const a = state.accusation;
  // Keep the form mounted while a verdict is being delivered, even if it closed the case.
  if (state.status !== "active" && !result && !submitting) {
    return (
      <GameLayout active="accuse">
        <div className="mx-auto max-w-xl p-8 text-center">
          <Gavel size={40} className="mx-auto text-smoke-500" />
          <h1 className="mt-3 font-display text-3xl text-paper-100">This case is closed</h1>
          <Button className="mt-6" variant="primary" onClick={() => go("resolution")}>See the case outcome</Button>
        </div>
      </GameLayout>
    );
  }

  const valid = [Boolean(suspectId), Boolean(motive), Boolean(method), Boolean(sequence), evidence.length >= a.minEvidence, true];
  const suspect = state.suspects.find((s) => s.id === suspectId);

  const submit = async () => {
    setSubmitting(true);
    const r = await mutate<AccuseResult>("POST", "/accuse", { suspectId, motive, method, sequence, evidence });
    if (r) setResult(r);
    setSubmitting(false);
  };

  const Choice = ({ id, label, value, set }: { id: string; label: string; value: string; set: (v: string) => void }) => (
    <button onClick={() => set(id)} aria-pressed={value === id}
      className={`flex w-full items-start gap-3 rounded-lg border p-4 text-left transition ${value === id ? "border-amber-400 bg-amber-500/10 shadow-glow" : "border-white/10 bg-black/20 hover:border-amber-500/40"}`}>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${value === id ? "border-amber-400 bg-amber-400 text-char-900" : "border-smoke-400"}`}>{value === id && <Check size={13} strokeWidth={3} />}</span>
      <span className="text-sm text-smoke-100">{label}</span>
    </button>
  );

  return (
    <GameLayout active="accuse">
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <SectionTitle kicker="District Attorney's office" title="Final Accusation" right={<Badge tone={a.attemptsLeft === 1 ? "red" : "amber"}>{a.attemptsLeft} accusation{a.attemptsLeft === 1 ? "" : "s"} remaining</Badge>} />
        <p className="-mt-2 mb-5 max-w-2xl text-sm text-smoke-300">Build your case for the DA: who did it, why, how, and in what order — supported by at least {a.minEvidence} pieces of evidence. A wrong accusation costs you; three and the case is taken off your desk.</p>

        <ol className="mb-6 flex flex-wrap gap-2" aria-label="Steps">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button onClick={() => i <= step || valid.slice(0, i).every(Boolean) ? setStep(i) : undefined} aria-current={step === i ? "step" : undefined}
                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${step === i ? "border-amber-400 text-amber-300" : valid[i] && i < 5 ? "border-emerald-500/40 text-emerald-300" : "border-white/10 text-smoke-400"}`}>
                <span className="font-semibold">{i + 1}</span>{s}
              </button>
            </li>
          ))}
        </ol>

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="panel p-5">
          {step === 0 && (
            <>
              <h2 className="mb-4 font-display text-xl text-paper-100">Who killed {state.victim.name}?</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {state.suspects.map((s) => (
                  <button key={s.id} onClick={() => setSuspect(s.id)} aria-pressed={suspectId === s.id}
                    className={`flex flex-col justify-start rounded-lg border p-2 text-left transition ${suspectId === s.id ? "border-amber-400 bg-amber-500/10 shadow-glow" : "border-white/10 hover:border-amber-500/40"}`}>
                    <Portrait spec={s.portrait} size={140} className="h-auto w-full rounded" name={s.name} />
                    <div className="mt-2 text-sm font-semibold text-paper-100">{s.name}</div>
                    <div className="text-[0.7rem] text-smoke-400">{s.relation}</div>
                  </button>
                ))}
              </div>
            </>
          )}
          {step === 1 && <><h2 className="mb-4 font-display text-xl text-paper-100">What was the motive?</h2><div className="flex flex-col gap-2">{a.motives.map((m) => <Choice key={m.id} {...m} value={motive} set={setMotive} />)}</div></>}
          {step === 2 && <><h2 className="mb-4 font-display text-xl text-paper-100">How was it done?</h2><div className="flex flex-col gap-2">{a.methods.map((m) => <Choice key={m.id} {...m} value={method} set={setMethod} />)}</div></>}
          {step === 3 && <><h2 className="mb-4 font-display text-xl text-paper-100">What is the most likely sequence of events?</h2><div className="flex flex-col gap-2">{a.sequences.map((m) => <Choice key={m.id} {...m} value={sequence} set={setSequence} />)}</div></>}
          {step === 4 && (
            <>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-xl text-paper-100">Which evidence supports your case?</h2>
                <span className={`text-sm ${evidence.length >= a.minEvidence ? "text-emerald-300" : "text-smoke-400"}`}>{evidence.length} selected · minimum {a.minEvidence}</span>
              </div>
              <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {state.evidence.map((e) => <EvidenceCard key={e.id} e={e} compact selected={evidence.includes(e.id)} onClick={() => setEvidence((v) => v.includes(e.id) ? v.filter((x) => x !== e.id) : [...v, e.id])} />)}
              </div>
            </>
          )}
          {step === 5 && (
            <div className="panel-paper p-5">
              <div className="font-type text-xs uppercase tracking-widest text-char-500">Statement of charges</div>
              <p className="mt-2 font-type text-char-900"><b>Accused:</b> {suspect?.name ?? "—"}</p>
              <p className="mt-1 font-type text-char-900"><b>Motive:</b> {a.motives.find((m) => m.id === motive)?.label ?? "—"}</p>
              <p className="mt-1 font-type text-char-900"><b>Method:</b> {a.methods.find((m) => m.id === method)?.label ?? "—"}</p>
              <p className="mt-1 font-type text-char-900"><b>Sequence:</b> {a.sequences.find((m) => m.id === sequence)?.label ?? "—"}</p>
              <p className="mt-1 font-type text-char-900"><b>Evidence:</b> {evidence.map((id) => state.evidence.find((e) => e.id === id)?.title).join("; ") || "—"}</p>
              {!valid.slice(0, 5).every(Boolean) && <p className="mt-3 flex items-center gap-2 text-sm text-blood-600"><TriangleAlert size={15} />Complete every step before submitting.</p>}
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}><ArrowLeft size={16} />Back</Button>
            {step < 5 ? (
              <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={!valid[step]}>Next<ArrowRight size={16} /></Button>
            ) : (
              <Button variant="primary" onClick={submit} disabled={!valid.slice(0, 5).every(Boolean)}><Gavel size={16} />Submit accusation</Button>
            )}
          </div>
        </motion.div>
      </div>

      <Modal open={Boolean(result)} onClose={() => setResult(null)} title="The DA's decision" labelledBy="verdict">
        {result && (
          <div>
            <div className={`stamp mb-3 ${result.verdict === "solved" ? "border-emerald-400 text-emerald-300" : result.verdict === "incomplete" ? "border-amber-400 text-amber-300" : "border-blood-500 text-blood-400"}`}>{result.title}</div>
            <p className="text-smoke-100">{result.summary}</p>
            {result.feedback.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-smoke-300">{result.feedback.map((f) => <li key={f}>{f}</li>)}</ul>}
            <div className="mt-5 flex gap-3">
              {result.caseClosed ? (
                <Button variant="primary" onClick={() => go("resolution")}>See what really happened <ArrowRight size={16} /></Button>
              ) : (
                <Button variant="primary" onClick={() => { setResult(null); go("office"); }}>Return to the investigation</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </GameLayout>
  );
}
