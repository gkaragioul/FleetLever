# FleetLever

FleetLever is a Greek-market fleet and equipment operations console for SMEs that need one place to track assets, documents, compliance deadlines, maintenance work, operators, issues, imports, reports, and AI-assisted operational priorities.

FleetLever is sold and operated as a hosted web app. The app runtime and application database live on Railway. Vercel is reserved for the later public marketing site, not for the customer application runtime.

Current app production:

- App: https://fleetlever-app-production.up.railway.app
- Platform: Railway
- Region: EU West
- Runtime: Next.js 16 standalone output, React 19, Node 20
- Database: Railway Postgres 18 with tenant-scoped RLS

## Current State

Version `0.2` is the deployed foundation release. It includes:

- Greek-first operations console with selected English operational terms such as `Copilot`, `Import`, `Export`, `blocked`, `valid`, and `KTEO`.
- FleetLever logo, navigation tabs, dashboard, asset registry, documents, compliance, maintenance, issues, operators, reports, settings, and Copilot surfaces.
- Railway production deployment with `/api/health`.
- EU West app and Postgres services.
- Versioned SQL migrations under `db/migrations`.
- Demo organization seed data under `db/seeds`.
- Least-privilege runtime database role support through `scripts/create-db-app-role.mjs`.
- Tenant-scoped database helper in `src/lib/db/client.ts`.
- Dashboard query helper in `src/lib/db/queries.ts`.
- Construction console state is persisted through `/api/fleetlever/console-state` into Railway Postgres `public.console_snapshots`.
- Local file persistence is only a development fallback when `DATABASE_URL` is absent. Production Railway deployments fail loudly instead of writing customer state to container storage.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Open http://localhost:3000.

Local development can run without `DATABASE_URL`, but production cannot. When `DATABASE_URL` is configured, the app uses the same Railway Postgres path as production.

## Validation

```bash
npm run lint
npm run build
npm audit --omit=dev
```

Check Railway Postgres connectivity:

```bash
npm run db:health
```

## Database

FleetLever uses Railway Postgres with handwritten SQL migrations for tight control over RLS, indexes, generated search vectors, and operational tables. Application state belongs in Railway Postgres, not browser storage or the Railway container filesystem.

Runtime environment:

```bash
DATABASE_URL="postgresql://..."
MIGRATION_DATABASE_URL="postgresql://..."
DATABASE_SSL=true
DATABASE_POOL_MAX=10
FLEETLEVER_BUCKET_NAME="..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_ENDPOINT_URL="..."
```

Run migrations:

```bash
npm run db:migrate
```

Load demo data:

```bash
npm run db:seed
```

Create or rotate the least-privilege application database role:

```bash
APP_DATABASE_PASSWORD="generate-a-long-password" npm run db:create-app-role
```

Use the generated app-role connection string for the Next.js runtime `DATABASE_URL`. Keep the Railway admin database URL for `MIGRATION_DATABASE_URL` so `npm run db:migrate` can apply schema changes during pre-deploy.

## Railway App Runtime

`railway.json` defines the customer web app service shape:

- Nixpacks build
- `npm run build`
- `npm run railway:predeploy` before deployment, which runs SQL migrations
- `npm run railway:start`, which starts the standalone Next.js server
- `/api/health` healthcheck
- restart on failure

Required Railway variables:

```bash
DATABASE_URL="${{Postgres.DATABASE_URL}}"
MIGRATION_DATABASE_URL="${{Postgres.DATABASE_URL}}"
DATABASE_SSL=true
DATABASE_POOL_MAX=10
FLEETLEVER_ROOT_EXPERIENCE=app
FLEETLEVER_BUCKET_NAME="${{Bucket.AWS_S3_BUCKET}}"
AWS_ACCESS_KEY_ID="${{Bucket.AWS_ACCESS_KEY_ID}}"
AWS_SECRET_ACCESS_KEY="${{Bucket.AWS_SECRET_ACCESS_KEY}}"
AWS_REGION="${{Bucket.AWS_REGION}}"
AWS_ENDPOINT_URL="${{Bucket.AWS_ENDPOINT_URL}}"
S3_FORCE_PATH_STYLE=false
```

For the hardened production setup, replace `DATABASE_URL` with the least-privilege app-role connection string and keep `MIGRATION_DATABASE_URL` pointed at Railway Postgres admin credentials.

Uploads and downloadable evidence files are stored in Railway Buckets. Postgres keeps only metadata such as file name, size, storage key, bucket name, and content hash. In local development, if bucket variables are absent, uploads are written to `.fleetlever/uploads`; in production/Railway, missing bucket variables make uploads and the healthcheck fail clearly instead of filling Postgres with file bytes.

Production services:

- `fleetlever-app`
- `Postgres`
- `Bucket`

Both are configured in EU West for the Greek market.

## Vercel

Vercel is planned for the public website/landing surface later. Do not deploy the sellable app runtime to Vercel until the application data, auth, migrations, and storage strategy are explicitly moved or proxied. The current application source of truth is Railway.

## Key Files

- `src/app/page.tsx` mounts the FleetLever console.
- `src/components/fleetlever/operations-console.tsx` contains the product UI.
- `src/components/fleetlever/fleetlever-logo.tsx` contains the brand mark.
- `src/lib/fleetlever.ts` contains seeded records and readiness/compliance logic.
- `src/lib/db/client.ts` contains the tenant-scoped database wrapper.
- `src/lib/db/queries.ts` contains database-backed dashboard queries.
- `src/lib/db/console-state.ts` contains Railway Postgres persistence for the construction console snapshot.
- `src/lib/storage/object-storage.ts` contains the Railway Bucket/local-dev storage boundary.
- `src/app/api/fleetlever/console-state/route.ts` is the production console-state API boundary.
- `src/app/api/fleetlever/documents/[documentId]/file/route.ts` proxies authorized evidence downloads from object storage.
- `db/migrations/0001_fleetlever_core.sql` contains the Railway Postgres schema and RLS baseline.
- `db/migrations/0003_console_snapshots.sql` contains the construction console state table.
- `db/migrations/0004_object_storage_files.sql` moves uploaded file bytes out of Postgres and into object storage.
- `db/seeds/0001_demo_organization.sql` loads the demo tenant.
- `docs/architecture/adr-0001-railway-postgres.md` records the database architecture decision.
- `docs/fleetlever-gold-version-development-plan.md` is the source product blueprint.

## Next Build Layer

1. Wire authentication and map signed-in users to `profiles.auth_subject`.
2. Replace remaining in-memory construction console lists with normalized tenant-scoped Railway tables where needed.
3. Add bucket-backed vehicle photo uploads and generated report storage.
4. Add background workers for imports, reminders, OCR/AI extraction, and notifications.
5. Add observability, backup policy, and load testing before commercial rollout.
