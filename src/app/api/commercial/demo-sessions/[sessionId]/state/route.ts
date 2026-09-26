import {
  readDemoSession,
  writeDemoSessionSnapshot,
} from "@/lib/commercial/demo-session-store";
import { rateLimitedResponse, takeRateLimit } from "@/lib/auth/rate-limit";
import { clientRateLimitKey } from "@/lib/security/client-ip.mjs";
import { BodyTooLargeError, readBodyText } from "@/lib/security/request-body.mjs";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const maximumSnapshotBytes = 2_000_000;
const readsPerClientPerMinute = 240;
const writesPerClientPerMinute = 120;

async function allowed(request: Request, action: "read" | "write") {
  const limit = action === "read" ? readsPerClientPerMinute : writesPerClientPerMinute;
  return takeRateLimit(`demo-session-${action}:${clientRateLimitKey(request.headers)}`, limit, 60_000);
}

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
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!(await allowed(request, "read"))) return rateLimitedResponse(60);
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
  if (!(await allowed(request, "write"))) return rateLimitedResponse(60);
  const { sessionId } = await params;

  let text: string;
  try {
    // Counted while streaming, so an oversized body is dropped before it is held in memory.
    text = await readBodyText(request, maximumSnapshotBytes);
  } catch (error) {
    if (error instanceof BodyTooLargeError) {
      return response({ ok: false, error: "Demo workspace state is too large." }, 413);
    }
    return response({ ok: false, error: "Invalid demo workspace state." }, 400);
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
