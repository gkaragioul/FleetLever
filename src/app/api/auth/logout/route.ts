import { clearAccountSession } from "@/lib/auth/account";
import { clearSuperAdminSession } from "@/lib/auth/super-admin";
import { originErrorResponse, originMatches } from "@/lib/security/request-origin.mjs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!originMatches(request)) return originErrorResponse();
  await clearAccountSession();
  await clearSuperAdminSession();
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
