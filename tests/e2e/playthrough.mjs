/**
 * End-to-end acceptance run: plays Case 001 from the welcome screen to the
 * case resolution through the real UI, checks persistence across a reload,
 * and saves screenshots. Usage (server must be running on BASE):
 *   node tests/e2e/playthrough.mjs [outDir]
 */
import { createRequire } from "node:module";
// Uses the globally provided Playwright (require honours NODE_PATH; ESM import does not).
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE || "http://localhost:8787";
const OUT = process.argv[2] || "e2e-shots";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

let shot = 0;
const snap = async (name) => page.screenshot({ path: `${OUT}/${String(++shot).padStart(2, "0")}-${name}.png` });
const step = (msg) => console.log(`• ${msg}`);
const settle = () => page.waitForTimeout(350);
const caseState = () => page.evaluate(async () => {
  const r = await fetch("/api/cases/case-001/state", { headers: { Authorization: `Bearer ${localStorage.getItem("dai.token")}` } });
  return (await r.json()).state;
});
const assert = (cond, msg) => { if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`); };

async function sweepLocation(id) {
  await page.goto(`${BASE}/#/scene/${id}`);
  await page.waitForSelector('aside[aria-label="Points of interest"] li button');
  await settle();
  const search = page.getByRole("button", { name: /Search closely/ });
  if (await search.count()) await search.click();
  await settle();
  const items = page.locator('aside[aria-label="Points of interest"] li button');
  const n = await items.count();
  for (let i = 0; i < n; i++) {
    const label = (await items.nth(i).innerText()).trim();
    await items.nth(i).click();
    await page.locator(`[role="dialog"][aria-label="Inspecting ${label}"]`).waitFor();
    await page.waitForTimeout(250);
    const collect = page.getByRole("button", { name: "Collect evidence" });
    const photo = page.getByRole("button", { name: "Photograph & log" });
    if (await collect.count() && await collect.isEnabled()) { await collect.click(); await settle(); }
    else if (await photo.count() && await photo.isEnabled()) { await photo.click(); await settle(); }
  }
}

async function ask(suspectId, labels) {
  await page.goto(`${BASE}/#/interrogate/${suspectId}`);
  await page.waitForSelector('section[aria-label^="Interview with"]');
  for (const label of labels) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await page.waitForTimeout(550);
  }
}

async function present(suspectId, titles) {
  await page.goto(`${BASE}/#/interrogate/${suspectId}`);
  await page.waitForSelector('section[aria-label^="Interview with"]');
  for (const title of titles) {
    await page.getByRole("button", { name: /Present evidence/ }).click();
    await page.locator('[role="dialog"] button', { hasText: title }).first().click();
    await page.waitForTimeout(600);
  }
}

async function link(a, b) {
  const sa = page.locator("#la"); const sb = page.locator("#lb");
  await sa.selectOption({ label: a });
  await sb.selectOption({ label: b });
  await page.getByRole("button", { name: "Connect", exact: true }).click();
  await page.waitForTimeout(500);
}

async function pinAll() {
  await page.goto(`${BASE}/#/board`);
  await page.waitForSelector('aside[aria-label="Evidence tray"]');
  for (;;) {
    const pins = page.locator('aside[aria-label="Evidence tray"] button:has(svg.lucide-pin)');
    if (!(await pins.count())) break;
    await pins.first().click();
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(900);
}

try {
  step("Welcome screen");
  await page.goto(BASE);
  await page.getByRole("button", { name: /Start Investigation/ }).waitFor();
  await snap("welcome");

  step("Start Case 001 → briefing");
  await page.getByRole("button", { name: /Start Investigation/ }).click();
  await page.getByRole("dialog").waitFor();
  await page.waitForTimeout(3200);
  await snap("briefing");
  await page.getByRole("button", { name: /Go to the crime scene/ }).click();
  await page.waitForSelector('aside[aria-label="Points of interest"] li button');
  await settle();
  await snap("crime-scene");

  step("Inspect the broken watch");
  await page.locator('aside[aria-label="Points of interest"] li button', { hasText: "Wristwatch" }).click();
  await page.waitForSelector('[role="dialog"][aria-label^="Inspecting"]');
  await snap("inspect-watch");

  step("Sweep the crime scene, precinct and security office");
  await sweepLocation("office");
  await snap("crime-scene-searched");
  await sweepLocation("police");
  await snap("police");
  await sweepLocation("security");

  step("Refresh persistence check");
  const before = await caseState();
  await page.reload();
  await page.waitForTimeout(800);
  const after = await caseState();
  assert(after.cluesFound === before.cluesFound && before.cluesFound >= 18, `clues persisted (${before.cluesFound} → ${after.cluesFound})`);

  step("Interview every suspect");
  await ask("evelyn", ["Where were you last night?", "Tell me about the divorce."]);
  await ask("marcus", ["Where were you last night?", "How are the company finances?"]);
  await ask("adrian", ["Where were you last night?", "You were a cop, weren't you?"]);
  await ask("oliver", ["Where were you last night?", "What is your story about?"]);
  await ask("sofia", ["Where were you last night?", "Do you have a keycard to his office?", "When did you last hear from him?"]);
  await snap("interrogation-sofia");

  step("Presenting evidence changes dialogue (Marcus + garage log)");
  await present("marcus", ["Parking Garage Log"]);
  const m = (await caseState()).suspects.find((s) => s.id === "marcus");
  assert(m.history.at(-1).text.includes("I came back"), "Marcus admits returning when shown the garage log");
  await snap("interrogation-marcus-admission");

  step("Free-text question");
  await page.getByLabel("Ask a question").fill("Who was on Daniel's calendar for last night?");
  await page.getByRole("button", { name: "Ask" }).click();
  await page.waitForTimeout(800);

  step("Visit the rest of the city");
  await page.goto(`${BASE}/#/map`);
  await page.waitForTimeout(600);
  await snap("map");
  await sweepLocation("police"); // VPN log is now available
  for (const id of ["penthouse", "bar", "newsroom"]) await sweepLocation(id);
  await snap("bar");

  step("Evidence board: pin and link");
  await pinAll();
  await link("42nd Floor Access Log", "Keycard Registry");
  await link("Broken Wristwatch", "Mercer's Computer");
  await link("Service Dock Footage", "Suspect Dossiers");
  await link("Lumen VPN Log", "Sofia: 'Home all evening'");
  await link("Mercer's Laptop (Message Sync)", "Private Investigator's Dossier");
  await link("Auto-Locking Office Door", "42nd Floor Access Log");
  await link("Parking Garage Log", "Marcus: 'Left at 21:30'");
  await link("Whiskey Glass", "Prescription Bottle");
  await page.waitForTimeout(500);
  await snap("board");
  let st = await caseState();
  assert(st.deductions.length >= 8, `deductions recognised (${st.deductions.length})`);
  assert(st.board.connections.length >= 8, "connections persisted on the board");

  step("Warrant: search the Carver Street flat");
  assert(st.locations.find((l) => l.id === "flat").unlocked, "flat unlocked by deductions");
  await sweepLocation("police"); // lab report + cab record
  await sweepLocation("flat");
  await snap("flat");

  step("Notebook & timeline");
  await page.goto(`${BASE}/#/notebook`);
  await page.getByRole("tab", { name: /Timeline/ }).click();
  await page.waitForTimeout(400);
  await snap("notebook-timeline");

  step("Office hub");
  await page.goto(`${BASE}/#/office`);
  await page.waitForTimeout(700);
  await snap("office");

  step("Incorrect accusation first (Marcus)");
  await page.goto(`${BASE}/#/accuse`);
  await page.getByRole("button", { name: /Marcus Reed/ }).click();
  for (const [label] of [["Self-preservation"], ["Struck him on the head"], ["A single visitor argued"]]) {
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: new RegExp(label) }).click();
  }
  await page.getByRole("button", { name: "Next" }).click();
  for (const t of ["Broken Wristwatch", "Torn Cufflink", "Parking Garage Log"]) await page.locator("button", { hasText: t }).first().click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: /Submit accusation/ }).click();
  await page.getByText("Incorrect Accusation").first().waitFor();
  await snap("verdict-incorrect");
  await page.getByRole("button", { name: /Return to the investigation/ }).click();
  await page.getByRole("button", { name: /Continue Investigation/ }).waitFor();

  step("Correct accusation (Sofia)");
  await page.goto(`${BASE}/#/accuse`);
  await page.getByRole("button", { name: /Culprit/ }).click();
  await page.getByRole("button", { name: /Sofia Bennett/ }).click();
  for (const label of ["Revenge and exposure", "Struck him on the head", "An earlier visitor fought"]) {
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: new RegExp(label) }).click();
  }
  await page.getByRole("button", { name: "Next" }).click();
  for (const t of ["Broken Wristwatch", "Torn Cufflink", "Parking Garage Log"]) {
    const b = page.locator("button[aria-pressed='true']", { hasText: t });
    if (await b.count()) await b.first().click(); // clear the previous (rejected) selection
  }
  for (const t of ["42nd Floor Access Log", "Keycard Registry", "Lab Report: Crystal Lighthouse", "Mercer's Laptop (Message Sync)"]) await page.locator("button", { hasText: t }).first().click();
  await page.getByRole("button", { name: "Next" }).click();
  await snap("accusation-review");
  await page.getByRole("button", { name: /Submit accusation/ }).click();
  await page.getByText("Case Solved").first().waitFor();
  await snap("verdict-solved");

  step("Resolution sequence");
  await page.getByRole("button", { name: /See what really happened/ }).click();
  await page.waitForTimeout(1200);
  await snap("resolution-scene");
  await page.getByRole("button", { name: /Skip/ }).click();
  await page.waitForTimeout(800);
  await snap("resolution-summary");
  st = await caseState();
  assert(st.status === "solved", "case solved");

  step("Profile");
  await page.goto(`${BASE}/#/profile`);
  await page.waitForTimeout(500);
  await snap("profile");
  await page.goto(`${BASE}/#/settings`);
  await page.waitForTimeout(400);
  await snap("settings");
  await page.goto(`${BASE}/#/cases`);
  await page.waitForTimeout(500);
  await snap("cases");

  step("Mobile layout");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/#/office`);
  await page.waitForTimeout(600);
  await snap("mobile-office");
  await page.goto(`${BASE}/#/scene/office`);
  await page.waitForTimeout(700);
  await snap("mobile-scene");
  await page.goto(`${BASE}/#/interrogate/sofia`);
  await page.waitForTimeout(600);
  await snap("mobile-interrogation");

  if (errors.length) { console.log("Console errors:\n" + errors.join("\n")); process.exitCode = 1; }
  else console.log("✓ Full playthrough passed with no console errors");
} catch (e) {
  await snap("FAILURE");
  console.error(e);
  if (errors.length) console.log("Console errors:\n" + errors.join("\n"));
  process.exitCode = 1;
} finally {
  await browser.close();
}
