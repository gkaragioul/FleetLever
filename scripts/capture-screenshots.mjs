import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { chromium } from "playwright";

const desktop = join(homedir(), "Desktop");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputDir = process.env.FLEETLEVER_SCREENSHOT_DIR ?? join(desktop, `FleetLever Console Screenshots ${stamp}`);
const baseUrl = process.env.FLEETLEVER_SCREENSHOT_URL ?? "http://127.0.0.1:3000/console";
const manifest = [];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1050 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const page = await context.newPage();

page.setDefaultTimeout(8000);

function safeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function settle() {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(450);
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
}

async function shot(label, description, options = {}) {
  await settle();
  const index = String(manifest.length + 1).padStart(2, "0");
  const fileName = `${index}-${safeName(label)}.png`;
  const filePath = join(outputDir, fileName);

  await page.screenshot({
    animations: "disabled",
    fullPage: options.fullPage ?? true,
    path: filePath,
  });

  manifest.push({
    index: manifest.length + 1,
    label,
    description,
    file: fileName,
  });
  console.log(`captured ${fileName}`);
}

async function clickButton(name) {
  const locator = page.getByRole("button", { name }).first();
  await locator.waitFor({ state: "visible" });
  await locator.click();
  await settle();
}

async function openSection(label) {
  await clickButton(new RegExp(`^${label}$`, "i"));
  await page.getByRole("heading", { name: new RegExp(`^${label}$`, "i") }).first().waitFor({ state: "visible" });
  await settle();
}

async function closeOverlay() {
  const close = page.getByLabel(/close/i).first();
  if (await close.isVisible().catch(() => false)) {
    await close.click();
    await settle();
    return;
  }

  await page.keyboard.press("Escape").catch(() => {});
  await settle();
}

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: /^Tomorrow$/i }).waitFor({ state: "visible" });
await shot("Tomorrow", "Compact list showing what needs action before tomorrow.");

await clickButton(/Volvo L120 Wheel Loader/i);
await shot("Tomorrow machine drawer", "Machine drawer with answer, reason, proof, issue, and contextual actions.");
await closeOverlay();

await openSection("Capture");
await clickButton(/JCB 3CX Backhoe Loader/i);
await shot("Capture choose machine", "Capture step 1 with QR and machine selection.");

await clickButton(/^Continue to photos$/i);
await shot("Capture photos", "Capture step 2 with required proof slots and missing proof.");

const attachmentButton = page.getByRole("button", { name: /^Add photo for Attachment$/i }).first();
if (await attachmentButton.isVisible().catch(() => false)) {
  const fileChooserPromise = page.waitForEvent("filechooser");
  await attachmentButton.click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: "attachment-proof.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("fleetlever-proof"),
  });
  await settle();
}

await clickButton(/^Continue to checks$/i);
await clickButton(/^Leak found$/i);
await shot("Capture checks", "Capture step 3 with explicit check answers and supervisor-review warning.");

await clickButton(/^Review submission$/i);
await shot("Capture review submission", "Capture step 4 showing proof complete but review required because of a warning.");

await clickButton(/^Submit for review$/i);
await shot("Capture submitted", "Submitted state explaining that supervisor review is next.");

await openSection("Review");
await shot("Review", "Decision queue with adaptive actions by proof, warnings, and blocked issues.");

await clickButton(/^Review decision$/i);
await shot("Review decision", "Supervisor decision modal with release, block, and proof request options.");
await page
  .getByRole("dialog", { name: /^Review decision$/i })
  .getByRole("button", { name: /^Release with note$/i })
  .click();
await settle();
await shot("Review release with note", "Supervisor note modal requiring note, supervisor, and timestamp.");
await closeOverlay();

await openSection("Machines");
await shot("Machines", "Registry with search, proof requirements, status, and open issues.");

await openSection("Report");
await shot("Report", "Owner-friendly tomorrow readiness summary.");

await openSection("Settings");
await shot("Settings", "Templates, required proof, checks, QR codes, and users.");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await page.getByRole("heading", { name: /^Tomorrow$/i }).waitFor({ state: "visible" });
await shot("Mobile tomorrow", "Mobile Tomorrow list with labeled bottom navigation.", { fullPage: true });

await writeFile(
  join(outputDir, "manifest.json"),
  JSON.stringify({
    createdAt: new Date().toISOString(),
    baseUrl,
    viewport: {
      desktop: "1440x1050",
      mobile: "390x844",
    },
    screenshots: manifest,
  }, null, 2),
);

await browser.close();

console.log(JSON.stringify({
  outputDir,
  count: manifest.filter((item) => item.file).length,
  manifest: join(outputDir, "manifest.json"),
}, null, 2));
