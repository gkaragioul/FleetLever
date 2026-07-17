import pg from "pg";
import { databaseSsl } from "./lib/database-connection.mjs";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;
const appRole = process.env.APP_DATABASE_ROLE ?? "fleetlever_app";
const appPassword = process.env.APP_DATABASE_PASSWORD;

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Use the Railway admin/public database URL.");
  process.exit(1);
}

if (!appPassword) {
  console.error("APP_DATABASE_PASSWORD is required.");
  process.exit(1);
}

if (!/^[a-z_][a-z0-9_]*$/i.test(appRole)) {
  console.error("APP_DATABASE_ROLE must contain only letters, numbers, and underscores.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseSsl(databaseUrl),
});

async function quote(client, value, fnName) {
  const result = await client.query(`select ${fnName}($1) as value`, [value]);
  return result.rows[0].value;
}

async function main() {
  const client = await pool.connect();

  try {
    const roleIdentifier = await quote(client, appRole, "quote_ident");
    const rolePassword = await quote(client, appPassword, "quote_literal");
    const databaseName = await client.query("select current_database() as name");
    const databaseIdentifier = await quote(client, databaseName.rows[0].name, "quote_ident");
    const exists = await client.query("select 1 from pg_roles where rolname = $1", [appRole]);

    if (exists.rowCount === 0) {
      await client.query(
        `create role ${roleIdentifier} login password ${rolePassword} nosuperuser nocreatedb nocreaterole noinherit`,
      );
    } else {
      await client.query(`alter role ${roleIdentifier} password ${rolePassword}`);
    }

    await client.query(`grant connect on database ${databaseIdentifier} to ${roleIdentifier}`);
    await client.query(`grant usage on schema public, app_private to ${roleIdentifier}`);
    await client.query(`grant select, insert, update, delete on all tables in schema public to ${roleIdentifier}`);
    await client.query(`grant usage, select, update on all sequences in schema public to ${roleIdentifier}`);
    await client.query(`grant execute on all functions in schema app_private to ${roleIdentifier}`);
    await client.query(`revoke update, delete on public.audit_logs from ${roleIdentifier}`);
    await client.query(`revoke all on public.auth_sessions from ${roleIdentifier}`);
    await client.query(`revoke all on public.auth_tokens from ${roleIdentifier}`);
    await client.query(`revoke all on public.oauth_identities from ${roleIdentifier}`);
    await client.query(`revoke all on app_private.account_credentials from ${roleIdentifier}`);
    await client.query(`revoke all on app_private.rate_limit_buckets from ${roleIdentifier}`);
    await client.query(
      `alter default privileges in schema public grant select, insert, update, delete on tables to ${roleIdentifier}`,
    );
    await client.query(
      `alter default privileges in schema public grant usage, select, update on sequences to ${roleIdentifier}`,
    );
    await client.query(`alter role ${roleIdentifier} set search_path = public, app_private`);

    console.log(`database role ready: ${appRole}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
