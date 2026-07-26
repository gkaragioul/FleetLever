import pg from "pg";
import { createPasswordHash } from "../src/lib/auth/account-core.mjs";
import { databaseSsl } from "./lib/database-connection.mjs";

const { Pool } = pg;

const username = String(process.env.FLEETLEVER_TEST_ACCOUNT_USERNAME ?? "").trim().toLowerCase();
const password = String(process.env.FLEETLEVER_TEST_ACCOUNT_PASSWORD ?? "");
const email = String(process.env.FLEETLEVER_TEST_ACCOUNT_EMAIL ?? `${username}@fleetlever.test`).trim().toLowerCase();
const fullName = String(process.env.FLEETLEVER_TEST_ACCOUNT_NAME ?? "FleetLever Test Admin").trim();
const requestedOrganizationId = process.env.FLEETLEVER_TEST_ACCOUNT_ORGANIZATION_ID ?? process.env.FLEETLEVER_DEFAULT_ORGANIZATION_ID;
const isHosted = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL);

if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
  console.error("FLEETLEVER_TEST_ACCOUNT_USERNAME must contain 3-32 lowercase letters, numbers, dots, underscores, or hyphens.");
  process.exit(1);
}
if (!password) {
  console.error("FLEETLEVER_TEST_ACCOUNT_PASSWORD is required.");
  process.exit(1);
}
if (password.length < 12 && process.env.FLEETLEVER_ALLOW_WEAK_TEST_ACCOUNT !== "true") {
  console.error("Refusing a weak test password without FLEETLEVER_ALLOW_WEAK_TEST_ACCOUNT=true.");
  process.exit(1);
}
if (isHosted && process.env.FLEETLEVER_ALLOW_PRODUCTION_TEST_ACCOUNT !== "true") {
  console.error("Refusing to modify a hosted account without FLEETLEVER_ALLOW_PRODUCTION_TEST_ACCOUNT=true.");
  process.exit(1);
}

const databaseUrls = [
  process.env.MIGRATION_DATABASE_URL,
  process.env.DATABASE_PUBLIC_URL,
  process.env.DATABASE_URL,
].filter(Boolean);

if (!databaseUrls.length) {
  console.error("MIGRATION_DATABASE_URL, DATABASE_PUBLIC_URL, or DATABASE_URL is required.");
  process.exit(1);
}

function createPool(databaseUrl) {
  return new Pool({ connectionString: databaseUrl, ssl: databaseSsl(databaseUrl) });
}

async function connectWithFallback() {
  let lastError;
  for (const databaseUrl of [...new Set(databaseUrls)]) {
    const pool = createPool(databaseUrl);
    try {
      const client = await pool.connect();
      return { client, pool };
    } catch (error) {
      await pool.end().catch(() => {});
      lastError = error;
    }
  }
  throw lastError;
}

async function resolveOrganization(client) {
  if (requestedOrganizationId) {
    const result = await client.query(
      "select id, name from public.organizations where id = $1::uuid and status in ('active', 'trial')",
      [requestedOrganizationId],
    );
    if (result.rows[0]) return result.rows[0];
    throw new Error("The requested FleetLever organization is not active or does not exist.");
  }

  const result = await client.query(`
    select organization.id, organization.name
    from public.organizations organization
    left join public.assets asset on asset.organization_id = organization.id and asset.archived_at is null
    where organization.status in ('active', 'trial')
    group by organization.id, organization.name, organization.created_at
    order by count(asset.id) desc, organization.created_at asc
    limit 1
  `);
  if (result.rows[0]) return result.rows[0];
  throw new Error("No active FleetLever organization is available for the test account.");
}

async function main() {
  const { client, pool } = await connectWithFallback();
  try {
    await client.query("begin");
    await client.query("set local row_security = off");
    const organization = await resolveOrganization(client);
    const existing = await client.query(
      "select id from public.profiles where username = $1::citext or email = $2::citext order by (username = $1::citext) desc",
      [username, email],
    );
    const profileIds = [...new Set(existing.rows.map((row) => row.id))];
    if (profileIds.length > 1) throw new Error("The requested username and email belong to different profiles.");

    let profileId = profileIds[0];
    if (profileId) {
      const updated = await client.query(
        `update public.profiles
         set username = $1::citext, email = $2::citext, full_name = $3, status = 'active',
             email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
         where id = $4::uuid
         returning id`,
        [username, email, fullName, profileId],
      );
      profileId = updated.rows[0].id;
    } else {
      const inserted = await client.query(
        `insert into public.profiles (auth_subject, username, email, full_name, locale, timezone, status, email_verified_at)
         values ($1, $2::citext, $3::citext, $4, 'en-GB', 'Europe/London', 'active', now())
         returning id`,
        [`test:${username}`, username, email, fullName],
      );
      profileId = inserted.rows[0].id;
    }

    await client.query(
      `insert into app_private.account_credentials (profile_id, password_hash)
       values ($1::uuid, $2)
       on conflict (profile_id) do update
       set password_hash = excluded.password_hash, updated_at = now()`,
      [profileId, createPasswordHash(password)],
    );
    await client.query(
      `insert into public.organization_members (organization_id, profile_id, role, permissions, status)
       values ($1::uuid, $2::uuid, 'owner', '{"testAccount":true}'::jsonb, 'active')
       on conflict (organization_id, profile_id) do update
       set role = 'owner', permissions = excluded.permissions, status = 'active', updated_at = now()`,
      [organization.id, profileId],
    );
    await client.query("update public.auth_sessions set revoked_at = now() where profile_id = $1::uuid and revoked_at is null", [profileId]);
    await client.query(
      `insert into public.audit_logs (organization_id, actor_profile_id, action, record_table, record_id, metadata)
       values ($1::uuid, $2::uuid, 'account.test_upserted', 'profiles', $2::uuid,
               jsonb_build_object('username', $3::text, 'source', 'operator_script'))`,
      [organization.id, profileId, username],
    );
    await client.query("commit");
    console.log(JSON.stringify({ ok: true, username, email, profileId, organization }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
