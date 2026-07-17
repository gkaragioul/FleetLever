import { createSuperAdminSession } from "@/lib/auth/super-admin";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

export const dynamic = "force-dynamic";

function demoLoginAllowed() {
  const hosted = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.VERCEL || process.env.RENDER || process.env.FLY_APP_NAME);
  return getFleetLeverEdition() === "elliniko" && process.env.NODE_ENV !== "production" && !hosted;
}

export async function POST(request: Request) {
  if (!originMatches(request)) return originErrorResponse();
  if (!demoLoginAllowed()) {
    return Response.json({ ok: false, error: "Not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  await createSuperAdminSession("demo-worker");

  return Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
