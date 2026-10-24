/** In-game shell: navigation sidebar (desktop) / bottom bar (mobile). */
import { BookOpen, Briefcase, Gavel, Map, Network, Settings, Users, UserRound, Home } from "lucide-react";
import type { ReactNode } from "react";
import { useGame } from "../game/GameContext";

const NAV = [
  { path: "office", label: "Office", icon: Home },
  { path: "map", label: "City Map", icon: Map },
  { path: "interrogate", label: "Suspects", icon: Users },
  { path: "board", label: "Evidence Board", icon: Network },
  { path: "notebook", label: "Notebook", icon: BookOpen },
  { path: "accuse", label: "Accusation", icon: Gavel },
];

export function GameLayout({ children, active }: { children: ReactNode; active: string }) {
  const { go, state, profile } = useGame();
  return (
    <div className="flex min-h-full">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-white/5 bg-char-900/80 backdrop-blur md:flex">
        <button onClick={() => go("welcome")} className="flex items-center gap-2 px-5 pb-4 pt-5 text-left">
          <span className="font-display text-xl font-extrabold tracking-[0.1em] text-paper-100">BLACKWOOD</span>
          <span className="rounded bg-amber-500 px-1 font-display text-xs font-extrabold text-char-900">FILES</span>
        </button>
        {state && (
          <div className="mx-4 mb-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
            <div className="label-caps">{state.subtitle}</div>
            <div className="font-display text-base font-bold leading-tight text-paper-100">{state.title}</div>
            <div className="mt-2 flex items-center justify-between text-[0.7rem] text-smoke-400">
              <span>{state.cluesFound}/{state.evidenceTotal} clues</span>
              <span className={state.status === "active" ? "text-emerald-400" : "text-amber-400"}>{state.status === "active" ? "Open" : "Closed"}</span>
            </div>
          </div>
        )}
        <nav className="flex flex-1 flex-col gap-0.5 px-2" aria-label="Investigation">
          {NAV.map((n) => (
            <button
              key={n.path} onClick={() => go(n.path)}
              aria-current={active === n.path ? "page" : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${active === n.path ? "bg-amber-500/10 text-amber-300" : "text-smoke-300 hover:bg-white/5 hover:text-white"}`}
            >
              <n.icon size={17} />{n.label}
            </button>
          ))}
        </nav>
        <div className="flex flex-col gap-0.5 border-t border-white/5 p-2">
          <button onClick={() => go("cases")} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-smoke-400 hover:bg-white/5 hover:text-white"><Briefcase size={16} />Case Files</button>
          <button onClick={() => go("profile")} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/5 hover:text-white ${active === "profile" ? "text-amber-300" : "text-smoke-400"}`}>
            <UserRound size={16} /><span className="truncate">{profile?.rank ?? "Profile"}</span>
          </button>
          <button onClick={() => go("settings")} className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/5 hover:text-white ${active === "settings" ? "text-amber-300" : "text-smoke-400"}`}><Settings size={16} />Settings</button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 pb-20 md:pb-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-char-900/95 backdrop-blur md:hidden" aria-label="Investigation">
        {NAV.map((n) => (
          <button key={n.path} onClick={() => go(n.path)} aria-current={active === n.path ? "page" : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[0.6rem] ${active === n.path ? "text-amber-300" : "text-smoke-400"}`}>
            <n.icon size={19} /><span className="truncate">{n.label.split(" ")[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
