alter table public.organizations
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz;

update public.organizations
set trial_started_at = coalesce(trial_started_at, created_at),
    trial_ends_at = coalesce(trial_ends_at, created_at + interval '15 days')
where status = 'trial';

alter table public.organizations
  add constraint organizations_trial_window_check
  check (
    (trial_started_at is null and trial_ends_at is null)
    or (trial_started_at is not null and trial_ends_at > trial_started_at)
  ) not valid;

alter table public.organizations validate constraint organizations_trial_window_check;

alter table public.profiles
  add column if not exists password_hash text,
  add column if not exists email_verified_at timestamptz;

create table if not exists public.auth_sessions (
  token_hash char(64) primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists auth_sessions_profile_active_idx
  on public.auth_sessions (profile_id, expires_at desc)
  where revoked_at is null;

create table if not exists public.auth_tokens (
  token_hash char(64) primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('email_verification', 'password_reset')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists auth_tokens_profile_kind_idx
  on public.auth_tokens (profile_id, kind, expires_at desc)
  where used_at is null;

create table if not exists public.oauth_identities (
  provider text not null check (provider in ('google')),
  provider_subject text not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  email citext not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (provider, provider_subject),
  unique (provider, profile_id)
);

create or replace function app_private.prevent_trial_window_reset()
returns trigger
language plpgsql
as $$
begin
  if old.trial_started_at is not null and (
    new.trial_started_at is distinct from old.trial_started_at
    or new.trial_ends_at is distinct from old.trial_ends_at
  ) then
    raise exception 'Trial dates are immutable once started.';
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_prevent_trial_reset on public.organizations;
create trigger organizations_prevent_trial_reset
before update of trial_started_at, trial_ends_at on public.organizations
for each row execute function app_private.prevent_trial_window_reset();

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

  insert into public.profiles (id, email, full_name, locale, password_hash, status)
  values (next_profile_id, requested_email, left(trim(requested_name), 160), 'en-GB', requested_password_hash, 'active');

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
         profile.password_hash, profile.email_verified_at, organization.name, organization.status,
         organization.trial_started_at, organization.trial_ends_at
  from public.profiles profile
  join public.organization_members member on member.profile_id = profile.id and member.status = 'active'
  join public.organizations organization on organization.id = member.organization_id
  where profile.email = requested_email and profile.status = 'active'
  order by member.created_at
  limit 1;
$$;

create or replace function app_private.account_session_by_hash(requested_token_hash char(64))
returns table (
  profile_id uuid,
  organization_id uuid,
  member_role text,
  account_email citext,
  full_name text,
  email_verified_at timestamptz,
  organization_name text,
  organization_status text,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  session_expires_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.auth_sessions
  set last_seen_at = now()
  where token_hash = requested_token_hash
    and revoked_at is null
    and expires_at > now();

  return query
  select profile.id, session.organization_id, member.role, profile.email, profile.full_name, profile.email_verified_at,
         organization.name, organization.status, organization.trial_started_at, organization.trial_ends_at,
         session.expires_at
  from public.auth_sessions session
  join public.profiles profile on profile.id = session.profile_id and profile.status = 'active'
  join public.organization_members member on member.profile_id = session.profile_id and member.organization_id = session.organization_id and member.status = 'active'
  join public.organizations organization on organization.id = session.organization_id
  where session.token_hash = requested_token_hash
    and session.revoked_at is null
    and session.expires_at > now()
  limit 1;
end;
$$;

create or replace function app_private.upsert_google_account(
  requested_subject text,
  requested_email citext,
  requested_name text
)
returns table (profile_id uuid, organization_id uuid, member_role text, trial_started_at timestamptz, trial_ends_at timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  resolved_profile_id uuid;
  resolved_organization_id uuid;
  resolved_role text;
  resolved_trial_start timestamptz;
  resolved_trial_end timestamptz;
  default_organization_name text;
begin
  select identity.profile_id into resolved_profile_id
  from public.oauth_identities identity
  where identity.provider = 'google' and identity.provider_subject = requested_subject;

  if resolved_profile_id is null then
    select profile.id into resolved_profile_id from public.profiles profile where profile.email = requested_email;
  end if;

  if resolved_profile_id is null then
    resolved_profile_id := gen_random_uuid();
    resolved_organization_id := gen_random_uuid();
    resolved_trial_start := now();
    resolved_trial_end := resolved_trial_start + interval '15 days';
    default_organization_name := left(coalesce(nullif(trim(requested_name), ''), split_part(requested_email::text, '@', 1)) || '''s organization', 160);

    insert into public.organizations (id, name, legal_name, locale, status, trial_started_at, trial_ends_at)
    values (resolved_organization_id, default_organization_name, default_organization_name, 'en-GB', 'trial', resolved_trial_start, resolved_trial_end);
    insert into public.profiles (id, auth_subject, email, full_name, locale, email_verified_at, status)
    values (resolved_profile_id, 'google:' || requested_subject, requested_email, left(trim(requested_name), 160), 'en-GB', now(), 'active');
    insert into public.organization_members (organization_id, profile_id, role, status)
    values (resolved_organization_id, resolved_profile_id, 'owner', 'active');
    insert into public.billing_customers (organization_id, billing_email) values (resolved_organization_id, requested_email);
    insert into public.subscriptions (organization_id, plan_code, status, current_period_starts_at, current_period_ends_at)
    values (resolved_organization_id, 'operations', 'trial', resolved_trial_start, resolved_trial_end);
  else
    update public.profiles set email_verified_at = coalesce(email_verified_at, now()), updated_at = now() where id = resolved_profile_id;
    select member.organization_id, member.role, organization.trial_started_at, organization.trial_ends_at
    into resolved_organization_id, resolved_role, resolved_trial_start, resolved_trial_end
    from public.organization_members member
    join public.organizations organization on organization.id = member.organization_id
    where member.profile_id = resolved_profile_id and member.status = 'active'
    order by member.created_at limit 1;
  end if;

  insert into public.oauth_identities (provider, provider_subject, profile_id, email)
  values ('google', requested_subject, resolved_profile_id, requested_email)
  on conflict (provider, provider_subject) do update set email = excluded.email, updated_at = now();

  select member.role into resolved_role from public.organization_members member
  where member.organization_id = resolved_organization_id and member.profile_id = resolved_profile_id;

  return query select resolved_profile_id, resolved_organization_id, resolved_role, resolved_trial_start, resolved_trial_end;
end;
$$;

create or replace function app_private.consume_email_verification(requested_token_hash char(64))
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
    and kind = 'email_verification'
    and used_at is null
    and expires_at > now()
  returning profile_id into resolved_profile_id;

  if resolved_profile_id is null then return false; end if;
  update public.profiles set email_verified_at = coalesce(email_verified_at, now()), updated_at = now() where id = resolved_profile_id;
  return true;
end;
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
  update public.profiles set password_hash = requested_password_hash, updated_at = now() where id = resolved_profile_id;
  update public.auth_sessions set revoked_at = now() where profile_id = resolved_profile_id and revoked_at is null;
  return true;
end;
$$;

revoke all on function app_private.register_email_account(citext, text, text, text) from public;
revoke all on function app_private.account_by_email(citext) from public;
revoke all on function app_private.account_session_by_hash(char) from public;
revoke all on function app_private.upsert_google_account(text, citext, text) from public;
revoke all on function app_private.consume_email_verification(char) from public;
revoke all on function app_private.consume_password_reset(char, text) from public;

grant execute on function app_private.register_email_account(citext, text, text, text) to current_user;
grant execute on function app_private.account_by_email(citext) to current_user;
grant execute on function app_private.account_session_by_hash(char) to current_user;
grant execute on function app_private.upsert_google_account(text, citext, text) to current_user;
grant execute on function app_private.consume_email_verification(char) to current_user;
grant execute on function app_private.consume_password_reset(char, text) to current_user;
