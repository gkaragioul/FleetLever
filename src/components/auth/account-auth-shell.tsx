import Link from "next/link";
import type { ReactNode } from "react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

export function AccountAuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0f302b] px-4 py-8 text-[#13211f]">
      <div aria-hidden className="absolute inset-0 scale-[1.03] bg-[url('/fleetlever/site/login-construction-bg.jpg')] bg-cover bg-center opacity-55 blur-[4px]" />
      <div aria-hidden className="absolute inset-0 bg-[#0f302b]/45" />
      <section className="relative w-full max-w-[32rem] rounded-md border border-white/60 bg-white/95 p-7 shadow-[0_28px_90px_rgba(4,25,22,0.34)] backdrop-blur-md sm:p-9">
        <Link href="/" aria-label="FleetLever home" className="mx-auto flex w-fit"><FleetLeverLogo /></Link>
        <p className="mt-7 text-[11px] font-black uppercase text-[#008C95]">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-[#0D2F2D]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#64746F]">{description}</p>
        {children}
      </section>
    </main>
  );
}
