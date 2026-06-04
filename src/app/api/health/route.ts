import { NextResponse } from "next/server";
import { getDbPool, withTenant } from "@/lib/db/client";
import { objectStorageHealth } from "@/lib/storage/object-storage";

export const dynamic = "force-dynamic";

const REQUIRED_TABLES = [
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

const DEMO_ORGANIZATION_ID = process.env.FLEETLEVER_DEMO_ORGANIZATION_ID ?? "00000000-0000-4000-8000-000000000001";
const DEMO_PROFILE_ID = process.env.FLEETLEVER_DEMO_PROFILE_ID ?? "00000000-0000-4000-8000-000000000101";
const KNOWN_DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const KNOWN_DEMO_PROFILE_ID = "00000000-0000-4000-8000-000000000101";
const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

function healthTenant() {
  const organizationId = process.env.FLEETLEVER_DEFAULT_ORGANIZATION_ID;
  const profileId = process.env.FLEETLEVER_DEFAULT_PROFILE_ID;

  if (organizationId && profileId) {
    return {
      kind: organizationId === KNOWN_DEMO_ORGANIZATION_ID || profileId === KNOWN_DEMO_PROFILE_ID ? "demo-configured" : "configured",
      organizationId,
      profileId,
    };
  }

  return {
    kind: "demo",
    organizationId: DEMO_ORGANIZATION_ID,
    profileId: DEMO_PROFILE_ID,
  };
}

export async function GET() {
  const storage = objectStorageHealth();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        service: "fleetlever",
        storage,
        database: {
          configured: false,
          reachable: false,
        },
        schema: {
          tablesReady: false,
          missingTables: REQUIRED_TABLES,
        },
      },
      { status: 503 },
    );
  }

  try {
    const pool = getDbPool();
    const [dbResult, tableResult, migrationTableResult] = await Promise.all([
      pool.query<{ database_name: string; database_user: string; checked_at: string }>(
        "select current_database() as database_name, current_user as database_user, now()::text as checked_at",
      ),
      pool.query<{ table_name: string; exists: boolean }>(
        `
          select table_name, to_regclass('public.' || table_name) is not null as exists
          from unnest($1::text[]) as table_name
        `,
        [REQUIRED_TABLES],
      ),
      pool.query<{ exists: boolean }>("select to_regclass('public.schema_migrations') is not null as exists"),
    ]);

    const missingTables = tableResult.rows.filter((row) => !row.exists).map((row) => row.table_name);
    const database = dbResult.rows[0];
    const tenant = healthTenant();
    const tenantResult = !missingTables.includes("organization_members")
      ? await withTenant({ organizationId: tenant.organizationId, profileId: tenant.profileId }, async () => ({ active: true }))
          .catch(() => ({ active: false }))
      : { active: false };
    const migrationsResult = migrationTableResult.rows[0]?.exists
      ? await pool.query<{ applied: string[] | null }>(
          "select json_agg(version order by version) as applied from public.schema_migrations",
        )
      : { rows: [{ applied: [] }] };

    const tenantProductionReady = !isProductionDeployment || tenant.kind === "configured";
    const ok = missingTables.length === 0 && (!storage.required || storage.configured) && tenantProductionReady && tenantResult.active;

    return NextResponse.json({
      ok,
      service: "fleetlever",
      storage,
      database: {
        configured: true,
        reachable: true,
        name: database?.database_name,
        user: database?.database_user,
        checkedAt: database?.checked_at,
      },
      schema: {
        tablesReady: missingTables.length === 0,
        requiredTables: REQUIRED_TABLES.length,
        missingTables,
      },
      tenant: {
        kind: tenant.kind,
        organizationId: tenant.organizationId,
        profileId: tenant.profileId,
        active: tenantResult.active,
        productionReady: tenantProductionReady,
      },
      migrations: {
        tableExists: Boolean(migrationTableResult.rows[0]?.exists),
        applied: migrationsResult.rows[0]?.applied ?? [],
      },
    }, { status: ok ? 200 : 503 });
  } catch (error) {
    console.error("FleetLever health check failed", error);

    return NextResponse.json(
      {
        ok: false,
        service: "fleetlever",
        storage,
        database: {
          configured: true,
          reachable: false,
        },
        schema: {
          tablesReady: false,
        },
        error: "database_check_failed",
      },
      { status: 503 },
    );
  }
}
