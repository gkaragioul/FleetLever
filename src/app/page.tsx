import { redirect } from "next/navigation";
import LandingPage from "./landing/page";
import { getSuperAdminSession } from "@/lib/auth/super-admin";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

export const dynamic = "force-dynamic";

export default async function Home() {
  const edition = getFleetLeverEdition();

  if (edition === "elliniko") {
    redirect("/main-page");
  }

  if (edition === "console") {
    const session = await getSuperAdminSession().catch(() => null);

    if (!session) {
      redirect("/login?next=/fleet-management");
    }

    redirect("/fleet-management");
  }

  return <LandingPage />;
}
