import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.FLEETLEVER_SITE_URL ?? "http://127.0.0.1:3002";
const outputDir = path.join(process.cwd(), "artifacts", "verification");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

async function verifyPage({ name, pathname, viewport, required, screenshot }) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  const consoleErrors = [];
  const failedAssets = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400 && ["image", "stylesheet", "script"].includes(response.request().resourceType())) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${origin}${pathname}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
    const images = page.locator("img");
    for (let index = 0; index < await images.count(); index += 1) {
      const image = images.nth(index);
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((element) => {
        if (element.complete && element.naturalWidth > 0) return;
        return new Promise((resolve) => {
          const finish = () => resolve(undefined);
          element.addEventListener("load", finish, { once: true });
          element.addEventListener("error", finish, { once: true });
          window.setTimeout(finish, 15_000);
        });
      });
    }
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    const text = (await page.locator("body").textContent()) ?? "";
    const normalizedText = text.toLocaleLowerCase("el-GR");
    const overlay = await page.locator("[data-nextjs-dialog], #nextjs__container_errors_desc").count();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const brokenImages = await page.locator("img").evaluateAll((images) =>
      images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute("src")),
    );

    for (const token of required) {
      if (!normalizedText.includes(token.toLocaleLowerCase("el-GR"))) failures.push(`${name}: missing visible token ${token}`);
    }
    if (overlay > 0) failures.push(`${name}: Next.js error overlay is visible`);
    if (overflow > 1) failures.push(`${name}: horizontal overflow of ${overflow}px`);
    if (consoleErrors.length > 0) failures.push(`${name}: console errors: ${consoleErrors.join(" | ")}`);
    if (failedAssets.length > 0) failures.push(`${name}: failed assets: ${failedAssets.join(" | ")}`);
    if (brokenImages.length > 0) failures.push(`${name}: broken images: ${brokenImages.join(" | ")}`);

    await page.screenshot({
      path: path.join(outputDir, screenshot),
      fullPage: true,
      animations: "disabled",
    });
  } finally {
    await page.close();
  }
}

try {
  await verifyPage({
    name: "landing desktop",
    pathname: "/",
    viewport: { width: 1440, height: 1000 },
    required: ["FleetLever", "Ξέρεις τι μπορεί να βγει αύριο. Και τι όχι.", "Μία οθόνη. Μία καθαρή απόφαση."],
    screenshot: "site-landing-desktop.png",
  });
  await verifyPage({
    name: "landing mobile",
    pathname: "/",
    viewport: { width: 390, height: 844 },
    required: ["FleetLever", "Ζήτησε demo", "Τρεις κινήσεις πριν κλείσει η ημέρα."],
    screenshot: "site-landing-mobile.png",
  });
  await verifyPage({
    name: "pricing desktop",
    pathname: "/pricing",
    viewport: { width: 1440, height: 1000 },
    required: ["30 ημέρες με τον πραγματικό σας στόλο.", "Single Team", "Operations"],
    screenshot: "site-pricing-desktop.png",
  });
  await verifyPage({
    name: "pricing mobile",
    pathname: "/pricing",
    viewport: { width: 390, height: 844 },
    required: ["Τιμές FleetLever", "€1.000", "Μετά το pilot"],
    screenshot: "site-pricing-mobile.png",
  });
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`FAIL commercial site UI\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`PASS commercial site UI: ${outputDir}`);
