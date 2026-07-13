# FleetLever Editions Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship isolated Elliniko, standalone FleetLever B2B console and Greek commercial-site editions locally and on Railway, then release the verified source as `v0.8.0` on GitHub `main`.

**Architecture:** One Next.js repository serves three runtime editions selected by `FLEETLEVER_EDITION`. A typed server configuration controls root behavior, route availability, branding, tenant requirements and healthchecks; Railway runs the same commit as three independent services. Shared operational behavior remains in the FleetLever components while municipality presentation and sample data become an explicit edition layer.

**Tech Stack:** Next.js 16.2.6 App Router and Proxy, React 19.2.4, TypeScript, Tailwind CSS 4, Playwright, Node.js 20.19+, Railway CLI, GitHub CLI.

## Global Constraints

- Editions are exactly `elliniko`, `console` and `site`.
- Local URLs are ports `3000`, `3001` and `3002` respectively.
- The standalone console contains no Elliniko/state presentation and exposes no Civic Dispatch route.
- The commercial website is the existing Greek site, reworked rather than recreated or translated again.
- Railway-generated `*.up.railway.app` domains are used; no custom domains are configured.
- The existing Railway project ID is `ed446f55-ba72-4750-a213-7cdd32e54fc5`.
- The existing `fleetlever-app` service becomes the standalone B2B console.
- Generated screenshots, logs, local environment files and unrelated workspace changes must not enter the release commit.
- The final source commit is released from GitHub `main` with annotated tag `v0.8.0`.

---

### Task 1: Edition Configuration and Local Runners

**Files:**
- Create: `src/lib/fleetlever/edition.ts`
- Create: `scripts/dev-edition.mjs`
- Create: `scripts/verify-edition-config.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `FleetLeverEdition = "elliniko" | "console" | "site"`.
- Produces: `getFleetLeverEdition(): FleetLeverEdition` for server-only runtime selection.
- Produces: `editionConfig(edition): FleetLeverEditionConfig` with `rootPath`, `requiresDatabase`, `allowsMunicipalPortal`, `allowsCivicDispatch` and `brand`.
- Produces: `npm run dev:elliniko`, `npm run dev:console`, `npm run dev:site`.

- [ ] **Step 1: Write the failing configuration verifier**

Create `scripts/verify-edition-config.mjs` to read `src/lib/fleetlever/edition.ts` and assert that all three edition literals, all three root paths and the five configuration fields exist. Exit with code 1 and a precise missing-token message.

- [ ] **Step 2: Run the verifier and confirm failure**

Run: `node scripts/verify-edition-config.mjs`

Expected: FAIL because `src/lib/fleetlever/edition.ts` does not exist.

- [ ] **Step 3: Implement the typed edition configuration**

Create a server-only module with this public shape:

```ts
export type FleetLeverEdition = "elliniko" | "console" | "site";

export type FleetLeverEditionConfig = {
  edition: FleetLeverEdition;
  rootPath: "/main-page" | "/fleet-management" | "/";
  requiresDatabase: boolean;
  allowsMunicipalPortal: boolean;
  allowsCivicDispatch: boolean;
  brand: "municipal" | "fleetlever";
};

export function parseFleetLeverEdition(value: string | undefined): FleetLeverEdition;
export function getFleetLeverEdition(): FleetLeverEdition;
export function editionConfig(edition?: FleetLeverEdition): FleetLeverEditionConfig;
```

Use `console` as the development fallback and throw a descriptive error for an invalid explicit production value.

- [ ] **Step 4: Add the cross-platform local runner**

`scripts/dev-edition.mjs` validates `<edition> <port>`, injects `FLEETLEVER_EDITION` and starts `next dev --hostname 127.0.0.1 --port <port>` with inherited stdio. Use `npx.cmd` on Windows and `npx` elsewhere.

Add package scripts:

```json
"dev:elliniko": "node scripts/dev-edition.mjs elliniko 3000",
"dev:console": "node scripts/dev-edition.mjs console 3001",
"dev:site": "node scripts/dev-edition.mjs site 3002",
"test:edition-config": "node scripts/verify-edition-config.mjs"
```

- [ ] **Step 5: Run configuration checks**

Run: `npm run test:edition-config`

Expected: PASS and list `elliniko`, `console`, `site`.

- [ ] **Step 6: Commit the edition foundation**

```powershell
git add package.json scripts/dev-edition.mjs scripts/verify-edition-config.mjs src/lib/fleetlever/edition.ts
git commit -m "feat: add FleetLever runtime editions"
```

### Task 2: Root Routing, Route Isolation and Healthchecks

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `scripts/railway-predeploy.mjs`
- Create: `scripts/verify-edition-routes.mjs`
- Modify: `src/app/page.tsx`
- Modify: `src/app/main-page/page.tsx`
- Modify: `src/app/fleet-management/page.tsx`
- Modify: `src/app/civic-dispatch/page.tsx`
- Modify: `src/app/api/health/route.ts`
- Modify: `src/proxy.ts`
- Modify: `package.json`
- Modify: `railway.json`

**Interfaces:**
- Consumes: `getFleetLeverEdition()` and `editionConfig()` from Task 1.
- Produces: edition-specific root pages and forbidden-route handling.
- Produces: `GET /api/health` with an `edition` field and site-aware dependency checks.

- [ ] **Step 1: Write the failing route matrix script**

Create `scripts/verify-edition-routes.mjs` with the expected matrix:

```js
const matrix = {
  elliniko: { port: 3000, ok: ["/main-page", "/fleet-management", "/civic-dispatch"], forbidden: [] },
  console: { port: 3001, ok: ["/", "/fleet-management", "/login"], forbidden: ["/main-page", "/civic-dispatch"] },
  site: { port: 3002, ok: ["/", "/landing", "/pricing"], forbidden: ["/main-page", "/fleet-management", "/civic-dispatch"] },
};
```

The script checks status, follows only expected redirects, verifies `/api/health`, and reports each route independently.

- [ ] **Step 2: Start the three current apps and confirm the matrix fails**

Run each dev command in a separate process, then run `node scripts/verify-edition-routes.mjs`.

Expected: FAIL because route isolation does not yet exist.

- [ ] **Step 3: Implement root selection**

Update `src/app/page.tsx` so:

- `elliniko` redirects to `/main-page`.
- `console` redirects unauthenticated users to `/login?next=/fleet-management` and authenticated users to `/fleet-management`.
- `site` renders the existing Greek landing page.

Remove host-name heuristics and make edition configuration the single source of truth.

- [ ] **Step 4: Enforce route availability in server pages and Proxy**

Add server checks to `main-page`, `fleet-management` and `civic-dispatch`. Extend `src/proxy.ts` with an edition route policy that returns a 404 rewrite for forbidden families before authentication checks. Preserve local authentication bypass only for allowed product routes.

- [ ] **Step 5: Make pre-deploy and health edition-aware**

Create `scripts/railway-predeploy.mjs`:

```js
if (process.env.FLEETLEVER_EDITION === "site") {
  console.log("Marketing edition: database migration skipped.");
  process.exit(0);
}
// spawn npm run db:migrate and forward its exit code
```

Change `railway:predeploy` to this script. In `/api/health`, return HTTP 200 for the site edition with `database.required=false` and `storage.required=false`; retain the existing full checks for console and Elliniko.

- [ ] **Step 6: Run route and static checks**

Run:

```powershell
npm run test:edition-config
node scripts/verify-edition-routes.mjs
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint src/app/page.tsx src/app/main-page/page.tsx src/app/fleet-management/page.tsx src/app/civic-dispatch/page.tsx src/app/api/health/route.ts src/proxy.ts src/lib/fleetlever/edition.ts
```

Expected: all checks pass.

- [ ] **Step 7: Commit route isolation**

```powershell
git add package.json railway.json scripts/railway-predeploy.mjs scripts/verify-edition-routes.mjs src/app src/proxy.ts
git commit -m "feat: isolate FleetLever edition routes"
```

### Task 3: Separate Municipal and B2B Product Identity

**Files:**
- Create: `src/components/fleetlever/product-brand.tsx`
- Create: `src/lib/fleetlever/demo-data.ts`
- Create: `scripts/verify-edition-branding.mjs`
- Modify: `src/components/fleetlever/construction-prototype.tsx`
- Modify: `src/components/fleetlever/municipal-brand.tsx`
- Modify: `src/components/fleetlever/municipal-lisa-assistant.tsx`
- Modify: `src/app/fleet-management/page.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `FleetLeverEdition` from Task 1.
- Produces: `<ProductBrand edition={edition} compact inverse />`.
- Produces: `getDemoFleet(edition)` returning municipality or construction-oriented B2B demo records.
- Updates: `<ConstructionPrototype edition={edition} />`.

- [ ] **Step 1: Write the failing branding verifier**

Create `scripts/verify-edition-branding.mjs` to fetch the rendered console HTML from ports 3000 and 3001. Assert Elliniko contains `Δήμος Ελληνικού` and standalone contains `FleetLever` while excluding `Ελληνικού`, `Αργυρούπολης`, `/main-page` and municipal logo asset paths.

- [ ] **Step 2: Confirm the B2B branding check fails**

Run: `node scripts/verify-edition-branding.mjs`

Expected: FAIL because the current shared prototype renders municipal presentation.

- [ ] **Step 3: Add the product-brand boundary**

`product-brand.tsx` renders `MunicipalBrandLockup` only for `elliniko`; otherwise it renders `FleetLeverLogo`. It also exports edition-specific product name, client label, portal return availability and assistant subtitle.

- [ ] **Step 4: Split demo data by edition**

Move municipality-specific names, vehicle photos, services and sample labels into an Elliniko dataset. Recover the generic construction machines and work-release examples from the tracked pre-municipal prototype for the B2B dataset. `getDemoFleet()` returns fresh arrays to prevent state leakage between render sessions.

- [ ] **Step 5: Pass edition through the fleet console**

Change the page to call `<ConstructionPrototype edition={edition} />`. Replace direct `MunicipalBrandLockup`, `PortalReturnLink`, municipality metadata and `defaultClientName` usage with edition-aware values. Hide the portal-return control for `console`. Keep Lisa's operational recommendation behavior but use FleetLever-only copy in standalone mode.

- [ ] **Step 6: Make document metadata edition-aware**

Generate title, description and icons from the active edition in `src/app/layout.tsx` without exposing municipal branding to the site or standalone console.

- [ ] **Step 7: Verify visual identity and behavior**

Run:

```powershell
node scripts/verify-edition-branding.mjs
npx.cmd tsc --noEmit --pretty false
npx.cmd eslint src/components/fleetlever/product-brand.tsx src/components/fleetlever/construction-prototype.tsx src/lib/fleetlever/demo-data.ts src/app/fleet-management/page.tsx src/app/layout.tsx
```

Expected: standalone contains only FleetLever brand; Elliniko retains municipal presentation.

- [ ] **Step 8: Commit product separation**

```powershell
git add src/components/fleetlever src/lib/fleetlever src/app/fleet-management/page.tsx src/app/layout.tsx scripts/verify-edition-branding.mjs public/fleetlever public/municipal
git commit -m "feat: separate municipal and B2B FleetLever branding"
```

### Task 4: Rework the Existing Greek Commercial Website

**Files:**
- Create: `src/components/site/site-header.tsx`
- Create: `src/components/site/product-proof.tsx`
- Create: `src/components/site/site-footer.tsx`
- Create: `src/content/fleetlever-site-copy.ts`
- Create: `scripts/verify-commercial-site.mjs`
- Modify: `src/app/landing/page.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/globals.css`
- Reuse: `public/fleetlever/site/*`

**Interfaces:**
- Produces: Greek-first public navigation and one consistent `Ζήτησε demo` CTA.
- Produces: semantic sections `#product`, `#how-it-works`, `#proof`, `#pricing`.
- Consumes: actual FleetLever screenshots already stored under `public/fleetlever/site/`.

- [ ] **Step 1: Write the failing commercial-site verifier**

Create `scripts/verify-commercial-site.mjs` using Playwright. At 1440x1000 and 390x844, assert the site has exactly one H1, visible FleetLever brand, visible hero product image, the four semantic section IDs, one primary CTA phrase, no horizontal overflow, no missing images and no console errors.

- [ ] **Step 2: Capture the current site and confirm at least one new assertion fails**

Run: `node scripts/verify-commercial-site.mjs`

Expected: FAIL because the required proof section and CTA consistency are not yet implemented.

- [ ] **Step 3: Extract and tighten Greek copy**

Move the final Greek copy into `src/content/fleetlever-site-copy.ts`. Use the approved positioning:

```text
FleetLever
Ξέρεις από σήμερα τι δεν θα δουλέψει αύριο.
Ένας έλεγχος πριν κλείσει η μέρα δείχνει ποιο μηχάνημα, έγγραφο, χειριστής ή εργασία service σταματά το αυριανό πρόγραμμα.
```

Remove duplicated value propositions and use `Ζήτησε demo` for primary actions.

- [ ] **Step 4: Rebuild the landing hierarchy**

Implement the approved sequence: restrained header, product-first hero, operational failure modes, three-step release workflow, actual product proof, role/use-case strip, narrow pilot/pricing section, final CTA and compact footer. Avoid nested cards and decorative gradients.

- [ ] **Step 5: Align pricing with the landing page**

Keep one pilot offer, explicit onboarding boundaries and the same CTA/copy vocabulary. Remove sections that repeat the landing page without adding buying information.

- [ ] **Step 6: Verify desktop and mobile**

Run:

```powershell
node scripts/verify-commercial-site.mjs
npx.cmd eslint src/app/landing/page.tsx src/app/pricing/page.tsx src/components/site src/content/fleetlever-site-copy.ts
npx.cmd tsc --noEmit --pretty false
```

Expected: all checks pass and screenshots are saved under `reports/release-v0.8.0/`.

- [ ] **Step 7: Commit the site rework**

```powershell
git add src/app/landing src/app/pricing src/app/globals.css src/components/site src/content/fleetlever-site-copy.ts scripts/verify-commercial-site.mjs public/fleetlever/site
git commit -m "feat: rework Greek FleetLever commercial site"
```

### Task 5: Full Local Release Verification and Documentation

**Files:**
- Create: `scripts/verify-release-v080.mjs`
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: three running local editions.
- Produces: one release verification command and a local/public URL table.

- [ ] **Step 1: Add a failing release verifier**

The verifier runs the route, branding, Lisa and commercial-site checks and writes a JSON summary to `reports/release-v0.8.0/verification.json`. It exits nonzero if any edition fails.

- [ ] **Step 2: Update environment and repository hygiene**

Document `FLEETLEVER_EDITION`. Ignore `.fleetlever-*.log` and generated `reports/` files while preserving deliberately tracked product assets. Do not delete existing user reports.

- [ ] **Step 3: Update README**

Document all three local commands, route boundaries, Railway service names, data requirements and the release verification command. Leave public URL fields marked as generated during Task 6, not as speculative domains.

- [ ] **Step 4: Run full local verification**

Run:

```powershell
npm run lint
npx.cmd tsc --noEmit --pretty false
npm run build
node scripts/verify-release-v080.mjs
```

Expected: zero lint/type/build errors and every local edition marked `pass`.

- [ ] **Step 5: Commit documentation and release checks**

```powershell
git add .env.example .gitignore README.md scripts/verify-release-v080.mjs
git commit -m "test: verify FleetLever v0.8 editions"
```

### Task 6: GitHub Main Release and Railway Services

**Files:**
- Modify: `README.md` after domains are generated.
- Create: GitHub release notes through `gh release create`.
- Configure: Railway services and variables through `railway.cmd`.

**Interfaces:**
- Consumes: verified local release commit.
- Produces: GitHub `main`, annotated `v0.8.0`, three healthy Railway domains.

- [ ] **Step 1: Audit the release diff**

Compare against `origin/main`. Confirm no `.env`, logs, ad-hoc reports, unrelated files or secrets are staged. Run `git diff --check` and secret-oriented filename checks.

- [ ] **Step 2: Integrate the verified commits into main**

Fetch `origin/main`, create a safety branch if required, and update local `main` without discarding user changes. Resolve only release-related conflicts. Push the verified `main` commit to `origin`.

- [ ] **Step 3: Configure the existing console service**

Set `FLEETLEVER_EDITION=console` on `fleetlever-app`, retain its database/bucket/session variables and deploy the `main` source. Verify its existing domain returns the standalone FleetLever console.

- [ ] **Step 4: Create and configure the Elliniko service**

Create `fleetlever-elliniko` from `gkaragioul/FleetLever` branch `main`. Set `FLEETLEVER_EDITION=elliniko`, session variables and a dedicated Elliniko organization/profile tenant. Generate a Railway domain and verify all three municipal routes.

- [ ] **Step 5: Create and configure the site service**

Create `fleetlever-site` from branch `main`. Set `FLEETLEVER_EDITION=site`, generate a Railway domain and verify `/`, `/landing`, `/pricing` and `/api/health` without database variables.

- [ ] **Step 6: Record permanent domains**

Replace the README public URL placeholders with the exact three verified Railway URLs, commit and push the documentation update, then wait for all three Railway services to report `SUCCESS` on that commit.

- [ ] **Step 7: Tag and publish the release**

Create annotated tag `v0.8.0` with a description covering the municipal edition, standalone B2B console, commercial-site rework, route isolation and permanent URLs. Push the tag and create a GitHub release from it with verification results and demo limitations.

- [ ] **Step 8: Final production verification**

Run the release verifier against the three public domains. Confirm health HTTP 200, correct edition branding, forbidden cross-edition routes, nonblank desktop/mobile rendering and no browser console errors. Report the exact permanent URLs to the user.

## Plan Self-Review

- Spec coverage: all product boundaries, local URLs, Railway services, branding, Greek site rework, authentication, health, Git, release tagging and verification requirements map to Tasks 1-6.
- Placeholder scan: public domains intentionally cannot be named before Railway creates them; Task 6 defines the exact generation and replacement step rather than leaving an implementation decision open.
- Type consistency: `FleetLeverEdition`, `FleetLeverEditionConfig`, `getFleetLeverEdition()`, `editionConfig()`, `<ConstructionPrototype edition>` and `<ProductBrand edition>` are defined once and reused consistently.
