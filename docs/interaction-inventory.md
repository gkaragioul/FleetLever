# FleetLever Interaction Inventory

Last reviewed: 2026-06-01

## Product Pattern

Each operational page should use the same calm structure:

- Page header with one primary action.
- Horizontal metric strip for the page's key counts.
- One main work queue using rows, not oversized cards.
- Optional secondary columns only when they clarify the workflow.
- Drawer or modal for details, editing, uploads, imports, and creation.

The dashboard is the exception. It can feel more like an overview surface, but it should still use the same typography, spacing, border radius, and action language.

## Global Shell

- Location switcher opens the workspace modal.
- Global search can navigate to matching records and offers secondary actions for documents and issues.
- Toolbar quick actions open asset, document, issue, notification, import, and export flows.
- Notifications drawer lists only items needing action.

## Pages

- `Κέντρο στόλου`: overview dashboard with readiness, blockers, deadlines, maintenance, and current priorities.
- `Πάγια`: assignment queue, readiness, blocking issues, missing documents, bulk document upload, export, and detail drawer.
- `Έγγραφα`: document action queue, renewal, approval, upload, bulk import, and detail drawer.
- `Συμμόρφωση`: missing-document queue and rules by asset type.
- `Συντήρηση`: maintenance work queue, assignment, completion, editing, and cost tracking.
- `Βλάβες`: issue queue, editing, resolution, and maintenance follow-up.
- `Χειριστές`: operator roster, license expiry tracking, license upload, edit, and archive.
- `Ημερολόγιο`: deadlines and scheduled work grouped by urgency.
- `Αναφορές`: report generation shortcuts with audit logging.
- `Copilot`: operational Q&A backed by current fleet data and citation history.

## Backend Wiring

- Server actions require `DATABASE_URL`; otherwise the UI uses fallback demo data and mutation actions return a clear environment message.
- Mutations run through tenant-scoped database helpers.
- Asset, document, issue, maintenance, operator, compliance, import, report, and Copilot mutations write audit events.
- Issue mutations synchronize asset availability so blocking problems remove assets from assignment.
- Document uploads validate size and file type before writing file/version rows.

## QA Checklist

- Run `npm run lint`.
- Run `npm run build`.
- Run `npm run design:audit`.
- Check desktop and mobile for truncation, row alignment, sticky drawers, and empty states.
- Verify a create/edit/resolve path for every page with a real `DATABASE_URL` before release.
