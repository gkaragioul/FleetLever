import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  deleteConsoleSnapshotFromDatabase,
  readConsoleSnapshotFromDatabase,
  writeConsoleSnapshotToDatabase,
} from "@/lib/db/console-state";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";
import { buildProductionConsoleSnapshot } from "@/lib/console/production-console";
import { requireFleetLeverApiSession } from "@/lib/auth/access";
import {
  assertConsoleSnapshotTextSize,
  normalizeConsoleSnapshotPayload,
  SnapshotValidationError,
} from "@/lib/fleetlever/console-snapshot-core.mjs";
import { originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const statePath = join(process.cwd(), ".fleetlever", "console-state.json");
const hasDatabase = Boolean(process.env.DATABASE_URL);
const isProductionDeployment = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
type NormalizedConsoleSnapshot = ReturnType<typeof normalizeConsoleSnapshotPayload>;

function noStoreResponse(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

async function readFileConsoleSnapshot() {
  try {
    const content = await readFile(statePath, "utf8");
    assertConsoleSnapshotTextSize(content);
    return JSON.parse(content) as unknown;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function writeFileConsoleSnapshot(snapshot: NormalizedConsoleSnapshot) {
  await mkdir(dirname(statePath), { recursive: true });
  await writeFile(statePath, JSON.stringify(snapshot, null, 2), "utf8");
}

export async function GET() {
  const authError = await requireFleetLeverApiSession({ activeAccess: true });
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
  let snapshot: NormalizedConsoleSnapshot | null = null;

  if (rawSnapshot) {
    try {
      snapshot = normalizeConsoleSnapshotPayload(rawSnapshot);
    } catch (error) {
      return noStoreResponse(
        {
          error: "The stored FleetLever console state is invalid.",
          detail: error instanceof SnapshotValidationError ? error.message : "Unable to normalize tenant state.",
        },
        { status: 503 },
      );
    }
  }

  if (!snapshot && hasDatabase) {
    let derivedSnapshot: NormalizedConsoleSnapshot;

    try {
      const data = await getFleetLeverData();
      derivedSnapshot = normalizeConsoleSnapshotPayload(buildProductionConsoleSnapshot(data));
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
  if (!originMatches(request)) return noStoreResponse({ error: "Origin does not match." }, { status: 403 });
  const authError = await requireFleetLeverApiSession({ activeAccess: true });
  if (authError) return authError;

  if (!hasDatabase && isProductionDeployment) {
    return noStoreResponse(
      {
        error: "DATABASE_URL is required for FleetLever console state in production.",
      },
      { status: 503 },
    );
  }

  let text: string;
  let body: unknown;

  try {
    text = await request.text();
    assertConsoleSnapshotTextSize(text);
    body = JSON.parse(text) as unknown;
  } catch (error) {
    if (error instanceof SnapshotValidationError) {
      return noStoreResponse({ error: error.message }, { status: 413 });
    }
    return noStoreResponse({ error: "Invalid JSON body." }, { status: 400 });
  }

  let snapshot: NormalizedConsoleSnapshot;
  try {
    snapshot = normalizeConsoleSnapshotPayload(body);
    snapshot.updatedAt = new Date().toISOString();
  } catch (error) {
    return noStoreResponse(
      { error: error instanceof SnapshotValidationError ? error.message : "Invalid FleetLever console snapshot." },
      { status: 400 },
    );
  }

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

export async function DELETE(request: Request) {
  if (!originMatches(request)) return noStoreResponse({ error: "Origin does not match." }, { status: 403 });
  const authError = await requireFleetLeverApiSession({ activeAccess: true });
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
