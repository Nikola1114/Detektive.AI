import { test } from "node:test";
import assert from "node:assert/strict";
import { case001 } from "../server/cases/case001/index.ts";
import { buildCase } from "../server/generator/generator.ts";
import { SETTINGS } from "../server/generator/pools.ts";
import { accuse, act, askForClue, autoDeduce, connect, ev, hotspots, inspect, interrogate, refreshUnlocks, travel, type Ctx } from "../server/engine/engine.ts";
import { emptyEvents } from "../server/engine/progression.ts";
import { newCaseProgress, newPlayer } from "../server/engine/state.ts";
import type { CaseDef } from "../server/cases/types.ts";

/** A player who does nothing but ask for clues and follow them exactly. */
async function followClues(def: CaseDef, mode: "easy" | "normal") {
  const ctx: Ctx = { save: newPlayer("bot"), def, p: newCaseProgress(def, mode), ev: emptyEvents() };
  for (let i = 0; i < 400; i++) {
    askForClue(ctx);
    if (mode === "normal") askForClue(ctx); // second ask gives the exact version
    const target = ctx.p.lastClue!;
    const [kind, a, b] = target.split(":");
    if (kind === "accuse") return ctx;
    if (kind === "lock") throw new Error(`Stuck: clue points at a locked location (${a})`);
    if (kind === "loc") {
      const loc = def.locations.find((l) => l.hotspots.some((h) => h.id === a))!;
      travel(ctx, loc.id);
      assert.ok(hotspots(def, ctx.p, loc.id).some((h) => h.id === a), "clue points at a visible object");
      const r = inspect(ctx, a);
      act(ctx, a, r.action === "photograph" ? "photograph" : "collect");
    } else if (kind === "ded") {
      const d = def.deductions.find((x) => x.id === a)!;
      const [x, y] = d.pairs.find(([p, q]) => p in ctx.p.discovered && q in ctx.p.discovered)!;
      connect(ctx, x, y);
    } else if (kind === "topic") {
      await interrogate(ctx, a, { topicId: b });
    } else if (kind === "ev") {
      await interrogate(ctx, a, { evidenceId: b });
    }
    refreshUnlocks(ctx);
    autoDeduce(ctx);
  }
  throw new Error("Clues never led to the accusation");
}

for (const mode of ["normal", "easy"] as const) {
  test(`following clues alone solves Case 001 (${mode} mode)`, async () => {
    const ctx = await followClues(case001, mode);
    const sol = case001.solution;
    const found = (list: string[]) => list.filter((e) => e in ctx.p.discovered && ev(case001, e)!.importance === "key");
    const pick = [...found(sol.support.opportunity).slice(0, 2), ...found(sol.support.means).slice(0, 1), ...found(sol.support.motive).slice(0, 1)];
    assert.equal(pick.length, 4, "clues led to evidence of opportunity, means and motive");
    const r = accuse(ctx, { suspectId: sol.culprit, motive: sol.motive, method: sol.method, sequence: sol.sequence, evidence: pick });
    assert.equal(r.verdict, "solved");
    console.log(`${mode}: ${ctx.p.hintsUsed} clue requests, ${Object.keys(ctx.p.discovered).length} items found`);
  });
}

test("following clues alone solves generated cases", async () => {
  for (const s of SETTINGS) {
    const def = buildCase(s, "Intermediate", 77);
    const ctx = await followClues(def, "normal");
    assert.ok(Object.keys(ctx.p.deductions).length > 0);
  }
});

test("easy mode: no hidden clues, automatic deductions, suspects crack easily, unlimited accusations", async () => {
  const ctx: Ctx = { save: newPlayer("e"), def: case001, p: newCaseProgress(case001, "easy"), ev: emptyEvents() };
  travel(ctx, "office");
  assert.ok(hotspots(case001, ctx.p, "office").every((h) => !h.subtle));
  for (const id of ["h_watch", "h_computer"]) { inspect(ctx, id); act(ctx, id, "collect"); }
  autoDeduce(ctx);
  assert.ok("watch_lied" in ctx.p.deductions, "deduction made automatically");
  // Sofia admits being there at the first push in easy mode (normal needs stress 45+).
  ctx.p.discovered.taxi = Date.now();
  await interrogate(ctx, "sofia", { evidenceId: "taxi" });
  assert.ok(ctx.p.suspects.sofia.revealed.includes("went"));
  for (let i = 0; i < 5; i++) {
    const r = accuse(ctx, { suspectId: "adrian", motive: "m_debt", method: "x_lighthouse", sequence: "s_console", evidence: ["watch", "computer", "taxi"] });
    assert.equal(r.caseClosed, false);
  }
  assert.equal(ctx.p.status, "active");
});
