import {
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  Lock,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { OperationsConsole } from "@/components/fleetlever/operations-console";
import { getFleetLeverData } from "@/lib/db/fleetlever-data";

export const dynamic = "force-dynamic";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleetlever.gr";

const operatingSignals = [
  { label: "Έτοιμα πάγια", value: "12", tone: "ready" },
  { label: "Κοντινές λήξεις", value: "4", tone: "warning" },
  { label: "Ανοιχτές βλάβες", value: "2", tone: "danger" },
  { label: "Service", value: "7", tone: "service" },
];

const productCapabilities = [
  {
    icon: Gauge,
    title: "Ετοιμότητα πριν την ανάθεση",
    body: "Βλέπεις ποιο όχημα, μηχάνημα ή εργαλείο μπορεί να δουλέψει σήμερα και τι το κρατά πίσω.",
  },
  {
    icon: FileCheck2,
    title: "KTEO, άδειες και έγγραφα",
    body: "Λήξεις, αρχεία, ανανεώσεις και έλεγχοι μπαίνουν σε μία καθημερινή λίστα προτεραιοτήτων.",
  },
  {
    icon: Wrench,
    title: "Service, βλάβες και κόστος",
    body: "Η ομάδα βλέπει εργασίες, blockers και εκκρεμότητες πριν φορτώσει πρόγραμμα ή διαδρομή.",
  },
];

const workflowSteps = [
  {
    title: "Πρωινή εικόνα",
    body: "Ξεκινάς από readiness, προθεσμίες και blockers. Όχι από διάσπαρτα μηνύματα και excel.",
  },
  {
    title: "Κλείσιμο κινδύνου",
    body: "Ανοίγεις KTEO, service ή έγγραφο και αναθέτεις την επόμενη ενέργεια στην ομάδα.",
  },
  {
    title: "Ανάθεση με σιγουριά",
    body: "Πάγια, χειριστές και έγγραφα έχουν κοινή κατάσταση πριν βγουν στον δρόμο ή στο έργο.",
  },
];

const trustPoints = [
  { icon: Building2, label: "Workspaces και δεδομένα χωρισμένα ανά οργανισμό" },
  { icon: Lock, label: "Όρια για έγγραφα, ρόλους και ευαίσθητες ενέργειες" },
  { icon: ClipboardCheck, label: "Ιστορικό ενεργειών για ελέγχους και καθημερινή λογοδοσία" },
  { icon: ShieldCheck, label: "Σχεδιασμένο για λειτουργίες που χρειάζονται έλεγχο πριν την ανάπτυξη" },
];

const customerFits = [
  {
    title: "Μεταφορικές και τουριστικά λεωφορεία",
    body: "KTEO, άδειες, οδηγοί και διαθεσιμότητα είναι καθαρά πριν βγει το πρόγραμμα.",
  },
  {
    title: "Τεχνικές εταιρείες και εργοτάξια",
    body: "Ξέρεις ποιο μηχάνημα πάει σε έργο, τι λήγει και ποια εργασία θέλει κλείσιμο.",
  },
  {
    title: "Μικτοί στόλοι με εξοπλισμό",
    body: "Οχήματα, εργαλεία, πιστοποιητικά και service μπαίνουν στο ίδιο λειτουργικό πλαίσιο.",
  },
];

const schema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FleetLever",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: siteUrl,
  inLanguage: "el-GR",
  description:
    "Greek-first λογισμικό για στόλο, εξοπλισμό, KTEO, έγγραφα, service, βλάβες και αναθέσεις.",
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/PreOrder",
    priceCurrency: "EUR",
  },
  areaServed: {
    "@type": "Country",
    name: "Greece",
  },
};

function isProductionAppRoot() {
  return process.env.FLEETLEVER_ROOT_EXPERIENCE === "app" || Boolean(process.env.RAILWAY_ENVIRONMENT);
}

export default async function Home() {
  if (isProductionAppRoot()) {
    const initialData = await getFleetLeverData();

    return <OperationsConsole initialData={initialData} />;
  }

  return <MarketingHome />;
}

function MarketingHome() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#edf1ee] text-[#13211f]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link href="/" aria-label="FleetLever αρχική">
          <FleetLeverLogo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#40554f] md:flex" aria-label="Κύρια πλοήγηση">
          <a className="transition hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89]" href="#platforma">
            Πλατφόρμα
          </a>
          <a className="transition hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89]" href="#workflow">
            Λειτουργία
          </a>
          <a className="transition hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89]" href="#asfaleia">
            Ασφάλεια
          </a>
          <a className="transition hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89]" href="#demo">
            Demo
          </a>
        </nav>
        <Link
          href="/console"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-md bg-[#13211f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2 focus-visible:ring-offset-[#edf1ee]"
        >
          <span className="sm:hidden">Demo</span>
          <span className="hidden sm:inline">Άνοιγμα demo</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section className="relative isolate px-5 pb-10 pt-6 sm:px-6 lg:px-8">
        <div className="absolute inset-x-0 top-8 -z-30 mx-auto h-[72svh] max-w-7xl rounded-[2rem] border border-white/80 bg-[#dfe8e2] shadow-[0_42px_120px_rgba(19,33,31,0.14)]" />
        <div className="absolute inset-x-4 top-16 -z-20 mx-auto hidden h-[62svh] max-w-6xl overflow-hidden rounded-2xl border border-[#bdcbc4] bg-[#f8faf8] shadow-2xl lg:block">
          <Image
            src="/fleetlever-console-dashboard.png"
            alt="FleetLever demo console με ετοιμότητα στόλου, προθεσμίες και αναθέσεις."
            fill
            priority
            sizes="(min-width: 1024px) 1152px, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="absolute inset-x-4 top-16 -z-10 mx-auto hidden h-[62svh] max-w-6xl rounded-2xl bg-[linear-gradient(90deg,#edf1ee_0%,rgba(237,241,238,0.98)_38%,rgba(237,241,238,0.72)_58%,rgba(237,241,238,0.08)_82%)] lg:block" />
        <div className="absolute inset-x-5 top-10 -z-20 h-48 overflow-hidden rounded-2xl border border-[#bdcbc4] bg-white shadow-xl sm:inset-x-8 lg:hidden">
          <Image
            src="/fleetlever-console-mobile.png"
            alt="FleetLever mobile demo console με κατάσταση στόλου."
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </div>

        <div className="mx-auto grid min-h-[70svh] w-full max-w-7xl items-end">
          <div className="max-w-3xl pb-8 pt-64 sm:pt-72 lg:pb-14 lg:pt-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#b9c8bf] bg-white/85 px-3 py-1 text-sm font-semibold text-[#24413d] shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#007C89]" aria-hidden="true" />
              Για ελληνικές ομάδες με στόλο, εξοπλισμό και προθεσμίες
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.04] tracking-normal text-[#13211f] sm:text-5xl lg:text-6xl">
              FleetLever
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#263b37] sm:text-xl">
              Το console λειτουργίας που δείχνει τι είναι έτοιμο, τι λήγει και τι μπλοκάρει την ανάθεση πριν χαθεί χρόνος στο πρόγραμμα.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/console"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#007C89] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#007c8930] transition hover:bg-[#056b73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
              >
                Δες το demo console
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="mailto:hello@fleetlever.gr?subject=FleetLever demo"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#b7c7bf] bg-white/90 px-5 py-3 text-sm font-semibold text-[#13211f] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
              >
                Κλείσε συζήτηση
              </a>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
              {operatingSignals.map((signal) => (
                <div
                  key={signal.label}
                  className="rounded-lg border border-white/80 bg-white/75 p-3 shadow-sm backdrop-blur"
                >
                  <p className="text-2xl font-semibold leading-none text-[#13211f]">{signal.value}</p>
                  <p className="mt-2 text-xs font-semibold text-[#50665f]">{signal.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platforma" className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-12 sm:px-6 lg:grid-cols-3 lg:px-8">
        {productCapabilities.map((item) => (
          <article key={item.title} className="rounded-lg border border-[#d4ddd7] bg-white p-6 shadow-sm">
            <item.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold text-[#13211f]">{item.title}</h2>
            <p className="mt-3 text-base leading-7 text-[#53665f]">{item.body}</p>
          </article>
        ))}
      </section>

      <section id="workflow" className="border-y border-[#d4ddd7] bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[0.84fr_1.16fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">Ημερήσια λειτουργία</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Από πρωινό έλεγχο σε καθαρή ανάθεση.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#53665f]">
              Το FleetLever οργανώνει την καθημερινή απόφαση: τι δουλεύει, τι θέλει κλείσιμο και ποιος το αναλαμβάνει.
            </p>
          </div>
          <div className="grid gap-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="grid gap-4 rounded-lg border border-[#d4ddd7] bg-[#f8faf8] p-5 sm:grid-cols-[2.25rem_1fr]">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#13211f] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-[#13211f]">{step.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[#53665f]">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#cbd8d1] bg-white shadow-2xl shadow-slate-900/10">
          <Image
            src="/fleetlever-console-dashboard.png"
            alt="FleetLever console με κάρτες readiness, προτεραιότητες και προθεσμίες."
            width={1440}
            height={1000}
            sizes="(min-width: 1024px) 620px, 100vw"
            className="h-auto w-full"
          />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">Πραγματικό προϊόν</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
            Η εικόνα του στόλου δεν πρέπει να είναι κρυμμένη σε αρχεία.
          </h2>
          <p className="mt-5 text-lg leading-8 text-[#53665f]">
            Η αρχική οθόνη συγκεντρώνει readiness, λήξεις, service, βλάβες και αναθέσεις, ώστε η ομάδα να δουλεύει από ένα σημείο αλήθειας.
          </p>
          <div className="mt-7 grid gap-3">
            {["Κρίσιμες προθεσμίες πριν γίνουν πρόβλημα.", "Σαφείς ενέργειες για έγγραφα, βλάβες και service.", "Κατάσταση ανά workspace, πάγιο και χειριστή."].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
                <p className="text-base font-medium leading-7 text-[#263b37]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="asfaleia" className="bg-[#13211f] px-5 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <ShieldCheck className="h-8 w-8 text-[#79d9e3]" aria-hidden="true" />
            <p className="mt-6 text-sm font-semibold uppercase tracking-normal text-[#79d9e3]">Έλεγχος και εμπιστοσύνη</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
              Χτισμένο για σοβαρή λειτουργία, όχι για απλή καταγραφή.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#c9d8d2]">
              Όταν η ανάθεση εξαρτάται από έγγραφα, ρόλους και ιστορικό, το σύστημα πρέπει να κρατά καθαρά όρια από την πρώτη μέρα.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustPoints.map((point) => (
              <article key={point.label} className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
                <point.icon className="h-5 w-5 text-[#79d9e3]" aria-hidden="true" />
                <p className="mt-4 text-base font-semibold leading-7 text-white">{point.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">Για ποιους είναι</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Για ομάδες που δεν έχουν περιθώριο να ψάχνουν τελευταία στιγμή.
            </h2>
          </div>
          <div className="grid gap-3">
            {customerFits.map((fit) => (
              <article key={fit.title} className="rounded-lg border border-[#d4ddd7] bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-3 text-lg font-semibold text-[#13211f]">
                  <Truck className="h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
                  {fit.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[#53665f]">{fit.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[#f8faf8] px-5 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-7 rounded-lg border border-[#d4ddd7] bg-white p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-normal text-[#007C89]">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              Επόμενο βήμα
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[#13211f]">Δες αν ταιριάζει στη δική σου λειτουργία.</h2>
            <p className="mt-2 max-w-2xl text-base leading-7 text-[#53665f]">
              Άνοιξε το demo και δες πώς φαίνονται λήξεις, βλάβες, service και αναθέσεις μέσα σε μία καθημερινή εικόνα.
            </p>
          </div>
          <Link
            href="/console"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#13211f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
          >
            Άνοιγμα demo console
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
