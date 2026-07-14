import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { CommercialSiteFooter, CommercialSiteHeader } from "@/components/fleetlever/commercial-site-shell";
import { DemoRequestForm } from "@/components/fleetlever/demo-request-form";

export const metadata: Metadata = {
  title: "Request a demo",
  description: "Show FleetLever one real fleet or equipment workflow and see how a 30-day readiness pilot would work.",
  alternates: { canonical: "/request-demo" },
  openGraph: { url: "/request-demo" },
};

const expectations = [
  "A 30-minute workflow call",
  "One real shift, route or project to examine",
  "A clear pilot scope and success measures",
] as const;

export default function RequestDemoPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#edf2ee] text-[#13211f]">
      <CommercialSiteHeader />
      <section className="px-5 py-14 sm:px-7 sm:py-20 lg:px-10 lg:py-24">
        <div className="mx-auto grid w-full max-w-[76rem] gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="lg:pt-6">
            <p className="text-sm font-bold uppercase text-[#006c74]">See it with your fleet</p>
            <h1 className="mt-3 max-w-xl text-5xl font-semibold leading-[1.02] text-balance sm:text-6xl">
              Request a FleetLever demo
            </h1>
            <p className="mt-6 max-w-lg text-lg font-medium leading-8 text-[#53635f]">
              Bring one job, rental or assignment that repeatedly creates late surprises. We will show how FleetLever turns it into a controlled release decision.
            </p>
            <div className="mt-9 border-t border-[#bdcbc5]">
              {expectations.map((item) => (
                <p key={item} className="flex gap-3 border-b border-[#bdcbc5] py-4 text-sm font-semibold text-[#334641]">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#16834b]" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
            <p className="mt-6 text-sm font-medium leading-6 text-[#4d5f59]">
              Prefer email? Write to <a href="mailto:hello@fleetlever.com" className="font-bold text-[#006c74] underline underline-offset-3">hello@fleetlever.com</a>.
            </p>
          </div>

          <div className="border border-[#c7d3ce] bg-[#f8faf7] p-6 shadow-[0_24px_70px_rgba(16,61,55,0.10)] sm:p-8">
            <DemoRequestForm />
          </div>
        </div>
      </section>
      <CommercialSiteFooter />
    </main>
  );
}
