-- A Google sign-in proves control of an email address. Until now a Google sign-in whose email
-- matched an existing profile was linked to that profile even if nobody had ever verified the
-- address. Anyone could register someone else's email with their own password, wait for the real
-- owner to sign in with Google, and keep a working password on the owner's account afterwards
-- (pre-account hijacking).
--
-- Linking by email now depends on whether the address was ever proven:
-- * a profile with a verified email is linked exactly as before;
-- * a profile whose email was never verified is taken over by the Google identity: its password
--   credential is removed and its sessions are revoked before the link, so whoever registered the
--   address without proving it loses all access. The real owner keeps the workspace and can set a
--   password again through "Forgot password".
--
-- A completed password reset also proves control of the address, because the link was delivered to
-- it, so it now marks the email as verified. A user who reset their password therefore keeps it the
-- first time they sign in with Google.

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
  existing_email_verified_at timestamptz;
begin
  select identity.profile_id into resolved_profile_id
  from public.oauth_identities identity
  where identity.provider = 'google' and identity.provider_subject = requested_subject;

  if resolved_profile_id is null then
    select profile.id, profile.email_verified_at
    into resolved_profile_id, existing_email_verified_at
    from public.profiles profile
    where profile.email = requested_email;

    if resolved_profile_id is not null and existing_email_verified_at is null then
      -- Nobody proved this address before Google did. Remove everything the unproven registrant
      -- could still use to get in, then hand the profile to the verified owner.
      delete from app_private.account_credentials credential
      where credential.profile_id = resolved_profile_id;

      update public.auth_sessions session
      set revoked_at = now()
      where session.profile_id = resolved_profile_id
        and session.revoked_at is null;
    end if;
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

  -- The reset link reached this address, so its owner has now proven control of it.
  update public.profiles
  set email_verified_at = coalesce(email_verified_at, now()),
      updated_at = now()
  where id = resolved_profile_id;

  return true;
end;
$$;

revoke all on function app_private.upsert_google_account(text, citext, text) from public;
revoke all on function app_private.consume_password_reset(char, text) from public;
grant execute on function app_private.upsert_google_account(text, citext, text) to current_user;
grant execute on function app_private.consume_password_reset(char, text) to current_user;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    grant execute on function app_private.upsert_google_account(text, citext, text) to fleetlever_app;
    grant execute on function app_private.consume_password_reset(char, text) to fleetlever_app;
  end if;
end;
$$;
