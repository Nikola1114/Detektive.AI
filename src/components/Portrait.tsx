/**
 * Procedural charcoal-style portraits in the manner of a noir graphic novel:
 * one hard key light from the left, hatched shadows on the far side of the
 * face, strand-drawn hair, and a grainy, slightly wavering hand-drawn line.
 * Everything is generated from a PortraitSpec, so generated cases get faces too.
 */
import type { Mood, PortraitSpec } from "../../shared/api";

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; };
}
/** Mixes a hex colour toward black (t<0) or white (t>0). */
function shade(hex: string, t: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(t < 0 ? c * (1 + t) : c + (255 - c) * t));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const FEMALE_HAIR = new Set(["bob", "long", "bun", "wavy"]);

export function Portrait({ spec, mood = "calm", size = 120, className = "", name, bare = false }: { spec: PortraitSpec; mood?: Mood; size?: number; className?: string; name?: string; bare?: boolean }) {
  const seed = hash(JSON.stringify(spec));
  const id = `pt${seed.toString(36)}`;
  const female = spec.gender ? spec.gender === "female" : FEMALE_HAIR.has(spec.hair) || Boolean(spec.earrings);
  const older = spec.age === "older";
  const young = spec.age === "young";
  const broad = spec.build === "broad";
  const skin = spec.skin;
  const skinDark = shade(skin, -0.45);
  const hair = spec.hairColor;

  // Expression
  const tense = mood === "irritated" || mood === "defensive";
  const scared = mood === "nervous" || mood === "shaken";
  const browIn = tense ? 5 : scared ? -5 : mood === "guarded" ? 1.5 : 0; // + lowers the inner brow
  const browOut = scared ? 2 : 0;
  const lid = tense ? 2.2 : mood === "guarded" ? 1.4 : scared ? -0.6 : 0; // upper lid droop
  const gazeX = mood === "shaken" ? -3.4 : mood === "nervous" ? 2.6 : mood === "guarded" ? 1 : 0;
  const gazeY = mood === "shaken" ? 2.2 : 0;
  const mouthCurve = mood === "cooperative" ? 3.5 : mood === "calm" ? 1 : scared ? -3 : tense ? -1.5 : 0;

  // Face geometry (viewBox 200×240). Female faces are narrower with a softer jaw.
  const jw = female ? 27 : broad ? 33 : 30; // jaw half-width
  const cw = female ? 35 : broad ? 40 : 37; // cheek half-width
  const chinY = female ? 172 : 176;
  const face = `M${100 - cw} 108 C${100 - cw} 64 ${100 - 22} 52 100 52 C${100 + 22} 52 ${100 + cw} 64 ${100 + cw} 108 C${100 + cw} 132 ${100 + jw + 4} 150 ${100 + jw - 4} ${chinY - 14} C${100 + 12} ${chinY} ${100 - 12} ${chinY} ${100 - jw + 4} ${chinY - 14} C${100 - jw - 4} 150 ${100 - cw} 132 ${100 - cw} 108 Z`;

  // Hair strands, drawn deterministically.
  const r = rng(seed);
  const strands = (n: number, x0: number, x1: number, y0: number, len: number, sway: number) =>
    Array.from({ length: n }, () => {
      const x = x0 + r() * (x1 - x0);
      const y = y0 + r() * 6;
      const l = len * (0.6 + r() * 0.5);
      const s = (r() - 0.5) * sway;
      return `M${x.toFixed(1)} ${y.toFixed(1)} q${(s * 0.5).toFixed(1)} ${(l * 0.5).toFixed(1)} ${s.toFixed(1)} ${l.toFixed(1)}`;
    }).join(" ");

  const eye = (cx: number, side: -1 | 1) => (
    <g>
      <ellipse cx={cx} cy={113} rx={11} ry={6.5} fill={skinDark} opacity={0.35} filter={`url(#${id}-soft)`} />
      <path d={`M${cx - 9} 115 Q${cx} ${108 + lid} ${cx + 9} 115 Q${cx} 119.5 ${cx - 9} 115 Z`} fill="#e8e4dc" />
      <clipPath id={`${id}-eye${side}`}><path d={`M${cx - 9} 115 Q${cx} ${108 + lid} ${cx + 9} 115 Q${cx} 119.5 ${cx - 9} 115 Z`} /></clipPath>
      <g clipPath={`url(#${id}-eye${side})`}>
        <circle cx={cx + gazeX} cy={114.5 + gazeY} r={4.6} fill={`url(#${id}-iris)`} />
        <circle cx={cx + gazeX} cy={114.5 + gazeY} r={2} fill="#050505" />
        <circle cx={cx + gazeX - 1.4} cy={113 + gazeY} r={1.1} fill="#fff" opacity={0.9} />
        <path d={`M${cx - 10} ${109 + lid} Q${cx} ${105 + lid} ${cx + 10} ${109 + lid} L${cx + 10} ${112.5 + lid} Q${cx} ${109 + lid} ${cx - 10} ${112.5 + lid} Z`} fill="#000" opacity={0.25} />
      </g>
      <path d={`M${cx - 9.5} 115 Q${cx} ${107.6 + lid} ${cx + 9.5} 115`} fill="none" stroke="#141110" strokeWidth={female ? 2.1 : 1.8} strokeLinecap="round" />
      <path d={`M${cx - 8} ${110.5 + lid * 0.4} Q${cx} ${105.5 + lid * 0.4} ${cx + 8} ${110.5 + lid * 0.4}`} fill="none" stroke={skinDark} strokeWidth={0.9} opacity={0.7} />
      <path d={`M${cx - 7} 117.6 Q${cx} 120.5 ${cx + 7} 117.6`} fill="none" stroke={skinDark} strokeWidth={0.7} opacity={0.6} />
      {female && <path d={`M${cx + side * 8.5} ${114 - 0.2} l${side * 2.5} -1.8`} stroke="#141110" strokeWidth={1.2} strokeLinecap="round" />}
      {(older || mood === "shaken") && <path d={`M${cx - 6} 121.5 Q${cx} 124 ${cx + 6} 121.5`} fill="none" stroke={skinDark} strokeWidth={0.7} opacity={0.5} />}
    </g>
  );

  const brow = (cx: number, side: -1 | 1) => {
    const inner = cx - side * 9; const outer = cx + side * 10;
    const yIn = 101 + browIn; const yOut = 100.5 - browOut + (female ? -1 : 0);
    const th = female ? 1.6 : 2.6;
    return (
      <path d={`M${inner} ${yIn} Q${cx} ${Math.min(yIn, yOut) - (female ? 4 : 3)} ${outer} ${yOut} Q${cx} ${Math.min(yIn, yOut) - (female ? 4 : 3) + th} ${inner} ${yIn + th} Z`} fill={shade(hair, -0.2)} stroke={shade(hair, -0.3)} strokeWidth={0.6} />
    );
  };

  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className} role="img" aria-label={name ? `Portrait of ${name}` : "Portrait"}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3a3a3a" /><stop offset="1" stopColor="#0c0c0c" /></linearGradient>
        <radialGradient id={`${id}-skin`} cx="0.36" cy="0.38" r="0.75">
          <stop offset="0" stopColor={shade(skin, 0.18)} /><stop offset="0.55" stopColor={skin} /><stop offset="1" stopColor={shade(skin, -0.35)} />
        </radialGradient>
        <radialGradient id={`${id}-iris`}><stop offset="0" stopColor="#6a6258" /><stop offset="0.7" stopColor="#2c2824" /><stop offset="1" stopColor="#111" /></radialGradient>
        <linearGradient id={`${id}-dark`} x1="0" x2="1"><stop offset="0.48" stopColor="#000" stopOpacity="0" /><stop offset="0.72" stopColor="#000" stopOpacity="0.42" /><stop offset="1" stopColor="#000" stopOpacity="0.7" /></linearGradient>
        <linearGradient id={`${id}-hairlight`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.22" /><stop offset="0.45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" /></linearGradient>
        <pattern id={`${id}-hatch`} width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="3.2" stroke="#000" strokeWidth="1.1" /></pattern>
        <pattern id={`${id}-hatch2`} width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-48)"><line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeWidth="0.8" /></pattern>
        <pattern id={`${id}-stubble`} width="1.7" height="1.9" patternUnits="userSpaceOnUse" patternTransform="rotate(17)"><circle cx="0.6" cy="0.7" r="0.32" fill="#000" /><circle cx="1.3" cy="1.5" r="0.25" fill="#000" /></pattern>
        <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <filter id={`${id}-ink`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed={seed % 97} result="w" />
          <feDisplacementMap in="SourceGraphic" in2="w" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed={seed % 53} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 -0.12" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`${id}-face`}><path d={face} /></clipPath>
        <linearGradient id={`${id}-fade`} x1="0" x2="1"><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="0.8" stopColor="#fff" stopOpacity="0.9" /><stop offset="1" stopColor="#fff" /></linearGradient>
        <mask id={`${id}-shadowside`} maskContentUnits="userSpaceOnUse"><rect x="40" y="40" width="130" height="200" fill={`url(#${id}-fade)`} /></mask>
        <filter id={`${id}-mono`}><feColorMatrix type="saturate" values="0.12" /><feComponentTransfer><feFuncR type="linear" slope="1.12" intercept="-0.04" /><feFuncG type="linear" slope="1.12" intercept="-0.04" /><feFuncB type="linear" slope="1.12" intercept="-0.04" /></feComponentTransfer></filter>
      </defs>

      {!bare && <rect width="200" height="240" fill={`url(#${id}-bg)`} />}
      {!bare && <circle cx="66" cy="70" r="90" fill="#fff" opacity="0.06" />}

      <g filter={`url(#${id}-mono)`}>
        <g filter={`url(#${id}-ink)`}>
          {/* hair that falls behind the shoulders */}
          {(spec.hair === "long" || spec.hair === "wavy") && (
            <g>
              <path d={`M${100 - cw - 6} 96 C${100 - cw - 16} 150 ${100 - cw - 14} 196 ${100 - cw - 4} 214 L${100 + cw + 4} 214 C${100 + cw + 14} 196 ${100 + cw + 16} 150 ${100 + cw + 6} 96 Z`} fill={shade(hair, -0.15)} />
              <path d={strands(26, 100 - cw - 12, 100 + cw + 12, 110, 95, 10)} stroke={shade(hair, 0.25)} strokeOpacity="0.35" strokeWidth="0.7" fill="none" />
            </g>
          )}

          {/* clothing */}
          <Clothing spec={spec} female={female} broad={broad} id={id} />

          {/* neck */}
          <path d={`M${100 - (female ? 17 : 24)} 150 L${100 - (female ? 18 : 26)} 194 Q100 ${female ? 204 : 206} ${100 + (female ? 18 : 26)} 194 L${100 + (female ? 17 : 24)} 150 Z`} fill={`url(#${id}-skin)`} />
          <path d={`M${100 - 18} 156 Q100 ${chinY + 14} ${100 + 18} 156 L${100 + 18} 182 Q100 ${chinY + 22} ${100 - 18} 182 Z`} fill="#000" opacity="0.42" />
          <path d={`M${100 + 4} 160 L${100 + 18} 196 L${100 + 19} 160 Z`} fill={`url(#${id}-hatch)`} opacity="0.45" />
          {!female && <path d="M100 184 q-2 4 0 8" stroke={skinDark} strokeWidth="1" fill="none" opacity="0.6" />}
          <path d={`M${100 - 11} 186 L${100 - 15} 200 M${100 + 11} 186 L${100 + 15} 200`} stroke={skinDark} strokeWidth="0.8" opacity="0.5" />

          {/* ears */}
          {[-1, 1].map((s) => (
            <g key={s}>
              <path d={`M${100 + s * (cw - 1)} 106 C${100 + s * (cw + 9)} 100 ${100 + s * (cw + 10)} 126 ${100 + s * (cw + 1)} 132 Z`} fill={s < 0 ? skin : shade(skin, -0.3)} />
              <path d={`M${100 + s * (cw + 1)} 109 C${100 + s * (cw + 6)} 108 ${100 + s * (cw + 6)} 122 ${100 + s * (cw + 1)} 126`} stroke={skinDark} strokeWidth="1" fill="none" opacity="0.7" />
              {spec.earrings && <circle cx={100 + s * (cw + 3)} cy={136} r="2.6" fill="#ddd" stroke="#666" strokeWidth="0.5" />}
            </g>
          ))}

          {/* face */}
          <path d={face} fill={`url(#${id}-skin)`} />
          <g clipPath={`url(#${id}-face)`}>
            {/* far-side shadow with hatching */}
            <path d={face} fill={`url(#${id}-dark)`} />
            <g mask={`url(#${id}-shadowside)`}>
              <rect x="40" y="40" width="130" height="200" fill={`url(#${id}-hatch)`} opacity="0.3" />
              <rect x="70" y="60" width="100" height="180" fill={`url(#${id}-hatch2)`} opacity="0.18" />
            </g>
            {/* cheekbones, temples, under-chin */}
            <ellipse cx={100 - cw + 8} cy={136} rx={7} ry={13} fill="#000" opacity={female ? 0.08 : 0.14} filter={`url(#${id}-soft)`} />
            <ellipse cx={100 + cw - 6} cy={134} rx={9} ry={16} fill="#000" opacity="0.25" filter={`url(#${id}-soft)`} />
            <ellipse cx="100" cy={chinY - 2} rx={jw - 6} ry="5" fill="#000" opacity="0.2" filter={`url(#${id}-soft)`} />
            {(spec.beard === "stubble" || spec.beard === "full") && (
              <path d={`M${100 - cw + 4} 128 C${100 - cw + 6} 160 ${100 - 14} ${chinY + 2} 100 ${chinY + 2} C${100 + 14} ${chinY + 2} ${100 + cw - 6} 160 ${100 + cw - 4} 128 C${100 + 20} 150 ${100 + 12} 146 100 146 C${100 - 12} 146 ${100 - 20} 150 ${100 - cw + 4} 128 Z`} fill={spec.beard === "full" ? shade(hair, -0.1) : `url(#${id}-stubble)`} opacity={spec.beard === "full" ? 0.95 : 0.32} filter={spec.beard === "full" ? undefined : `url(#${id}-soft)`} />
            )}
          </g>

          <path d={`M${100 + cw} 112 C${100 + cw} 132 ${100 + jw + 4} 150 ${100 + jw - 4} ${chinY - 14} C${100 + 12} ${chinY} 100 ${chinY} ${100 - 8} ${chinY - 1}`} fill="none" stroke="#000" strokeOpacity="0.45" strokeWidth="1.2" />
          {/* eyes, brows, nose, mouth */}
          {eye(84, -1)}
          {eye(116, 1)}
          {brow(84, -1)}
          {brow(116, 1)}
          <path d="M101 108 C103 120 106 130 108 138" fill="none" stroke="#000" strokeOpacity="0.28" strokeWidth="2.4" filter={`url(#${id}-soft)`} />
          <path d="M96 112 C95 124 93 132 92 137" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="2" />
          <path d={`M91 139 Q93 ${female ? 142 : 143.5} 96.5 142 Q100 ${female ? 144.5 : 146} 103.5 142 Q107 ${female ? 142 : 143.5} 109 139`} fill="none" stroke="#1a1310" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          <ellipse cx="94" cy="141.4" rx="2" ry="1.1" fill="#000" opacity="0.55" />
          <ellipse cx="106" cy="141.4" rx="2" ry="1.1" fill="#000" opacity="0.65" />
          <ellipse cx="99" cy="136" rx="3.6" ry="2.6" fill="#fff" opacity="0.13" />
          <ellipse cx="102" cy="145.5" rx="7" ry="2.4" fill="#000" opacity="0.25" filter={`url(#${id}-soft)`} />
          <path d="M104 116 C107 126 109 132 110 138" fill="none" stroke="#000" strokeOpacity="0.22" strokeWidth="3" filter={`url(#${id}-soft)`} />
          {(older || mood === "irritated") && <path d={`M89 145 Q${84} 154 ${85} 160 M111 145 Q${116} 154 ${115} 160`} fill="none" stroke={skinDark} strokeWidth="0.9" opacity="0.55" />}
          {older && <path d="M80 86 Q100 82 120 86 M84 92 Q100 89 116 92" fill="none" stroke={skinDark} strokeWidth="0.7" opacity="0.45" />}
          {spec.beard === "moustache" && <path d="M86 150 Q93 145 100 148 Q107 145 114 150 Q107 153 100 151 Q93 153 86 150 Z" fill={shade(hair, -0.1)} />}
          <Mouth curve={mouthCurve} female={female} young={young} skin={skin} />

          {spec.glasses && (
            <g fill="none" stroke="#111" strokeWidth="2">
              <rect x="70" y="104" width="27" height="19" rx="6" fill="#fff" fillOpacity="0.06" />
              <rect x="103" y="104" width="27" height="19" rx="6" fill="#fff" fillOpacity="0.06" />
              <path d="M97 111 Q100 109 103 111 M70 110 L60 107 M130 110 L140 107" />
              <path d="M74 107 L80 105" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" />
            </g>
          )}

          {/* hair on top */}
          <Hair spec={spec} cw={cw} strands={strands} id={id} />
        </g>
      </g>

      {/* paper and charcoal grain over everything */}
      <rect width="200" height="240" fill="#000" filter={`url(#${id}-grain)`} opacity={bare ? 0.35 : 0.6} />
    </svg>
  );
}

function Mouth({ curve, female, young, skin }: { curve: number; female: boolean; young: boolean; skin: string }) {
  const w = female ? 11 : 12;
  const lip = female ? shade(skin, -0.38) : shade(skin, -0.3);
  const y = 155;
  return (
    <g>
      <path d={`M${100 - w} ${y - curve * 0.3} Q${100 - 4} ${y - 4.2} 100 ${y - 2.6} Q${100 + 4} ${y - 4.2} ${100 + w} ${y - curve * 0.3} Q100 ${y + 0.6 + curve * 0.4} ${100 - w} ${y - curve * 0.3} Z`} fill={lip} />
      <path d={`M${100 - w + 1} ${y - curve * 0.3 + 0.4} Q100 ${y + (female ? 8 : 6.5) + curve * 0.5} ${100 + w - 1} ${y - curve * 0.3 + 0.4} Q100 ${y + 1 + curve * 0.4} ${100 - w + 1} ${y - curve * 0.3 + 0.4} Z`} fill={shade(lip, 0.08)} />
      <path d={`M${100 - w} ${y - curve * 0.3} Q100 ${y + 1 + curve * 0.4} ${100 + w} ${y - curve * 0.3}`} fill="none" stroke="#1a0f0c" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx={98} cy={y + 3 + curve * 0.3} rx={4} ry={1.1} fill="#fff" opacity={young || female ? 0.22 : 0.12} />
      <path d={`M${100 - 6} ${y + 9 + curve * 0.3} Q100 ${y + 11 + curve * 0.3} ${100 + 6} ${y + 9 + curve * 0.3}`} fill="none" stroke="#000" strokeOpacity="0.25" strokeWidth="1.4" />
    </g>
  );
}

function Clothing({ spec, female, broad, id }: { spec: PortraitSpec; female: boolean; broad: boolean; id: string }) {
  const c = spec.outfitColor;
  const dark = shade(c, -0.4);
  const light = shade(c, 0.18);
  const sh = female ? 72 : broad ? 88 : 80; // shoulder half-width
  const body = `M${100 - sh} 240 Q${100 - sh} 200 ${100 - sh + 22} 192 L${100 - 22} 186 Q100 196 ${100 + 22} 186 L${100 + sh - 22} 192 Q${100 + sh} 200 ${100 + sh} 240 Z`;
  return (
    <g>
      <path d={body} fill={c} />
      <path d={body} fill={`url(#${id}-dark)`} />
      <path d={`M${100 + 30} 200 Q${100 + sh - 10} 210 ${100 + sh} 240 L${100 + 30} 240 Z`} fill={`url(#${id}-hatch)`} opacity="0.3" />
      <path d={`M${100 - sh + 10} 206 Q${100 - sh + 6} 222 ${100 - sh + 8} 240`} stroke={light} strokeWidth="1.5" fill="none" opacity="0.7" />
      {spec.outfit === "suit" && (
        <g>
          <path d="M84 190 L100 236 L116 190 L108 188 L100 205 L92 188 Z" fill="#e9e6df" />
          <path d="M95 196 L100 202 L105 196 L103 236 L97 236 Z" fill="#2a2a2a" />
          <path d="M96 196 L104 196 L102 202 L98 202 Z" fill="#1a1a1a" />
          <path d={`M${100 - 22} 186 L84 190 L100 238 L${100 - 30} 240 Z`} fill={dark} />
          <path d={`M${100 + 22} 186 L116 190 L100 238 L${100 + 30} 240 Z`} fill={shade(c, -0.55)} />
          <path d="M80 194 L92 214 M120 194 L108 214" stroke={light} strokeWidth="1" opacity="0.6" />
        </g>
      )}
      {spec.outfit === "uniform" && (
        <g>
          <path d="M86 190 L100 220 L114 190 Z" fill="#cfccc4" />
          <path d="M97 200 L103 200 L102 236 L98 236 Z" fill="#222" />
          <rect x={100 + sh - 34} y="196" width="20" height="6" rx="1" fill="#bbb" opacity="0.7" />
          <path d={`M${100 - sh + 20} 194 L${100 - 22} 190`} stroke={light} strokeWidth="3" opacity="0.6" />
          <circle cx={100 - 30} cy="214" r="4" fill="#c8c8c8" opacity="0.7" />
        </g>
      )}
      {spec.outfit === "blouse" && (
        <g>
          <path d="M82 190 L100 214 L118 190 Q100 200 82 190 Z" fill={shade(c, 0.15)} />
          <path d="M82 190 L94 206 L88 210 Z M118 190 L106 206 L112 210 Z" fill={light} stroke={dark} strokeWidth="0.6" />
          <circle cx="100" cy="222" r="1.4" fill={dark} /><circle cx="100" cy="232" r="1.4" fill={dark} />
        </g>
      )}
      {spec.outfit === "turtleneck" && <path d="M80 176 Q100 186 120 176 L122 196 Q100 206 78 196 Z" fill={light} stroke={dark} strokeWidth="0.8" />}
      {spec.outfit === "jacket" && (
        <g>
          <path d="M86 190 L100 228 L114 190 Z" fill="#8a8a85" />
          <path d={`M${100 - 22} 186 L86 190 L98 240 L${100 - 34} 240 Z`} fill={dark} />
          <path d={`M${100 + 22} 186 L114 190 L102 240 L${100 + 34} 240 Z`} fill={shade(c, -0.55)} />
        </g>
      )}
      {spec.outfit === "dress" && <path d="M78 190 Q100 222 122 190 Q100 204 78 190 Z" fill={shade(spec.skin, -0.05)} />}
      {spec.outfit === "coat" && (
        <g>
          <path d={`M${100 - 26} 178 L${100 - 8} 236 L${100 - 40} 240 L${100 - 42} 192 Z`} fill={light} />
          <path d={`M${100 + 26} 178 L${100 + 8} 236 L${100 + 40} 240 L${100 + 42} 192 Z`} fill={dark} />
        </g>
      )}
      {spec.outfit === "sweater" && <path d="M84 188 Q100 200 116 188" stroke={light} strokeWidth="4" fill="none" />}
    </g>
  );
}

function Hair({ spec, cw, strands, id }: { spec: PortraitSpec; cw: number; strands: (n: number, x0: number, x1: number, y0: number, len: number, sway: number) => string; id: string }) {
  const c = spec.hairColor;
  const hl = shade(c, 0.35);
  const dk = shade(c, -0.35);
  const L = 100 - cw - 4;
  const R = 100 + cw + 4;
  const base = (d: string, lines: string) => (
    <g>
      <clipPath id={`${id}-hc`}><path d={d} /></clipPath>
      <path d={d} fill={c} />
      <path d={d} fill={`url(#${id}-hairlight)`} />
      <g clipPath={`url(#${id}-hc)`}>
        <path d={lines} stroke={hl} strokeOpacity="0.4" strokeWidth="0.7" fill="none" />
        <path d={lines} stroke={dk} strokeOpacity="0.5" strokeWidth="0.6" fill="none" transform="translate(1.4,0.6)" />
      </g>
      <path d={d} fill="none" stroke={dk} strokeWidth="0.8" strokeOpacity="0.6" />
    </g>
  );
  switch (spec.hair) {
    case "bob": return base(`M${L} 128 C${L - 4} 60 ${L + 22} 44 100 44 C${R - 22} 44 ${R + 4} 60 ${R} 128 L${R - 4} 152 C${R - 10} 130 ${R - 12} 98 ${R - 18} 86 C${R - 40} 92 ${L + 40} 76 ${L + 16} 92 C${L + 8} 108 ${L + 8} 132 ${L + 4} 152 Z`, strands(40, L + 4, R - 4, 48, 70, 14));
    case "long": return base(`M${L} 120 C${L - 4} 58 ${L + 22} 42 100 42 C${R - 22} 42 ${R + 4} 58 ${R} 120 C${R - 8} 100 ${R - 10} 88 ${R - 18} 80 C${R - 36} 92 ${L + 36} 76 ${L + 18} 86 C${L + 10} 98 ${L + 6} 108 ${L} 120 Z`, strands(36, L + 6, R - 6, 46, 50, 10));
    case "wavy": return base(`M${L} 124 C${L - 6} 56 ${L + 22} 40 100 42 C${R - 18} 40 ${R + 8} 58 ${R} 124 C${R - 6} 104 ${R - 14} 84 ${R - 22} 80 Q100 70 ${L + 20} 84 C${L + 10} 96 ${L + 6} 108 ${L} 124 Z`, strands(34, L + 6, R - 6, 46, 52, 22));
    case "bun": return (
      <g>
        <circle cx="100" cy="40" r="15" fill={c} />
        <path d="M88 34 Q100 26 112 34" stroke={hl} strokeOpacity="0.45" strokeWidth="0.8" fill="none" />
        {base(`M${L + 4} 112 C${L} 60 ${L + 24} 48 100 48 C${R - 24} 48 ${R} 60 ${R - 4} 112 C${R - 8} 92 ${R - 16} 76 100 72 C${L + 16} 76 ${L + 8} 92 ${L + 4} 112 Z`, strands(30, L + 10, R - 10, 50, 26, 18))}
      </g>
    );
    case "slick": return base(`M${L + 2} 104 C${L} 58 ${L + 26} 46 102 46 C${R - 22} 46 ${R} 60 ${R - 2} 102 C${R - 8} 84 ${R - 22} 70 100 70 C${L + 22} 70 ${L + 8} 84 ${L + 2} 104 Z`, Array.from({ length: 14 }, (_, i) => `M${L + 8 + i * 4.5} ${56 - (i % 3)} q14 ${4 + i * 0.3} 26 ${12 + (i % 4)}`).join(" "));
    case "short": return base(`M${L + 2} 104 C${L} 60 ${L + 24} 48 100 48 C${R - 24} 48 ${R} 60 ${R - 2} 104 C${R - 6} 86 ${R - 16} 74 100 72 C${L + 16} 74 ${L + 6} 86 ${L + 2} 104 Z`, strands(46, L + 6, R - 6, 50, 14, 8));
    case "messy": return base(`M${L + 2} 108 C${L - 6} 64 ${L + 12} 50 ${L + 22} 46 L${L + 28} 36 L${100 - 4} 44 L${100 + 6} 34 L${R - 26} 44 L${R - 16} 38 C${R + 6} 54 ${R + 2} 80 ${R - 2} 108 C${R - 8} 88 ${R - 18} 76 100 74 C${L + 18} 76 ${L + 8} 88 ${L + 2} 108 Z`, strands(50, L + 4, R - 4, 40, 24, 20));
    case "receding": return (
      <g>
        <path d={`M${L + 2} 112 C${L} 90 ${L + 6} 78 ${L + 14} 72 C${L + 14} 92 ${L + 10} 104 ${L + 6} 118 Z`} fill={c} />
        <path d={`M${R - 2} 112 C${R} 90 ${R - 6} 78 ${R - 14} 72 C${R - 14} 92 ${R - 10} 104 ${R - 6} 118 Z`} fill={dk} />
        <path d={strands(12, L + 4, L + 14, 74, 30, 4) + " " + strands(12, R - 14, R - 4, 74, 30, 4)} stroke={hl} strokeOpacity="0.4" strokeWidth="0.6" fill="none" />
        <path d="M78 60 Q100 52 122 60" stroke={c} strokeOpacity="0.5" strokeWidth="5" fill="none" />
      </g>
    );
    case "bald": return <path d="M74 64 Q92 50 118 58" stroke="#fff" strokeOpacity="0.18" strokeWidth="7" fill="none" strokeLinecap="round" />;
  }
}
