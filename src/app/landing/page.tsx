import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  HardHat,
  History,
  Mail,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

const heroRows = [
  {
    code: "CR-04",
    machine: "Mobile crane",
    status: "Cannot Be Released",
    detail: "Certificate expired",
    tone: "blocked",
    progress: 36,
  },
  {
    code: "EX-12",
    machine: "Excavator",
    status: "Ready For Work",
    detail: "Service completed",
    tone: "ready",
    progress: 100,
  },
  {
    code: "TR-08",
    machine: "Heavy truck",
    status: "Needs Attention",
    detail: "Inspection due in 3 days",
    tone: "attention",
    progress: 72,
  },
];

const proofPoints = [
  {
    icon: HardHat,
    title: "Worksite first",
    body: "Start with tomorrow's job, then see which machines can actually be released.",
  },
  {
    icon: BadgeCheck,
    title: "Release For Work",
    body: "A clear operational gate before a machine reaches the programme.",
  },
  {
    icon: ShieldAlert,
    title: "Why blocked",
    body: "Reason, owner, action and ETA are visible without searching through files.",
  },
];

const productSurfaces = [
  {
    icon: CalendarClock,
    title: "Tomorrow's Work Planner",
    body: "Every day starts from the worksite: what is needed, what is ready, and what will block the crew.",
  },
  {
    icon: BadgeCheck,
    title: "Release For Work",
    body: "FleetLever turns documents, service and open issues into one release decision.",
  },
  {
    icon: FileText,
    title: "Machine Passport",
    body: "The machine's documents, certificates, service notes and photos stay in one operational record.",
  },
  {
    icon: History,
    title: "Release History",
    body: "A simple record of what was released, what was blocked, why, and when the decision changed.",
  },
];

function toneClasses(tone: string) {
  if (tone === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "attention") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-red-200 bg-red-50 text-red-800";
}

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f2] text-[#13211f]">
      <header className="relative z-20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-6 lg:px-8">
          <Link
            href="/landing"
            aria-label="FleetLever αρχική"
            className="rounded-md px-1 py-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89]"
          >
            <span className="sm:hidden">
              <FleetLeverLogo compact />
            </span>
            <span className="hidden sm:block">
              <FleetLeverLogo />
            </span>
          </Link>
          <nav aria-label="Κύρια πλοήγηση" className="flex items-center gap-2">
            <a
              href="mailto:hello@fleetlever.gr?subject=FleetLever"
              className="hidden min-h-11 items-center rounded-md border border-[#cfdcd6] bg-white px-4 text-sm font-semibold text-[#263b37] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] sm:inline-flex"
            >
              Μίλησε μαζί μας
            </a>
            <Link
              href="/console"
              className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md bg-[#102b27] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
            >
              Άνοιγμα prototype
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-5 pb-12 pt-6 sm:px-6 sm:pt-10 lg:px-8 lg:pb-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">
              Construction teams · machines · worksites
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] text-[#13211f] sm:mt-5 sm:text-6xl lg:text-7xl">
              Prevent Expensive Construction Downtime
            </h1>
            <p className="mt-5 max-w-xl text-xl font-medium leading-8 text-[#263b37] sm:mt-6 sm:text-2xl sm:leading-9">
              Know exactly what will stop tomorrow&apos;s work before it happens.
            </p>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#52645f] sm:mt-5 sm:text-lg sm:leading-8">
              FleetLever is the operational gate construction companies use
              before releasing machines to tomorrow&apos;s worksite.
            </p>
            <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:mt-8 sm:w-auto sm:max-w-none sm:flex-row">
              <Link
                href="/console"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00aebe] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,174,190,0.18)] transition hover:bg-[#0794a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
              >
                Δες το prototype
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="mailto:hello@fleetlever.gr?subject=FleetLever"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#c9d9d2] bg-white px-5 py-3 text-sm font-semibold text-[#263b37] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
              >
                Μίλησε μαζί μας
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-[#ccd9d3] bg-white p-4 shadow-[0_30px_90px_rgba(19,33,31,0.14)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dfe8e3] pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-[#007C89]">
                    Tomorrow&apos;s Work Planner
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#13211f]">Athens Metro · 07:00</h2>
                </div>
                <span className="inline-flex min-h-9 items-center rounded-full border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-800">
                  1 blocker
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  ["Ready For Work", "31", "bg-emerald-50 text-emerald-800"],
                  ["Needs Attention", "4", "bg-amber-50 text-amber-800"],
                  ["Cannot Be Released", "2", "bg-red-50 text-red-800"],
                ].map(([label, value, classes]) => (
                  <div key={label} className={`rounded-md border border-white p-4 ${classes}`}>
                    <p className="text-xs font-semibold">{label}</p>
                    <p className="mt-2 text-3xl font-semibold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-3">
                {heroRows.map((row) => (
                  <div key={row.code} className="rounded-lg border border-[#d6e2dd] bg-[#fbfaf6] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[#13211f]">
                          {row.code} · {row.machine}
                        </p>
                        <div className="mt-3 h-2 w-48 max-w-full rounded-full bg-[#e3ebe7]">
                          <div
                            className="h-2 rounded-full bg-[#00aebe]"
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className={`inline-flex min-h-8 items-center rounded-full border px-3 text-xs font-semibold ${toneClasses(row.tone)}`}>
                        {row.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-[#52645f]">{row.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-red-200 bg-white p-4 shadow-[0_18px_45px_rgba(19,33,31,0.12)] lg:absolute lg:-bottom-8 lg:-left-8 lg:max-w-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-red-50 p-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-red-700">Why blocked</p>
                  <h3 className="mt-1 text-xl font-semibold text-[#13211f]">CR-04 cannot be released</h3>
                  <p className="mt-2 text-sm leading-6 text-[#52645f]">
                    Certificate expired. Owner: Dimitris. Action: book inspection. ETA: 2 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#d6e2dd] bg-[#fbfaf6] px-5 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 lg:grid-cols-3">
          {proofPoints.map((point) => (
            <article key={point.title} className="grid gap-4 rounded-lg border border-[#d6e2dd] bg-white p-5 sm:grid-cols-[2rem_1fr]">
              <point.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-[#13211f]">{point.title}</h2>
                <p className="mt-2 text-base leading-7 text-[#52645f]">{point.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">
              The product
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Release For Work is the decision. Everything else supports it.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-4">
            {productSurfaces.map((item) => (
              <article key={item.title} className="rounded-lg border border-[#d6e2dd] bg-white p-5 shadow-sm">
                <item.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-semibold leading-7 text-[#13211f]">{item.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#52645f]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#79d9e3]">
              What changed since yesterday?
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Operations managers care about change, not another dashboard.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#cfe0dc]">
              FleetLever highlights the movement that matters: which blockers
              closed, which machines became available, and what still needs an owner.
            </p>
          </div>
          <div className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-white/10 p-4">
                <p className="text-sm font-semibold text-white/72">Yesterday blocked</p>
                <p className="mt-2 text-4xl font-semibold">5</p>
              </div>
              <div className="rounded-md bg-white p-4 text-[#13211f]">
                <p className="text-sm font-semibold text-[#52645f]">Today blocked</p>
                <p className="mt-2 text-4xl font-semibold">3</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {["CR-04 certificate renewed", "EX-12 service completed"].map((change) => (
                <div key={change} className="flex items-center gap-3 rounded-md bg-white px-4 py-3 text-sm font-semibold text-[#13211f]">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                  {change}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-lg border border-[#c9d9d2] bg-[#f9fbf8] p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#007C89]">
              <Mail className="h-4 w-4" aria-hidden="true" />
              Daily Morning Report
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Start tomorrow with the release list, the blockers, and the owner for each fix.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/console"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#102b27] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
            >
              Άνοιγμα prototype
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="mailto:hello@fleetlever.gr?subject=FleetLever"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#c9d9d2] bg-white px-5 py-3 text-sm font-semibold text-[#263b37] transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
            >
              Μίλησε μαζί μας
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
