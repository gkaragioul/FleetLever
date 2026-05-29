const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const input = path.resolve(__dirname, 'fleetos-domain-name-research.html');
  const output = path.resolve('/Users/example/Desktop/FleetOS_Domain_Name_Research.pdf');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  await page.goto(`file://${input}`, { waitUntil: 'networkidle' });
  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-family: Inter, Arial, sans-serif; font-size: 8px; width: 100%; color: #6b7280; padding: 0 13mm; display: flex; justify-content: space-between;">
        <span>FleetOS AI - Domain and Brand Name Research</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
    margin: { top: '15mm', right: '13mm', bottom: '16mm', left: '13mm' }
  });
  await browser.close();
  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
