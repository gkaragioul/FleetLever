import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { PublicDemoWorkspace } from "@/components/fleetlever/public-demo-workspace";
import { readDemoSession } from "@/lib/commercial/demo-session-store";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Interactive demo | FleetLever",
  description: "A temporary FleetLever interactive demo workspace.",
  robots: { index: false, follow: false },
};

function DemoExpiredState() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#eef3e9] p-6">
      <section className="w-full max-w-xl border border-[#cbd8d2] bg-white p-7 shadow-[0_24px_70px_rgba(15,51,45,0.12)] sm:p-10">
        <FleetLeverLogo />
        <p className="mt-9 text-xs font-bold uppercase text-[#007c89]">Temporary demo workspace</p>
        <h1 className="mt-3 text-4xl font-bold text-[#103d37]">This link is no longer active.</h1>
        <p className="mt-4 max-w-md text-base leading-7 text-[#60736d]">
          Demo workspaces are securely removed after 10 hours. Start a new one from the FleetLever website.
        </p>
        <Link href="/" className="mt-7 inline-flex h-11 items-center rounded-md bg-[#103d37] px-5 text-sm font-bold text-white hover:bg-[#007c89]">
          Start a new demo
        </Link>
      </section>
    </main>
  );
}

export default async function PublicDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  const result = await readDemoSession(sessionId);
  if (result.status !== "active") return <DemoExpiredState />;

  return (
    <PublicDemoWorkspace
      sessionId={result.session.id}
      expiresAt={result.session.expiresAt}
      embedded={query.embed === "1"}
    />
  );
}
