# FleetLever Industry Switchboard Design

## Goal

Replace the flat industry list with a memorable visual system that proves FleetLever serves different operating environments without weakening its single release-control proposition.

## Direction

The section becomes an image-led operations switchboard. Four adjacent drawers represent construction, equipment rental, municipal/public works, and specialist service fleets. One drawer is open at a time; the others remain visible as narrow visual tabs so the breadth of the product is understood at a glance.

The open drawer contains:

- a real operational photograph;
- the industry's specific release question;
- three concrete readiness checks;
- a shared `One release control loop` marker.

The active drawer advances every 5.8 seconds. Hover, keyboard focus, pointer interaction, and a hidden browser tab pause the sequence. Selecting any drawer opens it immediately. Reduced-motion users receive a stable first drawer with no automatic movement.

## Layout

Desktop uses a horizontal expanding drawer system inside one full-width framed visual surface. The active drawer occupies the majority of the width and inactive drawers retain enough width to show their image, number, and title. Copy sits within the image rather than in detached cards.

Mobile uses a vertical image accordion. The active drawer expands to reveal its question and checks; inactive drawers remain compact. No horizontal scrolling is introduced.

## Visual Identity

- Images are high-contrast operational scenes, not generic office imagery.
- FleetLever teal is used as a functional marker and focus line, not a decorative wash.
- Each industry has one restrained signal colour used only for its index and status marker.
- Typography, borders, and spacing continue the existing editorial commercial-site language.
- The section remains on the existing mist background so the alternating page rhythm is preserved.

## Copy

Section eyebrow: `One control loop. Four operating worlds.`

Headline: `Built for the moment before any fleet goes out.`

Supporting line: `The assets change. The release decision does not.`

Industries:

1. Construction and heavy equipment: machine, operator, attachment and site documents.
2. Equipment rental: return condition, damage, accessories and next booking.
3. Municipal and public works: vehicle, crew, route and public-service readiness.
4. Specialist and service fleets: van, technician, tools and job requirements.

## Accessibility And Motion

- The drawers use a tablist/tab relationship with `aria-selected` and labelled panels.
- Keyboard focus opens a drawer and always has a visible focus treatment.
- Images have descriptive alternative text.
- Motion uses transforms, opacity, and flex growth only.
- `prefers-reduced-motion: reduce` disables automatic cycling and transitions.
- The component pauses while the user is interacting with it.

## Acceptance Criteria

- All four industries are visible without reading a long list.
- Each industry is visually distinct and contains specific operational checks.
- Desktop shows an expanding horizontal drawer system.
- Mobile shows a usable stacked accordion without overflow.
- Auto-rotation, hover pause, manual selection, keyboard use, and reduced motion work.
- Existing homepage order, anchors, analytics, copy language, and alternating section background remain intact.

