import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

// The standalone server takes its host and port from the environment and ignores CLI flags,
// and running it through npm adds a shell hop that breaks both spawn and kill on Windows.
// Launching node directly keeps this cross-platform and lets the port actually take effect.
const standaloneServer = ".next/standalone/server.js";

const APP_PATH = process.env.E2E_APP_PATH ?? "/console";
const NAV_LABELS = [
  "Tomorrow's Work",
  "Worksites",
  "Action Queue",
  "Machines",
  "Documents",
  "Workshop",
  "Release History",
  "Settings",
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
  const child = spawn(process.execPath, [standaloneServer], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", HOSTNAME: "127.0.0.1", PORT: String(port) },
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

async function openNav(page, label) {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(120);
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

async function assertVisibleHeading(page, name) {
  await page.getByRole("heading", { name }).first().waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseNavigation(page) {
  const expectedHeadings = {
    "Tomorrow's Work": /Will tomorrow's work start|Know Before Tomorrow/i,
    Worksites: "Worksites",
    "Action Queue": "Action Queue",
    Machines: "Machines",
    Documents: "Documents",
    Workshop: "Workshop",
    "Release History": "Release History",
    Settings: "Settings",
  };

  for (const label of NAV_LABELS) {
    await openNav(page, label);
    await assertVisibleHeading(page, expectedHeadings[label]);
  }
}

async function exerciseGlobalSearch(page) {
  const search = page.getByPlaceholder(/Search machine, worksite/i);
  await search.fill("CR-");
  await page.getByText(/Search FleetLever/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: /CR-04[\s\S]*Liebherr LTM 1040 Crane/ }).first().click();
  await assertVisibleHeading(page, "Machines");
  await page.getByRole("heading", { name: /CR-04/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/This machine will stop/i).waitFor({ state: "visible", timeout: 5000 });

  await openNav(page, "Worksites");
  const searchValue = await search.inputValue();
  if (searchValue) {
    throw new Error(`Search was not cleared after navigation: ${searchValue}`);
  }
  await page.getByRole("heading", { name: "Worksites" }).waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseWorkshop(page) {
  await openNav(page, "Workshop");
  await page.getByRole("button", { name: /New service job/ }).click();
  await page.getByRole("heading", { name: "New service job" }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByLabel("Job").fill(`QA steering check ${Date.now()}`);
  await page.getByRole("button", { name: /Add to board/ }).click();
  await page.getByText(/QA steering check/).waitFor({ state: "visible", timeout: 5000 });

  const card = page.getByRole("button", { name: /QA steering check/ }).first();
  const doingLane = page.locator('[data-workshop-drop-status="In Progress"]').first();
  const cardBox = await card.boundingBox();
  const laneBox = await doingLane.boundingBox();
  if (!cardBox || !laneBox) throw new Error("Workshop drag target was not measurable.");

  await page.mouse.move(cardBox.x + 20, cardBox.y + 20);
  await page.mouse.down();
  await page.mouse.move(laneBox.x + laneBox.width / 2, laneBox.y + laneBox.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(250);

  await doingLane.getByText(/QA steering check/).waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseReleaseHistory(page) {
  await openNav(page, "Release History");
  await page.getByRole("button", { name: /View packet/ }).first().click();
  await page.getByRole("heading", { name: /CR-04 release decision/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: "Close" }).click();
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const failures = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const flushConsoleErrors = await assertNoConsoleErrors(page, failures);

    await page.goto(`${server.url}${APP_PATH}`, { waitUntil: "networkidle" });
    await exerciseNavigation(page);
    await exerciseGlobalSearch(page);
    await exerciseWorkshop(page);
    await exerciseReleaseHistory(page);

    flushConsoleErrors();
    await page.close();
  } catch (error) {
    failures.push(error.message);
  } finally {
    await browser.close();
    server.stop();
  }

  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
  }

  console.log("E2E smoke passed: current console navigation, search, drawers, workshop drag, and evidence packets are wired.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
