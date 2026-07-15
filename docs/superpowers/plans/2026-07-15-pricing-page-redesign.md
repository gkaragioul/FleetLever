# FleetLever Pricing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the pricing page into a compact proof-first buying path with aligned plan columns and progressively disclosed detail.

**Architecture:** Keep the route as a server component and use the existing commercial shell, image assets, links, and icon library. Store commercial content in typed constants, compose the page from semantic sections, and use native `details` elements for FAQ disclosure.

**Tech Stack:** Next.js 16 App Router, React server components, Tailwind CSS, `next/image`, `next/link`, Lucide icons.

## Global Constraints

- Preserve route, metadata, analytics IDs, plan names, and prices.
- Add no dependencies.
- Use the existing FleetLever visual system.
- Verify desktop and mobile rendering.

---

### Task 1: Lock the new pricing contract

**Files:**
- Modify: `scripts/verify-commercial-site.mjs`

- [ ] Replace the old hero token with the proof-first headline.
- [ ] Add tokens for the shared annual-plan baseline and compact price-change map.
- [ ] Run `npm.cmd run test:commercial-site` and confirm the new contract fails before implementation.

### Task 2: Recompose the pricing page

**Files:**
- Modify: `src/app/pricing/page.tsx`

- [ ] Merge the hero and pilot into one proof-led opening with the existing product screenshot.
- [ ] Replace horizontal plan rows with three aligned annual plan columns.
- [ ] Add the shared platform strip.
- [ ] Replace the implementation table with launch, expand, and integrate groups.
- [ ] Convert FAQs to native disclosure and retain a compact terms grid.
- [ ] Keep all CTA destinations and analytics attributes stable.

### Task 3: Verify the finished page

**Files:**
- Verify: `src/app/pricing/page.tsx`
- Verify: `scripts/verify-commercial-site.mjs`

- [ ] Run `npm.cmd run test:commercial-site` and expect PASS.
- [ ] Run `npm.cmd run lint` and expect no errors.
- [ ] Run `npx.cmd tsc --noEmit` and expect no errors.
- [ ] Capture full-page desktop and mobile screenshots.
- [ ] Check keyboard focus, content overflow, console output, and responsive plan stacking.
- [ ] Run `git diff --check` and expect no whitespace errors.
