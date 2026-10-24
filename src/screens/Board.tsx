import { motion } from "framer-motion";
import { LayoutGrid, Link2, Minus, Pin, Plus, RotateCcw, StickyNote, Trash2, TriangleAlert, Lightbulb, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import type { BoardState, ConnectResult, EvidenceView, SuspectView } from "../../shared/api";
import { GameLayout } from "../components/GameLayout";
import { Portrait } from "../components/Portrait";
import { EvidenceIcon, TYPE_LABEL } from "../components/bits";
import { Button } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

const WORLD_W = 2600;
const WORLD_H = 1700;
const SIZE = { evidence: { w: 210, h: 104 }, suspect: { w: 130, h: 178 }, note: { w: 190, h: 130 } };

type Kind = "evidence" | "suspect" | "note";
const kindOf = (id: string): Kind => (id.startsWith("S:") ? "suspect" : id.startsWith("N:") ? "note" : "evidence");

export function Board() {
  const { state, mutate } = useGame();
  const [board, setBoard] = useState<BoardState>(state?.board ?? { items: [], connections: [], notes: [] });
  const [view, setView] = useState({ x: 40, y: 40, s: 0.75 });
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedConn, setSelectedConn] = useState<string | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [trayOpen, setTrayOpen] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Drag cards to arrange them. Select a card, press Link, then click a second card to test a connection.");
  const [formA, setFormA] = useState("");
  const [formB, setFormB] = useState("");
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);
  const pan = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const saveTimer = useRef<number | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  // Adopt server connections (e.g. labels for newly recognised deductions) without disturbing layout.
  useEffect(() => { if (state) setBoard((b) => ({ ...b, connections: state.board.connections })); }, [state?.board.connections]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void mutate("PUT", "/board", boardRef.current); }, 700);
  }, [mutate]);

  const evMap = useMemo(() => new Map((state?.evidence ?? []).map((e) => [e.id, e])), [state?.evidence]);
  const susMap = useMemo(() => new Map((state?.suspects ?? []).map((s) => [`S:${s.id}`, s])), [state?.suspects]);

  if (!state) return <NoCase />;

  const positions = new Map<string, { x: number; y: number }>();
  board.items.forEach((i) => positions.set(i.id, i));
  board.notes.forEach((n) => positions.set(`N:${n.id}`, n));
  const center = (id: string) => {
    const p = positions.get(id);
    if (!p) return null;
    const s = SIZE[kindOf(id)];
    return { x: p.x + s.w / 2, y: p.y + s.h / 2 };
  };
  const label = (id: string) => kindOf(id) === "evidence" ? evMap.get(id)?.title ?? id : kindOf(id) === "suspect" ? susMap.get(id)?.name ?? id : `Note: ${board.notes.find((n) => `N:${n.id}` === id)?.text.slice(0, 30) || "…"}`;

  const viewportCenter = () => {
    const r = wrap.current?.getBoundingClientRect();
    const w = r?.width ?? 800; const h = r?.height ?? 600;
    return { x: (w / 2 - view.x) / view.s - 100 + Math.random() * 60, y: (h / 2 - view.y) / view.s - 60 + Math.random() * 60 };
  };

  /** First grid cell, scanning from the visible top-left, that doesn't overlap another card. */
  const freeSpot = (id: string) => {
    const s = SIZE[kindOf(id)];
    const r = wrap.current?.getBoundingClientRect();
    const x0 = Math.max(20, -view.x / view.s + 20);
    const y0 = Math.max(20, -view.y / view.s + 20);
    const visW = r ? r.width / view.s : 1200;
    const taken = [...positions.entries()].map(([k, p]) => ({ ...p, ...SIZE[kindOf(k)] }));
    const free = (x: number, y: number) => taken.every((t) => x + s.w + 20 < t.x || t.x + t.w + 20 < x || y + s.h + 30 < t.y || t.y + t.h + 30 < y);
    for (let y = y0; y < WORLD_H - s.h; y += 70) {
      for (let x = x0; x < Math.min(WORLD_W - s.w, x0 + Math.max(visW - s.w, 400)); x += 60) if (free(x, y)) return { x, y };
    }
    return viewportCenter();
  };

  const autoArrange = () => {
    const suspects = board.items.filter((i) => kindOf(i.id) === "suspect");
    const ev = board.items.filter((i) => kindOf(i.id) === "evidence")
      .sort((a, b) => (evMap.get(a.id)?.reliability ?? "").localeCompare(evMap.get(b.id)?.reliability ?? "") || (evMap.get(a.id)?.type ?? "").localeCompare(evMap.get(b.id)?.type ?? ""));
    const cols = 8;
    setBoard((b) => ({
      ...b,
      items: [
        ...suspects.map((s, i) => ({ ...s, x: 60 + i * 170, y: 40 })),
        ...ev.map((e, i) => ({ ...e, x: 60 + (i % cols) * 260, y: (suspects.length ? 280 : 40) + Math.floor(i / cols) * 160 })),
      ],
      notes: b.notes.map((n, i) => ({ ...n, x: 60 + cols * 260 + 20, y: 40 + i * 170 })),
    }));
    setView({ x: 20, y: 20, s: 0.5 });
    save();
  };

  const pin = (id: string) => {
    const c = freeSpot(id);
    setBoard((b) => ({ ...b, items: [...b.items.filter((i) => i.id !== id), { id, x: c.x, y: c.y }] }));
    setSelected(id);
    save();
  };

  const addNote = (kind: "note" | "hypothesis") => {
    const c = viewportCenter();
    const id = Math.random().toString(36).slice(2, 10);
    setBoard((b) => ({ ...b, notes: [...b.notes, { id, x: c.x, y: c.y, text: kind === "hypothesis" ? "Hypothesis: " : "", kind }] }));
    setEditing(`N:${id}`);
    setSelected(`N:${id}`);
    save();
  };

  const removeSelected = () => {
    if (selectedConn) {
      setBoard((b) => ({ ...b, connections: b.connections.filter((c) => c.id !== selectedConn) }));
      setSelectedConn(null);
      save();
      return;
    }
    if (!selected) return;
    setBoard((b) => ({
      items: b.items.filter((i) => i.id !== selected),
      notes: b.notes.filter((n) => `N:${n.id}` !== selected),
      connections: b.connections.filter((c) => c.a !== selected && c.b !== selected),
    }));
    setSelected(null);
    save();
  };

  const doConnect = async (a: string, b: string) => {
    setLinkFrom(null);
    if (a === b) return;
    // Notes must exist server-side before they can be linked.
    if (kindOf(a) === "note" || kindOf(b) === "note") await mutate("PUT", "/board", boardRef.current);
    const r = await mutate<ConnectResult>("POST", "/connect", { a, b });
    if (r) setMessage(r.message);
  };

  const toggleSuspectedContradiction = () => {
    if (!selectedConn) return;
    setBoard((b) => ({ ...b, connections: b.connections.map((c) => c.id === selectedConn && !c.deductionId ? { ...c, contradiction: !c.contradiction, label: !c.contradiction ? "Suspected contradiction" : undefined } : c) }));
    save();
  };

  // ── pointer interaction ──
  const toWorld = (clientX: number, clientY: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: (clientX - r.left - view.x) / view.s, y: (clientY - r.top - view.y) / view.s };
  };

  const onCardDown = (e: RPointerEvent, id: string) => {
    if (editing === id) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const w = toWorld(e.clientX, e.clientY);
    const p = positions.get(id)!;
    drag.current = { id, dx: w.x - p.x, dy: w.y - p.y, moved: false };
  };

  const onMove = (e: RPointerEvent) => {
    if (drag.current) {
      const w = toWorld(e.clientX, e.clientY);
      const d = drag.current;
      const nx = Math.max(0, Math.min(WORLD_W - 100, w.x - d.dx));
      const ny = Math.max(0, Math.min(WORLD_H - 100, w.y - d.dy));
      const p = positions.get(d.id);
      if (p && (Math.abs(p.x - nx) > 2 || Math.abs(p.y - ny) > 2)) d.moved = true;
      if (!d.moved) return;
      setBoard((b) => d.id.startsWith("N:")
        ? { ...b, notes: b.notes.map((n) => (`N:${n.id}` === d.id ? { ...n, x: nx, y: ny } : n)) }
        : { ...b, items: b.items.map((i) => (i.id === d.id ? { ...i, x: nx, y: ny } : i)) });
    } else if (pan.current) {
      setView((v) => ({ ...v, x: pan.current!.vx + (e.clientX - pan.current!.x), y: pan.current!.vy + (e.clientY - pan.current!.y) }));
    }
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    pan.current = null;
    if (!d) return;
    if (d.moved) { save(); return; }
    // A click, not a drag.
    if (linkFrom && linkFrom !== d.id) void doConnect(linkFrom, d.id);
    else { setSelected(d.id); setSelectedConn(null); }
  };

  const onBgDown = (e: RPointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-card]")) return;
    pan.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    setSelected(null); setSelectedConn(null); setEditing(null);
  };

  const zoom = (factor: number, cx?: number, cy?: number) => {
    const r = wrap.current?.getBoundingClientRect();
    const px = cx ?? (r ? r.width / 2 : 400); const py = cy ?? (r ? r.height / 2 : 300);
    setView((v) => {
      const s = Math.max(0.3, Math.min(1.8, v.s * factor));
      return { s, x: px - ((px - v.x) / v.s) * s, y: py - ((py - v.y) / v.s) * s };
    });
  };

  const onWheel = (e: React.WheelEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    zoom(e.deltaY < 0 ? 1.1 : 0.9, e.clientX - r.left, e.clientY - r.top);
  };

  const onBoard = new Set([...board.items.map((i) => i.id), ...board.notes.map((n) => `N:${n.id}`)]);
  const trayEvidence = state.evidence.filter((e) => !onBoard.has(e.id));
  const traySuspects = state.suspects.filter((s) => !onBoard.has(`S:${s.id}`));
  const boardIds = [...onBoard];
  const selConn = board.connections.find((c) => c.id === selectedConn);

  return (
    <GameLayout active="board">
      <div className="flex h-[calc(100vh-4.5rem)] flex-col md:h-screen">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/5 bg-char-900/80 px-3 py-2">
          <Button size="sm" variant="ghost" onClick={() => setTrayOpen((t) => !t)} aria-label="Toggle evidence tray">{trayOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}</Button>
          <h1 className="mr-2 font-display text-lg font-bold text-paper-100">Evidence Board</h1>
          <Button size="sm" onClick={() => addNote("note")}><StickyNote size={14} />Note</Button>
          <Button size="sm" onClick={() => addNote("hypothesis")}><Lightbulb size={14} />Hypothesis</Button>
          <Button size="sm" variant={linkFrom ? "primary" : "outline"} disabled={!selected && !linkFrom} onClick={() => { setLinkFrom(linkFrom ? null : selected); if (!linkFrom && selected) setMessage(`Linking from "${label(selected)}" — click a second card.`); }}>
            <Link2 size={14} />{linkFrom ? "Cancel link" : "Link"}
          </Button>
          {selConn && !selConn.deductionId && <Button size="sm" variant="danger" onClick={toggleSuspectedContradiction}><TriangleAlert size={14} />{selConn.contradiction ? "Unmark" : "Mark contradiction"}</Button>}
          <Button size="sm" variant="ghost" disabled={!selected && !selectedConn} onClick={removeSelected}><Trash2 size={14} />Remove</Button>
          <Button size="sm" variant="ghost" disabled={board.items.length < 2} onClick={autoArrange}><LayoutGrid size={14} />Arrange</Button>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => zoom(0.85)} aria-label="Zoom out"><Minus size={14} /></Button>
            <span className="w-12 text-center text-xs text-smoke-400">{Math.round(view.s * 100)}%</span>
            <Button size="sm" variant="ghost" onClick={() => zoom(1.15)} aria-label="Zoom in"><Plus size={14} /></Button>
            <Button size="sm" variant="ghost" onClick={() => setView({ x: 40, y: 40, s: 0.75 })} aria-label="Reset view"><RotateCcw size={14} /></Button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1">
          {/* tray */}
          {trayOpen && (
            <aside className="absolute inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-white/5 bg-char-900/95 backdrop-blur md:static" aria-label="Evidence tray">
              <div className="flex-1 overflow-y-auto p-3">
                <div className="label-caps mb-2">Unpinned evidence ({trayEvidence.length})</div>
                {trayEvidence.length === 0 && <p className="text-xs text-smoke-500">{state.evidence.length === 0 ? "Collect evidence at locations and through interviews." : "Everything is on the board."}</p>}
                <div className="flex flex-col gap-1.5">
                  {trayEvidence.map((e) => (
                    <button key={e.id} onClick={() => pin(e.id)} className="flex items-center gap-2 rounded border border-white/5 bg-white/[0.02] px-2 py-1.5 text-left text-xs text-smoke-200 hover:border-amber-500/40">
                      <EvidenceIcon name={e.icon} size={14} className={e.reliability === "testimony" ? "text-steel-300" : "text-amber-300"} />
                      <span className="flex-1 truncate">{e.title}</span><Pin size={12} className="text-smoke-500" />
                    </button>
                  ))}
                </div>
                <div className="label-caps mb-2 mt-4">Suspect photos</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {traySuspects.map((s) => (
                    <button key={s.id} onClick={() => pin(`S:${s.id}`)} className="rounded border border-white/5 p-1 hover:border-amber-500/40" aria-label={`Pin ${s.name}`}>
                      <Portrait spec={s.portrait} size={60} className="h-auto w-full" name={s.name} />
                    </button>
                  ))}
                </div>

                <div className="label-caps mb-2 mt-5">Link two items</div>
                <div className="flex flex-col gap-1.5">
                  <label className="sr-only" htmlFor="la">First item</label>
                  <select id="la" value={formA} onChange={(e) => setFormA(e.target.value)} className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs">
                    <option value="">First item…</option>
                    {boardIds.map((id) => <option key={id} value={id}>{label(id)}</option>)}
                  </select>
                  <label className="sr-only" htmlFor="lb">Second item</label>
                  <select id="lb" value={formB} onChange={(e) => setFormB(e.target.value)} className="rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs">
                    <option value="">Second item…</option>
                    {boardIds.filter((id) => id !== formA).map((id) => <option key={id} value={id}>{label(id)}</option>)}
                  </select>
                  <Button size="sm" disabled={!formA || !formB} onClick={() => void doConnect(formA, formB)}><Link2 size={14} />Connect</Button>
                </div>

                <div className="label-caps mb-2 mt-5">Deductions ({state.deductions.length})</div>
                <div className="flex flex-col gap-2">
                  {state.deductions.map((d) => (
                    <div key={d.id} className={`rounded border p-2 text-xs ${d.contradiction ? "border-blood-500/30 bg-blood-500/5" : "border-amber-500/20 bg-amber-500/5"}`}>
                      <div className={`font-semibold ${d.contradiction ? "text-blood-400" : "text-amber-300"}`}>{d.title}</div>
                      <div className="mt-0.5 text-smoke-300">{d.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* canvas */}
          <div
            ref={wrap}
            className="relative min-w-0 flex-1 touch-none overflow-hidden"
            style={{ background: "radial-gradient(ellipse at 40% 30%, #6b4a2c 0%, #4a321d 45%, #2a1c10 100%)" }}
            onPointerDown={onBgDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
          >
            <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
            <div className="absolute left-0 top-0 origin-top-left" style={{ width: WORLD_W, height: WORLD_H, transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}>
              <svg width={WORLD_W} height={WORLD_H} className="absolute inset-0 overflow-visible">
                {board.connections.map((c) => {
                  const a = center(c.a); const b = center(c.b);
                  if (!a || !b) return null;
                  const color = c.deductionId ? (c.contradiction ? "#d0564e" : "#e7b45a") : c.contradiction ? "#d0564e" : "#c9c4b8";
                  const mx = (a.x + b.x) / 2; const my = (a.y + b.y) / 2 + 30;
                  const sel = selectedConn === c.id;
                  return (
                    <g key={c.id} className="cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); setSelectedConn(c.id); setSelected(null); }}>
                      <path d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`} stroke="transparent" strokeWidth="18" fill="none" />
                      <path d={`M${a.x} ${a.y} Q${mx} ${my} ${b.x} ${b.y}`} stroke={color} strokeWidth={sel ? 5 : 3} fill="none" strokeDasharray={c.deductionId ? undefined : "10 7"} opacity={0.9} style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,.6))" }} />
                      {c.label && (
                        <g transform={`translate(${(a.x + b.x) / 2}, ${(a.y + b.y) / 2 + 15})`}>
                          <rect x={-c.label.length * 4.2 - 10} y={-14} width={c.label.length * 8.4 + 20} height={26} rx={3} fill={c.contradiction ? "#3a1513" : "#2a2114"} stroke={color} />
                          <text textAnchor="middle" y={4} fontSize="14" fill={color} fontFamily="Special Elite, monospace">{c.label}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>

              {board.items.map((i) => {
                const k = kindOf(i.id);
                if (k === "suspect") { const s = susMap.get(i.id); return s ? <SuspectCard key={i.id} s={s} x={i.x} y={i.y} sel={selected === i.id} link={linkFrom === i.id} onDown={(e) => onCardDown(e, i.id)} /> : null; }
                const e = evMap.get(i.id);
                return e ? <EvCard key={i.id} e={e} x={i.x} y={i.y} sel={selected === i.id} link={linkFrom === i.id} onDown={(ev) => onCardDown(ev, i.id)} /> : null;
              })}
              {board.notes.map((n) => {
                const id = `N:${n.id}`;
                return (
                  <div key={n.id} data-card onPointerDown={(e) => onCardDown(e, id)} onDoubleClick={() => setEditing(id)}
                    className={`absolute p-3 shadow-card ${n.kind === "hypothesis" ? "bg-[#cfe0ee]" : "bg-[#f1dd8a]"} ${selected === id ? "outline outline-2 outline-amber-400" : ""} ${linkFrom === id ? "outline outline-2 outline-emerald-400" : ""}`}
                    style={{ left: n.x, top: n.y, width: SIZE.note.w, minHeight: SIZE.note.h, transform: `rotate(${(n.id.charCodeAt(0) % 5) - 2}deg)` }}>
                    <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-blood-500 shadow" />
                    {editing === id ? (
                      <textarea autoFocus defaultValue={n.text} maxLength={400} aria-label="Note text"
                        onBlur={(e) => { const text = e.target.value; setBoard((b) => ({ ...b, notes: b.notes.map((x) => (x.id === n.id ? { ...x, text } : x)) })); setEditing(null); save(); }}
                        className="h-28 w-full resize-none bg-transparent font-hand text-lg leading-tight text-char-900 outline-none" />
                    ) : (
                      <p className="whitespace-pre-wrap font-hand text-lg leading-tight text-char-900">{n.text || <span className="opacity-50">Double-click to write…</span>}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {board.items.length === 0 && board.notes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                <div className="max-w-sm rounded-lg bg-black/60 p-5 text-center text-sm text-smoke-200 backdrop-blur">
                  Pin evidence and suspect photos from the tray. Connect two items to test a theory — the right pairs become deductions.
                </div>
              </div>
            )}
            <motion.div key={message} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="pointer-events-none absolute bottom-3 left-1/2 w-[min(92%,640px)] -translate-x-1/2 rounded-md bg-black/75 px-4 py-2 text-center text-xs text-smoke-100 backdrop-blur" role="status">
              {linkFrom ? `Linking from "${label(linkFrom)}" — click a second card.` : message}
            </motion.div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}

function EvCard({ e, x, y, sel, link, onDown }: { e: EvidenceView; x: number; y: number; sel: boolean; link: boolean; onDown: (e: RPointerEvent) => void }) {
  const t = e.reliability === "testimony";
  return (
    <div data-card onPointerDown={onDown} className={`absolute cursor-grab select-none p-2.5 shadow-card active:cursor-grabbing ${t ? "bg-[#dfe6ee]" : "bg-paper-100"} ${sel ? "outline outline-2 outline-amber-400" : ""} ${link ? "outline outline-[3px] outline-emerald-400" : ""}`}
      style={{ left: x, top: y, width: SIZE.evidence.w, height: SIZE.evidence.h }} title={e.summary}>
      <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-blood-500 shadow" />
      <div className="flex items-start gap-2">
        <EvidenceIcon name={e.icon} size={18} className={t ? "text-steel-500" : "text-amber-700"} />
        <div className="min-w-0">
          <div className="line-clamp-2 font-type text-[0.82rem] font-bold leading-tight text-char-900">{e.title}</div>
          <div className="mt-0.5 text-[0.6rem] uppercase tracking-wider text-char-500">{TYPE_LABEL[e.type]}{e.importance === "key" ? " · key" : ""}</div>
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-[0.68rem] leading-snug text-char-700">{e.summary}</p>
    </div>
  );
}

function SuspectCard({ s, x, y, sel, link, onDown }: { s: SuspectView; x: number; y: number; sel: boolean; link: boolean; onDown: (e: RPointerEvent) => void }) {
  return (
    <div data-card onPointerDown={onDown} className={`absolute cursor-grab select-none bg-paper-100 p-1.5 pb-2 shadow-card ${sel ? "outline outline-2 outline-amber-400" : ""} ${link ? "outline outline-[3px] outline-emerald-400" : ""}`}
      style={{ left: x, top: y, width: SIZE.suspect.w, height: SIZE.suspect.h, transform: "rotate(-1.5deg)" }}>
      <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-blood-500 shadow" />
      <Portrait spec={s.portrait} size={118} className="block h-auto w-full" name={s.name} />
      <div className="mt-1 text-center font-hand text-lg leading-none text-char-900">{s.name}</div>
    </div>
  );
}

