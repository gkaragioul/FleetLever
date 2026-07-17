import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";
import { chromium } from "playwright";

const { Pool } = pg;
const origin = process.env.FLEETLEVER_CONSOLE_URL ?? "http://127.0.0.1:3101";
const adminDatabaseUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_PUBLIC_URL;
const outputDir = path.join(process.cwd(), "artifacts", "verification");
const testId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
const email = `account-ui-${testId}@example.test`;
const password = `FleetLever!${testId}`;
const organizationName = `FleetLever UI ${testId}`;

if (!adminDatabaseUrl) throw new Error("MIGRATION_DATABASE_URL or DATABASE_PUBLIC_URL is required for account UI verification.");

await mkdir(outputDir, { recursive: true });

const pool = new Pool({
  connectionString: adminDatabaseUrl,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => {
  const detail = request.failure()?.errorText ?? "failed";
  if (!detail.includes("ERR_ABORTED")) failedRequests.push(`${request.method()} ${request.url()}: ${detail}`);
});

async function accountRecord() {
  const result = await pool.query(
    `
      select
        profile.id as profile_id,
        organization.id as organization_id,
        organization.trial_started_at,
        organization.trial_ends_at
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

async function waitForLisaIdle(panel) {
  await panel.locator('input[placeholder*="Lisa"]').waitFor({ state: "visible", timeout: 30_000 });
  await panel.locator('input[placeholder*="Lisa"]').waitFor({ state: "attached" });
  await page.waitForFunction(() => {
    const panelElement = document.querySelector("[data-lisa-panel]");
    const input = panelElement?.querySelector('input[placeholder*="Lisa"]');
    return input instanceof HTMLInputElement && !input.disabled;
  }, null, { timeout: 90_000 });
}

try {
  await page.goto(`${origin}/signup?next=/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByRole("heading", { name: "Create your workspace" }).waitFor();
  const googleControl = page.getByRole("link", { name: "Start with Google" });
  if ((await googleControl.getAttribute("aria-disabled")) !== "true") {
    throw new Error("Google sign-up unexpectedly appears enabled without deployment credentials.");
  }
  await page.getByText("Google sign-up will be available when this deployment is configured.").waitFor();
  await page.getByLabel("Full name").fill("FleetLever Test Owner");
  await page.getByLabel("Organization").fill(organizationName);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Start 15-day trial" }).click();
  await page.waitForFunction(() => window.location.pathname === "/fleet-management", null, { timeout: 90_000 });
  await page.getByText(/Trial\s*·\s*15 days left/i).waitFor({ timeout: 60_000 });

  const created = await accountRecord();
  if (!created) throw new Error("The signup did not create an account tenant.");
  const trialDuration = new Date(created.trial_ends_at).getTime() - new Date(created.trial_started_at).getTime();
  if (trialDuration !== 15 * 24 * 60 * 60 * 1000) {
    throw new Error(`Trial duration is ${trialDuration}ms instead of exactly 15 days.`);
  }
  const initialTrialStart = new Date(created.trial_started_at).toISOString();
  const initialTrialEnd = new Date(created.trial_ends_at).toISOString();
  await page.screenshot({ path: path.join(outputDir, "account-trial-console.png"), fullPage: true, animations: "disabled" });

  const health = await page.evaluate(async () => {
    const response = await fetch("/api/fleetlever/lisa/health", { cache: "no-store" });
    return { ok: response.ok, body: await response.json() };
  });
  if (!health.ok || health.body.status !== "connected") throw new Error(`Lisa health is not connected: ${JSON.stringify(health)}`);

  await page.locator('button[aria-label*="Lisa"]').first().click();
  const lisaPanel = page.locator("[data-lisa-panel]");
  await lisaPanel.waitFor({ state: "visible" });
  await waitForLisaIdle(lisaPanel);
  const lisaInput = lisaPanel.locator('input[placeholder*="Lisa"]');
  await lisaInput.fill("Take me to Settings and briefly tell me where to add a custom field.");
  await lisaPanel.locator('button[type="submit"]').click();
  const navigationAction = lisaPanel.locator("button.mt-3").last();
  await navigationAction.waitFor({ state: "visible", timeout: 120_000 });
  const lisaAnswer = await navigationAction.locator("..").textContent();
  if (!lisaAnswer || !/Settings|Ρυθμίσεις/i.test(lisaAnswer)) throw new Error(`Lisa did not ground the answer in Settings: ${lisaAnswer ?? "empty"}`);
  await navigationAction.click();
  await page.getByRole("heading", { name: "Settings" }).waitFor({ timeout: 30_000 });
  await page.screenshot({ path: path.join(outputDir, "account-lisa-settings.png"), fullPage: true, animations: "disabled" });

  const logoutStatus = await page.evaluate(async () => (await fetch("/api/auth/logout", { method: "POST" })).status);
  if (logoutStatus !== 200) throw new Error(`Logout returned ${logoutStatus}.`);
  await page.goto(`${origin}/login?next=/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForFunction(() => window.location.pathname === "/fleet-management", null, { timeout: 90_000 });
  await page.getByText(/Trial\s*·\s*15 days left/i).waitFor({ timeout: 60_000 });
  const afterLogin = await accountRecord();
  if (!afterLogin) throw new Error("Account disappeared after login.");
  if (new Date(afterLogin.trial_started_at).toISOString() !== initialTrialStart || new Date(afterLogin.trial_ends_at).toISOString() !== initialTrialEnd) {
    throw new Error("Signing in restarted or changed the immutable trial window.");
  }

  const unavailablePage = await context.newPage();
  await unavailablePage.route("**/api/fleetlever/lisa/health", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ status: "unavailable", detail: "The local Codex companion is offline." }),
  }));
  await unavailablePage.route("**/api/fleetlever/lisa/chat", (route) => route.fulfill({
    status: 503,
    contentType: "application/json",
    body: JSON.stringify({ status: "unavailable", detail: "The local Codex companion is offline." }),
  }));
  await unavailablePage.goto(`${origin}/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await unavailablePage.locator('button[aria-label*="Lisa"]').first().click();
  const unavailablePanel = unavailablePage.locator("[data-lisa-panel]");
  await unavailablePanel.waitFor({ state: "visible" });
  await unavailablePanel.locator('input[placeholder*="Lisa"]').waitFor();
  await unavailablePage.waitForFunction(() => {
    const input = document.querySelector('[data-lisa-panel] input[placeholder*="Lisa"]');
    return input instanceof HTMLInputElement && input.disabled;
  });
  const unavailableText = await unavailablePanel.textContent();
  if (!unavailableText || !/δεν είναι συνδεδεμένος|not connected|offline/i.test(unavailableText)) {
    throw new Error("Lisa did not explain that the local companion is unavailable.");
  }
  await unavailablePage.screenshot({ path: path.join(outputDir, "account-lisa-unavailable.png"), fullPage: true, animations: "disabled" });
  await unavailablePage.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/fleet-management`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (mobileOverflow > 1) throw new Error(`Authenticated mobile console overflows horizontally by ${mobileOverflow}px.`);
  await page.screenshot({ path: path.join(outputDir, "account-console-mobile.png"), fullPage: true, animations: "disabled" });

  if (consoleErrors.length) throw new Error(`Browser console errors: ${consoleErrors.join(" | ")}`);
  if (failedRequests.length) throw new Error(`Failed browser requests: ${failedRequests.join(" | ")}`);
  console.log(`PASS account + trial + Lisa UI: ${email}`);
} catch (error) {
  await page.screenshot({ path: path.join(outputDir, "account-lisa-failure.png"), fullPage: true, animations: "disabled" }).catch(() => {});
  throw error;
} finally {
  const record = await accountRecord().catch(() => null);
  if (record) {
    await pool.query("delete from public.organizations where id = $1", [record.organization_id]);
    await pool.query("delete from public.profiles where id = $1", [record.profile_id]);
  }
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await pool.end().catch(() => {});
}
