/** Illustrated 2D map of Blackwood City with investigation markers. */
import { Lock, MapPin } from "lucide-react";
import type { LocationView } from "../../shared/api";

const MW = 1600;
const MH = 1000;

const DISTRICTS = [
  { name: "NORTHSIDE", x: 520, y: 110 },
  { name: "CIVIC QUARTER", x: 420, y: 300 },
  { name: "DOWNTOWN", x: 860, y: 360 },
  { name: "HARBOR HEIGHTS", x: 1240, y: 210 },
  { name: "OLD TOWN", x: 300, y: 700 },
  { name: "DOCKLANDS", x: 980, y: 660 },
];

export function CityMap({ locations, current, selected, onSelect }: { locations: LocationView[]; current: string; selected?: string; onSelect: (id: string) => void }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1018] shadow-card">
      <svg viewBox={`0 0 ${MW} ${MH}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <pattern id="blocks" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#121a26" />
            <rect x="6" y="6" width="48" height="48" fill="#172131" />
          </pattern>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0a1a2c" /><stop offset="1" stopColor="#050c16" /></linearGradient>
        </defs>
        <rect width={MW} height={MH} fill="url(#blocks)" />
        {/* harbour */}
        <path d="M1600 420 Q1380 470 1260 560 Q1150 650 1100 760 Q1040 900 1000 1000 L1600 1000 Z" fill="url(#sea)" />
        <path d="M0 880 Q300 840 560 900 Q760 950 1000 1000 L0 1000 Z" fill="url(#sea)" />
        {Array.from({ length: 30 }, (_, i) => <path key={i} d={`M${1120 + (i % 6) * 80} ${640 + Math.floor(i / 6) * 70} q12 -6 24 0`} stroke="#2d4766" strokeWidth="2" fill="none" />)}
        {/* piers */}
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1140 + i * 70} y={590 + i * 40} width="90" height="14" fill="#1e2a3b" transform={`rotate(-30 ${1140 + i * 70} ${590 + i * 40})`} />)}
        {/* park */}
        <ellipse cx="300" cy="420" rx="120" ry="80" fill="#14241c" />
        {/* avenues */}
        <g stroke="#2b3a52" strokeWidth="16" fill="none" strokeLinecap="round">
          <path d="M0 520 Q500 480 900 560 T1600 400" />
          <path d="M760 0 Q820 400 880 1000" />
          <path d="M120 0 Q300 500 260 1000" />
          <path d="M0 200 L1600 120" />
        </g>
        <g stroke="#202c3f" strokeWidth="6" fill="none">
          {Array.from({ length: 14 }, (_, i) => <line key={`v${i}`} x1={i * 120} y1="0" x2={i * 120 + 60} y2={MH} />)}
          {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 120} x2={MW} y2={i * 120 - 40} />)}
        </g>
        <text x="990" y="720" fontSize="20" fill="#4f6a8a" fontFamily="Special Elite, monospace" transform="rotate(-24 990 720)">DOCK STREET</text>
        <text x="1320" y="900" fontSize="34" fill="#2d4766" fontFamily="Playfair Display, serif" fontStyle="italic">Blackwood Harbour</text>
        {DISTRICTS.map((d) => <text key={d.name} x={d.x} y={d.y} fontSize="22" letterSpacing="6" fill="#3d5170" fontFamily="Inter, sans-serif" fontWeight="600">{d.name}</text>)}
        {/* Blackwood Tower */}
        <rect x="822" y="350" width="26" height="60" fill="#05070b" stroke="#e7b45a" strokeOpacity="0.4" />
        <circle cx="835" cy="346" r="5" fill="#ff5a4a" className="animate-flicker" />
        <text x="198" y="250" fontSize="16" fill="#4f6a8a" fontFamily="Inter, sans-serif">Grand Meridian Hotel</text>
        <rect x="236" y="256" width="40" height="24" fill="#1d2738" />
      </svg>
      <div className="rain slow" />
      {locations.map((l) => {
        const isCurrent = l.id === current;
        const isSel = l.id === selected;
        return (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            aria-label={`${l.name}${l.unlocked ? "" : " (locked)"}${isCurrent ? " — you are here" : ""}`}
            aria-pressed={isSel}
            className="group absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${l.mapPos.x}%`, top: `${l.mapPos.y}%` }}
          >
            <span className="flex flex-col items-center">
              <span className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg transition-transform group-hover:scale-110 ${l.unlocked ? (isSel ? "border-amber-300 bg-amber-500 text-char-900" : "border-amber-400 bg-char-900 text-amber-300") : "border-smoke-500 bg-char-800 text-smoke-400"}`}>
                {l.unlocked ? <MapPin size={17} /> : <Lock size={15} />}
                {l.isNew && <span className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-emerald-400" />}
                {isCurrent && <span className="absolute inset-0 animate-pulseRing rounded-full ring-2 ring-amber-300" />}
              </span>
              <span className={`mt-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[0.65rem] font-semibold sm:text-xs ${l.unlocked ? "bg-black/70 text-paper-100" : "bg-black/50 text-smoke-400"}`}>{l.unlocked ? l.name : "???"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
