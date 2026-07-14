import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const [
  landing,
  pricing,
  shell,
  readinessLanes,
  readinessLanesStyles,
  passportAssembly,
  passportAssemblyStyles,
  preMorningTimeline,
  preMorningTimelineStyles,
  sitemap,
  robots,
] = await Promise.all([
  readFile(path.join(root, "src", "app", "landing", "page.tsx"), "utf8"),
  readFile(path.join(root, "src", "app", "pricing", "page.tsx"), "utf8"),
  readFile(path.join(root, "src", "components", "fleetlever", "commercial-site-shell.tsx"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "components", "fleetlever", "readiness-lanes.tsx"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "components", "fleetlever", "readiness-lanes.module.css"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "components", "fleetlever", "machine-passport-assembly.tsx"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "components", "fleetlever", "machine-passport-assembly.module.css"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "components", "fleetlever", "pre-morning-timeline.tsx"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "components", "fleetlever", "pre-morning-timeline.module.css"), "utf8").catch(() => ""),
  readFile(path.join(root, "src", "app", "sitemap.ts"), "utf8"),
  readFile(path.join(root, "src", "app", "robots.ts"), "utf8"),
]);

const requiredLandingTokens = [
  "/fleetlever/site/hero-photos/site-crew-crane.jpg",
  "Ξέρεις τι μπορεί να βγει αύριο. Και τι όχι.",
  "/fleetlever/site/tomorrow-readiness-dashboard.png",
  "/fleetlever/site/stop-list.png",
  "/fleetlever/site/decision-history-audit-trail.png",
  "Δεν αντικαθιστά το ERP σας.",
  "30 ημέρες με τον πραγματικό σας στόλο.",
  "ReadinessLanes",
  "MachinePassportAssembly",
  "PreMorningTimeline",
  "CommercialSiteHeader",
  "CommercialSiteFooter",
];

const requiredReadinessTokens = [
  "Η διαδρομή προς το αύριο",
  "Το CR-04 σταματά εδώ, όχι στο εργοτάξιο.",
  "IntersectionObserver",
  "prefers-reduced-motion: reduce",
];

const requiredPassportAssemblyTokens = [
  "Ο φάκελος συναρμολογείται μπροστά σου.",
  "Χωρίς απόδειξη, δεν υπάρχει αποδέσμευση.",
  "Έτοιμο για αποδέσμευση.",
  "/fleetlever/site/machine-passport-drawer.png",
  "IntersectionObserver",
  "prefers-reduced-motion: reduce",
];

const requiredPreMorningTimelineTokens = [
  "Η αυριανή βάρδια κρίνεται από σήμερα.",
  "Η βάρδια ανοίγει χωρίς εκπλήξεις.",
  "17:20",
  "17:32",
  "18:05",
  "05:45",
  "IntersectionObserver",
  "prefers-reduced-motion: reduce",
];

const requiredPricingTokens = [
  "30 ημέρες με τον πραγματικό σας στόλο.",
  "Έως 30 κρίσιμα μηχανήματα",
  "Μετά το pilot",
  "CommercialSiteHeader",
  "CommercialSiteFooter",
];

requiredPricingTokens.push(
  "Founding Pilot",
  "€6.000 / έτος",
  "€12.000 / έτος",
  "Από €24.000 / έτος",
  "€1.500 εφάπαξ",
  "€3.000 εφάπαξ",
  "Επιπλέον επιχειρησιακή μονάδα",
  "12μηνη συμφωνία",
  "15 ημερών",
);

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

for (const token of requiredReadinessTokens) {
  if (!readinessLanes.includes(token) && !readinessLanesStyles.includes(token)) {
    failures.push(`readiness lanes are missing: ${token}`);
  }
}

for (const token of requiredPassportAssemblyTokens) {
  if (!passportAssembly.includes(token) && !passportAssemblyStyles.includes(token)) {
    failures.push(`machine passport assembly is missing: ${token}`);
  }
}

for (const token of requiredPreMorningTimelineTokens) {
  if (!preMorningTimeline.includes(token) && !preMorningTimelineStyles.includes(token)) {
    failures.push(`pre-morning timeline is missing: ${token}`);
  }
}

for (const [name, source] of [["landing", landing], ["pricing", pricing], ["shell", shell]]) {
  if (source.includes("Ζήτησε Demo") || source.includes("Ζητήστε demo") || source.includes("Ξεκινήστε Pilot")) {
    failures.push(`${name} contains an inconsistent primary CTA`);
  }
}

if (landing.includes("const landingCopy")) {
  failures.push("landing still carries the unused bilingual copy payload");
}

if (!sitemap.includes("getFleetLeverEdition") || !sitemap.includes('`${siteUrl}/pricing`') || sitemap.includes('`${siteUrl}/console`')) {
  failures.push("sitemap is not isolated to public commercial routes");
}

if (!robots.includes("getFleetLeverEdition") || !robots.includes('disallow: "/"')) {
  failures.push("application editions are not excluded from search indexing");
}

if (failures.length > 0) {
  console.error(`FAIL commercial site contract\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("PASS commercial site contract");
