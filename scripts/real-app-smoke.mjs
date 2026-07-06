import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

const APP_PATH = process.env.REAL_APP_PATH ?? "/console";
const STORE_KEY = "fleetlever.mvp.state.v1";

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
  const deadline = Date.now() + 60_000;
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
  if (process.env.REAL_APP_BASE_URL) {
    return { url: process.env.REAL_APP_BASE_URL, stop: () => {} };
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
  await page.waitForTimeout(150);
}

async function inspectPersistedState(page) {
  return page.evaluate((storeKey) => {
    const raw = localStorage.getItem(storeKey);
    if (!raw) return null;
    return JSON.parse(raw);
  }, STORE_KEY);
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const failures = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.goto(`${server.url}${APP_PATH}`, { waitUntil: "networkidle" });
    await page.evaluate((storeKey) => localStorage.removeItem(storeKey), STORE_KEY);
    await page.reload({ waitUntil: "networkidle" });

    await page.getByRole("heading", { name: /^Tomorrow$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/3 ready · 3 need action · 1 blocked/i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/JCB 3CX Backhoe Loader/i).first().waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Capture");
    await page.getByRole("button", { name: /JCB 3CX Backhoe Loader/i }).first().click();
    await page.getByRole("button", { name: /Continue to photos/i }).click();
    await page.getByText(/Missing photo/i).waitFor({ state: "visible", timeout: 5000 });

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /^Add photo for Attachment$/i }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "jcb-attachment.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fleetlever-demo-proof-image"),
    });

    await page.getByText(/Photo added for Attachment/i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Required proof complete/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Continue to checks/i }).click();
    await page.getByRole("button", { name: /Leak found/i }).click();
    await page.getByRole("button", { name: /Review submission/i }).click();
    await page.getByText(/This machine needs review/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Submit for review/i }).click();
    await page.getByRole("heading", { name: /Submitted/i }).waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Review");
    await page.getByText(/JCB 3CX Backhoe Loader/i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /^Review decision$/i }).first().click();
    await page.getByRole("dialog", { name: /^Review decision$/i }).getByRole("button", { name: /^Release with note$/i }).click();
    await page.getByRole("heading", { name: /^Release with note/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByLabel(/Supervisor note/i).fill("Attachment proof added. Leak warning accepted for morning move.");
    await page.getByLabel(/Supervisor name/i).fill("Dimitris");
    await page.getByRole("button", { name: /^Release with note$/i }).last().click();

    await page.getByRole("heading", { name: /^Tomorrow$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/4 ready · 2 need action · 1 blocked/i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /^Ready machines 4\s+Show$/i }).click();
    await page.getByText(/JCB 3CX Backhoe Loader/i).waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Report");
    await page.getByText(/4 ready\./i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/2 need action\./i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/2 released with note\./i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Attachment proof added\. Leak warning accepted/i).waitFor({ state: "visible", timeout: 5000 });

    const persisted = await inspectPersistedState(page);
    const jcb = persisted?.machines?.find((machine) => machine.id === "jcb-3cx");
    const eventTypes = new Set((persisted?.events ?? []).map((event) => event.type));

    if (jcb?.status !== "Released with exception") {
      throw new Error(`Expected persisted JCB status to be Released with exception, got ${jcb?.status ?? "missing"}`);
    }
    for (const eventType of ["PROOF_ADDED", "HANDOVER_SUBMITTED", "RELEASED_WITH_NOTE"]) {
      if (!eventTypes.has(eventType)) throw new Error(`Expected persisted event ${eventType}`);
    }

    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("heading", { name: /^Tomorrow$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/4 ready · 2 need action · 1 blocked/i).waitFor({ state: "visible", timeout: 5000 });
    await openNav(page, "Report");
    await page.getByText(/Attachment proof added\. Leak warning accepted/i).waitFor({ state: "visible", timeout: 5000 });

    if (consoleErrors.length) {
      throw new Error(`Console errors:\n${consoleErrors.join("\n")}`);
    }

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

  console.log("Real app smoke passed: proof upload, handover, review decision, report, and refresh persistence work.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
