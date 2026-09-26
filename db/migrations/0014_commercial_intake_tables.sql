-- The demo-request and analytics routes used to run `create table if not exists` on every
-- request. That needed schema-changing rights for the runtime role and cost a catalog round trip
-- per anonymous call. The tables are now created here, with the same shape, so existing
-- deployments keep their data. The runtime role may only insert into them.

create table if not exists public.commercial_demo_requests (
  id bigserial primary key,
  name text not null,
  company text not null,
  work_email text not null,
  phone text,
  role text not null,
  fleet_size text not null,
  challenge text not null,
  source text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.commercial_events (
  id bigserial primary key,
  event_name text not null,
  path text not null,
  label text,
  referrer text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists commercial_events_created_at_idx on public.commercial_events (created_at);
create index if not exists commercial_demo_requests_created_at_idx on public.commercial_demo_requests (created_at);

-- Tables that the old request-time code created belong to the runtime role; an owner can always
-- re-grant itself, so hand them to the migration role first.
alter table public.commercial_demo_requests owner to current_user;
alter table public.commercial_events owner to current_user;

revoke all on public.commercial_demo_requests from public;
revoke all on public.commercial_events from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    revoke all on public.commercial_demo_requests from fleetlever_app;
    revoke all on public.commercial_events from fleetlever_app;
    grant insert on public.commercial_demo_requests to fleetlever_app;
    grant insert on public.commercial_events to fleetlever_app;
    grant usage on sequence public.commercial_demo_requests_id_seq to fleetlever_app;
    grant usage on sequence public.commercial_events_id_seq to fleetlever_app;
  end if;
end;
$$;
