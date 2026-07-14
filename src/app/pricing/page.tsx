import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CircleHelp,
  FileCheck2,
  Layers3,
  ReceiptText,
  Users,
  Wrench,
} from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  demoHref,
} from "@/components/fleetlever/commercial-site-shell";

export const metadata: Metadata = {
  title: "Τιμές",
  description:
    "Ετήσιες συμφωνίες FleetLever για επιχειρησιακό έλεγχο στόλου, με πληρωμένο pilot, σαφή όρια και ξεχωριστή υλοποίηση.",
  alternates: { canonical: "/pricing" },
};

const pilotIncludes = [
  "Μία κρίσιμη ροή της αυριανής δουλειάς",
  "Έως 30 κρίσιμα μηχανήματα",
  "Βασικό import και αρχική ρύθμιση",
  "Έναρξη, εβδομαδιαία ανασκόπηση και τελική αποτίμηση",
  "Συμφωνημένα κριτήρια επιτυχίας πριν ξεκινήσουμε",
] as const;

const pilotExcludes = [
  "Εκτεταμένο καθάρισμα ή μεγάλη μεταφορά δεδομένων",
  "Προσαρμοσμένα API, διασυνδέσεις ή ανάπτυξη κατά παραγγελία",
  "Απεριόριστη συμβουλευτική ή ανασχεδιασμό διαδικασιών",
] as const;

const plans = [
  {
    name: "Single Team",
    annual: "€6.000 / έτος",
    monthly: "ισοδύναμο με €500 / μήνα",
    audience: "Για μία ομάδα που πρέπει να ξέρει κάθε μέρα τι μπορεί να δουλέψει αύριο.",
    scope: "1 επιχειρησιακή μονάδα · έως 30 μηχανήματα",
    features: [
      "Πίνακας ετοιμότητας και φάκελοι μηχανημάτων",
      "Αποδείξεις, υπεύθυνοι, προθεσμίες και κλιμακώσεις",
      "Ιστορικό αποφάσεων και βασική υποστήριξη",
      "Γενναιόδωρη πρόσβαση για συνεισφέροντες",
    ],
    upgrade: "Όταν προστεθεί δεύτερη ομάδα ή ο στόλος ξεπεράσει τα 30 μηχανήματα.",
    featured: false,
  },
  {
    name: "Operations",
    annual: "€12.000 / έτος",
    monthly: "ισοδύναμο με €1.000 / μήνα",
    audience: "Για περισσότερες ομάδες, εγκαταστάσεις ή έργα που χρειάζονται κοινή εικόνα.",
    scope: "Έως 3 μονάδες · έως 100 μηχανήματα",
    features: [
      "Πολλαπλά πακέτα εργασίας και κοινή επισκόπηση",
      "Προηγμένοι ρόλοι, δικαιώματα και αναφορές",
      "Προηγμένες εξαγωγές και υποστήριξη προτεραιότητας",
      "Τριμηνιαία επιχειρησιακή ανασκόπηση",
    ],
    upgrade: "Όταν χρειάζονται πάνω από 100 μηχανήματα, SSO, API ή περισσότερες διοικητικές δομές.",
    featured: true,
  },
  {
    name: "Enterprise / Δημόσιος Τομέας",
    annual: "Από €24.000 / έτος",
    monthly: "τελική τιμή μετά την αποτύπωση του εύρους",
    audience: "Για οργανισμούς, δήμους και περιφέρειες με σύνθετη δομή, ασφάλεια και προμήθειες.",
    scope: "100+ μηχανήματα · πολλαπλές υπηρεσίες και περιοχές",
    features: [
      "Προσαρμοσμένες ροές, αναφορές και δικαιώματα",
      "API, διασυνδέσεις ERP/CMMS και SSO",
      "SLA, ασφάλεια, τεκμηρίωση προμηθειών",
      "Αποκλειστική έναρξη, εκπαίδευση και διάθεση",
    ],
    upgrade: "Η συμφωνία επεκτείνεται όταν προστίθενται νέες υπηρεσίες, περιοχές ή integrations.",
    featured: false,
  },
] as const;

const implementation = [
  {
    plan: "Single Team",
    price: "€1.500 εφάπαξ",
    detail: "Παραμετροποίηση, βασικό import, εκπαίδευση και έναρξη της πρώτης ροής.",
  },
  {
    plan: "Operations",
    price: "€3.000 εφάπαξ",
    detail: "Δομή μονάδων, ρόλοι, μεταφορά βασικών δεδομένων και συντονισμένη εκκίνηση.",
  },
  {
    plan: "Enterprise / Δημόσιος Τομέας",
    price: "Κατόπιν αποτύπωσης",
    detail: "Deployment, ασφάλεια, integrations, εκπαίδευση και απαιτήσεις προμηθειών.",
  },
] as const;

const expansion = [
  ["Επιπλέον επιχειρησιακή μονάδα", "€3.000 / έτος", "Νέα ομάδα, αποθήκη, έργο ή depot με δική του ροή."],
  ["Επιπλέον 25 μηχανήματα", "€1.500–€2.000 / έτος", "Η τελική τιμή εξαρτάται από το λειτουργικό εύρος."],
  ["Προσαρμοσμένη ροή ή διασύνδεση", "Ξεχωριστή προσφορά", "Τιμολογείται μόνο αφού οριστεί σαφές παραδοτέο."],
] as const;

const faqs = [
  [
    "Γιατί δεν υπάρχει δωρεάν πλάνο;",
    "Το FleetLever ξεκινά πάνω σε πραγματική λειτουργία και πραγματικά δεδομένα. Το πληρωμένο pilot είναι μικρό και μετρήσιμο, ώστε και οι δύο πλευρές να έχουν λόγο να το ολοκληρώσουν σωστά.",
  ],
  [
    "Η μηνιαία τιμολόγηση ακυρώνεται κάθε μήνα;",
    "Όχι. Η συμφωνία είναι 12μηνη. Η τιμολόγηση μπορεί να γίνει μηνιαία, τριμηνιαία ή ετήσια, χωρίς αυτό να μετατρέπει τη συμφωνία σε cancel-anytime συνδρομή.",
  ],
  [
    "Χρεώνεται κάθε οδηγός ή τεχνικός;",
    "Όχι επιθετικά ανά χρήστη. Διαχωρίζουμε τους επιχειρησιακούς χρήστες που αποφασίζουν από τους συνεισφέροντες που ανεβάζουν στοιχεία ή ολοκληρώνουν ενέργειες.",
  ],
  [
    "Τι τιμολογείται πάντα ξεχωριστά;",
    "Custom integrations, μεγάλη μεταφορά ή καθάρισμα δεδομένων, ανάπτυξη κατά παραγγελία, onsite συμβουλευτική και bespoke reporting συμφωνούνται πριν ξεκινήσουν.",
  ],
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />

      <section className="border-b border-[#d7dfdb] bg-white px-5 py-14 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto grid w-full max-w-[86rem] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#007c89]">Τιμές FleetLever</p>
            <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-[1.04] text-balance sm:text-6xl">
              Ετήσια συμφωνία για τον επιχειρησιακό έλεγχο του στόλου.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-8 text-[#53635f]">
              Το FleetLever δεν τιμολογείται σαν ένα ακόμη σύστημα καταγραφής. Τιμολογείται για τη λειτουργία που κρατά: ετοιμότητα, ιδιοκτησία, αποδείξεις και καταγεγραμμένες αποφάσεις πριν ξεκινήσει η επόμενη βάρδια.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={demoHref}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#103d37] px-5 text-sm font-bold text-white transition duration-200 hover:bg-[#007c89] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                Συζήτησε το pilot
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#plans"
                className="inline-flex min-h-12 items-center justify-center px-4 text-sm font-bold text-[#334641] transition-colors hover:text-[#007c89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe]"
              >
                Δες τις ετήσιες συμφωνίες
              </a>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-[#cfd8d4] bg-[#e7eeea] shadow-[0_24px_70px_rgba(16,61,55,0.14)]">
            <Image
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt="Ο πίνακας αυριανής ετοιμότητας του FleetLever"
              width={1920}
              height={1200}
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="h-auto w-full"
            />
            <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 overflow-hidden rounded-md border border-white/80 bg-white/95 shadow-[0_12px_30px_rgba(16,61,55,0.16)] backdrop-blur sm:inset-x-6 sm:bottom-6">
              {[["12 μήνες", "συμφωνία"], ["3 τρόποι", "τιμολόγησης"], ["0", "κρυφές χρεώσεις"]].map(([value, label]) => (
                <div key={label} className="border-r border-[#d7dfdb] px-3 py-3 last:border-r-0 sm:px-5 sm:py-4">
                  <p className="font-mono text-lg font-semibold text-[#103d37] sm:text-2xl">{value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase text-[#65766f] sm:text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#103d37] px-5 py-16 text-white sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr]">
            <div>
              <p className="text-sm font-bold uppercase text-[#73dce3]">Founding Pilot · πρώτοι 5 πελάτες</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">30 ημέρες με τον πραγματικό σας στόλο.</h2>
              <p className="mt-6 font-mono text-5xl font-semibold">€1.000</p>
              <p className="mt-2 text-sm font-medium text-[#c7d7d2]">εφάπαξ · χωρίς ΦΠΑ</p>
              <p className="mt-6 max-w-md text-base font-medium leading-7 text-[#d8e5e1]">
                Μία μικρή, αυστηρά ορισμένη περίοδος απόδειξης. Δείχνει αν το FleetLever βρίσκει εγκαίρως όσα σταματούν την αυριανή δουλειά.
              </p>
            </div>

            <div className="border-t border-white/20">
              <div className="grid gap-8 border-b border-white/20 py-7 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase text-[#73dce3]">Περιλαμβάνει</p>
                  <div className="mt-4 grid gap-3">
                    {pilotIncludes.map((item) => (
                      <p key={item} className="flex gap-3 text-sm font-semibold leading-6 text-[#eef6f3]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#73dce3]" aria-hidden="true" />
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#aabdb7]">Εκτός συμφωνημένου εύρους</p>
                  <div className="mt-4 grid gap-3">
                    {pilotExcludes.map((item) => (
                      <p key={item} className="text-sm font-medium leading-6 text-[#c7d7d2]">{item}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid gap-5 py-7 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-lg font-semibold">Το pilot δεν είναι δωρεάν δοκιμή. Είναι η πρώτη μετρήσιμη απόφαση.</p>
                  <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#c7d7d2]">
                    Το πλήρες ποσό πιστώνεται στην πρώτη ετήσια συμφωνία, εφόσον η μετατροπή γίνει εντός 15 ημερών από την τελική ανασκόπηση.
                  </p>
                </div>
                <a
                  href={demoHref}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition duration-200 hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Σχεδίασε το pilot
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="plans">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-6 border-b border-[#cfd8d4] pb-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#007c89]">Μετά το pilot</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight text-balance sm:text-5xl">Επιλέγετε λειτουργικό εύρος, όχι άδειες χρήσης.</h2>
            </div>
            <div className="lg:justify-self-end">
              <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f]">
                Κάθε πλάνο ορίζει πόσο στόλο και πόση οργανωτική πολυπλοκότητα καλύπτει. Η πρόσβαση των ανθρώπων που συνεισφέρουν δεν γίνεται αντικίνητρο στη χρήση.
              </p>
              <p className="mt-3 text-sm font-bold text-[#103d37]">Όλες οι τιμές είναι χωρίς ΦΠΑ.</p>
            </div>
          </div>

          <div className="border-b border-[#cfd8d4]">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`grid gap-7 border-t border-[#cfd8d4] px-0 py-8 lg:grid-cols-[0.72fr_0.86fr_1.15fr] lg:gap-10 lg:px-6 lg:py-10 ${plan.featured ? "bg-[#e7f2ee] lg:-mx-6 lg:px-12" : ""}`}
              >
                <div>
                  {plan.featured && (
                    <p className="mb-3 inline-flex rounded-sm bg-[#007c89] px-2 py-1 text-[11px] font-bold uppercase text-white">
                      Για πολλαπλές ομάδες
                    </p>
                  )}
                  <h3 className="text-2xl font-semibold">{plan.name}</h3>
                  <p className="mt-4 font-mono text-3xl font-semibold text-[#103d37]">{plan.annual}</p>
                  <p className="mt-1 text-sm font-medium text-[#65766f]">{plan.monthly}</p>
                  <a href={demoHref} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#007c89] transition-colors hover:text-[#103d37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe]">
                    Συζήτησε αυτό το εύρος
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#007c89]">Για ποιον είναι</p>
                  <p className="mt-3 text-base font-semibold leading-7">{plan.audience}</p>
                  <p className="mt-5 border-l-2 border-[#00aebe] pl-4 text-sm font-bold leading-6 text-[#334641]">{plan.scope}</p>
                  <p className="mt-6 text-xs font-bold uppercase text-[#65766f]">Αναβάθμιση όταν</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#53635f]">{plan.upgrade}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-[#007c89]">Περιλαμβάνει</p>
                  <div className="mt-3 grid gap-3">
                    {plan.features.map((feature) => (
                      <p key={feature} className="flex gap-3 text-sm font-semibold leading-6 text-[#334641]">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#007c89]" aria-hidden="true" />
                        {feature}
                      </p>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-7 grid gap-5 border-y border-[#cfd8d4] py-6 md:grid-cols-3">
            {[
              [CalendarCheck, "12μηνη συμφωνία", "Μηνιαία, τριμηνιαία ή ετήσια τιμολόγηση."],
              [Users, "Όχι επιθετική χρέωση ανά χρήστη", "Χωριστοί ρόλοι για αποφάσεις και συνεισφορά."],
              [ReceiptText, "Καθαροί όροι", "Scope, υποστήριξη και όρια πριν από την υπογραφή."],
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
        <div className="mx-auto grid w-full max-w-[86rem] gap-12 lg:grid-cols-[0.64fr_1.36fr]">
          <div>
            <Wrench className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
            <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Υλοποίηση</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">Η έναρξη τιμολογείται μία φορά και φαίνεται καθαρά.</h2>
            <p className="mt-5 max-w-md text-base font-medium leading-7 text-[#53635f]">
              Η υλοποίηση καλύπτει τη συμφωνημένη παραμετροποίηση. Δεν κρύβουμε μεταφορά δεδομένων, ανάπτυξη κατά παραγγελία ή συμβουλευτική μέσα στην ετήσια άδεια.
            </p>
          </div>
          <div className="border-t border-[#cfd8d4]">
            {implementation.map((item) => (
              <article key={item.plan} className="grid gap-3 border-b border-[#cfd8d4] py-6 sm:grid-cols-[0.72fr_0.72fr_1.2fr] sm:gap-7">
                <h3 className="text-base font-semibold">{item.plan}</h3>
                <p className="font-mono text-lg font-semibold text-[#103d37]">{item.price}</p>
                <p className="text-sm font-medium leading-6 text-[#53635f]">{item.detail}</p>
              </article>
            ))}
            <div className="mt-6 border-l-2 border-[#00aebe] bg-[#edf5f2] px-5 py-4">
              <p className="text-sm font-semibold leading-6 text-[#334641]">
                Σε μετατροπή του Founding Pilot μπορεί να πιστωθεί ή να απαλειφθεί η βασική υλοποίηση. Προσαρμοσμένες διασυνδέσεις, μεταφορά ή καθάρισμα δεδομένων, ανάπτυξη κατά παραγγελία και επιτόπια συμβουλευτική δεν συμψηφίζονται.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#e8eeea] px-5 py-16 sm:px-7 lg:px-10 lg:py-20">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <Layers3 className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
              <h2 className="mt-6 text-4xl font-semibold leading-tight">Η επέκταση γίνεται με τρεις καθαρούς μοχλούς.</h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f] lg:justify-self-end">
              Η τιμή μεγαλώνει όταν μεγαλώνει η πραγματική λειτουργία, όχι επειδή ένας ακόμη τεχνικός χρειάζεται να ανεβάσει μία φωτογραφία.
            </p>
          </div>
          <div className="mt-10 border-t border-[#bdcbc5]">
            {expansion.map(([title, price, description]) => (
              <article key={title} className="grid gap-3 border-b border-[#bdcbc5] py-6 md:grid-cols-[1fr_0.7fr_1.2fr] md:gap-8">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="font-mono text-lg font-semibold text-[#103d37]">{price}</p>
                <p className="text-sm font-medium leading-6 text-[#53635f]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid w-full max-w-[86rem] gap-12 lg:grid-cols-[0.64fr_1.36fr]">
          <div>
            <FileCheck2 className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
            <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Εμπορικοί όροι</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">Καμία έκπληξη μετά τη συμφωνία.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-[#cfd8d4] bg-[#cfd8d4] sm:grid-cols-2">
            {[
              ["Διάρκεια", "12μηνη συμφωνία. Η μηνιαία τιμολόγηση δεν σημαίνει ακύρωση ανά μήνα."],
              ["Χρήστες", "Επιχειρησιακοί χρήστες για αποφάσεις και γενναιόδωρη πρόσβαση για συνεισφέροντες."],
              ["Υποστήριξη", "Βασική, προτεραιότητας ή SLA ανάλογα με το λειτουργικό εύρος του πλάνου."],
              ["Εκπτώσεις", "Δίνονται μόνο όταν ανταλλάσσονται με αξία: διάρκεια, εύρος, δικαίωμα δημόσιας αναφοράς ή προπληρωμή."],
            ].map(([title, body]) => (
              <div key={title} className="bg-[#f8faf7] p-6">
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-[#53635f]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#d7dfdb] bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[0.62fr_1.38fr]">
          <div>
            <CircleHelp className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
            <h2 className="mt-6 text-4xl font-semibold leading-tight">Πριν αποφασίσετε.</h2>
            <p className="mt-4 max-w-md text-base font-medium leading-7 text-[#53635f]">
              Οι απαντήσεις που συνήθως χρειάζονται λειτουργία, οικονομική διεύθυνση και προμήθειες.
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
        <div className="absolute inset-0 -z-10 bg-[#071b18]/84" aria-hidden="true" />
        <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[#73dce3]">Η σωστή πρώτη κίνηση</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-balance sm:text-5xl">
              Ορίστε μία κρίσιμη ροή. Μετρήστε τι αλλάζει σε 30 ημέρες.
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
