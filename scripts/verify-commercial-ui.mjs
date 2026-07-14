import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.FLEETLEVER_SITE_URL ?? "http://127.0.0.1:3002";
const outputDir = path.join(process.cwd(), "artifacts", "verification");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

async function settleImages(page) {
  await page.evaluate(async () => {
    const step = Math.max(360, Math.floor(window.innerHeight * 0.7));
    const max = document.documentElement.scrollHeight;
    for (let top = 0; top <= max; top += step) {
      window.scrollTo(0, top);
      await new Promise((resolve) => window.setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });

  await page
    .waitForFunction(
      () =>
        Array.from(document.images).every(
          (image) => image.complete || image.loading === "lazy" || image.getAttribute("src")?.startsWith("data:"),
        ),
      null,
      { timeout: 10_000 },
    )
    .catch(() => undefined);
}

function summarizeAccessibility(name, violations) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 6)
        .map((node) => {
          const target = node.target.join(" ");
          const summary = (node.failureSummary ?? "").replace(/\s+/g, " ").trim();
          return `${target}${summary ? `: ${summary}` : ""}`;
        })
        .join(" || ");
      return `${name}: ${violation.id} (${violation.nodes.length}) ${nodes}`;
    })
    .join("\n- ");
}

async function verifyPage({ name, pathname, viewport, required, screenshot, maxHeight, interact }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedAssets = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    const type = response.request().resourceType();
    if (response.status() >= 400 && ["image", "stylesheet", "script"].includes(type)) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${origin}${pathname}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
    await page.evaluate(() => document.fonts.ready);

    if (interact) await interact(page);
    await settleImages(page);

    const text = (await page.locator("body").textContent()) ?? "";
    const normalized = text.toLocaleLowerCase("en-GB");
    const lang = await page.locator("html").getAttribute("lang");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const overlay = await page.locator("[data-nextjs-dialog], #nextjs__container_errors_desc").count();
    const brokenImages = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.getAttribute("src")),
    );

    for (const token of required) {
      if (!normalized.includes(token.toLocaleLowerCase("en-GB"))) failures.push(`${name}: missing visible token ${token}`);
    }
    if (lang !== "en") failures.push(`${name}: html lang is ${lang ?? "missing"}, expected en`);
    if (/[Ͱ-Ͽἀ-῿]/u.test(text)) failures.push(`${name}: visible Greek copy remains`);
    if (overlay > 0) failures.push(`${name}: Next.js error overlay is visible`);
    if (overflow > 1) failures.push(`${name}: horizontal overflow of ${overflow}px`);
    if (maxHeight && height > maxHeight) failures.push(`${name}: page height ${height}px exceeds ${maxHeight}px`);
    if (consoleErrors.length > 0) failures.push(`${name}: console errors: ${consoleErrors.join(" | ")}`);
    if (failedAssets.length > 0) failures.push(`${name}: failed assets: ${failedAssets.join(" | ")}`);
    if (brokenImages.length > 0) failures.push(`${name}: broken images: ${brokenImages.join(" | ")}`);

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = accessibility.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    if (serious.length > 0) {
      failures.push(summarizeAccessibility(name, serious));
    }

    await page.screenshot({
      path: path.join(outputDir, screenshot),
      fullPage: true,
      animations: "disabled",
      caret: "initial",
    });
  } finally {
    await context.close();
  }
}

try {
  await verifyPage({
    name: "landing desktop",
    pathname: "/",
    viewport: { width: 1440, height: 1000 },
    maxHeight: 10500,
    required: [
      "Know what can go out next. And what cannot.",
      "Every asset passes the same release check before it leaves.",
      "One screen. One release decision.",
      "Three moves before the shift starts.",
      "Every blocker becomes an owned action.",
      "The decision has the evidence behind it.",
      "Equipment rental",
    ],
    screenshot: "site-landing-desktop.png",
    interact: async (page) => {
      await page.getByRole("button", { name: /Open larger image: FleetLever tomorrow-readiness board/ }).click();
      if (!(await page.getByRole("dialog").isVisible())) failures.push("landing desktop: image dialog did not open");
      await page.keyboard.press("Escape");
      if (await page.getByRole("dialog").count()) failures.push("landing desktop: image dialog did not close with Escape");
    },
  });

  await verifyPage({
    name: "landing mobile",
    pathname: "/",
    viewport: { width: 390, height: 844 },
    maxHeight: 11500,
    required: ["FleetLever", "See it with your fleet", "Request a demo", "Pricing"],
    screenshot: "site-landing-mobile.png",
    interact: async (page) => {
      await page.getByRole("button", { name: "Open menu" }).click();
      if (!(await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible())) {
        failures.push("landing mobile: mobile navigation did not open");
      }
    },
  });

  await verifyPage({
    name: "pricing desktop",
    pathname: "/pricing",
    viewport: { width: 1440, height: 1000 },
    maxHeight: 6800,
    required: ["Start with 30 days, not an annual leap of faith.", "Single Team", "Operations", "Enterprise", "Commercial terms"],
    screenshot: "site-pricing-desktop.png",
  });

  await verifyPage({
    name: "pricing mobile",
    pathname: "/pricing",
    viewport: { width: 390, height: 844 },
    maxHeight: 10000,
    required: ["EUR 1,000", "Single Team", "Operations", "Enterprise"],
    screenshot: "site-pricing-mobile.png",
  });

  await verifyPage({
    name: "request demo desktop",
    pathname: "/request-demo",
    viewport: { width: 1280, height: 900 },
    maxHeight: 2200,
    required: ["Request a FleetLever demo", "Work email", "Fleet size", "Request demo"],
    screenshot: "site-request-demo-desktop.png",
    interact: async (page) => {
      await page.getByRole("button", { name: "Request demo" }).click();
      await page.getByText("Enter your name.").waitFor();
      if (!(await page.getByText("Enter a valid work email.").isVisible())) failures.push("request demo: validation errors are missing");
    },
  });

  for (const [pathname, title] of [["/privacy", "Privacy"], ["/terms", "Terms of use"], ["/security", "Security"]]) {
    await verifyPage({
      name: `${title} page`,
      pathname,
      viewport: { width: 1280, height: 900 },
      maxHeight: 3200,
      required: [title, "FleetLever"],
      screenshot: `site-${pathname.slice(1)}-desktop.png`,
    });
  }

  const redirectPage = await browser.newPage();
  await redirectPage.goto(`${origin}/landing`, { waitUntil: "domcontentloaded" });
  if (new URL(redirectPage.url()).pathname !== "/") failures.push("/landing does not redirect to /");
  await redirectPage.close();
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`FAIL commercial site UI\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`PASS commercial site UI: ${outputDir}`);
