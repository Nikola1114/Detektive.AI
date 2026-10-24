import { AnimatePresence, motion } from "framer-motion";
import { Camera, CheckCircle2, Eye, Hand, Map as MapIcon, NotebookPen, Search, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { HotspotView, InspectResult } from "../../shared/api";
import { api } from "../api";
import { audio } from "../audio";
import { GameLayout } from "../components/GameLayout";
import { Scene } from "../components/scene/Scene";
import { Badge, Button } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

export function CrimeScene() {
  const { state, route, go, mutate, caseId, notify } = useGame();
  const locId = route.param ?? state?.currentLocation ?? "";
  const loc = state?.locations.find((l) => l.id === locId);
  const [spots, setSpots] = useState<HotspotView[]>([]);
  const [search, setSearch] = useState(false);
  const [panel, setPanel] = useState<InspectResult | null>(null);
  const [noted, setNoted] = useState(false);

  const loadSpots = useCallback(async () => {
    if (!caseId || !loc?.unlocked) return;
    try { setSpots(await api<HotspotView[]>("GET", `/api/cases/${caseId}/locations/${locId}/hotspots`)); } catch { setSpots([]); }
  }, [caseId, locId, loc?.unlocked]);

  // Arriving at a location records the visit.
  useEffect(() => {
    if (!state || !loc?.unlocked) return;
    if (state.status !== "active") { void loadSpots(); return; }
    if (state.currentLocation !== locId || !loc.visited) void mutate("POST", "/travel", { locationId: locId }).then(loadSpots);
    else void loadSpots();
    audio.setAmbience(loc.scene === "bar" ? "street" : "scene");
    setPanel(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locId, loc?.unlocked]);

  if (!state) return <NoCase />;
  if (!loc) return <GameLayout active="map"><div className="p-8">Unknown location. <Button onClick={() => go("map")}>Open the map</Button></div></GameLayout>;
  if (!loc.unlocked) {
    return (
      <GameLayout active="map">
        <div className="mx-auto max-w-xl p-8 text-center">
          <h1 className="font-display text-3xl text-paper-100">Location locked</h1>
          <p className="mt-3 text-smoke-300">{loc.unlockHint}</p>
          <Button className="mt-6" onClick={() => go("map")}><MapIcon size={16} />Back to the map</Button>
        </div>
      </GameLayout>
    );
  }

  const inspectSpot = async (h: HotspotView) => {
    if (state.status !== "active") { notify("info", "This case is closed."); return; }
    audio.sfx("click");
    setNoted(false);
    const r = await mutate<InspectResult>("POST", "/inspect", { hotspotId: h.id });
    if (r) { setPanel(r); void loadSpots(); }
  };

  const doAction = async (action: "collect" | "photograph") => {
    if (!panel) return;
    await mutate("POST", "/act", { hotspotId: panel.hotspotId, action });
    setPanel({ ...panel, resolved: panel.action === action || action === "collect" ? true : panel.resolved });
    void loadSpots();
  };

  const addObservation = async () => {
    if (!panel) return;
    await mutate("POST", "/notes", { text: panel.noteText, tag: "note", ref: panel.hotspotId });
    setNoted(true);
  };

  const hidden = spots.filter((s) => s.subtle).length;

  return (
    <GameLayout active="map">
      <div className="mx-auto max-w-7xl p-3 sm:p-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="label-caps">{loc.district}</div>
            <h1 className="font-display text-3xl font-bold text-paper-100">{loc.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="amber">{loc.cluesFound}/{loc.cluesTotal} clues here</Badge>
            <Button size="sm" variant={search ? "primary" : "outline"} onClick={() => { setSearch((s) => !s); audio.sfx("click"); }} aria-pressed={search}>
              <Search size={15} />{search ? "Searching closely" : "Search closely"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => go("map")}><MapIcon size={15} />Map</Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div>
            <Scene kind={loc.scene} hotspots={spots} search={search} onInspect={inspectSpot} focused={panel?.hotspotId} />
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-smoke-300">{loc.description}</p>
            {search && <p className="mt-2 text-sm text-amber-300/90">{hidden > 0 ? `You sweep the room inch by inch. ${hidden} detail${hidden > 1 ? "s" : ""} you might have missed now stand${hidden > 1 ? "" : "s"} out.` : "You search every corner. Nothing else hidden here."}</p>}
          </div>

          <aside className="panel h-fit p-4" aria-label="Points of interest">
            <div className="label-caps mb-3 flex items-center gap-2"><Eye size={14} />Points of interest</div>
            <ul className="flex flex-col gap-1">
              {spots.filter((s) => !s.subtle || search).map((s) => (
                <li key={s.id}>
                  <button onClick={() => inspectSpot(s)} className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition hover:bg-white/5 ${panel?.hotspotId === s.id ? "bg-amber-500/10 text-amber-200" : "text-smoke-200"}`}>
                    {s.resolved ? <CheckCircle2 size={15} className="shrink-0 text-amber-400" /> : <span className={`h-3.5 w-3.5 shrink-0 rounded-full border ${s.inspected ? "border-amber-300 bg-amber-300/30" : "border-smoke-400"}`} />}
                    <span className="truncate">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
            {!search && hidden > 0 && <p className="mt-3 text-xs text-smoke-500">Some details only reveal themselves when you search closely.</p>}
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {panel && (
          <motion.div
            key={panel.hotspotId}
            role="dialog" aria-label={`Inspecting ${panel.label}`}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-2xl md:bottom-6"
          >
            <div className="panel-paper relative p-5 pr-10">
              <button onClick={() => setPanel(null)} className="absolute right-3 top-3 rounded p-1 text-char-600 hover:bg-black/5" aria-label="Close"><X size={18} /></button>
              <div className="font-type text-xs uppercase tracking-widest text-char-500">Inspection</div>
              <h2 className="font-display text-xl font-bold text-char-900">{panel.evidenceTitle ?? panel.label}</h2>
              <p className="mt-2 whitespace-pre-line font-type text-[0.95rem] leading-relaxed text-char-800">{panel.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {panel.evidenceId && panel.action === "collect" && (
                  <Button variant="paper" className="!bg-char-900 !text-amber-300 hover:!bg-char-800" onClick={() => doAction("collect")} disabled={panel.resolved || state.status !== "active"}>
                    <Hand size={15} />{panel.resolved ? "In evidence" : "Collect evidence"}
                  </Button>
                )}
                {panel.evidenceId && (
                  <Button variant="paper" className="border border-char-900/20" onClick={() => doAction("photograph")} disabled={state.status !== "active" || (panel.action === "photograph" && panel.resolved)}>
                    <Camera size={15} />{panel.action === "photograph" ? (panel.resolved ? "Photographed & logged" : "Photograph & log") : "Photograph"}
                  </Button>
                )}
                <Button variant="paper" className="border border-char-900/20" onClick={addObservation} disabled={noted}>
                  <NotebookPen size={15} />{noted ? "Noted" : "Add observation to notebook"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameLayout>
  );
}
