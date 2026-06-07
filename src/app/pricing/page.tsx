import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CircleHelp,
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
    name: "30-Day Pilot",
    price: "€1.000",
    cadence: "fixed",
    label: "30 ημέρες πιλοτικός έλεγχος",
    intro: "Βάζουμε τα πραγματικά σας μηχανήματα στο FleetLever.",
    bestFor: "Σε 30 ημέρες θα ξέρετε αν το σύστημα βρίσκει προβλήματα πριν σταματήσουν τη δουλειά.",
    note: "Χωρίς ετήσια δέσμευση.",
    cta: "Ξεκινήστε Pilot",
    featured: true,
    includes: [
      "1 εταιρικό Workspace",
      "Έως 30 κρίσιμα μηχανήματα",
      "Έως 100 έγγραφα / ημερομηνίες",
      "1 βασική ροή ελέγχου",
      "Έως 3 χρήστες",
      "Βασικό import από template",
      "Kickoff και review call",
      "Πρόταση συνέχειας μετά τις 30 ημέρες",
    ],
  },
  {
    name: "Single Team",
    price: "€499",
    cadence: "/μήνα",
    label: "Μία ομάδα",
    intro: "Για μία ομάδα που χρειάζεται καθημερινό έλεγχο πριν δεσμεύσει δουλειά.",
    bestFor: "Για εταιρείες γερανών, ενοικιάσεις, χωματουργικά ή μικρές ομάδες με έως 30 κρίσιμα μηχανήματα.",
    note: "Συνήθως μετά το Pilot.",
    cta: "Επιλέξτε Single Team",
    featured: false,
    includes: [
      "Έως 30 κρίσιμα μηχανήματα",
      "Πίνακας αυριανού προγράμματος",
      "Πιστοποιητικά και έγγραφα",
      "Ανοιχτά service και προβλήματα",
      "Υπεύθυνοι και ενέργειες",
      "Ιστορικό αποφάσεων",
    ],
  },
  {
    name: "Multi-Site Operations",
    price: "€999",
    cadence: "/μήνα",
    label: "Πολλά εργοτάξια",
    intro: "Για ομάδες με περισσότερα εργοτάξια, περισσότερα μηχανήματα και μεγαλύτερη καθημερινή πίεση.",
    bestFor: "Όταν ένα μπλοκαρισμένο ξεκίνημα μπορεί να κοστίσει περισσότερο από το μηνιαίο πλάνο.",
    note: "Για πιο απαιτητική καθημερινή λειτουργία.",
    cta: "Επιλέξτε Operations",
    featured: false,
    includes: [
      "Έως 100 κρίσιμα μηχανήματα",
      "Πολλά εργοτάξια",
      "Όλα στο Single Team",
      "Περισσότερες ροές ελέγχου",
      "Αναλυτικότερη παρακολούθηση προβλημάτων",
      "Προτεραιότητα στο onboarding",
      "Μηνιαία ανασκόπηση ετοιμότητας",
    ],
  },
] as const;

const onboardingItems = [
  {
    icon: CalendarDays,
    title: "Καθαρό kickoff",
    body: "Ορίζουμε ποια εργοτάξια, ποια μηχανήματα και ποια προβλήματα θέλουμε να ελέγξουμε.",
  },
  {
    icon: FileText,
    title: "Import δεδομένων",
    body: "Βάζουμε τα βασικά δεδομένα στο FleetLever.",
  },
  {
    icon: ShieldCheck,
    title: "Έλεγχος ετοιμότητας",
    body: "Το σύστημα εντοπίζει ληγμένα πιστοποιητικά, ανοιχτά service και άλλα προβλήματα πριν γίνουν καθυστέρηση.",
  },
  {
    icon: Handshake,
    title: "Απόφαση",
    body: "Συνεχίζετε μόνο αν βλέπετε αξία.",
  },
] as const;

const addOns = [
  "Επιπλέον καθάρισμα δεδομένων",
  "Μεγάλη οργάνωση εγγράφων",
  "Ειδικές αναφορές",
  "Integrations",
  "Επιπλέον onboarding",
] as const;

const faqs = [
  [
    "Είναι το FleetLever GPS;",
    "Όχι. Το FleetLever δεν είναι GPS. Δεν δείχνει απλώς πού βρίσκεται ένα μηχάνημα. Δείχνει αν μπορεί να δουλέψει στο αυριανό πρόγραμμα ή αν υπάρχει κάτι που το μπλοκάρει.",
  ],
  [
    "Περιλαμβάνεται onboarding στο Pilot;",
    "Ναι. Το Pilot περιλαμβάνει βασικό setup για έως 30 μηχανήματα, έως 100 βασικά έγγραφα ή ημερομηνίες, μία ροή ελέγχου και δύο calls.",
  ],
  [
    "Ποιος δίνει τα δεδομένα;",
    "Ο πελάτης δίνει τα βασικά δεδομένα μέσω FleetLever template. Το FleetLever στήνει το συμφωνημένο Pilot.",
  ],
  [
    "Τι γίνεται αν τα δεδομένα μας είναι ακατάστατα;",
    "Το Pilot περιλαμβάνει βασική υποστήριξη στο import. Μεγάλο καθάρισμα δεδομένων, αδόμητοι φάκελοι ή εκτεταμένη οργάνωση εγγράφων συμφωνούνται ξεχωριστά.",
  ],
  [
    "Χρειάζεται ετήσια σύμβαση;",
    "Όχι. Υπάρχει μηνιαία χρέωση. Η ετήσια χρέωση δίνει 10% έκπτωση.",
  ],
  [
    "Μπορούμε να πληρώσουμε με τιμολόγιο;",
    "Ναι. Υποστηρίζεται πληρωμή με τιμολόγιο για B2B πελάτες στην Ελλάδα. Όλες οι τιμές είναι χωρίς ΦΠΑ.",
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
      {plan.featured ? (
        <div className="mt-7 border-t border-white/18 pt-6">
          <p className="text-3xl font-semibold leading-tight text-white sm:text-4xl">30 ημέρες.</p>
          <p className="mt-4 text-2xl font-semibold leading-tight text-white sm:text-3xl">Βλέπετε αξία.</p>
          <p className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-3xl">Ή δεν συνεχίζετε.</p>
        </div>
      ) : null}
      <p className={`mt-3 text-sm font-semibold leading-6 ${plan.featured ? "text-[#c9d8d4]" : "text-[#65766f]"}`}>{plan.note}</p>
      {plan.featured ? (
        <details className="group mt-6 rounded-md border border-white/14 bg-white/6 p-4">
          <summary className="cursor-pointer list-none text-sm font-bold text-[#72dce5] marker:hidden">
            Δείτε τι περιλαμβάνεται
          </summary>
          <ul className="mt-4 space-y-3">
            {plan.includes.map((item) => (
              <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#eef7f4]">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#72dce5]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <ul className="mt-6 space-y-3">
          {plan.includes.map((item) => (
            <li key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#334641]">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      )}
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
              Πριν πληρώσετε συνδρομή, δοκιμάστε το με πραγματικά μηχανήματα.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#53635f]">
              Βάζουμε τα πραγματικά σας μηχανήματα, πιστοποιητικά, έγγραφα και προβλήματα που μπορούν να σταματήσουν τη δουλειά στο FleetLever για 30 ημέρες. Στο τέλος ξέρετε αν αξίζει να συνεχίσετε.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={mailtoPilot}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00aebe] px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(0,174,190,0.22)] transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                Ξεκινήστε Pilot
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
        <div className="mx-auto grid w-full max-w-7xl gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#72dce5]">Γιατί αξίζει</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              Ένα μπλοκαρισμένο ξεκίνημα μπορεί να κοστίσει περισσότερο από μήνες FleetLever.
            </h2>
            <p className="mt-5 text-lg font-semibold leading-8 text-[#c9d8d4]">
              Ο στόχος δεν είναι η διαχείριση εγγράφων. Ο στόχος είναι να βρίσκετε τι θα σταματήσει τη δουλειά πριν φτάσει το πρωί.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <div className="rounded-lg border border-white/10 bg-white/8 p-5">
              <Euro className="h-5 w-5 text-[#72dce5]" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold uppercase text-[#ffcf8a]">Μπλοκαρισμένος Γερανός</p>
              <p className="mt-2 text-3xl font-semibold">€1.000 - €3.000+</p>
            </div>
            <p className="text-center text-sm font-bold uppercase text-[#72dce5]">vs</p>
            <div className="rounded-lg border border-[#72dce5]/35 bg-white p-5 text-[#13211f]">
              <Receipt className="h-5 w-5 text-[#007C89]" aria-hidden="true" />
              <p className="mt-4 text-sm font-bold uppercase text-[#007C89]">FleetLever Single Team</p>
              <p className="mt-2 text-3xl font-semibold">€499 / μήνα</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8" id="plans">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Πλάνα</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl lg:text-5xl">
              Ξεκινάμε με 30 ημέρες πραγματικού ελέγχου.
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#53635f]">
              Βάζουμε τα πραγματικά μηχανήματα, έγγραφα και προβλήματά σας στο FleetLever. Αν δείτε αξία, συνεχίζετε με μηνιαίο πλάνο.
            </p>
          </div>
          <div className="mt-9 max-w-2xl">
            <PricePlanCard plan={plans[0]} />
          </div>
          <div className="mt-14 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Μηνιαία πλάνα</p>
            <h3 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Συνεχίζετε μόνο αν το Pilot δείξει αξία.
            </h3>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {plans.slice(1).map((plan) => (
              <PricePlanCard key={plan.name} plan={plan} />
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[#cdd8d3] bg-white p-6 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase text-[#007C89]">Custom</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#13211f]">Χρειάζεστε κάτι πιο σύνθετο;</h3>
                <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-[#53635f]">
                  Για 100+ μηχανήματα, πολλαπλά τμήματα, ειδικές ροές, αναφορές ή integrations.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["100+ μηχανήματα", "Ειδικές ροές", "Προχωρημένα δικαιώματα", "Αναφορές", "Integrations"].map((tag) => (
                    <span key={tag} className="rounded-full border border-[#d5dfda] bg-[#f4f8f6] px-3 py-1 text-xs font-bold text-[#53635f]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <a
                href={mailtoPilot}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#102b27] px-4 text-sm font-bold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                Μιλήστε μαζί μας
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </div>
          <p className="mt-5 text-sm font-semibold text-[#65766f]">Όλες οι τιμές είναι χωρίς ΦΠΑ.</p>
        </div>
      </section>

      <section className="border-y border-[#dbe2de] bg-white px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Πώς λειτουργεί το Pilot</p>
          <p className="mt-4 max-w-3xl text-lg font-semibold leading-8 text-[#53635f]">
            Σε 30 ημέρες βλέπετε αν το FleetLever μπορεί να εντοπίζει προβλήματα πριν σταματήσουν την αυριανή δουλειά.
          </p>
          <div className="relative mt-8 grid gap-5 md:grid-cols-4 md:gap-4">
            <div className="absolute left-8 right-8 top-7 hidden h-px bg-[#cdd8d3] md:block" aria-hidden="true" />
            {[
              ["1", "Βάζουμε τα δεδομένα"],
              ["2", "Ελέγχουμε την ετοιμότητα"],
              ["3", "Βρίσκουμε τα προβλήματα"],
              ["4", "Αποφασίζετε αν συνεχίζετε"],
            ].map(([number, title], index) => (
              <div key={number} className={`relative rounded-lg p-4 ${index === 3 ? "bg-[#102b27] text-white" : "bg-white"}`}>
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border text-lg font-bold ${
                  index === 3 ? "border-[#72dce5] bg-[#102b27] text-[#72dce5]" : "border-[#cdd8d3] bg-[#f4f3ef] text-[#007C89]"
                }`}>
                  {number}
                </div>
                <h3 className={`mt-4 text-xl font-semibold leading-tight ${index === 3 ? "text-white" : "text-[#13211f]"}`}>{title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Τι περιλαμβάνει το Pilot</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl lg:text-5xl">
              Τι συμβαίνει στις 30 ημέρες;
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

      <section className="border-y border-[#dbe2de] bg-[#f7f8f5] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Scope</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Τι μπορεί να χρεωθεί ξεχωριστά;
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#53635f]">
              Αν τα δεδομένα είναι πολύ ακατάστατα ή χρειάζεται επιπλέον οργάνωση αρχείων, το κόστος συμφωνείται πριν ξεκινήσουμε.
            </p>
          </div>
          <div className="rounded-lg border border-[#d5dfda] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {addOns.map((name) => (
                <span key={name} className="rounded-full border border-[#d5dfda] bg-[#f4f8f6] px-3 py-2 text-sm font-bold text-[#53635f]">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-lg border border-[#cdd8d3] bg-white p-7 shadow-[0_18px_55px_rgba(19,33,31,0.08)] lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#007C89]">Πριν διαλέξετε πλάνο</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Δοκιμάστε το με πραγματικά μηχανήματα.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[#53635f]">
              Βάλτε τα πραγματικά σας μηχανήματα, έγγραφα και προβλήματα στο FleetLever για 30 ημέρες.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <a
              href={mailtoPilot}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#102b27] px-5 text-sm font-bold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
            >
              Ξεκινήστε Pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href="mailto:hello@fleetlever.com?subject=FleetLever pricing call"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#cdd8d3] bg-white px-5 text-sm font-bold text-[#243834] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
            >
              Μιλήστε μαζί μας
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dbe2de] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FleetLeverLogo />
            <p className="mt-3 text-sm font-semibold text-[#65766f]">Λογισμικό ελέγχου μηχανημάτων πριν το αυριανό πρόγραμμα</p>
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
