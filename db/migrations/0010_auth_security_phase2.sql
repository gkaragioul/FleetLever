begin;

create table if not exists app_private.account_credentials (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

insert into app_private.account_credentials (profile_id, password_hash)
select id, password_hash
from public.profiles
where password_hash is not null
on conflict (profile_id) do update
set password_hash = excluded.password_hash,
    updated_at = now();

update public.profiles
set password_hash = null
where password_hash is not null;

alter table public.profiles
  drop constraint if exists profiles_password_hash_must_be_null;

alter table public.profiles
  add constraint profiles_password_hash_must_be_null
  check (password_hash is null);

create table if not exists app_private.rate_limit_buckets (
  key_hash char(64) primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_window_idx
  on app_private.rate_limit_buckets (window_started_at);

create or replace function app_private.consume_rate_limit(
  requested_key_hash char(64),
  requested_limit integer,
  requested_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resolved_count integer;
begin
  if requested_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid rate-limit key.' using errcode = '22023';
  end if;
  if requested_limit < 1 or requested_limit > 10000 then
    raise exception 'Rate-limit request count is out of range.' using errcode = '22023';
  end if;
  if requested_window_seconds < 1 or requested_window_seconds > 86400 then
    raise exception 'Rate-limit window is out of range.' using errcode = '22023';
  end if;

  insert into app_private.rate_limit_buckets (key_hash, window_started_at, request_count)
  values (requested_key_hash, now(), 1)
  on conflict (key_hash) do update
  set window_started_at = case
        when app_private.rate_limit_buckets.window_started_at <= now() - make_interval(secs => requested_window_seconds)
          then now()
        else app_private.rate_limit_buckets.window_started_at
      end,
      request_count = case
        when app_private.rate_limit_buckets.window_started_at <= now() - make_interval(secs => requested_window_seconds)
          then 1
        else app_private.rate_limit_buckets.request_count + 1
      end,
      updated_at = now()
  returning request_count into resolved_count;

  delete from app_private.rate_limit_buckets
  where window_started_at < now() - interval '7 days';

  return resolved_count <= requested_limit;
end;
$$;

create or replace function app_private.register_email_account(
  requested_email citext,
  requested_name text,
  requested_organization text,
  requested_password_hash text
)
returns table (profile_id uuid, organization_id uuid, member_role text, trial_started_at timestamptz, trial_ends_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  next_profile_id uuid := gen_random_uuid();
  next_organization_id uuid := gen_random_uuid();
  trial_start timestamptz := now();
begin
  if exists (select 1 from public.profiles where email = requested_email) then
    raise exception 'An account already exists for this email.' using errcode = '23505';
  end if;

  insert into public.organizations (id, name, legal_name, locale, status, trial_started_at, trial_ends_at)
  values (next_organization_id, left(trim(requested_organization), 160), left(trim(requested_organization), 160), 'en-GB', 'trial', trial_start, trial_start + interval '15 days');

  insert into public.profiles (id, email, full_name, locale, status)
  values (next_profile_id, requested_email, left(trim(requested_name), 160), 'en-GB', 'active');

  insert into app_private.account_credentials (profile_id, password_hash)
  values (next_profile_id, requested_password_hash);

  insert into public.organization_members (organization_id, profile_id, role, status)
  values (next_organization_id, next_profile_id, 'owner', 'active');

  insert into public.billing_customers (organization_id, billing_email)
  values (next_organization_id, requested_email);

  insert into public.subscriptions (organization_id, plan_code, status, current_period_starts_at, current_period_ends_at)
  values (next_organization_id, 'operations', 'trial', trial_start, trial_start + interval '15 days');

  insert into public.audit_logs (organization_id, actor_profile_id, action, record_table, record_id, metadata)
  values (next_organization_id, next_profile_id, 'account.organization_created', 'organizations', next_organization_id, jsonb_build_object('source', 'email'));

  return query select next_profile_id, next_organization_id, 'owner'::text, trial_start, trial_start + interval '15 days';
end;
$$;

create or replace function app_private.account_by_email(requested_email citext)
returns table (
  profile_id uuid,
  organization_id uuid,
  member_role text,
  account_email citext,
  full_name text,
  password_hash text,
  email_verified_at timestamptz,
  organization_name text,
  organization_status text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select profile.id, member.organization_id, member.role, profile.email, profile.full_name,
         credential.password_hash, profile.email_verified_at, organization.name, organization.status,
         organization.trial_started_at, organization.trial_ends_at
  from public.profiles profile
  join app_private.account_credentials credential on credential.profile_id = profile.id
  join public.organization_members member on member.profile_id = profile.id and member.status = 'active'
  join public.organizations organization on organization.id = member.organization_id
  where profile.email = requested_email and profile.status = 'active'
  order by member.created_at
  limit 1;
$$;

create or replace function app_private.consume_password_reset(requested_token_hash char(64), requested_password_hash text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resolved_profile_id uuid;
begin
  update public.auth_tokens
  set used_at = now()
  where token_hash = requested_token_hash
    and kind = 'password_reset'
    and used_at is null
    and expires_at > now()
  returning profile_id into resolved_profile_id;

  if resolved_profile_id is null then return false; end if;

  insert into app_private.account_credentials (profile_id, password_hash)
  values (resolved_profile_id, requested_password_hash)
  on conflict (profile_id) do update
  set password_hash = excluded.password_hash,
      updated_at = now();

  update public.auth_sessions
  set revoked_at = now()
  where profile_id = resolved_profile_id and revoked_at is null;

  return true;
end;
$$;

revoke all on app_private.account_credentials from public;
revoke all on app_private.rate_limit_buckets from public;
revoke all on function app_private.consume_rate_limit(char, integer, integer) from public;
revoke all on function app_private.register_email_account(citext, text, text, text) from public;
revoke all on function app_private.account_by_email(citext) from public;
revoke all on function app_private.consume_password_reset(char, text) from public;

grant execute on function app_private.consume_rate_limit(char, integer, integer) to current_user;
grant execute on function app_private.register_email_account(citext, text, text, text) to current_user;
grant execute on function app_private.account_by_email(citext) to current_user;
grant execute on function app_private.consume_password_reset(char, text) to current_user;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    revoke all on app_private.account_credentials from fleetlever_app;
    revoke all on app_private.rate_limit_buckets from fleetlever_app;
    grant execute on function app_private.consume_rate_limit(char, integer, integer) to fleetlever_app;
    grant execute on function app_private.register_email_account(citext, text, text, text) to fleetlever_app;
    grant execute on function app_private.account_by_email(citext) to fleetlever_app;
    grant execute on function app_private.consume_password_reset(char, text) to fleetlever_app;
  end if;
end;
$$;

commit;
