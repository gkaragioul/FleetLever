import { createDemoSession } from "@/lib/commercial/demo-session-store";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!originMatches(request)) return originErrorResponse();
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
