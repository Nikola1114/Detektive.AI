/**
 * Procedural case generator.
 *
 * Order of work matters: the canonical truth (culprit, motive, method, times,
 * everyone's real movements) is decided first; evidence, locations, unlocks
 * and dialogue are then derived from it. The result is run through the same
 * validator as hand-authored cases and is rejected — and regenerated with a
 * new seed — unless the timeline is consistent, every clue is reachable and
 * exactly one suspect can be the culprit.
 */
import type { PortraitSpec, SceneKind } from "../../shared/api.ts";
import type { CaseDef, DeductionDef, EvidenceDef, HotspotDef, LocationDef, ResponseNode, SuspectDef } from "../cases/types.ts";
import { registerGenerated } from "../cases/registry.ts";
import { GameError } from "../engine/engine.ts";
import { validateCase } from "../engine/validate.ts";
import { FIRST, HAIRC, HAIRS, LAST, METHODS, MOTIVES, OUTFITC, OUTFITS, PERSONALITIES, SECRETS, SETTINGS, SKIN, type SettingPool } from "./pools.ts";

type Difficulty = "Beginner" | "Intermediate" | "Expert";

const SHAPE: Record<Difficulty, { suspects: [number, number]; locations: number; perInnocent: number; herrings: number; clues: [number, number] }> = {
  Beginner: { suspects: [3, 3], locations: 3, perInnocent: 2, herrings: 1, clues: [10, 15] },
  Intermediate: { suspects: [5, 5], locations: 5, perInnocent: 3, herrings: 1, clues: [20, 30] },
  Expert: { suspects: [7, 8], locations: 7, perInnocent: 4, herrings: 2, clues: [35, 60] },
};

/** Hotspot positions (percent of the scene) that sit on drawn furniture, per scene kind. */
const SLOTS: Record<SceneKind, [number, number, number, number][]> = {
  office: [[51, 50, 5, 8], [60, 53, 6, 5], [69, 38, 11, 15], [76, 63, 8, 6], [88, 57, 8, 8], [86, 25, 6, 13], [54, 83, 6, 7], [10, 86, 7, 7], [16, 57, 8, 14], [69, 88, 5, 5]],
  police: [[41, 53, 8, 6], [51, 55, 7, 5], [66, 53, 7, 6], [21, 62, 8, 9], [9, 56, 10, 8], [10, 15, 13, 18], [26, 20, 7, 9], [83, 38, 9, 12], [85, 60, 8, 10]],
  security: [[40, 50, 10, 9], [15, 50, 10, 9], [28, 55, 7, 7], [52, 55, 7, 7], [59, 57, 7, 6], [67, 22, 6, 16], [13, 13, 11, 11], [38, 13, 11, 11], [25.5, 27, 11, 11]],
  bar: [[43, 50, 8, 6], [10, 50, 7, 6], [25, 50, 7, 6], [77, 62, 7, 6], [86, 62, 6, 6], [33, 12, 6, 10], [12, 12, 6, 10], [65, 85, 6, 6], [48, 86, 6, 6]],
  penthouse: [[68, 47, 10, 10], [79, 64, 8, 6], [3, 24, 10, 22], [92, 38, 5, 10], [44, 57, 5, 7], [52, 58, 6, 6], [25, 66, 6, 6], [62, 86, 6, 6], [36, 84, 7, 7]],
  newsroom: [[37, 38, 11, 14], [70, 18, 10, 13], [6, 52, 10, 10], [51, 58, 6, 5], [88, 55, 7, 8], [28, 52, 7, 6], [84, 22, 8, 12], [60, 52, 7, 6], [45, 86, 6, 6]],
  flat: [[6, 22, 9, 38], [8, 82, 9, 9], [62, 62, 8, 6], [31, 43, 11, 13], [89, 28, 6, 9], [44, 52, 6, 6], [70, 56, 6, 6], [89, 45, 6, 9], [50, 85, 6, 6]],
  hotel: [[38, 49, 7, 7], [52, 49, 7, 7], [61, 47, 6, 8], [12, 22, 7, 10], [18, 36, 7, 10], [79, 36, 9, 10], [80, 58, 8, 8], [45, 85, 6, 6], [22, 84, 7, 7], [40, 62, 7, 6]],
  museum: [[38, 49, 7, 7], [52, 49, 7, 7], [61, 47, 6, 8], [12, 18, 12, 14], [76, 18, 12, 14], [79, 40, 9, 10], [80, 60, 8, 8], [45, 85, 6, 6], [22, 84, 7, 7], [40, 62, 7, 6]],
  manor: [[38, 49, 7, 7], [52, 49, 7, 7], [61, 47, 6, 8], [12, 22, 7, 10], [18, 36, 7, 10], [79, 36, 9, 10], [80, 58, 8, 8], [45, 85, 6, 6], [22, 84, 7, 7], [40, 62, 7, 6]],
  shop: [[38, 49, 7, 7], [52, 49, 7, 7], [61, 47, 6, 8], [12, 22, 7, 10], [18, 36, 7, 10], [79, 36, 9, 10], [80, 58, 8, 8], [45, 85, 6, 6], [22, 84, 7, 7], [40, 62, 7, 6]],
};

const PROP_FOR_ICON: Record<string, string> = {
  footprint: "footprint", folder: "folder", report: "folder", microscope: "tray", list: "logbook", "id-card": "box", film: "screen", car: "papers",
  papers: "papers", scroll: "papers", warning: "papers", receipt: "ledger", notebook: "notebook", frame: "frame", "evidence-bag": "evidence-bag",
  speech: "papers", trophy: "trophy", glass: "glass", watch: "watch", ticket: "note", usb: "cable", book: "book", safe: "safe",
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hhmm = (mins: number) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
const fill = (s: string, vars: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

export function buildCase(pool: SettingPool, difficulty: Difficulty, seed: number): CaseDef {
  const rnd = mulberry32(seed);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const shuffle = <T,>(arr: T[]) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const shape = SHAPE[difficulty];
  const nSus = shape.suspects[0] + Math.floor(rnd() * (shape.suspects[1] - shape.suspects[0] + 1));
  const crime = pool.crime;

  // ── 1. Canonical truth ──
  const usedNames = new Set<string>();
  const person = () => {
    for (;;) {
      const n = `${pick(FIRST)} ${pick(LAST)}`;
      const last = n.split(" ")[1];
      if (![...usedNames].some((u) => u.endsWith(last))) { usedNames.add(n); return n; }
    }
  };
  const victimName = person();
  const victimRole = pick(pool.victimRoles);
  const victimLabel = crime === "theft" ? (pool.target ?? "the item") : victimName;
  const roles = shuffle(pool.relations).slice(0, nSus);
  const culpritIdx = Math.floor(rnd() * nSus);
  const sizes = shuffle([36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46]).slice(0, nSus);
  const method = pick(METHODS[crime]);
  const motive = pick(MOTIVES[crime]);
  const secrets = shuffle(SECRETS);
  const tEnter = 21 * 60 + 15 + Math.floor(rnd() * 40);
  const tCrime = tEnter + 6 + Math.floor(rnd() * 6);
  const tLeave = tCrime + 7 + Math.floor(rnd() * 8);
  const tBreak = tEnter - 5;
  const otherPlaces = shuffle(pool.places);
  // Every suspect — culprit included — gives the same kind of alibi, greeting and demeanour, so nothing but evidence separates them.
  const claimOf = (i: number) => secrets[i % secrets.length].claim;
  const greetings = shuffle(["Detective. Ask what you need to ask.", "I'll help however I can.", "Is this going to take long?", "I've already told the officers everything.", "Go on, then.", "I suppose you'd better sit down.", "Detective. I haven't slept.", "Let's get this over with."]);

  const people = roles.map((r, i) => {
    const name = person();
    return {
      id: `s${i + 1}`, name, first: name.split(" ")[0], initials: name.split(" ").map((p) => p[0]).join("."),
      role: r, culprit: i === culpritIdx, size: sizes[i], secret: secrets[i % secrets.length],
      secretPlace: otherPlaces[(i + 1) % otherPlaces.length].name, age: 26 + Math.floor(rnd() * 38),
      personality: pick(PERSONALITIES), claim: claimOf(i), greeting: greetings[i % greetings.length],
      height: `1.${58 + Math.floor(rnd() * 30)} m`, stress: 15 + Math.floor(rnd() * 15), trust: 25 + Math.floor(rnd() * 15),
    };
  });
  const C = people[culpritIdx];
  const innocents = people.filter((p) => !p.culprit);

  // ── 2. Evidence derived from the truth ──
  const evidence: EvidenceDef[] = [];
  const add = (e: EvidenceDef) => { evidence.push(e); return e.id; };
  const crimeWord = crime === "murder" ? "murder" : crime === "theft" ? "theft" : "disappearance";

  add({ id: "e_trace", title: "Partial Shoe Print", type: "forensic", importance: "key", icon: "footprint", source: pool.scene.name,
    summary: `A clear partial print of a size-${C.size} shoe, left in spilled dust near where the ${crimeWord} took place.`,
    detail: `Forensics lifted a partial shoe print from the floor of ${pool.scene.name}. Size ${C.size}, heel worn on the outer edge. It was made recently — after the floor was last swept at 18:00.` });
  add({ id: "e_files", title: "Persons of Interest File", type: "document", importance: "supporting", icon: "folder", source: pool.police.name,
    summary: "Background on each person of interest, including shoe sizes taken during initial interviews.",
    detail: people.map((p) => `• ${p.name} — ${p.role.profession} — shoe size ${p.size}`).join("\n") });
  add({ id: "e_weapon", title: method.weapon, type: "physical", importance: "key", icon: "evidence-bag", source: pool.scene.name,
    summary: method.weaponText, detail: `${method.weaponText} It has been bagged for the lab.` });
  add({ id: "e_forensic", title: "Forensic Report", type: "forensic", importance: "key", icon: "report", source: pool.police.name,
    summary: `${method.forensic.split(".")[0]}. The ${crimeWord} happened between ${hhmm(tCrime - 10)} and ${hhmm(tCrime + 10)}.`,
    detail: `${method.forensic}\nEstimated time of the ${crimeWord}: between ${hhmm(tCrime - 10)} and ${hhmm(tCrime + 10)}.`,
    timeline: [{ time: hhmm(tCrime - 10), text: `Earliest possible time of the ${crimeWord}.` }] });
  add({ id: "e_log", title: pool.access.log, type: "document", importance: "key", icon: "list", source: pool.places[0].name,
    summary: `${cap(pool.access.item)} was used on the ${pool.access.device} at ${hhmm(tEnter)} and again at ${hhmm(tLeave)}.`,
    detail: `Entries for the night:\n• ${hhmm(tEnter)} — ${pool.access.device} — ${pool.access.item}\n• ${hhmm(tLeave)} — ${pool.access.device} — ${pool.access.item}\nNo other entries between 19:00 and midnight.`,
    timeline: [{ time: hhmm(tEnter), text: `${cap(pool.access.item)} opens the ${pool.access.device}.` }, { time: hhmm(tLeave), text: `${cap(pool.access.item)} used again on the ${pool.access.device}.` }] });
  add({ id: "e_registry", title: pool.access.registry, type: "document", importance: "key", icon: "id-card", source: pool.places[0].name,
    summary: `${cap(pool.access.item)} is registered to ${C.name}. It was never reported lost.`,
    detail: `${cap(pool.access.item)} — issued to ${C.name}. Status: in use. Loss reports: none.\nAll other keys are accounted for and were locked away overnight.` });
  add({ id: "e_break", title: pool.alibiBreak.title, type: "document", importance: "key", icon: "car", source: pool.police.name,
    summary: `${cap(pool.alibiBreak.noun)} puts ${C.name} two minutes from ${pool.scene.name} at ${hhmm(tBreak)}.`,
    detail: `Checking everyone's account of the evening turned up ${pool.alibiBreak.noun}, time-stamped ${hhmm(tBreak)}, placing ${C.name} two minutes from ${pool.scene.name}.`,
    timeline: [{ time: hhmm(tBreak), text: `${C.name} is recorded two minutes from ${pool.scene.name}.` }] });
  const mv = { name: C.name, initials: C.initials };
  add({ id: "e_motive1", title: motive.doc1[0], type: "document", importance: "key", icon: "papers", source: "", summary: fill(motive.doc1[1], mv), detail: fill(motive.doc1[1], mv) });
  add({ id: "e_motive2", title: motive.doc2[0], type: "document", importance: "key", icon: "scroll", source: "", summary: fill(motive.doc2[1], mv), detail: fill(motive.doc2[1], mv) });
  add({ id: "T_C_ALIBI", title: `${C.first}: 'At ${cap(C.claim)}'`, type: "testimony", importance: "supporting", icon: "speech", source: C.name,
    summary: `${C.name} claims to have been ${C.claim}.`, detail: `"I was ${C.claim}. I didn't see anyone."`,
    timeline: [{ time: "20:00", text: `(Claim) ${C.name}: ${C.claim}.` }] });
  add({ id: "T_C_ADMIT", title: `${C.first}: 'It was already done'`, type: "testimony", importance: "key", icon: "speech", source: C.name,
    summary: `${C.name} now admits going to ${pool.scene.name}, but claims it was already over when they arrived.`,
    detail: `"All right — I went. But when I got there it was already done. I panicked and left. That's all."`,
    timeline: [{ time: hhmm(tEnter), text: `(Claim) ${C.name}: arrived to find it already done.` }] });

  const herringObjects = ["monogrammed handkerchief", "leather glove", "engraved cigarette lighter", "ticket stub", "silver tie pin"];
  innocents.forEach((p, k) => {
    const t1 = hhmm(tEnter - 30 - Math.floor(rnd() * 30));
    const t2 = hhmm(tLeave + 20 + Math.floor(rnd() * 40));
    const vars = { name: p.name, place: p.secretPlace, t1, t2, initials: p.initials };
    add({ id: `e_clear_${p.id}`, title: fill(p.secret.clearTitle, vars), type: "document", importance: "supporting", icon: "receipt", source: "",
      summary: fill(p.secret.clearText, vars), detail: fill(p.secret.clearText, vars),
      timeline: [{ time: t1, text: `${p.name} arrives at ${p.secretPlace}.` }, { time: t2, text: `${p.name} leaves ${p.secretPlace}.` }] });
    add({ id: `e_secret_${p.id}`, title: fill(p.secret.secretTitle, vars), type: "document", importance: "supporting", icon: "notebook", source: "",
      summary: fill(p.secret.secretText, vars), detail: fill(p.secret.secretText, vars) });
    if (shape.perInnocent >= 3) add({ id: `e_motive_${p.id}`, title: `Grievance: ${p.name}`, type: "document", importance: "minor", icon: "warning", source: "",
      summary: `Correspondence showing ${p.name}'s grudge: ${p.role.motive.toLowerCase()}`, detail: `Letters and notes make it plain: ${p.role.motive} It gives ${p.first} a reason — but a reason is not proof.` });
    if (shape.perInnocent >= 4) add({ id: `e_corrob_${p.id}`, title: `Second Witness: ${p.first}'s Evening`, type: "document", importance: "supporting", icon: "papers", source: "",
      summary: `A second, independent witness saw ${p.name} at ${p.secretPlace} at ${hhmm(tCrime)}.`, detail: `A regular at ${p.secretPlace} is certain: ${p.name} was there at ${hhmm(tCrime)}, "looking like they didn't want to be seen".` });
    add({ id: `T_${p.id}_ALIBI`, title: `${p.first}: '${cap(p.secret.claim)}'`, type: "testimony", importance: "supporting", icon: "speech", source: p.name,
      summary: `${p.name} claims to have been ${p.secret.claim}.`, detail: `"I was ${p.secret.claim}. I didn't see anyone."`,
      timeline: [{ time: "20:00", text: `(Claim) ${p.name}: ${p.secret.claim}.` }] });
    add({ id: `T_${p.id}_TRUTH`, title: `${p.first}: the truth`, type: "testimony", importance: "supporting", icon: "speech", source: p.name,
      summary: `${p.name} admits they were really ${fill(p.secret.truth, vars)}.`, detail: `"Fine. I was ${fill(p.secret.truth, vars)}. I lied because it's nobody's business. I had nothing to do with this."` });
    if (k < shape.herrings) add({ id: `e_herring_${p.id}`, title: `${cap(herringObjects[k])} (${p.initials})`, type: "physical", importance: "minor", icon: "evidence-bag", source: pool.scene.name,
      summary: `A ${herringObjects[k]} with the initials ${p.initials}, found near the scene.`, detail: `A ${herringObjects[k]} marked ${p.initials} — ${p.name}'s. It's dusty, as if it had been lying here for days.` });
  });

  // ── 3. Locations, hotspots and unlock chain ──
  const extras = [pool.places.find((pl) => pl.kind === "security") ?? pool.places[0], ...shuffle(pool.places.filter((pl) => pl.kind !== "security"))].slice(0, shape.locations - 2);
  const locSpecs = [pool.scene, pool.police, ...extras];
  // The access log and register sit in the first extra location.
  for (const id of ["e_log", "e_registry"]) evidence.find((e) => e.id === id)!.source = extras[0].name;
  const buckets: string[][] = locSpecs.map(() => []);
  buckets[0].push("e_trace", "e_weapon", ...innocents.slice(0, shape.herrings).map((p) => `e_herring_${p.id}`));
  buckets[1].push("e_files", "e_forensic", "e_break");
  buckets[2].push("e_log", "e_registry");
  const rest = [
    "e_motive1", "e_motive2",
    ...innocents.flatMap((p) => [`e_clear_${p.id}`, `e_secret_${p.id}`, `e_motive_${p.id}`, `e_corrob_${p.id}`]).filter((id) => evidence.some((e) => e.id === id)),
  ];
  // Motive documents go to the furthest locations; everything else is spread round-robin.
  const order = locSpecs.length > 3 ? locSpecs.map((_, i) => i).slice(2).reverse() : [2, 0, 1];
  const capacity = (i: number) => SLOTS[locSpecs[i].kind].length;
  let cursor = 0;
  for (const id of rest) {
    for (let tries = 0; tries < order.length * 2; tries++) {
      const i = order[cursor % order.length]; cursor++;
      if (buckets[i].length < capacity(i)) { buckets[i].push(id); break; }
    }
  }

  const requiresFor: Record<string, HotspotDef["requires"]> = {
    e_forensic: { evidence: ["e_weapon"] },
    e_break: { evidence: ["T_C_ALIBI"] },
  };
  const locations: LocationDef[] = locSpecs.map((spec, i) => {
    const slots = SLOTS[spec.kind];
    const hotspots: HotspotDef[] = buckets[i].map((evId, j) => {
      const e = evidence.find((x) => x.id === evId)!;
      if (!e.source) e.source = spec.name;
      const [x, y, w, h] = slots[j % slots.length];
      return {
        id: `h_${evId}`, label: spotLabel(e), x, y, w, h, prop: PROP_FOR_ICON[e.icon] ?? "papers",
        subtle: evId === "e_trace" || evId === "e_motive2",
        requires: requiresFor[evId],
        description: evId === "e_forensic" ? "The lab has finished with the evidence you sent over. The report is waiting." : evId === "e_break" ? "Your colleagues have been checking everyone's accounts of the evening. One result stands out." : `You find something: ${e.summary}`,
        action: e.type === "forensic" && evId === "e_trace" ? "photograph" : "collect",
        evidence: evId,
      };
    });
    const prevIds = i >= 2 ? buckets[i - 1] : [];
    return {
      id: `loc${i}`, name: spec.name, district: spec.district, scene: spec.kind, description: spec.desc,
      mapPos: MAP_POS[i % MAP_POS.length],
      unlock: i < 2 ? undefined : i === 2 ? { anyEvidence: ["e_trace", "e_weapon", "e_files"] } : { anyEvidence: prevIds.length ? prevIds : buckets[2] },
      unlockHint: i < 2 ? "" : i === 2 ? `Examine the scene or the case files, and the trail will lead to ${spec.name}.` : `Follow up what you find at ${locSpecs[i - 1].name}.`,
      hotspots,
    };
  });

  // ── 4. Deductions ──
  const deductions: DeductionDef[] = [
    { id: "d_method", pairs: [["e_weapon", "e_forensic"]], title: "How It Was Done", text: `${method.forensic} The ${method.weapon.toLowerCase()} is the instrument.` },
    { id: "d_time", pairs: [["e_forensic", "e_log"]], title: "The Window", text: `The ${crimeWord} happened between ${hhmm(tCrime - 10)} and ${hhmm(tCrime + 10)} — exactly while ${pool.access.item} had the ${pool.access.device} open (${hhmm(tEnter)}–${hhmm(tLeave)}).` },
    { id: "d_trace", pairs: [["e_trace", "e_files"]], implicates: [C.id], title: "The Shoe Fits", text: `The print is a size ${C.size}. Of everyone questioned, only ${C.name} wears that size.` },
    { id: "d_access", pairs: [["e_log", "e_registry"]], implicates: [C.id], title: "Whose Key?", text: `${cap(pool.access.item)} — used at ${hhmm(tEnter)} and ${hhmm(tLeave)} — belongs to ${C.name}, and was never reported lost.` },
    { id: "d_alibi", pairs: [["T_C_ALIBI", "e_break"]], contradiction: true, implicates: [C.id], title: `${C.first}'s Alibi Collapses`, text: `${C.name} claims to have been ${C.claim}, but was recorded two minutes from ${pool.scene.name} at ${hhmm(tBreak)}.` },
    { id: "d_admit", pairs: [["T_C_ADMIT", "e_log"]], contradiction: true, implicates: [C.id], title: "Not Already Done", text: `${C.name} says it was already over on arrival — but nobody else entered, and ${pool.access.item} opened the ${pool.access.device} at ${hhmm(tEnter)}, before the ${crimeWord} could have happened.` },
    { id: "d_motive", pairs: [["e_motive1", "e_motive2"]], implicates: [C.id], title: "The Hidden Motive", text: `${motive.label}. ${C.name} had far more to lose than anyone knew.` },
  ];
  innocents.forEach((p, k) => {
    deductions.push({ id: `d_lie_${p.id}`, pairs: [[`T_${p.id}_ALIBI`, `e_clear_${p.id}`]], contradiction: true, title: `${p.first} Lied`, text: `${p.name} claimed to be ${p.secret.claim} — but was seen at ${p.secretPlace}.` });
    deductions.push({ id: `d_clear_${p.id}`, pairs: [[`e_clear_${p.id}`, `e_secret_${p.id}`], [`T_${p.id}_TRUTH`, `e_clear_${p.id}`]], clears: [p.id], title: `Where ${p.first} Really Was`, text: `${p.name} was ${fill(p.secret.truth, { place: p.secretPlace })} throughout the ${crimeWord}. An ugly secret — and an alibi.` });
    if (shape.perInnocent >= 4) deductions.push({ id: `d_corrob_${p.id}`, pairs: [[`e_corrob_${p.id}`, `e_clear_${p.id}`]], clears: [p.id], title: `${p.first}'s Alibi Holds`, text: `Two independent witnesses place ${p.name} at ${p.secretPlace} at the critical time.` });
    if (k < shape.herrings) deductions.push({ id: `d_herring_${p.id}`, pairs: [[`e_herring_${p.id}`, `e_clear_${p.id}`]], clears: [p.id], title: "A Planted Distraction?", text: `The dusty ${herringObjects[k]} marked ${p.initials} had lain there for days. ${p.name} was elsewhere during the ${crimeWord}.` });
  });

  // ── 5. Suspects and authored dialogue ──
  const suspects: SuspectDef[] = people.map((p) => {
    const portrait: PortraitSpec = { skin: pick(SKIN), hair: pick(HAIRS), hairColor: pick(HAIRC), outfit: pick(OUTFITS), outfitColor: pick(OUTFITC), age: p.age > 50 ? "older" : p.age < 34 ? "young" : "mid", glasses: rnd() < 0.25, beard: rnd() < 0.2 ? "stubble" : undefined, earrings: rnd() < 0.2 };
    const other = pick(people.filter((q) => q.id !== p.id));
    const common = [
      { id: "victim", label: crime === "theft" ? "What do you know about the theft?" : `Tell me about ${victimName}.`, keywords: ["victim", "know", "about", "relationship", victimName.split(" ")[0].toLowerCase(), "theft", "stolen"],
        nodes: [{ text: crime === "theft" ? `I heard about ${victimLabel} this morning, like everyone else. ${p.role.relation === "Contractor" ? "I'm just the contractor here." : "It's a disaster for all of us."}` : `${victimName} was ${victimRole}. We were — ${p.role.relation.toLowerCase()}. It was complicated.`, mood: "guarded" as const }] },
      { id: "others", label: "Who do you think did it?", keywords: ["who", "suspect", "think", "did it", "else", "anyone", "enemies"],
        nodes: [{ text: `If I were you I'd look hard at ${other.name}. ${other.role.motive}`, mood: "calm" as const }] },
      { id: "rapport", label: "This must be hard for you.", keywords: ["sorry", "hard", "difficult", "understand", "take your time"],
        nodes: [{ when: { notRevealed: ["rapport1"] }, text: "...It is. Thank you for asking.", mood: "calm" as const, trust: 10, stress: -10, reveals: ["rapport1"] }, { text: "I'm fine.", mood: "calm" as const, stress: -5 }] },
    ];
    const base = {
      id: p.id, name: p.name, age: p.age, height: p.height, profession: p.role.profession, relation: p.role.relation,
      personality: p.personality, bio: `${p.role.profession}. ${p.role.relation} of ${crime === "theft" ? "the institution" : victimName}.`, motive: p.role.motive,
      portrait, greeting: p.greeting, initial: { stress: p.stress, trust: p.trust, mood: "guarded" as const }, defaultReaction: ["I don't know anything about that.", "What does that have to do with me?", "Never seen it."],
      deflection: "Isn't working that out your job, detective?", unknown: ["Sorry?", "I don't follow."],
    };
    if (p.culprit) {
      const admit = (deflect: string): ResponseNode[] => [
        { when: { notRevealed: ["near"], minStress: 45 }, text: `...All right. I wasn't ${C.claim}. I went to ${pool.scene.name} — but when I got there it was already done. I panicked and left. That's the truth.`, mood: "shaken", stress: 10, reveals: ["near"], grants: ["T_C_ADMIT"] },
        { when: { notRevealed: ["near"] }, text: deflect, mood: "nervous", stress: 20 },
        { text: "I've told you. It was already done when I got there.", mood: "shaken" },
      ];
      return {
        ...base, alibi: `Claims to have been ${p.claim}.`,
        topics: [
          { id: "alibi", label: "Where were you last night?", keywords: ["where", "alibi", "last night", "evening", "night"],
            nodes: [{ when: { revealed: ["near"] }, text: "I went there. It was already done. I've said so.", mood: "shaken" }, { text: `I was ${p.claim}. I didn't see anyone.`, mood: "calm", grants: ["T_C_ALIBI"] }] },
          ...common,
        ],
        reactions: {
          e_break: admit(`That's... a mistake. I was ${C.claim}.`),
          e_registry: admit(`${cap(pool.access.item)}? I— lost it. Weeks ago.`),
          e_log: [{ when: { notRevealed: ["near"] }, text: "Anyone could have used it.", mood: "defensive", stress: 15 }, { text: "Yes, I used it. It was already done.", mood: "shaken" }],
          e_trace: [{ text: `Lots of people wear a ${C.size}.`, mood: "defensive", stress: 10 }],
          e_motive1: [{ text: "Where did you get that? That's private.", mood: "defensive", stress: 15 }],
          e_motive2: [{ text: "That doesn't prove anything.", mood: "defensive", stress: 15 }],
          e_weapon: [{ text: "I've never touched that.", mood: "nervous", stress: 5 }],
        },
        ai: { voice: p.personality, knows: [], hides: ["Being at the scene (until heavily pressured).", "Committing the crime — never admitted."], guarded: [{ term: "I went", unlockedBy: "near" }, { term: "I killed", unlockedBy: "__never__" }, { term: "I did it", unlockedBy: "__never__" }] },
        majorReveals: ["near"],
        truth: `${p.name} did it. ${motive.label}. Claiming to be ${p.claim}, ${p.first} let themselves in with ${pool.access.item} at ${hhmm(tEnter)}, ${method.label.toLowerCase().replace(/^./, (c) => c)} at about ${hhmm(tCrime)}, and left at ${hhmm(tLeave)}.`,
      };
    }
    const vars = { place: p.secretPlace };
    const confess: ResponseNode = { when: { notRevealed: ["truth"] }, text: `...Fine. I wasn't ${p.secret.claim}. I was ${fill(p.secret.truth, vars)}. I lied because it's nobody's business. I had nothing to do with this.`, mood: "shaken", stress: 10, trust: 5, reveals: ["truth"], grants: [`T_${p.id}_TRUTH`] };
    const reactions: Record<string, ResponseNode[]> = {
      [`e_clear_${p.id}`]: [confess, { text: "I've told you where I was.", mood: "guarded" }],
      [`e_secret_${p.id}`]: [confess, { text: "Yes. Now you know. Happy?", mood: "irritated" }],
    };
    if (evidence.some((e) => e.id === `e_motive_${p.id}`)) reactions[`e_motive_${p.id}`] = [{ text: "So I had a grievance. Half the people here did.", mood: "defensive", stress: 10 }];
    if (evidence.some((e) => e.id === `e_herring_${p.id}`)) reactions[`e_herring_${p.id}`] = [{ text: "That's mine — I lost it days ago. I wondered where it went.", mood: "nervous", stress: 5 }];
    if (p.id !== C.id) reactions.e_registry = [{ text: `${cap(pool.access.item)}? That's ${C.first}'s. Everyone knows that.`, mood: "cooperative" }];
    reactions.e_trace = [{ text: `A size ${C.size}? ${p.size > C.size ? "My feet are bigger than that" : "That's not my size"}, if that's what you're asking.`, mood: "defensive", stress: 5 }];
    reactions.e_weapon = [{ text: "God. I'd rather not look at that.", mood: "nervous", stress: 5 }];
    return {
      ...base, alibi: `Claims to have been ${p.claim}.`,
      topics: [
        { id: "alibi", label: "Where were you last night?", keywords: ["where", "alibi", "last night", "evening", "night"],
          nodes: [{ when: { revealed: ["truth"] }, text: `${cap(fill(p.secret.truth, vars))}. I've told you.`, mood: "guarded" }, { text: `I was ${p.secret.claim}. I didn't see anyone.`, mood: "calm", grants: [`T_${p.id}_ALIBI`] }] },
        ...common,
      ],
      reactions,
      ai: { voice: p.personality, knows: [], hides: [`Was really ${fill(p.secret.truth, vars)}.`], guarded: [{ term: p.secretPlace, unlockedBy: "truth" }, { term: "I killed", unlockedBy: "__never__" }] },
      majorReveals: ["truth"],
      truth: `${p.name} was ${fill(p.secret.truth, vars)} — and lied about it out of embarrassment, not guilt.`,
    };
  });

  // ── 6. Accusation options, resolution and hints ──
  const motives = shuffle([{ id: motive.id, label: motive.label }, ...MOTIVES[crime].filter((m) => m.id !== motive.id).map((m) => ({ id: m.id, label: m.label })), { id: "m_insurance", label: "Money: to collect an insurance payout" }]).slice(0, 4);
  if (!motives.some((m) => m.id === motive.id)) motives[0] = { id: motive.id, label: motive.label };
  const sequences = shuffle([
    { id: "s_key", label: "The culprit established a false alibi elsewhere, let themselves in with a key during the evening, committed the crime and left the same way." },
    { id: "s_heat", label: "An argument earlier in the evening escalated on the spot; the culprit never left the building until morning." },
    { id: "s_outsider", label: "An unknown intruder forced their way in and fled; none of the people questioned was involved." },
    { id: "s_accident", label: "It began as an accident that someone later tried to cover up." },
  ]);
  const title = pick(pool.titles);
  const code = (seed >>> 0).toString(36).slice(-4).toUpperCase();

  return {
    id: `gen-${(seed >>> 0).toString(36)}-${difficulty[0].toLowerCase()}`,
    title, subtitle: `Generated Case ${code}`, setting: pool.city, date: pool.date, difficulty,
    synopsis: crime === "theft"
      ? `${cap(pool.target ?? "A priceless item")} has vanished overnight from ${pool.scene.name}. ${nSus} people had the access — and a reason.`
      : crime === "murder"
        ? `${victimName}, ${victimRole}, is found dead in ${pool.scene.name}. ${nSus} people had reasons to want them gone.`
        : `${victimName}, ${victimRole}, has vanished from ${pool.scene.name}. ${nSus} people know more than they're saying.`,
    briefing: [
      `${pool.city}. ${pool.date}.`,
      crime === "theft" ? `Last night, ${pool.target} disappeared from ${pool.scene.name}. No alarm. No broken lock.` : crime === "murder" ? `Late last night, ${victimName} — ${victimRole} — was found dead in ${pool.scene.name}.` : `Sometime last night, ${victimName} — ${victimRole} — vanished from ${pool.scene.name} without a trace.`,
      `${nSus} people are of interest. Every one of them is hiding something. Only one of them is responsible. The scene and the case files are yours.`,
    ],
    victim: { name: crime === "theft" ? cap(pool.target ?? "The item") : victimName, age: crime === "theft" ? 0 : 30 + Math.floor(rnd() * 40), description: crime === "theft" ? `Stolen from ${pool.scene.name}.` : cap(victimRole) + "." },
    startLocations: ["loc0", "loc1"],
    locations, evidence, suspects, deductions,
    accusation: { motives, methods: METHODS[crime].map((m) => ({ id: m.id, label: m.label })), sequences },
    solution: {
      culprit: C.id, motive: motive.id, method: method.id, sequence: "s_key",
      support: { opportunity: ["e_trace", "e_files", "e_log", "e_registry", "e_break", "T_C_ALIBI", "T_C_ADMIT"], means: ["e_weapon", "e_forensic"], motive: ["e_motive1", "e_motive2"] },
      scenes: [
        { heading: "The Motive", text: `${fill(motive.doc1[1], mv)} ${fill(motive.doc2[1], mv)} ${C.name} could not let it stand.` },
        { heading: "The Alibi", time: "20:00", text: `${C.name} made sure everyone believed they were ${C.claim}.` },
        { heading: "The Key", time: hhmm(tEnter), text: `At ${hhmm(tEnter)}, ${C.first} let themselves in through the ${pool.access.device} with ${pool.access.item} — the key they would later claim to have lost.` },
        { heading: "The Crime", time: hhmm(tCrime), text: `${cap(method.label)}. The ${method.weapon.toLowerCase()} stayed behind; so did a size-${C.size} shoe print.` },
        { heading: "The Escape", time: hhmm(tLeave), text: `At ${hhmm(tLeave)}, ${C.first} left the way they came, minutes after being caught on ${pool.alibiBreak.noun} at ${hhmm(tBreak)}.` },
        { heading: "Everyone Lied", text: innocents.map((p) => `${p.name} was ${fill(p.secret.truth, { place: p.secretPlace })}.`).join(" ") },
        { heading: "The Truth", text: `${C.name} was charged. Every other lie that night was told to protect a secret — only one was told to hide a crime.` },
      ],
      timeline: [
        { time: "20:00", who: C.name, event: `Claims to be ${C.claim}.` },
        { time: hhmm(tBreak), who: C.name, event: `Recorded on ${pool.alibiBreak.noun}.` },
        { time: hhmm(tEnter), who: C.name, event: `Enters with ${pool.access.item}.` },
        { time: hhmm(tCrime), who: C.name, event: `Commits the ${crimeWord}.` },
        { time: hhmm(tLeave), who: C.name, event: "Leaves." },
      ],
    },
    hints: [
      { unless: { anyEvidence: ["e_trace", "e_weapon"] }, text: `Start at ${pool.scene.name}. Search it closely — not everything is in plain sight.` },
      { unless: { anyEvidence: innocents.map((p) => `T_${p.id}_ALIBI`).concat("T_C_ALIBI") }, text: "Get everyone's story on record. Ask each of them where they were." },
      { when: { evidence: ["e_weapon"] }, unless: { anyEvidence: ["e_forensic"] }, text: `The lab has the ${method.weapon.toLowerCase()}. Their report will be at the precinct.` },
      { when: { evidence: ["e_log"] }, unless: { deductions: ["d_access"] }, text: `Somebody used ${pool.access.item}. Find out who it belongs to.` },
      { when: { evidence: ["e_trace"] }, unless: { deductions: ["d_trace"] }, text: "That shoe print has a size. Compare it with the persons-of-interest file." },
      { unless: { anyEvidence: ["e_break"] }, text: "I'm checking everyone's account of the evening against the timeline. Results will come in at the precinct." },
      { text: "When you're ready, make your accusation: who, why, how — backed by at least three pieces of evidence." },
    ],
    generated: true,
  };
}

const MAP_POS = [{ x: 52, y: 40 }, { x: 30, y: 34 }, { x: 61, y: 47 }, { x: 78, y: 28 }, { x: 22, y: 62 }, { x: 64, y: 62 }, { x: 41, y: 17 }, { x: 85, y: 55 }];

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function spotLabel(e: EvidenceDef): string {
  const byIcon: Record<string, string> = {
    footprint: "Marks on the floor", folder: "Case folder", report: "Lab report tray", list: "Logbook", "id-card": "Key register",
    car: "Results from the canvass", papers: "Papers in a drawer", scroll: "Correspondence", receipt: "Receipts and stubs", notebook: "Private papers",
    warning: "Letters", "evidence-bag": "Object on the floor",
  };
  return byIcon[e.icon] ?? "Something worth a look";
}

export async function generateAndRegister(opts: { setting: string; difficulty: string; seed?: unknown }): Promise<CaseDef> {
  const pool = SETTINGS.find((s) => s.id === opts.setting) ?? SETTINGS[0];
  const difficulty: Difficulty = opts.difficulty === "Expert" || opts.difficulty === "Intermediate" ? opts.difficulty : "Beginner";
  const base = typeof opts.seed === "number" ? opts.seed : Math.floor(Math.random() * 2 ** 31);
  let lastErrors: string[] = [];
  for (let attempt = 0; attempt < 12; attempt++) {
    const def = buildCase(pool, difficulty, base + attempt * 7919);
    const report = await validateCase(def);
    const clues = report.stats.evidence;
    const [lo, hi] = SHAPE[difficulty].clues;
    if (report.ok && clues >= lo && clues <= hi) {
      registerGenerated(def);
      return def;
    }
    lastErrors = report.ok ? [`clue count ${clues} outside ${lo}–${hi}`] : report.errors;
  }
  console.warn("[generator] rejected all candidates:", lastErrors.slice(0, 5));
  throw new GameError("The generator couldn't produce a case that passed every consistency check. Please try again.", 500);
}
