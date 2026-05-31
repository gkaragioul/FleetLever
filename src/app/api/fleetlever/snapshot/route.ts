import { getFleetLeverData } from "@/lib/db/fleetlever-data";

export async function GET() {
  const data = await getFleetLeverData();
  return Response.json(data);
}
