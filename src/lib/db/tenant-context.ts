import { cookies } from "next/headers";
import { withTenant } from "@/lib/db/client";
import type { TenantContext } from "@/lib/db/queries";

const organizationCookie = "fleetlever_organization_id";
const profileCookie = "fleetlever_profile_id";

export const demoTenantContext: TenantContext = {
  organizationId: process.env.FLEETLEVER_DEMO_ORGANIZATION_ID ?? "00000000-0000-4000-8000-000000000001",
  profileId: process.env.FLEETLEVER_DEMO_PROFILE_ID ?? "00000000-0000-4000-8000-000000000101",
};

export async function getActiveTenantContext(): Promise<TenantContext> {
  const cookieStore = await cookies();

  return {
    organizationId: cookieStore.get(organizationCookie)?.value ?? demoTenantContext.organizationId,
    profileId: cookieStore.get(profileCookie)?.value ?? demoTenantContext.profileId,
  };
}

export async function setActiveTenantContext(context: TenantContext) {
  await withTenant(context, async () => null);

  const cookieStore = await cookies();
  cookieStore.set(organizationCookie, context.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  cookieStore.set(profileCookie, context.profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
