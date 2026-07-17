import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { chromium } from "playwright";

const { Pool } = pg;
const origin = process.env.FLEETLEVER_CONSOLE_URL ?? "http://127.0.0.1:3001";
const adminDatabaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
const outputDir = path.join(process.cwd(), "artifacts", "verification");
const testId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const email = `customization-ui-${testId}@example.test`;
const password = `FleetLever!${testId}`;
const organizationName = `Customization UI ${testId}`;

if (!adminDatabaseUrl) throw new Error("MIGRATION_DATABASE_URL or DATABASE_PUBLIC_URL is required for customization UI verification.");

await mkdir(outputDir, { recursive: true });

const pool = new Pool({
  connectionString: adminDatabaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];
const consoleStateWrites = [];
const consoleStateReads = [];
let verificationPhase = "boot";

async function waitForConsoleHydration(targetPage) {
  await targetPage.waitForFunction(
    () => [...document.querySelectorAll('nav[aria-label="App navigation"] button')]
      .some((button) => Object.keys(button).some((key) => key.startsWith("__reactProps$"))),
    null,
    { timeout: 60_000 },
  );
}

async function waitForPersistedCustomization(targetPage) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const persisted = await targetPage.evaluate(async () => {
      const response = await fetch("/api/fleetlever/console-state", { cache: "no-store" });
      if (!response.ok) return false;
      const payload = await response.json();
      const snapshot = payload.snapshot;
      const batteryField = snapshot?.customFieldDefinitions?.find((field) => field.name === "Battery level");
      const machine = snapshot?.machines?.find((item) => item.code === "CR-04");
      return Boolean(snapshot?.branding?.logo && batteryField && machine?.customFields?.[batteryField.id] === 76);
    });
    if (persisted) return;
    await targetPage.waitForTimeout(250);
  }
  throw new Error(`Customization did not reach the organization snapshot within 60 seconds. Reads: ${JSON.stringify(consoleStateReads)} Writes: ${JSON.stringify(consoleStateWrites)} Failed: ${JSON.stringify(failedRequests)}`);
}

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => {
  const errorText = request.failure()?.errorText ?? "failed";
  if (errorText.includes("ERR_ABORTED")) return;
  failedRequests.push(`${request.method()} ${request.url()}: ${errorText}`);
});
page.on("request", (request) => {
  if (request.method() !== "PUT" || !request.url().endsWith("/api/fleetlever/console-state")) return;
  const body = request.postDataJSON();
  const batteryField = body?.customFieldDefinitions?.find((field) => field.name === "Battery level");
  const machine = body?.machines?.find((item) => item.code === "CR-04");
  consoleStateWrites.push({
    phase: verificationPhase,
    batteryFields: body?.customFieldDefinitions?.filter((field) => field.name === "Battery level").length ?? 0,
    hasLogo: Boolean(body?.branding?.logo),
    machineCount: body?.machines?.length ?? 0,
    batteryValue: batteryField ? machine?.customFields?.[batteryField.id] : null,
  });
});
page.on("response", async (response) => {
  if (response.request().method() === "PUT" && response.url().endsWith("/api/fleetlever/console-state")) {
    consoleStateWrites.push({ phase: `${verificationPhase}:response`, status: response.status() });
    return;
  }
  if (response.request().method() !== "GET" || !response.url().endsWith("/api/fleetlever/console-state")) return;
  const body = await response.json().catch(() => null);
  const batteryField = body?.snapshot?.customFieldDefinitions?.find((field) => field.name === "Battery level");
  const machine = body?.snapshot?.machines?.find((item) => item.code === "CR-04");
  consoleStateReads.push({
    phase: verificationPhase,
    dataSource: body?.dataSource ?? null,
    schemaVersion: body?.snapshot?.schemaVersion ?? null,
    batteryFields: body?.snapshot?.customFieldDefinitions?.filter((field) => field.name === "Battery level").length ?? 0,
    hasLogo: Boolean(body?.snapshot?.branding?.logo),
    machineCount: body?.snapshot?.machines?.length ?? 0,
    batteryValue: batteryField ? machine?.customFields?.[batteryField.id] : null,
  });
});

async function accountRecord() {
  const result = await pool.query(
    `
      select profile.id as profile_id, organization.id as organization_id
      from public.profiles profile
      join public.organization_members member on member.profile_id = profile.id
      join public.organizations organization on organization.id = member.organization_id
      where profile.email = $1::citext
      limit 1
    `,
    [email],
  );
  return result.rows[0] ?? null;
}

try {
  await page.goto(`${origin}/signup?next=/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByRole("heading", { name: "Create your workspace" }).waitFor();
  await page.getByLabel("Full name").fill("FleetLever Customization Owner");
  await page.getByLabel("Organization").fill(organizationName);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Start 15-day trial" }).click();
  await page.waitForFunction(() => window.location.pathname === "/fleet-management", null, { timeout: 90_000 });
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
  await page.getByRole("button", { name: "Columns" }).click();
  let batteryControl = page.locator("[data-column-control]", { hasText: "Battery level" }).first();
  await batteryControl.waitFor();
  await batteryControl.locator('input[type="range"]').fill("260");
  batteryControl = page.locator("[data-column-control]", { hasText: "Battery level" }).first();
  await batteryControl.waitFor();
  await batteryControl.getByRole("button", { name: "Move Battery level left" }).click();
  await page.getByRole("button", { name: "Columns" }).click();
  const headingsAfterReorder = await page.locator("thead th").allTextContents();
  if (headingsAfterReorder.indexOf("Battery level") >= headingsAfterReorder.indexOf("Owner")) {
    throw new Error("Battery level column did not move before Owner.");
  }
  const batteryWidth = await page.getByRole("columnheader", { name: "Battery level" }).evaluate((element) => getComputedStyle(element).width);
  if (Number.parseFloat(batteryWidth) < 240) throw new Error(`Battery level column width did not update: ${batteryWidth}.`);
  const batteryInput = page.locator("tbody tr", { hasText: "CR-04" }).locator('input[type="number"]');
  await batteryInput.fill("76");
  await waitForPersistedCustomization(page);
  verificationPhase = "post-customization-reload";
  await page.reload({ waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByText("CR-04", { exact: true }).first().waitFor({ state: "visible", timeout: 60_000 });
  await waitForConsoleHydration(page);
  const persistedAfterReload = await page.evaluate(async () => {
    const response = await fetch("/api/fleetlever/console-state", { cache: "no-store" });
    const payload = await response.json();
    const batteryField = payload.snapshot?.customFieldDefinitions?.find((field) => field.name === "Battery level");
    const machine = payload.snapshot?.machines?.find((item) => item.code === "CR-04");
    return {
      batteryValue: batteryField ? machine?.customFields?.[batteryField.id] : null,
      hasLogo: Boolean(payload.snapshot?.branding?.logo),
    };
  });
  if (!persistedAfterReload.hasLogo) throw new Error(`The persisted logo disappeared from the server after reload. Reads: ${JSON.stringify(consoleStateReads)} Writes: ${JSON.stringify(consoleStateWrites)}`);
  if (persistedAfterReload.batteryValue !== 76) throw new Error(`The server lost CR-04's battery value after reload: ${JSON.stringify(persistedAfterReload)}. Reads: ${JSON.stringify(consoleStateReads)} Writes: ${JSON.stringify(consoleStateWrites)}`);
  await page.getByRole("button", { name: "Ρυθμίσεις" }).click();
  await page.getByRole("heading", { name: "Settings" }).waitFor();
  await page.getByAltText("Company logo preview").waitFor();
  await page.getByRole("button", { name: "Οχήματα" }).click();
  await page.getByRole("columnheader", { name: "Battery level" }).waitFor();
  const persistedValue = await page.locator("tbody tr", { hasText: "CR-04" }).locator('input[type="number"]').inputValue();
  if (persistedValue !== "76") throw new Error(`Battery level did not persist; received ${JSON.stringify(persistedValue)}. Reads: ${JSON.stringify(consoleStateReads)} Writes: ${JSON.stringify(consoleStateWrites)}`);

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
  const record = await accountRecord().catch(() => null);
  if (record) {
    await pool.query("delete from public.organizations where id = $1", [record.organization_id]);
    await pool.query("delete from public.profiles where id = $1", [record.profile_id]);
  }
  await context.close();
  await browser.close();
  await pool.end();
}
