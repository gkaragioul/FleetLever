import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  PackageCheck,
  Wrench,
} from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  demoHref,
} from "@/components/fleetlever/commercial-site-shell";
import { ProductWalkthrough } from "@/components/fleetlever/product-walkthrough";
import { ReadinessLanes } from "@/components/fleetlever/readiness-lanes";

export const metadata: Metadata = {
  title: "Fleet and equipment readiness before release",
  description:
    "Know which vehicles and equipment can go to their next job, rental or assignment, what blocks them and who owns the next action.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const audiences = [
  [HardHat, "Construction and heavy equipment", "Verify machines, operators, attachments and job requirements before release to site."],
  [PackageCheck, "Equipment rental", "Control return, inspection, damage, cleaning, accessories and checkout before the next customer."],
  [Building2, "Municipal and public works", "Confirm vehicles, crews, routes and compliance before the next public-service assignment."],
  [Wrench, "Specialist and service fleets", "Check vans, tools, technicians and job-specific requirements before dispatch."],
] as const;

const measurements = [
  ["Early detection", "Release blockers found before the shift starts"],
  ["Time to ownership", "How quickly every blocker gets an accountable person"],
  ["Evidence coverage", "Release decisions supported by the required proof"],
  ["Carry-over risk", "Open issues that still reach the next shift"],
] as const;

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FleetLever",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "A readiness and release-control layer for vehicles, equipment, people, evidence and upcoming operations.",
  offers: {
    "@type": "Offer",
    price: "1000",
    priceCurrency: "EUR",
    description: "30-day founding pilot",
  },
};

export default function LandingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <section className="relative isolate flex min-h-[620px] max-h-[780px] items-end overflow-hidden bg-[#071b18] sm:min-h-[680px] lg:min-h-[720px]">
        <Image
          src="/fleetlever/site/hero-photos/site-crew-crane.jpg"
          alt="Construction crew working beside a crawler crane"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[62%_58%]"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/74" aria-hidden="true" />

        <div className="mx-auto w-full max-w-[86rem] px-5 pb-14 sm:px-7 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="max-w-[49rem] text-white">
            <p className="text-sm font-bold uppercase text-[#9af6f7]">Fleet and equipment readiness</p>
            <h1 className="mt-4 text-6xl font-semibold leading-none sm:text-7xl lg:text-8xl">FleetLever</h1>
            <p className="mt-6 max-w-[44rem] text-3xl font-semibold leading-tight text-balance sm:text-4xl">
              Know what can go out next. And what cannot.
            </p>
            <p className="mt-5 max-w-[42rem] text-base font-medium leading-7 text-white sm:text-lg">
              FleetLever checks vehicles, equipment, documents, maintenance, people and job requirements before assets are released to their next job, rental or assignment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={demoHref}
                data-analytics="hero_demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See it with your fleet
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/55 bg-[#071b18]/45 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-[#071b18]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#cad6d1] bg-white px-5 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto grid w-full max-w-[86rem] gap-4 text-sm font-semibold text-[#435650] sm:grid-cols-3 sm:gap-0">
          {["One daily release decision", "No replacement for your ERP", "30-day measurable pilot"].map((item, index) => (
            <p key={item} className={`flex items-center gap-2 sm:px-6 ${index > 0 ? "sm:border-l sm:border-[#cad6d1]" : "sm:pl-0"}`}>
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#16834b]" aria-hidden="true" />
              {item}
            </p>
          ))}
        </div>
      </section>

      <div id="how-it-works" className="scroll-mt-24">
        <ReadinessLanes />
      </div>

      <section className="scroll-mt-24 bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="product">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#006c74]">One decision, three views</p>
              <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                The answer is visible without opening five systems.
              </h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f] lg:justify-self-end">
              Start with the action queue, inspect the asset record, then retain the decision and evidence. The flow stays simple because each view answers one operational question.
            </p>
          </div>
          <ProductWalkthrough />
        </div>
      </section>

      <section className="border-y border-[#28534d] bg-[#103d37] px-5 py-16 text-white sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
            <div>
              <BarChart3 className="h-7 w-7 text-[#9af6f7]" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase text-[#9af6f7]">What the pilot measures</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Evidence before a longer commitment.</h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#d8e5e1] lg:justify-self-end">
              We agree the baseline and success measures before day one. The final review shows what changed, what did not and whether FleetLever earns a permanent place in the workflow.
            </p>
          </div>
          <div className="mt-10 grid border-t border-white/25 sm:grid-cols-2 lg:grid-cols-4">
            {measurements.map(([title, body], index) => (
              <article key={title} className={`border-b border-white/25 py-6 sm:px-6 lg:border-b-0 ${index % 2 ? "sm:border-l" : ""} ${index > 1 ? "lg:border-l" : ""} lg:first:pl-0`}>
                <p className="font-mono text-sm font-semibold text-[#9af6f7]">0{index + 1}</p>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#bfd0ca]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="for-whom">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr]">
            <div>
              <ClipboardCheck className="h-7 w-7 text-[#006c74]" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase text-[#006c74]">Broader assets. One narrow decision.</p>
              <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">
                The same release-control engine, adapted to the operation.
              </h2>
            </div>
            <div className="border-t border-[#bdcbc5]">
              {audiences.map(([Icon, title, body]) => (
                <article key={title} className="grid gap-4 border-b border-[#bdcbc5] py-6 sm:grid-cols-[auto_0.7fr_1.3fr] sm:items-start sm:gap-6">
                  <Icon className="h-5 w-5 text-[#006c74]" aria-hidden="true" />
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-base font-medium leading-7 text-[#53635f]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#071b18] px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-24">
        <Image
          src="/fleetlever/site/hero-photos/heavy-lift-steel.jpg"
          alt="Heavy lifting machine working beside a steel structure"
          fill
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/84" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-[86rem] gap-9 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#9af6f7]">30-day founding pilot</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Use one real fleet workflow. Decide with evidence.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#d8e5e1]">
              Up to 30 critical assets, one readiness workflow, guided setup and a measured final review.
            </p>
          </div>
          <div className="lg:text-right">
            <p className="font-mono text-4xl font-semibold">EUR 1,000</p>
            <p className="mt-1 text-sm font-medium text-[#c7d7d2]">fixed pilot fee · excluding VAT</p>
            <Link
              href={demoHref}
              data-analytics="pilot_demo"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-6 text-sm font-bold text-[#0b302c] transition hover:bg-white"
            >
              Request a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/pricing" className="mt-4 block text-sm font-semibold text-[#d8e5e1] underline decoration-white/45 underline-offset-4 hover:text-white">
              View pricing and pilot terms
            </Link>
          </div>
        </div>
      </section>

      <CommercialSiteFooter />
    </main>
  );
}
