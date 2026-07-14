# Pre-Morning Timeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the commercial site's generic pre-morning blocker list with a responsive evening-to-morning operational timeline.

**Architecture:** Add a focused client-leaf timeline component with a colocated CSS module, then render it from the existing landing page. Extend the existing commercial-site contract and browser checks instead of creating a new test harness.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, CSS Modules, Tailwind utilities, Lucide icons, Playwright.

## Global Constraints

- No new runtime dependency.
- Preserve the existing routes, header, footer, CTAs, and surrounding landing-page sections.
- Use the existing FleetLever teal, red, green, and neutral palette.
- Support `prefers-reduced-motion: reduce` and mobile widths down to 390px.
- Keep all Greek timeline labels fully visible without ellipsis.

---

### Task 1: Commercial Contract

**Files:**
- Modify: `scripts/verify-commercial-site.mjs`

**Interfaces:**
- Consumes: source files read by the existing commercial-site contract.
- Produces: assertions for `PreMorningTimeline`, approved Greek copy, `IntersectionObserver`, and reduced-motion CSS.

- [ ] **Step 1: Add the failing contract assertions**

Read `pre-morning-timeline.tsx` and its CSS module, require the approved headline and outcome copy, and require both `IntersectionObserver` and `prefers-reduced-motion: reduce`.

- [ ] **Step 2: Run the contract and verify failure**

Run: `npm.cmd run test:commercial-site`

Expected: FAIL because the new component and required tokens do not exist.

### Task 2: Timeline Component

**Files:**
- Create: `src/components/fleetlever/pre-morning-timeline.tsx`
- Create: `src/components/fleetlever/pre-morning-timeline.module.css`
- Modify: `src/app/landing/page.tsx`

**Interfaces:**
- Consumes: the existing landing-page section position and FleetLever color language.
- Produces: `PreMorningTimeline(): JSX.Element` rendered between the readiness dashboard and workflow section.

- [ ] **Step 1: Implement the client component**

Create a four-step timeline using fixed Greek content, Lucide icons, one `IntersectionObserver`, and strict effect cleanup.

- [ ] **Step 2: Implement responsive styling**

Use a ruled timeline, a one-time staged reveal, a restrained green outcome row, a mobile single-column layout, and a static reduced-motion state.

- [ ] **Step 3: Replace the old section**

Remove the `blockers` array and old mapped rows from `src/app/landing/page.tsx`, import `PreMorningTimeline`, and render it in the same page position.

- [ ] **Step 4: Run the contract and verify success**

Run: `npm.cmd run test:commercial-site`

Expected: PASS.

### Task 3: Verification And Release

**Files:**
- Modify only if a real defect is found during verification.

**Interfaces:**
- Consumes: the completed landing page.
- Produces: a tested commit deployed through the existing Railway GitHub integration.

- [ ] **Step 1: Run static checks**

Run: `npx.cmd tsc --noEmit`, targeted ESLint, `git diff --check`, and the production site-edition build.

Expected: all exit with code 0.

- [ ] **Step 2: Run browser checks**

Run the commercial UI suite and capture the section at 1440x1000 and 390x844. Check visible copy, all timeline events, reduced motion, console errors, and horizontal overflow.

Expected: no errors, overflow, truncation, or broken assets.

- [ ] **Step 3: Commit and publish**

Stage only the spec, plan, contract, component, CSS module, and landing-page files. Commit, push the feature branch and `main`, wait for the `fleetlever-site` Railway deployment, then verify the live URL returns HTTP 200 and contains the new section.
