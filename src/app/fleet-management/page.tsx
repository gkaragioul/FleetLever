import { ConstructionPrototype } from "@/components/fleetlever/construction-prototype";
import { getFleetLeverAccessSession } from "@/lib/auth/access";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function FleetManagementPage() {
  const edition = getFleetLeverEdition();

  if (edition === "site") notFound();

  const session = await getFleetLeverAccessSession();

  if (!session) {
    redirect("/login?next=/fleet-management");
  }

  if (session.kind === "account" && !session.account.trial.active) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#EDF3E7] px-5 py-10 text-[#0D2F2D]">
        <section className="w-full max-w-2xl rounded-md border border-[#C9D8D3] bg-white p-7 shadow-[0_24px_70px_rgba(13,47,45,.12)] sm:p-10">
          <p className="text-[11px] font-black uppercase text-[#008C95]">FleetLever trial</p>
          <h1 className="mt-3 text-3xl font-black">Your 15-day trial has ended.</h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#64746F]">Your workspace and operational records are preserved. Continue with FleetLever to restore console access without rebuilding your setup.</p>
          <div className="mt-7 flex flex-col gap-3 border-t border-[#DCE5E1] pt-6 sm:flex-row">
            <a href="mailto:hello@fleetlever.com?subject=Continue%20my%20FleetLever%20workspace" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#0D2F2D] px-5 text-sm font-bold text-white hover:bg-[#008C95]">Talk to FleetLever</a>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#C9D8D3] px-5 text-sm font-bold hover:bg-[#F3F7F5]">Return to the website</Link>
          </div>
        </section>
      </main>
    );
  }

  return <ConstructionPrototype trialInfo={session.kind === "account" ? { daysRemaining: session.account.trial.daysRemaining, endsAt: session.account.trial.endsAt, userName: session.account.fullName, organizationName: session.account.organizationName } : undefined} />;
}
