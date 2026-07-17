import {
  lisaRelayCompanionId,
  lisaRelayIsConfigured,
  recordLisaRelayHeartbeat,
  relayRequestAuthorized,
} from "@/lib/lisa/relay";
import { noStoreJson } from "@/lib/lisa/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!lisaRelayIsConfigured()) return noStoreJson({ status: "disabled" }, 503);
  if (!relayRequestAuthorized(request)) return noStoreJson({ status: "unauthorized" }, 401);

  const body = await request.json().catch(() => null) as { companionId?: unknown; status?: unknown; version?: unknown } | null;
  if (body?.companionId !== lisaRelayCompanionId()) return noStoreJson({ status: "forbidden" }, 403);

  await recordLisaRelayHeartbeat({
    companionId: body.companionId,
    status: typeof body.status === "string" ? body.status : "connected",
    version: typeof body.version === "string" ? body.version : "unknown",
  });
  return noStoreJson({ status: "connected" });
}
