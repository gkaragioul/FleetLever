import { spawn } from "node:child_process";
import net from "node:net";
import process from "node:process";
import { chromium } from "playwright";

const APP_PATH = process.env.DESIGN_AUDIT_PATH ?? "/console";
const NAV_LABELS = [
  "Tomorrow",
  "Capture",
  "Review",
  "Machines",
  "Report",
  "Settings",
];
const MOBILE_NAV_LABELS = [
  "Tomorrow",
  "Capture",
  "Review",
  "Machines",
  "Report",
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

  if (label !== "Machines" && (await page.getByPlaceholder(/Search machine, status, proof/i).count()) > 0) {
    throw new Error(`${viewportName} / ${label}: search should only be visible on Machines`);
  }
}

async function auditDrawer(page, viewportName) {
  await openNav(page, "Machines", viewportName);
  await page.getByRole("button", { name: /EX-320[\s\S]*CAT 320 Excavator/ }).first().click();
  await page.getByRole("heading", { name: /CAT 320 Excavator/i }).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Machine details/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Can it work tomorrow/i).waitFor({ state: "visible", timeout: 5000 });
  await assertNoRootOverflow(page, "machine detail", viewportName);
}

async function auditTomorrow(page, viewportName) {
  await openNav(page, "Tomorrow", viewportName);
  await page.getByText(/3 ready · 3 need action · 1 blocked/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByRole("button", { name: /^Ready machines 3\s+Show$/i }).waitFor({ state: "visible", timeout: 5000 });

  if ((await page.locator("body").innerText()).includes("Ready: 3 / Need action: 3 / Blocked: 1")) {
    throw new Error(`${viewportName} / Tomorrow: redundant status strip is visible`);
  }

  if (await page.getByText(/3 of 7 machines can work tomorrow/i).isVisible().catch(() => false)) {
    throw new Error(`${viewportName} / Tomorrow: oversized dashboard hero is visible`);
  }

  if (viewportName === "mobile") {
    const mobileSpacing = await page.evaluate(() => {
      const main = document.querySelector("section");
      const nav = document.querySelector('nav[aria-label="Mobile FleetLever console navigation"]');

      return {
        contentBottomPadding: main ? Number.parseFloat(window.getComputedStyle(main).paddingBottom) : 0,
        navHeight: nav ? nav.getBoundingClientRect().height : 0,
      };
    });

    if (mobileSpacing.navHeight > 0 && mobileSpacing.contentBottomPadding < mobileSpacing.navHeight + 32) {
      throw new Error(
        `mobile / Tomorrow: content bottom padding (${mobileSpacing.contentBottomPadding}px) is less than nav height + 32 (${mobileSpacing.navHeight + 32}px)`,
      );
    }

    for (const label of ["Tomorrow", "Capture", "Review", "Machines", "Report"]) {
      await page.getByRole("button", { name: label, exact: true }).first().waitFor({ state: "visible", timeout: 5000 });
    }
  }
}

async function auditCapture(page, viewportName) {
  await openNav(page, "Capture", viewportName);
  await page.getByText(/Add proof for tomorrow/i).waitFor({ state: "visible", timeout: 5000 });
  await page.getByText(/Add what this machine is missing/i).waitFor({ state: "visible", timeout: 5000 });

  if ((await page.getByText(/Proof capture\.|Add only what is needed for tomorrow/i).count()) > 0) {
    throw new Error(`${viewportName} / Capture: old internal copy is visible`);
  }

  if (viewportName !== "mobile") {
    const desktopActionBarPosition = await page.getByRole("button", { name: /Continue to photos/i }).evaluate((button) => {
      const actionBar = button.closest(".sticky") ?? button.parentElement;
      return actionBar ? window.getComputedStyle(actionBar).position : "";
    });

    if (desktopActionBarPosition === "sticky" || desktopActionBarPosition === "fixed") {
      throw new Error(`${viewportName} / Capture: action bar is ${desktopActionBarPosition} instead of inline`);
    }
  }
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

      const labels = viewport.name === "mobile" ? MOBILE_NAV_LABELS : NAV_LABELS;
      for (const label of labels) {
        try {
          await auditView(page, label, viewport.name);
        } catch (error) {
          failures.push(error.message);
        }
      }

      try {
        await auditTomorrow(page, viewport.name);
      } catch (error) {
        failures.push(error.message);
      }

      try {
        await auditCapture(page, viewport.name);
      } catch (error) {
        failures.push(error.message);
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

  console.log("Design audit passed: simplified console views, drawer, accessibility names, and overflow checks are clean.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
