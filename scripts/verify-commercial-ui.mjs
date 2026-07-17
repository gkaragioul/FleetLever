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

async function waitForReactHydration(page, selector) {
  await page.waitForFunction(
    (target) => {
      const element = document.querySelector(target);
      return element && Object.keys(element).some((key) => key.startsWith("__reactFiber$"));
    },
    selector,
    { timeout: 10_000 },
  );
}

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
    { tone: "white", background: "rgb(255, 255, 255)" },
    { tone: "mist", background: "rgb(237, 242, 238)" },
    { tone: "white", background: "rgb(255, 255, 255)" },
    { tone: "mist", background: "rgb(237, 242, 238)" },
    { tone: "white", background: "rgb(255, 255, 255)" },
    { tone: "mist", background: "rgb(237, 242, 238)" },
    { tone: "white", background: "rgb(255, 255, 255)" },
  ];

  if (JSON.stringify(sections) !== JSON.stringify(expected)) {
    failures.push(`${name}: section backgrounds do not alternate mist/white (${JSON.stringify(sections)})`);
  }
}

async function verifyHomepageRhythm(page, name, expectedInset) {
  const strips = await page.locator("[data-home-strip]").evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const shell = element.querySelector("[data-home-shell]");
      const shellRect = shell?.getBoundingClientRect();

      return {
        tone: element.getAttribute("data-section-tone"),
        kind: element.getAttribute("data-home-strip"),
        background: style.backgroundColor,
        borderTopColor: style.borderTopColor,
        borderTopWidth: style.borderTopWidth,
        paddingTop: Number.parseFloat(style.paddingTop),
        paddingBottom: Number.parseFloat(style.paddingBottom),
        shellLeft: shellRect?.left ?? -1,
        shellRight: shellRect ? window.innerWidth - shellRect.right : -1,
      };
    }),
  );

  if (strips.length !== 7) {
    failures.push(`${name}: expected 7 coordinated homepage strips, found ${strips.length}`);
    return;
  }

  const backgroundsAlternate = strips.every(
    (strip, index) => index === 0 || strip.background !== strips[index - 1].background,
  );
  if (!backgroundsAlternate) failures.push(`${name}: homepage strip backgrounds do not alternate`);

  const lineColors = new Set(strips.map((strip) => strip.borderTopColor));
  if (lineColors.size !== 1 || strips.some((strip) => strip.borderTopWidth !== "1px")) {
    failures.push(`${name}: homepage strips do not share one divider treatment (${JSON.stringify(strips)})`);
  }

  for (const strip of strips) {
    if (Math.abs(strip.shellLeft - expectedInset) > 1.5 || Math.abs(strip.shellRight - expectedInset) > 1.5) {
      failures.push(
        `${name}: ${strip.tone} ${strip.kind} strip is off the shared grid ` +
          `(${strip.shellLeft}px left, ${strip.shellRight}px right)`,
      );
    }
  }

  const regularStrips = strips.filter((strip) => strip.kind === "regular");
  const regularPadding = new Set(
    regularStrips.map((strip) => `${strip.paddingTop.toFixed(2)}/${strip.paddingBottom.toFixed(2)}`),
  );
  if (regularPadding.size !== 1) {
    failures.push(`${name}: regular homepage strips do not share one vertical rhythm (${JSON.stringify(regularStrips)})`);
  }
}

async function verifyHomepageStory(page, name) {
  const story = [
    "Add the fields your team actually needs.",
    "Every next assignment enters one release flow.",
    "One board shows what can go out next.",
    "Every machine, sorted by what needs attention.",
    "Manage service as a flow, not a list.",
    "From blocker to release. One record.",
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

async function verifyUnifiedReleaseProcess(page, name) {
  const section = page.locator('[data-animation="unified-release"]');
  await section.scrollIntoViewIfNeeded();
  await section.waitFor({ state: "visible", timeout: 5_000 });
  await waitForReactHydration(page, '[data-animation="unified-release"]');

  const panel = section.locator('[data-release-panel]');
  const rows = panel.locator('[data-release-requirement]');
  const stages = section.locator('[aria-label="Release-control stages"] button');

  if ((await panel.count()) !== 1) failures.push(`${name}: release process should use one stable asset panel`);
  if ((await rows.count()) !== 3) failures.push(`${name}: release process should keep three requirement groups visible`);
  if ((await stages.count()) !== 4) failures.push(`${name}: release process should expose four clear stages`);

  const layout = await panel.evaluate((element) => {
    const panelRect = element.getBoundingClientRect();
    const requirements = [...element.querySelectorAll('[data-release-requirement]')];
    const labels = requirements.map((row) => row.getAttribute("data-release-requirement"));

    return {
      uniqueLabels: new Set(labels).size === labels.length,
      rowsContained: requirements.every((row) => {
        const rect = row.getBoundingClientRect();
        return (
          rect.left >= panelRect.left - 1 &&
          rect.right <= panelRect.right + 1 &&
          rect.top >= panelRect.top - 1 &&
          rect.bottom <= panelRect.bottom + 1
        );
      }),
      rowsStayStill: requirements.every((row) => getComputedStyle(row).transform === "none"),
    };
  });

  if (!layout.uniqueLabels) failures.push(`${name}: unified release process repeats a requirement group`);
  if (!layout.rowsContained) failures.push(`${name}: release requirements escape the stable asset panel`);
  if (!layout.rowsStayStill) failures.push(`${name}: release requirements move spatially between states`);

  const isMobile = (page.viewportSize()?.width ?? 0) < 900;
  if (isMobile) {
    for (let index = 0; index < 4; index += 1) {
      await stages.nth(index).click();
      if ((await section.getAttribute("data-release-stage")) !== String(index)) {
        failures.push(`${name}: release stage ${index + 1} did not respond to direct selection`);
      }
    }
  } else {
    const metrics = await section.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: window.scrollY + rect.top,
        travel: Math.max(1, rect.height - window.innerHeight),
      };
    });

    await page.evaluate(
      ({ top }) => window.scrollTo({ top: Math.max(0, top - 4), behavior: "instant" }),
      metrics,
    );
    await page.waitForTimeout(420);
    if ((await section.getAttribute("data-release-stage")) !== "0") {
      failures.push(`${name}: release process should enter on Detect`);
    }

    await page.evaluate(
      ({ top, travel }) => window.scrollTo({ top: top + travel * 0.98, behavior: "instant" }),
      metrics,
    );
    await page.waitForTimeout(420);
    if ((await section.getAttribute("data-release-stage")) !== "3") {
      failures.push(`${name}: release process did not reach its recorded outcome`);
    }

    await page.evaluate(
      ({ top, travel }) => window.scrollTo({ top: top + travel * 0.15, behavior: "instant" }),
      metrics,
    );
    await page.waitForTimeout(420);
    const reverseStage = Number(await section.getAttribute("data-release-stage"));
    if (reverseStage >= 3) failures.push(`${name}: release process did not reverse while scrolling up`);
  }
}

async function verifyServiceKanbanMotion(page, name) {
  const motionPage = await page.context().newPage();
  try {
    await motionPage.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    const board = motionPage.locator('[data-animation="service-kanban"]');
    await board.scrollIntoViewIfNeeded();
    await board.waitFor({ state: "visible", timeout: 5_000 });

    const cursorArchitecture = await board.evaluate((section) => {
      const card = section.querySelector("[data-service-drag-card]");
      const cursor = section.querySelector("[data-service-cursor]");
      const pickedCard = section.querySelector('[data-motion-role="picked"]');
      const backgroundCards = [...section.querySelectorAll('[data-motion-role="background"]')].filter(
        (element) => Number.parseFloat(getComputedStyle(element).opacity) > 0.1,
      );
      const backgroundDelays = backgroundCards.map((element) =>
        getComputedStyle(element).getPropertyValue("--train-delay").trim(),
      );
      return {
        cursorNestedInCard: Boolean(card && cursor && card.contains(cursor)),
        cursorPhase: section.getAttribute("data-service-cursor-phase"),
        pickedDelay: pickedCard ? getComputedStyle(pickedCard).getPropertyValue("--train-delay").trim() : null,
        backgroundCardCount: backgroundCards.length,
        uniqueBackgroundDelays: new Set(backgroundDelays).size,
      };
    });
    if (cursorArchitecture.cursorNestedInCard) {
      failures.push(`${name}: service cursor is coupled to the moving card instead of following its own path`);
    }
    if (!cursorArchitecture.cursorPhase) {
      failures.push(`${name}: service cursor does not expose an autonomous motion phase`);
    }
    if (cursorArchitecture.pickedDelay !== "0ms") {
      failures.push(`${name}: cursor-picked service card is not the first card to move`);
    }
    if (cursorArchitecture.backgroundCardCount < 2 || cursorArchitecture.uniqueBackgroundDelays < 2) {
      failures.push(`${name}: background service cards refresh in one synchronized group`);
    }

    await motionPage.mouse.move(4, 4);
    const initialStage = await board.getAttribute("data-service-stage");
    await motionPage.waitForFunction(
      (selector) => document.querySelector(selector)?.getAttribute("data-service-cursor-phase") === "approach",
      '[data-animation="service-kanban"]',
      { timeout: 1_400 },
    ).catch(() => failures.push(`${name}: autonomous service cursor starts too late after entering the viewport`));

    const approachStart = await board.evaluate((section) => {
      const card = section.querySelector("[data-service-drag-card]")?.getBoundingClientRect();
      const cursor = section.querySelector("[data-service-cursor] svg")?.getBoundingClientRect();
      return {
        cardLeft: card?.left ?? 0,
        cursorLeft: cursor?.left ?? 0,
        cursorTop: cursor?.top ?? 0,
      };
    });
    await motionPage.waitForTimeout(110);
    const approachEnd = await board.evaluate((section) => {
      const card = section.querySelector("[data-service-drag-card]")?.getBoundingClientRect();
      const cursor = section.querySelector("[data-service-cursor] svg")?.getBoundingClientRect();
      return {
        cardLeft: card?.left ?? 0,
        cursorLeft: cursor?.left ?? 0,
        cursorTop: cursor?.top ?? 0,
      };
    });
    const approachCursorTravel = Math.hypot(
      approachEnd.cursorLeft - approachStart.cursorLeft,
      approachEnd.cursorTop - approachStart.cursorTop,
    );
    if (approachCursorTravel < 6) failures.push(`${name}: service cursor does not approach the card independently`);
    if (Math.abs(approachEnd.cardLeft - approachStart.cardLeft) > 2) {
      failures.push(`${name}: service card starts moving before the cursor grabs it`);
    }

    await motionPage.waitForFunction(
      (selector) => document.querySelector(selector)?.getAttribute("data-service-cursor-phase") === "drag",
      '[data-animation="service-kanban"]',
      { timeout: 1_000 },
    );
    await motionPage.waitForTimeout(220);
    const movingState = await board.evaluate((section) => {
      const boardWindow = section.querySelector("[data-stage]");
      const card = section.querySelector("[data-service-drag-card]");
      const handle = card?.querySelector("[data-service-drag-handle] svg");
      const cursor = section.querySelector("[data-service-cursor]");
      const pointer = cursor?.querySelector("svg");
      const lane = section.querySelector("[data-lane]");
      const boardRect = boardWindow?.getBoundingClientRect();
      const cardRect = card?.getBoundingClientRect();
      const handleRect = handle?.getBoundingClientRect();
      const pointerRect = pointer?.getBoundingClientRect();
      const laneRect = lane?.getBoundingClientRect();
      const backgroundCards = [...section.querySelectorAll('[data-motion-role="background"]')].filter(
        (element) => Number.parseFloat(getComputedStyle(element).opacity) > 0.1,
      );
      return {
        cursorPhase: section.getAttribute("data-service-cursor-phase"),
        cardWidth: cardRect?.width ?? 0,
        laneWidth: laneRect?.width ?? 0,
        cursorOpacity: cursor ? Number.parseFloat(getComputedStyle(cursor).opacity) : 0,
        cursorGripDelta:
          handleRect && pointerRect
            ? Math.hypot(pointerRect.left - handleRect.left, pointerRect.top - handleRect.top)
            : Infinity,
        backgroundAnimations: backgroundCards.map((element) =>
          getComputedStyle(element.firstElementChild).animationName,
        ),
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

    if (movingState.cardWidth < movingState.laneWidth * 0.75) {
      failures.push(`${name}: dragged service card collapsed inside its lane`);
    }
    if (movingState.cursorPhase !== "drag") failures.push(`${name}: service cursor skipped its drag phase`);
    if (movingState.cursorOpacity < 0.25) failures.push(`${name}: service drag cursor is not visible`);
    if (!movingState.backgroundAnimations.some((animation) => animation !== "none")) {
      failures.push(`${name}: background service cards do not refresh independently of the dragged card`);
    }
    if (movingState.cursorGripDelta > 18) {
      failures.push(
        `${name}: service cursor does not accurately carry the moving card (${movingState.cursorGripDelta.toFixed(1)}px from grip)`,
      );
    }
    if (!movingState.contained) failures.push(`${name}: dragged service card escaped the Kanban board`);

    await motionPage.waitForFunction(
      ({ selector, stage }) => {
        const section = document.querySelector(selector);
        return (
          section?.getAttribute("data-service-cursor-phase") === "parked" &&
          section?.getAttribute("data-service-stage") !== stage
        );
      },
      { selector: '[data-animation="service-kanban"]', stage: initialStage },
      { timeout: 2_000 },
    );
    await board.hover();
    const landingStage = await board.getAttribute("data-service-stage");
    const landedState = await board.evaluate((section) => {
      const stage = section.getAttribute("data-service-stage");
      const cardElement = section.querySelector("[data-service-drag-card]");
      const cursor = section.querySelector("[data-service-cursor]");
      const handle = cardElement?.querySelector("[data-service-drag-handle] svg")?.getBoundingClientRect();
      const pointer = cursor?.querySelector("svg")?.getBoundingClientRect();
      const card = cardElement?.getBoundingClientRect();
      const lane = stage ? section.querySelector(`[data-lane="${stage}"]`)?.getBoundingClientRect() : undefined;
      return {
        stage,
        cursorPhase: section.getAttribute("data-service-cursor-phase"),
        cursorOpacity: cursor ? Number.parseFloat(getComputedStyle(cursor).opacity) : 0,
        cursorGripDelta: handle && pointer ? Math.hypot(pointer.left - handle.left, pointer.top - handle.top) : Infinity,
        centerDelta: card && lane ? Math.abs((card.left + card.right - lane.left - lane.right) / 2) : Infinity,
        insideTargetLane: Boolean(card && lane && card.left >= lane.left && card.right <= lane.right),
      };
    });

    if (landedState.stage !== landingStage) failures.push(`${name}: service Kanban changed stage while paused`);
    if (landedState.centerDelta > 3 || !landedState.insideTargetLane) {
      failures.push(`${name}: dragged service card did not land fully inside the ${landingStage} column`);
    }
    if (landedState.cursorPhase !== "parked") failures.push(`${name}: service cursor did not retreat after release`);
    if (landedState.cursorOpacity < 0.55) failures.push(`${name}: service cursor disappears after release`);
    if (landedState.cursorGripDelta < 24) failures.push(`${name}: service cursor remains coupled to the card after release`);

    await motionPage.mouse.move(4, 4);
    await motionPage.waitForFunction(
      (selector) => {
        const section = document.querySelector(selector);
        return (
          section?.getAttribute("data-service-stage") === "cleared" &&
          section?.getAttribute("data-service-cursor-phase") === "parked"
        );
      },
      '[data-animation="service-kanban"]',
      { timeout: 3_500 },
    );
    await motionPage.waitForFunction(
      (selector) => {
        const section = document.querySelector(selector);
        const phase = section?.getAttribute("data-service-cursor-phase");
        return (
          section?.getAttribute("data-service-stage") === "queued" ||
          (section?.querySelector("[data-service-cursor]")?.getAttribute("data-cursor-from") === "cleared" &&
            phase !== "parked")
        );
      },
      '[data-animation="service-kanban"]',
      { timeout: 2_500 },
    );
    const clearedRollover = await board.evaluate((section) => ({
      stage: section.getAttribute("data-service-stage"),
      cursorPhase: section.getAttribute("data-service-cursor-phase"),
      cursorFrom: section.querySelector("[data-service-cursor]")?.getAttribute("data-cursor-from"),
    }));
    if (clearedRollover.cursorFrom === "cleared" && clearedRollover.cursorPhase !== "parked") {
      failures.push(`${name}: service cursor picks up a completed card from the Cleared lane`);
    }
  } finally {
    await motionPage.close();
  }
}

async function verifyWheelSteppedMotion(page, name) {
  const motionPage = await page.context().newPage();
  const cases = [
    {
      selector: '[data-animation="readiness-lanes"]',
      attribute: "data-motion-stage",
      order: ["0", "1", "2"],
      start: "0",
    },
    {
      selector: '[data-animation="fleet-inventory"]',
      attribute: "data-inventory-focus",
      order: ["blocked", "review", "ready"],
      loop: true,
    },
    {
      selector: '[data-animation="service-kanban"]',
      attribute: "data-service-stage",
      order: ["queued", "in-service", "cleared"],
      loop: true,
      settle: 1_350,
    },
    {
      selector: '[data-animation="unified-release"]',
      attribute: "data-release-stage",
      order: ["0", "1", "2", "3"],
      start: "0",
    },
    {
      selector: '[data-animation="industry-switchboard"]',
      attribute: "data-industry-active",
      order: ["construction", "rental", "municipal", "car-rental", "beyond"],
      loop: true,
    },
  ];

  try {
    await motionPage.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await motionPage.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });

    for (const motionCase of cases) {
      const section = motionPage.locator(motionCase.selector);
      await section.scrollIntoViewIfNeeded();
      await section.waitFor({ state: "visible", timeout: 5_000 });
      await waitForReactHydration(motionPage, motionCase.selector);

      if (motionCase.start) {
        await motionPage.evaluate(
          ({ selector, headerOffset }) => {
            const element = document.querySelector(selector);
            if (!element) return;
            const top = window.scrollY + element.getBoundingClientRect().top;
            window.scrollTo(0, Math.max(0, top - headerOffset));
          },
          { selector: motionCase.selector, headerOffset: 76 },
        );
        await motionPage.waitForTimeout(180);
      }

      const box = await section.boundingBox();
      if (!box) {
        failures.push(`${name}: ${motionCase.selector} has no wheel target`);
        continue;
      }
      if (motionCase.selector.includes("service-kanban")) {
        await section.locator("[data-stage]").hover();
        await motionPage.waitForFunction(
          (selector) => document.querySelector(selector)?.getAttribute("data-service-cursor-phase") === "parked",
          motionCase.selector,
          { timeout: 2_000 },
        );
      } else {
        await motionPage.mouse.move(box.x + box.width / 2, Math.min(box.y + box.height / 2, 700));
      }

      const before = await section.getAttribute(motionCase.attribute);
      const beforeIndex = motionCase.order.indexOf(before ?? "");
      if (beforeIndex < 0) {
        failures.push(`${name}: ${motionCase.selector} has no readable motion state`);
        continue;
      }

      await motionPage.mouse.wheel(0, 128);
      await motionPage.waitForTimeout(motionCase.settle ?? 520);
      const afterDown = await section.getAttribute(motionCase.attribute);
      const expectedDown = motionCase.loop
        ? motionCase.order[(beforeIndex + 1) % motionCase.order.length]
        : motionCase.order[Math.min(beforeIndex + 1, motionCase.order.length - 1)];
      if (afterDown !== expectedDown) {
        failures.push(
          `${name}: ${motionCase.selector} did not advance one wheel step (${before} -> ${afterDown}, expected ${expectedDown})`,
        );
        continue;
      }

      if (motionCase.selector.includes("fleet-inventory")) {
        const inventoryState = await section.evaluate((element) => ({
          result: element.querySelector("[data-inventory-result]")?.getAttribute("data-inventory-result"),
          activeLanes: element.querySelectorAll('[data-state][data-active="true"]').length,
          activeFilters: element.querySelectorAll('[data-inventory-filter][data-active="true"][aria-pressed="true"]').length,
        }));
        if (inventoryState.result !== afterDown || inventoryState.activeLanes !== 1 || inventoryState.activeFilters !== 1) {
          failures.push(`${name}: fleet inventory focus is not reflected by one clear result, lane and filter`);
        }
      }

      await motionPage.waitForTimeout(220);
      await motionPage.mouse.wheel(0, -128);
      await motionPage.waitForTimeout(motionCase.settle ?? 520);
      const afterUp = await section.getAttribute(motionCase.attribute);
      if (afterUp !== before) {
        failures.push(`${name}: ${motionCase.selector} did not reverse one wheel step (${afterDown} -> ${afterUp})`);
      }
    }

    const trainCards = motionPage.locator('[data-animation="service-kanban"] [data-service-train-card]');
    if ((await trainCards.count()) < 2) {
      failures.push(`${name}: service Kanban does not show a following machine behind the active card`);
    }
  } finally {
    await motionPage.close();
  }
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

async function verifyMobileOperationalCompositions(page, name) {
  const readiness = page.locator('[data-animation="readiness-lanes"]');
  const readinessHeight = await readiness.evaluate((element) => element.getBoundingClientRect().height);
  if (readinessHeight > (page.viewportSize()?.height ?? 844) * 1.3) {
    failures.push(`${name}: readiness motion keeps a desktop-sized scroll runway (${readinessHeight}px)`);
  }

  for (const { selector, label, laneSelector } of [
    {
      selector: '[data-animation="fleet-inventory"]',
      label: "inventory",
      laneSelector: '[data-state]',
    },
    {
      selector: '[data-animation="service-kanban"]',
      label: "service",
      laneSelector: '[data-lane]',
    },
  ]) {
    const board = page.locator(selector);
    await board.scrollIntoViewIfNeeded();
    const composition = await board.evaluate((element, targetSelector) => {
      const boardRect = element.getBoundingClientRect();
      const lanes = [...element.querySelectorAll(targetSelector)].map((lane) => {
        const rect = lane.getBoundingClientRect();
        const style = getComputedStyle(lane);
        return {
          display: style.display,
          visibility: style.visibility,
          width: rect.width,
          height: rect.height,
        };
      });
      const visible = lanes.filter(
        (lane) => lane.display !== "none" && lane.visibility !== "hidden" && lane.width > 1 && lane.height > 1,
      );
      return {
        boardWidth: boardRect.width,
        visibleCount: visible.length,
        widestLane: Math.max(0, ...visible.map((lane) => lane.width)),
      };
    }, laneSelector);

    if (composition.visibleCount !== 1) {
      failures.push(`${name}: mobile ${label} board shows ${composition.visibleCount} compressed lanes instead of one focus lane`);
    }
    if (composition.widestLane < composition.boardWidth * 0.82) {
      failures.push(
        `${name}: mobile ${label} lane is too narrow (${composition.widestLane}px / ${composition.boardWidth}px)`,
      );
    }
  }

  const compactTargets = await page.locator('[data-inventory-filter]').evaluateAll((buttons) =>
    buttons
      .map((button) => ({
        label: button.textContent?.replace(/\s+/g, " ").trim() ?? "filter",
        height: button.getBoundingClientRect().height,
      }))
      .filter((button) => button.height < 42),
  );
  if (compactTargets.length > 0) {
    failures.push(`${name}: mobile inventory filters are below the touch target (${JSON.stringify(compactTargets)})`);
  }

  const shortFooterTargets = await page.locator("footer a").evaluateAll((links) =>
    links
      .filter((link) => {
        const style = getComputedStyle(link);
        const rect = link.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 1;
      })
      .map((link) => ({
        label: link.textContent?.replace(/\s+/g, " ").trim() ?? "footer link",
        height: link.getBoundingClientRect().height,
      }))
      .filter((link) => link.height < 40),
  );
  if (shortFooterTargets.length > 0) {
    failures.push(`${name}: mobile footer links are below the touch target (${JSON.stringify(shortFooterTargets)})`);
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


async function verifyTrialEntryLinks() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();

  try {
    await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    for (const analytics of ["hero_trial", "header_trial"]) {
      const link = page.locator(`[data-analytics="${analytics}"]`);
      await link.waitFor({ state: "visible", timeout: 10_000 });
      const href = await link.getAttribute("href");
      if (!href || new URL(href, origin).pathname !== "/signup") {
        failures.push(`trial entry: ${analytics} points to ${href ?? "missing"} instead of /signup`);
      }
    }

    if ((await page.locator('iframe[title="FleetLever interactive demo"]').count()) > 0) {
      failures.push("trial entry: legacy embedded demo iframe remains on the homepage");
    }
    if ((await page.getByRole("dialog", { name: /10-hour FleetLever workspace/i }).count()) > 0) {
      failures.push("trial entry: legacy ten-hour demo dialog remains on the homepage");
    }

    await page.screenshot({ path: path.join(outputDir, "site-trial-entry-desktop.png"), fullPage: false });
  } finally {
    await context.close();
  }

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();

  try {
    await mobilePage.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await mobilePage.getByRole("button", { name: "Open menu" }).click();
    const trialLink = mobilePage.locator('[data-analytics="mobile_menu_trial"]');
    await trialLink.waitFor({ state: "visible", timeout: 10_000 });
    const href = await trialLink.getAttribute("href");
    if (!href || new URL(href, origin).pathname !== "/signup") {
      failures.push(`trial entry mobile: link points to ${href ?? "missing"} instead of /signup`);
    }

    if ((await mobilePage.locator('iframe[title="FleetLever interactive demo"]').count()) > 0) {
      failures.push("trial entry mobile: legacy embedded demo iframe remains");
    }

    await mobilePage.screenshot({ path: path.join(outputDir, "site-trial-entry-mobile.png"), fullPage: false });
  } finally {
    await mobileContext.close();
  }
}

async function verifyMobileWidthMatrix() {
  for (const width of [320, 360, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    try {
      await page.goto(`${origin}/`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      const metrics = await page.evaluate(() => ({
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: window.innerWidth,
      }));
      if (metrics.documentWidth > metrics.viewportWidth + 1) {
        failures.push(`mobile ${width}px: page overflows horizontally (${metrics.documentWidth}px document)`);
      }

      const menuButton = page.getByRole("button", { name: "Open menu" });
      const menuBox = await menuButton.boundingBox();
      if (!menuBox || menuBox.width < 44 || menuBox.height < 44) {
        failures.push(`mobile ${width}px: menu touch target is smaller than 44px`);
      }

      await menuButton.click();
      const trialLink = page.locator('[data-analytics="mobile_menu_trial"]');
      await trialLink.waitFor({ state: "visible", timeout: 10_000 });
      if (width === 320 || width === 430) {
        await page.screenshot({ path: path.join(outputDir, `site-landing-${width}px.png`), fullPage: false });
      }
    } finally {
      await context.close();
    }
  }
}

try {
  await verifyPage({
    name: "landing desktop",
    pathname: "/",
    viewport: { width: 1440, height: 1000 },
    maxHeight: 14250,
    required: [
      "Know what can go out next. And what cannot.",
      "Add the fields your team actually needs.",
      "Every next assignment enters one release flow.",
      "One board shows what can go out next.",
      "Every machine, sorted by what needs attention.",
      "Manage service as a flow, not a list.",
      "From blocker to release. One record.",
      "Equipment rental",
      "Car rental operations",
      "Aviation, marine and beyond",
    ],
    screenshot: "site-landing-desktop.png",
    interact: async (page) => {
      await verifyHowItWorksInset(page, "landing desktop", 32);
      await verifyAlternatingSectionBackgrounds(page, "landing desktop");
      await verifyHomepageRhythm(page, "landing desktop", 40);
      await verifyHomepageStory(page, "landing desktop");
      await verifyUnifiedReleaseProcess(page, "landing desktop");
      await verifyWheelSteppedMotion(page, "landing desktop");
      await verifyServiceKanbanMotion(page, "landing desktop");
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
    maxHeight: 15200,
    required: ["FleetLever", "Start 15-day trial", "Add the fields your team actually needs.", "Try the app", "Pricing"],
    screenshot: "site-landing-mobile.png",
    interact: async (page) => {
      await verifyHowItWorksInset(page, "landing mobile", 20);
      await verifyAlternatingSectionBackgrounds(page, "landing mobile");
      await verifyHomepageRhythm(page, "landing mobile", 20);
      await verifyHomepageStory(page, "landing mobile");
      await verifyUnifiedReleaseProcess(page, "landing mobile");
      await verifyMobileProductFocus(page, "landing mobile");
      await verifyMobileOperationalCompositions(page, "landing mobile");
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
      await page.waitForFunction(() => {
        const button = [...document.querySelectorAll("button")].find(
          (element) => element.textContent?.trim() === "Request demo",
        );
        return button && Object.keys(button).some((key) => key.startsWith("__reactProps$"));
      });
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

  await verifyTrialEntryLinks();

  await verifyMobileWidthMatrix();

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
