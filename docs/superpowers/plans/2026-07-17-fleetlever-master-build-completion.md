# FleetLever Master Build Completion Plan

**Goal:** Finish the account, Lisa, tenant customization, commercial-site, and deployment contract from the FleetLever master build prompt without weakening the existing console or municipal editions.

**Architecture:** Keep the commercial site and B2B console in one Next.js application, with account/trial enforcement at the server boundary, tenant-scoped console snapshots in PostgreSQL, and a local read-only Codex bridge behind authenticated Lisa API routes. Treat branding and custom fields as tenant data, but validate and normalize the complete customization contract before persistence.

## Task 1: Lock the tenant snapshot contract

- Add contract tests for schema migration, unsafe branding data, duplicate fields, custom-value normalization, and payload limits.
- Add a server-only snapshot normalizer shared by GET and PUT handlers.
- Upgrade database-derived snapshots to the current schema with customization defaults.

## Task 2: Finish self-service customization

- Add drag-and-drop logo and banner selection while retaining the crop, pan, zoom, and responsive previews.
- Verify fields, columns, archive/restore, exports, and contextual controls across all supported modules.
- Confirm branding and custom values survive a reload through tenant-scoped persistence.

## Task 3: Verify account and Lisa boundaries

- Run account registration, verification, login, reset, Google callback, immutable trial, and expiry contract tests.
- Run Lisa bridge streaming, cancellation, timeout, health, rate-limit, and read-only contract tests.
- Confirm hosted Lisa reports local-bridge availability honestly and never exposes the bridge directly.

## Task 4: Verify the commercial experience

- Check hero customization messaging, configurable-data strip, inventory animation timing, five operating worlds, and Try the app authentication path.
- Verify desktop and mobile layouts, reduced motion, keyboard access, and no overflow.

## Task 5: Release

- Run focused tests, lint, production build, and browser verification.
- Commit only the intended implementation, create the next version tag, push, deploy, and report any external credential or domain blockers explicitly.
