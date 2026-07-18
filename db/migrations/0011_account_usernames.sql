begin;

alter table public.profiles
  add column if not exists username citext;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (username)
  where username is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_format_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_username_format_check
      check (username is null or username::text ~ '^[a-z0-9][a-z0-9._-]{2,31}$') not valid;
  end if;
end;
$$;

alter table public.profiles
  validate constraint profiles_username_format_check;

create or replace function app_private.account_by_identifier(requested_identifier text)
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
  where profile.status = 'active'
    and case
      when position('@' in trim(requested_identifier)) > 0
        then profile.email = lower(trim(requested_identifier))::citext
      else profile.username = lower(trim(requested_identifier))::citext
    end
  order by member.created_at
  limit 1;
$$;

revoke all on function app_private.account_by_identifier(text) from public;
grant execute on function app_private.account_by_identifier(text) to current_user;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    grant execute on function app_private.account_by_identifier(text) to fleetlever_app;
  end if;
end;
$$;

commit;
