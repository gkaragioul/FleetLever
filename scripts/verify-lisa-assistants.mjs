import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const reportDirectory = new URL("../reports/", import.meta.url);
const reportPath = (name) => fileURLToPath(new URL(name, reportDirectory));

await mkdir(reportDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function createPage(viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  return { page, errors };
}

async function gotoApp(page, path) {
  await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).waitFor({ timeout: 30_000 });
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (dimensions.scrollWidth > dimensions.clientWidth) {
    throw new Error(`${label} overflows horizontally: ${dimensions.scrollWidth}/${dimensions.clientWidth}`);
  }
}

async function verifyCivicDesktop() {
  const { page, errors } = await createPage({ width: 1440, height: 960 });
  await gotoApp(page, "/civic-dispatch?verify=lisa-desktop");
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).click();
  const panel = page.locator("[data-lisa-panel]");
  await panel.getByRole("heading", { name: "Lisa" }).waitFor();
  await panel.getByRole("button", { name: "Χωρίς ανάθεση", exact: true }).click();
  await panel.getByText("2 αιτήματα χωρίς ανάθεση.", { exact: true }).waitFor();
  await panel.getByRole("button", { name: "Προβολή χωρίς ανάθεση" }).click();
  const queueIds = await page.locator("aside").first().getByText(/^REQ-/).allTextContents();
  if (queueIds.join(",") !== "REQ-258071,REQ-258063") {
    throw new Error(`Civic unassigned filter returned: ${queueIds.join(",")}`);
  }
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).click();
  await panel.getByRole("button", { name: "Τι προέχει;", exact: true }).click();
  await page.screenshot({ path: reportPath("civic-dispatch-lisa-desktop.png"), fullPage: true });
  if ((await page.getByRole("button", { name: "Αποστολή στο πεδίο" }).count()) !== 1) {
    throw new Error("Civic Lisa changed the selected request stage");
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  if ((await page.locator("[data-lisa-panel]").count()) !== 0) throw new Error("Civic Lisa did not close with Escape");
  await assertNoOverflow(page, "Civic desktop");
  if (errors.length) throw new Error(`Civic desktop errors:\n${errors.join("\n")}`);
  await page.close();
}

async function verifyFleetDesktop() {
  const { page, errors } = await createPage({ width: 1440, height: 960 });
  await gotoApp(page, "/fleet-management?verify=lisa-desktop");
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).click();
  const panel = page.locator("[data-lisa-panel]");
  await panel.getByRole("button", { name: "Προσωπικό", exact: true }).click();
  await panel.getByText(/3 θέματα προσωπικού χρειάζονται κάλυψη/).waitFor();
  await page.screenshot({ path: reportPath("fleet-management-lisa-unified-desktop.png"), fullPage: true });
  await panel.getByRole("button", { name: "Άνοιγμα προσωπικού" }).click();
  await page.waitForTimeout(250);
  const staffNavigation = page.getByRole("button", { name: "Προσωπικό", exact: true }).first();
  if (!(await staffNavigation.getAttribute("class"))?.includes("bg-white/12")) {
    throw new Error("Fleet Lisa did not navigate to Personnel");
  }
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).click();
  await page.getByPlaceholder("Ρώτα τη Lisa...").fill("μπορείς να κάνεις αλλαγή;");
  await page.getByRole("button", { name: "Αποστολή μηνύματος στη Lisa" }).click();
  await page.getByText(/Δεν αλλάζω αναθέσεις, ετοιμότητα ή αποφάσεις αποδέσμευσης/).waitFor();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  if ((await page.locator("[data-lisa-panel]").count()) !== 0) throw new Error("Fleet Lisa did not close with Escape");
  await assertNoOverflow(page, "Fleet desktop");
  if (errors.length) throw new Error(`Fleet desktop errors:\n${errors.join("\n")}`);
  await page.close();
}

async function verifyMobile(path, screenshotName, label) {
  const { page, errors } = await createPage({ width: 390, height: 844 });
  await gotoApp(page, path);
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).click();
  await page.locator("[data-lisa-panel]").waitFor();
  await page.waitForTimeout(250);
  await page.screenshot({ path: reportPath(screenshotName), fullPage: false });
  await assertNoOverflow(page, label);
  if (errors.length) throw new Error(`${label} errors:\n${errors.join("\n")}`);
  await page.close();
}

try {
  await verifyCivicDesktop();
  await verifyFleetDesktop();
  await verifyMobile("/civic-dispatch?verify=lisa-mobile", "civic-dispatch-lisa-mobile.png", "Civic mobile");
  await verifyMobile("/fleet-management?verify=lisa-mobile", "fleet-management-lisa-unified-mobile.png", "Fleet mobile");
  console.log("Lisa verification passed for Civic Dispatch and Fleet Management.");
} finally {
  await browser.close();
}
