import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleHelp,
  Clock,
  Euro,
  FileText,
  Handshake,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

export const metadata: Metadata = {
  title: "Τιμές",
  description:
    "Τιμολόγηση FleetLever για paid pilot, μηνιαία SaaS πλάνα, onboarding και add-ons για ομάδες με μηχανήματα έργου.",
  alternates: {
    canonical: "/pricing",
  },
};

const mailtoPilot = "mailto:hello@fleetlever.com?subject=FleetLever paid pilot";

const plans = [
  {
    name: "Paid Pilot",
    price: "€1.000",
    cadence: "fixed",
    label: "30 ημέρες",
    intro: "Απόδειξη αξίας με τα πραγματικά μηχανήματα, έγγραφα και blockers της ομάδας σας.",
    bestFor: "Ομάδες που θέλουν να δοκιμάσουν FleetLever πριν περάσουν σε μηνιαίο πλάνο.",
    cta: "Start Paid Pilot",
    featured: true,
    includes: [
      "1 company workspace",
      "Έως 30 κρίσιμα assets/machines",
      "Έως 100 key documents/deadlines",
      "1 readiness workflow",
      "Έως 3 χρήστες",
      "Kickoff call και review call",
      "Basic import από FleetLever template",
      "End-of-pilot recommendation",
    ],
  },
  {
    name: "Starter",
    price: "€499",
    cadence: "/μήνα",
    label: "Μετά το pilot",
    intro: "Για μικρές ομάδες που χρειάζονται έναν ήρεμο καθημερινό readiness έλεγχο.",
    bestFor: "Κατασκευαστικές, γερανοί, ενοικιάσεις και equipment teams έως 30 critical machines.",
    cta: "Choose Starter",
    featured: false,
    includes: [
      "Tomorrow readiness board",
      "Machine passports",
      "Document and certificate tracking",
      "Service blockers",
      "Blocker owner assignment",
      "Decision history",
      "Basic exports",
      "Έως 5 χρήστες",
    ],
  },
  {
    name: "Operations",
    price: "€999",
    cadence: "/μήνα",
    label: "Για περισσότερη πίεση",
    intro: "Για ομάδες με περισσότερα εργοτάξια, περισσότερα assets και πιο απαιτητική καθημερινή λειτουργία.",
    bestFor: "Growing teams που θέλουν μεγαλύτερο operational control και priority support.",
    cta: "Choose Operations",
    featured: false,
    includes: [
      "Έως 100 critical assets/machines",
      "Multiple worksites or yards",
      "Everything in Starter",
      "Advanced readiness workflows",
      "Detailed blocker tracking",
      "Priority onboarding",
      "Advanced exports",
      "Monthly readiness review",
    ],
  },
  {
    name: "Custom",
    price: "Custom",
    cadence: "quote",
    label: "100+ assets",
    intro: "Για larger operators, mixed fleets, branches, integrations ή complex reporting requirements.",
    bestFor: "Μεγαλύτερες ομάδες με ειδικές διαδικασίες, permissions, reporting ή integration planning.",
    cta: "Request Custom Quote",
    featured: false,
    includes: [
      "100+ assets",
      "Custom workflows",
      "Custom reports",
      "Advanced permissions",
      "Multiple departments/branches",
      "Integration planning",
      "SLA options",
      "Security/compliance review support",
    ],
  },
] as const;

const comparisonRows = [
  ["Value metric", "Pilot scope", "Up to 30 machines", "Up to 100 machines", "Custom scope"],
  ["Workflows", "1 readiness workflow", "Daily readiness board", "Advanced workflows", "Custom workflows"],
  ["Users", "Up to 3", "Up to 5", "More users", "Custom permissions"],
  ["Support", "2 setup calls", "Email support", "Priority support", "SLA options"],
  ["Best next step", "Prove value", "Run daily checks", "Scale across sites", "Plan complex rollout"],
] as const;

const onboardingItems = [
  {
    icon: CalendarDays,
    title: "Focused kickoff",
    body: "Ορίζουμε ποια δουλειά, ποια μηχανήματα και ποιο workflow θα αποδείξει αξία πρώτα.",
  },
  {
    icon: FileText,
    title: "Template import",
    body: "Η ομάδα σας δίνει δεδομένα με FleetLever template. Εμείς στήνουμε το agreed pilot scope.",
  },
  {
    icon: ShieldCheck,
    title: "Readiness configuration",
    body: "Certificates, reminders, service blockers, owners και decision history μπαίνουν στη σωστή ροή.",
  },
  {
    icon: Handshake,
    title: "Pilot recommendation",
    body: "Στο τέλος ξέρετε αν συνεχίζετε σε Starter, Operations ή Custom, χωρίς ασαφή δέσμευση.",
  },
] as const;

const addOns = [
  ["Extra onboarding / data cleanup", "€300-€1.500 one-time", "Για messy, incomplete ή large unstructured data."],
  ["Additional asset setup", "€5-€10 per asset", "Όταν θέλετε περισσότερα assets στο onboarding scope."],
  ["Additional document cleanup", "€100-€300 per batch", "Για μεγάλες παρτίδες εγγράφων που χρειάζονται sorting ή mapping."],
  ["Custom workflow/report", "Quoted separately", "Για workflow ή report έξω από το standard setup."],
  ["OCR / extraction pack", "Optional future add-on", "Για document extraction σε μεγαλύτερο όγκο."],
  ["Telematics / GPS integration", "Quoted separately", "Δεν περιλαμβάνεται by default."],
] as const;

const faqs = [
  [
    "Είναι το FleetLever GPS tracking;",
    "Όχι. Το FleetLever δεν είναι GPS tracking. Εστιάζει σε readiness, documents, certificates, inspections, service blockers και operational decisions πριν δεσμευτεί η δουλειά.",
  ],
  [
    "Περιλαμβάνεται onboarding στο pilot;",
    "Ναι, μέσα σε καθαρό scope: έως 30 assets, έως 100 key documents/deadlines, ένα readiness workflow και δύο calls.",
  ],
  [
    "Ποιος δίνει τα δεδομένα;",
    "Ο πελάτης δίνει τα δεδομένα με FleetLever import template. Το FleetLever configures/imports το agreed pilot scope.",
  ],
  [
    "Τι γίνεται αν τα δεδομένα μας είναι messy;",
    "Το pilot περιλαμβάνει basic import support. Μεγαλύτερο cleanup, unstructured folders ή heavy document organization χρεώνονται ξεχωριστά.",
  ],
  [
    "Χρειάζεται annual contract;",
    "Όχι. Monthly billing είναι διαθέσιμο. Annual billing δίνει 10% discount.",
  ],
  [
    "Μπορούμε να πληρώσουμε με τιμολόγιο;",
    "Ναι. Manual invoice/payment υποστηρίζεται για Greek B2B customers. Όλες οι τιμές είναι excluding VAT.",
  ],
] as const;

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dbe2de] bg-[#f4f3ef]/92 backdrop-blur">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Αρχική FleetLever" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe]">
          <FleetLeverLogo />
        </Link>
        <nav aria-label="Κύρια πλοήγηση" className="hidden items-center gap-6 lg:flex">
          <Link href="/#how-it-works" className="text-sm font-semibold text-[#4d5f5a] transition hover:text-[#007C89]">Πώς λειτουργεί</Link>
          <Link href="/#product" className="text-sm font-semibold text-[#4d5f5a] transition hover:text-[#007C89]">Προϊόν</Link>
          <Link href="/#use-cases" className="text-sm font-semibold text-[#4d5f5a] transition hover:text-[#007C89]">Χρήσεις</Link>
          <Link href="/pricing" className="text-sm font-semibold text-[#007C89]">Τιμές</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-11 items-center rounded-md border border-[#cdd8d3] bg-white px-4 text-sm font-semibold text-[#243834] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] sm:inline-flex"
          >
            Σύνδεση
          </Link>
          <a
            href={mailtoPilot}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#102b27] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
          >
            Ζητήστε demo
          </a>
        </div>
      </div>
    </header>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-[#d5dfda] bg-white px-3 py-1 text-xs font-bold uppercase text-[#53635f]">
      {children}
    </span>
  );
}

function PricePlanCard({ plan }: { plan: (typeof plans)[number] }) {
  return (
    <article className={`flex h-full flex-col rounded-lg border p-6 shadow-sm ${
      plan.featured
        ? "border-[#72dce5] bg-[#102b27] text-white shadow-[0_28px_90px_rgba(19,33,31,0.24)]"
        : "border-[#d5dfda] bg-white text-[#13211f]"
    }`}>
      <div className="flex items-center justify-between gap-4">
        <p className={`text-sm font-bold uppercase ${plan.featured ? "text-[#72dce5]" : "text-[#007C89]"}`}>{plan.name}</p>
        <Pill>{plan.label}</Pill>
      </div>
      <div className="mt-5 flex items-end gap-2">
        <h3 className="text-4xl font-semibold leading-none">{plan.price}</h3>
        <span className={`pb-1 text-sm font-bold ${plan.featured ? "text-[#c9d8d4]" : "text-[#65766f]"}`}>{plan.cadence}</span>
      </div>
      <p className={`mt-5 text-base font-semibold leading-7 ${plan.featured ? "text-[#dff3ef]" : "text-[#53635f]"}`}>{plan.intro}</p>
      <p className={`mt-4 text-sm font-bold leading-6 ${plan.featured ? "text-[#72dce5]" : "text-[#007C89]"}`}>{plan.bestFor}</p>
      <ul className="mt-6 space-y-3">
        {plan.includes.map((item) => (
          <li key={item} className={`flex gap-3 text-sm font-semibold leading-6 ${plan.featured ? "text-[#eef7f4]" : "text-[#334641]"}`}>
            <BadgeCheck className={`mt-0.5 h-5 w-5 shrink-0 ${plan.featured ? "text-[#72dce5]" : "text-[#007C89]"}`} aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
      <a
        href={mailtoPilot}
        className={`mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          plan.featured
            ? "bg-[#72dce5] text-[#102b27] hover:bg-white focus-visible:ring-[#72dce5] focus-visible:ring-offset-[#102b27]"
            : "bg-[#102b27] text-white hover:bg-[#007C89] focus-visible:ring-[#00aebe]"
        }`}
      >
        {plan.cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-[#13211f]">
      <Header />

      <section className="bg-white px-5 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-18">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">FleetLever pricing</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] text-[#13211f] sm:text-6xl">
              Ξεκινήστε με καθαρό pilot. Συνεχίστε μόνο αν αξίζει.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#53635f]">
              FleetLever δεν είναι GPS tracking και δεν είναι ERP. Είναι το daily readiness desk πριν δεσμευτεί η αυριανή δουλειά.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailtoPilot}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00aebe] px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(0,174,190,0.22)] transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                Start Paid Pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#plans"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#cdd8d3] bg-white px-5 text-sm font-bold text-[#243834] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                Δείτε τα πλάνα
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_28px_90px_rgba(19,33,31,0.16)]">
            <div className="relative aspect-[16/10]">
              <Image
                src="/fleetlever/site/machine-drawer-from-inventory.png"
                alt="FleetLever machines inventory with machine passport drawer"
                fill
                priority
                className="object-cover object-left-top"
                sizes="(min-width: 1024px) 58vw, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#72dce5]">Value anchor</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              Μία αποφυγή blocked start μπορεί να πληρώσει μήνες χρήσης.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              [Euro, "€1.000-€3.000+", "πιθανή έκθεση από ένα delayed crane, machine, crew ή rental start"],
              [Clock, "30 days", "focused pilot για να αποδειχθεί η αξία με πραγματικά δεδομένα"],
              [Receipt, "10% annual discount", "monthly billing ή annual billing, με manual invoice για Greek B2B"],
            ].map(([Icon, title, body]) => (
              <div key={String(title)} className="rounded-lg border border-white/10 bg-white/8 p-5">
                <Icon className="h-5 w-5 text-[#72dce5]" aria-hidden="true" />
                <p className="mt-4 text-2xl font-semibold">{title as string}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#c9d8d4]">{body as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8" id="plans">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Plans</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl lg:text-5xl">
              Paid pilot πρώτα. Μετά διαλέγετε το σωστό monthly plan.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PricePlanCard key={plan.name} plan={plan} />
            ))}
          </div>
          <p className="mt-5 text-sm font-semibold text-[#65766f]">Όλες οι τιμές είναι excluding VAT.</p>
        </div>
      </section>

      <section className="border-y border-[#dbe2de] bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Comparison</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
                Πληρώνετε για το επίπεδο λειτουργίας που χρειάζεστε.
              </h2>
              <p className="mt-4 text-lg leading-8 text-[#53635f]">
                Το scope μεγαλώνει με machines, workflows, users και support, όχι με περιττό software βάρος.
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border border-[#d5dfda] bg-[#f8faf7] shadow-sm">
              <div className="min-w-[860px]">
                <div className="grid grid-cols-[1.1fr_repeat(4,0.9fr)] border-b border-[#dbe2de] bg-[#102b27] text-white">
                  {["", "Pilot", "Starter", "Operations", "Custom"].map((head) => (
                    <div key={head || "blank"} className="px-4 py-3 text-xs font-bold uppercase text-[#eef7f4]">{head}</div>
                  ))}
                </div>
                {comparisonRows.map((row) => (
                  <div key={row[0]} className="grid grid-cols-[1.1fr_repeat(4,0.9fr)] border-b border-[#dbe2de] last:border-b-0">
                    {row.map((cell, index) => (
                      <div key={`${row[0]}-${cell}`} className={`px-4 py-4 text-sm font-semibold leading-6 ${index === 0 ? "bg-white text-[#13211f]" : "text-[#53635f]"}`}>
                        {cell}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
                    </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Onboarding</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl lg:text-5xl">
              Γρήγορο setup, καθαρό scope, χωρίς ατελείωτο data cleanup.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {onboardingItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-lg border border-[#d5dfda] bg-white p-5 shadow-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf6f3] text-[#007C89]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-[#13211f]">{item.title}</h3>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53635f]">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#dbe2de] bg-[#f7f8f5] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Add-ons</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Ό,τι είναι έξω από το standard scope φαίνεται καθαρά.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#53635f]">
              Δεν κρύβουμε heavy cleanup μέσα στο subscription. Αν χρειάζεται extra δουλειά, τη συζητάμε ως ξεχωριστό scope.
            </p>
          </div>
          <div className="grid gap-3">
            {addOns.map(([name, price, use]) => (
              <div key={name} className="grid gap-3 rounded-lg border border-[#d5dfda] bg-white p-5 shadow-sm sm:grid-cols-[0.9fr_0.65fr_1fr] sm:items-center">
                <p className="text-base font-semibold text-[#13211f]">{name}</p>
                <p className="text-sm font-bold text-[#007C89]">{price}</p>
                <p className="text-sm font-semibold leading-6 text-[#53635f]">{use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Συχνές ερωτήσεις για την τιμολόγηση.
            </h2>
          </div>
          <div className="mt-9 grid gap-4 lg:grid-cols-2">
            {faqs.map(([question, answer]) => (
              <article key={question} className="rounded-lg border border-[#d5dfda] bg-white p-5 shadow-sm">
                <div className="flex gap-3">
                  <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#13211f]">{question}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#53635f]">{answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-lg border border-[#cdd8d3] bg-white p-7 shadow-[0_18px_55px_rgba(19,33,31,0.08)] lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#007C89]">Πριν διαλέξετε πλάνο</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Ξεκινήστε με ένα καθαρό paid pilot.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53635f]">
              Χρησιμοποιήστε πραγματικά δεδομένα. Δείτε τι μπλοκάρει την αυριανή δουλειά. Μετά αποφασίζετε.
            </p>
          </div>
          <a
            href={mailtoPilot}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#102b27] px-5 text-sm font-bold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
          >
            Request Paid Pilot
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <footer className="border-t border-[#dbe2de] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FleetLeverLogo />
            <p className="mt-3 text-sm font-semibold text-[#65766f]">Software ελέγχου εργασιών κατασκευής</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#53635f]">
            <Link href="/#product" className="hover:text-[#007C89]">Προϊόν</Link>
            <Link href="/pricing" className="hover:text-[#007C89]">Τιμές</Link>
            <a href="mailto:hello@fleetlever.com?subject=FleetLever demo" className="hover:text-[#007C89]">Demo</a>
            <a href="mailto:hello@fleetlever.com" className="hover:text-[#007C89]">Επικοινωνία</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
