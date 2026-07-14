import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();

async function source(relativePath) {
  return readFile(path.join(root, relativePath), "utf8").catch(() => "");
}

const files = {
  landing: await source("src/app/landing/page.tsx"),
  pricing: await source("src/app/pricing/page.tsx"),
  shell: await source("src/components/fleetlever/commercial-site-shell.tsx"),
  lanes: await source("src/components/fleetlever/readiness-lanes.tsx"),
  lanesStyles: await source("src/components/fleetlever/readiness-lanes.module.css"),
  walkthrough: await source("src/components/fleetlever/product-walkthrough.tsx"),
  demoPage: await source("src/app/request-demo/page.tsx"),
  demoForm: await source("src/components/fleetlever/demo-request-form.tsx"),
  demoApi: await source("src/app/api/commercial/demo-request/route.ts"),
  demoValidation: await source("src/lib/commercial/demo-request-validation.ts"),
  analytics: await source("src/components/fleetlever/commercial-analytics.tsx"),
  analyticsApi: await source("src/app/api/commercial/events/route.ts"),
  privacy: await source("src/app/privacy/page.tsx"),
  terms: await source("src/app/terms/page.tsx"),
  security: await source("src/app/security/page.tsx"),
  layout: await source("src/app/layout.tsx"),
  sitemap: await source("src/app/sitemap.ts"),
  robots: await source("src/app/robots.ts"),
  proxy: await source("src/proxy.ts"),
  openGraph: await source("src/app/opengraph-image.tsx"),
  notFound: await source("src/app/not-found.tsx"),
};

const failures = [];

function requireTokens(fileName, tokens) {
  const content = files[fileName];
  for (const token of tokens) {
    if (!content.includes(token)) failures.push(`${fileName} is missing: ${token}`);
  }
}

requireTokens("landing", [
  "Know what can go out next. And what cannot.",
  "Fleet and equipment readiness",
  "ProductWalkthrough",
  "ReadinessLanes",
  "What the pilot measures",
  "Construction and heavy equipment",
  "Equipment rental",
  "Municipal and public works",
  "Specialist and service fleets",
  "Broader assets. One narrow decision.",
  'id="product"',
  'id="for-whom"',
  "/fleetlever/site/hero-photos/site-crew-crane.jpg",
]);

requireTokens("pricing", [
  "Start with 30 days, not an annual leap of faith.",
  "Single Team",
  "Operations",
  "Enterprise",
  "Up to 30 active assets",
  "Up to 100 active assets",
  "Additional block of 25 assets",
  "credited against the first annual agreement",
  "Implementation and expansion",
  "Commercial terms",
]);

requireTokens("shell", [
  'demoHref = "/request-demo"',
  "How it works",
  "Product",
  "Who it is for",
  "Pricing",
  "Request a demo",
  "Menu",
  "/privacy",
  "/terms",
  "/security",
]);

requireTokens("lanes", [
  "One route to the next assignment",
  "CR-04 stops here, not on site.",
  "Documents",
  "Maintenance",
  "Operator",
  "Evidence",
]);

requireTokens("lanesStyles", ["prefers-reduced-motion: reduce"]);

requireTokens("walkthrough", [
  "Action queue",
  "Asset passport",
  "Decision history",
  "aria-selected",
]);

requireTokens("demoPage", ["Request a FleetLever demo", "CommercialSiteHeader"]);
requireTokens("demoForm", [
  "Work email",
  "Fleet or equipment size",
  "What should FleetLever help you prevent?",
  "/api/commercial/demo-request",
  "Request demo",
]);
requireTokens("demoApi", ["validateDemoRequest", "commercial_demo_requests", "honeypot"]);
requireTokens("demoValidation", ["export function validateDemoRequest", "Enter a valid work email.", "Select a fleet size."]);
requireTokens("analytics", ["fleetlever:track", "/api/commercial/events", "data-analytics"]);
requireTokens("analyticsApi", ["commercial_events", "console.info"]);
requireTokens("privacy", ["Privacy", "cookie-free", "demo request"]);
requireTokens("terms", ["Terms of use", "FleetLever"]);
requireTokens("security", ["Security", "access control", "evidence"]);

requireTokens("layout", [
  'lang={edition === "site" ? "en" : "el"}',
  "Prevent expensive fleet downtime",
  'locale: "en_GB"',
]);
requireTokens("sitemap", ["/pricing", "/request-demo", "/privacy", "/terms", "/security"]);
requireTokens("proxy", ["/request-demo", "/privacy", "/terms", "/security", "pathname === \"/landing\""]);
requireTokens("openGraph", ["Know what can go out next. And what cannot."]);
requireTokens("notFound", ["Page not found", 'edition === "site"']);

const englishCommercialFiles = [
  "landing",
  "pricing",
  "shell",
  "lanes",
  "walkthrough",
  "demoPage",
  "demoForm",
  "privacy",
  "terms",
  "security",
  "openGraph",
];

for (const fileName of englishCommercialFiles) {
  if (/[Ͱ-Ͽἀ-῿]/u.test(files[fileName])) {
    failures.push(`${fileName} still contains Greek copy`);
  }
}

for (const fileName of ["landing", "pricing", "shell"]) {
  if (files[fileName].includes("mailto:") && !files[fileName].includes("mailto:hello@fleetlever.com")) {
    failures.push(`${fileName} contains a mailto conversion CTA`);
  }
}

if (!files.landing.includes('type="application/ld+json"')) {
  failures.push("landing is missing structured product data");
}

if (!files.proxy.includes("NextResponse.redirect")) {
  failures.push("/landing is not canonicalized with a redirect");
}

if (!files.robots.includes("getFleetLeverEdition") || !files.robots.includes('disallow: "/"')) {
  failures.push("application editions are not excluded from search indexing");
}

if (failures.length > 0) {
  console.error(`FAIL commercial site contract\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("PASS commercial site contract");
