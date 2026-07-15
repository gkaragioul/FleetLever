# Commercial Machines And Service Strips Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add faithful Machines and animated Service Kanban product strips to the FleetLever commercial homepage.

**Architecture:** Keep the landing page as a Server Component and isolate each interactive demonstration in its own Client Component with a colocated CSS Module. Integrate both components between the readiness screenshot and the existing pre-cutoff workflow, then extend existing contract and Playwright verification.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, TypeScript, CSS Modules, Tailwind v4, Playwright.

## Global Constraints

- Preserve the current FleetLever color, typography, radius and spacing system.
- Do not add a new animation dependency.
- Kanban cycle duration must be at least 9 seconds and pause on hover, focus and hidden documents.
- Reduced motion renders a static cleared state.
- No horizontal page overflow at desktop or mobile widths.

---

### Task 1: Commercial Contract Tests

**Files:**
- Modify: `scripts/verify-commercial-site.mjs`
- Modify: `scripts/verify-commercial-ui.mjs`

**Interfaces:**
- Consumes: homepage source and rendered `data-*` animation state.
- Produces: regression checks for strip copy, story order, tones and Kanban progression.

- [ ] Add source checks for `FleetInventoryStrip`, `ServiceKanbanStrip`, approved headlines, three service stages, pause behavior and reduced-motion styles.
- [ ] Add rendered story-order and seven-section alternating-tone checks.
- [ ] Add browser checks that the Service card progresses through all stages and remains static in reduced motion.
- [ ] Run `npm.cmd run test:commercial-site` and confirm the missing components fail the contract.

### Task 2: Machines Product Strip

**Files:**
- Create: `src/components/fleetlever/fleet-inventory-strip.tsx`
- Create: `src/components/fleetlever/fleet-inventory-strip.module.css`

**Interfaces:**
- Produces: `FleetInventoryStrip()` with `data-section-tone="mist"` and `data-inventory-focus`.

- [ ] Build three English state lanes with compact machine rows and existing local machine photography.
- [ ] Add an IntersectionObserver-gated focus sweep that pauses on interaction and respects reduced motion.
- [ ] Add responsive styles that preserve all three status lanes without page overflow.

### Task 3: Service Kanban Product Strip

**Files:**
- Create: `src/components/fleetlever/service-kanban-strip.tsx`
- Create: `src/components/fleetlever/service-kanban-strip.module.css`

**Interfaces:**
- Produces: `ServiceKanbanStrip()` with `data-service-stage`, `data-animation-state` and three Kanban lanes.

- [ ] Render the queued, in-service and cleared lanes with useful service metadata.
- [ ] Implement a minimum 9-second repeating stage loop gated by viewport visibility, document visibility, hover and focus.
- [ ] Animate the featured machine with a lift-travel-land transition and update lane counts with each stage.
- [ ] Render the final cleared stage for reduced motion.

### Task 4: Homepage Integration

**Files:**
- Modify: `src/app/landing/page.tsx`

**Interfaces:**
- Consumes: `FleetInventoryStrip` and `ServiceKanbanStrip`.

- [ ] Import both strips.
- [ ] Render them after the main readiness board and before `#how-it-works`.
- [ ] Confirm heading hierarchy and story order remain coherent.

### Task 5: Verification And Publication

**Files:**
- Modify only if verification exposes a real regression.

- [ ] Run `npm.cmd run test:commercial-site`.
- [ ] Run `npm.cmd run lint`.
- [ ] Build with `$env:FLEETLEVER_EDITION='site'; npm.cmd run build`.
- [ ] Run `npm.cmd run test:commercial-ui` against the local production server.
- [ ] Verify Kanban `queued -> in-service -> cleared -> queued` in Chromium and verify reduced motion remains static.
- [ ] Deploy with `railway.cmd up . --path-as-root --detach --json --service fleetlever-site --environment production`.
- [ ] Confirm Railway health and repeat the Kanban browser check against the live URL.

