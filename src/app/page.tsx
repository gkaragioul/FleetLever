import { headers } from "next/headers";
import LandingPage from "./landing/page";
import { OperationsConsole } from "@/components/fleetlever/operations-console";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";

export const dynamic = "force-dynamic";

function isLocalSiteHost(host: string | null) {
  if (!host) {
    return process.env.NODE_ENV === "development";
  }

  const normalizedHost = host.toLowerCase();

  return (
    normalizedHost.startsWith("localhost:") ||
    normalizedHost === "localhost" ||
    normalizedHost.startsWith("127.0.0.1:") ||
    normalizedHost === "127.0.0.1" ||
    normalizedHost.startsWith("[::1]:") ||
    normalizedHost === "[::1]"
  );
}

export default async function Home() {
  const requestHeaders = await headers();

  if (isLocalSiteHost(requestHeaders.get("host"))) {
    return <LandingPage />;
  }

  const initialData = await getFleetLeverData();

  return <OperationsConsole initialData={initialData} />;
}
