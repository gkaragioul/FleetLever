import { headers } from "next/headers";
import LandingPage from "./landing/page";
import { OperationsConsole } from "@/components/fleetlever/operations-console";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";

export const dynamic = "force-dynamic";

function isAppRootHost(host: string | null) {
  if (process.env.FLEETLEVER_ROOT_EXPERIENCE === "app" || process.env.RAILWAY_ENVIRONMENT) {
    return true;
  }

  return Boolean(host?.toLowerCase().includes("railway.app"));
}

export default async function Home() {
  const requestHeaders = await headers();

  if (isAppRootHost(requestHeaders.get("host"))) {
    const initialData = await getFleetLeverData();

    return <OperationsConsole initialData={initialData} />;
  }

  return <LandingPage />;
}
