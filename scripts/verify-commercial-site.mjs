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
  demoLauncher: await source("src/components/fleetlever/public-demo-launcher.tsx"),
  demoWorkspace: await source("src/components/fleetlever/public-demo-workspace.tsx"),
  demoStore: await source("src/lib/commercial/demo-session-store.ts"),
  demoSessionApi: await source("src/app/api/commercial/demo-sessions/route.ts"),
  demoStateApi: await source("src/app/api/commercial/demo-sessions/[sessionId]/state/route.ts"),
  demoRoute: await source("src/app/try/[sessionId]/page.tsx"),
  lanes: await source("src/components/fleetlever/readiness-lanes.tsx"),
  lanesStyles: await source("src/components/fleetlever/readiness-lanes.module.css"),
  preMorning: await source("src/components/fleetlever/pre-morning-timeline.tsx"),
  preMorningStyles: await source("src/components/fleetlever/pre-morning-timeline.module.css"),
  passport: await source("src/components/fleetlever/machine-passport-assembly.tsx"),
  passportStyles: await source("src/components/fleetlever/machine-passport-assembly.module.css"),
  inventoryStrip: await source("src/components/fleetlever/fleet-inventory-strip.tsx"),
  inventoryStripStyles: await source("src/components/fleetlever/fleet-inventory-strip.module.css"),
  serviceStrip: await source("src/components/fleetlever/service-kanban-strip.tsx"),
  serviceStripStyles: await source("src/components/fleetlever/service-kanban-strip.module.css"),
  industrySwitchboard: await source("src/components/fleetlever/industry-switchboard.tsx"),
  industrySwitchboardStyles: await source("src/components/fleetlever/industry-switchboard.module.css"),
  multiIndustryHero: await source("src/components/fleetlever/multi-industry-hero.tsx"),
  multiIndustryHeroStyles: await source("src/components/fleetlever/multi-industry-hero.module.css"),
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
  "ProductScreenshot",
  "ReadinessLanes",
  "PreMorningTimeline",
  "MachinePassportAssembly",
  "FleetInventoryStrip",
  "ServiceKanbanStrip",
  "IndustrySwitchboard",
  "MultiIndustryHero",
  "One board shows what can go out next.",
  "From blocker to auditable release.",
  "Every blocker gets an owner.",
  "Every release remains traceable.",
  "Readiness at cutoff",
  "Failed releases prevented",
  'id="product"',
  'id="how-it-works"',
  "/fleetlever/site/tomorrow-readiness-dashboard.png",
  "/fleetlever/site/stop-list.png",
  "/fleetlever/site/decision-history-audit-trail.png",
]);

requireTokens("multiIndustryHero", [
  'data-animation="multi-industry-hero"',
  "/fleetlever/site/hero-photos/site-crew-crane.jpg",
  "/fleetlever/site/industries/equipment-rental.jpg",
  "/fleetlever/municipal-real/aporrimmatofora-1.jpg",
  "/fleetlever/site/industries/service-fleet.jpg",
]);

requireTokens("multiIndustryHeroStyles", [
  "mask-image",
  "heroPanelDrift",
  "prefers-reduced-motion: reduce",
]);

requireTokens("pricing", [
  "Start with proof. Scale with the operation.",
  "Single Team",
  "Operations",
  "Enterprise",
  "Up to 30 active assets",
  "Up to 100 active assets",
  "Additional block of 25 assets",
  "credited against the first annual agreement",
  "Included in every annual plan",
  "What changes the price",
  "Launch",
  "Expand",
  "Integrate",
  "Commercial terms",
]);

requireTokens("shell", [
  "How it works",
  "Product",
  "Use cases",
  "Pricing",
  "Try the app",
  "PublicDemoLauncher",
  "Menu",
  "/privacy",
  "/terms",
  "/security",
]);

requireTokens("demoLauncher", [
  "Your 10-hour FleetLever workspace",
  "Create demo workspace",
  "Copy share link",
  "Open full screen",
  "backdrop-blur",
  'role="dialog"',
]);

requireTokens("demoWorkspace", [
  "Demo workspace",
  "This workspace expires in",
  "Copy share link",
  "ConstructionPrototype",
]);

requireTokens("demoStore", [
  "DEMO_SESSION_TTL_MS",
  "10 * 60 * 60 * 1000",
  "cleanupExpiredDemoSessions",
  "expiresAt",
  "randomUUID",
]);

requireTokens("demoSessionApi", ["createDemoSession", "expiresAt", "shareUrl"]);
requireTokens("demoStateApi", ["readDemoSession", "writeDemoSessionSnapshot", "expired"]);
requireTokens("demoRoute", ["readDemoSession", "PublicDemoWorkspace", "DemoExpiredState"]);

requireTokens("lanes", [
  "Set the plan",
  "Every next assignment enters one release flow.",
  "FleetLever stops CR-04 before the site.",
  "Every asset leaves, waits or gets replaced.",
  "Documents",
  "Maintenance",
  "Operator",
  "Evidence",
]);

requireTokens("lanesStyles", ["min-height: 160svh", "prefers-reduced-motion: reduce"]);

requireTokens("preMorning", [
  "Act before the cutoff",
  "A blocker becomes a decision before morning.",
  "One asset. One evening.",
  "The shift starts without surprises.",
  "TIMELINE_STAGE_BREAKPOINTS = [0.12, 0.35, 0.58, 0.81]",
  "requestAnimationFrame",
  "getBoundingClientRect",
  "data-scroll-stage",
]);

requireTokens("preMorningStyles", [
  "min-height: 190svh",
  "position: sticky",
  "--timeline-progress",
  "data-scroll-stage",
  "--event-offset",
  "prefers-reduced-motion: reduce",
]);

requireTokens("passport", [
  "Asset passport",
  "Every requirement stays with the asset.",
  "No evidence, no release.",
  "Ready for release",
  "Full decision history",
  "PASSPORT_STAGE_BREAKPOINTS = [0.34, 0.72]",
  "requestAnimationFrame",
  "getBoundingClientRect",
]);

requireTokens("passportStyles", ["min-height: 220svh", "position: sticky", "prefers-reduced-motion: reduce"]);

if (files.passport.includes("setTimeout")) {
  failures.push("passport animation is still timer-driven instead of scroll-driven");
}

requireTokens("inventoryStrip", [
  'data-animation="fleet-inventory"',
  "Fleet inventory",
  "Every machine, sorted by what needs attention.",
  "Blocked",
  "Review",
  "Ready",
  "data-inventory-focus",
  "prefers-reduced-motion: reduce",
]);
requireTokens("inventoryStripStyles", ["grid-template-columns", "data-focus", "prefers-reduced-motion: reduce"]);

requireTokens("serviceStrip", [
  'data-animation="service-kanban"',
  "A new way to manage service",
  "Manage service as a flow, not a list.",
  "Queued",
  "In service",
  "Cleared",
  "KANBAN_STAGE_DURATION = 3600",
  "KANBAN_QUEUE_DURATION = 1800",
  "MousePointer2",
  "data-service-stage",
  "visibilitychange",
  "prefers-reduced-motion: reduce",
]);
requireTokens("serviceStripStyles", ["dragToService", "cardLiftToService", "cursorToService", "data-stage", "prefers-reduced-motion: reduce"]);

requireTokens("industrySwitchboard", [
  'data-animation="industry-switchboard"',
  "One control loop. Four operating worlds.",
  "Built for the moment before any fleet goes out.",
  "The assets change. The release decision does not.",
  "Construction and heavy equipment",
  "Equipment rental",
  "Municipal and public works",
  "Specialist and service fleets",
  "INDUSTRY_ROTATION_MS = 5800",
  'id="for-whom"',
  "aria-expanded",
  'role="region"',
  "visibilitychange",
]);
requireTokens("industrySwitchboardStyles", [
  ".drawers",
  "flex-grow",
  "prefers-reduced-motion: reduce",
  "@media (max-width: 760px)",
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
  "preMorning",
  "passport",
  "inventoryStrip",
  "serviceStrip",
  "industrySwitchboard",
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

if (files.landing.includes("The decision has the evidence behind it.")) {
  failures.push("landing still repeats the old evidence headline");
}

if (files.landing.includes("const useCases")) {
  failures.push("landing still contains the old flat industry list");
}

const productNavIndex = files.shell.indexOf('["Product", "/#product"]');
const howNavIndex = files.shell.indexOf('["How it works", "/#how-it-works"]');
if (productNavIndex < 0 || howNavIndex < 0 || productNavIndex > howNavIndex) {
  failures.push("shell navigation does not lead with Product before How it works");
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
