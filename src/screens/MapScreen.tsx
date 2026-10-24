import { motion } from "framer-motion";
import { ArrowRight, Lock, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { audio } from "../audio";
import { CityMap } from "../components/CityMap";
import { GameLayout } from "../components/GameLayout";
import { Badge, Button, SectionTitle } from "../components/ui";
import { useGame } from "../game/GameContext";
import { NoCase } from "./NoCase";

export function MapScreen() {
  const { state, go } = useGame();
  const [sel, setSel] = useState<string | undefined>(state?.currentLocation);
  useEffect(() => { audio.setAmbience("street"); }, []);
  if (!state) return <NoCase />;
  const loc = state.locations.find((l) => l.id === sel);

  return (
    <GameLayout active="map">
      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <SectionTitle kicker={state.setting} title="City Map" right={<Badge tone="amber">{state.locations.filter((l) => l.unlocked).length} of {state.locations.length} locations open</Badge>} />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <CityMap locations={state.locations} current={state.currentLocation} selected={sel} onSelect={(id) => { setSel(id); audio.sfx("click"); }} />
          <motion.aside key={sel} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="panel h-fit p-5" aria-live="polite">
            {!loc ? <p className="text-smoke-300">Select a marker on the map.</p> : (
              <>
                <div className="label-caps">{loc.unlocked ? loc.district : "Locked lead"}</div>
                <h2 className="mt-1 flex items-center gap-2 font-display text-2xl font-bold text-paper-100">
                  {loc.unlocked ? <MapPin size={20} className="text-amber-400" /> : <Lock size={18} className="text-smoke-400" />}{loc.unlocked ? loc.name : "Unknown location"}
                </h2>
                {loc.unlocked ? (
                  <>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {loc.id === state.currentLocation && <Badge tone="amber">You are here</Badge>}
                      {loc.isNew && <Badge tone="green">New lead</Badge>}
                      {loc.visited && <Badge>{loc.cluesFound}/{loc.cluesTotal} clues found</Badge>}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-smoke-200">{loc.description}</p>
                    <Button variant="primary" className="mt-5 w-full" onClick={() => go(`scene/${loc.id}`)} disabled={state.status !== "active" && !loc.visited}>
                      {loc.id === state.currentLocation ? "Return to scene" : "Travel here"} <ArrowRight size={16} />
                    </Button>
                  </>
                ) : (
                  <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-3">
                    <div className="label-caps mb-1">How to unlock</div>
                    <p className="text-sm text-smoke-200">{loc.unlockHint}</p>
                  </div>
                )}
              </>
            )}
            <div className="mt-6 border-t border-white/5 pt-4">
              <div className="label-caps mb-2">All locations</div>
              <ul className="space-y-1">
                {state.locations.map((l) => (
                  <li key={l.id}>
                    <button onClick={() => setSel(l.id)} className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-white/5 ${sel === l.id ? "text-amber-300" : l.unlocked ? "text-smoke-200" : "text-smoke-500"}`}>
                      <span className="flex items-center gap-2">{l.unlocked ? <MapPin size={13} /> : <Lock size={13} />}{l.unlocked ? l.name : "Locked lead"}</span>
                      {l.unlocked && <span className="text-xs text-smoke-500">{l.cluesFound}/{l.cluesTotal}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        </div>
      </div>
    </GameLayout>
  );
}
