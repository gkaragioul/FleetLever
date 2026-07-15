# Industry Switchboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage's flat use-case list with a responsive, image-led industry drawer system.

**Architecture:** Add one focused client component with a colocated CSS module. The server-rendered landing page imports the component, while the component owns only active-drawer state, rotation, pause behaviour, and reduced-motion handling. Existing contract and Playwright scripts cover integration and interaction.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript, CSS Modules, Tailwind CSS 4, Playwright 1.60.

## Global Constraints

- Preserve the `#for-whom` anchor and the mist section tone.
- Use local optimized image assets and `next/image`.
- Add no runtime dependencies.
- Pause automatic motion on hover, focus, and hidden documents.
- Disable automatic motion under `prefers-reduced-motion: reduce`.
- Prevent horizontal overflow at desktop and mobile sizes.

---

### Task 1: Contract And Interaction Coverage

**Files:**
- Modify: `scripts/verify-commercial-site.mjs`
- Modify: `scripts/verify-commercial-ui.mjs`

**Interfaces:**
- Consumes: homepage source and browser-rendered `data-animation="industry-switchboard"`.
- Produces: a failing test requiring the new component, four drawers, pause behaviour, and reduced-motion stability.

- [ ] Add source-contract assertions for the switchboard component, copy, industries, tab semantics, timing constant, visibility pause, and reduced-motion CSS.
- [ ] Add browser assertions that click changes the active industry, hover pauses rotation, leaving resumes it, and reduced motion remains stable.
- [ ] Run `npm.cmd run test:commercial-site` and confirm failure because the component does not exist.

### Task 2: Industry Assets And Component

**Files:**
- Create: `public/fleetlever/site/industries/equipment-rental.jpg`
- Create: `public/fleetlever/site/industries/service-fleet.jpg`
- Create: `src/components/fleetlever/industry-switchboard.tsx`
- Create: `src/components/fleetlever/industry-switchboard.module.css`

**Interfaces:**
- Consumes: local image paths and the existing commercial palette.
- Produces: `IndustrySwitchboard`, with `data-industry-active` and four accessible drawer tabs.

- [ ] Import and locally store the two missing licensed industry photographs; reuse existing construction and municipal photography.
- [ ] Implement the four-industry data model and accessible tab/drawer markup.
- [ ] Implement 5.8-second rotation, direct selection, hover/focus pause, document-visibility pause, and reduced-motion state.
- [ ] Implement horizontal desktop drawers and a vertical mobile accordion without overflow.
- [ ] Run the commercial contract test and confirm it passes.

### Task 3: Homepage Integration And Verification

**Files:**
- Modify: `src/app/landing/page.tsx`

**Interfaces:**
- Consumes: `IndustrySwitchboard`.
- Produces: the existing `#for-whom` chapter with the new visual system.

- [ ] Replace the inline `useCases` array and flat list with `IndustrySwitchboard`.
- [ ] Run `npm.cmd run lint` and expect no errors.
- [ ] Run `FLEETLEVER_EDITION=site npm.cmd run build` and expect a successful production build.
- [ ] Run local and live `npm.cmd run test:commercial-ui`; inspect desktop and mobile screenshots.
- [ ] Deploy to Railway and verify `/api/health` plus both switchboard interactions on the production URL.

