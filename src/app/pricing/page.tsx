import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, CircleHelp, Euro, FileText, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "FleetLever pricing for no-proof-no-release pilots and monthly construction equipment release-control plans.",
  alternates: {
    canonical: "/pricing",
  },
};

const mailtoPilot = "mailto:hello@fleetlever.com?subject=FleetLever no-proof-no-release pilot";
const mailtoPricing = "mailto:hello@fleetlever.com?subject=FleetLever pricing call";

const pilotBands = [
  {
    name: "Starter release pilot",
    range: "€750 - €1,500",
    detail: "Roughly 20-40 machines, one yard, QR setup, and the tomorrow release board.",
  },
  {
    name: "Core paid pilot",
    range: "€1,500 - €3,000",
    detail: "Roughly 50-100 machines, supervisor queue, rental bay or yard team onboarding.",
  },
  {
    name: "Multi-site pilot",
    range: "From €3,000",
    detail: "Multiple sites, more users, proof-pack reporting, and workflow cleanup.",
  },
] as const;

const pilotIncludes = [
  "Setup of machines",
  "Custom checklist templates",
  "Required photo rules",
  "Operator and supervisor onboarding",
  "Real handovers for 2-3 weeks",
  "End-of-pilot readiness report",
] as const;

const monthlyPlans = [
  {
    name: "Yard release board",
    price: "€750 - €1,250/month",
    detail: "For one yard that needs proof, release locks, and supervisor decisions before tomorrow.",
    items: ["Tomorrow release board", "QR proof capture", "Supervisor release queue", "Machine proof packs"],
  },
  {
    name: "Contractor or rental team",
    price: "€1,000 - €2,000/month",
    detail: "For teams with daily handovers, damage disputes, missed proof, and morning dispatch pressure.",
    items: ["Everything in Yard release board", "Return-check workflow", "Release-with-note audit trail", "Priority onboarding"],
  },
  {
    name: "Larger operation",
    price: "From €2,500/month",
    detail: "For multi-site operations that need more reporting, admins, integrations, and rollout support.",
    items: ["Advanced reporting", "Custom workflows", "Integration planning", "Dedicated rollout support"],
  },
] as const;

const faqs = [
  [
    "Is FleetLever fleet management software?",
    "No. FleetLever starts as a machine readiness proof system. It is focused on release decisions, proof photos, defects, and approvals before work starts.",
  ],
  [
    "Why start with a pilot instead of pure SaaS?",
    "Because the value is operational. A 21-day pilot proves whether FleetLever reduces morning chaos with real machines, real operators, and real handovers.",
  ],
  [
    "What changes the price?",
    "Fleet size, number of sites, onboarding complexity, reporting depth, data cleanup, and integration needs.",
  ],
  [
    "Do we need GPS or telematics?",
    "No. FleetLever does not require GPS hardware to prove whether a machine is allowed to work tomorrow.",
  ],
] as const;

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/94 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="FleetLever home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
          <FleetLeverLogo />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          <Link href="/#release-board" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">Release board</Link>
          <Link href="/#proof-capture" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">Proof capture</Link>
          <Link href="/#pilot" className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">Pilot</Link>
          <Link href="/pricing" className="text-sm font-semibold text-sky-700">Pricing</Link>
        </nav>
        <a
          href={mailtoPilot}
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
        >
          Run a pilot
        </a>
      </div>
    </header>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#eef1f3] text-slate-950">
      <Header />

      <section className="bg-white px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-sky-700">FleetLever pricing</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] text-slate-950 sm:text-6xl">
	              Prove no-proof-no-release before buying software.
            </h1>
            <p className="mt-6 max-w-2xl text-xl font-medium leading-8 text-slate-600">
	              Start with a focused 21-day pilot. If FleetLever catches missing proof, bad releases, or blocked machines before morning, continue monthly.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailtoPilot}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-sky-700 px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(3,105,161,0.22)] transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Run a 21-day readiness pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#monthly"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-600 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                See monthly bands
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
            <div className="relative aspect-[16/10]">
              <Image
                src="/fleetlever/site/tomorrow-readiness-dashboard.png"
                alt="FleetLever release board for machine readiness"
                fill
                priority
                className="object-cover object-left-top"
                sizes="(min-width: 1024px) 54vw, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#10201e] px-5 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-sky-300">Why the pilot exists</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
	              One prevented bad release can pay for the pilot.
            </h2>
          </div>
          <div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-slate-300">
	              The selling conversation is not about forms. It is about official proof, release authority, blocked machines, and avoiding 7:00 AM surprises.
            </p>
            <div className="mt-6 rounded-lg border border-white/12 bg-white/8 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="flex items-start gap-4">
                  <Euro className="mt-1 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
                  <div>
	                    <p className="text-sm font-bold uppercase text-amber-200">A bad release</p>
	                    <p className="mt-2 text-3xl font-semibold">can cost more than a month</p>
                  </div>
                </div>
                <div className="hidden h-14 w-px bg-white/18 md:block" aria-hidden="true" />
                <div className="flex items-start gap-4">
                  <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
                  <div>
	                    <p className="text-sm font-bold uppercase text-sky-300">21-day pilot</p>
	                    <p className="mt-2 text-3xl font-semibold">From €750</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8fafc] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-10 grid gap-5 lg:grid-cols-[0.82fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-sky-700">21-day pilot</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                Start with real machines, not slideware.
              </h2>
            </div>
            <p className="max-w-3xl text-lg font-medium leading-8 text-slate-600">
              Pilot pricing depends on fleet size, setup complexity, data cleanup, number of users, sites, and reporting requirements.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {pilotBands.map((band) => (
              <article key={band.name} className="flex min-h-72 flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <FileText className="h-7 w-7 text-sky-700" aria-hidden="true" />
                <h3 className="mt-5 text-2xl font-semibold text-slate-950">{band.name}</h3>
                <p className="mt-4 text-4xl font-semibold text-slate-950">{band.range}</p>
                <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{band.detail}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase text-sky-700">Pilot includes</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pilotIncludes.map((item) => (
                <div key={item} className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-6 lg:px-8" id="monthly">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-sky-700">After the pilot</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Monthly pricing follows operational load.
            </h2>
            <p className="mt-4 text-lg font-medium leading-8 text-slate-600">
              Plans are sized around machines, sites, users, reporting, and integrations, not a generic seat count.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {monthlyPlans.map((plan) => (
              <article key={plan.name} className="flex min-h-[28rem] flex-col rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase text-sky-700">{plan.name}</p>
                <h3 className="mt-3 text-3xl font-semibold text-slate-950">{plan.price}</h3>
                <p className="mt-4 text-sm font-medium leading-6 text-slate-600">{plan.detail}</p>
                <div className="mt-6 grid gap-2">
                  {plan.items.map((item) => (
                    <div key={item} className="flex gap-3 text-sm font-semibold leading-6 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-700" aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-auto pt-7">
                  <a
                    href={mailtoPricing}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                  >
                    Discuss this band
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-500">All prices exclude VAT where applicable.</p>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fafc] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-normal text-sky-700">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
            What buyers usually ask first.
          </h2>
          <div className="mt-8 grid gap-3">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex gap-3">
                  <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-sky-700" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{question}</h3>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#10201e] px-5 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-sky-300">Before you choose a plan</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl">
              Run FleetLever against tomorrow&apos;s machines.
            </h2>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-300">
              The pilot proves whether the release board catches missing proof, defects, and approvals before machines move.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:min-w-64 lg:flex-col">
            <a
              href={mailtoPilot}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-sky-300 px-5 text-sm font-bold text-[#10201e] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10201e]"
            >
              Run a 21-day pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={mailtoPricing}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/18 bg-white/8 px-5 text-sm font-bold text-white transition hover:border-sky-300 hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10201e]"
            >
              Talk through pricing
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FleetLeverLogo />
            <p className="mt-3 text-sm font-semibold text-slate-600">Machine readiness proof system for construction and rental fleets.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
            <Link href="/#release-board" className="hover:text-sky-700">Release board</Link>
            <Link href="/pricing" className="hover:text-sky-700">Pricing</Link>
            <a href={mailtoPilot} className="hover:text-sky-700">Pilot</a>
            <a href="mailto:hello@fleetlever.com" className="hover:text-sky-700">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
