begin;

create table if not exists public.console_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  snapshot_key text not null,
  snapshot jsonb not null,
  updated_by_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, snapshot_key)
);

create index if not exists console_snapshots_org_key_idx
  on public.console_snapshots (organization_id, snapshot_key);

alter table public.console_snapshots enable row level security;
alter table public.console_snapshots force row level security;

create policy console_snapshots_tenant_select on public.console_snapshots
for select
using (organization_id = app_private.current_organization_id());

create policy console_snapshots_tenant_insert on public.console_snapshots
for insert
with check (organization_id = app_private.current_organization_id());

create policy console_snapshots_tenant_update on public.console_snapshots
for update
using (organization_id = app_private.current_organization_id())
with check (organization_id = app_private.current_organization_id());

create policy console_snapshots_tenant_delete on public.console_snapshots
for delete
using (organization_id = app_private.current_organization_id());

create trigger console_snapshots_touch_updated_at
before update on public.console_snapshots
for each row execute function app_private.touch_updated_at();

commit;
