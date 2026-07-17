begin;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'fleetlever_app') then
    grant execute on function app_private.register_email_account(citext, text, text, text) to fleetlever_app;
    grant execute on function app_private.account_by_email(citext) to fleetlever_app;
    grant execute on function app_private.account_session_by_hash(char) to fleetlever_app;
    grant execute on function app_private.upsert_google_account(text, citext, text) to fleetlever_app;
    grant execute on function app_private.consume_email_verification(char) to fleetlever_app;
    grant execute on function app_private.consume_password_reset(char, text) to fleetlever_app;
  end if;
end;
$$;

commit;
