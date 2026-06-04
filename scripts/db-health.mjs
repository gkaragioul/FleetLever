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
  "console_snapshots",
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
const knownDemoOrganizationId = "00000000-0000-4000-8000-000000000001";
const knownDemoProfileId = "00000000-0000-4000-8000-000000000101";
const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
const tenantOrganizationId = process.env.FLEETLEVER_DEFAULT_ORGANIZATION_ID ?? demoOrganizationId;
const tenantProfileId = process.env.FLEETLEVER_DEFAULT_PROFILE_ID ?? demoProfileId;
const tenantKind = process.env.FLEETLEVER_DEFAULT_ORGANIZATION_ID && process.env.FLEETLEVER_DEFAULT_PROFILE_ID
  ? tenantOrganizationId === knownDemoOrganizationId || tenantProfileId === knownDemoProfileId ? "demo-configured" : "configured"
  : "demo";
const bucketName = process.env.FLEETLEVER_BUCKET_NAME ?? process.env.RAILWAY_BUCKET_NAME ?? process.env.AWS_S3_BUCKET ?? process.env.S3_BUCKET_NAME;
const bucketEndpoint = process.env.AWS_ENDPOINT_URL ?? process.env.S3_ENDPOINT ?? process.env.RAILWAY_BUCKET_ENDPOINT;
const bucketConfigured = Boolean(
  bucketName &&
    (process.env.AWS_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY_ID) &&
    (process.env.AWS_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_ACCESS_KEY) &&
    (!isProductionDeployment || bucketEndpoint),
);

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});

async function checkTenant() {
  const client = await pool.connect();

  try {
    await client.query("begin");
    await client.query("select set_config('app.current_organization_id', $1, true)", [tenantOrganizationId]);
    await client.query("select set_config('app.current_profile_id', $1, true)", [tenantProfileId]);
    const result = await client.query(
      `
        select 1
        from public.organization_members
        where organization_id = $1
          and profile_id = $2
          and status = 'active'
        limit 1
      `,
      [tenantOrganizationId, tenantProfileId],
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
  const tenantActive = !missingTables.includes("organization_members") ? await checkTenant() : false;
  const migrationsResult = migrationTableResult.rows[0]?.exists
    ? await pool.query("select json_agg(version order by version) as applied from public.schema_migrations")
    : { rows: [{ applied: [] }] };

  console.log(JSON.stringify({
    ok: missingTables.length === 0 && (!isProductionDeployment || tenantKind === "configured") && tenantActive && (!isProductionDeployment || bucketConfigured),
    database: databaseResult.rows[0],
    schema: {
      requiredTables: requiredTables.length,
      missingTables,
    },
    tenant: {
      kind: tenantKind,
      organizationId: tenantOrganizationId,
      profileId: tenantProfileId,
      active: tenantActive,
      productionReady: !isProductionDeployment || tenantKind === "configured",
    },
    storage: {
      configured: bucketConfigured,
      required: isProductionDeployment,
      provider: bucketConfigured ? "railway-bucket" : isProductionDeployment ? null : "local-file",
      bucket: bucketName ?? null,
      endpointConfigured: Boolean(bucketEndpoint),
    },
    migrations: {
      tableExists: Boolean(migrationTableResult.rows[0]?.exists),
      applied: migrationsResult.rows[0]?.applied ?? [],
    },
  }, null, 2));

  if (missingTables.length || (isProductionDeployment && (!bucketConfigured || tenantKind !== "configured" || !tenantActive))) {
    process.exitCode = 1;
  }
} finally {
  await pool.end();
}
