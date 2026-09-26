# FleetLever

> **About this repository.** This is the source code of the FleetLever service
> ([fleetlever.com](https://fleetlever.com)), released under the [MIT License](LICENSE). It is
> provided as is, without warranty of any kind. You can run it yourself; [Self-hosting](#self-hosting)
> lists what that needs. It is built and operated for FleetLever's own Railway and Vercel
> deployments, and other platforms are not tested.

> **Status.** The hosted FleetLever service at fleetlever.com is currently offline. The source here
> still builds and runs locally; see [Editions](#editions) and [Self-hosting](#self-hosting).

FleetLever is a release-control product for equipment-heavy operations. It answers one daily question before machines and crews are committed: what can work tomorrow, what cannot, why, and who must act.

FleetLever ships one codebase in two isolated editions: the commercial site and the customer console.

## Editions

| Edition | Purpose | Local URL |
| --- | --- | --- |
| `console` | B2B FleetLever console | http://127.0.0.1:3001/fleet-management |
| `site` | FleetLever commercial site ([fleetlever.com](https://fleetlever.com)) | http://127.0.0.1:3002 |

The console contains no marketing routes. The commercial site contains no customer application routes.

The Greek public-sector editions — the Elliniko-Argyroupoli employee portal, the municipal fleet
application, and the civic dispatch application — were discontinued and removed from this codebase.

## Local Development

Install dependencies:

```bash
npm install
```

Start each edition in its own terminal:

```bash
npm run dev:console
npm run dev:site
```

Each process uses an independent Next.js build directory, so both can run together without cache collisions.

## Runtime Selection

Railway selects the edition with one service variable:

```bash
FLEETLEVER_EDITION=console
FLEETLEVER_EDITION=site
```

`src/proxy.ts` enforces route boundaries at runtime. `src/lib/fleetlever/edition.ts` contains the edition contract and root route for each deployment.

The marketing edition does not require a database. The console edition uses Railway Postgres and Railway object storage.

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

- `fleetlever-app`: B2B console
- `fleetlever-site`: public commercial site
- `Postgres`: shared database with tenant-scoped row-level security
- `fleetlever-uploads`: object storage

`railway.json` defines the common build, pre-deploy, healthcheck, and standalone runtime commands. `scripts/railway-predeploy.mjs` skips migrations for the site edition and runs them for application editions.

## Product Surfaces

- `src/components/fleetlever/construction-prototype.tsx`: fleet console
- `src/app/landing/page.tsx`: commercial landing page
- `src/app/pricing/page.tsx`: pilot and subscription pricing
- `src/components/fleetlever/commercial-site-shell.tsx`: shared commercial navigation and footer
- `src/components/fleetlever/fleetlever-logo.tsx`: FleetLever brand mark

## Persistence

Railway deployments require tenant-scoped Postgres and bucket configuration. The site edition is intentionally stateless. Local application development can fall back to local storage when Railway services are absent; production fails clearly when required persistence is not configured.

## Self-hosting

Every variable is listed in [`.env.example`](.env.example). The console edition needs:

- Node.js 20.19 or later.
- PostgreSQL with the `pgcrypto` and `citext` extensions available (the first migration creates them).
- An administrator connection for migrations (`MIGRATION_DATABASE_URL`, run `npm run db:migrate`) and a
  restricted runtime role for the app (`DATABASE_URL`, created with `npm run db:create-app-role`).
- `FLEETLEVER_SESSION_SECRET`: at least 32 random characters. It signs administrator sessions, and
  in production the server rejects a missing or short value.
- A first organization: run `npm run db:bootstrap-production-tenant`, then set
  `FLEETLEVER_DEFAULT_ORGANIZATION_ID` and `FLEETLEVER_DEFAULT_PROFILE_ID` to the IDs it prints.
- An S3-compatible bucket for uploads in production (`FLEETLEVER_BUCKET_NAME` and the `AWS_*` variables).
- Optional: `RESEND_API_KEY` and `FLEETLEVER_EMAIL_FROM` for verification and password-reset email,
  `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for Google sign-in.

Build with `npm ci && npm run build`, then start the standalone server with `npm start`.

Security notes:

- Only expose the production build. Development mode (`npm run dev`, or any `NODE_ENV` other than
  `production`) signs every visitor in as super admin and, when email is not configured, shows
  password-reset links on screen. That is meant for a developer's own machine only.
- Per-client rate limits (sign-in, sign-up, password reset, demo requests, analytics and demo
  workspaces) take the client address from the proxies you run, never from what the client sends.
  Set `FLEETLEVER_TRUSTED_PROXY_HOPS` to the number of proxies in front of the app (default `1`:
  the platform edge; use `2` if another proxy of yours forwards to it), or name a header your
  platform always overwrites in `FLEETLEVER_CLIENT_IP_HEADER` (for example `x-vercel-forwarded-for`).
  If the setting is wrong, clients either share one bucket or choose their own, so check it.
- Public demo workspaces are capped at `FLEETLEVER_DEMO_SESSION_MAX` (default 100, oldest removed
  first) and 2 MB each.
- Leave Lisa off (`FLEETLEVER_LISA_CODEX_ENABLED=false`) unless you have read
  [the relay's security boundary](docs/architecture/lisa-outbound-relay.md#security-boundary).
- Please report vulnerabilities privately through GitHub's
  [private vulnerability reporting](https://github.com/gkaragioul/FleetLever/security/advisories/new),
  not in a public issue.

## License

The source code is released under the [MIT License](LICENSE). The FleetLever name and logos are
trademarks of George Karagioules and are not covered by the MIT License. Third-party components,
including npm dependencies and third-party photographs under `public/`, keep their own licences.
