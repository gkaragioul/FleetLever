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
  const hasOrganizationMembers = !missingTables.includes("organization_members");
  const tenantResult = hasOrganizationMembers
      ? await pool.query(`
        select count(*)::int as active_members
        from public.organization_members
        where organization_id = $1
          and profile_id = $2
          and status = 'active'
      `, [demoOrganizationId, demoProfileId])
    : { rows: [{ active_members: 0 }] };
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
      activeMembers: tenantResult.rows[0]?.active_members ?? 0,
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
