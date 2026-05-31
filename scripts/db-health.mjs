import pg from "pg";
import nextEnv from "@next/env";

const { Pool } = pg;
const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const requiredTables = [
  "organizations",
  "profiles",
  "organization_members",
  "assets",
  "documents",
  "document_files",
  "issues",
  "maintenance_tasks",
  "operators",
  "compliance_templates",
  "imports",
  "import_rows",
  "reports",
  "audit_logs",
];

const demoOrganizationId = process.env.FLEETLEVER_DEMO_ORGANIZATION_ID ?? "00000000-0000-4000-8000-000000000001";
const demoProfileId = process.env.FLEETLEVER_DEMO_PROFILE_ID ?? "00000000-0000-4000-8000-000000000101";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

async function checkDemoTenant() {
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [demoOrganizationId]);
    await client.query("select set_config('app.current_profile_id', $1, true)", [demoProfileId]);
    const result = await client.query(
      `
        select 1
        from public.organization_members
        where organization_id = $1
          and profile_id = $2
          and status = 'active'
        limit 1
      `,
      [demoOrganizationId, demoProfileId],
    );
    await client.query("rollback");

    return result.rowCount === 1;
  } catch {
    await client.query("rollback").catch(() => {});
    return false;
  } finally {
    client.release();
  }
}

try {
  const [databaseResult, tableResult, migrationTableResult] = await Promise.all([
    pool.query(`
      select
        current_database() as database,
        current_user as user,
        version() as version,
        now() as checked_at
    `),
    pool.query(
      `
        select table_name, to_regclass('public.' || table_name) is not null as exists
        from unnest($1::text[]) as table_name
      `,
      [requiredTables],
    ),
    pool.query("select to_regclass('public.schema_migrations') is not null as exists"),
  ]);

  const missingTables = tableResult.rows.filter((row) => !row.exists).map((row) => row.table_name);
  const tenantActive = !missingTables.includes("organization_members") ? await checkDemoTenant() : false;
  const migrationsResult = migrationTableResult.rows[0]?.exists
    ? await pool.query("select json_agg(version order by version) as applied from public.schema_migrations")
    : { rows: [{ applied: [] }] };

  console.log(JSON.stringify({
    ok: missingTables.length === 0,
    database: databaseResult.rows[0],
    schema: {
      requiredTables: requiredTables.length,
      missingTables,
    },
    demoTenant: {
      organizationId: demoOrganizationId,
      profileId: demoProfileId,
      active: tenantActive,
    },
    migrations: {
      tableExists: Boolean(migrationTableResult.rows[0]?.exists),
      applied: migrationsResult.rows[0]?.applied ?? [],
    },
  }, null, 2));

  if (missingTables.length) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
