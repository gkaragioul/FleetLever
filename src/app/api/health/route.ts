import { NextResponse } from "next/server";
import { getDbPool, withTenant } from "@/lib/db/client";
import { objectStorageHealth } from "@/lib/storage/object-storage";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

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
  "schema_migrations",
];

const DEMO_ORGANIZATION_ID = process.env.FLEETLEVER_DEMO_ORGANIZATION_ID ?? "00000000-0000-4000-8000-000000000001";
const DEMO_PROFILE_ID = process.env.FLEETLEVER_DEMO_PROFILE_ID ?? "00000000-0000-4000-8000-000000000101";
const KNOWN_DEMO_ORGANIZATION_ID = "00000000-0000-4000-8000-000000000001";
const KNOWN_DEMO_PROFILE_ID = "00000000-0000-4000-8000-000000000101";
const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

type HealthStatus = "ok" | "failed" | "unknown";

function healthResponse(input: {
  ok: boolean;
  service: string;
  edition: ReturnType<typeof getFleetLeverEdition>;
  checks: Record<string, HealthStatus>;
  status?: number;
}) {
  return NextResponse.json(
    {
      ok: input.ok,
      service: input.service,
      edition: input.edition,
      checks: input.checks,
      ...(input.ok ? {} : { error: "service_unavailable" }),
    },
    {
      status: input.status ?? (input.ok ? 200 : 503),
      headers: { "Cache-Control": "no-store" },
    },
  );
}

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
  const edition = getFleetLeverEdition();

  if (edition === "site") {
    return healthResponse({
      ok: true,
      service: "fleetlever-site",
      edition,
      checks: { runtime: "ok" },
    });
  }

  const storage = objectStorageHealth();

  if (!process.env.DATABASE_URL) {
    return healthResponse({
      ok: false,
      service: "fleetlever",
      edition,
      checks: {
        database: "failed",
        schema: "unknown",
        storage: storage.required && !storage.configured ? "failed" : "ok",
        tenant: "unknown",
      },
    });
  }

  try {
    const pool = getDbPool();
    const [tableResult] = await Promise.all([
      pool.query<{ table_name: string; exists: boolean }>(
        `
          select table_name, to_regclass('public.' || table_name) is not null as exists
          from unnest($1::text[]) as table_name
        `,
        [REQUIRED_TABLES],
      ),
    ]);

    const missingTables = tableResult.rows.filter((row) => !row.exists).map((row) => row.table_name);
    const tenant = healthTenant();
    const tenantResult = !missingTables.includes("organization_members")
      ? await withTenant({ organizationId: tenant.organizationId, profileId: tenant.profileId }, async () => ({ active: true }))
          .catch(() => ({ active: false }))
      : { active: false };

    const tenantProductionReady = !isProductionDeployment || tenant.kind === "configured";
    const ok = missingTables.length === 0 && (!storage.required || storage.configured) && tenantProductionReady && tenantResult.active;

    return healthResponse({
      ok,
      service: "fleetlever",
      edition,
      checks: {
        database: "ok",
        schema: missingTables.length === 0 ? "ok" : "failed",
        storage: !storage.required || storage.configured ? "ok" : "failed",
        tenant: tenantProductionReady && tenantResult.active ? "ok" : "failed",
      },
    });
  } catch (error) {
    console.error("FleetLever health check failed", error);

    return healthResponse({
      ok: false,
      service: "fleetlever",
      edition,
      checks: {
        database: "failed",
        schema: "unknown",
        storage: storage.required && !storage.configured ? "failed" : "ok",
        tenant: "unknown",
      },
    });
  }
}
