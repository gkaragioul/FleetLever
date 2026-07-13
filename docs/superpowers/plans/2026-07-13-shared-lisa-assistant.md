# Shared Lisa Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a navigation-only Civic Dispatch Lisa and upgrade Fleet Management Lisa to the same concise, context-aware assistant experience.

**Architecture:** A shared `MunicipalLisaAssistant` owns presentation, animation, message history, quick prompts, free-text submission, and navigation-action rendering. Civic and Fleet adapters remain pure domain modules that rank current records and return grounded Greek messages plus opaque navigation IDs; each host translates those IDs into selection, filter, or view navigation only.

**Tech Stack:** Next.js 16.2.6 App Router, React 19.2.4, TypeScript 5, Tailwind CSS 4, lucide-react, Playwright 1.60.0.

## Global Constraints

- Lisa recommends, explains, filters, and navigates; she never mutates operational data.
- Civic Lisa must not call `assignDepartment`, `advanceSelected`, `completeSelected`, or `updateSelected`.
- Fleet Lisa must not release vehicles, close workshop work, assign staff, upload evidence, or change readiness.
- Greek copy must be direct, operational, and avoid unnecessary English terms.
- Each answer contains at most one navigation action.
- Preserve `/fleetlever/assistant/lisa-avatar-clean.png` with `object-cover object-center` and no overlays.
- No external model or network dependency is introduced.

---

### Task 1: Shared Municipal Lisa Shell

**Files:**
- Create: `src/components/fleetlever/municipal-lisa-assistant.tsx`
- Create: `scripts/verify-lisa-assistants.mjs`

**Interfaces:**
- Produces: `MunicipalLisaMessage`, `MunicipalLisaPrompt`, `MunicipalLisaAssistant`.
- `MunicipalLisaAssistant` consumes `open`, `onClose`, `onToggle`, `contextKey`, `appLabel`, `description`, `openingMessage`, `quickPrompts`, `resolvePrompt`, `resolveFreeText`, and `onNavigate`.

- [ ] **Step 1: Write the failing shared-shell browser check**

Add `scripts/verify-lisa-assistants.mjs` with a Playwright helper that opens each application, finds `Άνοιγμα βοηθού Lisa`, opens the panel, verifies the heading `Lisa`, clicks outside, and verifies the panel becomes hidden.

```js
import { chromium } from "playwright";

const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });

async function verifyShell(path) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Άνοιγμα βοηθού Lisa" }).click();
  await page.getByRole("heading", { name: "Lisa" }).waitFor();
  await page.locator("main").click({ position: { x: 700, y: 120 } });
  await page.locator("[data-lisa-panel]").waitFor({ state: "hidden" });
  await page.close();
}

await verifyShell("/civic-dispatch");
await verifyShell("/fleet-management");
await browser.close();
```

- [ ] **Step 2: Run the browser check and confirm Civic fails**

Run: `node scripts/verify-lisa-assistants.mjs`

Expected: FAIL because Civic Dispatch has no button named `Άνοιγμα βοηθού Lisa`.

- [ ] **Step 3: Implement the shared shell**

Create the following public contract and implement the existing Fleet visual behavior in a reusable component:

```tsx
export type MunicipalLisaMessage = {
  id: string;
  role: "lisa" | "user";
  text: string;
  bullets?: string[];
  action?: { id: string; label: string; tone?: "neutral" | "attention" };
};

export type MunicipalLisaPrompt = { id: string; label: string };

export type MunicipalLisaAssistantProps = {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  contextKey: string;
  appLabel: string;
  description: string;
  openingMessage: MunicipalLisaMessage;
  quickPrompts: MunicipalLisaPrompt[];
  resolvePrompt: (id: string, label: string) => MunicipalLisaMessage;
  resolveFreeText: (value: string) => MunicipalLisaMessage;
  onNavigate: (actionId: string) => void;
};
```

The shell must retain only the most recent five messages, reset to the current opening message when `contextKey` changes, animate with opacity/translate/scale over 180–200ms, close on outside pointer-down, and render the launcher at bottom-left on desktop and mobile-safe bottom spacing.

- [ ] **Step 4: Run static checks**

Run: `npx eslint src/components/fleetlever/municipal-lisa-assistant.tsx scripts/verify-lisa-assistants.mjs && npx tsc --noEmit --pretty false`

Expected: PASS with no output.

- [ ] **Step 5: Commit the shared shell**

```bash
git add src/components/fleetlever/municipal-lisa-assistant.tsx scripts/verify-lisa-assistants.mjs
git commit -m "feat: add shared municipal Lisa shell"
```

### Task 2: Civic Dispatch Recommendation Adapter and Integration

**Files:**
- Create: `src/components/fleetlever/civic-lisa.ts`
- Modify: `src/components/fleetlever/civic-dispatch-tool.tsx`
- Modify: `scripts/verify-lisa-assistants.mjs`

**Interfaces:**
- Consumes: `MunicipalLisaMessage` and `MunicipalLisaPrompt`.
- Produces: `CivicLisaRequest`, `CivicLisaIntent`, `civicLisaPrompts`, `buildCivicLisaOpening`, `resolveCivicLisaIntent`, and `parseCivicLisaIntent`.
- Navigation IDs: `filter:urgent`, `filter:unassigned`, `filter:field`, and `request:<request-id>`.

- [ ] **Step 1: Extend the failing Civic browser checks**

After opening Civic Lisa, click the quick prompt `Χωρίς ανάθεση`, assert the response contains `2 αιτήματα χωρίς ανάθεση`, click its navigation action, and assert the Civic queue filter button `Χωρίς ανάθεση 2` is active. Then reopen Lisa, click `Τι προέχει;`, follow the request action, and verify the referenced request is selected.

```js
await page.getByRole("button", { name: "Χωρίς ανάθεση" }).click();
await page.getByText("2 αιτήματα χωρίς ανάθεση", { exact: false }).waitFor();
await page.getByRole("button", { name: "Προβολή χωρίς ανάθεση" }).click();
await page.getByRole("button", { name: "Χωρίς ανάθεση 2" }).waitFor();
```

- [ ] **Step 2: Run the Civic check and confirm it fails**

Run: `node scripts/verify-lisa-assistants.mjs`

Expected: FAIL because Civic prompts and navigation are not connected.

- [ ] **Step 3: Implement the pure Civic adapter**

Use this structural input so the adapter does not import the page component:

```ts
export type CivicLisaRequest = {
  id: string;
  title: string;
  stage: "citizen" | "triage" | "department" | "field" | "done";
  assignee: string;
  due: string;
  urgent: boolean;
  department: string;
};

export type CivicLisaIntent =
  | "queue-summary"
  | "next-request"
  | "urgent"
  | "unassigned"
  | "delayed"
  | "field"
  | "selected-request";
```

Rank active requests by urgent-and-unassigned, urgent, unassigned, due today, field, then remaining active. Map Greek terms for `άμεσο`, `ανάθεση`, `καθυστέρηση`, `πεδίο`, `επόμενο`, and `αίτημα` to the supported intents. Unsupported text returns a capability response with no action.

- [ ] **Step 4: Integrate Civic Lisa without mutation access**

Add `lisaOpen` state. Pass `requests`, `selected`, and summary data into the adapter. Translate navigation IDs only as follows:

```ts
function handleLisaNavigation(actionId: string) {
  if (actionId.startsWith("filter:")) {
    setQueueFilter(actionId.slice(7) as QueueFilter);
    setLisaOpen(false);
    return;
  }
  if (actionId.startsWith("request:")) {
    setQueueFilter("all");
    setSelectedId(actionId.slice(8));
    setLisaOpen(false);
  }
}
```

Do not pass mutation callbacks to the assistant. Add a soft page scrim while Lisa is open and render `MunicipalLisaAssistant` after the main content.

- [ ] **Step 5: Verify Civic behavior and layout**

Run: `node scripts/verify-lisa-assistants.mjs`

Expected: Civic prompt, recommendation, navigation, outside-click, and no-overflow assertions pass.

- [ ] **Step 6: Commit Civic Lisa**

```bash
git add src/components/fleetlever/civic-lisa.ts src/components/fleetlever/civic-dispatch-tool.tsx scripts/verify-lisa-assistants.mjs
git commit -m "feat: add Civic Dispatch Lisa guidance"
```

### Task 3: Fleet Recommendation Adapter and Shared-Shell Migration

**Files:**
- Create: `src/components/fleetlever/fleet-lisa.ts`
- Modify: `src/components/fleetlever/construction-prototype.tsx`
- Modify: `scripts/verify-lisa-assistants.mjs`

**Interfaces:**
- Consumes: `MunicipalLisaMessage`, `MunicipalLisaPrompt`.
- Produces: `FleetLisaContext`, `FleetLisaIntent`, `fleetLisaPrompts`, `buildFleetLisaOpening`, `resolveFleetLisaIntent`, and `parseFleetLisaIntent`.
- Navigation IDs: `machine:<id>`, `view:tomorrow`, `view:certificates`, `view:service`, `view:staff`, and `view:history`.

- [ ] **Step 1: Extend the failing Fleet browser checks**

Open Fleet Lisa and verify prompts `Τι προέχει;`, `Έγγραφα`, `Συνεργείο`, and `Προσωπικό`. Click `Προσωπικό`, follow `Άνοιγμα προσωπικού`, and assert the sidebar item `Προσωπικό` is active. Reopen Lisa, submit unsupported text, and verify a concise capability response appears without a navigation action.

- [ ] **Step 2: Run the Fleet check and confirm the new behavior fails**

Run: `node scripts/verify-lisa-assistants.mjs`

Expected: FAIL because the existing Lisa lacks staff guidance and still uses its private shell.

- [ ] **Step 3: Implement the pure Fleet adapter**

Use a host-mapped context rather than importing private Fleet types:

```ts
export type FleetLisaIssue = {
  id: string;
  code: string;
  state: "ready" | "at_risk" | "blocked";
  reason: string;
  nextAction: string;
  owner: string;
  eta: string;
};

export type FleetLisaContext = {
  serviceName: string;
  issues: FleetLisaIssue[];
  documentItems: string[];
  workshopItems: string[];
  staffItems: string[];
};
```

Resolve `shift-summary`, `next-action`, `blockers`, `documents`, `workshop`, `staff`, and `history`. Recommendations may point to a machine or view only. Unsupported free text returns the supported capability list.

- [ ] **Step 4: Replace the private Fleet shell with the shared shell**

Remove the local `LisaMessage`, `LisaAssistant`, `lisaOpeningMessage`, and `lisaAnswerForIntent` implementation. Map current vehicles, certificates, service work, and staff gaps into `FleetLisaContext`. Translate navigation IDs to the existing `onOpenMachine` and `setActiveView` flows only.

Keep the existing page scrim and `lisaOpen` state. Do not change any vehicle, service, evidence, staff, or release state from a Lisa callback.

- [ ] **Step 5: Verify Fleet behavior and regression safety**

Run: `node scripts/verify-lisa-assistants.mjs`

Expected: Civic and Fleet assistant checks pass, including navigation-only behavior and no horizontal overflow at 1440×960 and 390×844.

- [ ] **Step 6: Commit Fleet Lisa migration**

```bash
git add src/components/fleetlever/fleet-lisa.ts src/components/fleetlever/construction-prototype.tsx scripts/verify-lisa-assistants.mjs
git commit -m "feat: unify Fleet Lisa recommendations"
```

### Task 4: Final Cross-App Verification

**Files:**
- Modify: `scripts/verify-lisa-assistants.mjs` only if an assertion needs a more stable accessible selector.

**Interfaces:**
- Consumes the completed shared shell and both domain integrations.
- Produces final verification evidence only; no new product behavior.

- [ ] **Step 1: Run focused static checks**

Run:

```bash
npx eslint src/components/fleetlever/municipal-lisa-assistant.tsx src/components/fleetlever/civic-lisa.ts src/components/fleetlever/civic-dispatch-tool.tsx src/components/fleetlever/fleet-lisa.ts src/components/fleetlever/construction-prototype.tsx scripts/verify-lisa-assistants.mjs
npx tsc --noEmit --pretty false
git diff --check
```

Expected: all commands pass with no errors.

- [ ] **Step 2: Run end-to-end assistant verification**

Run: `node scripts/verify-lisa-assistants.mjs`

Expected: both apps pass launcher, animation, outside-click, quick prompt, free-text, navigation, and responsive-overflow checks with zero console or page errors.

- [ ] **Step 3: Capture final desktop and mobile screenshots**

Save these files from the verification script:

- `reports/civic-dispatch-lisa-desktop.png`
- `reports/civic-dispatch-lisa-mobile.png`
- `reports/fleet-management-lisa-unified-desktop.png`
- `reports/fleet-management-lisa-unified-mobile.png`

Expected: Lisa does not obscure the primary action area, the avatar is circular and undistorted, and all text fits its controls.

- [ ] **Step 4: Final commit**

```bash
git add scripts/verify-lisa-assistants.mjs reports/civic-dispatch-lisa-desktop.png reports/civic-dispatch-lisa-mobile.png reports/fleet-management-lisa-unified-desktop.png reports/fleet-management-lisa-unified-mobile.png
git commit -m "test: verify shared Lisa assistants"
```
