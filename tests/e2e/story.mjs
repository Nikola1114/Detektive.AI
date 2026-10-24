/** Starts Case 001 in Story mode: watches the opening film, checks the chapter list, then gives up to see the finale film. */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.BASE || "http://localhost:8787";
const OUT = process.argv[2] || "e2e-shots";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
try {
  await page.goto(`${BASE}/#/welcome`);
  await page.getByRole("button", { name: /Start Investigation/ }).click();
  await page.getByRole("button", { name: /Story/ }).click();
  const film = page.getByRole("dialog", { name: "Story cutscene" });
  await film.waitFor();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/s1-cold-open.png` });
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("Space");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/s2-office-shot.png` });
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  await page.keyboard.press("Space");
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/s3-title.png` });
  await film.getByRole("button", { name: /Skip/ }).click();
  await film.waitFor({ state: "detached" });
  await page.getByText("Chapter 1 / 7").first().waitFor();
  await page.screenshot({ path: `${OUT}/s4-office-chapter.png` });
  // Following one objective from the checklist: the clue should point at the scene.
  await page.getByRole("button", { name: /Ask for a clue/ }).click();
  const clue = await page.locator('[role="status"] p').first().innerText();
  console.log("clue:", clue);
  await page.getByRole("button", { name: "Got it" }).click();
  // Replay works.
  await page.getByRole("button", { name: /Replay chapter scene/ }).first().click();
  await film.waitFor();
  await page.keyboard.press("Escape");
  await film.waitFor({ state: "detached" });
  // Give up: the finale plays as a film.
  await page.getByRole("button", { name: /I give up/ }).first().click();
  await page.getByRole("button", { name: /show me the solution/ }).click();
  await film.waitFor();
  await page.waitForTimeout(2000);
  await page.keyboard.press("Space");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/s5-finale.png` });
  await film.getByRole("button", { name: /Skip/ }).click();
  await page.getByText(/The killer was/).waitFor();
  await page.screenshot({ path: `${OUT}/s6-closed.png` });
  // Phone layout.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Replay the reveal" }).click();
  await film.waitFor();
  await page.waitForTimeout(2000);
  for (let k = 0; k < 7; k++) { await page.keyboard.press("Space"); await page.waitForTimeout(200); }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${OUT}/s7-finale-phone.png` });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("story e2e ok");
} finally {
  await browser.close();
}
