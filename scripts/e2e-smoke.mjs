import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

const TAB_LABELS = [
  "Κέντρο στόλου",
  "Πάγια",
  "Έγγραφα",
  "Συμμόρφωση",
  "Συντήρηση",
  "Βλάβες",
  "Χειριστές",
  "Ημερολόγιο",
  "Αναφορές",
];

const MODAL_CHECKS = [
  { tab: "Πάγια", button: /Νέο πάγιο/ },
  { tab: "Έγγραφα", button: /Ανέβασμα εγγράφου/ },
  { tab: "Συμμόρφωση", button: /Νέος κανόνας/ },
  { tab: "Συντήρηση", button: /Νέα εργασία/ },
  { tab: "Βλάβες", button: /Νέα βλάβη/ },
  { tab: "Χειριστές", button: /Νέος χειριστής/ },
];

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

async function waitForServer(url) {
  const deadline = Date.now() + 45_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}${lastError ? `: ${lastError.message}` : ""}`);
}

async function startServer() {
  if (process.env.E2E_BASE_URL) {
    return { url: process.env.E2E_BASE_URL, stop: () => {} };
  }

  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn("npm", ["run", "start", "--", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    log += chunk.toString();
  });

  await waitForServer(url).catch((error) => {
    child.kill("SIGTERM");
    throw new Error(`${error.message}\n\nNext output:\n${log.slice(-4000)}`);
  });

  return {
    url,
    stop: () => child.kill("SIGTERM"),
  };
}

async function openTab(page, label) {
  await page.getByRole("tab", { name: label }).first().click();
  await page.waitForTimeout(120);
}

async function closeDialog(page) {
  await page.getByRole("button", { name: /^Κλείσιμο/ }).last().click();
  await page.getByRole("dialog").waitFor({ state: "detached", timeout: 5000 });
}

async function healthStatus(baseUrl) {
  const response = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
  const body = await response.json().catch(() => ({}));

  return {
    ok: response.ok && body.ok === true,
    status: response.status,
    body,
  };
}

async function assertOneHeading(page, label) {
  const visibleCount = await page.locator("h1").evaluateAll((headings) =>
    headings.filter((heading) => {
      const style = window.getComputedStyle(heading);
      const rect = heading.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }).length,
  );

  if (visibleCount !== 1) {
    throw new Error(`${label}: expected one visible h1, found ${visibleCount}`);
  }
}

async function assertNoConsoleErrors(page, failures) {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  return () => {
    if (consoleErrors.length) {
      failures.push(`Console errors:\n${consoleErrors.join("\n")}`);
    }
  };
}

async function exerciseModals(page) {
  for (const check of MODAL_CHECKS) {
    await openTab(page, check.tab);
    await page.getByRole("button", { name: check.button }).first().click();
    await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
    await closeDialog(page);
  }
}

async function exerciseOperationalControls(page) {
  await page.getByRole("button", { name: /Ειδοποιήσεις/ }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await closeDialog(page);

  await page.getByRole("button", { name: /Περισσότερες ενέργειες/ }).first().click();
  await page.getByRole("menu").waitFor({ state: "visible", timeout: 5000 });
  await page.keyboard.press("Escape");

  await openTab(page, "Πάγια");
  await page.getByRole("button", { name: /CR-04/ }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await closeDialog(page);

  await openTab(page, "Έγγραφα");
  await page.getByRole("button", { name: /Μαζικό ανέβασμα/ }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("heading", { name: /Import δεδομένων/ }).waitFor({ state: "visible", timeout: 5000 });
  await closeDialog(page);

  await openTab(page, "Βλάβες");
  await page.getByRole("button", { name: /Επεξεργασία/ }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await closeDialog(page);
}

async function exerciseLogoHomeNavigation(page) {
  await openTab(page, "Έγγραφα");
  await page.getByRole("button", { name: "Μετάβαση στο Κέντρο στόλου" }).first().click();
  await page.getByRole("heading", { name: "Σήμερα στον στόλο" }).waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseDashboardRecordLinks(page) {
  await openTab(page, "Κέντρο στόλου");
  await page.getByRole("button", { name: /B-12 KTEO/ }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("heading", { name: /B-12 έλεγχος KTEO/ }).waitFor({ state: "visible", timeout: 5000 });
  await closeDialog(page);

  await openTab(page, "Κέντρο στόλου");
  await page.getByRole("button", { name: /EX-01/ }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await page.locator('input[name="title"]').waitFor({ state: "visible", timeout: 5000 });
  const issueTitle = await page.locator('input[name="title"]').inputValue();
  if (!issueTitle.includes("Πτώση υδραυλικής πίεσης")) {
    throw new Error(`Dashboard EX-01 assignment opened the wrong issue: ${issueTitle}`);
  }
  await closeDialog(page);
}

async function exerciseNestedRecordLinks(page) {
  await openTab(page, "Πάγια");
  await page.locator("button").filter({ hasText: "Mercedes Tourismo" }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("heading", { name: /B-12 · Mercedes Tourismo/ }).waitFor({ state: "visible", timeout: 5000 });

  await page.getByRole("button", { name: /Blocking βλάβη/ }).first().click();
  await page.locator('input[name="title"]').waitFor({ state: "visible", timeout: 5000 });
  const issueTitle = await page.locator('input[name="title"]').inputValue();
  if (!issueTitle.includes("Ληγμένο KTEO")) {
    throw new Error(`Nested Blocking βλάβη opened the wrong issue: ${issueTitle}`);
  }
  await closeDialog(page);

  await openTab(page, "Πάγια");
  await page.locator("button").filter({ hasText: "Mercedes Tourismo" }).first().click();
  await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: /Λήξη εγγράφου/ }).first().click();
  await page.getByRole("heading", { name: /B-12 έλεγχος KTEO/ }).waitFor({ state: "visible", timeout: 5000 });
  await closeDialog(page);
}

async function optionalDatabaseMutation(page, baseUrl, health) {
  if (!health.ok || process.env.E2E_MUTATE_DB !== "1") {
    return {
      skipped: true,
      reason: health.ok ? "Set E2E_MUTATE_DB=1 to run write-path checks." : "Database health is not ready.",
    };
  }

  const code = `QA-${Date.now().toString().slice(-6)}`;
  await openTab(page, "Πάγια");
  await page.getByRole("button", { name: /Νέο πάγιο/ }).first().click();
  await page.getByLabel("Κωδικός").fill(code);
  await page.getByLabel("Όνομα").fill("QA Smoke Asset");
  await page.getByRole("button", { name: "Αποθήκευση" }).click();
  await page.getByRole("status").waitFor({ state: "visible", timeout: 8000 });

  const snapshot = await fetch(`${baseUrl}/api/fleetlever/snapshot`, { cache: "no-store" }).then((response) => response.json());
  const created = Array.isArray(snapshot.assets) && snapshot.assets.some((asset) => asset.code === code);

  if (!created) {
    throw new Error(`Database mutation smoke did not find created asset ${code}`);
  }

  return { skipped: false, code };
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const failures = [];

  try {
    const health = await healthStatus(server.url);
    const page = await browser.newPage({ viewport: { width: 1280, height: 840 } });
    const collectConsoleErrors = await assertNoConsoleErrors(page, failures);

    await page.goto(server.url, { waitUntil: "networkidle" });

    for (const label of TAB_LABELS) {
      await openTab(page, label);
      await assertOneHeading(page, label);
    }

    await exerciseModals(page);
    await exerciseOperationalControls(page);
    await exerciseLogoHomeNavigation(page);
    await exerciseDashboardRecordLinks(page);
    await exerciseNestedRecordLinks(page);

    const mutation = await optionalDatabaseMutation(page, server.url, health);
    collectConsoleErrors();

    await page.close();

    if (failures.length) {
      throw new Error(failures.map((failure) => `- ${failure}`).join("\n"));
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          health: {
            ok: health.ok,
            status: health.status,
            databaseConfigured: health.body.database?.configured ?? false,
            databaseReachable: health.body.database?.reachable ?? false,
            missingTables: health.body.schema?.missingTables ?? [],
          },
          mutation,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    server.stop();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
