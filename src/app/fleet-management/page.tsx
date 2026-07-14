import { ConstructionPrototype } from "@/components/fleetlever/construction-prototype";
import { getSuperAdminSession } from "@/lib/auth/super-admin";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FleetManagementPage() {
  const edition = getFleetLeverEdition();

  if (edition === "site") notFound();

  const session = await getSuperAdminSession().catch(() => null);

  if (!session) {
    redirect(edition === "elliniko" ? "/main-page?next=/fleet-management" : "/login?next=/fleet-management");
  }

  return <ConstructionPrototype />;
}
