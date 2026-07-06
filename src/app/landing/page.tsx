import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  UserCheck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

const mailtoPilot = "mailto:hello@fleetlever.com?subject=FleetLever no-proof-no-release pilot";

const navLinks = [
  ["Release control", "#release-board"],
  ["Proof capture", "#proof-capture"],
  ["Pilot", "#pilot"],
  ["Pricing", "/pricing"],
] as const;

const morningProblems = [
  ["The machine left the yard.", "But nobody had the release proof pack."],
  ["The operator sent photos.", "But they disappeared inside WhatsApp."],
  ["The supervisor found a defect.", "But only after the morning dispatch had started."],
] as const;

const boardStatuses = [
  ["Ready", "CAT 320 Excavator", "All proof photos, checklist, and approval complete.", "border-emerald-200 bg-emerald-50 text-emerald-800"],
  ["Needs review", "JCB 3CX Backhoe Loader", "Attachment photo missing from the handover.", "border-amber-200 bg-amber-50 text-amber-800"],
  ["Blocked", "Volvo L120 Wheel Loader", "Leak defect reported and awaiting supervisor decision.", "border-red-200 bg-red-50 text-red-800"],
  ["Released with exception", "Bobcat S650 Skid Steer", "Cosmetic damage accepted with note and photo proof.", "border-orange-200 bg-orange-50 text-orange-800"],
  ["Proof missing", "Manitou MT 1840 Telehandler", "Hour meter photo absent.", "border-sky-200 bg-sky-50 text-sky-800"],
] as const;

const proofSlots = [
  "Front view",
  "Rear view",
  "Left side",
  "Right side",
  "Hour meter",
  "Attachment",
  "Visible damage",
  "Fuel / battery",
  "Yard context",
] as const;

const rules = [
  "Missing required photos",
  "Damage photo conflicts with checklist",
  "Defect reported without supervisor review",
  "Hour meter photo missing",
  "Attachment required without attachment proof",
  "Unresolved defect from previous handover",
] as const;

const pilotItems = [
  "Setup of real machines",
  "Custom checklist templates",
  "Required photo rules",
  "Operator and supervisor onboarding",
  "Real handovers for 2-3 weeks",
  "End-of-pilot readiness report",
] as const;

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/94 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="FleetLever home" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
          <FleetLeverLogo />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
          {navLinks.map(([label, href]) => (
            <Link key={label} href={href} className="text-sm font-semibold text-slate-600 transition hover:text-sky-700">
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-600 hover:text-sky-700 sm:inline-flex"
          >
            Login
          </Link>
          <a
            href={mailtoPilot}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            Run a pilot
          </a>
        </div>
      </div>
    </header>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-bold uppercase tracking-normal text-sky-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">{title}</h2>
      <p className="mt-4 text-lg font-medium leading-8 text-slate-600">{body}</p>
    </div>
  );
}

function BrowserFrame({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.16)]">
      <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        <span className="ml-3 h-3 flex-1 rounded-full bg-slate-200" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={3840}
        height={2400}
        priority={priority}
        className="h-auto w-full"
        sizes="(min-width: 1024px) 58vw, 100vw"
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#eef1f3] text-slate-950">
      <Header />

      <section className="bg-white px-5 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
	            <p className="text-sm font-bold uppercase tracking-normal text-sky-700">Construction equipment release control</p>
	            <h1 className="mt-4 text-4xl font-semibold leading-[1.02] text-slate-950 sm:text-6xl">
	              No proof. No release.
	            </h1>
	            <p className="mt-6 max-w-2xl text-xl font-medium leading-8 text-slate-600">
	              FleetLever stops unapproved machines from going out tomorrow by locking every release to proof photos, defects, and a supervisor decision.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailtoPilot}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-sky-700 px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(3,105,161,0.22)] transition hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Run a 21-day readiness pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                href="/console"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-sky-600 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
              >
                Open the release board
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
	              {["Locked releases", "Official proof packs", "Supervisor decisions"].map((item) => (
                <div key={item} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div>
            <BrowserFrame
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt="FleetLever release board showing ready, blocked, needs review and proof missing machines"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fafc] px-5 py-20 sm:px-6 lg:px-8" id="problem">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <SectionHeader
            eyebrow="The morning problem"
            title="Stop discovering machine problems at 7:00 AM."
            body="Most systems record inspections after the fact. FleetLever exists to answer one operational question the night before: which machines are actually allowed to work tomorrow?"
          />
          <div className="grid gap-4">
            {morningProblems.map(([assumption, reality]) => (
              <article key={assumption} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-lg font-semibold text-slate-950">{assumption}</p>
                <p className="mt-2 text-lg font-semibold text-red-700">{reality}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-6 lg:px-8" id="release-board">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1fr] lg:items-end">
            <SectionHeader
              eyebrow="The release board"
              title="One first screen for every release decision."
              body="The board does not ask teams to browse records. It shows whether each machine is ready, blocked, missing proof, or waiting for a supervisor."
            />
            <p className="text-lg font-semibold leading-8 text-slate-600">
	              Competitors help you record what happened. FleetLever controls whether the machine is allowed to move.
            </p>
          </div>
          <div className="mt-10 grid gap-3">
            {boardStatuses.map(([status, machine, reason, style]) => (
              <article key={machine} className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[12rem_1fr_1.5fr] md:items-center">
                <span className={`inline-flex min-h-8 w-fit items-center rounded-full border px-3 text-sm font-bold ${style}`}>{status}</span>
                <p className="text-lg font-semibold text-slate-950">{machine}</p>
                <p className="text-sm font-medium leading-6 text-slate-600">{reason}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#10201e] px-5 py-20 text-white sm:px-6 lg:px-8" id="proof-capture">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-sky-300">Operator proof capture</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
	              Scan, capture only what is missing, and lock the release.
            </h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-300">
	              Operators scan a machine, capture only the missing required photos, complete checks, and create the proof pack before a release decision is possible.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {proofSlots.map((slot) => (
              <div key={slot} className="flex min-h-16 items-center gap-3 rounded-lg border border-white/12 bg-white/8 p-4 text-sm font-bold text-white">
                <Camera className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
                {slot}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-2">
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <UserCheck className="h-8 w-8 text-sky-700" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold text-slate-950">Supervisor release control</h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Flagged handovers enter a review queue. Supervisors release, block, or release with exception, and FleetLever records who made the decision.
            </p>
            <div className="mt-5 grid gap-2">
              {["Release", "Block", "Release with exception"].map((item) => (
                <div key={item} className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-sky-700" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <Wrench className="h-8 w-8 text-red-700" aria-hidden="true" />
            <h2 className="mt-5 text-3xl font-semibold text-slate-950">Defects and exceptions stay attached.</h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Leak defects, unresolved issues, cosmetic damage, and exception notes become part of the machine history instead of living in scattered messages.
            </p>
            <div className="mt-5 grid gap-2">
              {["Open defect", "Acknowledged damage", "Resolved issue"].map((item) => (
                <div key={item} className="flex min-h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
                  <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#f8fafc] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Rule review first"
              title="Deterministic checks before any AI story."
              body="For the MVP, FleetLever uses simple rules to catch missing proof, contradictions, unresolved defects, and risky submissions."
            />
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {rules.map((rule) => (
                <div key={rule} className="flex min-h-12 items-center gap-3 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 shadow-sm">
                  <ClipboardCheck className="h-4 w-4 shrink-0 text-sky-700" aria-hidden="true" />
                  {rule}
                </div>
              ))}
            </div>
          </div>
          <BrowserFrame
            src="/fleetlever/site/decision-history-audit-trail.png"
            alt="FleetLever decision history showing proof, blocked machines, owners and release decisions"
          />
        </div>
      </section>

      <section className="bg-white px-5 py-20 sm:px-6 lg:px-8" id="pilot">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-sky-700">Service-led offer</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Start with a 21-day machine readiness pilot.
            </h2>
            <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
              Do not start as pure SaaS. Start with real machines, real handovers, real operators, and a report that proves whether FleetLever reduces morning chaos.
            </p>
            <a
              href={mailtoPilot}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
            >
              Run a 21-day readiness pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {pilotItems.map((item) => (
              <div key={item} className="flex min-h-16 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#10201e] px-5 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-sky-300">Before tomorrow starts</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight sm:text-5xl">
              Know tonight what machines are allowed to work tomorrow.
            </h2>
            <p className="mt-4 max-w-2xl text-lg font-medium leading-8 text-slate-300">
              No proof, no release. No supervisor decision, no confusion.
            </p>
          </div>
          <a
            href={mailtoPilot}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-sky-300 px-5 text-sm font-bold text-[#10201e] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#10201e]"
          >
            Start the pilot
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FleetLeverLogo />
            <p className="mt-3 text-sm font-semibold text-slate-600">Machine readiness proof system for construction and rental fleets.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-600">
            <Link href="#release-board" className="hover:text-sky-700">Release board</Link>
            <Link href="/pricing" className="hover:text-sky-700">Pricing</Link>
            <a href={mailtoPilot} className="hover:text-sky-700">Pilot</a>
            <a href="mailto:hello@fleetlever.com" className="hover:text-sky-700">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
