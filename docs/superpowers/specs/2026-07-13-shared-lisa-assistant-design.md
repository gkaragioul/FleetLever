# Shared Lisa Assistant Design

## Objective

Add Lisa to Civic Dispatch and improve the existing Fleet Management Lisa so both applications use one coherent assistant experience. Lisa recommends, explains, filters, and navigates. She never performs operational mutations.

## Product Boundary

Lisa may:

- summarize the current operational state;
- rank the next work to review;
- explain why an item needs attention;
- answer a focused set of Greek free-text questions;
- apply a non-destructive list filter;
- focus or open the relevant request, vehicle, document, service item, or staff view;
- make the boundary visible in her copy: the employee remains responsible for every operational action.

Lisa may not:

- assign staff or departments;
- change workflow stages or readiness states;
- complete, approve, release, or close records;
- upload evidence or edit operational data;
- silently perform an action presented as a recommendation.

## Shared Experience

Both applications use the same Lisa avatar, launcher position, panel geometry, open/close animation, outside-click dismissal, header hierarchy, message style, quick-prompt treatment, and composer. The panel is deliberately compact and task-oriented rather than a general-purpose chat product.

The assistant opens with one short briefing. Only the latest useful exchange remains prominent. Recommendations use one navigation action at most. The action label describes the destination, such as `Προβολή αιτήματος` or `Άνοιγμα φακέλου`, never an operational mutation.

## Civic Dispatch Lisa

### Context

Lisa receives the current requests, selected request, active queue filter, and computed summary counts.

### Supported intents

- `queue-summary`: urgent, unassigned, in-field, and overdue work;
- `next-request`: the highest-priority request to review next;
- `urgent`: urgent active requests;
- `unassigned`: requests without an assignee;
- `delayed`: items whose due text indicates immediate or expired attention;
- `field`: work currently in the field;
- `selected-request`: explanation of the selected request and its recommended next step.

### Navigation

Lisa may set the queue filter and select a request. A navigation response closes the assistant only after the requested destination is visible. Civic Lisa does not call `assignDepartment`, `advanceSelected`, `completeSelected`, or `updateSelected`.

### Priority recommendation

The deterministic priority order is:

1. urgent and unassigned;
2. urgent;
3. unassigned;
4. due today;
5. in field;
6. other active requests.

## Fleet Management Lisa

### Context

Lisa receives the selected service/shift, readiness counts, blocked and at-risk vehicles, open document issues, open service work, staff gaps, and the active view.

### Supported intents

- `shift-summary`: whether tomorrow's shift can close;
- `next-action`: the highest-impact item to review;
- `blockers`: blocking vehicles and reasons;
- `documents`: missing or expiring evidence;
- `workshop`: open service work and parts dependencies;
- `staff`: missing crew, unavailable people, and coverage gaps;
- `history`: navigation to the audit trail.

### Navigation

Lisa may open the relevant vehicle record or switch to documents, workshop, staff, tomorrow, or history. She does not release vehicles, close workshop work, assign staff, upload evidence, or change readiness.

## Architecture

Create a shared presentational `MunicipalLisaAssistant` component with typed messages, quick prompts, avatar/header content, animation, outside-click handling, and composer behavior. It accepts application-specific response and navigation callbacks.

Keep domain logic in two small adapters:

- Civic adapter: derives civic summaries, priority ranking, intent matching, and request/filter navigation.
- Fleet adapter: derives shift summaries, issue ranking, intent matching, and view/vehicle navigation.

The shared shell has no knowledge of civic requests, fleet vehicles, or mutation functions. Each adapter returns plain messages with optional navigation commands. This prevents the assistant from accidentally gaining write access.

## Data Flow

1. The host page passes its current state to the domain adapter.
2. The adapter builds the opening briefing and quick prompts.
3. A quick prompt or free-text entry resolves to a supported intent.
4. The adapter returns a concise recommendation and, when useful, one navigation command.
5. The shared shell renders the response.
6. The host executes only the permitted filter, selection, or view-navigation callback.

Responses are regenerated from current state, so Lisa does not show stale counts after the user changes a request or vehicle elsewhere.

## Language and Visual Rules

- Greek copy is direct, operational, and human.
- Avoid English operational terms such as `blocker`, `service`, and `field` in visible copy where a clear Greek term exists.
- Use one recommendation per answer.
- Avoid dashboard-like metric grids inside the chat.
- Use red only for urgent or blocking conditions, amber for review, green for clear/complete, and municipal teal for navigation.
- Preserve the clean circular Lisa avatar without overlays, badges, or distortion.

## Empty and Error States

- If no matching items exist, Lisa states that clearly and suggests the next relevant view.
- If a referenced record disappears, the navigation action is omitted and Lisa asks the user to refresh the relevant list.
- Unsupported free text falls back to a short capability prompt rather than inventing data.
- No network or model dependency is required for the MVP; responses remain deterministic and grounded in the page state.

## Verification

- Unit-level checks for civic ranking, fleet ranking, and intent resolution.
- Interaction checks for launcher animation, outside-click dismissal, quick prompts, free-text fallback, and navigation callbacks.
- Confirm that no Lisa path invokes mutation functions.
- Desktop and mobile viewport checks with no horizontal overflow or obscured controls.
- ESLint and TypeScript checks for all touched files.

## Acceptance Criteria

- Lisa appears consistently in Civic Dispatch and Fleet Management.
- Civic recommendations reflect the live request queue and navigate to the correct filter/request.
- Fleet recommendations reflect the live shift state and navigate to the correct record/view.
- Lisa never changes operational data.
- The assistant remains concise, calm, visually coherent, and fully usable without an external AI service.
