create table if not exists public.lisa_relay_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  question text not null check (char_length(question) between 1 and 2000),
  context jsonb not null default '{}'::jsonb,
  claimed_by text,
  cancel_requested boolean not null default false,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists lisa_relay_jobs_pending_idx
  on public.lisa_relay_jobs (status, created_at)
  where status = 'pending';

create index if not exists lisa_relay_jobs_expiry_idx
  on public.lisa_relay_jobs (expires_at);

create table if not exists public.lisa_relay_events (
  sequence_id bigserial primary key,
  job_id uuid not null references public.lisa_relay_jobs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_type text not null check (event_type in ('status', 'message', 'error', 'done')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lisa_relay_events_job_sequence_idx
  on public.lisa_relay_events (job_id, sequence_id);

create table if not exists app_private.lisa_relay_connections (
  companion_id text primary key check (char_length(companion_id) between 1 and 120),
  status text not null default 'connected' check (status in ('connected', 'busy')),
  version text,
  last_heartbeat_at timestamptz not null default now()
);

alter table public.lisa_relay_jobs enable row level security;
alter table public.lisa_relay_jobs force row level security;
alter table public.lisa_relay_events enable row level security;
alter table public.lisa_relay_events force row level security;

drop policy if exists lisa_relay_jobs_tenant_select on public.lisa_relay_jobs;
drop policy if exists lisa_relay_jobs_tenant_insert on public.lisa_relay_jobs;
drop policy if exists lisa_relay_jobs_tenant_update on public.lisa_relay_jobs;
drop policy if exists lisa_relay_events_tenant_select on public.lisa_relay_events;

create policy lisa_relay_jobs_tenant_select on public.lisa_relay_jobs
  for select using (organization_id = app_private.current_organization_id());
create policy lisa_relay_jobs_tenant_insert on public.lisa_relay_jobs
  for insert with check (organization_id = app_private.current_organization_id());
create policy lisa_relay_jobs_tenant_update on public.lisa_relay_jobs
  for update using (organization_id = app_private.current_organization_id())
  with check (organization_id = app_private.current_organization_id());
create policy lisa_relay_events_tenant_select on public.lisa_relay_events
  for select using (organization_id = app_private.current_organization_id());

create or replace function app_private.lisa_relay_heartbeat(
  p_companion_id text,
  p_status text,
  p_version text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $$
begin
  if char_length(coalesce(p_companion_id, '')) not between 1 and 120 then
    raise exception 'Invalid companion id';
  end if;

  insert into app_private.lisa_relay_connections (companion_id, status, version, last_heartbeat_at)
  values (p_companion_id, case when p_status = 'busy' then 'busy' else 'connected' end, left(p_version, 80), now())
  on conflict (companion_id) do update set
    status = excluded.status,
    version = excluded.version,
    last_heartbeat_at = excluded.last_heartbeat_at;

  delete from public.lisa_relay_jobs
  where expires_at < now()
     or (completed_at is not null and completed_at < now() - interval '5 minutes');
end;
$$;

create or replace function app_private.claim_lisa_relay_job(p_companion_id text)
returns table (
  id uuid,
  question text,
  context jsonb
)
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $$
begin
  return query
  with candidate as (
    select job.id
    from public.lisa_relay_jobs job
    where job.status = 'pending'
      and job.expires_at > now()
    order by job.created_at
    for update skip locked
    limit 1
  )
  update public.lisa_relay_jobs job
  set status = 'processing',
      claimed_by = left(p_companion_id, 120),
      claimed_at = now()
  from candidate
  where job.id = candidate.id
  returning job.id, job.question, job.context;
end;
$$;

create or replace function app_private.append_lisa_relay_event(
  p_job_id uuid,
  p_event_type text,
  p_payload jsonb,
  p_terminal boolean
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, app_private
as $$
declare
  target_organization_id uuid;
begin
  select organization_id into target_organization_id
  from public.lisa_relay_jobs
  where id = p_job_id
    and status in ('processing', 'pending')
    and expires_at > now();

  if target_organization_id is null then
    return false;
  end if;

  insert into public.lisa_relay_events (job_id, organization_id, event_type, payload)
  values (p_job_id, target_organization_id, p_event_type, coalesce(p_payload, '{}'::jsonb));

  if p_terminal then
    update public.lisa_relay_jobs
    set status = case when p_event_type = 'done' then 'completed' else 'failed' end,
        completed_at = now(),
        question = '[expired]',
        context = '{}'::jsonb
    where id = p_job_id;
  end if;

  return true;
end;
$$;

create or replace function app_private.lisa_relay_job_status(p_job_id uuid)
returns table (status text, cancel_requested boolean)
language sql
security definer
set search_path = pg_catalog, public, app_private
as $$
  select job.status, job.cancel_requested
  from public.lisa_relay_jobs job
  where job.id = p_job_id
    and job.expires_at > now()
  limit 1
$$;

create or replace function app_private.lisa_relay_last_heartbeat(p_companion_id text)
returns table (status text, last_heartbeat_at timestamptz)
language sql
security definer
set search_path = pg_catalog, public, app_private
as $$
  select connection.status, connection.last_heartbeat_at
  from app_private.lisa_relay_connections connection
  where connection.companion_id = p_companion_id
  limit 1
$$;

revoke all on function app_private.lisa_relay_heartbeat(text, text, text) from public;
revoke all on function app_private.claim_lisa_relay_job(text) from public;
revoke all on function app_private.append_lisa_relay_event(uuid, text, jsonb, boolean) from public;
revoke all on function app_private.lisa_relay_job_status(uuid) from public;
revoke all on function app_private.lisa_relay_last_heartbeat(text) from public;

grant execute on function app_private.lisa_relay_heartbeat(text, text, text) to current_user;
grant execute on function app_private.claim_lisa_relay_job(text) to current_user;
grant execute on function app_private.append_lisa_relay_event(uuid, text, jsonb, boolean) to current_user;
grant execute on function app_private.lisa_relay_job_status(uuid) to current_user;
grant execute on function app_private.lisa_relay_last_heartbeat(text) to current_user;
