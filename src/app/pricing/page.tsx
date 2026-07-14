import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleHelp,
  FileCheck2,
  Gauge,
  Layers3,
} from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  demoHref,
} from "@/components/fleetlever/commercial-site-shell";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start FleetLever with a 30-day paid pilot, then choose a transparent annual operating scope for your fleet.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing" },
};

const pilotIncludes = [
  "One real readiness workflow",
  "Up to 30 critical assets",
  "Guided setup and a basic data import",
  "Weekly review and a measured final decision",
] as const;

const plans = [
  {
    name: "Single Team",
    price: "EUR 6,000 / year",
    monthly: "EUR 500 billed monthly on a 12-month agreement",
    audience: "One fleet team, workshop or project with a clear release workflow.",
    scope: "Up to 30 active assets and one operating unit.",
    features: ["Upcoming-work readiness", "Action ownership", "Asset passports", "Decision history", "Standard support"],
    featured: false,
  },
  {
    name: "Operations",
    price: "EUR 12,000 / year",
    monthly: "EUR 1,000 billed monthly on a 12-month agreement",
    audience: "Multiple teams coordinating fleet, workshop and compliance decisions.",
    scope: "Up to 100 active assets and three operating units.",
    features: ["Everything in Single Team", "Cross-team workflows", "Role-based access", "Priority support", "Operational reviews"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "From EUR 24,000 / year",
    monthly: "Annual scope agreed around operating complexity",
    audience: "Large or distributed fleets with governance, integration or SLA requirements.",
    scope: "More than 100 assets, multiple business units or custom controls.",
    features: ["Everything in Operations", "Custom governance", "Integration scope", "Service-level agreement", "Dedicated review cadence"],
    featured: false,
  },
] as const;

const faqs = [
  ["Is the pilot free?", "No. It is a fixed-scope operational test using your real workflow and data. The fee is credited against the first annual agreement when conversion happens within 15 days of the final review."],
  ["Do you charge per user?", "Not aggressively. Plans are based on operating scope, assets and organisational complexity so contributors can upload evidence without becoming a licensing problem."],
  ["Can we cancel monthly?", "Monthly billing is available, but the commercial term is 12 months. The pilot is the shorter decision point before that commitment."],
] as const;

export default function PricingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />

      <section className="border-b border-[#d7dfdb] bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#006c74]">Pricing built around proof</p>
            <h1 className="mt-3 max-w-2xl text-5xl font-semibold leading-[1.03] text-balance sm:text-6xl">
              Start with 30 days, not an annual leap of faith.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-[#53635f]">
              Prove FleetLever on one real fleet workflow. Continue only when the final review shows a measurable operational case.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={demoHref}
                data-analytics="pricing_hero_demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white transition hover:bg-[#006c74]"
              >
                Request a demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href="#plans" className="inline-flex min-h-12 items-center justify-center px-4 text-sm font-bold text-[#334641] hover:text-[#006c74]">
                Compare annual plans
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden border border-[#c7d3ce] bg-[#e7eeea] shadow-[0_24px_70px_rgba(16,61,55,0.12)]">
            <Image
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt="FleetLever tomorrow readiness dashboard"
              width={1920}
              height={1200}
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="h-auto w-full"
            />
            <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 border border-white/80 bg-white/96 shadow-lg sm:inset-x-6 sm:bottom-6">
              {[["30 days", "pilot"], ["1 flow", "measured"], ["0", "hidden fees"]].map(([value, label]) => (
                <div key={label} className="border-r border-[#d7dfdb] px-3 py-3 last:border-r-0 sm:px-5 sm:py-4">
                  <p className="font-mono text-lg font-semibold text-[#103d37] sm:text-2xl">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-[#52655f] sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#103d37] px-5 py-16 text-white sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <p className="text-sm font-bold uppercase text-[#9af6f7]">Founding pilot</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Thirty days with your actual fleet.</h2>
            <p className="mt-6 font-mono text-5xl font-semibold">EUR 1,000</p>
            <p className="mt-2 text-sm font-medium text-[#c7d7d2]">one-off fee · excluding VAT</p>
            <p className="mt-6 max-w-md border-l-2 border-[#73dce3] pl-4 text-sm font-semibold leading-6 text-[#eef6f3]">
              Fully credited against the first annual agreement when you continue within 15 days of the final review.
            </p>
          </div>
          <div className="border-t border-white/25">
            <div className="grid gap-6 border-b border-white/25 py-7 sm:grid-cols-2">
              {pilotIncludes.map((item) => (
                <p key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#eef6f3]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#9af6f7]" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
            <div className="grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-lg font-semibold">Define success before the first asset enters the flow.</p>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#c7d7d2]">
                  The final review covers early detection, time to ownership, evidence coverage and risk carried into the next shift.
                </p>
              </div>
              <Link href={demoHref} data-analytics="pricing_pilot_demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] hover:bg-white">
                Scope the pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="plans">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-6 border-b border-[#bdcbc5] pb-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#006c74]">After the pilot</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Choose operating scope, not a pile of licences.</h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f] lg:justify-self-end">
              Plans grow with active assets, operating units and governance. They do not punish a technician for uploading one piece of evidence.
            </p>
          </div>

          <div className="border-b border-[#bdcbc5]">
            {plans.map((plan) => (
              <article key={plan.name} className={`grid gap-7 border-t border-[#bdcbc5] py-8 lg:grid-cols-[0.72fr_0.95fr_1.18fr] lg:gap-10 lg:px-6 lg:py-10 ${plan.featured ? "bg-[#e7f2ee] lg:-mx-6 lg:px-12" : ""}`}>
                <div>
                  {plan.featured && <p className="mb-3 inline-flex bg-[#006c74] px-2 py-1 text-[11px] font-bold uppercase text-white">Most common starting scope</p>}
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  <p className="mt-4 font-mono text-3xl font-semibold text-[#103d37]">{plan.price}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#5c6f68]">{plan.monthly}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#006c74]">Best fit</p>
                  <p className="mt-3 text-base font-semibold leading-7">{plan.audience}</p>
                  <p className="mt-5 border-l-2 border-[#00aebe] pl-4 text-sm font-bold leading-6 text-[#334641]">{plan.scope}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#006c74]">Includes</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {plan.features.map((feature) => (
                      <p key={feature} className="flex gap-2.5 text-sm font-semibold leading-6 text-[#334641]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16834b]" aria-hidden="true" />
                        {feature}
                      </p>
                    ))}
                  </div>
                  <Link href={demoHref} data-analytics={`pricing_${plan.name.toLowerCase().replaceAll(" ", "_")}`} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#006c74] hover:text-[#103d37]">
                    Discuss this scope
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d7dfdb] bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.68fr_1.32fr]">
          <div>
            <Layers3 className="h-7 w-7 text-[#006c74]" aria-hidden="true" />
            <p className="mt-6 text-sm font-bold uppercase text-[#006c74]">Implementation and expansion</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">The price changes only when the operation changes.</h2>
            <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#53635f]">
              Setup is quoted once. Expansion follows assets, operating units or genuinely custom integration work.
            </p>
          </div>
          <div className="border-t border-[#bdcbc5]">
            {[
              ["Single Team setup", "EUR 1,500", "Configuration, basic import and launch support."],
              ["Operations setup", "EUR 3,000", "Multi-team configuration, roles and launch reviews."],
              ["Additional operating unit", "From EUR 3,000 / year", "A separate team, depot, project or legal operating scope."],
              ["Additional block of 25 assets", "EUR 1,500-2,000 / year", "Extend an existing operating unit without forcing an early plan change."],
              ["Custom integrations", "Quoted separately", "Only after the interface, ownership and support boundary are defined."],
            ].map(([title, price, body]) => (
              <article key={title} className="grid gap-2 border-b border-[#bdcbc5] py-5 sm:grid-cols-[0.9fr_0.65fr_1.25fr] sm:gap-6">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="font-mono text-base font-semibold text-[#103d37]">{price}</p>
                <p className="text-sm font-medium leading-6 text-[#53635f]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#edf2ee] px-5 py-16 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-12 lg:grid-cols-2">
          <div>
            <FileCheck2 className="h-7 w-7 text-[#006c74]" aria-hidden="true" />
            <p className="mt-6 text-sm font-bold uppercase text-[#006c74]">Commercial terms</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">Clear before signature.</h2>
            <div className="mt-7 border-t border-[#bdcbc5]">
              {[
                ["Term", "12-month agreement after the pilot."],
                ["Billing", "Monthly, quarterly or annual."],
                ["VAT", "All listed prices exclude VAT."],
                ["Discounts", "Only in exchange for scope, term, prepayment or reference rights."],
              ].map(([title, body]) => (
                <div key={title} className="grid grid-cols-[0.35fr_0.65fr] gap-5 border-b border-[#bdcbc5] py-4 text-sm">
                  <p className="font-bold">{title}</p>
                  <p className="font-medium leading-6 text-[#53635f]">{body}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <CircleHelp className="h-7 w-7 text-[#006c74]" aria-hidden="true" />
            <p className="mt-6 text-sm font-bold uppercase text-[#006c74]">Questions before you decide</p>
            <div className="mt-4 border-t border-[#bdcbc5]">
              {faqs.map(([question, answer]) => (
                <article key={question} className="border-b border-[#bdcbc5] py-5">
                  <h3 className="text-base font-semibold">{question}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#53635f]">{answer}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#071b18] px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-24">
        <Image
          src="/fleetlever/site/hero-photos/crane-workers.jpg"
          alt="Technical crew beside heavy lifting equipment"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/85" aria-hidden="true" />
        <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Gauge className="h-7 w-7 text-[#9af6f7]" aria-hidden="true" />
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">Pick one critical flow. Measure what changes in 30 days.</h2>
          </div>
          <Link href={demoHref} data-analytics="pricing_final_demo" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] hover:bg-white">
            Request a demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <CommercialSiteFooter />
    </main>
  );
}
