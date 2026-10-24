/** An explorable location: illustrated backdrop + props + clickable hotspots. */
import { Check } from "lucide-react";
import type { HotspotView, SceneKind } from "../../../shared/api";
import { Backdrop, SCENE_H, SCENE_W } from "./Backdrops";
import { renderProp } from "./Props";

export function Scene({ kind, hotspots, search, onInspect, focused }: { kind: SceneKind; hotspots: HotspotView[]; search: boolean; onInspect: (h: HotspotView) => void; focused?: string }) {
  // Hidden clues can be found by a sharp eye at any time; "search closely" highlights them.
  const hiddenStyle = (h: HotspotView) => h.subtle && !search;
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-card">
      <svg viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
        <Backdrop kind={kind} />
        {hotspots.map((h) => {
          // Hidden clues are still physically present, just hard to notice: drawn faintly until found.
          const b = { x: (h.x / 100) * SCENE_W, y: (h.y / 100) * SCENE_H, w: (h.w / 100) * SCENE_W, h: (h.h / 100) * SCENE_H };
          return <g key={h.id} opacity={h.subtle && !search ? 0.6 : 1}>{renderProp(h.prop, b)}</g>;
        })}
      </svg>
      <div className="rain slow" />
      <div className="vignette" />
      {hotspots.map((h) => (
        <button
          key={h.id}
          onClick={() => onInspect(h)}
          tabIndex={hiddenStyle(h) ? -1 : 0}
          aria-hidden={hiddenStyle(h) || undefined}
          aria-label={`${h.label}${h.resolved ? " (examined)" : ""}`}
          className={`group absolute rounded-md outline-none transition-all ${focused === h.id ? "ring-2 ring-amber-400" : ""} ${hiddenStyle(h) ? "cursor-default" : h.subtle ? "ring-1 ring-amber-300/70" : "hover:ring-2 hover:ring-amber-400/80 focus-visible:ring-2 focus-visible:ring-amber-400"}`}
          style={{ left: `${h.x}%`, top: `${h.y}%`, width: `${h.w}%`, height: `${h.h}%`, minWidth: 28, minHeight: 28 }}
        >
          {h.subtle && search && <span className="pointer-events-none absolute inset-0 animate-pulseRing rounded-md ring-2 ring-amber-300/60" />}
          {!hiddenStyle(h) && <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/85 px-2 py-0.5 text-[0.7rem] text-paper-100 group-hover:block group-focus-visible:block">{h.label}</span>}
          {h.resolved && <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-char-900 shadow"><Check size={11} strokeWidth={3} /></span>}
          {!h.resolved && h.inspected && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-300/80" />}
        </button>
      ))}
    </div>
  );
}
