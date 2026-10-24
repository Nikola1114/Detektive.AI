/**
 * Blackwood Files game server: JSON API + static hosting of the built client.
 * Run with Node 22.18+ (native TypeScript type stripping).
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { CaseSummary, NoteTag } from "../shared/api.ts";
import { builtInCases, getCase } from "./cases/registry.ts";
import { aiInfo } from "./dialogue/ai.ts";
import {
  GameError, abandon, accuse, askForClue, autoDeduce, setMode, act, addNote, connect, deleteNote, hotspots, inspect, interrogate, refreshUnlocks, saveBoard, travel, updateNote,
  type AccusePayload, type Ctx, type TalkInput,
} from "./engine/engine.ts";
import { checkAchievements, emptyEvents, profileView } from "./engine/progression.ts";
import { newCaseProgress, type PlayerSave } from "./engine/state.ts";
import { buildCaseState, buildResolution } from "./engine/view.ts";
import { createPlayer, deletePlayer, loadPlayer, persist } from "./store.ts";
import { generateAndRegister } from "./generator/generator.ts";

const PORT = Number(process.env.PORT || 8787);
const DIST = path.resolve("dist");
const PROD = process.env.NODE_ENV === "production";

type Handler = (req: IncomingMessage, params: Record<string, string>, body: any, auth: Auth | null) => Promise<unknown> | unknown;
interface Auth { hash: string; save: PlayerSave; }
interface Route { method: string; pattern: RegExp; keys: string[]; handler: Handler; auth: boolean; }

const routes: Route[] = [];
function route(method: string, pathPattern: string, handler: Handler, auth = true) {
  const keys: string[] = [];
  const pattern = new RegExp("^" + pathPattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return "([^/]+)"; }) + "$");
  routes.push({ method, pattern, keys, handler, auth });
}

// ───────────── helpers ─────────────

function caseCtx(auth: Auth, caseId: string, create = false, mode?: "easy" | "normal"): Ctx {
  const def = getCase(caseId);
  if (!def) throw new GameError("Case not found.", 404);
  if (def.generated && !auth.save.generatedCases.includes(def.id)) throw new GameError("Case not found.", 404);
  let p = auth.save.cases[caseId];
  if (!p) {
    if (!create) throw new GameError("Case not started.", 404);
    p = newCaseProgress(def, mode === "easy" ? "easy" : "normal");
    auth.save.cases[caseId] = p;
  }
  return { save: auth.save, def, p, ev: emptyEvents() };
}

/** Wraps a mutation: stamps progress, re-checks achievements, saves, returns events + fresh state. */
async function mutate<T>(auth: Auth, caseId: string, fn: (ctx: Ctx) => T | Promise<T>, create = false, mode?: "easy" | "normal") {
  const ctx = caseCtx(auth, caseId, create, mode);
  const result = await fn(ctx);
  ctx.p.updatedAt = Date.now();
  refreshUnlocks(ctx);
  autoDeduce(ctx);
  checkAchievements(ctx.save, ctx.def, ctx.p, ctx.ev);
  persist(auth.hash);
  return { result, events: ctx.ev, state: buildCaseState(ctx.def, ctx.p), profile: profileView(ctx.save) };
}

function summaries(save: PlayerSave): CaseSummary[] {
  const defs = [...builtInCases(), ...save.generatedCases.map((id) => getCase(id)).filter((c) => !!c)];
  return defs.map((def) => {
    const p = save.cases[def.id];
    const total = def.evidence.filter((e) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === e.id))).length;
    const found = p ? Object.keys(p.discovered).filter((id) => def.locations.some((l) => l.hotspots.some((h) => h.evidence === id))).length : 0;
    return {
      id: def.id, title: def.title, subtitle: def.subtitle, synopsis: def.synopsis, difficulty: def.difficulty,
      setting: def.setting, generated: Boolean(def.generated), status: p ? p.status : "new", progress: total ? found / total : 0,
    };
  });
}

// ───────────── routes ─────────────

route("GET", "/api/info", () => ({ aiDialogue: aiInfo.enabled, aiModel: aiInfo.model, storage: "file" }), false);

route("POST", "/api/session", () => {
  const { token, save } = createPlayer();
  return { token, profile: profileView(save) };
}, false);

route("GET", "/api/profile", (_r, _p, _b, auth) => profileView(auth!.save));
route("PATCH", "/api/profile", (_r, _p, body, auth) => {
  const name = String(body?.displayName ?? "").trim().slice(0, 40);
  if (name) auth!.save.displayName = name;
  persist(auth!.hash);
  return profileView(auth!.save);
});
route("DELETE", "/api/profile", (_r, _p, _b, auth) => { deletePlayer(auth!.hash); return { ok: true }; });
route("GET", "/api/export", (_r, _p, _b, auth) => ({ exportedAt: new Date().toISOString(), save: auth!.save }));

route("GET", "/api/cases", (_r, _p, _b, auth) => summaries(auth!.save));
route("POST", "/api/cases/:id/start", async (_r, { id }, body, auth) => (await mutate(auth!, id, () => null, true, body?.mode)));
route("POST", "/api/cases/:id/reset", async (_r, { id }, body, auth) => {
  const def = getCase(id);
  if (!def) throw new GameError("Case not found.", 404);
  delete auth!.save.cases[id];
  return mutate(auth!, id, () => null, true, body?.mode);
});
route("GET", "/api/cases/:id/state", (_r, { id }, _b, auth) => {
  const ctx = caseCtx(auth!, id);
  return { state: buildCaseState(ctx.def, ctx.p) };
});
route("GET", "/api/cases/:id/locations/:loc/hotspots", (_r, { id, loc }, _b, auth) => {
  const ctx = caseCtx(auth!, id);
  return hotspots(ctx.def, ctx.p, loc);
});
route("POST", "/api/cases/:id/travel", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => travel(ctx, String(body?.locationId))));
route("POST", "/api/cases/:id/inspect", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => inspect(ctx, String(body?.hotspotId))));
route("POST", "/api/cases/:id/act", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => {
  const action = body?.action === "photograph" ? "photograph" : "collect";
  act(ctx, String(body?.hotspotId), action);
  return null;
}));
route("POST", "/api/cases/:id/connect", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => connect(ctx, String(body?.a), String(body?.b))));
route("PUT", "/api/cases/:id/board", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => saveBoard(ctx, body)));
route("POST", "/api/cases/:id/notes", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => addNote(ctx, body?.text, body?.tag as NoteTag, body?.ref)));
route("PATCH", "/api/cases/:id/notes/:nid", (_r, { id, nid }, body, auth) => mutate(auth!, id, (ctx) => updateNote(ctx, nid, body ?? {})));
route("DELETE", "/api/cases/:id/notes/:nid", (_r, { id, nid }, _b, auth) => mutate(auth!, id, (ctx) => deleteNote(ctx, nid)));

const lastTalk = new Map<string, number>();
route("POST", "/api/cases/:id/interrogate/:sid", (_r, { id, sid }, body, auth) => {
  const now = Date.now();
  if (now - (lastTalk.get(auth!.hash) ?? 0) < 400) throw new GameError("Slow down, detective.", 429);
  lastTalk.set(auth!.hash, now);
  const input: TalkInput = { topicId: body?.topicId, text: body?.text, evidenceId: body?.evidenceId };
  return mutate(auth!, id, (ctx) => interrogate(ctx, sid, input));
});
route("POST", "/api/cases/:id/accuse", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => accuse(ctx, body as AccusePayload)));
route("POST", "/api/cases/:id/clue", (_r, { id }, _b, auth) => mutate(auth!, id, (ctx) => askForClue(ctx)));
route("POST", "/api/cases/:id/mode", (_r, { id }, body, auth) => mutate(auth!, id, (ctx) => setMode(ctx, body?.mode)));
route("POST", "/api/cases/:id/abandon", (_r, { id }, _b, auth) => mutate(auth!, id, (ctx) => abandon(ctx)));
route("GET", "/api/cases/:id/resolution", (_r, { id }, _b, auth) => {
  const ctx = caseCtx(auth!, id);
  const res = buildResolution(ctx.def, ctx.p);
  if (!res) throw new GameError("The case is still open.", 403);
  return res;
});

route("POST", "/api/generate", async (_r, _p, body, auth) => {
  const def = await generateAndRegister({ setting: String(body?.setting ?? ""), difficulty: String(body?.difficulty ?? "Beginner"), seed: body?.seed });
  if (!auth!.save.generatedCases.includes(def.id)) auth!.save.generatedCases.push(def.id);
  persist(auth!.hash);
  return { caseId: def.id, cases: summaries(auth!.save) };
});

// ───────────── server ─────────────

function send(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

async function readBody(req: IncomingMessage): Promise<any> {
  if (req.method === "GET" || req.method === "DELETE") return null;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const c of req) {
    size += (c as Buffer).length;
    if (size > 256 * 1024) throw new GameError("Request too large.", 413);
    chunks.push(c as Buffer);
  }
  if (!chunks.length) return null;
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new GameError("Invalid JSON."); }
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json",
};

function serveStatic(req: IncomingMessage, res: ServerResponse) {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let f = path.normalize(path.join(DIST, url));
  if (!f.startsWith(DIST)) { res.writeHead(403); res.end(); return; }
  if (!existsSync(f) || statSync(f).isDirectory()) f = path.join(DIST, "index.html");
  if (!existsSync(f)) { res.writeHead(404); res.end("Client not built. Run `npm run build`, or use `npm run dev`."); return; }
  const ext = path.extname(f);
  res.writeHead(200, {
    "Content-Type": MIME[ext] || "application/octet-stream",
    "Cache-Control": f.includes(`${path.sep}assets${path.sep}`) ? "public, max-age=31536000, immutable" : "no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(readFileSync(f));
}

const server = createServer(async (req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (!url.startsWith("/api/")) {
    if (PROD || existsSync(DIST)) return serveStatic(req, res);
    res.writeHead(404); res.end(); return;
  }
  try {
    const r = routes.find((x) => x.method === req.method && x.pattern.test(url));
    if (!r) return send(res, 404, { error: "Not found" });
    const m = r.pattern.exec(url)!;
    const params: Record<string, string> = {};
    r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    let auth: Auth | null = null;
    if (r.auth) {
      const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      auth = loadPlayer(token);
      if (!auth) return send(res, 401, { error: "Session expired. Start a new session." });
    }
    const body = await readBody(req);
    const out = await r.handler(req, params, body, auth);
    send(res, 200, out ?? { ok: true });
  } catch (err) {
    if (err instanceof GameError) return send(res, err.status, { error: err.message });
    console.error(err);
    send(res, 500, { error: "Internal error" });
  }
});

server.listen(PORT, () => {
  console.log(`Blackwood Files server on http://localhost:${PORT}  (AI dialogue: ${aiInfo.enabled ? aiInfo.model : "off — authored dialogue"})`);
});
