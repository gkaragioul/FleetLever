import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const [landing, pricing, shell] = await Promise.all([
  readFile(path.join(root, "src", "app", "landing", "page.tsx"), "utf8"),
  readFile(path.join(root, "src", "app", "pricing", "page.tsx"), "utf8"),
  readFile(path.join(root, "src", "components", "fleetlever", "commercial-site-shell.tsx"), "utf8").catch(() => ""),
]);

const requiredLandingTokens = [
  "/fleetlever/site/hero-photos/site-crew-crane.jpg",
  "Ξέρεις τι μπορεί να βγει αύριο. Και τι όχι.",
  "/fleetlever/site/tomorrow-readiness-dashboard.png",
  "/fleetlever/site/stop-list.png",
  "/fleetlever/site/machine-passport-drawer.png",
  "/fleetlever/site/decision-history-audit-trail.png",
  "Δεν αντικαθιστά το ERP σας.",
  "30 ημέρες με τον πραγματικό σας στόλο.",
  "CommercialSiteHeader",
  "CommercialSiteFooter",
];

const requiredPricingTokens = [
  "30 ημέρες με τον πραγματικό σας στόλο.",
  "Έως 30 κρίσιμα μηχανήματα",
  "Μετά το pilot",
  "CommercialSiteHeader",
  "CommercialSiteFooter",
];

const requiredShellTokens = [
  "NEXT_PUBLIC_FLEETLEVER_CONSOLE_URL",
  "http://127.0.0.1:3001/login",
  "Ζήτησε demo",
  "Πώς λειτουργεί",
  "Τιμές",
];

const failures = [];

for (const token of requiredLandingTokens) {
  if (!landing.includes(token)) failures.push(`landing is missing: ${token}`);
}

for (const token of requiredPricingTokens) {
  if (!pricing.includes(token)) failures.push(`pricing is missing: ${token}`);
}

for (const token of requiredShellTokens) {
  if (!shell.includes(token)) failures.push(`commercial shell is missing: ${token}`);
}

for (const [name, source] of [["landing", landing], ["pricing", pricing], ["shell", shell]]) {
  if (source.includes("Ζήτησε Demo") || source.includes("Ζητήστε demo") || source.includes("Ξεκινήστε Pilot")) {
    failures.push(`${name} contains an inconsistent primary CTA`);
  }
}

if (landing.includes("const landingCopy")) {
  failures.push("landing still carries the unused bilingual copy payload");
}

if (failures.length > 0) {
  console.error(`FAIL commercial site contract\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("PASS commercial site contract");
