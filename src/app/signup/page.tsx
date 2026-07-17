import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountAuthShell } from "@/components/auth/account-auth-shell";
import { getAccountSession } from "@/lib/auth/account";
import { safeRedirectPath } from "@/lib/auth/account-core.mjs";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Start your trial", description: "Create a FleetLever workspace for 15 days." };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeRedirectPath((await searchParams).next);
  if (await getAccountSession().catch(() => null)) redirect(next);
  return <AccountAuthShell eyebrow="15-day unrestricted trial" title="Create your workspace" description="Use the full FleetLever console with your own data. No card required."><SignupForm googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} next={next} /></AccountAuthShell>;
}
