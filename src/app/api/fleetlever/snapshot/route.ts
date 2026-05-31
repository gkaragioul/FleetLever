import { getFleetLeverData } from "@/lib/db/fleetlever-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getFleetLeverData();
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
