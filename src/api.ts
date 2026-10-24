/** Thin client for the game server. The browser holds only a session token. */
import type { CaseState, GameEvents, Profile } from "../shared/api";

const TOKEN_KEY = "dai.token";

function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(t: string | null) {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* storage blocked */ }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

let sessionPromise: Promise<void> | null = null;

async function ensureSession(): Promise<void> {
  if (getToken()) return;
  sessionPromise ??= fetch("/api/session", { method: "POST" })
    .then((r) => r.json())
    .then((d: { token: string }) => setToken(d.token))
    .finally(() => { sessionPromise = null; });
  return sessionPromise;
}

export async function api<T = unknown>(method: string, url: string, body?: unknown, retry = true): Promise<T> {
  if (url !== "/api/info") await ensureSession();
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() ?? ""}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("Can't reach the precinct server. Check your connection.", 0);
  }
  if (res.status === 401 && retry) {
    setToken(null);
    return api<T>(method, url, body, false);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error || `Request failed (${res.status})`, res.status);
  return data as T;
}

export function forgetSession() { setToken(null); }

export interface Mutation<R = unknown> { result: R; events: GameEvents; state: CaseState; profile: Profile; }
