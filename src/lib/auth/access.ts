import "server-only";

import { redirect } from "next/navigation";
import { getAccountSession } from "@/lib/auth/account";
import { getSuperAdminSession } from "@/lib/auth/super-admin";

export async function getFleetLeverAccessSession() {
  const account = await getAccountSession().catch(() => null);
  if (account) return { kind: "account" as const, account };
  const superAdmin = await getSuperAdminSession().catch(() => null);
  if (superAdmin) return { kind: "super_admin" as const, superAdmin };
  return null;
}

export async function requireFleetLeverApiSession(options: { activeAccess?: boolean } = {}) {
  const session = await getFleetLeverAccessSession();
  if (!session) return Response.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (options.activeAccess && session.kind === "account" && !session.account.trial.active) {
    return Response.json(
      { ok: false, error: "Trial expired", trialEndedAt: session.account.trial.endsAt },
      { status: 402, headers: { "Cache-Control": "no-store" } },
    );
  }
  return null;
}

export async function requireActiveFleetLeverMutationSession() {
  const session = await getFleetLeverAccessSession();
  if (!session) throw new Error("Unauthorized FleetLever mutation.");
  if (session.kind === "account" && !session.account.trial.active) {
    throw new Error("FleetLever access has expired.");
  }
  return session;
}

export async function requireActiveFleetLeverPageSession(nextPath: string) {
  const session = await getFleetLeverAccessSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  if (session.kind === "account" && !session.account.trial.active) redirect("/fleet-management");
  return session;
}
