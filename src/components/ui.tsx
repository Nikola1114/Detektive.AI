/** Reusable UI primitives, in the spirit of shadcn/ui, styled for the noir theme. */
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger" | "paper";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-b from-amber-400 to-amber-600 text-char-900 hover:from-amber-300 hover:to-amber-500 shadow-[0_0_24px_rgba(231,180,90,0.25)]",
  ghost: "text-smoke-200 hover:bg-white/5 hover:text-white",
  outline: "border border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400",
  danger: "border border-blood-500/50 text-blood-400 hover:bg-blood-500/10",
  paper: "bg-paper-200 text-char-900 hover:bg-paper-100",
};

export function Button({ variant = "outline", size = "md", className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "px-3 py-1.5 text-xs" : size === "lg" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-semibold tracking-wide transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${variants[variant]} ${sz} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "amber" | "red" | "blue" | "green"; className?: string }) {
  const t = {
    neutral: "bg-white/5 text-smoke-200 border-white/10",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    red: "bg-blood-500/10 text-blood-400 border-blood-500/30",
    blue: "bg-steel-500/10 text-steel-300 border-steel-500/30",
    green: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider ${t} ${className}`}>{children}</span>;
}

export function Meter({ value, label, tone = "amber" }: { value: number; label: string; tone?: "amber" | "red" | "blue" }) {
  const color = tone === "red" ? "bg-blood-500" : tone === "blue" ? "bg-steel-400" : "bg-amber-400";
  return (
    <div className="w-full" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      <div className="mb-1 flex justify-between text-[0.65rem] uppercase tracking-widest text-smoke-400"><span>{label}</span><span>{Math.round(value)}</span></div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div className={`h-full ${color}`} initial={false} animate={{ width: `${value}%` }} transition={{ duration: 0.6 }} />
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false, labelledBy }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    window.setTimeout(() => ref.current?.querySelector<HTMLElement>("button, [href], input, textarea, select")?.focus(), 30);
    return () => { window.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div
            ref={ref}
            role="dialog" aria-modal="true" aria-labelledby={labelledBy}
            className={`panel relative max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-xl ${wide ? "sm:max-w-4xl" : "sm:max-w-xl"}`}
            initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ type: "spring", damping: 26, stiffness: 300 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-char-800/95 px-5 py-3 backdrop-blur">
              <div id={labelledBy} className="font-display text-lg text-paper-100">{title}</div>
              <button onClick={onClose} className="rounded p-1 text-smoke-300 hover:bg-white/5 hover:text-white" aria-label="Close"><X size={18} /></button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, className = "" }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={`flex gap-1 overflow-x-auto border-b border-white/5 ${className}`}>
      {tabs.map((t) => (
        <button
          key={t.id} role="tab" aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`relative shrink-0 px-3 py-2 text-sm font-medium transition-colors ${value === t.id ? "text-amber-300" : "text-smoke-400 hover:text-smoke-100"}`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded bg-white/5 px-1.5 text-[0.65rem] text-smoke-300">{t.count}</span>}
          {value === t.id && <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 bg-amber-400" />}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {kicker && <div className="label-caps mb-1">{kicker}</div>}
        <h1 className="font-display text-2xl font-bold text-paper-100 sm:text-3xl">{title}</h1>
      </div>
      {right}
    </div>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-smoke-400">
      <div className="text-smoke-500">{icon}</div>
      <div className="font-display text-lg text-smoke-200">{title}</div>
      <p className="max-w-sm text-sm">{text}</p>
    </div>
  );
}
