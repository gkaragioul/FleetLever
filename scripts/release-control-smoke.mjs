import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

const APP_PATH = process.env.RELEASE_CONTROL_APP_PATH ?? "/console";
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
  if (process.env.RELEASE_CONTROL_BASE_URL) {
    return { url: process.env.RELEASE_CONTROL_BASE_URL, stop: () => {} };
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

  const fallbackServer = await waitForServer(url).then(() => null).catch(async (error) => {
    child.kill("SIGTERM");
    if (log.includes("Another next dev server is already running")) {
      const existingUrl = "http://localhost:3000";
      await waitForServer(existingUrl);
      return {
        url: existingUrl,
        stop: () => {},
      };
    }
    throw new Error(`${error.message}\n\nNext output:\n${log.slice(-4000)}`);
  });

  if (fallbackServer) return fallbackServer;

  return {
    url,
    stop: () => child.kill("SIGTERM"),
  };
}

async function openNav(page, label) {
  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(150);
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

    await page.getByRole("heading", { name: /^Tomorrow Release Board$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/No proof\. No release\./i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/4pm alert/i).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Locked until/i).first().waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Capture");
    await page.getByRole("button", { name: /^Before release$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /^Return check$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Only missing proof is requested/i).waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Review");
    await page.getByRole("heading", { name: /^Supervisor Release Queue$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Missing proof cannot be released with note/i).waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Report");
    await page.getByRole("button", { name: /^Copy proof pack$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Machine release proof pack/i).waitFor({ state: "visible", timeout: 5000 });

    await openNav(page, "Settings");
    await page.getByText(/Upload CSV -> print QR -> start tomorrow/i).waitFor({ state: "visible", timeout: 5000 });

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

  console.log("Release-control smoke passed: release board, locks, supervisor queue, proof pack, and setup path are visible.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
