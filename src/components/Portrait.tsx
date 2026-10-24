/** Procedurally drawn noir portraits — desaturated, lit from one side. */
import type { Mood, PortraitSpec } from "../../shared/api";

export function Portrait({ spec, mood = "calm", size = 120, className = "", name }: { spec: PortraitSpec; mood?: Mood; size?: number; className?: string; name?: string }) {
  const id = `p${Math.abs(hash(JSON.stringify(spec)))}`;
  const browTilt = mood === "irritated" || mood === "defensive" ? 4 : mood === "nervous" || mood === "shaken" ? -4 : 0;
  const mouth = mood === "cooperative" || mood === "calm" ? "M88 168 Q100 173 112 168" : mood === "shaken" || mood === "nervous" ? "M89 171 Q100 166 111 171" : "M89 169 L111 169";
  const broad = spec.build === "broad";
  const older = spec.age === "older";
  return (
    <svg viewBox="0 0 200 240" width={size} height={size * 1.2} className={className} role="img" aria-label={name ? `Portrait of ${name}` : "Portrait"}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a3446" />
          <stop offset="1" stopColor="#0b0f16" />
        </linearGradient>
        <radialGradient id={`${id}-light`} cx="0.25" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff3d6" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-shade`} x1="0" x2="1">
          <stop offset="0.45" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.55" />
        </linearGradient>
        <filter id={`${id}-noir`}>
          <feColorMatrix type="saturate" values="0.25" />
        </filter>
      </defs>
      <rect width="200" height="240" fill={`url(#${id}-bg)`} />
      <g filter={`url(#${id}-noir)`}>
        {/* shoulders / outfit */}
        <path d={broad ? "M10 240 Q18 190 62 182 L138 182 Q182 190 190 240 Z" : "M24 240 Q30 196 70 186 L130 186 Q170 196 176 240 Z"} fill={spec.outfitColor} />
        {spec.outfit === "suit" && <><path d="M86 186 L100 226 L114 186 Z" fill="#e8e2d6" /><path d="M96 192 L100 230 L104 192 Z" fill="#5a1e22" /><path d="M70 186 L100 236 L86 186Z M130 186 L100 236 L114 186Z" fill="#000" opacity="0.25" /></>}
        {spec.outfit === "uniform" && <><path d="M88 186 L100 214 L112 186 Z" fill="#c9c3b6" /><rect x="128" y="200" width="22" height="8" rx="1" fill="#b58b3c" opacity="0.8" /></>}
        {spec.outfit === "blouse" && <path d="M84 186 Q100 206 116 186" fill="none" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="3" />}
        {spec.outfit === "turtleneck" && <rect x="80" y="176" width="40" height="18" rx="6" fill={spec.outfitColor} />}
        {spec.outfit === "jacket" && <><path d="M88 186 L100 222 L112 186 Z" fill="#7d7a73" /><path d="M66 188 L92 240 M134 188 L108 240" stroke="#000" strokeOpacity="0.35" strokeWidth="4" /></>}
        {spec.outfit === "dress" && <path d="M78 186 Q100 214 122 186" fill="#d8b8a0" opacity="0.9" />}
        {/* neck */}
        <path d="M86 150 L86 188 Q100 196 114 188 L114 150 Z" fill={spec.skin} />
        <path d="M86 170 Q100 182 114 170 L114 188 Q100 196 86 188Z" fill="#000" opacity="0.25" />
        {/* head */}
        <ellipse cx="100" cy="118" rx={broad ? 36 : 33} ry="44" fill={spec.skin} />
        <ellipse cx="65" cy="122" rx="6" ry="10" fill={spec.skin} />
        <ellipse cx="135" cy="122" rx="6" ry="10" fill={spec.skin} />
        {spec.earrings && <><circle cx="65" cy="135" r="3" fill="#e9d9a8" /><circle cx="135" cy="135" r="3" fill="#e9d9a8" /></>}
        {/* eyes & brows */}
        <g fill="#1a1410">
          <ellipse cx="86" cy="118" rx="4.5" ry="3" />
          <ellipse cx="114" cy="118" rx="4.5" ry="3" />
        </g>
        <g stroke={spec.hairColor} strokeWidth="3.5" strokeLinecap="round">
          <path d={`M78 ${107 + browTilt / 2} L94 ${107 - browTilt / 2}`} />
          <path d={`M106 ${107 - browTilt / 2} L122 ${107 + browTilt / 2}`} />
        </g>
        {older && <g stroke="#000" strokeOpacity="0.25" strokeWidth="1.2" fill="none"><path d="M78 126 Q84 129 90 126" /><path d="M110 126 Q116 129 122 126" /><path d="M84 96 L116 96" /></g>}
        <path d="M100 120 L96 142 Q100 145 104 142" fill="none" stroke="#000" strokeOpacity="0.35" strokeWidth="2" />
        <path d={mouth} fill="none" stroke="#5b2f2a" strokeWidth="3" strokeLinecap="round" />
        {spec.glasses && <g fill="none" stroke="#1d1d1f" strokeWidth="2.5"><rect x="74" y="110" width="22" height="15" rx="5" /><rect x="104" y="110" width="22" height="15" rx="5" /><path d="M96 116 L104 116" /></g>}
        {spec.beard === "stubble" && <path d="M70 135 Q72 165 100 166 Q128 165 130 135 Q126 160 100 162 Q74 160 70 135Z" fill="#000" opacity="0.18" />}
        {spec.beard === "full" && <path d="M68 128 Q68 176 100 178 Q132 176 132 128 Q126 158 100 160 Q74 158 68 128Z" fill={spec.hairColor} />}
        {spec.beard === "moustache" && <path d="M86 156 Q100 148 114 156 Q100 154 86 156Z" fill={spec.hairColor} stroke={spec.hairColor} strokeWidth="3" />}
        {/* hair */}
        <Hair spec={spec} />
        {/* side light & shadow */}
        <rect width="200" height="240" fill={`url(#${id}-shade)`} />
      </g>
      <rect width="200" height="240" fill={`url(#${id}-light)`} />
    </svg>
  );
}

function Hair({ spec }: { spec: PortraitSpec }) {
  const c = spec.hairColor;
  switch (spec.hair) {
    case "bob": return <path d="M62 120 Q58 66 100 64 Q142 66 138 120 L138 150 Q130 138 128 104 Q100 90 72 104 Q70 138 62 150Z" fill={c} />;
    case "bun": return <><circle cx="100" cy="66" r="15" fill={c} /><path d="M66 118 Q64 72 100 72 Q136 72 134 118 Q128 92 100 88 Q72 92 66 118Z" fill={c} /></>;
    case "long": return <path d="M60 130 Q54 64 100 62 Q146 64 140 130 L146 200 Q130 190 128 104 Q100 88 72 104 Q70 190 54 200Z" fill={c} />;
    case "slick": return <path d="M66 110 Q66 68 102 68 Q136 70 134 108 Q126 86 100 84 Q78 84 66 110Z" fill={c} />;
    case "short": return <path d="M66 108 Q66 70 100 70 Q134 70 134 108 Q124 90 100 90 Q76 90 66 108Z" fill={c} />;
    case "messy": return <path d="M64 112 Q60 70 88 66 L94 58 L102 66 L112 58 L116 68 Q140 72 136 112 Q130 92 118 92 L110 84 L102 92 L92 86 Q74 92 64 112Z" fill={c} />;
    case "receding": return <path d="M66 112 Q64 92 72 84 Q76 100 70 116Z M134 112 Q136 92 128 84 Q124 100 130 116Z M80 80 Q100 72 120 80 Q100 78 80 80Z" fill={c} />;
    case "wavy": return <path d="M62 124 Q56 66 100 64 Q144 66 138 124 Q134 100 126 96 Q118 86 108 92 Q98 84 88 92 Q76 88 70 100 Q66 110 62 124Z" fill={c} />;
    case "bald": return <path d="M70 100 Q100 76 130 100" fill="none" stroke="#fff" strokeOpacity="0.15" strokeWidth="6" />;
  }
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
