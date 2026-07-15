import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const origin = process.env.FLEETLEVER_SITE_URL ?? "http://127.0.0.1:3002";
const outputDir = path.join(process.cwd(), "artifacts", "verification");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];

async function settleImages(page) {
  await page.evaluate(async () => {
    const step = Math.max(360, Math.floor(window.innerHeight * 0.7));
    const max = document.documentElement.scrollHeight;
    for (let top = 0; top <= max; top += step) {
      window.scrollTo(0, top);
      await new Promise((resolve) => window.setTimeout(resolve, 35));
    }
    window.scrollTo(0, 0);
  });

  await page
    .waitForFunction(
      () =>
        Array.from(document.images).every(
          (image) => image.complete || image.loading === "lazy" || image.getAttribute("src")?.startsWith("data:"),
        ),
      null,
      { timeout: 10_000 },
    )
    .catch(() => undefined);
}

function summarizeAccessibility(name, violations) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .slice(0, 6)
        .map((node) => {
          const target = node.target.join(" ");
          const summary = (node.failureSummary ?? "").replace(/\s+/g, " ").trim();
          return `${target}${summary ? `: ${summary}` : ""}`;
        })
        .join(" || ");
      return `${name}: ${violation.id} (${violation.nodes.length}) ${nodes}`;
    })
    .join("\n- ");
}

async function verifyHowItWorksInset(page, name, minimumInset) {
  const layout = await page.locator("#how-it-works section > div").evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: window.innerWidth - rect.right,
    };
  });

  if (layout.left < minimumInset || layout.right < minimumInset) {
    failures.push(
      `${name}: How it works content touches the viewport edges (${layout.left}px left, ${layout.right}px right)`,
    );
  }
}

async function verifyAlternatingSectionBackgrounds(page, name) {
  const sections = await page.locator("[data-section-tone]").evaluateAll((elements) =>
    elements.map((element) => ({
      tone: element.getAttribute("data-section-tone"),
      background: getComputedStyle(element).backgroundColor,
    })),
  );
  const expected = [
    { tone: "mist", background: "rgb(237, 242, 238)" },
    { tone: "white", background: "rgb(255, 255, 255)" },
    { tone: "mist", background: "rgb(237, 242, 238)" },
    { tone: "white", background: "rgb(255, 255, 255)" },
    { tone: "mist", background: "rgb(237, 242, 238)" },
    { tone: "white", background: "rgb(255, 255, 255)" },
    { tone: "mist", background: "rgb(237, 242, 238)" },
  ];

  if (JSON.stringify(sections) !== JSON.stringify(expected)) {
    failures.push(`${name}: section backgrounds do not alternate mist/white (${JSON.stringify(sections)})`);
  }
}

async function verifyHomepageStory(page, name) {
  const story = [
    "Every next assignment enters one release flow.",
    "One board shows what can go out next.",
    "Every machine, sorted by what needs attention.",
    "Manage service as a flow, not a list.",
    "A blocker becomes a decision before morning.",
    "From blocker to auditable release.",
    "Built for the moment before any fleet goes out.",
    "Use your fleet. Measure what changes before morning.",
  ];
  const body = ((await page.locator("body").textContent()) ?? "").replace(/\s+/g, " ");
  let previous = -1;

  for (const chapter of story) {
    const index = body.indexOf(chapter);
    if (index < 0) {
      failures.push(`${name}: missing story chapter ${chapter}`);
      continue;
    }
    if (index <= previous) failures.push(`${name}: story chapter is out of order ${chapter}`);
    previous = index;
  }

  const headings = await page.locator("h1, h2, h3").allTextContents();
  const normalized = headings.map((heading) => heading.replace(/\s+/g, " ").trim()).filter(Boolean);
  const duplicates = normalized.filter((heading, index) => normalized.indexOf(heading) !== index);
  if (duplicates.length > 0) failures.push(`${name}: duplicate headings ${[...new Set(duplicates)].join(" | ")}`);
}

async function verifyServiceKanbanMotion(page, name) {
  const board = page.locator('[data-animation="service-kanban"]');
  await board.scrollIntoViewIfNeeded();
  await board.waitFor({ state: "visible", timeout: 5_000 });

  await board.hover();
  const pausedStage = await board.getAttribute("data-service-stage");
  await page.waitForTimeout(3_600);
  const stageAfterPause = await board.getAttribute("data-service-stage");
  if (pausedStage !== stageAfterPause) failures.push(`${name}: service Kanban did not pause on hover`);

  await page.mouse.move(4, 4);
  await page.waitForFunction(
    ({ selector, stage }) => document.querySelector(selector)?.getAttribute("data-service-stage") !== stage,
    { selector: '[data-animation="service-kanban"]', stage: stageAfterPause },
    { timeout: 5_000 },
  ).catch(() => failures.push(`${name}: service Kanban did not advance after interaction ended`));

  if ((await board.getAttribute("data-service-stage")) === "queued") {
    await page.waitForFunction(
      () => document.querySelector('[data-animation="service-kanban"]')?.getAttribute("data-service-stage") === "in-service",
      null,
      { timeout: 2_500 },
    );
  }

  await page.waitForTimeout(560);
  const dragState = await board.evaluate((section) => {
    const boardWindow = section.querySelector("[data-stage]");
    const card = section.querySelector("[data-service-drag-card]");
    const cursor = section.querySelector("[data-service-cursor]");
    const lane = section.querySelector("[data-lane]");
    const boardRect = boardWindow?.getBoundingClientRect();
    const cardRect = card?.getBoundingClientRect();
    const laneRect = lane?.getBoundingClientRect();
    return {
      cardWidth: cardRect?.width ?? 0,
      laneWidth: laneRect?.width ?? 0,
      cursorOpacity: cursor ? Number.parseFloat(getComputedStyle(cursor).opacity) : 0,
      contained: Boolean(
        boardRect &&
          cardRect &&
          cardRect.left >= boardRect.left - 2 &&
          cardRect.right <= boardRect.right + 2 &&
          cardRect.top >= boardRect.top - 2 &&
          cardRect.bottom <= boardRect.bottom + 2,
      ),
    };
  });

  if (dragState.cardWidth < dragState.laneWidth * 0.75) {
    failures.push(`${name}: dragged service card collapsed inside its lane`);
  }
  if (dragState.cursorOpacity < 0.25) failures.push(`${name}: service drag cursor is not visible`);
  if (!dragState.contained) failures.push(`${name}: dragged service card escaped the Kanban board`);
}

async function verifyIndustrySwitchboardMotion(page, name) {
  const switchboard = page.locator('[data-animation="industry-switchboard"]');
  await switchboard.scrollIntoViewIfNeeded();
  await switchboard.waitFor({ state: "visible", timeout: 5_000 });

  await page.getByRole("button", { name: /Equipment rental/i }).click();
  if ((await switchboard.getAttribute("data-industry-active")) !== "rental") {
    failures.push(`${name}: Equipment rental drawer did not open on selection`);
  }

  await switchboard.hover();
  const pausedIndustry = await switchboard.getAttribute("data-industry-active");
  await page.waitForTimeout(6_200);
  const industryAfterPause = await switchboard.getAttribute("data-industry-active");
  if (pausedIndustry !== industryAfterPause) failures.push(`${name}: industry switchboard did not pause on hover`);

  await page.mouse.move(4, 4);
  await page.waitForFunction(
    ({ selector, active }) => document.querySelector(selector)?.getAttribute("data-industry-active") !== active,
    { selector: '[data-animation="industry-switchboard"]', active: industryAfterPause },
    { timeout: 7_000 },
  ).catch(() => failures.push(`${name}: industry switchboard did not resume after interaction ended`));
}

async function verifyCutoffTimelineScroll(page, name) {
  const section = page.locator('[data-animation="cutoff-timeline"]');
  await section.scrollIntoViewIfNeeded();
  await section.waitFor({ state: "visible", timeout: 5_000 });

  const metrics = await section.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      top: window.scrollY + rect.top,
      travel: Math.max(1, rect.height - window.innerHeight),
    };
  });

  await page.evaluate(({ top }) => window.scrollTo(0, Math.max(0, top - 48)), metrics);
  await page.waitForTimeout(200);
  const startStage = Number(await section.getAttribute("data-scroll-stage"));

  await page.evaluate(({ top, travel }) => window.scrollTo(0, top + travel * 0.96), metrics);
  await page.waitForTimeout(250);
  const endStage = Number(await section.getAttribute("data-scroll-stage"));
  if (endStage < 4) failures.push(`${name}: cutoff timeline did not reveal all stages (${startStage} -> ${endStage})`);

  const fullyRevealedEvents = await section.locator("[data-timeline-event]").evaluateAll((events) =>
    events.every(
      (event) =>
        event.style.getPropertyValue("--event-visibility") === "visible" &&
        event.style.getPropertyValue("--event-offset") === "0.00px",
    ),
  );
  if (!fullyRevealedEvents) failures.push(`${name}: cutoff timeline bullets did not finish their scroll reveal`);

  await page.evaluate(({ top, travel }) => window.scrollTo(0, top + travel * 0.18), metrics);
  await page.waitForTimeout(250);
  const reverseStage = Number(await section.getAttribute("data-scroll-stage"));
  if (reverseStage >= endStage) {
    failures.push(`${name}: cutoff timeline did not reverse while scrolling up (${endStage} -> ${reverseStage})`);
  }

  const reversedLastEvent = await section.locator("[data-timeline-event]").last().evaluate((event) => ({
    offset: event.style.getPropertyValue("--event-offset"),
    visibility: event.style.getPropertyValue("--event-visibility"),
  }));
  if (reversedLastEvent.offset === "0.00px" || reversedLastEvent.visibility !== "hidden") {
    failures.push(`${name}: cutoff timeline bullet motion did not scrub backward`);
  }
}

async function verifyReducedMotionKanban() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const board = page.locator('[data-animation="service-kanban"]');
    await board.waitFor({ state: "visible", timeout: 10_000 });
    await page.waitForFunction(
      () => document.querySelector('[data-animation="service-kanban"]')?.getAttribute("data-service-stage") === "cleared",
      null,
      { timeout: 5_000 },
    );
    const before = await board.getAttribute("data-service-stage");
    await page.waitForTimeout(3_600);
    const after = await board.getAttribute("data-service-stage");
    if (before !== "cleared" || after !== "cleared") {
      failures.push(`reduced motion: service Kanban should remain cleared, received ${before} -> ${after}`);
    }

    const switchboard = page.locator('[data-animation="industry-switchboard"]');
    await switchboard.scrollIntoViewIfNeeded();
    const industryBefore = await switchboard.getAttribute("data-industry-active");
    await page.waitForTimeout(6_200);
    const industryAfter = await switchboard.getAttribute("data-industry-active");
    if (industryBefore !== "construction" || industryAfter !== "construction") {
      failures.push(
        `reduced motion: industry switchboard should remain construction, received ${industryBefore} -> ${industryAfter}`,
      );
    }
  } finally {
    await context.close();
  }
}

async function verifyMobileProductFocus(page, name) {
  const preview = page.getByRole("button", {
    name: /Open larger image: FleetLever tomorrow-readiness board/,
  });
  const metrics = await preview.evaluate((button) => {
    const image = button.querySelector("img");
    if (!image) return null;
    return {
      buttonWidth: button.getBoundingClientRect().width,
      imageWidth: image.getBoundingClientRect().width,
    };
  });

  if (!metrics || metrics.imageWidth < metrics.buttonWidth * 1.35) {
    failures.push(`${name}: primary product screenshot is not focused for mobile`);
  }
}

async function verifyPage({ name, pathname, viewport, required, screenshot, maxHeight, interact }) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const consoleErrors = [];
  const failedAssets = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    const type = response.request().resourceType();
    if (response.status() >= 400 && ["image", "stylesheet", "script"].includes(type)) {
      failedAssets.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${origin}${pathname}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("domcontentloaded", { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(250);
    await page.locator("#main-content").waitFor({ state: "visible", timeout: 20_000 });
    await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" }).catch(() => undefined);
    await page
      .evaluate(() => ("fonts" in document ? document.fonts.ready.then(() => true) : true))
      .catch(() => undefined);

    if (interact) await interact(page);
    await settleImages(page);

    const text = (await page.locator("body").textContent()) ?? "";
    const normalized = text.toLocaleLowerCase("en-GB");
    const lang = await page.locator("html").getAttribute("lang");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    const overlay = await page.locator("[data-nextjs-dialog], #nextjs__container_errors_desc").count();
    const brokenImages = await page.locator("img").evaluateAll((images) =>
      images
        .filter((image) => image.complete && image.naturalWidth === 0)
        .map((image) => image.currentSrc || image.getAttribute("src")),
    );

    for (const token of required) {
      if (!normalized.includes(token.toLocaleLowerCase("en-GB"))) failures.push(`${name}: missing visible token ${token}`);
    }
    if (lang !== "en") failures.push(`${name}: html lang is ${lang ?? "missing"}, expected en`);
    if (/[Ͱ-Ͽἀ-῿]/u.test(text)) failures.push(`${name}: visible Greek copy remains`);
    if (overlay > 0) failures.push(`${name}: Next.js error overlay is visible`);
    if (overflow > 1) failures.push(`${name}: horizontal overflow of ${overflow}px`);
    if (maxHeight && height > maxHeight) failures.push(`${name}: page height ${height}px exceeds ${maxHeight}px`);
    if (consoleErrors.length > 0) failures.push(`${name}: console errors: ${consoleErrors.join(" | ")}`);
    if (failedAssets.length > 0) failures.push(`${name}: failed assets: ${failedAssets.join(" | ")}`);
    if (brokenImages.length > 0) failures.push(`${name}: broken images: ${brokenImages.join(" | ")}`);

    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const serious = accessibility.violations.filter((violation) => ["serious", "critical"].includes(violation.impact ?? ""));
    if (serious.length > 0) {
      failures.push(summarizeAccessibility(name, serious));
    }

    await page.screenshot({
      path: path.join(outputDir, screenshot),
      fullPage: true,
      animations: "disabled",
      caret: "initial",
    });
  } finally {
    await context.close();
  }
}


async function verifyPublicDemoWorkspace() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.locator('[data-analytics="hero_demo"]').click();

    const dialog = page.getByRole("dialog", { name: "Your 10-hour FleetLever workspace" });
    await dialog.waitFor({ state: "visible", timeout: 10_000 });
    await page.getByText("Changes sync to this share link and disappear after 10 hours.").waitFor();

    const frame = page.locator('iframe[title="FleetLever interactive demo"]');
    await frame.waitFor({ state: "visible", timeout: 15_000 });
    const src = await frame.getAttribute("src");
    if (!src || !/^\/try\/[0-9a-f-]+\?embed=1$/i.test(src)) {
      failures.push(`public demo: unexpected iframe source ${src ?? "missing"}`);
    } else {
      const sessionId = src.split("/")[2]?.split("?")[0];
      const stateResponse = await page.request.get(`${origin}/api/commercial/demo-sessions/${sessionId}/state`);
      const state = await stateResponse.json().catch(() => null);
      const ttl = Date.parse(state?.expiresAt ?? "") - Date.now();
      if (!stateResponse.ok() || ttl < 35_900_000 || ttl > 36_100_000) {
        failures.push(`public demo: session does not expose a ten-hour expiry (${stateResponse.status()}, ${ttl})`);
      }

      const sharedPage = await context.newPage();
      await sharedPage.goto(`${origin}/try/${sessionId}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await sharedPage.getByText("Demo workspace", { exact: true }).waitFor({ timeout: 10_000 });
      await sharedPage.close();
    }

    await page.screenshot({ path: path.join(outputDir, "site-public-demo-desktop.png"), fullPage: false });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached", timeout: 5_000 });
  } finally {
    await context.close();
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();

  try {
    await mobilePage.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await mobilePage.getByRole("button", { name: "Open menu" }).click();
    await mobilePage.locator('[data-analytics="mobile_menu_demo"]').click();

    const mobileDialog = mobilePage.getByRole("dialog", { name: "Your 10-hour FleetLever workspace" });
    await mobileDialog.waitFor({ state: "visible", timeout: 10_000 });
    const mobileFrame = mobilePage.locator('iframe[title="FleetLever interactive demo"]');
    await mobileFrame.waitFor({ state: "visible", timeout: 15_000 });
    await mobilePage.waitForFunction(
      () => {
        const frame = document.querySelector('iframe[title="FleetLever interactive demo"]');
        return (frame?.contentDocument?.body?.innerText.length ?? 0) > 100;
      },
      null,
      { timeout: 30_000 },
    );

    const bounds = await mobileDialog.boundingBox();
    if (!bounds || bounds.width < 350 || bounds.width > 390 || bounds.height < 740 || bounds.height > 844) {
      failures.push(`public demo mobile: unexpected dialog bounds ${JSON.stringify(bounds)}`);
    }

    await mobilePage.screenshot({ path: path.join(outputDir, "site-public-demo-mobile.png"), fullPage: false });
  } finally {
    await mobileContext.close();
  }
}

try {
  await verifyPage({
    name: "landing desktop",
    pathname: "/",
    viewport: { width: 1440, height: 1000 },
    maxHeight: 12750,
    required: [
      "Know what can go out next. And what cannot.",
      "Every next assignment enters one release flow.",
      "One board shows what can go out next.",
      "Every machine, sorted by what needs attention.",
      "Manage service as a flow, not a list.",
      "A blocker becomes a decision before morning.",
      "From blocker to auditable release.",
      "Every blocker gets an owner.",
      "Every release remains traceable.",
      "Equipment rental",
    ],
    screenshot: "site-landing-desktop.png",
    interact: async (page) => {
      await verifyHowItWorksInset(page, "landing desktop", 32);
      await verifyAlternatingSectionBackgrounds(page, "landing desktop");
      await verifyHomepageStory(page, "landing desktop");
      await verifyServiceKanbanMotion(page, "landing desktop");
      await verifyCutoffTimelineScroll(page, "landing desktop");
      await verifyIndustrySwitchboardMotion(page, "landing desktop");
      await page.getByRole("button", { name: /Open larger image: FleetLever tomorrow-readiness board/ }).click();
      await page.getByRole("dialog").waitFor({ state: "visible", timeout: 5_000 }).catch(() => {
        failures.push("landing desktop: image dialog did not open");
      });
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "detached", timeout: 5_000 }).catch(() => {
        failures.push("landing desktop: image dialog did not close with Escape");
      });
    },
  });

  await verifyPage({
    name: "landing mobile",
    pathname: "/",
    viewport: { width: 390, height: 844 },
    maxHeight: 13200,
    required: ["FleetLever", "See the release flow", "Try the app", "Pricing"],
    screenshot: "site-landing-mobile.png",
    interact: async (page) => {
      await verifyHowItWorksInset(page, "landing mobile", 20);
      await verifyAlternatingSectionBackgrounds(page, "landing mobile");
      await verifyHomepageStory(page, "landing mobile");
      await verifyMobileProductFocus(page, "landing mobile");
      const industrySwitchboard = page.locator('[data-animation="industry-switchboard"]');
      await industrySwitchboard.scrollIntoViewIfNeeded();
      await page.getByRole("button", { name: /Municipal and public works/i }).click();
      if ((await industrySwitchboard.getAttribute("data-industry-active")) !== "municipal") {
        failures.push("landing mobile: municipal industry drawer did not open");
      }
      const menuButton = page.getByRole("button", { name: /menu/i });
      await menuButton.click();
      if (!(await page.getByRole("navigation", { name: "Mobile navigation" }).isVisible())) {
        failures.push("landing mobile: mobile navigation did not open");
      }
      await menuButton.click();
    },
  });

  await verifyPage({
    name: "pricing desktop",
    pathname: "/pricing",
    viewport: { width: 1440, height: 1000 },
    maxHeight: 6800,
    required: ["Start with proof. Scale with the operation.", "Single Team", "Operations", "Enterprise", "Commercial terms"],
    screenshot: "site-pricing-desktop.png",
  });

  await verifyPage({
    name: "pricing mobile",
    pathname: "/pricing",
    viewport: { width: 390, height: 844 },
    maxHeight: 10000,
    required: ["EUR 1,000", "Single Team", "Operations", "Enterprise"],
    screenshot: "site-pricing-mobile.png",
  });

  await verifyPage({
    name: "request demo desktop",
    pathname: "/request-demo",
    viewport: { width: 1280, height: 900 },
    maxHeight: 2200,
    required: ["Request a FleetLever demo", "Work email", "Fleet size", "Request demo"],
    screenshot: "site-request-demo-desktop.png",
    interact: async (page) => {
      await page.getByRole("button", { name: "Request demo" }).click();
      await page.getByText("Enter your name.").waitFor();
      if (!(await page.getByText("Enter a valid work email.").isVisible())) failures.push("request demo: validation errors are missing");
    },
  });

  for (const [pathname, title] of [["/privacy", "Privacy"], ["/terms", "Terms of use"], ["/security", "Security"]]) {
    await verifyPage({
      name: `${title} page`,
      pathname,
      viewport: { width: 1280, height: 900 },
      maxHeight: 3200,
      required: [title, "FleetLever"],
      screenshot: `site-${pathname.slice(1)}-desktop.png`,
    });
  }

  await verifyPublicDemoWorkspace();

  await verifyReducedMotionKanban();

  const redirectPage = await browser.newPage();
  await redirectPage.goto(`${origin}/landing`, { waitUntil: "domcontentloaded" });
  if (new URL(redirectPage.url()).pathname !== "/") failures.push("/landing does not redirect to /");
  await redirectPage.close();
} finally {
  await browser.close();
}

if (failures.length > 0) {
  console.error(`FAIL commercial site UI\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log(`PASS commercial site UI: ${outputDir}`);
