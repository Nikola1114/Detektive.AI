/**
 * The Blackwood Files logo: a magnifying glass whose lens frames Blackwood
 * Tower in the rain, with one window still lit. Keep public/logo.svg and
 * public/favicon.svg in step with this drawing.
 */
import { useId } from "react";

export function LogoMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label="Blackwood Files">
      <defs>
        <radialGradient id={`${id}s`} cx="0.5" cy="0.85" r="0.9"><stop offset="0" stopColor="#3a2c17" /><stop offset="0.45" stopColor="#141b27" /><stop offset="1" stopColor="#06080c" /></radialGradient>
        <radialGradient id={`${id}w`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffd88a" stopOpacity="0.9" /><stop offset="1" stopColor="#ffd88a" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}r`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6d58e" /><stop offset="0.5" stopColor="#e7b45a" /><stop offset="1" stopColor="#9c6b25" /></linearGradient>
        <clipPath id={`${id}c`}><circle cx="50" cy="50" r="38" /></clipPath>
      </defs>
      {/* handle */}
      <path d="M78 78 L108 108" stroke="#06080c" strokeWidth="17" strokeLinecap="round" />
      <path d="M80 80 L106 106" stroke={`url(#${id}r)`} strokeWidth="11" strokeLinecap="round" />
      <path d="M88 88 L104 104" stroke="#06080c" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      {/* the view through the lens */}
      <circle cx="50" cy="50" r="38" fill={`url(#${id}s)`} />
      <g clipPath={`url(#${id}c)`}>
        <path d="M12 74 h9 v-14 h7 v8 h5 v-18 h6 v24 M58 74 v-20 h8 v10 h6 v-16 h7 v12 h6 v14 h20 v40 h-100 z" fill="#0b0f16" />
        <rect x="10" y="74" width="100" height="40" fill="#0b0f16" />
        <rect x="42" y="26" width="16" height="66" fill="#05070a" />
        <rect x="46" y="18" width="8" height="9" fill="#05070a" />
        <line x1="50" y1="6" x2="50" y2="18" stroke="#05070a" strokeWidth="2" />
        <circle cx="50" cy="7" r="1.6" fill="#e5483a" />
        {[36, 42, 48, 54, 60, 66, 72, 78].map((y) => <line key={y} x1="43.5" y1={y} x2="56.5" y2={y} stroke="#1b2230" strokeWidth="0.8" />)}
        <circle cx="50" cy="31" r="9" fill={`url(#${id}w)`} />
        <rect x="47" y="29" width="6" height="4" fill="#ffd88a" />
        {[[18, 64], [24, 69], [62, 60], [70, 66], [77, 62], [83, 70], [30, 72]].map(([x, y]) => <rect key={`${x}${y}`} x={x} y={y} width="1.8" height="2.4" fill="#e7b45a" opacity="0.55" />)}
        <g stroke="#a9bad3" strokeWidth="0.7" opacity="0.35">
          {[[16, 14], [30, 30], [66, 12], [80, 34], [24, 50], [74, 48], [36, 8], [88, 20]].map(([x, y]) => <line key={`${x}-${y}`} x1={x} y1={y} x2={x - 3} y2={y + 11} />)}
        </g>
      </g>
      {/* rim and glint */}
      <circle cx="50" cy="50" r="38" fill="none" stroke="#06080c" strokeWidth="9" />
      <circle cx="50" cy="50" r="39" fill="none" stroke={`url(#${id}r)`} strokeWidth="5" />
      <circle cx="50" cy="50" r="34.5" fill="none" stroke="#e7b45a" strokeOpacity="0.35" strokeWidth="0.8" />
      <path d="M24 34 A30 30 0 0 1 40 18" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Mark plus wordmark. `stacked` puts the words under the mark (title screens). */
export function Logo({ size = 40, stacked = false, className = "" }: { size?: number; stacked?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center ${stacked ? "flex-col gap-3 text-center" : "gap-2.5"} ${className}`}>
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-display font-extrabold tracking-[0.12em] text-paper-100" style={{ fontSize: size * (stacked ? 0.42 : 0.46) }}>BLACKWOOD</span>
        <span className="mt-1 font-type tracking-[0.55em] text-amber-400" style={{ fontSize: size * (stacked ? 0.18 : 0.22), paddingLeft: stacked ? "0.55em" : 0 }}>FILES</span>
      </span>
    </span>
  );
}
