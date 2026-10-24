/** Generates a case through the UI, opens it and explores the first location. */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.BASE || "http://localhost:8787";
const OUT = process.argv[2] || "e2e-shots";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
try {
  await page.goto(`${BASE}/#/cases`);
  await page.getByText("Art museum theft").click();
  await page.getByText("Intermediate", { exact: true }).click();
  await page.screenshot({ path: `${OUT}/g1-generator.png` });
  await page.getByRole("button", { name: /Generate case/ }).click();
  await page.getByRole("dialog").waitFor({ timeout: 30000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/g2-briefing.png` });
  await page.getByRole("button", { name: /Go to the crime scene/ }).click();
  await page.waitForSelector('aside[aria-label="Points of interest"] li button');
  await page.getByRole("button", { name: /Search closely/ }).click();
  await page.waitForTimeout(500);
  const items = page.locator('aside[aria-label="Points of interest"] li button');
  for (let i = 0; i < await items.count(); i++) {
    const label = (await items.nth(i).innerText()).trim();
    await items.nth(i).click();
    await page.locator(`[role="dialog"][aria-label="Inspecting ${label}"]`).waitFor();
    const collect = page.getByRole("button", { name: "Collect evidence" });
    const photo = page.getByRole("button", { name: "Photograph & log" });
    if (await collect.count() && await collect.isEnabled()) await collect.click();
    else if (await photo.count() && await photo.isEnabled()) await photo.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${OUT}/g3-scene.png` });
  await page.goto(`${BASE}/#/interrogate`);
  await page.locator('aside[aria-label="Suspects"] button').first().click();
  await page.getByRole("button", { name: "Where were you last night?", exact: true }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/g4-interrogation.png` });
  await page.goto(`${BASE}/#/map`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/g5-map.png` });
  console.log(errors.length ? "Console errors:\n" + errors.join("\n") : "✓ Generated case playable with no console errors");
  if (errors.length) process.exitCode = 1;
} catch (e) { console.error(e); await page.screenshot({ path: `${OUT}/g-FAILURE.png` }); process.exitCode = 1; }
finally { await browser.close(); }
