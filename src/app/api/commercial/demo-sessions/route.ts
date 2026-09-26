import { createDemoSession } from "@/lib/commercial/demo-session-store";
import { rateLimitedResponse, takeRateLimit } from "@/lib/auth/rate-limit";
import { clientRateLimitKey } from "@/lib/security/client-ip.mjs";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Each session can hold up to 2 MB, so creation is budgeted per client on top of the store's
// global cap (FLEETLEVER_DEMO_SESSION_MAX).
const sessionsPerClientPerHour = 10;

export async function POST(request: Request) {
  if (!originMatches(request)) return originErrorResponse();
  if (!(await takeRateLimit(`demo-session:${clientRateLimitKey(request.headers)}`, sessionsPerClientPerHour, 60 * 60_000))) {
    return rateLimitedResponse(3600);
  }

  const session = await createDemoSession();
  const origin = new URL(request.url).origin;
  const shareUrl = `${origin}/try/${session.id}`;

  return Response.json(
    {
      id: session.id,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      shareUrl,
    },
    {
      status: 201,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
