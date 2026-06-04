import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "./landing/page";
import { ConstructionPrototype } from "@/components/fleetlever/construction-prototype";
import { getSuperAdminSession } from "@/lib/auth/super-admin";

export const dynamic = "force-dynamic";

function isAppRootHost(host: string | null) {
  const hostname = host?.split(":")[0]?.toLowerCase();
  if (hostname === "fleetlever.com" || hostname === "www.fleetlever.com") {
    return false;
  }

  if (process.env.FLEETLEVER_ROOT_EXPERIENCE === "app" || process.env.RAILWAY_ENVIRONMENT) {
    return true;
  }

  return Boolean(host?.toLowerCase().includes("railway.app"));
}

export default async function Home() {
  const requestHeaders = await headers();

  if (isAppRootHost(requestHeaders.get("host"))) {
    const session = await getSuperAdminSession().catch(() => null);

    if (!session) {
      redirect("/login?next=/");
    }

    return <ConstructionPrototype />;
  }

  return <LandingPage />;
}
