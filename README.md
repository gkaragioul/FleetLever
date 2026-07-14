# FleetLever

FleetLever is a Greek-first release-control product for equipment-heavy operations. It answers one daily question before machines and crews are committed: what can work tomorrow, what cannot, why, and who must act.

Version `0.8.0` ships one codebase in three isolated editions.

## Editions

| Edition | Purpose | Local URL | Railway URL |
| --- | --- | --- | --- |
| `elliniko` | Employee portal for the Municipality of Elliniko-Argyroupoli | http://127.0.0.1:3000/main-page | https://fleetlever-elliniko-production.up.railway.app/main-page |
| `console` | Standalone B2B FleetLever console | http://127.0.0.1:3001/fleet-management | https://fleetlever-app-production.up.railway.app/fleet-management |
| `site` | Greek FleetLever commercial site | http://127.0.0.1:3002 | https://fleetlever-site-production.up.railway.app |

Elliniko review routes:

- Portal: https://fleetlever-elliniko-production.up.railway.app/main-page
- Municipal fleet: https://fleetlever-elliniko-production.up.railway.app/fleet-management
- Civic dispatch: https://fleetlever-elliniko-production.up.railway.app/civic-dispatch

The B2B console contains no municipal portal or civic-dispatch routes. The commercial site contains no customer application routes.

## Local Development

Install dependencies:

```bash
npm install
```

Start each edition in its own terminal:

```bash
npm run dev:elliniko
npm run dev:console
npm run dev:site
```

Each process uses an independent Next.js build directory, so all three can run together without cache collisions.

## Runtime Selection

Railway selects the edition with one service variable:

```bash
FLEETLEVER_EDITION=elliniko
FLEETLEVER_EDITION=console
FLEETLEVER_EDITION=site
```

`src/proxy.ts` enforces route boundaries at runtime. `src/lib/fleetlever/edition.ts` contains the edition contract and root route for each deployment.

The marketing edition does not require a database. The Elliniko and B2B console editions use Railway Postgres and Railway object storage. Their tenant IDs are configured independently so operational records do not cross editions.

## Validation

Static and browser checks:

```bash
npm run test:edition-config
npm run test:console-edition
npm run test:commercial-site
npm run test:edition-routes
npm run test:console-ui
npm run test:commercial-ui
npx tsc --noEmit
npm run lint
```

Production build:

```bash
npm run build
```

In an isolated Git worktree where `node_modules` is linked outside the worktree root, use Next.js 16's documented Webpack fallback:

```bash
npx next build --webpack
node scripts/prepare-standalone.mjs
```

## Railway

Project: `FleetLever`

Services:

- `fleetlever-app`: standalone B2B console
- `fleetlever-elliniko`: Elliniko municipal review edition
- `fleetlever-site`: public Greek commercial site
- `Postgres`: shared database with tenant-scoped row-level security
- `fleetlever-uploads`: object storage

`railway.json` defines the common build, pre-deploy, healthcheck, and standalone runtime commands. `scripts/railway-predeploy.mjs` skips migrations for the site edition and runs them for application editions.

## Product Surfaces

- `src/components/fleetlever/construction-prototype.tsx`: municipal and standalone fleet console profiles
- `src/app/civic-dispatch/page.tsx`: municipal civic-dispatch application
- `src/app/main-page/page.tsx`: municipal employee portal
- `src/app/landing/page.tsx`: Greek commercial landing page
- `src/app/pricing/page.tsx`: pilot and subscription pricing
- `src/components/fleetlever/commercial-site-shell.tsx`: shared commercial navigation and footer
- `src/components/fleetlever/fleetlever-logo.tsx`: FleetLever brand mark

## Persistence

Railway deployments require tenant-scoped Postgres and bucket configuration. The site edition is intentionally stateless. Local application development can fall back to local storage when Railway services are absent; production fails clearly when required persistence is not configured.
