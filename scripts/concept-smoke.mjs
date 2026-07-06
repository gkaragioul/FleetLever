import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

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
  if (process.env.CONCEPT_BASE_URL) {
    return { url: process.env.CONCEPT_BASE_URL, stop: () => {} };
  }

  const port = await getFreePort();
  const url = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: {
      ...process.env,
      FLEETLEVER_BYPASS_AUTH: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
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

async function assertNoLegacyBranding(page, label) {
  const body = await page.locator("body").innerText();
  const legacyName = new RegExp(String.raw`FleetLever\s+${"G"}ate`, "i");
  if (legacyName.test(body)) {
    throw new Error(`${label}: rendered old product branding`);
  }
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const failures = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(`${server.url}/landing`, { waitUntil: "networkidle" });
    await assertNoLegacyBranding(page, "landing");
    await page.getByRole("heading", { name: /No proof\. No release\./i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/21-day readiness pilot/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/release board/i).first().waitFor({ state: "visible", timeout: 5000 });

    await page.goto(`${server.url}/console`, { waitUntil: "networkidle" });
    await assertNoLegacyBranding(page, "console");
    await page.getByRole("heading", { name: /^Tomorrow$/i }).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/3 ready · 3 need action · 1 blocked/i).first().waitFor({ state: "visible", timeout: 5000 });
    if ((await page.locator("body").innerText()).includes("Ready: 3 / Need action: 3 / Blocked: 1")) {
      throw new Error("console: rendered the redundant Tomorrow status strip");
    }
    await page.getByRole("heading", { name: /^Needs action$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/JCB 3CX Backhoe Loader/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Missing attachment photo/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /^Ready machines 3\s+Show$/i }).waitFor({ state: "visible", timeout: 5000 });
    if ((await page.getByText(/3 of 7 machines can work tomorrow/i).count()) > 0) {
      throw new Error("console: rendered the old oversized dashboard hero");
    }
    if ((await page.getByPlaceholder(/Search machine, status, proof/i).count()) > 0) {
      throw new Error("console: rendered global search on Tomorrow");
    }
    if ((await page.getByText(/Machine Decision Panel/i).count()) > 0) {
      throw new Error("console: rendered the old constant machine panel");
    }

    await page.getByRole("button", { name: "Capture", exact: true }).first().click();
    await page.getByRole("heading", { name: /^Capture$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Add proof for tomorrow/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Add what this machine is missing/i).first().waitFor({ state: "visible", timeout: 5000 });
    if ((await page.getByText(/Proof capture\.|Add only what is needed for tomorrow/i).count()) > 0) {
      throw new Error("capture: rendered old internal copy");
    }
    await page.getByText(/1 Machine/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/2 Photos/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/3 Checks/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/4 Submit/i).first().waitFor({ state: "visible", timeout: 5000 });
    if ((await page.getByText(/photos added/i).count()) > 0) {
      throw new Error("capture: rendered the old always-visible desktop summary");
    }
    await page.getByRole("button", { name: /JCB 3CX Backhoe Loader/i }).first().click();
    await page.getByRole("button", { name: /Continue to photos/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Continue to photos/i }).click();
    await page.getByText(/Missing photo/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Add photo for Attachment|Replace photo for Attachment/i }).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Added photos 8\. Show/i }).waitFor({ state: "visible", timeout: 5000 });
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: /Add photo for Attachment|Replace photo for Attachment/i }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "attachment-proof.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("fleetlever-proof"),
    });
    await page.getByRole("button", { name: /Continue to checks/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Continue to checks/i }).click();
    await page.getByText(/Fluid leaks/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /No leaks/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Leak found/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Leak found/i }).click();
    await page.getByText(/This will require supervisor review/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Review submission/i }).click();
    await page.getByText(/This machine needs review/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Proof is complete, but one or more checks need supervisor review/i).first().waitFor({ state: "visible", timeout: 5000 });

    await page.getByRole("button", { name: "Review", exact: true }).first().click();
    await page.getByRole("heading", { name: /^Review$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/machines need a decision/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Review decision/i }).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Review decision/i }).first().click();
    await page.getByRole("heading", { name: /^Review decision$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page
      .getByRole("dialog", { name: /^Review decision$/i })
      .getByRole("button", { name: /^Release with note$/i })
      .waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Close decision/i }).click();
    if ((await page.getByText(/^Proof$/i).count()) > 0 || (await page.getByText(/^Checks$/i).count()) > 0 || (await page.getByText(/^Next$/i).count()) > 0) {
      throw new Error("review: rendered old mini metric boxes");
    }

    await page.getByRole("button", { name: "Report", exact: true }).first().click();
    await page.getByRole("heading", { name: /^Report$/i }).waitFor({ state: "visible", timeout: 5000 });
    await page.getByText(/Tomorrow summary/i).first().waitFor({ state: "visible", timeout: 5000 });
    await page.getByRole("button", { name: /Copy summary/i }).waitFor({ state: "visible", timeout: 5000 });

    await page.getByRole("button", { name: "Settings", exact: true }).first().click();
    await page.getByRole("heading", { name: /^Settings$/i }).waitFor({ state: "visible", timeout: 5000 });

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

  console.log("Concept smoke passed: FleetLever simple console renders without old product branding.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
