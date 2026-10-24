import { test } from "node:test";
import assert from "node:assert/strict";
import { generateAndRegister } from "../server/generator/generator.ts";
import { SETTINGS } from "../server/generator/pools.ts";
import { validateCase } from "../server/engine/validate.ts";
import { newCaseProgress } from "../server/engine/state.ts";
import { buildCaseState } from "../server/engine/view.ts";

const expected = { Beginner: [3, 3, 3], Intermediate: [5, 5, 5], Expert: [7, 8, 7] } as const;

for (const s of SETTINGS) {
  for (const difficulty of ["Beginner", "Intermediate", "Expert"] as const) {
    test(`generates a valid ${difficulty} ${s.id} case`, async () => {
      const def = await generateAndRegister({ setting: s.id, difficulty, seed: 4242 });
      const r = await validateCase(def);
      assert.deepEqual(r.errors, []);
      const [minS, maxS, locs] = expected[difficulty];
      assert.ok(def.suspects.length >= minS && def.suspects.length <= maxS, `suspects ${def.suspects.length}`);
      assert.equal(def.locations.length, locs);
      const [lo, hi] = difficulty === "Beginner" ? [10, 15] : difficulty === "Intermediate" ? [20, 30] : [35, 60];
      assert.ok(r.stats.evidence >= lo && r.stats.evidence <= hi, `clues ${r.stats.evidence}`);
      // The fresh client view must not reveal motive documents or the solution.
      const json = JSON.stringify(buildCaseState(def, newCaseProgress(def)));
      assert.ok(!json.includes(def.evidence.find((e) => e.id === "e_motive1")!.summary));
      assert.ok(!json.includes("solution") && !json.includes("pairs"));
    });
  }
}

test("same seed produces the same case", async () => {
  const { buildCase } = await import("../server/generator/generator.ts");
  const a = buildCase(SETTINGS[0], "Beginner", 99);
  const b = buildCase(SETTINGS[0], "Beginner", 99);
  assert.deepEqual(a, b);
});

test("the validator rejects broken cases", async () => {
  const { buildCase } = await import("../server/generator/generator.ts");
  const fresh = () => buildCase(SETTINGS[0], "Beginner", 7);
  const errorsOf = async (def: ReturnType<typeof fresh>) => (await validateCase(def)).errors.join(" | ");

  // Unreachable essential evidence.
  const a = fresh();
  for (const l of a.locations) l.hotspots = l.hotspots.filter((h) => h.evidence !== "e_registry");
  assert.match(await errorsOf(a), /e_registry' can never be discovered/);

  // Multiple possible solutions: nothing rules an innocent out.
  const b = fresh();
  const innocent = b.suspects.find((s) => s.id !== b.solution.culprit)!;
  b.deductions = b.deductions.filter((d) => !d.clears?.includes(innocent.id));
  assert.match(await errorsOf(b), /Multiple solutions: nothing rules out/);

  // Contradictory facts: a deduction clears the culprit.
  const c = fresh();
  c.deductions[0].clears = [c.solution.culprit];
  assert.match(await errorsOf(c), /clears the true culprit/);

  // Inconsistent canonical timeline.
  const d = fresh();
  d.solution.timeline.reverse();
  assert.match(await errorsOf(d), /timeline out of order/);
});
