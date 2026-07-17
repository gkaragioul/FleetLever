import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { AccountAuthShell } from "@/components/auth/account-auth-shell";
import { consumeEmailVerification } from "@/lib/auth/account";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  const verified = token ? await consumeEmailVerification(token).catch(() => false) : false;
  return (
    <AccountAuthShell eyebrow="Email verification" title={verified ? "Email verified" : "Link unavailable"} description={verified ? "Your FleetLever account is ready." : "This verification link is invalid, expired or has already been used."}>
      <div className={`mt-7 flex items-start gap-3 rounded-md border p-4 ${verified ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
        {verified ? <CheckCircle2 /> : <XCircle />}
        <p className="text-sm font-semibold leading-6">{verified ? "You can continue to your release-control workspace." : "Sign in to continue. Account access is not blocked while email delivery is being configured."}</p>
      </div>
      <Link href={verified ? "/fleet-management" : "/login"} className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#102b27] px-5 text-sm font-bold text-white hover:bg-[#007C89]">{verified ? "Open FleetLever" : "Go to sign in"}</Link>
    </AccountAuthShell>
  );
}
