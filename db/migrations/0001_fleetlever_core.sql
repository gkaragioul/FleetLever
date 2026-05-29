begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists app_private;

create or replace function app_private.current_organization_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_organization_id', true), '')::uuid;
$$;

create or replace function app_private.current_profile_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.current_profile_id', true), '')::uuid;
$$;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  vat_number text,
  timezone text not null default 'Europe/Athens',
  currency char(3) not null default 'EUR',
  locale text not null default 'el-GR',
  status text not null default 'active' check (status in ('active', 'trial', 'paused', 'archived')),
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_subject text unique,
  email citext not null unique,
  full_name text not null,
  phone text,
  locale text not null default 'el-GR',
  timezone text not null default 'Europe/Athens',
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (
    role in (
      'owner',
      'admin',
      'operations_manager',
      'compliance_manager',
      'maintenance_manager',
      'office_staff',
      'mechanic',
      'operator',
      'auditor'
    )
  ),
  permissions jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, profile_id)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text not null default 'GR',
  kind text not null default 'yard' check (kind in ('yard', 'depot', 'branch', 'project', 'warehouse', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  vendor_type text not null default 'service' check (vendor_type in ('service', 'insurance', 'inspection', 'rental', 'parts', 'other')),
  phone text,
  email citext,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  phone text,
  email citext,
  role_title text,
  license_categories text[] not null default '{}',
  license_expires_at date,
  notes text,
  archived_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(phone, '') || ' ' || coalesce(email::text, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  assigned_operator_id uuid references public.operators(id) on delete set null,
  name text not null,
  internal_code text not null,
  asset_type text not null,
  plate_number text,
  serial_number text,
  vin_chassis text,
  manufacturer text,
  model text,
  year integer check (year is null or year between 1950 and 2100),
  department text,
  ownership_type text not null default 'owned' check (ownership_type in ('owned', 'leased', 'rented')),
  status text not null default 'ready' check (status in ('ready', 'attention', 'blocked', 'inactive', 'archived')),
  current_mileage integer check (current_mileage is null or current_mileage >= 0),
  current_hours integer check (current_hours is null or current_hours >= 0),
  notes text,
  custom_fields jsonb not null default '{}',
  archived_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector(
      'simple',
      coalesce(name, '') || ' ' ||
      coalesce(internal_code, '') || ' ' ||
      coalesce(asset_type, '') || ' ' ||
      coalesce(plate_number, '') || ' ' ||
      coalesce(serial_number, '') || ' ' ||
      coalesce(vin_chassis, '') || ' ' ||
      coalesce(manufacturer, '') || ' ' ||
      coalesce(model, '')
    )
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, internal_code),
  unique (organization_id, plate_number),
  unique (organization_id, serial_number)
);

create table public.asset_relationships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_asset_id uuid not null references public.assets(id) on delete cascade,
  child_asset_id uuid not null references public.assets(id) on delete cascade,
  relationship_type text not null default 'attached_to' check (relationship_type in ('attached_to', 'tows', 'mounted_on', 'paired_with')),
  created_at timestamptz not null default now(),
  unique (parent_asset_id, child_asset_id, relationship_type),
  check (parent_asset_id <> child_asset_id)
);

create table public.operator_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  assigned_from date not null default current_date,
  assigned_until date,
  created_at timestamptz not null default now(),
  check (assigned_until is null or assigned_until >= assigned_from)
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  category text not null,
  storage_key text not null,
  file_name text not null,
  mime_type text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  document_number text,
  issued_at date,
  expires_at date,
  status text not null default 'under_review' check (
    status in ('valid', 'warning', 'critical', 'expired', 'missing', 'under_review')
  ),
  review_state text not null default 'under_review' check (review_state in ('under_review', 'approved', 'rejected')),
  ai_confidence numeric(4, 3) check (ai_confidence is null or ai_confidence between 0 and 1),
  visibility text not null default 'standard' check (visibility in ('standard', 'restricted')),
  archived_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(category, '') || ' ' || coalesce(document_number, '') || ' ' || coalesce(file_name, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, storage_key)
);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_key text not null,
  file_name text not null,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  uploaded_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create table public.document_asset_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (document_id, asset_id)
);

create table public.document_operator_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (document_id, operator_id)
);

create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  extracted_text text,
  suggested_metadata jsonb not null default '{}',
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  extraction_status text not null default 'pending' check (extraction_status in ('pending', 'processed', 'failed')),
  created_at timestamptz not null default now()
);

create table public.compliance_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_type text not null,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, asset_type, name)
);

create table public.compliance_template_requirements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  template_id uuid not null references public.compliance_templates(id) on delete cascade,
  document_category text not null,
  required boolean not null default true,
  reminder_days integer[] not null default '{60,30,14,7,0}',
  created_at timestamptz not null default now(),
  unique (template_id, document_category)
);

create table public.compliance_overrides (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  requirement_id uuid references public.compliance_template_requirements(id) on delete set null,
  override_status text not null check (override_status in ('approved_exception', 'not_applicable', 'grace_period')),
  reason text not null,
  expires_at date,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  title text not null,
  interval_days integer check (interval_days is null or interval_days > 0),
  interval_mileage integer check (interval_mileage is null or interval_mileage > 0),
  interval_hours integer check (interval_hours is null or interval_hours > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  schedule_id uuid references public.maintenance_schedules(id) on delete set null,
  title text not null,
  task_type text not null default 'scheduled_service',
  status text not null default 'scheduled' check (
    status in ('scheduled', 'in_progress', 'waiting', 'overdue', 'completed', 'cancelled')
  ),
  due_at date,
  due_mileage integer check (due_mileage is null or due_mileage >= 0),
  due_hours integer check (due_hours is null or due_hours >= 0),
  assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  cost_cents integer check (cost_cents is null or cost_cents >= 0),
  downtime_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid references public.maintenance_tasks(id) on delete set null,
  asset_id uuid not null references public.assets(id) on delete cascade,
  title text not null,
  completed_at timestamptz not null default now(),
  mileage integer check (mileage is null or mileage >= 0),
  hours integer check (hours is null or hours >= 0),
  cost_cents integer check (cost_cents is null or cost_cents >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete cascade,
  reported_by_profile_id uuid references public.profiles(id) on delete set null,
  assigned_to_profile_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (
    status in ('open', 'triaged', 'in_progress', 'waiting', 'resolved', 'closed')
  ),
  blocking_asset boolean not null default false,
  location_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.issue_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  issue_id uuid not null references public.issues(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  notification_type text not null,
  record_table text,
  record_id uuid,
  delivery_channels text[] not null default '{in_app}',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null,
  channels text[] not null default '{in_app}',
  digest_mode text not null default 'immediate' check (digest_mode in ('immediate', 'daily', 'weekly', 'muted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, notification_type)
);

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  import_type text not null check (import_type in ('assets_csv', 'documents_csv', 'folder_upload', 'mixed')),
  status text not null default 'uploaded' check (status in ('uploaded', 'mapping', 'review', 'importing', 'completed', 'failed', 'cancelled')),
  source_name text not null,
  mapping jsonb not null default '{}',
  summary jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_id uuid not null references public.imports(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  raw_data jsonb not null,
  normalized_data jsonb not null default '{}',
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  status text not null default 'pending' check (status in ('pending', 'ready', 'needs_review', 'imported', 'skipped', 'failed')),
  error_message text,
  created_record_table text,
  created_record_id uuid,
  created_at timestamptz not null default now(),
  unique (import_id, row_number)
);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  title text,
  mode text not null default 'chat' check (mode in ('chat', 'daily_brief', 'weekly_plan', 'asset_analyst', 'document_finder', 'report_writer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  model text,
  token_count integer check (token_count is null or token_count >= 0),
  feedback text check (feedback is null or feedback in ('helpful', 'not_helpful')),
  created_at timestamptz not null default now()
);

create table public.ai_citations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  message_id uuid not null references public.ai_messages(id) on delete cascade,
  record_table text not null,
  record_id uuid not null,
  title text not null,
  excerpt text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  report_type text not null,
  title text not null,
  filters jsonb not null default '{}',
  storage_key text,
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade unique,
  billing_mode text not null default 'manual_invoice' check (billing_mode in ('manual_invoice', 'stripe')),
  billing_email citext,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  billing_customer_id uuid references public.billing_customers(id) on delete cascade,
  plan_code text not null check (plan_code in ('starter', 'operations', 'pro', 'custom')),
  asset_limit integer check (asset_limit is null or asset_limit > 0),
  status text not null default 'trial' check (status in ('trial', 'active', 'past_due', 'cancelled', 'paused')),
  current_period_starts_at timestamptz,
  current_period_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  record_table text not null,
  record_id uuid,
  metadata jsonb not null default '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create or replace view public.asset_readiness_summary
with (security_invoker = true) as
select
  asset.id as asset_id,
  asset.organization_id,
  asset.internal_code,
  asset.name,
  asset.asset_type,
  asset.status,
  count(distinct requirement.id) filter (
    where requirement.required
      and not exists (
        select 1
        from public.document_asset_links dal
        join public.documents document on document.id = dal.document_id
        where dal.asset_id = asset.id
          and dal.organization_id = asset.organization_id
          and document.organization_id = asset.organization_id
          and document.category = requirement.document_category
          and document.archived_at is null
          and document.review_state = 'approved'
          and (document.expires_at is null or document.expires_at >= current_date)
      )
  ) as missing_required_documents,
  count(distinct document.id) filter (where document.expires_at < current_date) as expired_documents,
  count(distinct document.id) filter (where document.expires_at between current_date and current_date + interval '30 days') as expiring_documents,
  count(distinct task.id) filter (where task.status = 'overdue') as overdue_maintenance_tasks,
  count(distinct issue.id) filter (where issue.blocking_asset and issue.status not in ('resolved', 'closed')) as blocking_issues
from public.assets asset
left join public.compliance_templates template
  on template.organization_id = asset.organization_id
  and template.asset_type = asset.asset_type
  and template.is_default
left join public.compliance_template_requirements requirement
  on requirement.template_id = template.id
  and requirement.organization_id = asset.organization_id
left join public.document_asset_links dal
  on dal.asset_id = asset.id
  and dal.organization_id = asset.organization_id
left join public.documents document
  on document.id = dal.document_id
  and document.organization_id = asset.organization_id
  and document.archived_at is null
left join public.maintenance_tasks task
  on task.asset_id = asset.id
  and task.organization_id = asset.organization_id
  and task.status not in ('completed', 'cancelled')
left join public.issues issue
  on issue.asset_id = asset.id
  and issue.organization_id = asset.organization_id
  and issue.status not in ('resolved', 'closed')
where asset.archived_at is null
group by asset.id;

create index organization_members_org_profile_idx on public.organization_members (organization_id, profile_id) where status = 'active';
create index locations_org_kind_idx on public.locations (organization_id, kind);
create index vendors_org_type_idx on public.vendors (organization_id, vendor_type) where archived_at is null;
create index operators_org_search_idx on public.operators using gin (search_vector);
create index operators_org_license_expiry_idx on public.operators (organization_id, license_expires_at) where archived_at is null and license_expires_at is not null;
create index assets_org_status_idx on public.assets (organization_id, status) where archived_at is null;
create index assets_org_type_idx on public.assets (organization_id, asset_type) where archived_at is null;
create index assets_org_location_idx on public.assets (organization_id, location_id) where archived_at is null;
create index assets_org_operator_idx on public.assets (organization_id, assigned_operator_id) where archived_at is null;
create index assets_search_idx on public.assets using gin (search_vector);
create index assets_custom_fields_idx on public.assets using gin (custom_fields);
create index document_asset_links_asset_idx on public.document_asset_links (organization_id, asset_id, document_id);
create index document_operator_links_operator_idx on public.document_operator_links (organization_id, operator_id, document_id);
create index documents_org_expiry_idx on public.documents (organization_id, expires_at) where archived_at is null and expires_at is not null;
create index documents_org_status_idx on public.documents (organization_id, status, review_state) where archived_at is null;
create index documents_org_category_idx on public.documents (organization_id, category) where archived_at is null;
create index documents_search_idx on public.documents using gin (search_vector);
create index compliance_requirements_template_idx on public.compliance_template_requirements (template_id, document_category);
create index maintenance_tasks_org_due_idx on public.maintenance_tasks (organization_id, due_at, status) where status not in ('completed', 'cancelled');
create index maintenance_tasks_asset_idx on public.maintenance_tasks (organization_id, asset_id, status);
create index issues_org_status_idx on public.issues (organization_id, status, blocking_asset);
create index issues_asset_idx on public.issues (organization_id, asset_id, status);
create index notifications_profile_unread_idx on public.notifications (organization_id, profile_id, created_at desc) where read_at is null;
create index import_rows_review_idx on public.import_rows (organization_id, import_id, status);
create index ai_messages_conversation_idx on public.ai_messages (organization_id, conversation_id, created_at);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations',
    'organization_members',
    'locations',
    'vendors',
    'operators',
    'assets',
    'asset_relationships',
    'operator_assignments',
    'documents',
    'document_versions',
    'document_asset_links',
    'document_operator_links',
    'document_extractions',
    'compliance_templates',
    'compliance_template_requirements',
    'compliance_overrides',
    'maintenance_schedules',
    'maintenance_tasks',
    'maintenance_records',
    'issues',
    'issue_comments',
    'notifications',
    'notification_preferences',
    'imports',
    'import_rows',
    'ai_conversations',
    'ai_messages',
    'ai_citations',
    'reports',
    'billing_customers',
    'subscriptions',
    'audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;

create policy profiles_select on public.profiles
for select
using (
  id = app_private.current_profile_id()
  or exists (
    select 1
    from public.organization_members members
    where members.profile_id = profiles.id
      and members.organization_id = app_private.current_organization_id()
      and members.status = 'active'
  )
);

create policy organizations_tenant_select on public.organizations
for select
using (
  id = app_private.current_organization_id()
);

create policy organizations_tenant_update on public.organizations
for update
using (
  id = app_private.current_organization_id()
)
with check (id = app_private.current_organization_id());

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organization_members',
    'locations',
    'vendors',
    'operators',
    'assets',
    'asset_relationships',
    'operator_assignments',
    'documents',
    'document_versions',
    'document_asset_links',
    'document_operator_links',
    'document_extractions',
    'compliance_templates',
    'compliance_template_requirements',
    'compliance_overrides',
    'maintenance_schedules',
    'maintenance_tasks',
    'maintenance_records',
    'issues',
    'issue_comments',
    'notifications',
    'notification_preferences',
    'imports',
    'import_rows',
    'ai_conversations',
    'ai_messages',
    'ai_citations',
    'reports',
    'billing_customers',
    'subscriptions',
    'audit_logs'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select using (organization_id = app_private.current_organization_id())',
      table_name || '_tenant_select',
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (organization_id = app_private.current_organization_id())',
      table_name || '_tenant_insert',
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (organization_id = app_private.current_organization_id()) with check (organization_id = app_private.current_organization_id())',
      table_name || '_tenant_update',
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (organization_id = app_private.current_organization_id())',
      table_name || '_tenant_delete',
      table_name
    );
  end loop;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'organizations',
    'profiles',
    'organization_members',
    'locations',
    'vendors',
    'operators',
    'assets',
    'documents',
    'compliance_templates',
    'maintenance_schedules',
    'maintenance_tasks',
    'issues',
    'notification_preferences',
    'imports',
    'ai_conversations',
    'billing_customers',
    'subscriptions'
  ]
  loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function app_private.touch_updated_at()',
      table_name || '_touch_updated_at',
      table_name
    );
  end loop;
end;
$$;

commit;
