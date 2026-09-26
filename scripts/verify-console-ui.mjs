import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.FLEETLEVER_CONSOLE_URL ?? "http://127.0.0.1:3001";
const outputDir = path.join(process.cwd(), "artifacts", "verification");
const screenshotPath = path.join(outputDir, "console-b2b.png");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(`${origin}/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  // The console renders some CR-04 labels in collapsed or responsive-only regions; wait for a visible one.
  await page.getByText("CR-04", { exact: true }).filter({ visible: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await page.waitForTimeout(500);

  const text = await page.locator("body").innerText();
  const overlay = await page.locator("[data-nextjs-dialog], #nextjs__container_errors_desc").count();
  // The console is English since v0.13.0; the discontinued municipal edition must not reappear.
  const required = ["FleetLever", "CR-04", "Metro line extension", "Work packages"];
  const forbidden = ["Δήμος Ελληνικού", "Υπηρεσίες πόλης", "Διαχειριστής δημοτικού στόλου", "Elliniko", "Argyroupoli"];
  const failures = [];

  for (const token of required) {
    if (!text.includes(token)) failures.push(`missing visible token: ${token}`);
  }

  for (const token of forbidden) {
    if (text.includes(token)) failures.push(`municipal token leaked into console: ${token}`);
  }

  if (overlay > 0) failures.push("Next.js error overlay is visible");
  if (consoleErrors.length > 0) failures.push(`browser console errors: ${consoleErrors.join(" | ")}`);

  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled", caret: "initial" });

  if (failures.length > 0) {
    console.error(`FAIL standalone console UI\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS standalone console UI: ${screenshotPath}`);
  }
} finally {
  await browser.close();
}
