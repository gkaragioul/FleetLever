import { getLisaRelayJobStatus, lisaRelayIsConfigured, relayRequestAuthorized } from "@/lib/lisa/relay";
import { noStoreJson } from "@/lib/lisa/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  if (!lisaRelayIsConfigured()) return noStoreJson({ status: "disabled" }, 503);
  if (!relayRequestAuthorized(request)) return noStoreJson({ status: "unauthorized" }, 401);
  const { jobId } = await params;
  if (!uuidPattern.test(jobId)) return noStoreJson({ status: "invalid_request" }, 400);

  const status = await getLisaRelayJobStatus(jobId);
  return status ? noStoreJson(status) : noStoreJson({ status: "not_found" }, 404);
}
