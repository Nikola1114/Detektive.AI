/**
 * Global game store: session, profile, active case state, navigation, settings
 * and the feedback queue (toasts for discoveries, deductions, achievements).
 * All game state comes from the server; this layer only caches the latest view.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CaseState, CaseSummary, GameEvents, Profile, ServerInfo } from "../../shared/api";
import { api, ApiError, forgetSession, type Mutation } from "../api";
import { audio } from "../audio";
import { applySettingsToDocument, loadSettings, storeSettings, type Settings } from "./settings";

export interface Route { name: string; param?: string; }

export type ToastKind = "discovery" | "unlock" | "deduction" | "contradiction" | "xp" | "achievement" | "rank" | "error" | "info";
export interface Toast { id: number; kind: ToastKind; title: string; text?: string; }

interface Game {
  ready: boolean;
  fatal: string | null;
  info: ServerInfo | null;
  profile: Profile | null;
  cases: CaseSummary[];
  caseId: string | null;
  state: CaseState | null;
  settings: Settings;
  route: Route;
  busy: boolean;
  toasts: Toast[];
  go: (path: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  startCase: (id: string, opts?: { reset?: boolean }) => Promise<boolean>;
  mutate: <R = unknown>(method: string, path: string, body?: unknown) => Promise<R | undefined>;
  refreshCases: () => Promise<void>;
  setProfile: (p: Profile) => void;
  notify: (kind: ToastKind, title: string, text?: string) => void;
  dismiss: (id: number) => void;
  resetAll: () => Promise<void>;
}

const Ctx = createContext<Game | null>(null);
const CASE_KEY = "dai.case";

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  const [name, param] = h.split("/");
  return { name: name || "welcome", param: param ? decodeURIComponent(param) : undefined };
}

function readCaseId(): string | null {
  try { return localStorage.getItem(CASE_KEY); } catch { return null; }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [caseId, setCaseId] = useState<string | null>(readCaseId());
  const [state, setState] = useState<CaseState | null>(null);
  const [settings, setSettingsState] = useState<Settings>(loadSettings);
  const [route, setRoute] = useState<Route>(parseHash);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(1);

  const notify = useCallback((kind: ToastKind, title: string, text?: string) => {
    const id = toastId.current++;
    setToasts((t) => [...t.slice(-5), { id, kind, title, text }]);
    const ttl = kind === "deduction" || kind === "contradiction" ? 7000 : kind === "rank" ? 6000 : 3800;
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
  }, []);
  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const handleEvents = useCallback((ev: GameEvents) => {
    for (const d of ev.deductions) { notify(d.contradiction ? "contradiction" : "deduction", d.title, d.text); audio.sfx(d.contradiction ? "contradiction" : "deduction"); }
    for (const d of ev.discoveries) { notify("discovery", d.title); audio.sfx("discover"); }
    for (const u of ev.unlocks) { notify("unlock", u.name); audio.sfx("unlock"); }
    for (const r of ev.revelations) notify("info", r);
    for (const a of ev.achievements) { notify("achievement", a.title); audio.sfx("achievement"); }
    if (ev.rankUp) notify("rank", ev.rankUp);
    if (ev.xp > 0) notify("xp", `+${ev.xp} XP`);
  }, [notify]);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => { applySettingsToDocument(settings); storeSettings(settings); audio.configure(settings.sound, settings); }, [settings]);

  const go = useCallback((path: string) => {
    audio.sfx("click");
    window.location.hash = path.startsWith("/") ? path : `/${path}`;
  }, []);

  const refreshCases = useCallback(async () => setCases(await api<CaseSummary[]>("GET", "/api/cases")), []);

  // Bootstrap: server info, session/profile, case list, and the active case.
  useEffect(() => {
    (async () => {
      try {
        setInfo(await api<ServerInfo>("GET", "/api/info"));
        setProfile(await api<Profile>("GET", "/api/profile"));
        const list = await api<CaseSummary[]>("GET", "/api/cases");
        setCases(list);
        const active = readCaseId();
        if (active && list.some((c) => c.id === active && c.status !== "new")) {
          const r = await api<{ state: CaseState }>("GET", `/api/cases/${active}/state`);
          setState(r.state);
        } else if (active) {
          setCaseId(null);
        }
      } catch (e) {
        setFatal(e instanceof ApiError ? e.message : "Something went wrong loading the game.");
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const startCase = useCallback(async (id: string, opts?: { reset?: boolean }) => {
    setBusy(true);
    try {
      const m = await api<Mutation>("POST", `/api/cases/${id}/${opts?.reset ? "reset" : "start"}`);
      setState(m.state);
      setProfile(m.profile);
      setCaseId(id);
      try { localStorage.setItem(CASE_KEY, id); } catch { /* ignore */ }
      void refreshCases();
      return true;
    } catch (e) {
      notify("error", e instanceof Error ? e.message : "Could not open the case.");
      return false;
    } finally { setBusy(false); }
  }, [notify, refreshCases]);

  const mutate = useCallback(async <R,>(method: string, path: string, body?: unknown): Promise<R | undefined> => {
    if (!caseId) return undefined;
    setBusy(true);
    try {
      const m = await api<Mutation<R>>(method, `/api/cases/${caseId}${path}`, body);
      setState(m.state);
      setProfile(m.profile);
      handleEvents(m.events);
      return m.result;
    } catch (e) {
      audio.sfx("error");
      notify("error", e instanceof Error ? e.message : "Something went wrong.");
      return undefined;
    } finally { setBusy(false); }
  }, [caseId, handleEvents, notify]);

  const setSettings = useCallback((patch: Partial<Settings>) => setSettingsState((s) => ({ ...s, ...patch })), []);

  const resetAll = useCallback(async () => {
    await api("DELETE", "/api/profile").catch(() => undefined);
    forgetSession();
    try { localStorage.removeItem(CASE_KEY); } catch { /* ignore */ }
    window.location.hash = "/welcome";
    window.location.reload();
  }, []);

  const value = useMemo<Game>(() => ({
    ready, fatal, info, profile, cases, caseId, state, settings, route, busy, toasts,
    go, setSettings, startCase, mutate, refreshCases, setProfile, notify, dismiss, resetAll,
  }), [ready, fatal, info, profile, cases, caseId, state, settings, route, busy, toasts, go, setSettings, startCase, mutate, refreshCases, notify, dismiss, resetAll]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGame(): Game {
  const g = useContext(Ctx);
  if (!g) throw new Error("useGame outside provider");
  return g;
}
