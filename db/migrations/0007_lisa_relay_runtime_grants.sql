do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    grant execute on function app_private.lisa_relay_heartbeat(text, text, text) to fleetlever_app;
    grant execute on function app_private.claim_lisa_relay_job(text) to fleetlever_app;
    grant execute on function app_private.append_lisa_relay_event(uuid, text, jsonb, boolean) to fleetlever_app;
    grant execute on function app_private.lisa_relay_job_status(uuid) to fleetlever_app;
    grant execute on function app_private.lisa_relay_last_heartbeat(text) to fleetlever_app;
  end if;
end;
$$;
