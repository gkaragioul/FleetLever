# FleetLever Pricing Page Redesign

## Design Read

This is a conversion-focused B2B pricing page for fleet operations and procurement buyers. It should feel like a confident operating proposal, not a SaaS feature catalogue.

Design dials:

- Design variance: 6
- Motion intensity: 3
- Visual density: 5

## Core Buying Story

The page should answer four questions in order:

1. Can we prove the workflow before committing?
2. Which annual operating scope fits us?
3. What is included in every deployment?
4. What changes the total price?

## Page Structure

### Proof-led opening

Combine the current hero and pilot sections. Lead with the 30-day paid pilot, its EUR 1,000 price, conversion credit, four concrete deliverables, and a real FleetLever product image. Remove the separate dark pilot band and duplicated explanation.

### Annual scope columns

Present Single Team, Operations, and Enterprise as three aligned columns. Align plan name, price, scope counters, feature list, and CTA. Make Operations the visual recommendation without changing its price or scope.

### Shared platform strip

State the capabilities included across annual plans once instead of repeating them inside every column.

### Price-change map

Replace the five-row implementation table with three compact categories: launch, expand, and integrate. Keep all current prices visible while shortening the explanatory copy.

### Terms and questions

Show the four commercial terms in a compact grid. Put FAQs inside native details elements so secondary copy is available without making the page feel long.

## Constraints

- Keep `/pricing`, navigation labels, metadata, analytics IDs, plan names, and commercial amounts stable.
- Keep the page in English.
- Use the existing FleetLever palette, typography, icon family, and 8px-or-less radius system.
- Preserve keyboard focus, semantic headings, and reduced-motion behavior.
- Do not add dependencies.
- Make plan columns collapse cleanly on mobile without horizontal scrolling.

## Acceptance Criteria

- The pilot and annual decision path is understandable in the first viewport.
- All three annual plans can be compared without scanning across separate horizontal rows.
- Repeated copy is removed.
- Implementation and FAQ content no longer dominates the page.
- Desktop and mobile layouts have no clipping or overflow.
- Contract, lint, type, and browser checks pass.
