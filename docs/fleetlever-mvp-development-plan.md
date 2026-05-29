# FleetLever MVP Development Plan

Status: Draft for implementation  
Target: Localhost-first MVP, then Vercel/Supabase deploy  
Prepared: 29 May 2026  

## 1. Product Decision

FleetLever should launch as an AI-assisted operations and compliance readiness system for Greek companies that manage vehicles, cranes, machinery, equipment, documents, inspections, maintenance, and expirations.

The MVP should not present itself as a GPS or telematics product. The buyer should understand the app in one sentence:

> FleetLever tells you what asset, document, certificate, inspection, or maintenance issue needs attention before it becomes expensive.

## 2. MVP Goal

Build a polished, localhost-running web app that can be used in paid pilot demos with crane/lifting, construction machinery, rental, tourism bus, and small transport companies.

The first demo must answer:

- What needs attention this week?
- What expires this month?
- Which vehicles or machines are not ready?
- Which documents are missing?
- Which maintenance tasks are overdue?
- What issues were reported recently?

The app should feel like a calm operations desk, not a heavy ERP.

## 3. Best First User

Primary ICP:

- Greek owner/operator company
- 10-80 vehicles, machines, cranes, buses, trailers, forklifts, or mixed equipment
- Uses Excel, folders, WhatsApp, email, accountants, or memory to track documents and dates
- Has recurring inspections, certificates, KTEO, insurance, operator documents, and maintenance tasks
- Needs a simple dashboard and reminders more than hardware tracking

Primary user roles:

- Owner
- Operations manager
- Fleet/equipment manager
- Office administrator
- Safety/compliance responsible person
- Mechanic or field supervisor

## 4. MVP Scope

### Must Have

1. Workspace and authentication
   - Local demo mode with seeded sample company
   - Supabase Auth-ready structure
   - Single organization workspace
   - Role model prepared for owner/admin/member, even if full permissions are simple in MVP

2. Dashboard
   - Attention summary cards
   - Expiring soon
   - Overdue maintenance
   - Missing documents
   - Open issues
   - Asset readiness status
   - AI-generated daily brief panel

3. Assets
   - Asset list
   - Asset detail page
   - Asset categories: vehicle, crane, machine, bus, trailer, forklift, other equipment
   - Status: ready, attention, blocked, inactive
   - Key fields: name, internal code, plate/serial, category, location, assigned operator, notes

4. Documents and expirations
   - Document records linked to assets and optionally operators
   - Document categories: KTEO, insurance, lifting certificate, inspection, permit, operator license, registration, maintenance record, other
   - Expiration date
   - Status: valid, warning, critical, expired, missing
   - File upload architecture using Supabase Storage
   - Localhost demo may use placeholder file records before real upload is wired

5. Maintenance
   - Maintenance task list
   - Asset-linked maintenance records
   - Due date, completed date, priority, notes, vendor/mechanic
   - Status: scheduled, due soon, overdue, completed

6. Issue reports
   - Create issue for an asset
   - Severity: low, medium, high, blocking
   - Status: open, in progress, resolved
   - Photo/file-ready structure
   - Recent issues visible on dashboard and asset page

7. AI copilot
   - Chat panel for operational questions
   - Prebuilt prompt chips:
     - What needs attention this week?
     - What expires this month?
     - Which assets are blocked?
     - Which maintenance tasks are overdue?
     - Which documents are missing?
   - AI answers must cite the records used
   - AI should say when data is missing or uncertain
   - AI should not give legal advice

8. Import/demo setup
   - Seed data for one crane/construction company
   - CSV import plan for assets/documents as a follow-up
   - Demo reset command

9. Polish
   - Beautiful, dense but calm UI
   - Responsive desktop and tablet layout
   - Mobile usable for issue reporting and quick lookup
   - Loading skeletons
   - Empty states
   - Error states
   - Toast feedback
   - Subtle animations and transitions

### Should Have

- Saved views and filters
- Calendar view for expirations and maintenance
- Operator records
- Simple notification preferences
- Greek/English UI toggle
- PDF export for an asset readiness pack
- Basic activity log
- CSV import for assets and documents

### Not MVP

- GPS
- Telematics
- Hardware
- Driver behavior
- Fuel analytics
- Route optimization
- Dispatch
- ERP
- Invoicing/accounting
- Payroll
- Parts inventory
- Predictive maintenance from sensors
- Complex workflow builder
- Municipality/public-sector tender features

## 5. Recommended Tech Stack

Primary implementation references:

- Next.js App Router: https://nextjs.org/docs/app
- Supabase Next.js Auth: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase server-side auth: https://supabase.com/docs/guides/auth/server-side
- shadcn/ui: https://ui.shadcn.com/docs
- Vercel AI SDK: https://sdk.vercel.ai/docs

### App

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix primitives through shadcn
- lucide-react icons
- Framer Motion or Motion for subtle UI animation
- TanStack Table for richer tables if shadcn table becomes limiting
- React Hook Form + Zod for forms and validation

### Backend

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Server Actions for app mutations where appropriate
- Route Handlers for AI streaming, file handling, and import endpoints

### AI

- Vercel AI SDK or direct OpenAI API behind a server route
- Start with a simple RAG-lite pattern over structured database records
- Do not add vector search on day one unless document text search becomes essential
- First AI context should come from structured tables: assets, documents, maintenance, issues

### Local Development

- Local Next.js dev server at `http://localhost:3000`
- Supabase local development or remote Supabase dev project
- `.env.local` for Supabase and AI keys
- Seed script for demo data
- Optional later: Playwright for end-to-end smoke tests

### Deployment Later

- Vercel for app hosting
- Supabase hosted project for database/storage/auth
- Vercel environment variables
- Basic analytics and error monitoring after MVP validation

## 6. Architecture

Use a simple modular monolith. Keep everything in one Next.js app until there is a real reason to split services.

```text
src/
  app/
    (auth)/
      login/
    (app)/
      dashboard/
      assets/
      assets/[assetId]/
      documents/
      maintenance/
      issues/
      copilot/
      settings/
    api/
      ai/chat/
      uploads/
      import/
  components/
    app-shell/
    dashboard/
    assets/
    documents/
    maintenance/
    issues/
    copilot/
    ui/
  lib/
    supabase/
    db/
    ai/
    dates/
    status/
    demo-data/
    validations/
  server/
    actions/
    queries/
  types/
```

Architecture rules:

- Server Components fetch data by default.
- Client Components are used only for interactivity: tables, filters, forms, chat, drawers, modals, and animated controls.
- Supabase clients are created lazily through helper functions, not initialized at module scope.
- All organization-scoped queries must include `organization_id`.
- AI routes must never expose API keys to the browser.
- AI answers should be generated from explicitly selected records, not unrestricted database access.
- Every mutation should validate input with Zod.
- Every important destructive action should have confirmation or undo.

## 7. Database Model

### Core Tables

`organizations`

- id
- name
- country
- default_language
- created_at

`profiles`

- id
- auth_user_id
- full_name
- email
- created_at

`organization_members`

- id
- organization_id
- profile_id
- role: owner, admin, member
- created_at

`assets`

- id
- organization_id
- name
- internal_code
- category
- plate_number
- serial_number
- manufacturer
- model
- year
- location
- assigned_operator_id
- status
- notes
- created_at
- updated_at

`operators`

- id
- organization_id
- full_name
- phone
- email
- license_number
- notes
- created_at

`documents`

- id
- organization_id
- asset_id
- operator_id
- category
- title
- document_number
- issue_date
- expires_at
- file_path
- status_override
- notes
- created_at
- updated_at

`maintenance_tasks`

- id
- organization_id
- asset_id
- title
- type
- priority
- due_at
- completed_at
- status
- vendor
- cost_amount
- notes
- created_at
- updated_at

`issues`

- id
- organization_id
- asset_id
- title
- description
- severity
- status
- reported_by_profile_id
- resolved_at
- created_at
- updated_at

`activity_events`

- id
- organization_id
- actor_profile_id
- entity_type
- entity_id
- event_type
- summary
- created_at

`ai_conversations`

- id
- organization_id
- title
- created_by_profile_id
- created_at

`ai_messages`

- id
- conversation_id
- role
- content
- citations_json
- created_at

### Derived Status Logic

Expiration status:

- expired: `expires_at < today`
- critical: expires within 7 days
- warning: expires within 30 days
- valid: later than 30 days
- missing: required document category not present for an asset

Asset readiness:

- blocked if any blocking issue exists or critical required document is expired
- attention if warning/critical documents or overdue maintenance exist
- ready if no blocking/attention conditions
- inactive if manually archived

## 8. Main Screens

### 8.1 App Shell

Purpose: make the app feel like an operations console.

Layout:

- Left sidebar on desktop
- Top bar with company switcher/search/user
- Main content area
- Right-side copilot drawer on wide screens
- Mobile bottom nav or sheet navigation

Navigation:

- Dashboard
- Assets
- Documents
- Maintenance
- Issues
- Copilot
- Settings

Design:

- Calm light UI by default
- Optional dark mode later
- Background: off-white or soft cool gray
- Accent: deep blue/teal for trust, amber/red only for status
- Cards should be restrained with 6-8px radius
- Dense, readable tables
- No marketing hero inside the app

### 8.2 Dashboard

Primary job: show what needs attention today.

Sections:

- Daily brief
- Attention cards
- Expiring soon
- Overdue maintenance
- Open blocking issues
- Asset readiness by category
- Recent activity

Interactions:

- Click a risk to open the asset or document
- Filter by category/location
- Ask AI from any card
- Mark maintenance as done
- Resolve issue

Feedback:

- Skeleton cards while loading
- Empty state: "No urgent items. Everything is clear for now."
- Toasts for updates
- Status chips animate gently when changed

### 8.3 Assets

Primary job: find and inspect every vehicle/machine quickly.

Views:

- Table view
- Compact card view on mobile
- Filters by status, category, location, assigned operator
- Search by plate, serial, name, code

Asset detail tabs:

- Overview
- Documents
- Maintenance
- Issues
- Activity

### 8.4 Documents

Primary job: prevent missing or expired paperwork.

Views:

- Document table
- Expiration timeline
- Missing required documents
- Upload/add document drawer

Required document templates:

- Vehicle: KTEO, insurance, registration, permit
- Crane/lifting: lifting certificate, periodic inspection, operator license, insurance
- Bus: KTEO, insurance, permit, driver/operator document
- Machine/forklift: inspection certificate, maintenance record, permit if relevant

### 8.5 Maintenance

Primary job: see what service is scheduled, due, overdue, or completed.

Views:

- Maintenance board by status
- Table by due date
- Asset-specific maintenance history

### 8.6 Issues

Primary job: capture field problems before they disappear into WhatsApp.

Views:

- Open issues
- Blocking issues
- Recently resolved
- Create issue drawer

Mobile priority:

- Fast issue create
- Photo-ready file input
- Severity selector
- Assign to asset

### 8.7 Copilot

Primary job: answer operational questions from trusted company data.

UI:

- Chat surface
- Prompt chips
- Citation cards
- "Used records" drawer
- Suggested follow-up actions

Rules:

- Always say what records were used.
- Never invent document dates.
- When data is missing, say so.
- Avoid legal certainty language.
- Phrase as operational guidance, not legal advice.

Example answer format:

```text
3 items need attention this week:

1. Crane CR-04 lifting certificate expires in 5 days.
2. Truck DEM-0004 insurance is already expired.
3. Excavator EX-02 has overdue 500-hour service.

Based on: 3 documents, 2 maintenance tasks, 3 assets.
```

## 9. Visual Design Direction

Design adjectives:

- Calm
- Operational
- Trustworthy
- Precise
- Modern
- Greek-business-friendly
- Not flashy
- Not enterprise-bloated

Palette:

- Background: `#F6F8FB`
- Surface: `#FFFFFF`
- Text primary: `#17212B`
- Text muted: `#667085`
- Border: `#D9E2EC`
- Primary: `#145C72`
- Primary hover: `#0F4A5C`
- Success: `#168A5B`
- Warning: `#C77700`
- Danger: `#C73E3A`
- Info: `#2563A8`

Typography:

- Geist Sans or Inter
- 14-15px base app text
- 12-13px table metadata
- 20-24px page titles
- No oversized SaaS landing-page typography inside the product

Components:

- Status chips with icons
- Icon buttons for quick actions
- Segmented controls for views
- Drawers for create/edit flows
- Dialogs only for confirmation
- Toasts for feedback
- Skeletons for loading
- Empty states with short operational copy
- Tables for serious scanning
- Cards only for repeated summary objects, not nested panels

Motion:

- 120-180ms hover/focus transitions
- 180-240ms drawer/dialog entrance
- Subtle count-up for dashboard metrics
- Fade/slide for newly created records
- No distracting bouncy animations
- Respect reduced-motion preference

Accessibility:

- Keyboard navigable forms, tables, drawers, dialogs
- Visible focus states
- Color is never the only status indicator
- Form errors next to fields
- Touch targets at least 40px
- WCAG AA contrast target

## 10. AI Implementation Plan

### Phase 1: Structured Context Only

The AI route receives:

- User message
- Organization ID
- Current filters/context
- Retrieved relevant records from:
  - assets
  - documents
  - maintenance_tasks
  - issues

Retrieval can start with deterministic rules:

- If user asks "this week", fetch records due/expiring within 7 days
- If user asks "this month", fetch within 30 days
- If user asks "overdue", fetch expired documents and overdue maintenance
- If user asks asset name/plate/code, search assets first
- Always include current date and timezone

### Phase 2: Tool-Like Server Functions

Add internal server tools:

- `getAttentionSummary`
- `getExpiringDocuments`
- `getOverdueMaintenance`
- `getBlockedAssets`
- `searchAssets`
- `getAssetReadiness`

The model can compose answers, but the tools/database produce facts.

### Phase 3: Document Text Search

Only after file uploads and document text extraction matter:

- Extract text from uploaded PDFs/images where possible
- Store text snippets
- Add embeddings or full-text search
- Use citations to document records

## 11. Localhost Build Milestones

### Sprint 0: Project Foundation

Goal: create the app shell and local development foundation.

Tasks:

- Scaffold Next.js app in current repo
- Install Tailwind, shadcn/ui, lucide-react, form libraries, Zod
- Configure app layout, fonts, theme tokens
- Create reusable UI primitives and status components
- Add dashboard shell with placeholder data
- Add lint/typecheck scripts

Acceptance:

- `npm run dev` starts at `http://localhost:3000`
- App shell renders without console errors
- Navigation works
- Theme is coherent

### Sprint 1: Data Model and Demo Data

Goal: make the MVP data-driven.

Tasks:

- Create Supabase schema/migrations
- Add seed data for a crane/construction company
- Build typed query layer
- Add derived status helpers
- Build dashboard from real seeded data

Acceptance:

- Dashboard shows real seeded expirations, maintenance, issues, and readiness
- Status logic is tested with edge dates
- Demo can be reset

### Sprint 2: Assets and Documents

Goal: make the core compliance workflow usable.

Tasks:

- Asset list/table
- Asset detail page
- Add/edit asset drawer
- Document list/table
- Add/edit document drawer
- Expiration status
- Required document gaps

Acceptance:

- User can create an asset and document
- Asset detail shows linked documents
- Expired/warning/critical/valid states are correct
- Missing required docs are visible

### Sprint 3: Maintenance and Issues

Goal: cover daily operations beyond paperwork.

Tasks:

- Maintenance list and create/edit drawer
- Mark maintenance complete
- Issue list and create/edit drawer
- Resolve issue
- Asset readiness calculation includes documents, maintenance, and issues

Acceptance:

- Dashboard updates after maintenance or issue changes
- Blocked/attention/ready status is understandable
- Mobile issue creation is fast

### Sprint 4: AI Copilot

Goal: make the AI assistant useful and trustworthy.

Tasks:

- Chat route
- Copilot UI
- Prompt chips
- Structured record retrieval
- Citation display
- Daily brief generation
- Guardrails for uncertainty/legal advice

Acceptance:

- "What needs attention this week?" returns correct seeded records
- "What expires this month?" returns correct documents
- AI cites records used
- AI says when data is missing
- No API key leaks to browser

### Sprint 5: Polish and Pilot Readiness

Goal: make it feel sellable.

Tasks:

- Loading skeletons
- Empty states
- Error states
- Toasts
- Subtle animations
- Responsive QA
- Greek copy pass for key UI
- Demo script data
- Basic smoke tests

Acceptance:

- Works on desktop, tablet, and mobile
- Key flows have polished feedback
- Demo can be run end-to-end in under 7 minutes
- No obvious layout overlap or broken states

## 12. Demo Script

Use a sample company like "Aegean Lift & Works".

Demo flow:

1. Open dashboard.
2. Show daily brief.
3. Click "3 expiring documents".
4. Open crane with expiring lifting certificate.
5. Ask copilot: "What needs attention this week?"
6. Show answer with citations.
7. Create a new issue from mobile-sized layout.
8. Mark one maintenance item complete.
9. Show dashboard improves.
10. Close with: "Imagine this running every morning with your real assets and documents."

## 13. Testing Plan

Unit tests:

- Expiration status helper
- Asset readiness helper
- Required document gap helper
- Date windows for week/month
- Zod validation schemas

Integration tests:

- Create asset
- Create document
- Create maintenance task
- Create issue
- Dashboard summary query
- AI context retrieval

Manual QA:

- Desktop 1440px
- Laptop 1280px
- Tablet 768px
- Mobile 390px
- Empty organization state
- Long Greek names and document titles
- Expired dates
- No AI key configured
- Upload failure
- Slow network loading

Smoke test before demos:

- App starts
- Dashboard loads
- Asset detail opens
- Add document works
- Add issue works
- Copilot answers seeded question

## 14. Security and Data Safety

MVP requirements:

- Supabase RLS on organization-scoped tables
- Server-side auth checks
- Never trust organization ID from the client without membership verification
- Validate all mutations
- Restrict file uploads by type and size
- Store files under organization-scoped paths
- AI route only sees records from the user's organization
- Do not put sensitive secrets in client components

Later:

- Audit logs
- Export/delete customer data
- Backup policy
- Admin impersonation controls
- Per-role permission matrix

## 15. Local Setup Plan

Recommended commands once implementation starts:

```bash
npx create-next-app@latest . --yes --force --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-npm
npx shadcn@latest init -d --base radix
npx shadcn@latest add button card badge table dialog sheet dropdown-menu input textarea select tabs separator skeleton toast tooltip calendar
npm install lucide-react zod react-hook-form @hookform/resolvers
npm install @supabase/supabase-js @supabase/ssr
npm install ai @ai-sdk/react
npm install motion
```

Environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

Use Vercel AI Gateway later if desired; for localhost MVP, a direct server-side OpenAI key is simpler.

## 16. Implementation Priorities

Build order:

1. App shell and theme
2. Demo data and status logic
3. Dashboard
4. Assets
5. Documents
6. Maintenance
7. Issues
8. Copilot
9. Polish
10. Import/setup tooling

Do not start with login or billing. For paid pilot demos, a polished seeded localhost app will teach more than a half-built production auth system.

## 17. Definition of Done

The MVP is ready for pilot demos when:

- It runs locally at `http://localhost:3000`
- It has realistic seeded Greek fleet/equipment data
- Dashboard gives an immediate operational summary
- Assets/documents/maintenance/issues can be created and edited
- AI answers the key operational questions correctly from structured records
- UI feels polished, calm, responsive, and trustworthy
- Loading, empty, error, and success states exist
- No GPS/ERP/telematics scope has leaked into the build
- Demo script can be completed reliably

## 18. Founder Validation Plan

Before building beyond the MVP:

- Run 30 interviews
- Demo to 10 serious prospects
- Ask for 3 paid pilots
- Require real data import for pilot
- Charge EUR 300-500 for the first 60-day pilot where possible
- Convert at least 2 pilots to EUR 199/month or higher before expanding features

Success signal:

> The owner says, "This is better than our Excel/WhatsApp/folder chaos," and pays to keep it.
