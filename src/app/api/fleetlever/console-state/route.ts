import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  deleteConsoleSnapshotFromDatabase,
  readConsoleSnapshotFromDatabase,
  writeConsoleSnapshotToDatabase,
} from "@/lib/db/console-state";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";
import { buildProductionConsoleSnapshot } from "@/lib/console/production-console";
import { requireSuperAdminApiSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConsoleSnapshot = {
  organizationName?: string;
  schemaVersion: number;
  machines: unknown[];
  notifications: unknown[];
  releaseHistory: unknown[];
  updatedAt: string;
  worksites: unknown[];
};

const statePath = join(process.cwd(), ".fleetlever", "console-state.json");
const hasDatabase = Boolean(process.env.DATABASE_URL);
const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

function noStoreResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

function isConsoleSnapshot(value: unknown): value is ConsoleSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<ConsoleSnapshot>;

  return (
    typeof snapshot.schemaVersion === "number" &&
    typeof snapshot.updatedAt === "string" &&
    Array.isArray(snapshot.machines) &&
    Array.isArray(snapshot.notifications) &&
    Array.isArray(snapshot.releaseHistory) &&
    Array.isArray(snapshot.worksites)
  );
}

async function readFileConsoleSnapshot() {
  try {
    const content = await readFile(statePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    return isConsoleSnapshot(parsed) ? parsed : null;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeFileConsoleSnapshot(snapshot: ConsoleSnapshot) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(snapshot, null, 2), "utf8");
}

export async function GET() {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  if (!hasDatabase && isProductionDeployment) {
    return noStoreResponse(
      {
        error: "DATABASE_URL is required for FleetLever console state in production.",
      },
      { status: 503 },
    );
  }

  const rawSnapshot = hasDatabase ? await readConsoleSnapshotFromDatabase() : await readFileConsoleSnapshot();
  const snapshot = isConsoleSnapshot(rawSnapshot) ? rawSnapshot : null;

  if (!snapshot && hasDatabase) {
    let derivedSnapshot: ConsoleSnapshot;

    try {
      const data = await getFleetLeverData();
      derivedSnapshot = buildProductionConsoleSnapshot(data);
    } catch (error) {
      return noStoreResponse(
        {
          error: "FleetLever production tenant is not configured.",
          detail: error instanceof Error ? error.message : "Unable to load tenant data.",
        },
        { status: 503 },
      );
    }

    return noStoreResponse({
      dataSource: "database-derived",
      production: isProductionDeployment,
      snapshot: derivedSnapshot,
    });
  }

  return noStoreResponse({
    dataSource: snapshot ? (hasDatabase ? "database" : "server-file") : "empty",
    production: isProductionDeployment,
    snapshot,
  });
}

export async function PUT(request: Request) {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  if (!hasDatabase && isProductionDeployment) {
    return noStoreResponse(
      {
        error: "DATABASE_URL is required for FleetLever console state in production.",
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noStoreResponse({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isConsoleSnapshot(body)) {
    return noStoreResponse({ error: "Invalid FleetLever console snapshot." }, { status: 400 });
  }

  const snapshot = {
    ...body,
    updatedAt: new Date().toISOString(),
  };

  if (hasDatabase) {
    await writeConsoleSnapshotToDatabase(snapshot);
  } else {
    await writeFileConsoleSnapshot(snapshot);
  }

  return noStoreResponse({
    dataSource: hasDatabase ? "database" : "server-file",
    ok: true,
  });
}

export async function DELETE() {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  if (!hasDatabase && isProductionDeployment) {
    return noStoreResponse(
      {
        error: "DATABASE_URL is required for FleetLever console state in production.",
      },
      { status: 503 },
    );
  }

  if (hasDatabase) {
    await deleteConsoleSnapshotFromDatabase();
  } else {
    await rm(statePath, { force: true });
  }

  return new Response(null, {
    headers: {
      "Cache-Control": "no-store",
    },
    status: 204,
  });
}
