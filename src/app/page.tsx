import { headers } from "next/headers";
import LandingPage from "./landing/page";
import { ConstructionPrototype } from "@/components/fleetlever/construction-prototype";

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
    return <ConstructionPrototype />;
  }

  return <LandingPage />;
}
