import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

const APP_PATH = process.env.DESIGN_AUDIT_PATH ?? "/console";
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
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
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
  if (process.env.DESIGN_AUDIT_URL) {
    return { url: process.env.DESIGN_AUDIT_URL, stop: () => {} };
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

async function visibleH1Count(page) {
  return page.locator("h1").evaluateAll((headings) =>
    headings.filter((heading) => {
      const style = window.getComputedStyle(heading);
      const rect = heading.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    }).length,
  );
}

async function assertNoRootOverflow(page, label, viewportName) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  if (overflow.scrollWidth > overflow.clientWidth + 2) {
    throw new Error(`${viewportName} / ${label}: root horizontal overflow (${overflow.scrollWidth}px > ${overflow.clientWidth}px)`);
  }
}

async function assertNamedInteractiveControls(page, label, viewportName) {
  const unnamed = await page.evaluate(() =>
    Array.from(document.querySelectorAll("button, a, input, select, textarea"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (rect.width === 0 || rect.height === 0) return false;
        if (element.getAttribute("aria-hidden") === "true") return false;

        const text = element.textContent?.trim() ?? "";
        const label =
          element.getAttribute("aria-label") ??
          element.getAttribute("title") ??
          element.getAttribute("placeholder") ??
          "";

        return !text && !label.trim();
      })
      .slice(0, 8)
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        type: element.getAttribute("type"),
        className: element.getAttribute("class")?.slice(0, 80) ?? "",
      })),
  );

  if (unnamed.length) {
    throw new Error(`${viewportName} / ${label}: unnamed interactive controls ${JSON.stringify(unnamed, null, 2)}`);
  }
}

async function assertNoUnexpectedOffscreenElements(page, label, viewportName) {
  const offenders = await page.evaluate(() => {
    function hasFixedOrHiddenAncestor(element) {
      let current = element.parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        if (style.position === "fixed") return true;
        if (style.display === "none" || style.visibility === "hidden") return true;
        current = current.parentElement;
      }

      return false;
    }

    function allowsHorizontalScroll(element) {
      let current = element.parentElement;

      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const overflowX = style.overflowX;

        if ((overflowX === "auto" || overflowX === "scroll") && current.scrollWidth > current.clientWidth + 2) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    }

    return Array.from(document.body.querySelectorAll("*"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === "none" || style.visibility === "hidden") return false;
        if (rect.width === 0 || rect.height === 0) return false;
        if (style.position === "fixed") return false;
        if (hasFixedOrHiddenAncestor(element)) return false;
        if (allowsHorizontalScroll(element)) return false;
        return rect.left < -2 || rect.right > window.innerWidth + 2;
      })
      .slice(0, 8)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      });
  });

  if (offenders.length) {
    throw new Error(`${viewportName} / ${label}: offscreen elements found ${JSON.stringify(offenders, null, 2)}`);
  }
}

async function openNav(page, label, viewportName) {
  if (viewportName === "mobile") {
    const navButton = page.getByRole("button", { name: /Open navigation|Menu/i }).first();
    if (await navButton.isVisible().catch(() => false)) {
      await navButton.click();
    }
  }

  await page.getByRole("button", { name: label, exact: true }).first().click();
  await page.waitForTimeout(150);
}

async function auditView(page, label, viewportName) {
  await openNav(page, label, viewportName);

  const h1Count = await visibleH1Count(page);
  if (h1Count !== 1) {
    throw new Error(`${viewportName} / ${label}: expected exactly one visible h1, found ${h1Count}`);
  }

  await assertNoRootOverflow(page, label, viewportName);
  await assertNoUnexpectedOffscreenElements(page, label, viewportName);
  await assertNamedInteractiveControls(page, label, viewportName);
}

async function auditDrawer(page, viewportName) {
  await openNav(page, "Machines", viewportName);
  await page.getByRole("button", { name: /Open case|Open issue/ }).first().click();
  await page.getByRole("heading", { name: /CR-04/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/This machine will stop/i).waitFor({ state: "visible", timeout: 5000 });
  await assertNoRootOverflow(page, "machine drawer", viewportName);
  await page.getByRole("button", { name: /Close drawer/ }).first().click();
}

async function main() {
  const server = await startServer();
  const browser = await chromium.launch();
  const failures = [];

  try {
    for (const viewport of VIEWPORTS) {
      const page = await browser.newPage({ viewport });
      const consoleErrors = [];

      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => consoleErrors.push(error.message));

      await page.goto(`${server.url}${APP_PATH}`, { waitUntil: "networkidle" });

      for (const label of NAV_LABELS) {
        try {
          await auditView(page, label, viewport.name);
        } catch (error) {
          failures.push(error.message);
        }
      }

      if (viewport.name === "desktop") {
        try {
          await auditDrawer(page, viewport.name);
        } catch (error) {
          failures.push(error.message);
        }
      }

      if (consoleErrors.length) {
        failures.push(`${viewport.name}: console errors:\n${consoleErrors.join("\n")}`);
      }

      await page.close();
    }
  } finally {
    await browser.close();
    server.stop();
  }

  if (failures.length) {
    console.error(failures.map((failure) => `- ${failure}`).join("\n"));
    process.exit(1);
  }

  console.log("Design audit passed: current console views, drawer, accessibility names, and overflow checks are clean.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
