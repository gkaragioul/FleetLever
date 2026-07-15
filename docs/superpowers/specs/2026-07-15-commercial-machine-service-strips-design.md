# FleetLever Machines And Service Strips Design

## Objective

Add two useful product demonstrations to the English commercial homepage:

1. A Machines strip that shows how FleetLever organizes assets by operational state.
2. A Service strip that positions Kanban as a clearer way to manage service work and repeatedly demonstrates a machine moving through the workflow.

The strips must extend the existing product story without turning the page into a dashboard gallery.

## Story Position

The strips sit after the main tomorrow-readiness board and before the pre-cutoff workflow:

1. The readiness board gives the operational answer.
2. The Machines strip shows the fleet behind that answer.
3. The Service strip shows how maintenance work moves toward clearance.
4. The existing pre-cutoff section explains how an unresolved blocker becomes a decision.

Backgrounds continue alternating mist and white across every major section.

## Machines Strip

**Eyebrow:** Fleet inventory

**Headline:** Every machine, sorted by what needs attention.

**Supporting copy:** See blocked, review and ready assets with their assignment, condition and next action in one operational view.

The product surface uses three status lanes: Blocked, Review and Ready. Each lane contains compact asset rows with a real machine image, asset code, type, assignment and status. A slow focus sweep moves between lanes to communicate filtering and prioritization without rearranging data or competing with the Service animation.

## Service Strip

**Eyebrow:** A new way to manage service

**Headline:** Manage service as a flow, not a list.

**Supporting copy:** Move each machine from queued to in service to cleared. Owner, parts, deadline and impact on the next shift stay with the work.

The product surface uses three Kanban lanes: Queued, In service and Cleared. One featured machine card repeatedly lifts, travels and lands in the next lane. Lane counts and the card status update after each move. Supporting cards remain stationary so the board reads as a real workflow rather than a decorative carousel.

## Motion Rules

- The complete Kanban loop lasts at least 9 seconds.
- Each stage remains readable for at least 2.4 seconds.
- Movement uses a soft lift, horizontal travel and settled landing.
- The loop pauses while the board is hovered or keyboard focus is inside it.
- The loop stops when the document is hidden.
- `prefers-reduced-motion: reduce` shows the final cleared state without animation.
- The Machines focus sweep is slower and visually secondary to the Kanban move.

## Responsive Behavior

Desktop uses a restrained two-column editorial strip: copy on one side, product surface on the other. The second strip reverses visual emphasis without reversing reading order.

Mobile stacks copy above the product surface. All three lanes remain visible in a compact horizontal grid; text is shortened rather than truncated into unreadable fragments. No horizontal page scrolling is introduced.

## Accessibility And Quality

- Product demonstrations remain understandable without animation.
- Status is communicated by text as well as color.
- Machine images have descriptive alt text.
- No autoplay control is required because motion is nonessential, pauses on interaction and respects reduced motion.
- Existing heading hierarchy, color system, radius scale and section spacing remain unchanged.

## Acceptance Criteria

- Both strips appear on the homepage in the approved story position.
- Machines shows Blocked, Review and Ready lanes with useful asset detail.
- Service is explicitly positioned as a new way to manage servicing.
- The featured machine visibly moves through all three Kanban stages and repeats.
- The Service motion pauses on interaction and is static for reduced motion.
- Alternating section backgrounds remain correct.
- Desktop and mobile visual, accessibility, contract and production-build checks pass.

