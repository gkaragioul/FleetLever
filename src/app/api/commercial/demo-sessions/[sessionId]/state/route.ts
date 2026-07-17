import {
  readDemoSession,
  writeDemoSessionSnapshot,
} from "@/lib/commercial/demo-session-store";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maximumSnapshotBytes = 2_000_000;

function response(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function lookupError(status: "expired" | "missing") {
  return response(
    {
      ok: false,
      expired: status === "expired",
      error: status === "expired" ? "This demo workspace has expired." : "Demo workspace not found.",
    },
    status === "expired" ? 410 : 404,
  );
}

function isConsoleSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return (
    snapshot.schemaVersion === 4 &&
    Array.isArray(snapshot.machines) &&
    Array.isArray(snapshot.worksites) &&
    Array.isArray(snapshot.releaseHistory) &&
    Array.isArray(snapshot.notifications)
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const result = await readDemoSession(sessionId);
  if (result.status !== "active") return lookupError(result.status);

  return response({
    dataSource: "demo-session",
    production: false,
    expiresAt: result.session.expiresAt,
    snapshot: result.session.snapshot,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!originMatches(request)) return originErrorResponse();
  const { sessionId } = await params;
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > maximumSnapshotBytes) {
    return response({ ok: false, error: "Demo workspace state is too large." }, 413);
  }

  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maximumSnapshotBytes) {
    return response({ ok: false, error: "Demo workspace state is too large." }, 413);
  }

  let snapshot: unknown;
  try {
    snapshot = JSON.parse(text);
  } catch {
    return response({ ok: false, error: "Invalid demo workspace state." }, 400);
  }

  if (!isConsoleSnapshot(snapshot)) {
    return response({ ok: false, error: "Invalid FleetLever demo snapshot." }, 400);
  }

  const result = await writeDemoSessionSnapshot(sessionId, snapshot);
  if (result.status !== "active") return lookupError(result.status);

  return response({
    ok: true,
    expiresAt: result.session.expiresAt,
    updatedAt: result.session.updatedAt,
  });
}
