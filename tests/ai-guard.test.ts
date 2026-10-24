import { test } from "node:test";
import assert from "node:assert/strict";
import { case001 } from "../server/cases/case001/index.ts";
import { validateReply, type AiTurn } from "../server/dialogue/ai.ts";
import { newCaseProgress } from "../server/engine/state.ts";

const sofia = case001.suspects.find((s) => s.id === "sofia")!;
const turn = (revealed: string[] = []): AiTurn => {
  const progress = { ...newCaseProgress(case001).suspects.sofia, revealed };
  return { suspect: sofia, progress, playerText: "Where were you?", beat: { text: "I left the office at 20:15 and worked from home.", mood: "calm" }, sayable: [sofia.greeting] };
};

test("AI replies that stay within the beat are accepted", () => {
  assert.equal(validateReply("I left at 20:15, detective, and worked from home all evening.", turn()), true);
});

test("AI replies that invent a clock time are rejected", () => {
  assert.equal(validateReply("I was home by 22:40, I swear.", turn()), false);
});

test("AI replies that leak a locked secret are rejected", () => {
  assert.equal(validateReply("Fine. I was Lantern.", turn()), false);
  assert.equal(validateReply("My brother Tom wrote that code.", turn()), false);
  assert.equal(validateReply("Fine. I was Lantern.", turn(["lantern"])), true);
});

test("AI replies can never contain a confession", () => {
  assert.equal(validateReply("I killed him.", turn(["went", "lantern", "brother"])), false);
});

test("AI replies that break character are rejected", () => {
  assert.equal(validateReply("As an AI language model I cannot say.", turn()), false);
});
