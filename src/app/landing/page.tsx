import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  HardHat,
  PhoneCall,
  Route,
  ShieldCheck,
  Smartphone,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

const heroSignals = [
  { value: "1/5", label: "πάγια έτοιμα σήμερα" },
  { value: "4", label: "λήξεις που θέλουν κλείσιμο" },
  { value: "1", label: "service που κρατά ανάθεση" },
];

const operatingQuestions = [
  {
    icon: Gauge,
    title: "Τι μπορεί να ανατεθεί σήμερα;",
    body: "Η ετοιμότητα κάθε παγίου φαίνεται πριν μπει σε δρομολόγιο, βάρδια ή εργοτάξιο.",
  },
  {
    icon: FileCheck2,
    title: "Τι λήγει και θέλει κλείσιμο;",
    body: "KTEO, άδειες, πιστοποιητικά και αρχεία μπαίνουν στην ίδια σειρά προτεραιότητας.",
  },
  {
    icon: Wrench,
    title: "Ποια εργασία κρατά τον στόλο πίσω;",
    body: "Ανοιχτές βλάβες και service φαίνονται μαζί με το πάγιο που επηρεάζουν.",
  },
];

const comparisonPoints = [
  {
    icon: Route,
    title: "Τα GPS δείχνουν πού είναι τα οχήματα.",
    body: "Χρήσιμο για κίνηση και δρομολόγια, αλλά δεν απαντά πάντα αν ένα πάγιο είναι έτοιμο να δουλέψει.",
  },
  {
    icon: ClipboardCheck,
    title: "Τα Excel δείχνουν τι θυμήθηκε να γράψει η ομάδα.",
    body: "Οι λήξεις, τα service και οι βλάβες μένουν συχνά σε διαφορετικά αρχεία, μηνύματα και τηλεφωνήματα.",
  },
  {
    icon: Gauge,
    title: "Το FleetLever δείχνει τι μπορεί να ανατεθεί σήμερα.",
    body: "Συνδέει ετοιμότητα, έγγραφα και ανοιχτές εργασίες σε μία πρακτική εικόνα πριν βγει το πρόγραμμα.",
  },
];

const workflowSteps = [
  {
    icon: CalendarClock,
    label: "Πρωινός έλεγχος",
    title: "Η ομάδα βλέπει πρώτα τις εκκρεμότητες.",
    body: "Προθεσμίες, βλάβες και service εμφανίζονται με καθαρή προτεραιότητα.",
  },
  {
    icon: ClipboardCheck,
    label: "Απόφαση ανάθεσης",
    title: "Το πάγιο δεν περνά στο πρόγραμμα αν κάτι το κρατά πίσω.",
    body: "Ο υπεύθυνος ξέρει γιατί μένει εκτός και ποια ενέργεια χρειάζεται.",
  },
  {
    icon: CheckCircle2,
    label: "Κλείσιμο εργασίας",
    title: "Κάθε προτεραιότητα ανοίγει το σωστό σημείο.",
    body: "Έγγραφο, βλάβη, service ή ανάθεση βρίσκονται χωρίς ψάξιμο σε αρχεία και μηνύματα.",
  },
];

const audienceFit = [
  {
    icon: Truck,
    title: "Μεταφορικές και λεωφορεία",
    body: "Για ομάδες που πρέπει να ξέρουν τι βγαίνει σε δρομολόγιο χωρίς ληγμένα έγγραφα.",
  },
  {
    icon: HardHat,
    title: "Τεχνικές εταιρείες και εργοτάξια",
    body: "Για οχήματα, μηχανήματα και εξοπλισμό που αλλάζουν έργο, χειριστή ή σημείο.",
  },
  {
    icon: ShieldCheck,
    title: "Ομάδες με ελέγχους και αρχεία",
    body: "Για επιχειρήσεις που χρειάζονται καθαρό ιστορικό σε KTEO, άδειες και συντήρηση.",
  },
];

const productPillars = [
  "Πάγια, χειριστές και έγγραφα έχουν κοινή κατάσταση πριν ξεκινήσει η δουλειά.",
  "Οι προθεσμίες φαίνονται με την ίδια βαρύτητα που έχουν και οι βλάβες.",
  "Το γραφείο κίνησης βλέπει τι πρέπει να κλείσει πριν χαθεί χρόνος στο πρόγραμμα.",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#eef3ef] text-[#13211f]">
      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
          <Link
            href="/landing"
            aria-label="FleetLever αρχική"
            className="rounded-md bg-white/86 px-3 py-2 shadow-sm ring-1 ring-[#c8d8d1] backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89]"
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
              className="hidden min-h-11 items-center rounded-md border border-[#d7e1dc] bg-white/82 px-4 text-sm font-semibold text-[#263b37] shadow-sm backdrop-blur transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] sm:inline-flex"
            >
              Μίλησε μαζί μας
            </a>
            <Link
              href="/console"
              className="inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-md bg-[#102b27] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
            >
              Άνοιγμα demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[790px] bg-[#102b27] text-white sm:min-h-[820px] lg:min-h-[860px]">
        <Image
          src="/fleetlever-console-dashboard.png"
          alt="Πίνακας FleetLever με ετοιμότητα στόλου, προθεσμίες, service και αναθέσεις."
          fill
          loading="eager"
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[60%_14%] opacity-42 sm:object-[64%_12%] lg:object-right-top"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,43,39,0.98)_0%,rgba(16,43,39,0.88)_36%,rgba(16,43,39,0.48)_68%,rgba(16,43,39,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,43,39,0.18)_0%,rgba(16,43,39,0.18)_58%,rgba(238,243,239,1)_100%)]" />

        <div className="relative z-10 mx-auto flex min-h-[790px] w-full max-w-7xl flex-col justify-end px-5 pb-24 pt-32 sm:min-h-[820px] sm:px-6 sm:pb-28 lg:min-h-[860px] lg:px-8">
          <div className="max-w-3xl">
            <p className="inline-flex min-h-9 items-center rounded-full border border-white/18 bg-white/10 px-3 text-sm font-semibold text-[#b8eef1] backdrop-blur">
              Πίνακας ετοιμότητας πριν την ανάθεση
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-semibold leading-[1.1] tracking-normal text-white sm:text-6xl lg:text-7xl">
              Ξέρεις τι μπορεί να ανατεθεί σήμερα.
            </h1>
            <p className="mt-6 max-w-2xl text-2xl font-semibold leading-tight text-[#f6fbf9] sm:text-3xl">
              FleetLever για στόλο, KTEO, έγγραφα, service και βλάβες πριν βγει το πρόγραμμα.
            </p>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#d7e7e2]">
              Συγκεντρώνει οχήματα, μηχανήματα, χειριστές και εκκρεμότητες
              σε μία καθαρή εικόνα, ώστε η ομάδα να μη βασίζεται σε σκόρπια
              Excel, τελευταία τηλεφωνήματα και μισές πληροφορίες.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/console"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00aebe] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(0,174,190,0.28)] transition hover:bg-[#0794a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27]"
              >
                Δες το demo
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="mailto:hello@fleetlever.gr?subject=FleetLever"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/24 bg-white/8 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-[#74dce5] hover:text-[#74dce5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27]"
              >
                <PhoneCall className="h-4 w-4" aria-hidden="true" />
                Κλείσε συζήτηση
              </a>
            </div>
          </div>

          <dl className="mt-12 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
            {heroSignals.map((signal) => (
              <div
                key={signal.label}
                className="rounded-lg border border-white/16 bg-white/10 px-4 py-4 backdrop-blur"
              >
                <dt className="text-sm font-medium leading-6 text-[#c8dad5]">{signal.label}</dt>
                <dd className="mt-1 text-3xl font-semibold text-white">{signal.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="relative z-20 -mt-14 px-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 rounded-lg border border-[#c9d9d2] bg-[#f9fbf8] p-4 shadow-[0_24px_80px_rgba(19,33,31,0.12)] lg:grid-cols-3">
          {operatingQuestions.map((item) => (
            <article key={item.title} className="p-4">
              <item.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold leading-7 text-[#13211f]">{item.title}</h2>
              <p className="mt-3 text-base leading-7 text-[#52645f]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">
              Η θέση του FleetLever
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Δεν είναι άλλο ένα GPS ή ακόμα ένα αρχείο στόλου.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#52645f]">
              Η αγορά έχει εργαλεία για χάρτες, καύσιμα και αναφορές. Το
              FleetLever μπαίνει στο πιο κρίσιμο σημείο της ημέρας: πριν γίνει
              η ανάθεση.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {comparisonPoints.map((point) => (
              <article
                key={point.title}
                className="rounded-lg border border-[#d3dfda] bg-white p-6 shadow-sm"
              >
                <point.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-semibold leading-7 text-[#13211f]">
                  {point.title}
                </h3>
                <p className="mt-3 text-base leading-7 text-[#52645f]">{point.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">
              Η καθημερινή εικόνα
            </p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Από το πρώτο βλέμμα καταλαβαίνεις πού κολλάει η δουλειά.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#52645f]">
              Η αρχική οθόνη δεν δείχνει απλώς λίστες. Δείχνει ετοιμότητα,
              προθεσμίες και ανοιχτές εργασίες με τρόπο που οδηγεί στην επόμενη
              ενέργεια.
            </p>
            <div className="mt-8 grid gap-3">
              {productPillars.map((pillar) => (
                <div key={pillar} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
                  <p className="text-base font-medium leading-7 text-[#263b37]">{pillar}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-lg border border-[#b9d0c7] bg-white shadow-[0_26px_90px_rgba(19,33,31,0.16)]">
              <Image
                src="/fleetlever-console-dashboard.png"
                alt="FleetLever κέντρο στόλου με μετρήσεις ετοιμότητας, προτεραιότητες, προθεσμίες και αναθέσεις."
                width={1120}
                height={720}
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="h-auto w-full"
              />
            </div>
            <div className="absolute -bottom-5 left-5 right-5 rounded-md border border-[#f2d99c] bg-[#fff7df] px-4 py-3 text-sm font-semibold leading-6 text-[#6d4b00] shadow-sm sm:left-auto sm:right-8 sm:max-w-sm">
              Παράδειγμα: ληγμένο KTEO δεν κρύβεται σε αρχείο. Φαίνεται πριν μπει το πάγιο σε ανάθεση.
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#fbfcfa] px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="order-2 lg:order-1">
            <div className="mx-auto max-w-[360px] overflow-hidden rounded-[1.4rem] border border-[#b9d0c7] bg-white shadow-[0_24px_70px_rgba(19,33,31,0.18)]">
              <Image
                src="/fleetlever-console-mobile.png"
                alt="Mobile προβολή FleetLever με ετοιμότητα ανάθεσης και προθεσμίες."
                width={716}
                height={1176}
                sizes="(min-width: 1024px) 360px, 78vw"
                className="h-auto w-full"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="inline-flex min-h-8 items-center rounded-full bg-[#e5f6f3] px-3 text-sm font-semibold text-[#007C89]">
              Στο γραφείο και στο πεδίο
            </p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Η ίδια εικόνα ακολουθεί την ομάδα όπου παίρνεται η απόφαση.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#52645f]">
              Ο υπεύθυνος στόλου, ο τεχνικός και ο άνθρωπος που βγάζει πρόγραμμα
              βλέπουν την ίδια κατάσταση. Λιγότερες εξηγήσεις, λιγότερα
              τηλεφωνήματα, πιο καθαρό κλείσιμο εκκρεμοτήτων.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#d3dfda] bg-white p-5">
                <Smartphone className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-[#13211f]">Γρήγορος έλεγχος</h3>
                <p className="mt-2 text-base leading-7 text-[#52645f]">
                  Η ομάδα βλέπει πρώτα την κατάσταση, όχι ένα γεμάτο αρχείο.
                </p>
              </div>
              <div className="rounded-lg border border-[#d3dfda] bg-white p-5">
                <Route className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-semibold text-[#13211f]">Πριν βγει πρόγραμμα</h3>
                <p className="mt-2 text-base leading-7 text-[#52645f]">
                  Οι αναθέσεις ξεκινούν από όσα είναι διαθέσιμα και ασφαλή.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">
              Από εκκρεμότητα σε ενέργεια
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Το FleetLever κάνει την προτεραιότητα πρακτική.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {workflowSteps.map((step) => (
              <article
                key={step.title}
                className="rounded-lg border border-[#d3dfda] bg-white p-6 shadow-sm"
              >
                <step.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
                <p className="mt-5 text-sm font-semibold uppercase tracking-normal text-[#667871]">
                  {step.label}
                </p>
                <h3 className="mt-3 text-xl font-semibold leading-7 text-[#13211f]">{step.title}</h3>
                <p className="mt-3 text-base leading-7 text-[#52645f]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-[#79d9e3]">
              Πού ταιριάζει
            </p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Για ομάδες που δεν θέλουν να ανακαλύπτουν το πρόβλημα μετά την ανάθεση.
            </h2>
            <p className="mt-5 text-lg leading-8 text-[#cfe0dc]">
              Το προϊόν είναι φτιαγμένο για ελληνικές ομάδες λειτουργίας που
              κρατούν στόλο, εξοπλισμό και έγγραφα μαζί.
            </p>
          </div>
          <div className="grid gap-4">
            {audienceFit.map((item) => (
              <article
                key={item.title}
                className="grid gap-4 rounded-lg border border-white/12 bg-white/[0.06] p-5 sm:grid-cols-[2rem_1fr]"
              >
                <item.icon className="h-6 w-6 text-[#79d9e3]" aria-hidden="true" />
                <div>
                  <h3 className="text-xl font-semibold leading-7">{item.title}</h3>
                  <p className="mt-2 text-base leading-7 text-[#cfe0dc]">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-lg border border-[#c9d9d2] bg-[#f9fbf8] p-6 shadow-sm sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#007C89]">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Λιγότερες εκπλήξεις στο πρόγραμμα
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl">
              Δες πώς αλλάζει η καθημερινή εικόνα πριν ανατεθεί το επόμενο όχημα ή μηχάνημα.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/console"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#102b27] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
            >
              Άνοιγμα demo
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
