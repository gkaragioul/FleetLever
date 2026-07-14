import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, CircleHelp, FileSpreadsheet, Gauge, Users } from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  demoHref,
} from "@/components/fleetlever/commercial-site-shell";

export const metadata: Metadata = {
  title: "Τιμές",
  description:
    "Ξεκινήστε με 30ήμερο FleetLever pilot στον πραγματικό σας στόλο και συνεχίστε μόνο όταν αποδειχθεί χρήσιμο.",
  alternates: { canonical: "/pricing" },
};

const pilotScope = [
  "Έως 30 κρίσιμα μηχανήματα",
  "Έως 100 βασικά έγγραφα ή ημερομηνίες",
  "Μία πραγματική ροή αυριανής δουλειάς",
  "Βασικό import και αρχική ρύθμιση",
  "Kickoff και review αποτελεσμάτων",
] as const;

const plans = [
  {
    name: "Single Team",
    price: "€499",
    description: "Για μία ομάδα που θέλει καθημερινό έλεγχο πριν φύγει ο κρίσιμος εξοπλισμός.",
    features: [
      "Έως 30 κρίσιμα μηχανήματα",
      "Πίνακας αυριανής δουλειάς",
      "Φάκελοι μηχανημάτων",
      "Υπεύθυνοι και προθεσμίες",
      "Ιστορικό αποφάσεων",
    ],
  },
  {
    name: "Operations",
    price: "€999",
    description: "Για περισσότερα έργα, περισσότερους υπευθύνους και μεγαλύτερο operational scope.",
    features: [
      "Έως 100 κρίσιμα μηχανήματα",
      "Πολλαπλά πακέτα εργασίας",
      "Περισσότεροι χρήστες και ρόλοι",
      "Προτεραιότητα στο onboarding",
      "Προηγμένες εξαγωγές",
    ],
  },
] as const;

const faqs = [
  [
    "Είναι GPS ή telematics;",
    "Όχι. Το FleetLever δεν παρακολουθεί τη θέση ή την τηλεμετρία. Ελέγχει αν ο στόλος είναι επιχειρησιακά έτοιμος για την επόμενη δουλειά.",
  ],
  [
    "Αντικαθιστά το ERP ή το CMMS;",
    "Όχι. Συμπληρώνει τα υπάρχοντα συστήματα με μία καθημερινή απόφαση: τι βγαίνει αύριο, τι όχι και γιατί.",
  ],
  [
    "Περιλαμβάνεται onboarding;",
    "Το βασικό onboarding περιλαμβάνεται στο pilot. Σε απευθείας μηνιαία έναρξη, το setup συμφωνείται ξεχωριστά.",
  ],
  [
    "Τι γίνεται αν τα δεδομένα είναι ακατάστατα;",
    "Ελέγχουμε πρώτα το υλικό. Μεγάλο data cleanup ή εκτεταμένη οργάνωση αρχείων κοστολογείται μόνο μετά από σαφή συμφωνία.",
  ],
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />

      <section className="bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid w-full max-w-[86rem] gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#007c89]">Τιμές FleetLever</p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight sm:text-6xl">
              30 ημέρες με τον πραγματικό σας στόλο.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-[#53635f]">
              Πριν επιλέξετε συνδρομή, δείτε το FleetLever να δουλεύει με τα δικά σας μηχανήματα, έγγραφα και ανοιχτά θέματα.
            </p>
            <a
              href={demoHref}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white transition duration-200 hover:bg-[#007c89] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
            >
              Ζήτησε demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          <div className="overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_24px_70px_rgba(16,61,55,0.14)]">
            <Image
              src="/fleetlever/site/machine-drawer-from-inventory.png"
              alt="Στόλος FleetLever με ανοιχτό φάκελο μηχανήματος"
              width={1920}
              height={1200}
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="h-auto w-full"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#103d37] px-5 py-16 text-white sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-[#73dce3]">30ήμερο pilot</p>
            <p className="mt-5 font-mono text-5xl font-semibold">€1.000</p>
            <p className="mt-2 text-sm font-medium text-[#c7d7d2]">σταθερό κόστος · χωρίς ΦΠΑ</p>
            <p className="mt-6 max-w-md text-lg font-medium leading-8 text-[#d8e5e1]">
              Μικρό, σαφές scope. Πραγματικά δεδομένα. Απόφαση συνέχειας με βάση όσα βρήκε το προϊόν.
            </p>
          </div>
          <div className="border-t border-white/20">
            {pilotScope.map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-white/20 py-4 text-base font-semibold text-[#eef6f3]">
                <Check className="h-5 w-5 shrink-0 text-[#73dce3]" aria-hidden="true" />
                {item}
              </div>
            ))}
            <a
              href={demoHref}
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition duration-200 hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ζήτησε demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="plans">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#007c89]">Μετά το pilot</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Δύο καθαρές επιλογές.</h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f] lg:justify-self-end">
              Συνεχίζετε μόνο αν το FleetLever αποδείξει ότι προλαβαίνει προβλήματα στη δική σας λειτουργία.
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-[#cfd8d4] bg-white">
            <div className="hidden grid-cols-[0.62fr_0.76fr_1fr_1fr] border-b border-[#d7dfdb] bg-[#edf2ee] text-xs font-bold uppercase text-[#5d6d68] md:grid">
              <div className="px-6 py-4">Πλάνο</div>
              <div className="px-6 py-4">Τιμή</div>
              <div className="px-6 py-4">Περιγραφή</div>
              <div className="px-6 py-4">Περιλαμβάνει</div>
            </div>
            {plans.map((plan) => (
              <article key={plan.name} className="grid gap-6 border-b border-[#d7dfdb] p-6 last:border-b-0 md:grid-cols-[0.62fr_0.76fr_1fr_1fr] md:gap-0 md:p-0">
                <div className="md:px-6 md:py-7">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                </div>
                <div className="md:px-6 md:py-7">
                  <p className="font-mono text-3xl font-semibold">{plan.price}</p>
                  <p className="mt-1 text-sm font-medium text-[#65766f]">ανά μήνα · χωρίς ΦΠΑ</p>
                </div>
                <p className="text-base font-medium leading-7 text-[#53635f] md:px-6 md:py-7">{plan.description}</p>
                <div className="grid gap-2 md:px-6 md:py-7">
                  {plan.features.map((feature) => (
                    <p key={feature} className="flex gap-2 text-sm font-semibold leading-6 text-[#334641]">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-[#007c89]" aria-hidden="true" />
                      {feature}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-4 border-y border-[#cfd8d4] py-6 md:grid-cols-3">
            {[
              [Gauge, "Χωρίς μακρύ rollout", "Ξεκινάμε από μία κρίσιμη καθημερινή ροή."],
              [Users, "Με υπεύθυνο από την πρώτη μέρα", "Κάθε blocker έχει ιδιοκτήτη και επόμενη κίνηση."],
              [FileSpreadsheet, "Με καθαρό scope δεδομένων", "Οτιδήποτε επιπλέον συμφωνείται πριν γίνει."],
            ].map(([Icon, title, body]) => (
              <div key={String(title)} className="flex gap-4 md:px-4 first:md:pl-0 last:md:pr-0">
                <Icon className="mt-1 h-5 w-5 shrink-0 text-[#007c89]" aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold">{String(title)}</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#5d6d68]">{String(body)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d7dfdb] bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <CircleHelp className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
            <h2 className="mt-6 text-4xl font-semibold leading-tight">Πριν αποφασίσετε.</h2>
            <p className="mt-4 max-w-md text-base font-medium leading-7 text-[#53635f]">
              Οι βασικές απαντήσεις για το προϊόν, το pilot και το setup.
            </p>
          </div>
          <div className="border-t border-[#cfd8d4]">
            {faqs.map(([question, answer]) => (
              <article key={question} className="grid gap-3 border-b border-[#cfd8d4] py-6 sm:grid-cols-[0.72fr_1.28fr] sm:gap-8">
                <h3 className="text-base font-semibold">{question}</h3>
                <p className="text-sm font-medium leading-6 text-[#53635f]">{answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-24">
        <Image
          src="/fleetlever/site/hero-photos/crane-workers.jpg"
          alt="Τεχνικό συνεργείο δίπλα σε βαρύ ανυψωτικό μηχάνημα"
          fill
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/82" aria-hidden="true" />
        <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[#73dce3]">Πριν επιλέξετε πλάνο</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
              Δοκιμάστε το με τη δική σας αυριανή δουλειά.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={demoHref}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition duration-200 hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ζήτησε demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link
              href="/landing#product"
              className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/35 bg-[#071b18]/40 px-5 text-sm font-bold text-white transition duration-200 hover:border-white hover:bg-[#071b18]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Δες το προϊόν
            </Link>
          </div>
        </div>
      </section>

      <CommercialSiteFooter />
    </main>
  );
}
