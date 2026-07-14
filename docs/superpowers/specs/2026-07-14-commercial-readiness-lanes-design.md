# FleetLever commercial readiness lanes

## Goal

Give the Greek commercial site one memorable scroll-driven explanation of FleetLever without copying Vooma's visual identity or turning the page into an animation demo.

## Design

- Place the section after the hero and before the first product screenshot.
- Show three recognizable machines moving through four readiness checkpoints: documents, service, operator, and evidence.
- Hold one machine at a visible blocker during the middle stage, assign the next action and deadline, then release it into the ready lane.
- Keep the diagram unframed and integrated into the page background. Use FleetLever teal, operational red, and ready green only for semantic state.
- Pair the diagram with three short Greek narrative states that change at meaningful scroll thresholds.

## Implementation

- Keep the landing page as a Server Component.
- Isolate browser APIs in a leaf Client Component.
- Use an inline responsive SVG for the operational diagram and `requestAnimationFrame` only while an `IntersectionObserver` reports that the section is visible.
- Update SVG transforms directly so continuous scroll does not trigger React renders. React state changes only when the narrative stage changes.
- Respect `prefers-reduced-motion` by rendering the final ready state immediately.

## Verification

- Contract checks confirm the section, Greek copy, observer, and reduced-motion support exist.
- Browser verification checks required copy, missing assets, console errors, horizontal overflow, desktop layout, and mobile layout.
- Targeted screenshots cover the blocker stage and final ready stage.
