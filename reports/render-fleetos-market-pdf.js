const path = require("path");
const { chromium } = require("playwright");

async function main() {
  const htmlPath = path.resolve(__dirname, "fleetos-ai-greece-market-research.html");
  const pdfPath = path.resolve(
    process.env.HOME,
    "Desktop",
    "FleetOS_AI_Greece_Market_Research.pdf"
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1240, height: 1754 },
    deviceScaleFactor: 1,
  });

  await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "0", right: "0", bottom: "0", left: "0" },
  });

  await browser.close();
  console.log(pdfPath);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
