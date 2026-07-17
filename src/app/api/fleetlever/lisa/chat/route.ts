import { requireFleetLeverApiSession } from "@/lib/auth/access";
import { getActiveTenantContext } from "@/lib/db/tenant-context";
import {
  lisaBridgeHeaders,
  lisaBridgeUrl,
  lisaEnabled,
  lisaRequestLimitBytes,
  noStoreJson,
  originMatches,
} from "@/lib/lisa/server";
import {
  enqueueLisaRelayJob,
  getLisaRelayConnectionStatus,
  lisaRelayEnabled,
  lisaRelayIsConfigured,
  streamLisaRelayJob,
} from "@/lib/lisa/relay";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = await requireFleetLeverApiSession({ activeAccess: true });
  if (authError) return authError;
  if (!originMatches(request)) return noStoreJson({ status: "forbidden", detail: "Origin does not match." }, 403);
  if (!lisaEnabled()) return noStoreJson({ status: "disabled", detail: "Lisa is disabled for this environment." }, 503);

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (contentLength > lisaRequestLimitBytes) return noStoreJson({ status: "invalid_request", detail: "Request is too large." }, 413);

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return noStoreJson({ status: "invalid_request", detail: "Request body could not be read." }, 400);
  }
  if (Buffer.byteLength(rawBody, "utf8") > lisaRequestLimitBytes) {
    return noStoreJson({ status: "invalid_request", detail: "Request is too large." }, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return noStoreJson({ status: "invalid_request", detail: "Invalid JSON body." }, 400);
  }
  const question = typeof (body as { question?: unknown })?.question === "string" ? (body as { question: string }).question.trim() : "";
  if (!question || question.length > 2000) {
    return noStoreJson({ status: "invalid_request", detail: "Question must be between 1 and 2,000 characters." }, 400);
  }

  if (lisaRelayEnabled()) {
    if (!lisaRelayIsConfigured()) {
      return noStoreJson({ status: "misconfigured", detail: "Lisa relay credentials are not configured." }, 503);
    }
    const relayStatus = await getLisaRelayConnectionStatus();
    if (relayStatus !== "connected") {
      return noStoreJson(
        {
          status: relayStatus,
          detail: relayStatus === "busy" ? "Lisa is answering another request." : "The local Lisa companion is not connected.",
        },
        relayStatus === "busy" ? 409 : 503,
      );
    }

    const tenantContext = await getActiveTenantContext();
    const requestBody = body as { context?: unknown };
    const jobId = await enqueueLisaRelayJob(tenantContext, { question, context: requestBody.context });
    return new Response(streamLisaRelayJob(tenantContext, jobId, request.signal), {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const headers = lisaBridgeHeaders();
  if (!headers) return noStoreJson({ status: "misconfigured", detail: "Lisa bridge credentials are not configured." }, 503);

  try {
    const upstream = await fetch(lisaBridgeUrl("v1/chat"), {
      body: rawBody,
      headers,
      method: "POST",
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(95_000)]),
    });
    if (!upstream.ok || !upstream.body) {
      const error = await upstream.json().catch(() => ({ status: upstream.status === 409 ? "busy" : "unavailable" }));
      return noStoreJson(error, upstream.status);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-transform",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return noStoreJson({ status: "unavailable", detail: "The local Lisa companion is not connected." }, 503);
  }
}
