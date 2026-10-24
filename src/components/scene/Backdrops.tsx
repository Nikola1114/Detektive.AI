/**
 * Illustrated backdrops for each scene kind, drawn in a 1600×900 space.
 * Furniture is positioned to match where authored hotspots place their props.
 */
import type { ReactNode } from "react";
import type { SceneKind } from "../../../shared/api";

const W = 1600;
const H = 900;

function Skyline({ x, y, w, h, seed = 1, lit = 0.35 }: { x: number; y: number; w: number; h: number; seed?: number; lit?: number }) {
  const buildings: ReactNode[] = [];
  let cursor = x;
  let s = seed;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  while (cursor < x + w) {
    const bw = 30 + rnd() * 70;
    const bh = h * (0.25 + rnd() * 0.7);
    buildings.push(<rect key={cursor} x={cursor} y={y + h - bh} width={bw} height={bh} fill={rnd() > 0.5 ? "#0e1420" : "#121a28"} />);
    for (let wy = y + h - bh + 10; wy < y + h - 6; wy += 14) {
      for (let wx = cursor + 6; wx < cursor + bw - 6; wx += 11) {
        if (rnd() < lit) buildings.push(<rect key={`${wx}-${wy}`} x={wx} y={wy} width="4" height="6" fill={rnd() > 0.85 ? "#f3cf85" : "#c9a45a"} opacity={0.35 + rnd() * 0.5} />);
      }
    }
    cursor += bw + 4;
  }
  return <g>{buildings}</g>;
}

function Window({ x, y, w, h, panes = 3, seed = 3, children }: { x: number; y: number; w: number; h: number; panes?: number; seed?: number; children?: ReactNode }) {
  const id = `win${x}${y}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a1220" /><stop offset="1" stopColor="#1c2a40" /></linearGradient>
        <clipPath id={`${id}-clip`}><rect x={x} y={y} width={w} height={h} /></clipPath>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#${id}-sky)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {children ?? <Skyline x={x} y={y + h * 0.3} w={w} h={h * 0.7} seed={seed} />}
        {Array.from({ length: 40 }, (_, i) => (
          <line key={i} x1={x + ((i * 97) % w)} y1={y + ((i * 53) % h)} x2={x + ((i * 97) % w) - 6} y2={y + ((i * 53) % h) + 26} stroke="#a9bdd6" strokeOpacity="0.25" strokeWidth="1.5" />
        ))}
      </g>
      {Array.from({ length: panes - 1 }, (_, i) => <rect key={i} x={x + (w / panes) * (i + 1) - 4} y={y} width="8" height={h} fill="#05070a" />)}
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#05070a" strokeWidth="12" />
    </g>
  );
}

const Floor = ({ y, from, to }: { y: number; from: string; to: string }) => (
  <g>
    <defs><linearGradient id={`floor${y}${from}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
    <rect x="0" y={y} width={W} height={H - y} fill={`url(#floor${y}${from})`} />
    {Array.from({ length: 9 }, (_, i) => <line key={i} x1={W / 2} y1={y} x2={(i - 4) * 420 + W / 2} y2={H} stroke="#000" strokeOpacity="0.25" />)}
  </g>
);

const Wall = ({ from, to, h = 620 }: { from: string; to: string; h?: number }) => (
  <g>
    <defs><linearGradient id={`wall${from}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={from} /><stop offset="1" stopColor={to} /></linearGradient></defs>
    <rect x="0" y="0" width={W} height={h} fill={`url(#wall${from})`} />
  </g>
);

const Lamp = ({ x, y, r = 380, o = 0.22 }: { x: number; y: number; r?: number; o?: number }) => (
  <g>
    <defs><radialGradient id={`lamp${x}${y}`}><stop offset="0" stopColor="#f3cf85" stopOpacity={o} /><stop offset="1" stopColor="#f3cf85" stopOpacity="0" /></radialGradient></defs>
    <circle cx={x} cy={y} r={r} fill={`url(#lamp${x}${y})`} />
  </g>
);

function Office() {
  return (
    <g>
      <Wall from="#1c2331" to="#0f141d" />
      <Window x={120} y={40} w={760} h={500} panes={4} seed={7} />
      <Floor y={620} from="#1a1410" to="#090706" />
      {/* door */}
      <rect x="0" y="150" width="150" height="620" fill="#14100d" stroke="#2c2219" strokeWidth="8" />
      <rect x="120" y="440" width="10" height="40" rx="3" fill="#a88a55" />
      {/* bar cart */}
      <g fill="#2b2420" stroke="#4a3b2c" strokeWidth="3"><rect x="225" y="600" width="170" height="12" /><rect x="225" y="690" width="170" height="12" /><line x1="232" y1="600" x2="232" y2="740" /><line x1="388" y1="600" x2="388" y2="740" /></g>
      <circle cx="240" cy="748" r="9" fill="#111" /><circle cx="380" cy="748" r="9" fill="#111" />
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={300 + i * 16} y="660" width="12" height="28" fill="#fff" fillOpacity="0.12" />)}
      {/* shelf */}
      <g fill="#2b2017">{[200, 342, 450].map((y) => <rect key={y} x="1312" y={y} width="260" height="10" />)}</g>
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={1320 + i * 16} y={160} width="12" height="40" fill={["#3a2a22", "#2a3442", "#4a3a20", "#26303a", "#3d2626", "#2a2a2a"][i]} />)}
      {[0, 1, 2].map((i) => <rect key={i} x={1490 + i * 18} y={400} width="14" height="50" fill={["#2a3442", "#4a3a20", "#3d2626"][i]} />)}
      <rect x="1376" y="336" width="96" height="6" fill="#e9e1d0" opacity="0.08" />
      {/* desk */}
      <rect x="760" y="500" width="630" height="40" fill="#2a1d14" />
      <rect x="760" y="500" width="630" height="6" fill="#4a3426" />
      <rect x="780" y="540" width="16" height="250" fill="#1d140e" />
      <rect x="1170" y="540" width="200" height="250" fill="#22170f" stroke="#3b2a20" strokeWidth="2" />
      {/* desk lamp */}
      <path d="M800 500 L812 420 L860 404" stroke="#3a3f48" strokeWidth="6" fill="none" />
      <path d="M840 392 L900 420 L870 436 Z" fill="#1f2328" />
      <Lamp x={880} y={460} r={420} o={0.28} />
      {/* side table + printer */}
      <rect x="1395" y="585" width="170" height="14" fill="#2a1d14" />
      <rect x="1405" y="599" width="12" height="170" fill="#1d140e" /><rect x="1543" y="599" width="12" height="170" fill="#1d140e" />
      <rect x="1410" y="545" width="140" height="44" rx="4" fill="#202328" />
      {/* tape outline */}
      <path d="M590 790 Q620 760 680 772 L760 760 L800 790 L860 800 L840 830 L760 820 L700 850 L620 845 Z" fill="none" stroke="#e9e1d0" strokeOpacity="0.35" strokeWidth="4" strokeDasharray="10 8" />
      <text x="640" y="880" fontSize="18" fill="#e7b45a" opacity="0.5" fontFamily="Special Elite, monospace">POLICE LINE — DO NOT CROSS</text>
    </g>
  );
}

function Police() {
  return (
    <g>
      <Wall from="#202826" to="#141a19" />
      <Floor y={620} from="#1e2223" to="#0b0d0e" />
      <rect x="0" y="20" width={W} height="10" fill="#e9f0f2" opacity="0.08" />
      <rect x="500" y="10" width="600" height="14" rx="4" fill="#dfe8ea" opacity="0.5" />
      <Lamp x={800} y={0} r={700} o={0.08} />
      {/* corkboard */}
      <rect x="130" y="100" width="440" height="310" fill="#5e432b" stroke="#2c2016" strokeWidth="10" />
      <path d="M260 220 L460 200 L380 330" stroke="#b23a33" strokeWidth="2" fill="none" />
      {/* blinds */}
      <Window x={640} y={60} w={480} h={300} panes={2} seed={11} />
      {Array.from({ length: 14 }, (_, i) => <rect key={i} x="640" y={64 + i * 21} width="480" height="9" fill="#0a0d10" opacity="0.65" />)}
      {/* evidence table */}
      <rect x="80" y="590" width="420" height="16" fill="#3a3f45" />
      <rect x="92" y="606" width="12" height="170" fill="#2a2e33" /><rect x="476" y="606" width="12" height="170" fill="#2a2e33" />
      {/* desk */}
      <rect x="560" y="520" width="640" height="40" fill="#3b3226" />
      <rect x="575" y="560" width="610" height="200" fill="#2c251c" />
      <rect x="590" y="470" width="40" height="50" fill="#20242a" />
      {/* filing cabinets */}
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={1260 + i * 140} y="300" width="130" height="500" fill="#3a4047" stroke="#262b30" strokeWidth="3" />
          {[0, 1, 2, 3].map((d) => <rect key={d} x={1300 + i * 140} y={340 + d * 120} width="50" height="10" rx="3" fill="#8b9097" />)}
        </g>
      ))}
    </g>
  );
}

function Security() {
  return (
    <g>
      <Wall from="#141922" to="#0b0e14" h={900} />
      {/* monitor wall */}
      {Array.from({ length: 3 }, (_, r) => Array.from({ length: 5 }, (_, c) => (
        <g key={`${r}-${c}`}>
          <rect x={150 + c * 200} y={100 + r * 135} width="186" height="120" fill="#06080a" stroke="#2a3038" strokeWidth="4" />
          <rect x={158 + c * 200} y={108 + r * 135} width="170" height="104" fill={(r + c) % 3 === 0 ? "#111" : "#1c2620"} opacity="0.9" />
        </g>
      )))}
      <Lamp x={560} y={260} r={520} o={0.07} />
      {/* console */}
      <rect x="90" y="500" width="980" height="30" fill="#262b33" />
      <rect x="100" y="530" width="960" height="210" fill="#1a1e24" />
      <Floor y={740} from="#141619" to="#08090a" />
      {/* binder shelf */}
      <rect x="1060" y="200" width="120" height="8" fill="#3a3f47" /><rect x="1060" y="345" width="120" height="8" fill="#3a3f47" />
      {/* server rack */}
      <rect x="1216" y="162" width="208" height="560" fill="#0d0f13" stroke="#2c3139" strokeWidth="4" />
      {Array.from({ length: 16 }, (_, i) => (
        <g key={i}><rect x="1230" y={178 + i * 33} width="180" height="26" fill="#161a20" />
          <circle cx="1246" cy={191 + i * 33} r="3" fill={i % 3 ? "#7fe0a0" : "#e7b45a"} className={i % 4 === 0 ? "animate-flicker" : ""} /></g>
      ))}
      {/* chair */}
      <path d="M520 600 Q560 560 640 600 L640 700 L520 700 Z" fill="#0b0d10" />
    </g>
  );
}

function Bar() {
  return (
    <g>
      <Wall from="#24170f" to="#120b07" h={900} />
      {/* shelves & bottles */}
      <rect x="80" y="90" width="800" height="320" fill="#1a110b" />
      <rect x="120" y="110" width="720" height="200" fill="#4a5662" opacity="0.18" />
      {[200, 300, 400].map((y) => <rect key={y} x="80" y={y} width="800" height="8" fill="#3a2716" />)}
      {Array.from({ length: 36 }, (_, i) => {
        const row = Math.floor(i / 12); const x = 100 + (i % 12) * 64; const y = 200 + row * 100;
        return <path key={i} d={`M${x} ${y} L${x} ${y - 50} L${x + 6} ${y - 62} L${x + 6} ${y - 78} L${x + 14} ${y - 78} L${x + 14} ${y - 62} L${x + 20} ${y - 50} L${x + 20} ${y} Z`} fill={["#3d5c3a", "#6b3a1c", "#2c3f55", "#7a5a1f"][i % 4]} opacity="0.85" />;
      })}
      {/* neon window */}
      <Window x={1056} y={72} w={416} h={180} panes={2} seed={21} />
      <text x="1170" y="180" fontSize="54" fontFamily="Playfair Display, serif" fill="#ff8a5c" opacity="0.85" style={{ filter: "drop-shadow(0 0 8px #ff6a3c)" }}>ANCHOR</text>
      {/* jukebox */}
      <rect x="896" y="324" width="112" height="288" rx="50" fill="#2a1b12" stroke="#b07a3a" strokeWidth="4" />
      <rect x="912" y="380" width="80" height="80" rx="30" fill="#ffb36b" opacity="0.35" className="animate-flicker" />
      {/* booth */}
      <rect x="1040" y="330" width="40" height="490" fill="#3b1a14" />
      <rect x="1500" y="330" width="60" height="490" fill="#3b1a14" />
      <rect x="1130" y="560" width="330" height="40" fill="#2d1d12" />
      <rect x="1285" y="600" width="20" height="200" fill="#1a110b" />
      {/* counter */}
      <rect x="0" y="470" width="990" height="44" fill="#4a2d18" />
      <rect x="0" y="514" width="990" height="250" fill="#2a190e" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={30 + i * 125} y="540" width="100" height="200" fill="none" stroke="#3b2414" strokeWidth="4" />)}
      <Floor y={764} from="#1a110b" to="#080503" />
      {/* pendant lamps */}
      {[300, 700, 1300].map((x) => <g key={x}><line x1={x} y1="0" x2={x} y2="60" stroke="#111" strokeWidth="3" /><path d={`M${x - 30} 80 L${x + 30} 80 L${x + 14} 58 L${x - 14} 58 Z`} fill="#1b1410" /><Lamp x={x} y={110} r={260} o={0.25} /></g>)}
    </g>
  );
}

function Penthouse() {
  return (
    <g>
      <Wall from="#1e2229" to="#121418" />
      <Window x={320} y={40} w={960} h={460} panes={4} seed={31}>
        <Skyline x={320} y={180} w={960} h={180} seed={5} lit={0.25} />
        <rect x="560" y="70" width="34" height="300" fill="#05070b" />
        <circle cx="577" cy="70" r="5" fill="#ff5a4a" className="animate-flicker" />
        <rect x="320" y="360" width="960" height="140" fill="#0b1626" />
        {Array.from({ length: 20 }, (_, i) => <rect key={i} x={340 + i * 48} y={380 + (i % 4) * 22} width="26" height="2" fill="#e7b45a" opacity="0.3" />)}
      </Window>
      <Floor y={620} from="#2a2c30" to="#0d0e10" />
      {/* lift */}
      <rect x="1440" y="150" width="160" height="610" fill="#24272c" stroke="#3b3f46" strokeWidth="4" />
      <line x1="1520" y1="150" x2="1520" y2="760" stroke="#3b3f46" strokeWidth="4" />
      {/* sofa */}
      <rect x="140" y="600" width="480" height="70" rx="20" fill="#2c3036" />
      <rect x="120" y="560" width="520" height="60" rx="24" fill="#353a41" />
      <rect x="140" y="670" width="480" height="70" rx="10" fill="#24272c" />
      {/* sideboard */}
      <rect x="640" y="576" width="250" height="130" fill="#1e1a17" stroke="#3a322a" strokeWidth="2" />
      {/* study desk */}
      <rect x="980" y="510" width="460" height="30" fill="#2a2420" />
      <rect x="1240" y="540" width="180" height="210" fill="#221d19" stroke="#3a322a" strokeWidth="2" />
      <rect x="1000" y="540" width="14" height="210" fill="#1a1613" />
      <Lamp x={1150} y={430} r={300} o={0.18} />
      <ellipse cx="760" cy="820" rx="520" ry="60" fill="#3a2a22" opacity="0.4" />
    </g>
  );
}

function Newsroom() {
  return (
    <g>
      <Wall from="#221d1b" to="#141110" />
      {Array.from({ length: 12 }, (_, r) => Array.from({ length: 20 }, (_, c) => <rect key={`${r}${c}`} x={c * 80 + (r % 2) * 40} y={r * 30} width="76" height="26" fill="#2a2220" opacity="0.5" />))}
      <Window x={120} y={60} w={420} h={220} panes={3} seed={41} />
      <Floor y={640} from="#1c1918" to="#0a0909" />
      {/* corkboard */}
      <rect x="1060" y="90" width="440" height="320" fill="#5e432b" stroke="#2c2016" strokeWidth="10" />
      <path d="M1100 140 L1300 300 L1450 150 M1150 330 L1400 260" stroke="#b23a33" strokeWidth="2" fill="none" />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={1320 + (i % 2) * 80} y={150 + Math.floor(i / 2) * 120} width="60" height="80" fill="#e9e1d0" transform={`rotate(${i % 2 ? 4 : -3} ${1350 + (i % 2) * 80} 190)`} />)}
      {/* desks */}
      <rect x="0" y="540" width="330" height="28" fill="#3a2e26" /><rect x="10" y="568" width="300" height="200" fill="#2a211b" />
      <rect x="400" y="520" width="620" height="36" fill="#3a2e26" /><rect x="410" y="556" width="600" height="210" fill="#2a211b" />
      {[0, 1, 2].map((i) => <rect key={i} x={430 + i * 30} y={480 - i * 14} width="120" height="14" fill="#e9e1d0" opacity="0.8" transform={`rotate(${i * 3 - 3} 490 480)`} />)}
      <rect x="1380" y="560" width="180" height="240" fill="#3a4047" />
      <Lamp x={700} y={420} r={360} o={0.16} />
    </g>
  );
}

function Flat() {
  return (
    <g>
      <Wall from="#1d1f26" to="#121318" />
      {Array.from({ length: 40 }, (_, i) => <rect key={i} x={i * 40} y="0" width="2" height="620" fill="#fff" opacity="0.025" />)}
      <Window x={880} y={90} w={448} h={288} panes={2} seed={51}>
        <Skyline x={880} y={230} w={448} h={148} seed={9} lit={0.2} />
        <rect x="1180" y="150" width="10" height="160" fill="#05070b" /><circle cx="1185" cy="150" r="3" fill="#ff5a4a" />
      </Window>
      <Floor y={640} from="#21170f" to="#0a0705" />
      {/* door & hook */}
      <rect x="0" y="140" width="80" height="640" fill="#2a2018" stroke="#3b2c20" strokeWidth="6" />
      <rect x="90" y="190" width="160" height="8" fill="#5c4a36" />
      <rect x="110" y="800" width="190" height="40" fill="#3a2a22" opacity="0.8" />
      {/* desk */}
      <rect x="400" y="520" width="400" height="30" fill="#3a2e24" />
      <rect x="414" y="550" width="14" height="210" fill="#2a2018" /><rect x="772" y="550" width="14" height="210" fill="#2a2018" />
      {/* kitchenette */}
      <rect x="880" y="540" width="420" height="34" fill="#4a4f55" />
      <rect x="890" y="574" width="400" height="190" fill="#2c2f34" />
      {[0, 1, 2].map((i) => <rect key={i} x={900 + i * 130} y="584" width="120" height="70" fill="none" stroke="#3d4148" strokeWidth="3" />)}
      {/* bookshelf */}
      <rect x="1380" y="150" width="200" height="560" fill="#2a2018" />
      {[240, 340, 450, 560].map((y) => <rect key={y} x="1380" y={y} width="200" height="8" fill="#3b2c20" />)}
      {Array.from({ length: 14 }, (_, i) => <rect key={i} x={1390 + (i % 7) * 26} y={i < 7 ? 380 : 490} width="20" height="60" fill={["#3a2a22", "#2a3442", "#4a3a20", "#26303a", "#3d2626"][i % 5]} />)}
      <Lamp x={600} y={420} r={300} o={0.16} />
    </g>
  );
}

/** Generic room used by generated cases (hotel, museum, manor, shop). */
function Generic({ kind }: { kind: SceneKind }) {
  const pal: Record<string, [string, string, string]> = {
    hotel: ["#2a2420", "#15110e", "#3a2a1c"], museum: ["#23262d", "#121418", "#2a2c30"], manor: ["#261d1a", "#120d0b", "#2b2017"], shop: ["#1f2420", "#101311", "#2a2620"],
  };
  const [a, b, c] = pal[kind] ?? pal.hotel;
  return (
    <g>
      <Wall from={a} to={b} />
      <Window x={560} y={60} w={480} h={300} panes={3} seed={kind.length * 7} />
      {kind === "museum" && [140, 1180].map((x) => <g key={x}><rect x={x} y="140" width="260" height="190" fill="#b99a5e" /><rect x={x + 14} y="154" width="232" height="162" fill="#3a4250" /></g>)}
      {kind !== "museum" && <g><rect x="120" y="150" width="300" height="420" fill={c} />{[260, 380, 500].map((y) => <rect key={y} x="120" y={y} width="300" height="8" fill="#000" opacity="0.4" />)}</g>}
      <Floor y={620} from={c} to="#060505" />
      <rect x="560" y="500" width="520" height="34" fill={c} stroke="#000" strokeOpacity="0.4" />
      <rect x="580" y="534" width="480" height="200" fill="#000" opacity="0.3" />
      <rect x="1240" y="300" width="220" height="460" fill={c} stroke="#000" strokeOpacity="0.4" />
      <Lamp x={820} y={420} r={380} o={0.18} />
    </g>
  );
}

export function Backdrop({ kind }: { kind: SceneKind }) {
  switch (kind) {
    case "office": return <Office />;
    case "police": return <Police />;
    case "security": return <Security />;
    case "bar": return <Bar />;
    case "penthouse": return <Penthouse />;
    case "newsroom": return <Newsroom />;
    case "flat": return <Flat />;
    default: return <Generic kind={kind} />;
  }
}

export const SCENE_W = W;
export const SCENE_H = H;
