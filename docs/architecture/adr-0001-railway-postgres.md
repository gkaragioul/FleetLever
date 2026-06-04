# ADR 0001: Railway Postgres Core Data Layer

## Status

Accepted

## Context

FleetLever needs a production-grade data foundation for Greek fleet operations: assets, documents, compliance requirements, maintenance work, issues, operators, imports, AI citations, reports, billing, notifications, and audit logs.

The app is hosted around Railway, so the database should be simple to operate there, fast for dashboard reads, and safe for multi-company data.

## Decision

Use Railway Postgres as the primary database and manage schema changes through versioned SQL migrations in `db/migrations`.

Uploaded file bytes are stored outside Postgres in Railway Buckets. Postgres stores file metadata, storage keys, bucket names, ownership, version rows, and audit references. This keeps the relational database focused on operational facts while evidence PDFs, certificates, photos, and reports scale through object storage.

The first migration creates the FleetLever core schema with:

- Organization-scoped tables for all customer-owned records.
- Row level security on tenant tables using `app.current_organization_id`.
- A server-side membership check in `withTenant()` before any tenant query runs.
- Search vectors and targeted indexes for asset lookup, document expiry, maintenance due dates, issues, unread notifications, imports, AI messages, and audit logs.
- An invoker-security readiness view so dashboard summaries stay inside the caller's RLS scope.
- Audit, AI citation, import review, billing, and notification tables included from day one to avoid a messy second schema wave.

## Alternatives Considered

- Supabase Auth plus Supabase Postgres: useful later if we choose Supabase Auth, but it adds platform assumptions we are not using right now.
- Prisma-first schema: productive for CRUD, but handwritten SQL gives better control over RLS, generated search vectors, partial indexes, and tenant policies.
- Drizzle migrations: a good future option, but raw SQL is the clearest baseline while the model is still settling.

## Consequences

- Application code must use `withTenant()` for tenant queries.
- `DATABASE_URL` is required for migrations and server queries.
- Auth integration still needs to decide how a signed-in user maps to `profiles.auth_subject`.
- Future migrations should keep customer data organization-scoped unless there is a strong reason not to.
