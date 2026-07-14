# Pre-Morning Timeline Design

## Goal

Replace the generic feature list under the commercial landing-page section currently labeled "Πριν φτάσει το πρωί" with a concise operational timeline that shows how FleetLever turns an evening risk into a controlled morning decision.

## Role In The Page

This section is a calm bridge between the large readiness visual above it and the workflow section below it. It must clarify the product promise without competing with the existing lane animation or machine-passport animation.

## Content

- Eyebrow: "Πριν ξεκινήσει η βάρδια"
- Headline: "Η αυριανή βάρδια κρίνεται από σήμερα."
- Supporting copy: "Το FleetLever βρίσκει ό,τι λείπει, ορίζει υπεύθυνο και κρατά εκτός μόνο ό,τι δεν έχει αποδειχθεί έτοιμο."
- Timeline event at 17:20: expired CR-04 certificate detected.
- Timeline event at 17:32: renewal assigned to Maria with a same-day deadline.
- Timeline event at 18:05: a replacement machine reserved for tomorrow's work.
- Outcome at 05:45: the shift opens without surprises, with two machines ready and two kept out for a recorded reason.

## Visual Direction

- Preserve the existing light FleetLever palette and section width.
- Use one chronological ruled timeline instead of three icon cards.
- Give time, system signal, action, and consequence a clear reading order.
- End with a restrained green outcome row rather than a promotional card.
- Use a subtle one-time reveal and timeline-line fill when the section enters the viewport.
- Provide a static completed state for reduced-motion users.

## Responsive Behavior

- Desktop: two-column layout with narrative copy on the left and timeline on the right.
- Mobile: single-column layout with times aligned beside each event and no horizontal overflow.
- All Greek labels must remain fully visible without ellipsis.

## Constraints

- Do not add a new CTA.
- Do not change surrounding sections, routes, analytics hooks, or navigation.
- Do not add dependencies.
- Do not use gradients, decorative cards, or scroll hijacking.
- Keep corner radii at 6px or less.
- Preserve semantic headings and reduced-motion support.

## Acceptance

- The old three-row blocker list is removed.
- The new copy and all four times are visible.
- Motion is subtle, purposeful, and disabled under `prefers-reduced-motion: reduce`.
- Desktop and mobile have no horizontal overflow, text truncation, broken images, or console errors.
