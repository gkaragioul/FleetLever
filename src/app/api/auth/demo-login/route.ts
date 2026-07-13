import { createSuperAdminSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

export async function POST() {
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
