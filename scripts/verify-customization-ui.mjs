import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.FLEETLEVER_CONSOLE_URL ?? "http://127.0.0.1:3001";
const outputDir = path.join(process.cwd(), "artifacts", "verification");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];

async function waitForConsoleHydration(targetPage) {
  await targetPage.waitForFunction(
    () => [...document.querySelectorAll('nav[aria-label="App navigation"] button')]
      .some((button) => Object.keys(button).some((key) => key.startsWith("__reactProps$"))),
    null,
    { timeout: 60_000 },
  );
}

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => {
  const errorText = request.failure()?.errorText ?? "failed";
  if (errorText.includes("ERR_ABORTED")) return;
  failedRequests.push(`${request.method()} ${request.url()}: ${errorText}`);
});

try {
  await page.goto(`${origin}/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByText("CR-04", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForConsoleHydration(page);

  const resetStatus = await page.evaluate(async () => {
    const response = await fetch("/api/fleetlever/console-state", { method: "DELETE" });
    window.localStorage.clear();
    return response.status;
  });
  if (resetStatus !== 204) throw new Error(`Console reset failed with ${resetStatus}.`);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByText("CR-04", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForConsoleHydration(page);

  await page.getByRole("button", { name: "Ρυθμίσεις" }).click();
  await page.getByRole("heading", { name: "Settings" }).waitFor();
  await page.locator("#brand-logo").setInputFiles(path.join(process.cwd(), "public", "municipal", "elliniko-argyroupoli-mark.png"));
  const cropDialog = page.getByRole("dialog", { name: "Crop brand image" });
  await cropDialog.waitFor();
  await cropDialog.locator('input[type="range"]').fill("1.2");
  const cropPreview = cropDialog.getByAltText("Brand preview").locator("..");
  const cropBounds = await cropPreview.boundingBox();
  if (!cropBounds) throw new Error("Brand crop preview is not measurable.");
  await page.mouse.move(cropBounds.x + cropBounds.width * 0.5, cropBounds.y + cropBounds.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(cropBounds.x + cropBounds.width * 0.6, cropBounds.y + cropBounds.height * 0.55, { steps: 5 });
  await page.mouse.up();
  await cropDialog.getByRole("button", { name: "Use image" }).click();
  await page.getByAltText("Company logo preview").waitFor();
  await page.getByRole("button", { name: "Add Battery level" }).click();
  await page.getByText("Battery level", { exact: true }).first().waitFor();
  await page.screenshot({ path: path.join(outputDir, "console-customization-settings.png"), fullPage: true, animations: "disabled" });

  await page.getByRole("button", { name: "Οχήματα" }).click();
  await page.getByRole("columnheader", { name: "Battery level" }).waitFor();
  const batteryInput = page.locator('tbody input[type="number"]').first();
  await batteryInput.fill("76");
  await page.waitForTimeout(1_200);
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByText("CR-04", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForConsoleHydration(page);
  await page.getByRole("button", { name: "Ρυθμίσεις" }).click();
  await page.getByAltText("Company logo preview").waitFor();
  await page.getByRole("button", { name: "Οχήματα" }).click();
  await page.getByRole("columnheader", { name: "Battery level" }).waitFor();
  const persistedValue = await page.locator('tbody input[type="number"]').first().inputValue();
  if (persistedValue !== "76") throw new Error(`Battery level did not persist; received ${JSON.stringify(persistedValue)}.`);

  await page.getByRole("button", { name: "Εξαγωγή λίστας οχημάτων" }).click();
  const csvDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "CSV", exact: true }).click();
  const csvDownload = await csvDownloadEvent;
  const csvPath = await csvDownload.path();
  const csv = csvPath ? await readFile(csvPath, "utf8") : "";
  if (!csv.includes("Battery level") || !csv.includes("76")) throw new Error("CSV export does not contain the custom heading and value.");

  await page.getByRole("button", { name: "Εξαγωγή λίστας οχημάτων" }).click();
  const xlsxDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "XLSX", exact: true }).click();
  const xlsxDownload = await xlsxDownloadEvent;
  const xlsxPath = await xlsxDownload.path();
  const xlsx = xlsxPath ? await readFile(xlsxPath) : Buffer.alloc(0);
  if (xlsx.length < 500 || xlsx[0] !== 0x50 || xlsx[1] !== 0x4b) throw new Error("XLSX export is not a valid Office ZIP package.");
  if (!xlsx.includes(Buffer.from("Battery level")) || !xlsx.includes(Buffer.from("76"))) throw new Error("XLSX export does not contain the custom heading and value.");

  await page.getByRole("columnheader", { name: "Battery level" }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(outputDir, "console-customization-assets.png"), fullPage: true, animations: "disabled" });

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(`${origin}/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await mobile.getByText("CR-04", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForConsoleHydration(mobile);
  await mobile.getByRole("button", { name: "Άνοιγμα πλοήγησης" }).click();
  await mobile.getByRole("button", { name: "Οχήματα" }).click();
  const mobileCustomCard = mobile.locator("article", { hasText: "Battery level" }).first();
  await mobileCustomCard.waitFor();
  await mobileCustomCard.scrollIntoViewIfNeeded();
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Mobile customization layout overflows horizontally by ${overflow}px.`);
  await mobile.screenshot({ path: path.join(outputDir, "console-customization-mobile.png"), fullPage: true, animations: "disabled" });

  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(" | ")}`);
  if (failedRequests.length) throw new Error(`Failed requests: ${failedRequests.join(" | ")}`);
  console.log(`PASS customization UI: ${outputDir}`);
} finally {
  try {
    await page.evaluate(async () => {
      const response = await fetch("/api/fleetlever/console-state", { method: "DELETE" });
      window.localStorage.clear();
      if (response.status !== 204) throw new Error(`Console reset failed with ${response.status}.`);
    });
  } catch (error) {
    console.error(`Customization UI cleanup failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
  await context.close();
  await browser.close();
}
