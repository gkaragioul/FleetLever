import { OperationsConsole } from "@/components/fleetlever/operations-console";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const initialData = await getFleetLeverData();

  return <OperationsConsole initialData={initialData} />;
}
