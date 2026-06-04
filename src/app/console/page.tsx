import { ConstructionPrototype } from "@/components/fleetlever/construction-prototype";
import { getSuperAdminSession } from "@/lib/auth/super-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ConsolePage() {
  const session = await getSuperAdminSession().catch(() => null);

  if (!session) {
    redirect("/login?next=/console");
  }

  return <ConstructionPrototype />;
}
