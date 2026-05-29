# FleetLever Gold Version Development Plan

Status: Production-grade product blueprint  
Target: Commercial SaaS for Greek fleet, equipment, and compliance operations  
Prepared: 29 May 2026  

## 1. Gold Version Definition

The Gold Version is not a bloated ERP. It is the version of FleetLever that a real Greek crane, construction, transport, tourism, rental, or equipment-heavy company could trust as its daily operational control system.

The product promise:

> FleetLever gives every asset, document, inspection, certificate, maintenance task, operator, and issue one reliable home, then uses AI to tell the business what needs attention before it becomes expensive.

The Gold Version should feel:

- Calm enough for Greek SMEs
- Serious enough for compliance-heavy operators
- Beautiful enough to sell in demos
- Reliable enough to hold operational records
- Flexible enough for mixed fleets and equipment
- Focused enough to avoid ERP chaos

## 2. Strategic Product Position

FleetLever should own the category of AI-assisted fleet and equipment operations readiness.

It should not lead with:

- GPS tracking
- Hardware
- Telematics
- Route optimization
- Generic "AI platform"
- Full ERP replacement

It should lead with:

- Asset readiness
- Document control
- Expiration prevention
- Inspection/certificate confidence
- Maintenance accountability
- Field issue visibility
- AI daily operations briefing

The best Greek-market sales line:

> Every morning, FleetLever tells you which vehicle, machine, crane, document, inspection, certificate, operator, or maintenance issue needs attention.

## 3. Gold Version Product Pillars

### Pillar 1: Operational Memory

FleetLever becomes the place where the company stores and finds:

- Vehicles
- Cranes
- Machines
- Buses
- Forklifts
- Trailers
- Attachments
- Operators
- Documents
- Certificates
- KTEO
- Insurance
- Permits
- Inspections
- Maintenance history
- Issues
- Photos
- Notes
- Vendor/service history

### Pillar 2: Readiness and Risk

The product should constantly answer:

- Can this asset work today?
- What is missing?
- What expires soon?
- What is overdue?
- What is blocking a job?
- What creates inspection risk?
- What has not been updated recently?

### Pillar 3: AI Operations Copilot

AI should not be decoration. It should become the fastest way to understand the operation.

Core AI jobs:

- Daily risk summary
- Weekly attention plan
- Natural-language questions
- Document and record lookup
- Missing data detection
- Asset readiness explanation
- Drafting messages/checklists
- Summarizing issue and maintenance history

AI must cite the records it used and must never invent compliance facts.

### Pillar 4: Service-Assisted Onboarding

Greek SMEs will not perfectly self-serve into a clean system. Gold Version should include workflows for:

- Importing spreadsheets
- Uploading messy folders
- Mapping document categories
- Detecting dates from PDFs/images
- Flagging missing fields
- Creating first readiness dashboard
- Admin review before data goes live

### Pillar 5: Trust, Auditability, and Control

The product needs proper:

- User roles
- Audit trails
- Activity history
- Document versioning
- Permission boundaries
- Notifications
- Backups
- Data export
- Security practices

This is what makes it feel like software a business can rely on, not a prototype.

## 4. Target Customers and Edition Fit

### Primary Gold Customer

Greek company with 20-250 operational assets and recurring compliance/maintenance pressure.

Examples:

- Crane and lifting companies
- Construction companies
- Equipment rental firms
- Machinery operators
- Tourism bus and transfer fleets
- Logistics and transport firms
- Industrial service companies
- Municipal/private contractors after references exist

### Role Map

Owner:

- Wants daily confidence
- Wants fewer surprises
- Wants quick answers
- Wants proof that admin work is under control

Operations manager:

- Wants asset readiness
- Wants issues and maintenance visible
- Wants fewer calls and scattered messages

Office administrator:

- Wants document organization
- Wants reminders
- Wants quick file retrieval

Safety/compliance responsible person:

- Wants inspections, certificates, permits, licenses, and audit trail

Mechanic/field supervisor:

- Wants issues, photos, service status, and asset history

Operator/driver:

- Wants simple mobile issue reporting and document visibility where allowed

## 5. Gold Version Modules

### 5.1 Organizations and Workspaces

Features:

- Multi-tenant organizations
- Company profile
- Locations/branches/yards
- Departments or operational groups
- Workspace settings
- Language preference
- Timezone/currency defaults
- Compliance template defaults by asset category

Gold requirement:

- Every record is organization-scoped.
- Large customers can group assets by location, project, or branch.

### 5.2 Users, Roles, and Permissions

Roles:

- Owner
- Admin
- Operations manager
- Compliance manager
- Maintenance manager
- Office staff
- Mechanic
- Operator/driver
- Read-only auditor

Permissions:

- View assets
- Create/edit assets
- View documents
- Upload documents
- Delete/archive documents
- View costs
- Manage users
- Manage billing
- Export data
- View audit logs
- Ask AI over sensitive data

Gold requirement:

- Role-based access control should be simple but real.
- Sensitive documents and costs should support restricted visibility.

### 5.3 Asset Registry

Asset types:

- Vehicle
- Truck
- Van
- Bus
- Crane
- Forklift
- Excavator
- Loader
- Trailer
- Generator
- Aerial platform
- Attachment
- Other equipment

Core fields:

- Name
- Internal code
- Plate number
- Serial number
- VIN/chassis
- Manufacturer
- Model
- Year
- Category/type
- Location
- Department/project
- Assigned operator
- Ownership type: owned, leased, rented
- Status: ready, attention, blocked, inactive, archived
- Notes
- Custom fields

Gold features:

- Saved filters
- Bulk edit
- Asset import
- QR code per asset
- Asset timeline
- Asset readiness score
- Required document profile
- Maintenance profile
- Related assets/attachments
- Export asset profile PDF

### 5.4 Document Management

Document categories:

- KTEO
- Insurance
- Registration
- Road tax/traffic-related document
- Permit
- Lifting certificate
- Periodic inspection
- Operator license
- Driver document
- Maintenance invoice
- Repair record
- Rental handover document
- Safety document
- Photo evidence
- Other

Gold features:

- File upload
- Drag-and-drop folders
- Document preview
- Document versioning
- Expiration date
- Issue date
- Document number
- Linked asset/operator/vendor
- OCR/date extraction
- AI-assisted metadata suggestion
- Duplicate detection
- Missing required document detection
- Document status: valid, warning, critical, expired, missing, under review
- Approval/review state for imported documents
- Audit trail

Gold requirement:

- A user should be able to find the correct document in under 10 seconds.

### 5.5 Compliance and Expiration Engine

Compliance engine jobs:

- Compute expiration status
- Detect missing required documents
- Apply required document templates by asset type
- Generate upcoming deadline lists
- Generate weekly readiness plan
- Support custom compliance rules per organization
- Support grace/status overrides with notes

Rule examples:

- Vehicle requires insurance and KTEO.
- Crane requires lifting certificate and periodic inspection.
- Bus requires KTEO, insurance, permit, and driver/operator document.
- Forklift or aerial platform may require inspection certificate.

Gold features:

- Compliance template builder
- Required document matrix
- Deadline calendar
- Readiness checklist per asset
- Compliance risk board
- Exportable compliance report
- Override with reason and audit log

### 5.6 Maintenance Management

Maintenance record types:

- Scheduled service
- Repair
- Inspection
- Tire/brake/check
- Preventive maintenance
- Emergency breakdown
- External vendor service

Gold features:

- Maintenance schedule per asset
- Due by date
- Due by mileage/hours, if tracked manually
- Recurring maintenance rules
- Work order style task
- Assignment
- Vendor/mechanic
- Cost tracking
- Attach invoices/photos
- Completed service history
- Overdue maintenance dashboard
- Maintenance calendar
- Asset downtime marker

Gold boundary:

- This should be strong enough for maintenance accountability, but not become a full CMMS with inventory and purchasing too early.

### 5.7 Issue Reporting

Issue features:

- Mobile-first create issue
- Asset selection
- Severity
- Description
- Photos/files
- Location/project
- Assign to user
- Status: open, triaged, in progress, waiting, resolved, closed
- Comments
- Resolution notes
- Linked maintenance task

Gold features:

- QR code scan to report issue on asset
- Offline-friendly draft later
- Push/email notification to responsible user
- SLA/age indicators
- "Blocking asset" toggle
- Issue-to-maintenance conversion

### 5.8 Operators and People

Operator records:

- Full name
- Phone/email
- License categories
- License expiration
- Assigned assets
- Documents
- Notes

Gold features:

- Operator readiness
- Expiring operator licenses
- Operator document vault
- Simple assignment history
- Privacy-aware permissions

### 5.9 Notifications and Reminders

Channels:

- In-app notifications
- Email
- Optional SMS later
- Optional WhatsApp later, if commercially justified

Notification types:

- Document expiring soon
- Document expired
- Maintenance due soon
- Maintenance overdue
- New blocking issue
- Issue assigned
- Weekly summary
- Daily brief
- Import needs review

Gold features:

- Notification preferences by role
- Per-category reminder windows
- Escalation rules
- Digest vs immediate alerts
- Notification history

### 5.10 AI Copilot

Core questions:

- What needs attention this week?
- What expires this month?
- Which assets are blocked?
- Which cranes are not inspection-ready?
- Which buses are ready for the season?
- Which documents are missing?
- Which maintenance tasks are overdue?
- Summarize asset CR-04.
- Draft a message to the mechanic about overdue tasks.
- Prepare a readiness checklist for tomorrow.

Gold AI features:

- Chat with citations
- Daily brief
- Weekly action plan
- Asset readiness explanation
- Document search assistant
- Missing data assistant
- Import cleanup assistant
- Report generation assistant
- Suggested next actions
- User feedback on AI answer quality

AI trust rules:

- Cite records used.
- Show source cards.
- Say when data is missing.
- Say "based on uploaded records" when appropriate.
- Do not invent dates, laws, certificate requirements, or legal obligations.
- Do not give legal advice.
- Keep audit log of AI-generated summaries used in operational decisions.

### 5.11 Reporting

Reports:

- Attention report
- Expiration report
- Missing document report
- Maintenance overdue report
- Asset readiness report
- Issue report
- Operator document report
- Monthly management summary

Gold features:

- Filters
- CSV export
- PDF export
- Scheduled email reports
- Shareable read-only report links later

### 5.12 Import and Onboarding

Import sources:

- Excel/CSV assets
- Excel/CSV documents
- Folder uploads
- Manual entry
- Existing customer spreadsheets

Gold import flow:

1. Upload file/folder.
2. System detects columns/files.
3. User maps columns to FleetLever fields.
4. AI suggests document categories and dates.
5. User reviews low-confidence rows.
6. Import preview shows created/updated/skipped records.
7. Import creates audit log.
8. Dashboard shows first attention summary.

This is a major commercial feature. It removes adoption friction.

### 5.13 Customer and Billing

Billing features:

- Plans by asset count
- Setup/import fee tracking
- Trial/pilot state
- Subscription status
- Stripe integration later
- Manual invoicing mode for early Greek B2B customers

Recommended commercial packages:

- Starter: up to 15 assets
- Operations: up to 50 assets
- Pro: up to 150 assets
- Custom: larger/multi-branch companies

Gold requirement:

- Do not force Stripe-only billing at the beginning. Many Greek B2B customers may need invoice/manual payment.

## 6. Gold Version UX Direction

### Design Principle

FleetLever should feel like a beautiful operations console for busy, non-technical businesses.

It should avoid:

- Marketing-page UI inside the product
- Huge decorative cards
- Overly playful AI visuals
- Dense ERP screens with no hierarchy
- One-color blue/purple SaaS sameness
- Text-heavy instruction panels

It should use:

- Clean tables
- Status chips
- Timelines
- Calendars
- Drawers
- Command/search
- Compact cards for summaries
- Icons for actions
- Clear empty states
- Calm status colors
- Subtle motion

### Visual Style

Palette:

- Background: warm-neutral white/cool gray
- Primary: deep maritime blue-green
- Secondary: slate/ink
- Success: restrained green
- Warning: amber
- Critical: red
- Info: blue

Typography:

- Geist or Inter
- Crisp headings
- Dense but readable tables
- No oversized landing-page typography in app screens

Motion:

- Smooth drawer transitions
- Gentle hover states
- Small status transitions
- Loading skeletons
- Reduced-motion support
- No gimmicky animation

### Core Layout

Desktop:

- Sidebar navigation
- Top command/search bar
- Workspace switcher
- Main content area
- Optional right copilot drawer

Tablet:

- Collapsible sidebar
- Tables with horizontal handling
- Key actions in sticky toolbar

Mobile:

- Bottom navigation or sheet nav
- Fast issue reporting
- Asset/document lookup
- Read-only dashboards first
- Avoid complex admin workflows on mobile

## 7. Gold Version Main Screens

### 7.1 Dashboard

Sections:

- Daily AI brief
- Critical attention strip
- Expiring soon
- Overdue maintenance
- Blocking issues
- Missing required documents
- Readiness by asset type
- Calendar preview
- Recent activity
- Quick actions

Gold details:

- Filter by branch/location/category.
- Every summary card links to the exact records.
- Empty state should feel reassuring, not blank.

### 7.2 Command Center

A global search and command surface.

Search:

- Asset name
- Plate
- Serial
- Document title
- Operator name
- Issue
- Maintenance task

Commands:

- Add asset
- Upload document
- Report issue
- Ask copilot
- Create maintenance task

### 7.3 Assets

Views:

- Table
- Card grid
- Map/location list later, not GPS
- Readiness board

Asset page:

- Hero summary
- Readiness status
- Required document checklist
- Documents
- Maintenance
- Issues
- Operator assignment
- Timeline
- AI summary

### 7.4 Documents

Views:

- All documents
- Expiring
- Expired
- Missing required
- Under review
- By category

Key UX:

- Drag-and-drop upload
- Review queue
- Confidence badges for AI-extracted metadata
- Fast edit of expiration dates

### 7.5 Compliance

This becomes its own Gold module.

Views:

- Compliance matrix
- Required templates
- Expiration calendar
- Risk report
- Overrides

This is the module that makes the product feel serious for crane/construction customers.

### 7.6 Maintenance

Views:

- Due list
- Calendar
- Board by status
- Asset service history
- Costs summary

### 7.7 Issues

Views:

- Open
- Blocking
- Assigned to me
- Recently resolved
- By asset

Mobile:

- Report issue in under 30 seconds

### 7.8 Operators

Views:

- Operator list
- Expiring operator documents
- Assigned assets
- Operator profile

### 7.9 Copilot

Modes:

- Chat
- Daily brief
- Weekly plan
- Asset analyst
- Document finder
- Report writer

The copilot should never feel like a generic chatbot. It should feel like an operations assistant trained on the company records.

### 7.10 Settings

Sections:

- Company
- Users and roles
- Locations
- Asset categories
- Compliance templates
- Notifications
- Billing
- Import/export
- Audit logs
- AI settings

## 8. Technical Architecture

### Recommended Stack

Frontend:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix primitives
- lucide-react
- Motion
- TanStack Table
- React Hook Form
- Zod

Backend:

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Row Level Security
- Supabase Edge Functions only if needed
- Next.js Server Actions
- Next.js Route Handlers

AI:

- Vercel AI SDK or direct OpenAI server routes
- Structured retrieval from Postgres first
- Full-text search for documents
- Embeddings only after document search becomes important
- AI observability and logs for answers

Jobs:

- Scheduled daily/weekly summaries
- Reminder generation
- Expiration recalculation
- Import processing
- Document text extraction

Payments:

- Stripe for self-serve later
- Manual invoice mode for early B2B

Monitoring:

- Error tracking
- Basic product analytics
- AI cost monitoring
- Audit logs for sensitive operations

### Architecture Shape

Use a modular monolith first.

```text
src/
  app/
    (marketing)/
    (auth)/
    (app)/
      dashboard/
      command/
      assets/
      documents/
      compliance/
      maintenance/
      issues/
      operators/
      copilot/
      reports/
      settings/
    api/
      ai/
      uploads/
      imports/
      webhooks/
  components/
    app-shell/
    dashboard/
    assets/
    documents/
    compliance/
    maintenance/
    issues/
    operators/
    copilot/
    reports/
    ui/
  lib/
    auth/
    supabase/
    db/
    dates/
    status/
    permissions/
    notifications/
    ai/
    imports/
    exports/
    validations/
  server/
    queries/
    actions/
    jobs/
  emails/
  tests/
```

Architecture principles:

- Keep server-side data fetching in Server Components or server query functions.
- Keep client components focused on interaction.
- Validate all mutations with Zod.
- Use typed database access patterns.
- Scope every query by organization.
- Keep AI behind server routes.
- Keep business logic in reusable modules, not scattered across components.
- Maintain clear boundaries between UI, database, permissions, status logic, notifications, and AI.

## 9. Database Model

Core:

- organizations
- organization_members
- profiles
- roles
- permissions
- locations
- assets
- asset_custom_fields
- asset_relationships
- operators
- operator_documents
- documents
- document_versions
- document_extractions
- compliance_templates
- compliance_template_requirements
- compliance_overrides
- maintenance_tasks
- maintenance_schedules
- maintenance_records
- issues
- issue_comments
- notifications
- notification_preferences
- activity_events
- audit_logs
- imports
- import_rows
- ai_conversations
- ai_messages
- ai_citations
- reports
- billing_customers
- subscriptions

Key database requirements:

- UUID primary keys
- `organization_id` on all tenant records
- `created_at`, `updated_at` on mutable records
- Soft archive for important records
- Audit log for sensitive changes
- Indexes on due dates, expiration dates, status, organization, asset, category
- RLS policies from day one
- Storage paths scoped by organization

## 10. AI System Design

### AI Context Strategy

Start with deterministic retrieval:

- Retrieve expiring documents by date window.
- Retrieve missing required docs by template.
- Retrieve overdue maintenance by due date.
- Retrieve open/blocking issues by status.
- Retrieve assets by name, code, plate, serial.

Then pass a compact, structured context to the model.

Do not give the model unrestricted database access.

### AI Answer Contract

Every answer should include:

- Direct answer
- Prioritized items
- Record citations
- Uncertainty if data is incomplete
- Suggested next action

Example:

```text
This week, 4 items need attention:

1. Crane CR-04 lifting certificate expires in 5 days.
2. Bus B-12 KTEO is expired.
3. Forklift FL-02 has overdue service.
4. Excavator EX-01 has a blocking hydraulic issue.

Based on 4 assets, 2 documents, 1 maintenance task, and 1 issue.
```

### AI Guardrails

- No legal advice.
- No invented compliance requirements.
- No invented document dates.
- No hidden sources.
- Always cite records.
- User can report bad answer.
- AI-generated content should be stored if operationally used.

## 11. Notification System

Notification engine should support:

- Scheduled reminder generation
- User preference filtering
- Digest grouping
- Immediate critical alerts
- Escalations
- Notification history

Reminder windows:

- 60 days before expiration
- 30 days before
- 14 days before
- 7 days before
- Day of expiration
- After expiration

Channels:

- In-app first
- Email second
- SMS/WhatsApp later if validated

## 12. Security and Compliance

Required:

- Supabase RLS
- Server-side auth verification
- Organization membership checks
- Role-based permissions
- Audit logs
- File access controls
- Upload validation
- AI data isolation
- Backups
- Data export
- Basic incident process

Important:

- FleetLever should not claim to be the legal authority for compliance.
- It should say reminders are based on company records and configured templates.
- Customers remain responsible for verifying official requirements.

## 13. Gold Version Implementation Phases

### Phase 0: Product Foundation

Outcome:

- Design system
- App shell
- Auth
- Organization model
- Seed data
- Dashboard skeleton

Deliverables:

- Next.js app
- Supabase schema baseline
- shadcn design system
- App navigation
- Demo organization
- Base status components

### Phase 1: Core Operations

Outcome:

- FleetLever is usable for assets, documents, expirations, maintenance, and issues.

Deliverables:

- Asset registry
- Document management
- Expiration engine
- Maintenance tasks
- Issue reporting
- Dashboard attention summary
- Asset detail pages

### Phase 2: Compliance Gold Layer

Outcome:

- The product becomes serious for crane/construction/equipment customers.

Deliverables:

- Compliance templates
- Required document matrix
- Missing document detection
- Expiration calendar
- Readiness reports
- Compliance overrides
- Exportable reports

### Phase 3: AI Operations Copilot

Outcome:

- AI becomes a reliable operational interface.

Deliverables:

- Chat with citations
- Daily brief
- Weekly plan
- Asset summary
- Document finder
- Missing data assistant
- AI answer feedback
- AI usage/cost tracking

### Phase 4: Onboarding and Import Engine

Outcome:

- Real companies can move from Excel/folders into FleetLever.

Deliverables:

- CSV/Excel import
- Folder upload flow
- Column mapping
- Document metadata suggestion
- Review queue
- Import audit trail
- Demo-to-live migration workflow

### Phase 5: Notifications and Reports

Outcome:

- FleetLever becomes proactive.

Deliverables:

- In-app notifications
- Email reminders
- Digest settings
- Scheduled reports
- PDF/CSV exports
- Notification preferences

### Phase 6: Commercial SaaS Layer

Outcome:

- FleetLever can support real paying customers.

Deliverables:

- Billing model
- Manual invoice mode
- Stripe later
- Admin tools
- Customer plan limits
- Usage limits
- Support diagnostics
- Data export

### Phase 7: Field and Mobile Polish

Outcome:

- Operators and field staff can use the system without friction.

Deliverables:

- Mobile issue reporting
- QR code asset pages
- Photo uploads
- Fast lookup
- Mobile-friendly document view
- Offline draft exploration later

## 14. Testing and Quality Plan

Automated:

- Unit tests for status logic
- Unit tests for permission logic
- Unit tests for compliance template logic
- Integration tests for CRUD workflows
- Integration tests for RLS-sensitive queries
- AI retrieval tests
- Smoke tests for dashboard, assets, docs, maintenance, issues, copilot

Manual:

- Desktop, tablet, mobile
- Greek long text
- Empty states
- Loading states
- Error states
- Upload failures
- Import failures
- AI unavailable
- Permission denied states
- Expired/critical/warning date boundaries

Visual QA:

- No overlap
- Tables readable
- Status colors clear
- Mobile controls usable
- Drawers and dialogs polished
- Animations subtle

## 15. Analytics and Success Metrics

Product metrics:

- Assets created/imported
- Documents uploaded
- Expirations tracked
- Missing documents resolved
- Maintenance tasks completed
- Issues reported/resolved
- AI questions asked
- Daily brief views
- Notification opens

Business metrics:

- Demo-to-pilot conversion
- Pilot-to-paid conversion
- Setup fee acceptance
- Monthly churn
- Average revenue per account
- Time to first useful dashboard
- Number of active weekly users per company

Critical activation metric:

> Customer reaches first useful attention summary within 24 hours of onboarding.

## 16. Pricing and Packaging for Gold Version

Recommended packaging:

Starter:

- Up to 15 assets
- Core assets/docs/expirations
- Basic maintenance
- Basic AI brief

Operations:

- Up to 50 assets
- Full maintenance/issues
- AI copilot
- Reports
- Notifications
- Import support

Pro:

- Up to 150 assets
- Compliance templates
- Advanced permissions
- Audit logs
- Advanced reports
- Priority support

Custom:

- Multi-branch
- Higher asset count
- Custom onboarding
- Custom compliance setup
- Advanced exports

Setup/import:

- One-time fee
- Should remain part of the offer because it solves the hardest adoption problem

## 17. What Gold Still Should Not Include Yet

Even the Gold Version should be disciplined.

Avoid until validated:

- Native GPS hardware
- Full telematics
- Dispatch optimization
- Accounting/invoicing suite
- Payroll
- Parts inventory
- Procurement
- Deep ERP workflows
- Heavy municipal tender functionality
- Complex workflow automation builder

Integration-ready is fine. Building everything is not.

## 18. Recommended Build Strategy

Build Gold Version as a sequence of production-quality layers, not as one giant release.

Best path:

1. Build a beautiful, real core app.
2. Get paid pilots.
3. Add compliance templates and import engine.
4. Add proactive notifications.
5. Add stronger AI and reports.
6. Add billing/admin.
7. Expand integrations only after repeated paid demand.

The Gold Version should be the north star. The first release should still be narrow enough to finish.

## 19. Gold Version Definition of Done

FleetLever Gold is ready when:

- Multiple companies can use it safely in separate organizations.
- Users have roles and permissions.
- Assets, documents, maintenance, issues, operators, and compliance templates work together.
- Dashboard explains operational risk clearly.
- AI answers cite records and avoid hallucinated compliance claims.
- Imports make onboarding practical.
- Notifications prevent missed deadlines.
- Reports can be exported.
- Audit logs exist for sensitive changes.
- The app is responsive and polished.
- Security and RLS are tested.
- A customer can run a weekly operations meeting from FleetLever.

Final product test:

> If the owner opens FleetLever every morning and trusts it more than their spreadsheet, WhatsApp, and memory, the Gold Version is doing its job.

