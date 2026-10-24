/** Small game-specific display components. */
import {
  AlertTriangle, BadgeCheck, Binary, BookOpen, Box, Car, Cctv, ClipboardList, Droplets, FileText, Film, Fingerprint, Folder, Footprints,
  Frame, GlassWater, IdCard, KeyRound, Laptop, List, Microscope, Monitor, Newspaper, NotebookPen, Package, Phone, Pill, Plug, Receipt, Scroll,
  Shield, Shirt, Ticket, Tablet, Terminal, Trophy, Usb, Watch, MessageSquareQuote, StickyNote, Lock, type LucideIcon,
} from "lucide-react";
import type { EvidenceView, Mood } from "../../shared/api";

const ICONS: Record<string, LucideIcon> = {
  watch: Watch, glass: GlassWater, trophy: Trophy, cufflink: Shirt, footprint: Footprints, keypad: KeyRound, monitor: Monitor, pills: Pill,
  cable: Plug, papers: FileText, folder: Folder, report: ClipboardList, microscope: Microscope, phone: Phone, "evidence-bag": Package,
  terminal: Terminal, car: Car, scroll: Scroll, list: List, cctv: Cctv, clipboard: ClipboardList, film: Film, "id-card": IdCard, book: BookOpen,
  binder: BookOpen, receipt: Receipt, speech: MessageSquareQuote, napkin: StickyNote, laptop: Laptop, safe: Lock, tablet: Tablet,
  newspaper: Newspaper, warning: AlertTriangle, notebook: NotebookPen, boots: Footprints, frame: Frame, usb: Usb, ticket: Ticket,
  fingerprint: Fingerprint, box: Box, shield: Shield, binary: Binary, droplets: Droplets, check: BadgeCheck,
};

export function EvidenceIcon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const I = ICONS[name] ?? FileText;
  return <I size={size} className={className} aria-hidden />;
}

const MOOD_STYLE: Record<Mood, { label: string; cls: string; dot: string }> = {
  calm: { label: "Calm", cls: "text-steel-300", dot: "bg-steel-400" },
  cooperative: { label: "Cooperative", cls: "text-emerald-300", dot: "bg-emerald-400" },
  guarded: { label: "Guarded", cls: "text-smoke-200", dot: "bg-smoke-300" },
  nervous: { label: "Nervous", cls: "text-amber-300", dot: "bg-amber-400" },
  defensive: { label: "Defensive", cls: "text-orange-300", dot: "bg-orange-400" },
  irritated: { label: "Irritated", cls: "text-blood-400", dot: "bg-blood-400" },
  shaken: { label: "Shaken", cls: "text-fuchsia-300", dot: "bg-fuchsia-400" },
  silent: { label: "Silent", cls: "text-smoke-400", dot: "bg-smoke-500" },
};

export function MoodTag({ mood }: { mood: Mood }) {
  const m = MOOD_STYLE[mood];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${m.cls}`} title="Demeanour — a cue, not a lie detector">
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />{m.label}
    </span>
  );
}

export const TYPE_LABEL: Record<EvidenceView["type"], string> = {
  physical: "Physical", document: "Document", digital: "Digital", forensic: "Forensic", testimony: "Testimony",
};

/** Confirmed evidence reads as an evidence tag; testimony reads as a quote. */
export function EvidenceCard({ e, onClick, selected, compact = false }: { e: EvidenceView; onClick?: () => void; selected?: boolean; compact?: boolean }) {
  const testimony = e.reliability === "testimony";
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`group relative w-full rounded-lg border text-left transition-all ${selected ? "border-amber-400 shadow-glow" : "border-white/[0.07] hover:border-amber-500/40"} ${testimony ? "bg-navy-800/60" : "bg-char-800/80"} ${compact ? "p-2.5" : "p-3.5"}`}
      aria-pressed={onClick ? selected : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${testimony ? "bg-steel-500/15 text-steel-300" : "bg-amber-500/10 text-amber-300"}`}>
          <EvidenceIcon name={e.icon} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`font-semibold text-paper-100 ${compact ? "text-sm" : ""}`}>{e.title}</span>
            {e.importance === "key" && !compact && <span className="text-[0.6rem] font-bold uppercase tracking-widest text-amber-400">Key</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-wider text-smoke-400">
            <span>{TYPE_LABEL[e.type]}</span><span>·</span><span className="truncate">{e.locationName}</span>
          </div>
          {!compact && <p className={`mt-1.5 text-sm ${testimony ? "italic text-steel-300" : "text-smoke-200"}`}>{e.summary}</p>}
        </div>
      </div>
    </Tag>
  );
}
