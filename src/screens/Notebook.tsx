import { BookOpen, MapPin, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { EvidenceView, NoteTag } from "../../shared/api";
import { GameLayout } from "../components/GameLayout";
import { Portrait } from "../components/Portrait";
import { EvidenceCard, MoodTag } from "../components/bits";
import { Badge, Button, Empty, Modal, SectionTitle, Tabs } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

type Tab = "evidence" | "interviews" | "suspects" | "locations" | "timeline" | "deductions" | "notes";

const TAG_STYLE: Record<NoteTag, { label: string; tone: "amber" | "blue" | "neutral" | "green" }> = {
  fact: { label: "Confirmed fact", tone: "amber" },
  claim: { label: "Unverified claim", tone: "blue" },
  theory: { label: "Working theory", tone: "green" },
  note: { label: "Note", tone: "neutral" },
};

export function Notebook() {
  const { state, mutate, go } = useGame();
  const [tab, setTab] = useState<Tab>("evidence");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<EvidenceView | null>(null);
  const [draft, setDraft] = useState("");
  const [draftTag, setDraftTag] = useState<NoteTag>("note");
  const [filter, setFilter] = useState<"all" | "confirmed" | "testimony">("all");

  const q = query.trim().toLowerCase();
  const match = (s: string) => !q || s.toLowerCase().includes(q);

  const timeline = useMemo(() => (state?.timeline ?? []).filter((t) => match(`${t.time} ${t.text} ${t.sourceTitle}`)), [state?.timeline, q]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!state) return <NoCase />;

  const evidence = state.evidence.filter((e) => (filter === "all" || e.reliability === filter) && match(`${e.title} ${e.summary} ${e.detail}`));
  const notes = [...state.notes].reverse().filter((n) => match(n.text));

  return (
    <GameLayout active="notebook">
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <SectionTitle kicker={`${state.subtitle} · ${state.title}`} title={<span className="flex items-center gap-3"><BookOpen className="text-amber-400" />Detective's Notebook</span>}
          right={
            <div className="relative">
              <Search size={15} className="absolute left-2.5 top-2.5 text-smoke-500" />
              <label htmlFor="nbq" className="sr-only">Search notebook</label>
              <input id="nbq" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the notebook…" className="w-64 rounded-md border border-white/10 bg-black/40 py-2 pl-8 pr-3 text-sm focus:border-amber-500/50 focus:outline-none" />
            </div>
          } />

        <div className="mb-4 flex flex-wrap gap-3 text-xs text-smoke-400">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />Confirmed evidence</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-steel-400" />Witness testimony / claims</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />Your hypotheses</span>
        </div>

        <Tabs<Tab>
          value={tab} onChange={setTab} className="mb-5"
          tabs={[
            { id: "evidence", label: "Evidence", count: state.evidence.length },
            { id: "interviews", label: "Interviews", count: state.suspects.filter((s) => s.history.length).length },
            { id: "suspects", label: "Suspects", count: state.suspects.length },
            { id: "locations", label: "Locations", count: state.locations.filter((l) => l.visited).length },
            { id: "timeline", label: "Timeline", count: state.timeline.length },
            { id: "deductions", label: "Deductions", count: state.deductions.length },
            { id: "notes", label: "Notes", count: state.notes.length },
          ]}
        />

        {tab === "evidence" && (
          <>
            <div className="mb-3 flex gap-2">
              {(["all", "confirmed", "testimony"] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? "primary" : "ghost"} onClick={() => setFilter(f)}>{f === "all" ? "All" : f === "confirmed" ? "Confirmed" : "Testimony"}</Button>
              ))}
            </div>
            {evidence.length === 0 ? <Empty icon={<Search size={32} />} title="No evidence yet" text="Explore locations and interview suspects. Everything you collect is logged here." /> : (
              <div className="grid gap-3 md:grid-cols-2">{evidence.map((e) => <EvidenceCard key={e.id} e={e} onClick={() => setOpen(e)} />)}</div>
            )}
          </>
        )}

        {tab === "interviews" && (
          <div className="flex flex-col gap-4">
            {state.suspects.filter((s) => s.history.length > 0).length === 0 && <Empty icon={<BookOpen size={32} />} title="No interviews" text="Transcripts of every interrogation are kept here." />}
            {state.suspects.filter((s) => s.history.length > 0).map((s) => (
              <section key={s.id} className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-display text-lg text-paper-100">{s.name}</div>
                  <Button size="sm" variant="ghost" onClick={() => go(`interrogate/${s.id}`)}>Continue interview</Button>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-2 font-type text-sm">
                  {s.history.filter((m) => match(m.text)).map((m, i) => (
                    <p key={i} className={m.role === "player" ? "text-amber-200/90" : "text-smoke-100"}><span className="text-smoke-500">{m.role === "player" ? "DET: " : `${s.name.split(" ")[0].toUpperCase()}: `}</span>{m.text}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {tab === "suspects" && (
          <div className="grid gap-3 md:grid-cols-2">
            {state.suspects.filter((s) => match(`${s.name} ${s.bio}`)).map((s) => (
              <button key={s.id} onClick={() => go(`interrogate/${s.id}`)} className="panel flex gap-4 p-4 text-left transition hover:border-amber-500/30">
                <Portrait spec={s.portrait} mood={s.mood} size={80} className="shrink-0 rounded" name={s.name} />
                <div className="min-w-0">
                  <div className="font-display text-lg text-paper-100">{s.name}, {s.age}</div>
                  <div className="text-xs text-smoke-400">{s.profession} · {s.relation}</div>
                  <p className="mt-1 text-sm text-smoke-300">{s.bio}</p>
                  <div className="mt-2 text-xs"><span className="text-smoke-500">Claims: </span><span className="italic text-steel-300">{s.alibi}</span></div>
                  <div className="mt-1">{s.interviewed && <MoodTag mood={s.mood} />}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "locations" && (
          <div className="grid gap-3 md:grid-cols-2">
            {state.locations.map((l) => (
              <div key={l.id} className={`panel p-4 ${l.unlocked ? "" : "opacity-60"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-display text-lg text-paper-100"><MapPin size={16} className="text-amber-400" />{l.unlocked ? l.name : "Locked lead"}</div>
                  {l.unlocked ? <Badge tone={l.visited ? "amber" : "green"}>{l.visited ? `${l.cluesFound}/${l.cluesTotal} clues` : "New"}</Badge> : <Badge>Locked</Badge>}
                </div>
                <p className="mt-1 text-sm text-smoke-300">{l.unlocked ? l.description : l.unlockHint}</p>
                {l.unlocked && <Button size="sm" className="mt-3" onClick={() => go(`scene/${l.id}`)}>Go there</Button>}
              </div>
            ))}
          </div>
        )}

        {tab === "timeline" && (
          <div className="panel p-4 sm:p-6">
            {timeline.length === 0 ? <Empty icon={<Search size={32} />} title="Timeline is empty" text="Time-stamped evidence and claims are placed here automatically. Notes that start with a time (e.g. '22:30 — …') appear as your hypotheses." /> : (
              <ol className="relative border-l border-white/10 pl-6">
                {timeline.map((t, i) => (
                  <li key={i} className="mb-4">
                    <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full ${t.kind === "confirmed" ? "bg-amber-400" : t.kind === "testimony" ? "bg-steel-400" : "bg-emerald-400"}`} />
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="w-12 shrink-0 font-type text-sm text-amber-300">{t.time}</span>
                      <span className={`text-sm ${t.kind === "testimony" ? "italic text-steel-300" : t.kind === "theory" ? "font-hand text-lg text-emerald-300" : "text-smoke-100"}`}>{t.text}</span>
                    </div>
                    <div className="ml-[3.75rem] text-[0.65rem] uppercase tracking-wider text-smoke-500">{t.kind === "confirmed" ? "Confirmed" : t.kind === "testimony" ? "Testimony / claim" : "Hypothesis"} · {t.sourceTitle}</div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {tab === "deductions" && (
          <div className="grid gap-3 md:grid-cols-2">
            {state.deductions.length === 0 && <Empty icon={<Search size={32} />} title="No deductions yet" text="Connect related evidence on the Evidence Board. Valid connections become deductions." />}
            {state.deductions.filter((d) => match(`${d.title} ${d.text}`)).map((d) => (
              <div key={d.id} className={`panel border-l-4 p-4 ${d.contradiction ? "!border-l-blood-500" : "!border-l-amber-400"}`}>
                <Badge tone={d.contradiction ? "red" : "amber"}>{d.contradiction ? "Contradiction" : "Deduction"}</Badge>
                <div className="mt-1.5 font-display text-lg text-paper-100">{d.title}</div>
                <p className="mt-1 text-sm text-smoke-200">{d.text}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "notes" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
            <form className="panel-paper lined h-fit p-5" onSubmit={async (e) => { e.preventDefault(); if (!draft.trim()) return; await mutate("POST", "/notes", { text: draft, tag: draftTag }); setDraft(""); }}>
              <label htmlFor="nd" className="font-type text-xs uppercase tracking-widest text-char-600">New entry</label>
              <textarea id="nd" value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} maxLength={2000} placeholder="Write a note… Start with a time (22:30 — …) to put it on the timeline."
                className="mt-2 w-full resize-none bg-transparent font-hand text-xl leading-[28px] text-char-900 placeholder:text-char-500 focus:outline-none" />
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label htmlFor="ntag" className="sr-only">Type</label>
                <select id="ntag" value={draftTag} onChange={(e) => setDraftTag(e.target.value as NoteTag)} className="rounded border border-char-900/20 bg-white/50 px-2 py-1.5 text-sm text-char-900">
                  <option value="note">Note</option><option value="theory">Working theory</option><option value="fact">Confirmed fact</option><option value="claim">Unverified claim</option>
                </select>
                <Button type="submit" variant="paper" className="!bg-char-900 !text-amber-300" disabled={!draft.trim()}>Write it down</Button>
              </div>
            </form>
            <div className="flex flex-col gap-2">
              {notes.length === 0 && <Empty icon={<BookOpen size={32} />} title="No notes" text="Discoveries are recorded automatically. Add your own thoughts here." />}
              {notes.map((n) => (
                <div key={n.id} className="panel flex gap-3 p-3">
                  <button onClick={() => mutate("PATCH", `/notes/${n.id}`, { relevant: !n.relevant })} aria-pressed={n.relevant} aria-label={n.relevant ? "Unmark relevant" : "Mark relevant"} className={n.relevant ? "text-amber-400" : "text-smoke-500 hover:text-amber-300"}>
                    <Star size={16} fill={n.relevant ? "currentColor" : "none"} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2"><Badge tone={TAG_STYLE[n.tag].tone}>{TAG_STYLE[n.tag].label}</Badge>{n.auto && <span className="text-[0.65rem] text-smoke-500">auto-recorded</span>}</div>
                    <p className={`whitespace-pre-wrap text-sm ${n.tag === "theory" ? "font-hand text-lg text-emerald-200" : n.tag === "claim" ? "italic text-steel-300" : "text-smoke-100"}`}>{n.text}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <select aria-label="Change type" value={n.tag} onChange={(e) => mutate("PATCH", `/notes/${n.id}`, { tag: e.target.value })} className="rounded border border-white/10 bg-black/40 px-1 py-0.5 text-[0.65rem]">
                      <option value="note">Note</option><option value="theory">Theory</option><option value="fact">Fact</option><option value="claim">Claim</option>
                    </select>
                    <button onClick={() => mutate("DELETE", `/notes/${n.id}`)} className="self-end text-smoke-500 hover:text-blood-400" aria-label="Delete note"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={Boolean(open)} onClose={() => setOpen(null)} title={open?.title} wide>
        {open && (
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge tone={open.reliability === "testimony" ? "blue" : "amber"}>{open.reliability === "testimony" ? "Testimony" : "Confirmed"}</Badge>
              <Badge>{open.type}</Badge><Badge>{open.locationName}</Badge>
              {open.importance === "key" && <Badge tone="amber">Key evidence</Badge>}
              {open.photographed && <Badge tone="green">Photographed</Badge>}
            </div>
            <p className={`whitespace-pre-line leading-relaxed ${open.reliability === "testimony" ? "italic text-steel-300" : "typewriter text-smoke-100"}`}>{open.detail}</p>
            <div className="mt-5 flex gap-2">
              <Button size="sm" onClick={() => { setOpen(null); go("board"); }}>Open board</Button>
              <Button size="sm" variant="ghost" onClick={() => { setOpen(null); go("interrogate"); }}>Present to a suspect</Button>
            </div>
          </div>
        )}
      </Modal>
    </GameLayout>
  );
}
