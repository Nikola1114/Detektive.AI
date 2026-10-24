/**
 * The interrogation room: a monochrome scene with the suspect seated at a table
 * under a hanging lamp. Their posture follows their current mood.
 */
import type { Mood, PortraitSpec } from "../../shared/api";
import { Portrait } from "./Portrait";

type Posture = "crossed" | "table" | "fidget";
const POSTURE: Record<Mood, Posture> = {
  calm: "table", cooperative: "table", guarded: "crossed", defensive: "crossed", irritated: "crossed", nervous: "fidget", shaken: "fidget", silent: "crossed",
};

export function InterrogationRoom({ spec, mood, name, speaking }: { spec: PortraitSpec; mood: Mood; name: string; speaking: boolean }) {
  const posture = POSTURE[mood];
  const cloth = spec.outfitColor;
  const skin = spec.skin;
  return (
    <svg viewBox="120 70 760 615" className="h-full w-full" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${name}, seated across the table`} style={{ filter: "grayscale(1) contrast(1.08)" }}>
      <defs>
        <linearGradient id="ir-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1c1c1c" /><stop offset="1" stopColor="#0b0b0b" /></linearGradient>
        <radialGradient id="ir-pool" cx="0.5" cy="0.35" r="0.55"><stop offset="0" stopColor="#ffffff" stopOpacity="0.22" /><stop offset="0.6" stopColor="#ffffff" stopOpacity="0.05" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <linearGradient id="ir-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.16" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id="ir-table" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a5a5a" /><stop offset="1" stopColor="#262626" /></linearGradient>
        <linearGradient id="ir-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.16" /><stop offset="0.45" stopColor="#fff" stopOpacity="0.02" /><stop offset="1" stopColor="#000" stopOpacity="0.35" /></linearGradient>
        <radialGradient id="ir-vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.55" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.85" /></radialGradient>
      </defs>
      <rect width="1000" height="700" fill="url(#ir-wall)" />
      {/* wall seams and a two-way mirror */}
      {[120, 330, 670, 880].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="560" stroke="#000" strokeOpacity="0.5" strokeWidth="3" />)}
      <rect x="0" y="330" width="1000" height="6" fill="#000" opacity="0.35" />
      <rect x="745" y="130" width="210" height="150" fill="#070707" stroke="#2b2b2b" strokeWidth="6" />
      <path d="M770 140 L820 140 L760 270 L745 270 Z" fill="#fff" opacity="0.05" />
      <rect width="1000" height="700" fill="url(#ir-pool)" />
      {/* lamp */}
      <line x1="500" y1="0" x2="500" y2="70" stroke="#222" strokeWidth="4" />
      <path d="M300 112 L700 112 L880 560 L120 560 Z" fill="url(#ir-cone)" />
      <path d="M445 112 Q500 58 555 112 Z" fill="#3a3a3a" />
      <ellipse cx="500" cy="112" rx="56" ry="9" fill="#e9e9e9" opacity="0.9" className="animate-flicker" />

      {/* suspect: chair back, torso, head, arms */}
      <rect x="380" y="380" width="240" height="190" rx="14" fill="#141414" />
      <g transform={spec.gender === "female" ? "translate(75,0) scale(0.85,1)" : undefined}>
      <path d="M395 430 Q330 450 322 575 L678 575 Q670 450 605 430 Z" fill={cloth} />
      <path d="M395 430 Q330 450 322 575 L678 575 Q670 450 605 430 Z" fill="url(#ir-rim)" />
      <path d="M455 432 L500 520 L545 432" fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="3" />
      <path d="M392 440 Q370 500 368 570 M608 440 Q630 500 632 570" fill="none" stroke="#000" strokeOpacity="0.45" strokeWidth="3" />
      </g>
      <g className={speaking ? "ir-breathe" : undefined} style={{ transformOrigin: "500px 430px" }}>
        <g transform="translate(390,168) scale(1.1)"><Portrait spec={spec} mood={mood} size={200} bare name={name} /></g>
      </g>
      <g transform={spec.gender === "female" ? "translate(75,0) scale(0.85,1)" : undefined}>
      {posture === "crossed" && (
        <g>
          <path d="M340 470 Q420 520 560 480 L566 512 Q420 560 334 505 Z" fill={cloth} stroke="#bdbdbd" strokeOpacity="0.35" strokeWidth="2.5" />
          <path d="M660 470 Q580 520 440 482 L434 514 Q580 562 666 505 Z" fill={cloth} stroke="#bdbdbd" strokeOpacity="0.35" strokeWidth="2.5" />
          <ellipse cx="566" cy="494" rx="20" ry="14" fill={skin} />
          <ellipse cx="434" cy="498" rx="20" ry="14" fill={skin} />
        </g>
      )}
      {posture === "table" && (
        <g>
          <path d="M335 460 Q330 540 420 585 L468 585 Q400 530 392 455 Z" fill={cloth} stroke="#bdbdbd" strokeOpacity="0.35" strokeWidth="2.5" />
          <path d="M665 460 Q670 540 580 585 L532 585 Q600 530 608 455 Z" fill={cloth} stroke="#bdbdbd" strokeOpacity="0.35" strokeWidth="2.5" />
          <ellipse cx="482" cy="588" rx="28" ry="15" fill={skin} />
          <ellipse cx="518" cy="590" rx="28" ry="15" fill={skin} />
        </g>
      )}
      {posture === "fidget" && (
        <g>
          <path d="M340 455 Q345 400 452 365 L462 392 Q385 425 392 470 Z" fill={cloth} stroke="#bdbdbd" strokeOpacity="0.35" strokeWidth="2.5" />
          <ellipse cx="462" cy="368" rx="17" ry="20" fill={skin} />
          <path d="M665 460 Q670 540 590 585 L540 585 Q605 530 608 455 Z" fill={cloth} stroke="#bdbdbd" strokeOpacity="0.35" strokeWidth="2.5" />
          <ellipse cx="548" cy="590" rx="30" ry="14" fill={skin} />
        </g>
      )}

      </g>

      {/* table, folder, tape recorder */}
      <path d="M190 565 L810 565 L975 700 L25 700 Z" fill="url(#ir-table)" />
      <path d="M190 565 L810 565" stroke="#9a9a9a" strokeWidth="3" />
      <path d="M250 598 L420 600 L398 676 L214 672 Z" fill="#cfcfcf" />
      <path d="M250 598 L300 598 L304 590 L262 590 Z" fill="#bdbdbd" />
      <path d="M240 610 L408 612" stroke="#999" strokeWidth="2" />
      <g transform="translate(630,605) skewX(-12)">
        <rect width="150" height="58" rx="6" fill="#1d1d1d" stroke="#555" strokeWidth="2" />
        <rect x="14" y="12" width="70" height="30" rx="3" fill="#0d0d0d" />
        <circle cx="34" cy="27" r="9" fill="#2c2c2c" /><circle cx="64" cy="27" r="9" fill="#2c2c2c" />
        {[0, 1, 2].map((i) => <rect key={i} x={96 + i * 16} y="14" width="11" height="9" rx="1" fill="#3a3a3a" />)}
        <circle cx="130" cy="44" r="5" fill="#ff3b30" className="ir-rec" />
      </g>
      <rect width="1000" height="700" fill="url(#ir-vig)" />
    </svg>
  );
}

/** A short line of body language for the current mood ("They avert their gaze."). */
export function bodyLanguage(mood: Mood, n: number): string {
  const lines: Record<Mood, string[]> = {
    calm: ["They hold your gaze.", "They settle back in the chair.", "Their hands rest still on the table."],
    cooperative: ["They lean forward.", "They nod slowly.", "They meet your eyes."],
    guarded: ["They choose their words carefully.", "They fold their arms.", "A long pause."],
    nervous: ["They glance at the door.", "Their fingers drum on the table.", "They swallow hard."],
    defensive: ["They cross their arms.", "Their jaw tightens.", "They lean away from you."],
    irritated: ["They exhale sharply.", "They stare at the ceiling.", "Their voice hardens."],
    shaken: ["They avert their gaze.", "Their hands are trembling.", "They press a hand to their mouth."],
    silent: ["They stare at the table.", "Silence."],
  };
  const l = lines[mood];
  return l[n % l.length];
}
