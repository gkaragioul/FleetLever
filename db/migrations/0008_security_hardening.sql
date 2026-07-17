drop policy if exists audit_logs_tenant_update on public.audit_logs;
drop policy if exists audit_logs_tenant_delete on public.audit_logs;

create or replace function app_private.create_auth_session(
  requested_token_hash char(64),
  requested_profile_id uuid,
  requested_organization_id uuid,
  requested_expires_at timestamptz,
  requested_ip_address text,
  requested_user_agent text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.profiles profile
    join public.organization_members member
      on member.profile_id = profile.id
     and member.organization_id = requested_organization_id
     and member.status = 'active'
    where profile.id = requested_profile_id
      and profile.status = 'active'
  ) then
    raise exception 'Active organization membership is required.' using errcode = '42501';
  end if;

  insert into public.auth_sessions (
    token_hash,
    profile_id,
    organization_id,
    expires_at,
    ip_address,
    user_agent
  )
  values (
    requested_token_hash,
    requested_profile_id,
    requested_organization_id,
    requested_expires_at,
    nullif(requested_ip_address, '')::inet,
    left(coalesce(requested_user_agent, ''), 500)
  );
end;
$$;

create or replace function app_private.revoke_auth_session(requested_token_hash char(64))
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.auth_sessions
  set revoked_at = coalesce(revoked_at, now())
  where token_hash = requested_token_hash;
$$;

create or replace function app_private.issue_auth_token(
  requested_token_hash char(64),
  requested_profile_id uuid,
  requested_kind text,
  requested_duration_minutes integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if requested_kind not in ('email_verification', 'password_reset') then
    raise exception 'Unsupported account token kind.' using errcode = '22023';
  end if;
  if requested_duration_minutes < 1 or requested_duration_minutes > 1440 then
    raise exception 'Account token duration is out of range.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.profiles where id = requested_profile_id and status = 'active') then
    raise exception 'Active profile is required.' using errcode = '42501';
  end if;

  insert into public.auth_tokens (token_hash, profile_id, kind, expires_at)
  values (
    requested_token_hash,
    requested_profile_id,
    requested_kind,
    now() + (requested_duration_minutes * interval '1 minute')
  );
end;
$$;

revoke all on function app_private.create_auth_session(char, uuid, uuid, timestamptz, text, text) from public;
revoke all on function app_private.revoke_auth_session(char) from public;
revoke all on function app_private.issue_auth_token(char, uuid, text, integer) from public;

grant execute on function app_private.create_auth_session(char, uuid, uuid, timestamptz, text, text) to current_user;
grant execute on function app_private.revoke_auth_session(char) to current_user;
grant execute on function app_private.issue_auth_token(char, uuid, text, integer) to current_user;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    revoke update, delete on public.audit_logs from fleetlever_app;
    revoke all on public.auth_sessions from fleetlever_app;
    revoke all on public.auth_tokens from fleetlever_app;
    revoke all on public.oauth_identities from fleetlever_app;

    grant execute on function app_private.create_auth_session(char, uuid, uuid, timestamptz, text, text) to fleetlever_app;
    grant execute on function app_private.revoke_auth_session(char) to fleetlever_app;
    grant execute on function app_private.issue_auth_token(char, uuid, text, integer) to fleetlever_app;
  end if;
end;
$$;
