import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileCheck2,
  Gauge,
  Layers3,
  Network,
  UsersRound,
  Wrench,
} from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  requestDemoHref,
  trialHref,
} from "@/components/fleetlever/commercial-site-shell";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start FleetLever free for 15 days. No card, no installer, no sales call. Then choose a transparent annual operating scope for your fleet.",
  alternates: { canonical: "/pricing" },
  openGraph: { url: "/pricing" },
};

const trialIncludes = [
  "The full readiness board, not a cut-down demo",
  "Your own assets, documents and operators",
  "Blocker owners, deadlines and decision history",
  "Exports available from day one",
] as const;

const plans = [
  {
    slug: "single_team",
    name: "Single Team",
    descriptor: "For one operating unit",
    amount: "EUR 6,000",
    cadence: "/ year",
    monthly: "EUR 500 / month equivalent",
    audience: "One fleet team, workshop or project running a clear release workflow.",
    assetValue: "30",
    assetLabel: "active assets",
    unitValue: "1",
    unitLabel: "operating unit",
    scope: "Up to 30 active assets",
    features: [
      "Standard onboarding",
      "One release workflow",
      "Standard support",
      "Core exports",
    ],
    featured: false,
  },
  {
    slug: "operations",
    name: "Operations",
    descriptor: "For coordinated fleet operations",
    amount: "EUR 12,000",
    cadence: "/ year",
    monthly: "EUR 1,000 / month equivalent",
    audience: "Multiple teams coordinating fleet, workshop and compliance decisions.",
    assetValue: "100",
    assetLabel: "active assets",
    unitValue: "3",
    unitLabel: "operating units",
    scope: "Up to 100 active assets",
    features: [
      "Cross-team workflows",
      "Role-based access",
      "Priority support",
      "Quarterly operational reviews",
    ],
    featured: true,
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    descriptor: "For complex or distributed fleets",
    amount: "From EUR 24,000",
    cadence: "/ year",
    monthly: "Annual scope agreed with your team",
    audience: "Large fleets with governance, integration, security or SLA requirements.",
    assetValue: "100+",
    assetLabel: "active assets",
    unitValue: "Multi",
    unitLabel: "operating units",
    scope: "More than 100 assets",
    features: [
      "Custom governance",
      "Integration scope",
      "SLA and security review",
      "Dedicated review cadence",
    ],
    featured: false,
  },
] as const;

const sharedCapabilities = [
  "Upcoming-work readiness",
  "Blocker owners and deadlines",
  "Asset passports and evidence",
  "Decision history and exports",
] as const;

const priceDrivers = [
  {
    title: "Launch",
    subtitle: "One-time implementation",
    icon: Wrench,
    description: "Configuration, initial import and launch support.",
    entries: [
      ["Single Team setup", "EUR 1,500"],
      ["Operations setup", "EUR 3,000"],
    ],
  },
  {
    title: "Expand",
    subtitle: "Annual operating scope",
    icon: Layers3,
    description: "Add capacity when the real operation grows.",
    entries: [
      ["Additional operating unit", "From EUR 3,000 / year"],
      ["Additional block of 25 assets", "EUR 1,500-2,000 / year"],
    ],
  },
  {
    title: "Integrate",
    subtitle: "Defined custom work",
    icon: Network,
    description: "Price only the interfaces and controls you actually need.",
    entries: [
      ["ERP, CMMS or API work", "Quoted separately"],
      ["Custom workflow or migration", "Quoted separately"],
    ],
  },
] as const;

const commercialTerms = [
  ["Trial", "15 days free, no card, no obligation"],
  ["Billing", "Monthly, quarterly or annual"],
  ["VAT", "Listed prices exclude VAT"],
  ["Discounts", "Linked to term, scope or prepayment"],
] as const;

const faqs = [
  [
    "Is the trial really free?",
    "Yes. Fifteen days, no card, no obligation and no sales call. You load your own assets and documents and use the full readiness board. If it does not earn its place, do nothing and it ends.",
  ],
  [
    "Do you charge per user?",
    "Plans follow operating scope, active assets and organisational complexity. Contributors can submit evidence without turning every field action into a licensing decision.",
  ],
  [
    "Do we have to sign a long contract?",
    "No. There is no minimum term to start and nothing to cancel during the trial. Annual scopes exist because they are cheaper for fleets that have already decided, not because you are locked in before you have.",
  ],
] as const;

export default function PricingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />

      <section className="border-b border-[#d7dfdb] bg-white px-5 py-14 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase text-[#006c74]">
              Pricing built around proof
            </p>
            <h1 className="mt-3 text-5xl font-semibold leading-[1.02] text-balance sm:text-6xl">
              Start with proof. Scale with the operation.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg font-medium leading-8 text-[#53635f]">
              Run FleetLever free on your own fleet for 15 days. Choose an
              annual scope only when the evidence supports it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={trialHref}
                data-analytics="pricing_hero_trial"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white transition duration-200 hover:bg-[#006c74] active:translate-y-px"
              >
                Start free
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#plans"
                className="inline-flex min-h-12 items-center justify-center px-4 text-sm font-bold text-[#334641] transition hover:text-[#006c74]"
              >
                Compare annual plans
              </a>
            </div>
          </div>

          <article className="overflow-hidden rounded-lg border border-[#b9c9c3] bg-[#eff4f1] shadow-[0_24px_70px_rgba(16,61,55,0.12)]">
            <div className="grid bg-[#103d37] text-white sm:grid-cols-[0.72fr_1.28fr]">
              <div className="flex min-h-52 flex-col justify-between p-6 sm:p-7">
                <div>
                  <p className="text-xs font-bold uppercase text-[#9af6f7]">
                    Free trial
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight">
                    15 days on your actual fleet
                  </h2>
                </div>
                <div className="mt-7">
                  <p className="font-mono text-4xl font-semibold">Free</p>
                  <p className="mt-1 text-sm font-medium text-[#c7d7d2]">
                    no card, no installer, no sales call
                  </p>
                </div>
              </div>
              <div className="relative min-h-56 overflow-hidden border-t border-white/20 sm:min-h-0 sm:border-l sm:border-t-0">
                <Image
                  src="/fleetlever/site/tomorrow-readiness-dashboard.png"
                  alt="FleetLever readiness board used during the 15-day free trial"
                  fill
                  preload
                  sizes="(min-width: 1024px) 38vw, (min-width: 640px) 55vw, 100vw"
                  className="object-cover object-left"
                />
                <div className="absolute bottom-4 left-4 bg-white px-3 py-2 text-[11px] font-bold uppercase text-[#103d37] shadow-md">
                  Your own fleet
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {trialIncludes.map((item) => (
                  <p
                    key={item}
                    className="flex gap-3 text-sm font-semibold leading-6 text-[#334641]"
                  >
                    <Check
                      className="mt-1 h-4 w-4 shrink-0 text-[#16834b]"
                      aria-hidden="true"
                    />
                    {item}
                  </p>
                ))}
              </div>
              <div className="mt-6 grid gap-5 border-t border-[#c7d3ce] pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <p className="max-w-xl text-sm font-semibold leading-6 text-[#334641]">
                  Nothing to cancel and nothing to return. If FleetLever does
                  not earn its place in fifteen days, the trial simply ends.
                </p>
                <a
                  href={trialHref}
                  data-analytics="pricing_trial_start"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#0a777e] px-4 text-sm font-bold text-[#006c74] transition duration-200 hover:bg-[#006c74] hover:text-white active:translate-y-px"
                >
                  Start free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        className="bg-[#e8efeb] px-5 py-16 sm:px-7 lg:px-10 lg:py-24"
        id="plans"
      >
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-[#006c74]">
              Annual operating scopes
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Choose the footprint you operate today.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#53635f]">
              The platform stays consistent. Price changes with active assets,
              operating units and governance.
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={
                  "relative flex min-h-full flex-col overflow-hidden rounded-lg border bg-white p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(16,61,55,0.10)] sm:p-7 " +
                  (plan.featured
                    ? "border-[#0a777e] shadow-[0_14px_36px_rgba(16,61,55,0.10)]"
                    : "border-[#c4d0cb]")
                }
              >
                <div
                  className={
                    "absolute inset-x-0 top-0 h-1 " +
                    (plan.featured ? "bg-[#00aebe]" : "bg-[#d5dfda]")
                  }
                  aria-hidden="true"
                />
                <div className="min-h-28">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-[#006c74]">
                        {plan.descriptor}
                      </p>
                      <h3 className="mt-2 text-2xl font-semibold">{plan.name}</h3>
                    </div>
                    {plan.featured && (
                      <span className="shrink-0 bg-[#103d37] px-2 py-1 text-[10px] font-bold uppercase text-white">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#5c6f68]">
                    {plan.audience}
                  </p>
                </div>

                <div className="mt-5 min-h-28 border-t border-[#d7dfdb] pt-5">
                  <div className="flex flex-wrap items-end gap-x-2">
                    <p className="font-mono text-3xl font-semibold text-[#103d37]">
                      {plan.amount}
                    </p>
                    <p className="pb-1 text-sm font-bold text-[#53635f]">
                      {plan.cadence}
                    </p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-[#5c6f68]">
                    {plan.monthly}
                  </p>
                </div>

                <div className="mt-2 grid grid-cols-2 divide-x divide-[#d7dfdb] border-y border-[#d7dfdb]">
                  <div className="py-4 pr-4">
                    <p className="font-mono text-2xl font-semibold text-[#103d37]">
                      {plan.assetValue}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase text-[#60716b]">
                      {plan.assetLabel}
                    </p>
                  </div>
                  <div className="py-4 pl-4">
                    <p className="font-mono text-2xl font-semibold text-[#103d37]">
                      {plan.unitValue}
                    </p>
                    <p className="mt-1 text-xs font-bold uppercase text-[#60716b]">
                      {plan.unitLabel}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-sm font-bold text-[#006c74]">
                  {plan.scope}
                </p>
                <ul className="mt-5 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-sm font-semibold leading-6 text-[#334641]"
                    >
                      <Check
                        className="mt-1 h-4 w-4 shrink-0 text-[#16834b]"
                        aria-hidden="true"
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={requestDemoHref}
                  data-analytics={"pricing_" + plan.slug}
                  className={
                    "mt-7 inline-flex min-h-11 items-center justify-between gap-2 rounded-md px-4 text-sm font-bold transition duration-200 active:translate-y-px " +
                    (plan.featured
                      ? "bg-[#103d37] text-white hover:bg-[#006c74]"
                      : "border border-[#afc2ba] text-[#103d37] hover:border-[#006c74] hover:text-[#006c74]")
                  }
                >
                  Discuss this scope
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-[#c4d0cb] bg-white p-6 sm:p-7">
            <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase text-[#006c74]">
                  Included in every annual plan
                </p>
                <p className="mt-2 text-sm font-medium leading-6 text-[#53635f]">
                  The core release-control loop is not split into add-ons.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {sharedCapabilities.map((capability) => (
                  <p
                    key={capability}
                    className="flex gap-2.5 text-sm font-semibold text-[#334641]"
                  >
                    <Check
                      className="h-4 w-4 shrink-0 text-[#16834b]"
                      aria-hidden="true"
                    />
                    {capability}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d7dfdb] bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-[#006c74]">
              What changes the price
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Launch once. Expand when the operation does.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#53635f]">
              No marketplace of small add-ons. Only implementation, added
              operating scope and clearly defined custom work.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-[#c4d0cb] md:grid md:grid-cols-3 md:divide-x md:divide-[#c4d0cb]">
            {priceDrivers.map((driver) => {
              const Icon = driver.icon;
              return (
                <article
                  key={driver.title}
                  className="border-b border-[#c4d0cb] bg-[#f6f8f6] p-6 last:border-b-0 md:border-b-0 sm:p-7"
                >
                  <Icon
                    className="h-6 w-6 text-[#006c74]"
                    aria-hidden="true"
                  />
                  <p className="mt-6 text-xs font-bold uppercase text-[#006c74]">
                    {driver.subtitle}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold">{driver.title}</h3>
                  <p className="mt-3 min-h-12 text-sm font-medium leading-6 text-[#53635f]">
                    {driver.description}
                  </p>
                  <dl className="mt-6 border-t border-[#c4d0cb]">
                    {driver.entries.map(([label, value]) => (
                      <div
                        key={label}
                        className="border-b border-[#d7dfdb] py-4 last:border-b-0"
                      >
                        <dt className="text-sm font-semibold">{label}</dt>
                        <dd className="mt-1 font-mono text-sm font-semibold text-[#103d37]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#edf2ee] px-5 py-16 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <FileCheck2
              className="h-7 w-7 text-[#006c74]"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-semibold leading-tight">
              Commercial terms
            </h2>
            <div className="mt-6 grid border-l border-t border-[#bdcbc5] sm:grid-cols-2">
              {commercialTerms.map(([title, body]) => (
                <div
                  key={title}
                  className="min-h-28 border-b border-r border-[#bdcbc5] bg-white p-4"
                >
                  <p className="text-xs font-bold uppercase text-[#006c74]">
                    {title}
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#334641]">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <UsersRound
              className="h-7 w-7 text-[#006c74]"
              aria-hidden="true"
            />
            <h2 className="mt-5 text-3xl font-semibold leading-tight">
              Common questions
            </h2>
            <div className="mt-6 border-t border-[#bdcbc5]">
              {faqs.map(([question, answer]) => (
                <details
                  key={question}
                  className="group border-b border-[#bdcbc5]"
                >
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 py-4 text-base font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006c74] [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-[#006c74] transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="max-w-2xl pb-5 pr-10 text-sm font-medium leading-6 text-[#53635f]">
                    {answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#071b18] px-5 py-16 text-white sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <Gauge className="h-7 w-7 text-[#9af6f7]" aria-hidden="true" />
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Put one live release flow through the trial.
            </h2>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[#c7d7d2]">
              Load your own fleet, measure the result, then decide whether an
              annual deployment earns its place.
            </p>
          </div>
          <a
            href={trialHref}
            data-analytics="pricing_final_trial"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition duration-200 hover:bg-white active:translate-y-px"
          >
            Start free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <CommercialSiteFooter />
    </main>
  );
}
