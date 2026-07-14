import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HardHat,
  History,
} from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  demoHref,
} from "@/components/fleetlever/commercial-site-shell";
import { MachinePassportAssembly } from "@/components/fleetlever/machine-passport-assembly";
import { PreMorningTimeline } from "@/components/fleetlever/pre-morning-timeline";
import { ReadinessLanes } from "@/components/fleetlever/readiness-lanes";
import { ScreenshotMagnifier } from "@/components/fleetlever/screenshot-magnifier";

export const metadata: Metadata = {
  title: "FleetLever | Έλεγχος ετοιμότητας στόλου",
  description:
    "Δείτε ποια μηχανήματα μπορούν να βγουν αύριο, τι τα μπλοκάρει και ποιος αναλαμβάνει την επόμενη ενέργεια.",
  alternates: { canonical: "/" },
};

const workflow = [
  {
    number: "01",
    title: "Δήλωσε την αυριανή δουλειά",
    body: "Εργοτάξιο, βάρδια ή πακέτο εργασίας και τα μηχανήματα που απαιτεί.",
  },
  {
    number: "02",
    title: "Δες τι δεν είναι έτοιμο",
    body: "Έγγραφα, service, επιθεωρήσεις, χειριστές και παραδόσεις ελέγχονται μαζί.",
  },
  {
    number: "03",
    title: "Κλείσε μόνο ό,τι αποδείχθηκε",
    body: "Κάθε blocker αποκτά υπεύθυνο, επόμενη ενέργεια, προθεσμία και απόδειξη.",
  },
] as const;

const useCases = [
  ["Γερανοί και ανυψώσεις", "Πιστοποιητικά, επιθεωρήσεις, χειριστής και service πριν την αποδέσμευση."],
  ["Χωματουργικά έργα", "Excavators, loaders και trucks δεμένα με την αυριανή εργασία."],
  ["Ενοικιάσεις μηχανημάτων", "Παράδοση, κατάσταση, έγγραφα και ευθύνη σε ένα κοινό record."],
  ["Τεχνικά και δημόσια έργα", "Απόφαση με ιστορικό όταν χρειάζεται έλεγχος ή τεκμηρίωση."],
] as const;

function ProductScreenshot({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_24px_70px_rgba(16,61,55,0.14)]">
      <ScreenshotMagnifier
        src={src}
        alt={alt}
        width={1920}
        height={1200}
        priority={priority}
        sizes="(min-width: 1024px) 72vw, 100vw"
        imageClassName="h-auto w-full"
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />

      <section className="relative isolate flex min-h-[560px] max-h-[760px] items-end overflow-hidden sm:min-h-[620px] lg:min-h-[680px]">
        <Image
          src="/fleetlever/site/hero-photos/site-crew-crane.jpg"
          alt="Εργοτάξιο με ερπυστριοφόρο γερανό και τεχνικό συνεργείο"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[62%_58%]"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/72" aria-hidden="true" />

        <div className="mx-auto w-full max-w-[86rem] px-5 pb-14 sm:px-7 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="max-w-[47rem] text-white">
            <p className="text-sm font-bold uppercase text-[#73dce3]">Έλεγχος ετοιμότητας στόλου</p>
            <h1 className="mt-4 text-6xl font-semibold leading-none sm:text-7xl lg:text-8xl">FleetLever</h1>
            <p className="mt-6 max-w-[42rem] text-3xl font-semibold leading-tight sm:text-4xl">
              Ξέρεις τι μπορεί να βγει αύριο. Και τι όχι.
            </p>
            <p className="mt-5 max-w-[40rem] text-base font-medium leading-7 text-[#d8e5e1] sm:text-lg">
              Μηχανήματα, έγγραφα, service και υπεύθυνοι σε έναν καθημερινό έλεγχο πριν δεσμευτούν συνεργεία και έργα.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#74e1e8] px-5 text-sm font-bold text-[#0b302c] transition duration-200 hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#071b18]"
              >
                Ζήτησε demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/40 bg-[#071b18]/35 px-5 text-sm font-bold text-white transition duration-200 hover:border-white hover:bg-[#071b18]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Δες τη ροή
              </a>
            </div>
          </div>
        </div>
      </section>

      <ReadinessLanes />

      <section className="bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="product">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#007c89]">Η αυριανή δουλειά</p>
              <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                Η απόφαση φαίνεται σε μία οθόνη.
              </h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f] lg:justify-self-end">
              Τι είναι έτοιμο, τι χρειάζεται έλεγχο, τι μπλοκάρει και ποιος αναλαμβάνει την επόμενη κίνηση.
            </p>
          </div>
          <div className="mt-10">
            <ProductScreenshot
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt="Πίνακας FleetLever με έτοιμα, υπό έλεγχο και μπλοκαρισμένα μηχανήματα"
              priority
            />
          </div>
          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-[#d9e1dd] bg-[#d9e1dd] sm:grid-cols-3">
            {["Έτοιμο για αύριο", "Χρειάζεται έλεγχο", "Μπλοκάρει τη δουλειά"].map((label, index) => (
              <div key={label} className="flex items-center gap-3 bg-[#f8faf7] px-5 py-4">
                <span className={`h-2.5 w-2.5 ${index === 0 ? "bg-[#16834b]" : index === 1 ? "bg-[#c07808]" : "bg-[#be2f2a]"}`} aria-hidden="true" />
                <span className="text-sm font-bold text-[#263b37]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PreMorningTimeline />

      <section className="scroll-mt-24 bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="how-it-works">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase text-[#007c89]">Πώς λειτουργεί</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Τρεις κινήσεις πριν κλείσει η ημέρα.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#53635f]">
              Δεν αντικαθιστά το ERP σας. Προσθέτει τον καθημερινό έλεγχο που λείπει ανάμεσα στο πρόγραμμα και στην πραγματική αναχώρηση του στόλου.
            </p>
          </div>
          <div className="mt-12 grid gap-8 border-t border-[#cfd8d4] pt-8 md:grid-cols-3">
            {workflow.map((step) => (
              <article key={step.number} className="min-w-0">
                <p className="font-mono text-sm font-bold text-[#007c89]">{step.number}</p>
                <h3 className="mt-5 text-2xl font-semibold leading-tight">{step.title}</h3>
                <p className="mt-3 text-base font-medium leading-7 text-[#5d6d68]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d7dfdb] bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto w-full max-w-[86rem]">
          <article className="grid gap-10 border-b border-[#cfd8d4] pb-16 lg:grid-cols-[1.14fr_0.86fr] lg:items-center lg:pb-24">
            <ProductScreenshot
              src="/fleetlever/site/stop-list.png"
              alt="Λίστα FleetLever με blockers, υπευθύνους και επόμενες ενέργειες"
            />
            <div>
              <ClipboardCheck className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Λίστα ενεργειών</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">Το blocker δεν μένει απλή ειδοποίηση.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-[#53635f]">
                Έχει αιτία, επίπτωση, υπεύθυνο, επόμενη ενέργεια και προθεσμία. Η ομάδα ξέρει τι πρέπει να κλείσει σήμερα.
              </p>
            </div>
          </article>

          <MachinePassportAssembly />

          <article className="grid gap-10 pt-16 lg:grid-cols-[1.14fr_0.86fr] lg:items-center lg:pt-24">
            <ProductScreenshot
              src="/fleetlever/site/decision-history-audit-trail.png"
              alt="Ιστορικό αποφάσεων FleetLever με ενέργειες και αποδείξεις"
            />
            <div>
              <History className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Ιστορικό αποφάσεων</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">Ξέρεις ποιος αποφάσισε, πότε και με ποια απόδειξη.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-[#53635f]">
                Ό,τι αποδεσμεύτηκε, μπλοκαρίστηκε ή άλλαξε παραμένει καθαρό και ελέγξιμο.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className="scroll-mt-24 bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="for-whom">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <HardHat className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">
                Για ομάδες που δεν αντέχουν ένα «το είδαμε το πρωί».
              </h2>
            </div>
            <div className="border-t border-[#cfd8d4]">
              {useCases.map(([title, body]) => (
                <article key={title} className="grid gap-3 border-b border-[#cfd8d4] py-6 sm:grid-cols-[0.72fr_1.28fr] sm:gap-8">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-base font-medium leading-7 text-[#53635f]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-28">
        <Image
          src="/fleetlever/site/hero-photos/heavy-lift-steel.jpg"
          alt="Βαρύ ανυψωτικό μηχάνημα σε εργασία μεταλλικής κατασκευής"
          fill
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/80" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#73dce3]">30ήμερο pilot</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              30 ημέρες με τον πραγματικό σας στόλο.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#d8e5e1]">
              Έως 30 κρίσιμα μηχανήματα, μία πραγματική ροή αυριανής δουλειάς και βασικό onboarding. Στο τέλος έχετε απόδειξη, όχι υπόσχεση.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#d8e5e1]">
              {["Σταθερό scope", "Πραγματικά δεδομένα", "Review αποτελεσμάτων"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#73dce3]" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:text-right">
            <p className="font-mono text-4xl font-semibold">€1.000</p>
            <p className="mt-1 text-sm font-medium text-[#c7d7d2]">σταθερό κόστος · χωρίς ΦΠΑ</p>
            <a
              href={demoHref}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-6 text-sm font-bold text-[#0b302c] transition duration-200 hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Ζήτησε demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link href="/pricing" className="mt-4 block text-sm font-semibold text-[#d8e5e1] underline decoration-white/40 underline-offset-4 hover:text-white">
              Δες τιμές και πλάνα
            </Link>
          </div>
        </div>
      </section>

      <CommercialSiteFooter />
    </main>
  );
}
