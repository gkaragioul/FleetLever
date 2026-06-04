import { getFleetLeverData } from "@/lib/db/fleetlever-data";
import { requireSuperAdminApiSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireSuperAdminApiSession();
  if (authError) return authError;

  const data = await getFleetLeverData();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
