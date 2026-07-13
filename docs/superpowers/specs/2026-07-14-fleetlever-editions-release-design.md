# FleetLever Editions and Release Design

## Objective

Release the current product as three clearly separated experiences from one maintained codebase:

1. An Elliniko-Argyroupoli municipal review edition.
2. A standalone Greek-first FleetLever B2B console.
3. A reworked version of the existing Greek FleetLever commercial website.

Each experience must have a stable local URL, an independent Railway service and a permanent Railway-provided public domain. The release must be committed to GitHub `main` and marked with an annotated version tag and release description.

## Product Boundaries

### Elliniko municipal edition

The municipal edition is the complete state-review package. It includes:

- The Elliniko-Argyroupoli employee login portal.
- The municipal application drawer.
- The municipal FleetLever fleet-management experience.
- Civic Dispatch.
- Municipal logos, terminology, colors and Greek copy.
- Lisa configured for municipal fleet and civic-dispatch guidance.

Its root route opens or redirects to the employee portal. The edition exposes these public application paths:

- `/main-page`
- `/fleet-management`
- `/civic-dispatch`

### Standalone FleetLever console

The standalone edition is the sellable B2B product. It includes only the FleetLever fleet-management console and its supporting authentication, API, field, document and upload routes.

It must not expose:

- The municipal employee portal.
- Civic Dispatch.
- Elliniko-Argyroupoli logos or municipality-specific copy.
- State or municipal positioning.

Its root route opens the FleetLever B2B login or console flow. The product header, navigation, empty states, assistant identity and metadata use FleetLever branding only. The console remains Greek-first.

### Existing Greek commercial website

The current Greek commercial site is the starting point. This work does not create a second site and does not repeat the existing translation. The release reworks the current `/landing` and `/pricing` experience into a stronger commercial presentation while preserving useful product screenshots and product facts.

The website service exposes only public marketing routes. Product-console and municipality routes are unavailable on this service.

## Architecture

### Edition selection

A server-side environment variable selects the edition:

```text
FLEETLEVER_EDITION=elliniko | console | site
```

Edition configuration lives in one typed module. It defines:

- Edition name.
- Root experience.
- Allowed route families.
- Brand identity.
- Authentication behavior.
- Healthcheck requirements.
- External links between the website and console.

Server components pass brand and edition information into shared client components. Client code does not read private deployment variables directly.

### Route isolation

The Next.js proxy enforces edition boundaries before rendering:

- `elliniko` allows municipal portal, fleet management and civic dispatch.
- `console` allows FleetLever console, login, field and product API routes.
- `site` allows the commercial website, pricing and static public assets.

Requests for routes outside the active edition return the correct root experience or a not-found response. There are no navigation links to unavailable products.

### Shared product code

The three deployments use the same repository and shared FleetLever components. Municipal branding is supplied as an edition layer instead of being embedded as the default product identity. The large fleet-management prototype is changed only where needed to accept a brand/edition configuration; unrelated operational behavior is not redesigned.

## Local Development URLs

Three explicit development commands run the editions without changing source files:

```text
npm run dev:elliniko  -> http://127.0.0.1:3000
npm run dev:console   -> http://127.0.0.1:3001
npm run dev:site      -> http://127.0.0.1:3002
```

The Elliniko local URLs are:

```text
http://127.0.0.1:3000/main-page
http://127.0.0.1:3000/fleet-management
http://127.0.0.1:3000/civic-dispatch
```

The console root at port 3001 must not redirect through the municipal portal. The site root at port 3002 must render the commercial website.

## Railway Deployment

Use the existing Railway project `FleetLever` (`ed446f55-ba72-4750-a213-7cdd32e54fc5`) and its production environment.

### Services

1. `fleetlever-elliniko`
   - `FLEETLEVER_EDITION=elliniko`
   - Permanent Railway-provided domain.
   - Municipal review tenant configuration.

2. `fleetlever-app`
   - Existing service and existing domain.
   - `FLEETLEVER_EDITION=console`
   - Standalone FleetLever B2B identity.

3. `fleetlever-site`
   - `FLEETLEVER_EDITION=site`
   - Permanent Railway-provided domain.
   - No production database or object-storage requirement.

The existing Postgres and upload bucket remain the application data services. The Elliniko and B2B services use separate tenant identifiers so their state cannot collide. The marketing service receives a lightweight health response and does not fail because application storage is intentionally absent.

The shared Railway pre-deploy command is edition-aware: it runs database migrations for `elliniko` and `console`, and exits successfully without touching the database for `site`.

### Domains

Railway-generated `*.up.railway.app` domains are the permanent URLs for this release. No custom DNS work is included. The generated URLs are recorded in the README and GitHub release notes after successful deployment.

## Commercial Website Rework

The commercial site must feel like a focused B2B product site rather than a generic software template.

### Positioning

The page leads with the operational outcome: knowing which machine or job cannot be released tomorrow, why, and who must act. It avoids municipal wording and broad fleet-management claims.

### Page structure

1. A restrained navigation with Product, How it works, Pricing and Demo.
2. A first viewport that names FleetLever and states the release-control outcome in Greek.
3. A visible product screenshot showing the actual readiness decision surface.
4. A concise problem section based on real operational failure modes.
5. A three-step workflow: prepare, verify, release.
6. Product proof using existing screenshots for tomorrow readiness, machine passport and decision history.
7. Clear role/use-case coverage without repetitive cards.
8. A narrow pilot/pricing explanation with explicit onboarding expectations.
9. A final demo action and compact footer.

### Visual direction

- FleetLever teal, near-black, white and restrained neutral surfaces.
- Actual product imagery, not decorative illustrations.
- Strong editorial hierarchy and controlled section density.
- No gradient decoration, floating orbs, nested cards or oversized empty areas.
- Cards only for repeated proof or workflow items.
- Mobile layouts preserve readable copy and visible product evidence.

### Copy rules

- Greek-first, plain operational language.
- One claim per section.
- No duplicated value propositions.
- Avoid internal terms where a supervisor or fleet operator would use simpler wording.
- Calls to action use one primary phrase consistently: `Ζήτησε demo`.

## Authentication and Data Flow

- The Elliniko review portal keeps its current demonstration access behavior.
- The B2B console uses the existing FleetLever login/session flow and never redirects through `/main-page`.
- Product API routes remain session-protected outside local development.
- Each Railway application service receives its own default organization/profile tenant variables.
- Uploads and state persistence continue through the existing Postgres and bucket boundaries.
- The site edition does not initialize product data or require application credentials.

## Error Handling

- Unknown or edition-forbidden pages return not found or redirect to that edition's root.
- Missing edition configuration fails with a clear server error in production and defaults safely during local development.
- Healthchecks report edition, database readiness and storage readiness without exposing secrets.
- Failed Railway deployment or healthcheck prevents the corresponding URL from being reported as complete.
- The existing B2B public URL remains live until its replacement deployment passes health and route checks.

## Git and Release Strategy

1. Preserve unrelated user files and generated reports outside the release commit.
2. Commit the implementation in reviewable groups: edition infrastructure, branding/product separation, commercial site rework, deployment documentation.
3. Run the full verification suite before updating `main`.
4. Push the finished release to GitHub `main`.
5. Create annotated tag `v0.8.0` on the verified release commit.
6. Create a GitHub release whose description lists:
   - Elliniko municipal edition.
   - Standalone FleetLever console.
   - Reworked Greek commercial website.
   - Permanent Railway URLs.
   - Verification status and known demo limitations.

One monorepo release tag is used because all three deployable editions are produced by the same source commit. Multiple artifact tags on the same commit would add ambiguity without improving rollback.

## Verification

### Static checks

- ESLint.
- TypeScript.
- Production build for each edition.
- Existing design and smoke scripts where applicable.

### Route matrix

Automated checks verify every edition's allowed and forbidden routes. In particular:

- Elliniko opens all three municipal experiences.
- Console root reaches FleetLever without `/main-page`.
- Console cannot open Civic Dispatch or municipal portal.
- Site root and pricing render without product authentication.
- Site cannot open product or municipal routes.

### Browser checks

Playwright captures desktop and mobile screenshots of:

- Elliniko portal and both municipal applications.
- Standalone FleetLever login and main console.
- Commercial homepage and pricing page.

Checks cover nonblank rendering, branding, navigation, route isolation, responsive layout, visible calls to action and absence of console errors.

### Deployment checks

For each Railway service:

- Deployment status is `SUCCESS`.
- `/api/health` returns success for the active edition.
- The public domain returns the correct root experience.
- Cross-edition routes are unavailable.
- The Git commit shown by Railway matches `v0.8.0`.

## Acceptance Criteria

- The three local commands and URLs work concurrently.
- Elliniko retains municipal branding and both applications.
- Standalone FleetLever contains no Elliniko/state presentation and no Civic Dispatch access.
- The existing Greek commercial site is visibly and substantively improved.
- Three stable Railway service domains are live and verified.
- GitHub `main` contains only intended source, documentation and required assets.
- Annotated `v0.8.0` and its GitHub release description are published.
- README documents all local and public URLs.
