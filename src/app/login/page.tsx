import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { getSuperAdminSession } from "@/lib/auth/super-admin";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Σύνδεση",
  description: "Σύνδεση στο FleetLever.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/console";
  const session = await getSuperAdminSession().catch(() => null);

  if (session) {
    redirect(next);
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0f302b] px-5 py-8 text-[#13211f] sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 scale-[1.03] bg-[url('/fleetlever/site/login-construction-bg.jpg')] bg-cover bg-center opacity-72 blur-[5px]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-[#0f302b]/30" />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(238,242,239,0.10),transparent_46%),linear-gradient(90deg,rgba(15,48,43,0.48),rgba(15,48,43,0.08),rgba(15,48,43,0.48))]"
      />

      <section className="relative w-full max-w-[31rem] rounded-3xl border border-white/60 bg-white/94 p-7 shadow-[0_28px_90px_rgba(4,25,22,0.34)] backdrop-blur-md sm:p-9">
        <Link
          href="/"
          aria-label="FleetLever home"
          className="mx-auto flex w-fit items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe]"
        >
          <FleetLeverLogo />
        </Link>

        <LoginForm next={next} />
      </section>
    </main>
  );
}
