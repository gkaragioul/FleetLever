import { appendLisaRelayEvent, lisaRelayIsConfigured, relayRequestAuthorized } from "@/lib/lisa/relay";
import { noStoreJson } from "@/lib/lisa/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  if (!lisaRelayIsConfigured()) return noStoreJson({ status: "disabled" }, 503);
  if (!relayRequestAuthorized(request)) return noStoreJson({ status: "unauthorized" }, 401);
  const { jobId } = await params;
  if (!uuidPattern.test(jobId)) return noStoreJson({ status: "invalid_request" }, 400);

  const body = await request.json().catch(() => null);
  const result = await appendLisaRelayEvent(jobId, body);
  return noStoreJson(result, result.accepted ? 200 : 400);
}
