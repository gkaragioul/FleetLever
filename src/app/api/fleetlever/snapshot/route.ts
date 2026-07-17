import { getFleetLeverData } from "@/lib/db/fleetlever-data";
import { requireFleetLeverApiSession } from "@/lib/auth/access";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireFleetLeverApiSession({ activeAccess: true });
  if (authError) return authError;

  const data = await getFleetLeverData();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
