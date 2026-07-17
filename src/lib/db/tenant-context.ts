import { cookies } from "next/headers";
import { withTenant } from "@/lib/db/client";
import { getAccountSession } from "@/lib/auth/account";
import type { TenantContext } from "@/lib/db/queries";

const organizationCookie = "fleetlever_organization_id";
const profileCookie = "fleetlever_profile_id";
const knownDemoOrganizationId = "00000000-0000-4000-8000-000000000001";
const knownDemoProfileId = "00000000-0000-4000-8000-000000000101";

export const demoTenantContext: TenantContext = {
  organizationId: process.env.FLEETLEVER_DEMO_ORGANIZATION_ID ?? knownDemoOrganizationId,
  profileId: process.env.FLEETLEVER_DEMO_PROFILE_ID ?? knownDemoProfileId,
};

function isProductionDeployment() {
  return process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
}

function defaultTenantContext(): TenantContext {
  const organizationId = process.env.FLEETLEVER_DEFAULT_ORGANIZATION_ID;
  const profileId = process.env.FLEETLEVER_DEFAULT_PROFILE_ID;

  if (organizationId && profileId) {
    if (isProductionDeployment() && (organizationId === knownDemoOrganizationId || profileId === knownDemoProfileId)) {
      throw new Error("Production cannot use the built-in demo tenant IDs.");
    }

    return { organizationId, profileId };
  }

  if (isProductionDeployment()) {
    throw new Error("FLEETLEVER_DEFAULT_ORGANIZATION_ID and FLEETLEVER_DEFAULT_PROFILE_ID are required until production authentication is enabled.");
  }

  return demoTenantContext;
}

export async function getActiveTenantContext(): Promise<TenantContext> {
  const account = await getAccountSession().catch(() => null);
  if (account) return { organizationId: account.organizationId, profileId: account.profileId };

  const cookieStore = await cookies();
  const organizationId = cookieStore.get(organizationCookie)?.value;
  const profileId = cookieStore.get(profileCookie)?.value;

  if (organizationId && profileId) {
    return { organizationId, profileId };
  }

  return defaultTenantContext();
}

export async function setActiveTenantContext(context: TenantContext) {
  await withTenant(context, async () => null);

  const cookieStore = await cookies();
  cookieStore.set(organizationCookie, context.organizationId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    secure: isProductionDeployment(),
  });
  cookieStore.set(profileCookie, context.profileId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
    secure: isProductionDeployment(),
  });
}
