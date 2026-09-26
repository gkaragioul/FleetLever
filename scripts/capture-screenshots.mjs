import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const desktop = join(homedir(), "Desktop");
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outputDir = join(desktop, `FleetLever_Screenshots_${stamp}`);
const baseUrl = process.env.FLEETLEVER_SCREENSHOT_URL ?? "http://127.0.0.1:3000/console";
const manifest = [];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1200 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});
const page = await context.newPage();

page.setDefaultTimeout(3500);

function safeName(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function settle() {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(450);
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

async function clickButton(name, options = {}) {
  const matcher = typeof name === "string" ? new RegExp(name, "i") : name;
  const locator = page.getByRole("button", { name: matcher }).first();
  await locator.waitFor({ state: "visible", timeout: options.timeout ?? 3000 });
  await locator.click({ force: options.force ?? false });
  await settle();
}

async function openNav(label) {
  await clickButton(label);
}

async function closeOverlays() {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(200);
  const closeButtons = [
    page.getByLabel(/close/i).first(),
    page.getByRole("button", { name: /^cancel$/i }).first(),
  ];

  for (const button of closeButtons) {
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => {});
      await page.waitForTimeout(200);
    }
  }
}

async function optionalStep(label, callback) {
  try {
    await callback();
  } catch (error) {
    manifest.push({
      index: manifest.length + 1,
      label: `${label} skipped`,
      description: error instanceof Error ? error.message : "Step unavailable",
      file: null,
    });
    console.log(`skipped ${label}: ${error instanceof Error ? error.message : "Step unavailable"}`);
    await closeOverlays();
  }
}

await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await settle();

await shot("Tomorrow readiness dashboard", "Primary dashboard with tomorrow readiness, status bars, and checklist.");

await optionalStep("Custom date calendar", async () => {
  await clickButton("Custom");
  await shot("Custom date calendar", "Custom date picker opened from the readiness controls.");
  await closeOverlays();
});

await optionalStep("Release review modal", async () => {
  await clickButton(/release clear machines|release/i);
  await shot("Release clear machines review", "Release confirmation/review surface for clear machines.");
  await closeOverlays();
});

await optionalStep("Machine why stopped drawer", async () => {
  await clickButton("Resolve");
  await shot("Machine why tomorrow stops drawer", "Machine drawer showing the blockers that stop tomorrow's work.");
});

await optionalStep("Machine passport drawer", async () => {
  await clickButton("Machine Passport");
  await shot("Machine passport drawer", "Machine passport view inside the machine drawer.");
});

await optionalStep("Evidence upload modal", async () => {
  await clickButton("Why tomorrow stops");
  await clickButton("Upload to passport");
  await shot("Evidence upload modal", "Upload-to-passport flow before file selection.");
  await closeOverlays();
});

await optionalStep("Assign owner modal", async () => {
  await clickButton("Assign");
  await shot("Assign owner modal", "Owner assignment and due date modal for a blocker.");
  await closeOverlays();
  await closeOverlays();
});

await openNav("Worksites");
await shot("Worksites queue", "Worksite comparison and release-risk queue.");

await openNav("Stop List");
await shot("Stop List", "Cross-machine stop list for actions that affect release.");

await openNav("Machines");
await shot("Machines visual inventory", "Machine inventory with real vehicle imagery, status, and actions.");

await optionalStep("Machine visual drawer from machines", async () => {
  await clickButton(/resolve blocker|review machine|open passport/i);
  await shot("Machine drawer from inventory", "Machine drawer opened from the visual inventory page.");
  await closeOverlays();
});

await openNav("Evidence");
await shot("Evidence desk", "Evidence/document control queue and upload actions.");

await openNav("Service Jobs");
await shot("Service jobs board", "Workshop-style service board with vehicle cards.");

await optionalStep("New service job modal", async () => {
  await clickButton("New service job");
  await shot("New service job modal", "Create-service-job flow.");
  await closeOverlays();
});

await optionalStep("Service job lifted card", async () => {
  const card = page.locator("[data-workshop-card], .workshop-card").first();
  if (!(await card.count())) throw new Error("No draggable workshop card selector found.");
  const box = await card.boundingBox();
  if (!box) throw new Error("Workshop card has no visible box.");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 160, box.y + 70, { steps: 12 });
  await page.waitForTimeout(300);
  await shot("Service job lifted drag state", "Dragged service card with lifted/tilted interaction state.", { fullPage: false });
  await page.mouse.up();
});

await openNav("Decision History");
await shot("Decision history audit trail", "Audit trail of decisions and evidence records.");

await optionalStep("Global search overlay", async () => {
  await page.getByRole("searchbox").first().fill("CR-");
  await settle();
  await shot("Global search overlay", "Global search results across machines, worksites, evidence, actions, service jobs, and history.");
  await page.getByRole("searchbox").first().fill("");
  await settle();
  await closeOverlays();
});

await optionalStep("Lisa assistant", async () => {
  await page.getByLabel(/open lisa assistant|άνοιγμα βοηθού lisa/i).first().click({ force: true });
  await settle();
  await shot("Lisa assistant bubble chat", "Lisa scripted assistant opened as a customer chatbot bubble.");
  const quick = page.getByRole("button", { name: /what stops tomorrow|show blockers|best next action|τι σταματάει|δείξε τα blockers|καλύτερη επόμενη/i }).first();
  if (await quick.isVisible().catch(() => false)) {
    await quick.click();
    await shot("Lisa assistant response", "Lisa showing a baked response using current app data.");
  }
  await closeOverlays();
});

await optionalStep("Notifications menu", async () => {
  await page.getByLabel(/notifications/i).click();
  await shot("Notifications menu", "Notification popover.");
  await closeOverlays();
});

await optionalStep("Add menu", async () => {
  await clickButton(/^Add/i);
  await shot("Add menu", "Create/add menu entry points.");
  await closeOverlays();
});

await optionalStep("User menu", async () => {
  await page.getByLabel(/user menu/i).click();
  await shot("User menu", "User/account menu.");
  await closeOverlays();
});

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
await settle();
await shot("Mobile dashboard", "Mobile viewport of the main dashboard.", { fullPage: true });

await writeFile(join(outputDir, "manifest.json"), JSON.stringify({
  createdAt: new Date().toISOString(),
  baseUrl,
  viewport: {
    desktop: "1920x1200 @2x",
    mobile: "390x844 @2x",
  },
  screenshots: manifest,
}, null, 2));

await browser.close();

const zipPath = `${outputDir}.zip`;
execFileSync("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", outputDir, zipPath], {
  cwd: desktop,
  stdio: "inherit",
});

console.log(JSON.stringify({
  outputDir,
  zipPath,
  count: manifest.filter((item) => item.file).length,
  manifest: join(outputDir, "manifest.json"),
}, null, 2));
