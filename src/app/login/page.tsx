import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { getAccountSession } from "@/lib/auth/account";
import { safeRedirectPath } from "@/lib/auth/account-core.mjs";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", description: "Sign in to FleetLever." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string; oauth?: string }> }) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);
  if (await getAccountSession().catch(() => null)) redirect(next);
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0f302b] px-4 py-8 text-[#13211f]">
      <div aria-hidden className="absolute inset-0 scale-[1.03] bg-[url('/fleetlever/site/login-construction-bg.jpg')] bg-cover bg-center opacity-55 blur-[4px]" />
      <div aria-hidden className="absolute inset-0 bg-[#0f302b]/45" />
      <section className="relative w-full max-w-[31rem] rounded-md border border-white/60 bg-white/95 p-7 shadow-[0_28px_90px_rgba(4,25,22,0.34)] backdrop-blur-md sm:p-9">
        <Link href="/" aria-label="FleetLever home" className="mx-auto flex w-fit"><FleetLeverLogo /></Link>
        <p className="mt-7 text-[11px] font-black uppercase text-[#008C95]">Fleet readiness workspace</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-[#0D2F2D]">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[#64746F]">Continue to your organization’s release-control workspace.</p>
        {params.reset === "1" ? <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Your password has been updated. Sign in to continue.</p> : null}
        {params.oauth ? <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">Google sign-in could not be completed. Please try again or use email.</p> : null}
        <LoginForm googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} next={next} />
      </section>
    </main>
  );
}
