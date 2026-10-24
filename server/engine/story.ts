/**
 * Story mode: the case told in chapters. Each chapter opens with a cutscene
 * and closes when its objectives are met. Progress is derived from the
 * investigation state, so nothing extra is stored and chapters can never
 * fall out of step with what the player has actually done.
 */
import type { Shot, StoryView } from "../../shared/api.ts";
import type { CaseDef, ChapterDef } from "../cases/types.ts";
import { check, type CaseProgress } from "./state.ts";
import type { Ctx } from "./engine.ts";

/** Set once the case is over, which completes the final chapter. */
export const CLOSED_FLAG = "case_closed";

const generic = new WeakMap<CaseDef, ChapterDef[]>();

export function storyOf(def: CaseDef): ChapterDef[] {
  if (def.story?.length) return def.story;
  let s = generic.get(def);
  if (!s) { s = genericStory(def); generic.set(def, s); }
  return s;
}

/** Index of the first chapter with unfinished objectives (= length when all are done). */
export function chapterIndex(def: CaseDef, p: CaseProgress): number {
  const story = storyOf(def);
  const i = story.findIndex((c) => !c.objectives.every((o) => check(p, o.done)));
  return i === -1 ? story.length : i;
}

export function storyView(def: CaseDef, p: CaseProgress): StoryView | null {
  const story = storyOf(def);
  const index = Math.min(chapterIndex(def, p), story.length - 1);
  const c = story[index];
  return { index, total: story.length, id: c.id, title: c.title, intro: c.intro, objectives: c.objectives.map((o) => ({ text: o.text, done: check(p, o.done) })) };
}

/** Called after every mutation: records the end of the case and announces a new chapter. */
export function noteChapter(ctx: Ctx, before: number) {
  if (ctx.p.status !== "active" && !ctx.p.flags.includes(CLOSED_FLAG)) ctx.p.flags.push(CLOSED_FLAG);
  if (ctx.p.mode !== "story" || ctx.p.status !== "active") return;
  const after = chapterIndex(ctx.def, ctx.p);
  const story = storyOf(ctx.def);
  if (after > before && after < story.length) ctx.ev.chapter = { index: after, title: story[after].title };
}

/** What the current chapter still needs, so clues can point at it first. */
export function storyFocus(def: CaseDef, p: CaseProgress): { evidence: string[]; interview: string[]; visit: string[] } {
  const none = { evidence: [], interview: [], visit: [] };
  if (p.mode !== "story") return none;
  const c = storyOf(def)[chapterIndex(def, p)];
  if (!c) return none;
  const todo = c.objectives.filter((o) => !check(p, o.done)).map((o) => o.done);
  return {
    evidence: todo.flatMap((d) => [...(d.evidence ?? []), ...(d.anyEvidence ?? [])]).filter((id) => !(id in p.discovered)),
    interview: todo.flatMap((d) => d.interviewed ?? []).filter((id) => !p.suspects[id]?.interviewed),
    visit: todo.flatMap((d) => d.visited ?? []).filter((id) => !p.visited.includes(id)),
  };
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** A serviceable story for cases without an authored one (e.g. generated cases). */
function genericStory(def: CaseDef): ChapterDef[] {
  const start = def.locations.find((l) => l.id === def.startLocations[0])!;
  const firstClues = start.hotspots.filter((h) => h.evidence && !h.subtle && !h.requires).slice(0, 3);
  const later = def.locations.filter((l) => !def.startLocations.includes(l.id));
  const [first, ...rest] = def.briefing;
  const chapters: ChapterDef[] = [
    {
      id: "scene",
      title: "The Scene",
      intro: [
        { visual: "rain", text: first ?? def.synopsis, speaker: "narrator", camera: "push", caption: def.setting.toUpperCase() },
        ...rest.slice(0, 2).map((t, i): Shot => ({ visual: i === 0 ? `scene:${start.scene}` : "city", text: t, speaker: "narrator", camera: i === 0 ? "pan-right" : "pull" })),
        { visual: "title", text: def.synopsis, caption: def.title },
        { visual: "black", text: "Chapter one. The scene.", speaker: "narrator", caption: "Chapter 1 · The Scene" },
      ],
      objectives: firstClues.length
        ? firstClues.map((h) => ({ text: `${start.name}: examine the ${lower(h.label)}`, done: { evidence: [h.evidence!] } }))
        : [{ text: `Visit ${start.name}`, done: { visited: [start.id] } }],
    },
    {
      id: "suspects",
      title: "The Suspects",
      intro: [
        { visual: "black", text: `${def.suspects.length} people had a reason to want ${def.victim.name} gone. Time to hear their stories.`, speaker: "narrator", caption: "Chapter 2 · The Suspects" },
        ...def.suspects.map((s): Shot => ({ visual: `portrait:${s.id}`, text: s.greeting, speaker: s.id, camera: "push", caption: s.name })),
      ],
      objectives: def.suspects.map((s) => ({ text: `Question ${s.name}`, done: { interviewed: [s.id] } })),
    },
  ];
  if (later.length) chapters.push({
    id: "trail",
    title: "Following the Trail",
    intro: [
      { visual: "city", text: "Every story has holes. The answers are out there in the city, if you know where to look.", speaker: "narrator", camera: "pan-left", caption: "Chapter 3 · Following the Trail" },
      ...later.slice(0, 2).map((l): Shot => ({ visual: `scene:${l.scene}`, text: l.unlockHint, speaker: "kane", camera: "push" })),
    ],
    objectives: later.map((l) => ({ text: `Search ${l.name}`, done: { visited: [l.id] } })),
  });
  const n = Math.min(3, def.deductions.length);
  if (n) chapters.push({
    id: "connections",
    title: "Connections",
    intro: [
      { visual: `scene:police`, text: "Pin it all up. Somewhere in this mess, two facts disagree, and that's where the truth is hiding.", speaker: "kane", camera: "push", caption: `Chapter ${chapters.length + 1} · Connections` },
    ],
    objectives: [{ text: `Make ${n} deduction${n > 1 ? "s" : ""} on the evidence board`, done: { minDeductions: n } }],
  });
  chapters.push(finalChapter(chapters.length + 1));
  return chapters;
}

export function finalChapter(number: number): ChapterDef {
  return {
    id: "accusation",
    title: "The Accusation",
    intro: [
      { visual: "rain", text: "It's late. The rain hasn't stopped. You know enough now.", speaker: "narrator", camera: "push", caption: `Chapter ${number} · The Accusation` },
      { visual: "scene:police", text: "Who, why, how, and in what order, Detective. Bring me something the DA can't argue with.", speaker: "kane", camera: "pull" },
    ],
    objectives: [{ text: "Make your accusation", done: { flags: [CLOSED_FLAG] } }],
  };
}
