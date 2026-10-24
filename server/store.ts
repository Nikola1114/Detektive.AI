/**
 * Persistence. Player saves are JSON files keyed by a hash of the player's
 * bearer token, written atomically. The interface is small on purpose so a
 * database-backed adapter (see supabase/schema.sql) can replace it.
 */
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { CaseDef } from "./cases/types.ts";
import { newPlayer, type PlayerSave } from "./engine/state.ts";

const DATA_DIR = path.resolve(process.env.DETECTIVE_DATA_DIR || "data");
const PLAYERS = path.join(DATA_DIR, "players");
const GENERATED = path.join(DATA_DIR, "generated");
mkdirSync(PLAYERS, { recursive: true });
mkdirSync(GENERATED, { recursive: true });

const cache = new Map<string, PlayerSave>();

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function file(hash: string) {
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("bad key");
  return path.join(PLAYERS, `${hash}.json`);
}

function writeAtomic(target: string, data: string) {
  const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(tmp, data);
  renameSync(tmp, target);
}

export function createPlayer(): { token: string; save: PlayerSave } {
  const token = randomBytes(32).toString("base64url");
  const save = newPlayer(randomUUID());
  const hash = hashToken(token);
  cache.set(hash, save);
  persist(hash);
  return { token, save };
}

export function loadPlayer(token: string): { hash: string; save: PlayerSave } | null {
  if (!token || token.length > 200) return null;
  const hash = hashToken(token);
  const cached = cache.get(hash);
  if (cached) return { hash, save: cached };
  const f = file(hash);
  if (!existsSync(f)) return null;
  try {
    const save = JSON.parse(readFileSync(f, "utf8")) as PlayerSave;
    save.generatedCases ??= [];
    cache.set(hash, save);
    return { hash, save };
  } catch {
    return null;
  }
}

export function persist(hash: string) {
  const save = cache.get(hash);
  if (save) writeAtomic(file(hash), JSON.stringify(save));
}

export function deletePlayer(hash: string) {
  cache.delete(hash);
  rmSync(file(hash), { force: true });
}

// ── Generated cases (server-only; they contain their solutions) ──

export function saveGeneratedCase(def: CaseDef) {
  writeAtomic(path.join(GENERATED, `${def.id.replace(/[^a-z0-9-]/gi, "")}.json`), JSON.stringify(def));
}

export function loadGeneratedCases(): CaseDef[] {
  const out: CaseDef[] = [];
  for (const f of readdirSync(GENERATED)) {
    if (!f.endsWith(".json")) continue;
    try { out.push(JSON.parse(readFileSync(path.join(GENERATED, f), "utf8")) as CaseDef); } catch { /* skip corrupt file */ }
  }
  return out;
}
