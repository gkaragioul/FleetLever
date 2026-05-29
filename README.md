# FleetLever

FleetLever is a Greek-market fleet and equipment operations console for SMEs that need one place to track assets, documents, compliance deadlines, maintenance work, operators, issues, imports, reports, and AI-assisted operational priorities.

Current production:

- App: https://fleetlever-app-production.up.railway.app
- Platform: Railway
- Region: EU West
- Runtime: Next.js 16, React 19, Node 20
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

The UI still uses the local domain model for most rendered demo content. The database is ready for the next wiring phase: authentication, server reads, validated mutations, imports, file storage, and background jobs.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Validation

```bash
npm run lint
npm run build
npm audit --omit=dev
```

Check database connectivity when `DATABASE_URL` is configured:

```bash
npm run db:health
```

## Database

FleetLever uses Railway Postgres with handwritten SQL migrations for tight control over RLS, indexes, generated search vectors, and operational tables.

Runtime environment:

```bash
DATABASE_URL="postgresql://..."
DATABASE_SSL=true
DATABASE_POOL_MAX=10
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

Use the generated app-role connection string for the Next.js runtime. Keep the Railway admin database URL for migrations only.

## Railway

`railway.json` defines the production service shape:

- Nixpacks build
- `npm run start`
- `/api/health` healthcheck
- restart on failure

Production services:

- `fleetlever-app`
- `Postgres`

Both are configured in EU West for the Greek market.

## Key Files

- `src/app/page.tsx` mounts the FleetLever console.
- `src/components/fleetlever/operations-console.tsx` contains the product UI.
- `src/components/fleetlever/fleetlever-logo.tsx` contains the brand mark.
- `src/lib/fleetlever.ts` contains seeded records and readiness/compliance logic.
- `src/lib/db/client.ts` contains the tenant-scoped database wrapper.
- `src/lib/db/queries.ts` contains database-backed dashboard queries.
- `db/migrations/0001_fleetlever_core.sql` contains the Railway Postgres schema and RLS baseline.
- `db/seeds/0001_demo_organization.sql` loads the demo tenant.
- `docs/architecture/adr-0001-railway-postgres.md` records the database architecture decision.
- `docs/fleetlever-gold-version-development-plan.md` is the source product blueprint.

## Next Build Layer

1. Wire authentication and map signed-in users to `profiles.auth_subject`.
2. Replace local demo reads with tenant-scoped server queries.
3. Add validated create/edit/import mutations.
4. Add object storage for PDFs, certificates, KTEO files, photos, and generated reports.
5. Add background workers for imports, reminders, OCR/AI extraction, and notifications.
6. Add observability, backup policy, and load testing before commercial rollout.
