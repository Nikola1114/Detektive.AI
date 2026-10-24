/**
 * Small illustrated objects drawn at hotspot positions. Each renderer receives
 * the hotspot's box in scene units (1600×900) and draws within it.
 */
import type { ReactNode } from "react";

export interface Box { x: number; y: number; w: number; h: number; }
type Prop = (b: Box) => ReactNode;

const cx = (b: Box) => b.x + b.w / 2;
const cy = (b: Box) => b.y + b.h / 2;

const PROPS: Record<string, Prop> = {
  watch: (b) => (
    <g>
      <rect x={cx(b) - 30} y={cy(b) - 7} width="60" height="14" rx="4" fill="#5b5f66" />
      <circle cx={cx(b)} cy={cy(b)} r="18" fill="#c9ccd1" stroke="#7d8189" strokeWidth="3" />
      <circle cx={cx(b)} cy={cy(b)} r="14" fill="#1b1e24" />
      <path d={`M${cx(b) - 12} ${cy(b) - 8} L${cx(b) + 10} ${cy(b) + 9} M${cx(b) + 6} ${cy(b) - 12} L${cx(b) - 4} ${cy(b) + 12}`} stroke="#9aa3ad" strokeWidth="1" opacity="0.8" />
      <path d={`M${cx(b)} ${cy(b)} L${cx(b) - 2} ${cy(b) - 10} M${cx(b)} ${cy(b)} L${cx(b) + 6} ${cy(b) + 2}`} stroke="#e7b45a" strokeWidth="2" />
    </g>
  ),
  glass: (b) => (
    <g>
      <path d={`M${b.x + 6} ${b.y + 10} L${b.x + b.w - 6} ${b.y + 10} L${b.x + b.w - 10} ${b.y + b.h - 4} L${b.x + 10} ${b.y + b.h - 4} Z`} fill="#ffffff" fillOpacity="0.12" stroke="#d8e2ee" strokeOpacity="0.6" strokeWidth="2" />
      <path d={`M${b.x + 9} ${cy(b) + 4} L${b.x + b.w - 9} ${cy(b) + 4} L${b.x + b.w - 10} ${b.y + b.h - 6} L${b.x + 10} ${b.y + b.h - 6} Z`} fill="#b8741f" fillOpacity="0.75" />
    </g>
  ),
  trophy: (b) => (
    <g>
      <rect x={cx(b) - 22} y={b.y + b.h - 18} width="44" height="16" fill="#6a6f78" />
      <path d={`M${cx(b) - 14} ${b.y + b.h - 18} L${cx(b) - 8} ${b.y + 26} L${cx(b) + 8} ${b.y + 26} L${cx(b) + 14} ${b.y + b.h - 18} Z`} fill="#cfe3f5" fillOpacity="0.45" stroke="#eaf4ff" strokeOpacity="0.7" />
      <rect x={cx(b) - 11} y={b.y + 12} width="22" height="16" fill="#fff6d8" fillOpacity="0.55" stroke="#eaf4ff" strokeOpacity="0.7" />
      <path d={`M${cx(b) - 13} ${b.y + 12} L${cx(b)} ${b.y + 2} L${cx(b) + 13} ${b.y + 12} Z`} fill="#eaf4ff" fillOpacity="0.6" />
    </g>
  ),
  cufflink: (b) => <g><ellipse cx={cx(b)} cy={cy(b)} rx="10" ry="7" fill="#d5d9de" stroke="#8a9098" strokeWidth="2" /><circle cx={cx(b) + 3} cy={cy(b) - 2} r="2" fill="#fff" /></g>,
  footprint: (b) => (
    <g fill="#8fa3b8" fillOpacity="0.35">
      <ellipse cx={cx(b) - 10} cy={cy(b) - 4} rx="24" ry="10" transform={`rotate(-12 ${cx(b)} ${cy(b)})`} />
      <ellipse cx={cx(b) + 26} cy={cy(b) + 4} rx="8" ry="7" />
    </g>
  ),
  keypad: (b) => (
    <g>
      <rect x={b.x + 8} y={b.y + 6} width={b.w - 16} height={b.h - 12} rx="4" fill="#20242b" stroke="#596170" />
      <circle cx={cx(b)} cy={b.y + 20} r="5" fill="#d0564e" />
      <rect x={cx(b) - 12} y={b.y + 34} width="24" height="30" rx="2" fill="#2f353f" />
    </g>
  ),
  monitor: (b) => (
    <g>
      <rect x={b.x} y={b.y} width={b.w} height={b.h * 0.78} rx="6" fill="#111418" stroke="#3b414b" strokeWidth="3" />
      <rect x={b.x + 8} y={b.y + 8} width={b.w - 16} height={b.h * 0.78 - 16} fill="#1f3550" />
      <g fill="#9cc2e6" opacity="0.6">{[0, 1, 2, 3].map((i) => <rect key={i} x={b.x + 18} y={b.y + 20 + i * 14} width={(b.w - 40) * (i % 2 ? 0.6 : 0.9)} height="5" />)}</g>
      <rect x={cx(b) - 8} y={b.y + b.h * 0.78} width="16" height={b.h * 0.16} fill="#2a2e35" />
      <rect x={cx(b) - 34} y={b.y + b.h * 0.94} width="68" height="7" rx="3" fill="#2a2e35" />
    </g>
  ),
  laptop: (b) => (
    <g>
      <path d={`M${b.x + 14} ${b.y} L${b.x + b.w - 14} ${b.y} L${b.x + b.w - 14} ${b.y + b.h * 0.72} L${b.x + 14} ${b.y + b.h * 0.72} Z`} fill="#111418" stroke="#4a515c" strokeWidth="2" />
      <rect x={b.x + 22} y={b.y + 8} width={b.w - 44} height={b.h * 0.72 - 16} fill="#24405f" />
      <g fill="#cfe2f5" opacity="0.55">{[0, 1, 2].map((i) => <rect key={i} x={b.x + (i % 2 ? 60 : 30)} y={b.y + 18 + i * 16} width="70" height="9" rx="4" />)}</g>
      <path d={`M${b.x} ${b.y + b.h} L${b.x + b.w} ${b.y + b.h} L${b.x + b.w - 12} ${b.y + b.h * 0.74} L${b.x + 12} ${b.y + b.h * 0.74} Z`} fill="#3a3f48" />
    </g>
  ),
  drawer: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="#1c1410" stroke="#3b2a20" strokeWidth="2" /><rect x={cx(b) - 16} y={cy(b) - 3} width="32" height="6" rx="3" fill="#b89a62" /></g>,
  cable: (b) => <path d={`M${b.x} ${b.y + b.h - 4} C ${b.x + 30} ${b.y - 10}, ${b.x + 60} ${b.y + b.h + 10}, ${b.x + b.w} ${b.y + 8}`} stroke="#c8c8c8" strokeWidth="3" fill="none" />,
  papers: (b) => (
    <g>
      <rect x={b.x + 6} y={b.y + 8} width={b.w - 12} height={b.h - 10} fill="#d8d0bf" transform={`rotate(-4 ${cx(b)} ${cy(b)})`} />
      <rect x={b.x + 4} y={b.y + 4} width={b.w - 12} height={b.h - 10} fill="#efe7d6" />
      <g stroke="#7d7466" strokeWidth="2" opacity="0.6">{[0, 1, 2, 3].map((i) => <line key={i} x1={b.x + 14} x2={b.x + b.w - 20} y1={b.y + 16 + i * 10} y2={b.y + 16 + i * 10} />)}</g>
      <line x1={b.x + 14} x2={b.x + 50} y1={b.y + 16} y2={b.y + 16} stroke="#b23a33" strokeWidth="3" />
    </g>
  ),
  note: (b) => <g><rect x={b.x + 4} y={b.y + 4} width={b.w - 8} height={b.h - 8} fill="#efe7d6" transform={`rotate(3 ${cx(b)} ${cy(b)})`} /><circle cx={cx(b)} cy={b.y + 10} r="5" fill="#b23a33" /></g>,
  folder: (b) => <g><rect x={b.x} y={b.y + 6} width={b.w} height={b.h - 6} rx="3" fill="#b99a5e" /><rect x={b.x} y={b.y} width={b.w * 0.4} height="12" rx="3" fill="#b99a5e" /><rect x={b.x + 10} y={b.y + 18} width={b.w * 0.5} height="10" fill="#efe7d6" /></g>,
  "evidence-bag": (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="#c9d4dd" fillOpacity="0.25" stroke="#c9d4dd" strokeOpacity="0.6" /><rect x={b.x} y={b.y} width={b.w} height="14" fill="#b23a33" opacity="0.8" /><circle cx={cx(b) - 10} cy={cy(b) + 8} r="9" fill="none" stroke="#c8b88a" strokeWidth="3" /></g>,
  tray: (b) => <g><rect x={b.x} y={b.y + b.h * 0.4} width={b.w} height={b.h * 0.6} rx="3" fill="#8d959e" /><rect x={b.x + 12} y={b.y} width={b.w * 0.5} height={b.h * 0.6} fill="#c9d4dd" fillOpacity="0.3" stroke="#e0e6ec" /></g>,
  corkboard: (b) => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`rotate(${(i % 2 ? -3 : 4)} ${b.x + 20 + (i % 3) * 66} ${b.y + 10 + Math.floor(i / 3) * 80})`}>
          <rect x={b.x + (i % 3) * 66} y={b.y + Math.floor(i / 3) * 80} width="58" height="70" fill="#e9e1d0" />
          <rect x={b.x + 6 + (i % 3) * 66} y={b.y + 6 + Math.floor(i / 3) * 80} width="46" height="44" fill="#4a4f58" />
          <circle cx={b.x + 29 + (i % 3) * 66} cy={b.y + 4 + Math.floor(i / 3) * 80} r="4" fill="#b23a33" />
        </g>
      ))}
    </g>
  ),
  cabinet: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#3f454c" stroke="#5b626b" /><rect x={cx(b) - 18} y={cy(b) - 4} width="36" height="8" rx="2" fill="#a8adb4" /><rect x={cx(b) - 14} y={b.y + 10} width="28" height="12" fill="#efe7d6" /></g>,
  terminal: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h * 0.75} rx="4" fill="#0d1210" stroke="#3b453f" strokeWidth="2" /><g fill="#7fe0a0" opacity="0.7">{[0, 1, 2, 3].map((i) => <rect key={i} x={b.x + 12} y={b.y + 10 + i * 11} width={(b.w - 30) * ((i * 37) % 10 > 4 ? 0.8 : 0.5)} height="4" />)}</g><rect x={b.x + 10} y={b.y + b.h * 0.8} width={b.w - 20} height={b.h * 0.18} rx="2" fill="#2a2f35" /></g>,
  clipboard: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" fill="#8a6a43" /><rect x={b.x + 6} y={b.y + 10} width={b.w - 12} height={b.h - 16} fill="#efe7d6" /><rect x={cx(b) - 14} y={b.y - 2} width="28" height="10" rx="2" fill="#b8bcc2" /></g>,
  screen: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#0b0d10" stroke="#3a4048" strokeWidth="4" /><rect x={b.x + 6} y={b.y + 6} width={b.w - 12} height={b.h - 12} fill="#3d4a40" opacity="0.8" /><rect x={b.x + 6} y={b.y + b.h * 0.55} width={b.w - 12} height={b.h * 0.45 - 6} fill="#26302a" /><rect x={b.x + b.w * 0.45} y={b.y + b.h * 0.3} width="10" height="26" fill="#11161a" /><text x={b.x + 12} y={b.y + 22} fontSize="12" fill="#c9f0c9" fontFamily="monospace">REC</text></g>,
  box: (b) => <g><rect x={b.x} y={b.y + 8} width={b.w} height={b.h - 8} fill="#6d5233" /><rect x={b.x} y={b.y} width={b.w} height="10" fill="#8a6a43" /><g fill="#efe7d6">{[0, 1, 2].map((i) => <rect key={i} x={b.x + 8 + i * 30} y={b.y - 6} width="24" height="14" />)}</g></g>,
  book: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="#5a1e22" /><rect x={b.x + 4} y={b.y + 4} width={b.w - 8} height={b.h - 8} fill="#efe7d6" /><line x1={cx(b)} x2={cx(b)} y1={b.y + 4} y2={b.y + b.h - 4} stroke="#5a1e22" strokeWidth="3" /></g>,
  logbook: (b) => <g><rect x={b.x} y={b.y + b.h * 0.3} width={b.w} height={b.h * 0.7} fill="#2b2f36" /><rect x={b.x + 10} y={b.y + b.h * 0.2} width={b.w - 20} height={b.h * 0.5} fill="#efe7d6" /><g stroke="#7d7466">{[0, 1, 2].map((i) => <line key={i} x1={b.x + 18} x2={b.x + b.w - 24} y1={b.y + b.h * 0.3 + i * 9} y2={b.y + b.h * 0.3 + i * 9} />)}</g></g>,
  binder: (b) => <g>{[0, 1, 2, 3].map((i) => <rect key={i} x={b.x + i * (b.w / 4)} y={b.y + (i === 2 ? 0 : 10)} width={b.w / 4 - 2} height={b.h - (i === 2 ? 0 : 10)} fill={["#26405e", "#5a1e22", "#7a5a1f", "#2f4a33"][i]} />)}<rect x={b.x + 2 * (b.w / 4) + 3} y={b.y + 20} width={b.w / 4 - 8} height="18" fill="#efe7d6" /></g>,
  ledger: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="#efe7d6" transform={`rotate(-6 ${cx(b)} ${cy(b)})`} /><g stroke="#8a2a25" strokeWidth="2" opacity="0.5">{[0, 1, 2].map((i) => <line key={i} x1={b.x + 10} x2={b.x + b.w - 14} y1={b.y + 12 + i * 10} y2={b.y + 12 + i * 10} />)}</g></g>,
  napkin: (b) => <g><rect x={b.x + 8} y={b.y + 6} width={b.w - 16} height={b.h - 10} fill="#f4ecdc" transform={`rotate(10 ${cx(b)} ${cy(b)})`} /><circle cx={b.x + b.w - 14} cy={b.y + 12} r="12" fill="#3a3d46" /></g>,
  safe: (b) => (
    <g>
      <rect x={b.x + 10} y={b.y + 20} width={b.w - 20} height={b.h - 40} fill="#2a2d33" stroke="#5c626b" strokeWidth="3" />
      <rect x={b.x + 20} y={b.y + 32} width={b.w - 40} height={b.h - 64} fill="#0d0f12" />
      <circle cx={cx(b)} cy={cy(b)} r="12" fill="#6b717a" />
      <path d={`M${b.x + b.w - 8} ${b.y} L${b.x + b.w + 40} ${b.y + 20} L${b.x + b.w + 40} ${b.y + b.h - 20} L${b.x + b.w - 8} ${b.y + b.h} Z`} fill="#25324a" stroke="#b99a5e" strokeWidth="4" />
    </g>
  ),
  tablet: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="6" fill="#0f1114" stroke="#4a515c" strokeWidth="2" /><rect x={b.x + 6} y={b.y + 8} width={b.w - 12} height={b.h - 16} fill="#2d4a6a" /></g>,
  frame: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} fill="#b99a5e" /><rect x={b.x + 6} y={b.y + 6} width={b.w - 12} height={b.h - 12} fill="#47505c" /><circle cx={cx(b) - 8} cy={cy(b) - 4} r="7" fill="#c8b9a5" /><circle cx={cx(b) + 10} cy={cy(b) - 2} r="7" fill="#c8b9a5" /></g>,
  notebook: (b) => <g><rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill="#e9e1d0" /><g fill="#555">{[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={b.x + 10 + i * 16} cy={b.y + 4} r="2" />)}</g></g>,
  coat: (b) => <g><circle cx={cx(b)} cy={b.y + 6} r="6" fill="#8d8f94" /><path d={`M${cx(b)} ${b.y + 10} L${b.x + 10} ${b.y + 70} L${b.x + 4} ${b.y + b.h} L${b.x + b.w - 4} ${b.y + b.h} L${b.x + b.w - 10} ${b.y + 70} Z`} fill="#1b2638" /><path d={`M${cx(b)} ${b.y + 12} L${cx(b)} ${b.y + b.h}`} stroke="#0e141f" strokeWidth="3" /><rect x={b.x + b.w - 50} y={b.y + b.h * 0.55} width="34" height="18" rx="2" fill="#0e141f" /></g>,
  boots: (b) => <g fill="#2b2a30" stroke="#55535c" strokeWidth="2">{[0, 1].map((i) => <path key={i} d={`M${b.x + 14 + i * 56} ${b.y + 6} L${b.x + 40 + i * 56} ${b.y + 6} L${b.x + 42 + i * 56} ${b.y + b.h - 18} L${b.x + 64 + i * 56} ${b.y + b.h - 10} L${b.x + 64 + i * 56} ${b.y + b.h} L${b.x + 12 + i * 56} ${b.y + b.h} Z`} />)}</g>,
  decanter: (b) => <g><path d={`M${cx(b) - 8} ${b.y + 4} L${cx(b) + 8} ${b.y + 4} L${cx(b) + 8} ${b.y + 26} L${cx(b) + 26} ${b.y + 50} L${cx(b) + 26} ${b.y + 90} L${cx(b) - 26} ${b.y + 90} L${cx(b) - 26} ${b.y + 50} L${cx(b) - 8} ${b.y + 26} Z`} fill="#ffffff" fillOpacity="0.14" stroke="#e6eef6" strokeOpacity="0.5" /><rect x={cx(b) - 25} y={b.y + 60} width="50" height="29" fill="#b8741f" fillOpacity="0.7" /></g>,
  person: (b) => (
    <g>
      <ellipse cx={cx(b)} cy={b.y + b.h * 0.18} rx={b.w * 0.2} ry={b.h * 0.13} fill="#14171c" />
      <path d={`M${b.x + b.w * 0.08} ${b.y + b.h} Q${b.x + b.w * 0.1} ${b.y + b.h * 0.36} ${cx(b)} ${b.y + b.h * 0.33} Q${b.x + b.w * 0.9} ${b.y + b.h * 0.36} ${b.x + b.w * 0.92} ${b.y + b.h} Z`} fill="#14171c" />
      <ellipse cx={cx(b) - b.w * 0.06} cy={b.y + b.h * 0.17} rx={b.w * 0.07} ry={b.h * 0.08} fill="#e7b45a" opacity="0.12" />
    </g>
  ),
};

export function renderProp(prop: string, b: Box): ReactNode {
  if (prop === "none") return null;
  const r = PROPS[prop];
  if (r) return r(b);
  return <rect x={b.x + b.w * 0.2} y={b.y + b.h * 0.2} width={b.w * 0.6} height={b.h * 0.6} rx="6" fill="#e7b45a" fillOpacity="0.18" stroke="#e7b45a" strokeOpacity="0.4" />;
}
