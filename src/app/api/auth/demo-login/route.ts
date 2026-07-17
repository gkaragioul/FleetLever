import { createSuperAdminSession } from "@/lib/auth/super-admin";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!originMatches(request)) return originErrorResponse();
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
