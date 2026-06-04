import pg from "pg";

const { Pool } = pg;

const knownDemoOrganizationId = "00000000-0000-4000-8000-000000000001";
const knownDemoProfileId = "00000000-0000-4000-8000-000000000101";

const databaseUrls = [
  process.env.MIGRATION_DATABASE_URL,
  process.env.DATABASE_PUBLIC_URL,
  process.env.DATABASE_URL,
].filter(Boolean);

const organizationName = process.env.FLEETLEVER_BOOTSTRAP_ORGANIZATION_NAME ?? "FleetLever Developer";
const legalName = process.env.FLEETLEVER_BOOTSTRAP_ORGANIZATION_LEGAL_NAME ?? organizationName;
const profileEmail = process.env.FLEETLEVER_BOOTSTRAP_PROFILE_EMAIL;
const profileName = process.env.FLEETLEVER_BOOTSTRAP_PROFILE_NAME ?? "FleetLever Developer";
const locationName = process.env.FLEETLEVER_BOOTSTRAP_LOCATION_NAME ?? "Main yard";
const purgeDemoTenant = process.env.FLEETLEVER_PURGE_DEMO_TENANT !== "false";

if (!databaseUrls.length) {
  console.error("MIGRATION_DATABASE_URL, DATABASE_PUBLIC_URL, or DATABASE_URL is required.");
  process.exit(1);
}

if (!profileEmail) {
  console.error("FLEETLEVER_BOOTSTRAP_PROFILE_EMAIL is required.");
  process.exit(1);
}

function createPool(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
  });
}

function connectionHost(databaseUrl) {
  try {
    return new URL(databaseUrl).hostname;
  } catch {
    return "unknown-host";
  }
}

async function connectWithFallback() {
  let lastError;

  for (const databaseUrl of [...new Set(databaseUrls)]) {
    const pool = createPool(databaseUrl);

    try {
      const client = await pool.connect();
      return { client, pool, databaseUrl };
    } catch (error) {
      await pool.end().catch(() => {});
      lastError = error;
      const hostname = connectionHost(databaseUrl);

      if (hostname.endsWith(".railway.internal")) {
        console.warn(`Could not reach ${hostname}; trying the next configured database URL.`);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

async function main() {
  const { client, pool, databaseUrl } = await connectWithFallback();

  try {
    await client.query("begin");
    await client.query("set local row_security = off");

    const organizationResult = await client.query(
      `
        insert into public.organizations (name, legal_name, timezone, currency, locale, status, settings)
        values ($1, $2, 'Europe/Athens', 'EUR', 'el-GR', 'active', '{"bootstrap":"developer"}'::jsonb)
        on conflict do nothing
        returning id
      `,
      [organizationName, legalName],
    );
    let organizationId = organizationResult.rows[0]?.id;

    if (!organizationId) {
      const existingOrganization = await client.query(
        "select id from public.organizations where name = $1 and status = 'active' order by created_at asc limit 1",
        [organizationName],
      );
      organizationId = existingOrganization.rows[0]?.id;
    }

    if (!organizationId) {
      throw new Error(`Unable to create or find organization ${organizationName}.`);
    }

    const profileResult = await client.query(
      `
        insert into public.profiles (auth_subject, email, full_name, locale, timezone, status)
        values ($1, $2, $3, 'el-GR', 'Europe/Athens', 'active')
        on conflict (email) do update
          set full_name = excluded.full_name,
              status = 'active',
              updated_at = now()
        returning id
      `,
      [`developer:${profileEmail}`, profileEmail, profileName],
    );
    const profileId = profileResult.rows[0]?.id;

    if (!profileId) {
      throw new Error(`Unable to create or find profile ${profileEmail}.`);
    }

    await client.query(
      `
        insert into public.organization_members (organization_id, profile_id, role, permissions, status)
        values ($1, $2, 'owner', '{"bootstrap":"developer"}'::jsonb, 'active')
        on conflict (organization_id, profile_id) do update
          set role = 'owner',
              status = 'active',
              updated_at = now()
      `,
      [organizationId, profileId],
    );

    await client.query(
      `
        insert into public.locations (organization_id, name, city, country, kind)
        values ($1, $2, 'Athens', 'GR', 'yard')
        on conflict (organization_id, name) do nothing
      `,
      [organizationId, locationName],
    );

    await client.query(
      `
        insert into public.billing_customers (organization_id, billing_mode, billing_email)
        values ($1, 'manual_invoice', $2)
        on conflict (organization_id) do update
          set billing_email = excluded.billing_email,
              updated_at = now()
      `,
      [organizationId, profileEmail],
    );

    await client.query(
      `
        insert into public.audit_logs (organization_id, actor_profile_id, action, record_table, record_id, metadata)
        values (
          $1,
          $2,
          'tenant.bootstrap',
          'organizations',
          $1,
          jsonb_build_object('source', 'railway_setup', 'organizationName', $3::text, 'databaseHost', $4::text)
        )
      `,
      [organizationId, profileId, organizationName, connectionHost(databaseUrl)],
    );

    let purgedDemoOrganization = false;
    let purgedDemoProfile = false;

    if (purgeDemoTenant && organizationId !== knownDemoOrganizationId) {
      const deletedOrganization = await client.query("delete from public.organizations where id = $1", [knownDemoOrganizationId]);
      purgedDemoOrganization = deletedOrganization.rowCount > 0;

      const deletedProfile = await client.query(
        `
          delete from public.profiles
          where id = $1
            and not exists (
              select 1 from public.organization_members where profile_id = $1
            )
        `,
        [knownDemoProfileId],
      );
      purgedDemoProfile = deletedProfile.rowCount > 0;
    }

    await client.query("commit");

    console.log(JSON.stringify({
      ok: true,
      databaseHost: connectionHost(databaseUrl),
      organization: {
        id: organizationId,
        name: organizationName,
      },
      profile: {
        id: profileId,
        email: profileEmail,
        name: profileName,
      },
      railwayVariables: {
        FLEETLEVER_DEFAULT_ORGANIZATION_ID: organizationId,
        FLEETLEVER_DEFAULT_PROFILE_ID: profileId,
      },
      purgedDemoTenant: {
        organization: purgedDemoOrganization,
        profile: purgedDemoProfile,
      },
    }, null, 2));
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
