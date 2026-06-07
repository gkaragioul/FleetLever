import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, CircleHelp, Euro, Receipt, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

export const metadata: Metadata = {
  title: "Τιμές",
  description:
    "Τιμές FleetLever για 30ήμερο Pilot και μηνιαία πλάνα ελέγχου μηχανημάτων πριν δεσμευτεί η αυριανή δουλειά.",
  alternates: {
    canonical: "/pricing",
  },
};

const mailtoPilot = "mailto:hello@fleetlever.com?subject=FleetLever paid pilot";
const mailtoPricing = "mailto:hello@fleetlever.com?subject=FleetLever pricing call";

const pilotScope = [
  "1 εταιρικό workspace",
  "Έως 30 κρίσιμα μηχανήματα",
  "Έως 100 έγγραφα / ημερομηνίες",
  "1 βασική ροή ελέγχου",
  "Έως 3 χρήστες",
  "Βασικό import από template",
  "Kickoff και review call",
  "Πρόταση συνέχειας μετά τις 30 ημέρες",
] as const;

const plans = [
  {
    name: "Single Team",
    label: "Μία ομάδα",
    price: "€499",
    cadence: "/ μήνα",
    intro: "Για μία ομάδα που θέλει καθημερινό έλεγχο πριν δεσμεύσει το αυριανό πρόγραμμα.",
    detail: "Για γερανούς, ενοικιάσεις, χωματουργικά ή μικρές ομάδες με έως 30 κρίσιμα μηχανήματα.",
    bullets: [
      "Έως 30 κρίσιμα μηχανήματα",
      "Πίνακας αυριανού προγράμματος",
      "Πιστοποιητικά και έγγραφα",
      "Ανοιχτά service και προβλήματα",
      "Υπεύθυνοι και ενέργειες",
      "Ιστορικό αποφάσεων",
    ],
    cta: "Επιλέξτε Single Team",
  },
  {
    name: "Multi-Site Operations",
    label: "Πολλά εργοτάξια",
    price: "€999",
    cadence: "/ μήνα",
    intro: "Για ομάδες με περισσότερα εργοτάξια, περισσότερα μηχανήματα και μεγαλύτερη πίεση.",
    detail: "Όταν ένα μπλοκαρισμένο ξεκίνημα μπορεί να κοστίσει περισσότερο από το μηνιαίο πλάνο.",
    bullets: [
      "Έως 100 κρίσιμα μηχανήματα",
      "Πολλά εργοτάξια",
      "Όλα στο Single Team",
      "Περισσότερες ροές ελέγχου",
      "Αναλυτικότερη παρακολούθηση προβλημάτων",
      "Μηνιαία ανασκόπηση ετοιμότητας",
    ],
    cta: "Επιλέξτε Operations",
  },
] as const;

const pilotSteps = [
  "Βάζουμε τα δεδομένα",
  "Ελέγχουμε την ετοιμότητα",
  "Βρίσκουμε τα προβλήματα",
  "Αποφασίζετε αν συνεχίζετε",
] as const;

const faqs = [
  [
    "Είναι το FleetLever GPS;",
    "Όχι. Δεν δείχνει απλώς πού βρίσκεται ένα μηχάνημα. Δείχνει αν μπορεί να δουλέψει στο αυριανό πρόγραμμα ή αν υπάρχει κάτι που το μπλοκάρει.",
  ],
  [
    "Περιλαμβάνεται onboarding στο Pilot;",
    "Ναι. Περιλαμβάνει βασικό setup για έως 30 μηχανήματα, έως 100 βασικά έγγραφα ή ημερομηνίες, μία ροή ελέγχου και δύο calls.",
  ],
  [
    "Τι γίνεται αν τα δεδομένα μας είναι ακατάστατα;",
    "Βασική υποστήριξη στο import περιλαμβάνεται. Μεγάλο καθάρισμα δεδομένων ή εκτεταμένη οργάνωση εγγράφων συμφωνούνται ξεχωριστά πριν ξεκινήσουμε.",
  ],
  [
    "Χρειάζεται ετήσια σύμβαση;",
    "Όχι. Υπάρχει μηνιαία χρέωση. Η ετήσια χρέωση δίνει 10% έκπτωση.",
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
        <a
          href={mailtoPilot}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#102b27] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
        >
          Ξεκινήστε Pilot
        </a>
      </div>
    </header>
  );
}

function CheckItem({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className={`flex gap-3 text-sm font-semibold leading-6 ${dark ? "text-[#eef7f4]" : "text-[#334641]"}`}>
      <BadgeCheck className={`mt-0.5 h-5 w-5 shrink-0 ${dark ? "text-[#72dce5]" : "text-[#007C89]"}`} aria-hidden="true" />
      {children}
    </li>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-[#13211f]">
      <Header />

      <section className="bg-white px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Τιμές FleetLever</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] text-[#13211f] sm:text-6xl">
              Πριν πληρώσετε συνδρομή, δοκιμάστε το με πραγματικά μηχανήματα.
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#53635f]">
              Βάζουμε τα πραγματικά σας μηχανήματα, έγγραφα και προβλήματα στο FleetLever για 30 ημέρες. Στο τέλος ξέρετε αν αξίζει να συνεχίσετε.
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

          <div className="overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_28px_90px_rgba(19,33,31,0.14)]">
            <div className="relative aspect-[16/10]">
              <Image
                src="/fleetlever/site/machine-drawer-from-inventory.png"
                alt="FleetLever machine passport view"
                fill
                priority
                className="object-cover object-left-top"
                sizes="(min-width: 1024px) 54vw, 100vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#72dce5]">Γιατί αξίζει</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              Το κόστος φαίνεται όταν η δουλειά σταματάει.
            </h2>
          </div>
          <div>
            <p className="max-w-2xl text-lg font-semibold leading-8 text-[#c9d8d4]">
              Ο στόχος δεν είναι η διαχείριση εγγράφων. Ο στόχος είναι να βρίσκετε τι θα σταματήσει τη δουλειά πριν φτάσει το πρωί.
            </p>
            <div className="mt-6 rounded-lg border border-white/12 bg-white/7 p-5">
              <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                <div className="flex items-start gap-4">
                  <Euro className="mt-1 h-5 w-5 shrink-0 text-[#72dce5]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold uppercase text-[#ffcf8a]">Μία χαμένη εκκίνηση</p>
                    <p className="mt-2 text-3xl font-semibold">€1.000 - €3.000+</p>
                  </div>
                </div>
                <div className="hidden h-14 w-px bg-white/18 md:block" aria-hidden="true" />
                <div className="flex items-start gap-4">
                  <Receipt className="mt-1 h-5 w-5 shrink-0 text-[#72dce5]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-bold uppercase text-[#72dce5]">Single Team</p>
                    <p className="mt-2 text-3xl font-semibold">€499 / μήνα</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8" id="plans">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mb-8 max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Πλάνα</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Ξεκινάτε με Pilot. Συνεχίζετε μόνο αν αποδείχθηκε χρήσιμο.
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <article className="rounded-lg border border-[#72dce5] bg-[#102b27] p-7 text-white shadow-[0_28px_90px_rgba(19,33,31,0.22)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase text-[#72dce5]">30-Day Pilot</p>
                  <p className="mt-2 text-sm font-bold uppercase text-[#c9d8d4]">30 ημέρες πιλοτικός έλεγχος</p>
                </div>
                <ShieldCheck className="h-6 w-6 text-[#72dce5]" aria-hidden="true" />
              </div>
              <div className="mt-7 flex items-end gap-2">
                <h2 className="text-5xl font-semibold leading-none">€1.000</h2>
                <span className="pb-1 text-sm font-bold text-[#c9d8d4]">fixed</span>
              </div>
              <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-[#eef7f4]">
                Βάζουμε τα πραγματικά σας μηχανήματα στο FleetLever. Σε 30 ημέρες θα ξέρετε αν βρίσκει προβλήματα πριν σταματήσουν τη δουλειά.
              </p>
              <div className="mt-8 border-t border-white/18 pt-7">
                <p className="text-4xl font-semibold leading-tight">30 ημέρες.</p>
                <p className="mt-4 text-3xl font-semibold leading-tight">Βλέπετε αξία.</p>
                <p className="mt-2 text-3xl font-semibold leading-tight">Ή δεν συνεχίζετε.</p>
              </div>
              <p className="mt-5 text-sm font-semibold text-[#c9d8d4]">Χωρίς ετήσια δέσμευση.</p>
              <details className="mt-6 rounded-md border border-white/14 bg-white/6 p-4">
                <summary className="cursor-pointer list-none text-sm font-bold text-[#72dce5] marker:hidden">
                  Δείτε τι περιλαμβάνεται
                </summary>
                <ul className="mt-4 space-y-3">
                  {pilotScope.map((item) => (
                    <CheckItem key={item} dark>{item}</CheckItem>
                  ))}
                </ul>
              </details>
              <a
                href={mailtoPilot}
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#72dce5] px-5 text-sm font-bold text-[#102b27] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27] sm:w-auto"
              >
                Ξεκινήστε Pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>

            <div>
              <div className="grid gap-4">
                {plans.map((plan) => (
                  <article key={plan.name} className="rounded-lg border border-[#d5dfda] bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold uppercase text-[#007C89]">{plan.name}</p>
                        <h3 className="mt-2 text-2xl font-semibold text-[#13211f]">{plan.label}</h3>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-3xl font-semibold text-[#13211f]">{plan.price}</p>
                        <p className="text-sm font-bold text-[#65766f]">{plan.cadence}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-base font-semibold leading-7 text-[#53635f]">{plan.intro}</p>
                    <p className="mt-3 text-sm font-bold leading-6 text-[#007C89]">{plan.detail}</p>
                    <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                      {plan.bullets.map((item) => (
                        <CheckItem key={item}>{item}</CheckItem>
                      ))}
                    </ul>
                    <a
                      href={mailtoPricing}
                      className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#102b27] px-4 text-sm font-bold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
                    >
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </article>
                ))}
              </div>
              <div className="mt-4 rounded-lg border border-[#cdd8d3] bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase text-[#007C89]">Custom</p>
                <h3 className="mt-2 text-2xl font-semibold text-[#13211f]">Χρειάζεστε κάτι πιο σύνθετο;</h3>
                <p className="mt-3 text-base font-semibold leading-7 text-[#53635f]">
                  Για 100+ μηχανήματα, πολλαπλά τμήματα, ειδικές ροές, αναφορές ή integrations.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["100+ μηχανήματα", "Ειδικές ροές", "Προχωρημένα δικαιώματα", "Αναφορές", "Integrations"].map((tag) => (
                    <span key={tag} className="rounded-full border border-[#d5dfda] bg-[#f4f8f6] px-3 py-1 text-xs font-bold text-[#53635f]">
                      {tag}
                    </span>
                  ))}
                </div>
                <a href={mailtoPricing} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#cdd8d3] bg-white px-4 text-sm font-bold text-[#243834] transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2">
                  Μιλήστε μαζί μας
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <p className="mt-5 text-sm font-semibold text-[#65766f]">Όλες οι τιμές είναι χωρίς ΦΠΑ.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#dbe2de] bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Pilot στην πράξη</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Τι γίνεται στις 30 ημέρες και τι πρέπει να ξέρετε πριν ξεκινήσετε.
            </h2>
          </div>
          <div className="mt-9 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="rounded-lg border border-[#d5dfda] bg-[#f7f8f5] p-6">
              <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Πώς λειτουργεί</p>
              <p className="mt-3 text-base font-semibold leading-7 text-[#53635f]">
                Σε 30 ημέρες βλέπετε αν βρίσκει προβλήματα πριν σταματήσουν την αυριανή δουλειά.
              </p>
              <div className="mt-6 grid gap-4">
                {pilotSteps.map((step, index) => (
                  <div key={step} className="grid grid-cols-[3.25rem_1fr] gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-bold ${
                        index === 3 ? "border-[#102b27] bg-[#102b27] text-[#72dce5]" : "border-[#cdd8d3] bg-white text-[#007C89]"
                      }`}>
                        {index + 1}
                      </div>
                      {index < pilotSteps.length - 1 ? <div className="mt-2 h-full min-h-5 w-px bg-[#cdd8d3]" aria-hidden="true" /> : null}
                    </div>
                    <div className={`rounded-md border p-4 ${index === 3 ? "border-[#102b27] bg-[#102b27] text-white" : "border-[#d5dfda] bg-white"}`}>
                      <h3 className={`text-lg font-semibold leading-tight ${index === 3 ? "text-white" : "text-[#13211f]"}`}>{step}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
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
              <article className="rounded-lg border border-[#d5dfda] bg-[#f7f8f5] p-5">
                <h3 className="text-lg font-semibold text-[#13211f]">Τι μπορεί να χρεωθεί ξεχωριστά;</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#53635f]">
                  Αν τα δεδομένα είναι πολύ ακατάστατα ή χρειάζεται επιπλέον οργάνωση αρχείων, το κόστος συμφωνείται πριν ξεκινήσουμε.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Επιπλέον καθάρισμα δεδομένων", "Μεγάλη οργάνωση εγγράφων", "Ειδικές αναφορές", "Integrations", "Επιπλέον onboarding"].map((tag) => (
                    <span key={tag} className="rounded-full border border-[#d5dfda] bg-white px-3 py-1 text-xs font-bold text-[#53635f]">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#72dce5]">Πριν διαλέξετε πλάνο</p>
            <h2 className="mt-3 max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
              Δοκιμάστε το με πραγματικά μηχανήματα.
            </h2>
            <p className="mt-4 max-w-2xl text-lg font-semibold leading-8 text-[#c9d8d4]">
              Βάλτε τα πραγματικά σας μηχανήματα, έγγραφα και προβλήματα στο FleetLever για 30 ημέρες.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:min-w-64 lg:flex-col">
            <a
              href={mailtoPilot}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#72dce5] px-5 text-sm font-bold text-[#102b27] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27]"
            >
              Ξεκινήστε Pilot
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <a
              href={mailtoPricing}
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/18 bg-white/8 px-5 text-sm font-bold text-white transition hover:border-[#72dce5] hover:text-[#72dce5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#72dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27]"
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
            <p className="mt-3 text-sm font-semibold text-[#65766f]">Ξέρεις τι θα σταματήσει τη δουλειά αύριο πριν συμβεί.</p>
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
