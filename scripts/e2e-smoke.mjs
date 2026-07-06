import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

const APP_PATH = process.env.E2E_APP_PATH ?? "/console";
const NAV_LABELS = [
  "Tomorrow",
  "Capture",
  "Review",
  "Machines",
  "Report",
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
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, FLEETLEVER_BYPASS_AUTH: "true", NEXT_TELEMETRY_DISABLED: "1" },
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
    Tomorrow: "Tomorrow",
    Capture: "Capture",
    Review: "Review",
    Machines: "Machines",
    Report: "Report",
    Settings: "Settings",
  };

  for (const label of NAV_LABELS) {
    await openNav(page, label);
    await assertVisibleHeading(page, expectedHeadings[label]);
  }
}

async function exerciseMachineSearch(page) {
  for (const label of ["Tomorrow", "Capture", "Review", "Report"]) {
    await openNav(page, label);
    const searchCount = await page.getByPlaceholder(/Search machine, status, proof/i).count();
    if (searchCount > 0) {
      throw new Error(`Search was visible on ${label}`);
    }
  }

  await openNav(page, "Machines");
  const search = page.getByPlaceholder(/Search machine, status, proof/i);
  await search.fill("CAT");
  await page.getByRole("button", { name: /EX-320[\s\S]*CAT 320 Excavator/ }).first().click();
  await assertVisibleHeading(page, "Machines");
  await page.getByRole("heading", { name: /CAT 320 Excavator/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Machine details/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: /Close machine details/i }).click();

  await search.fill("");
  await openNav(page, "Tomorrow");
  await page.getByRole("heading", { name: /^Tomorrow$/i }).first().waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseTomorrowList(page) {
  await openNav(page, "Tomorrow");
  await page.getByText(/3 ready · 3 need action · 1 blocked/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("heading", { name: /^Needs action$/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Missing attachment photo/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Hydraulic leak reported/i).waitFor({ state: "visible", timeout: 5000 });

  const readyNames = page.getByText(/CAT 320 Excavator|Bobcat S650 Skid Steer|Komatsu D65 Dozer/i);
  if ((await readyNames.count()) > 0) {
    throw new Error("Ready machines were visible before expanding the collapsed section");
  }

  await page.getByRole("button", { name: /^Ready machines 3\s+Show$/i }).click();
  await page.getByText(/CAT 320 Excavator/i).waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseOperatorFlow(page) {
  await openNav(page, "Capture");
  await page.getByRole("button", { name: /Continue to photos/ }).click();
  await page.getByRole("button", { name: /Continue to checks/ }).click();
  await page.getByRole("button", { name: /Leak found/ }).click();
  await page.getByRole("button", { name: /Review submission/ }).click();
  await page.getByText(/This machine needs review/i).first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Proof is complete, but one or more checks need supervisor review/i).first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: /Submit for review/ }).click();
  await page.getByRole("heading", { name: /Submitted/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/needs review before it can work tomorrow|ready for tomorrow/i).first().waitFor({ state: "visible", timeout: 5000 });
}

async function exerciseSupervisorDecision(page) {
  await openNav(page, "Review");
  await page.getByRole("button", { name: /Review decision/ }).first().click();
  await page.getByRole("heading", { name: /Review decision/i }).waitFor({ state: "visible", timeout: 5000 });
  await page
    .getByRole("dialog", { name: /Review decision/i })
    .getByRole("button", { name: /^Release with note$/i })
    .click();
  await page.getByRole("heading", { name: /Release with note/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByLabel(/Supervisor note/i).fill("Supervisor released with note for demo audit.");
  await page.getByRole("button", { name: /Release with note/i }).last().click();
  await page.getByRole("heading", { name: /^Tomorrow$/i }).first().waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/ready ·/i).first().waitFor({ state: "visible", timeout: 5000 });
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
    await exerciseTomorrowList(page);
    await exerciseMachineSearch(page);
    await exerciseOperatorFlow(page);
    await exerciseSupervisorDecision(page);

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

  console.log("E2E smoke passed: simple console navigation, search, capture handover, and review decision are wired.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
