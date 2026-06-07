import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Construction,
  Landmark,
  PackageCheck,
  Shovel,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
import { ScreenshotCarousel } from "@/components/fleetlever/screenshot-carousel";
import { ScreenshotMagnifier } from "@/components/fleetlever/screenshot-magnifier";

const landingCopy = {
  en: {
    navLinks: [
      ["How it works", "#how-it-works"],
      ["Product", "#product"],
      ["Use cases", "#use-cases"],
      ["Pricing", "#pricing"],
    ],
    login: "Login",
    demo: "Request demo",
    heroEyebrow: "Construction work release software",
    heroTitle: "Know what will stop tomorrow's work before it happens.",
    heroBody:
      "FleetLever helps construction teams check machines, certificates, inspections, service blockers and owners before work is committed.",
    heroPrimary: "Request construction demo",
    heroSecondary: "See the release workflow",
    heroNote: "Built for crane, rental, earthworks and equipment-heavy construction teams.",
    heroAlt: "FleetLever tomorrow readiness dashboard showing blocked, review and ready machines",
    heroBadges: ["2 blocked machines", "1 needs review", "Release decision saved"],
    problemTitle: "Tomorrow fails because something was assumed ready.",
    problemBody: "FleetLever turns assumptions into release decisions.",
    problemCards: [
      ["Machine scheduled.", "But certificate expired."],
      ["Crew committed.", "But service blocker open."],
      ["Rental promised.", "But nobody confirmed readiness."],
    ],
    workflowEyebrow: "One daily release workflow",
    workflowTitle: "Just the work-release decision.",
    workflowBody: "No ERP rollout. No GPS hardware. No messy feature maze.",
    workflowCta: "See example release check",
    workflowSteps: [
      "Select tomorrow's worksite",
      "Check required machines",
      "Find blockers",
      "Release only what is ready",
    ],
    productEyebrow: "Tomorrow's Work",
    productTitle: "The first screen before tomorrow is committed.",
    productBody: "See which machines are Ready, Need Review, or Blocked before crews and machines are sent.",
    statusLabels: ["Ready", "Needs Review", "Blocked"],
    productAlt: "Tomorrow readiness release board",
    stopsEyebrow: "Why work stops",
    stopsTitle: "When work cannot start, FleetLever shows why.",
    stopsBody: "Every blocked machine has a reason, owner, next action and due time.",
    stopsItems: ["Reason for blocker", "Responsible owner", "Required action", "Deadline", "Evidence attached"],
    stopsAlt: "Why tomorrow stops machine drawer",
    passportEyebrow: "Machine Passport",
    passportTitle: "Every machine gets an operational memory.",
    passportBody: "Certificates, inspections, service history, documents and readiness state live in one machine passport.",
    passportNote: "No more hunting through folders, WhatsApp, email and spreadsheets.",
    passportAlt: "Machine passport drawer with documents and service record",
    auditEyebrow: "Audit Trail",
    auditTitle: "Release decisions become defensible.",
    auditBody: "FleetLever records what was released, what was blocked, who acted, and what changed.",
    auditNote: "This reduces blame, confusion, and “who knew?” conversations.",
    auditAlt: "FleetLever decision history audit trail",
    useCasesTitle: "Built for equipment-dependent construction teams.",
    useCases: [
      {
        title: "Crane and lifting companies",
        body: "If blocked equipment delays your work, FleetLever is relevant.",
      },
      {
        title: "Machinery rental companies",
        body: "If blocked equipment delays your work, FleetLever is relevant.",
      },
      {
        title: "Earthmoving contractors",
        body: "If blocked equipment delays your work, FleetLever is relevant.",
      },
      {
        title: "Infrastructure subcontractors",
        body: "If blocked equipment delays your work, FleetLever is relevant.",
      },
    ],
    valueEyebrow: "Why pay",
    valueTitle: "One prevented blocked start can pay for months.",
    valueBody: "The point is not managing documents. The point is catching the failure before tomorrow morning.",
    blockedCrane: {
      label: "A blocked crane",
      price: "€1,000-€3,000+",
      body: "Exposure from one delayed start.",
    },
    fleetleverValue: {
      label: "FleetLever",
      price: "From €499/mo",
      body: "After a focused pilot proves value.",
    },
    pricingTitle: "Start narrow. Prove value.",
    pricing: [
      {
        name: "Pilot",
        price: "€1,000 fixed",
        detail: "30 days",
        items: ["One company", "One worksite workflow", "Concierge setup"],
      },
      {
        name: "Starter",
        price: "€499/month",
        detail: "After pilot",
        items: ["Up to 30 critical machines", "Tomorrow release board", "Machine passports", "Blocker owners", "Decision history"],
      },
      {
        name: "Operations",
        price: "€999/month",
        detail: "For larger teams",
        items: ["Multiple worksites", "More users", "Priority onboarding", "Advanced exports"],
      },
    ],
    finalEyebrow: "Before you commit tomorrow's work",
    finalTitle: "Check FleetLever.",
    finalBody: "Know what is ready, what is blocked, and who owns the fix.",
    finalCta: "Request pilot",
    footerTagline: "Construction Work Release Software",
    footerLinks: ["Product", "Pricing", "Demo", "Contact"],
  },
  el: {
    navLinks: [
      ["Πώς λειτουργεί", "#how-it-works"],
      ["Προϊόν", "#product"],
      ["Χρήσεις", "#use-cases"],
      ["Τιμές", "#pricing"],
    ],
    login: "Σύνδεση",
    demo: "Ζητήστε demo",
    heroEyebrow: "Για γερανούς, χωματουργικά και μηχανήματα έργου",
    heroTitle: "Ξέρεις αν η αυριανή δουλειά μπορεί να ξεκινήσει;",
    heroBody:
      "Το FleetLever δείχνει ποια μηχανήματα είναι έτοιμα, ποια χρειάζονται ενέργεια και ποια μπλοκάρουν το πρόγραμμα πριν δεσμεύσεις συνεργεία και εξοπλισμό.",
    heroPrimary: "Ζήτησε Demo",
    heroSecondary: "Δες το Dashboard",
    heroNote: "Για ομάδες που εξαρτώνται από μηχανήματα έργου.",
    heroAlt: "Πίνακας readiness του FleetLever με blocked, review και ready μηχανήματα",
    problemEyebrow: "Το πρόβλημα",
    problemTitle: "Η δουλειά δεν σταματά από έλλειψη προγράμματος. Σταματά από κάτι που δεν ελέγχθηκε.",
    problemBody: "Μηχάνημα, πιστοποιητικό, service, χειριστής ή ενοικίαση. Αν ένα από αυτά δεν είναι έτοιμο, το αυριανό πρόγραμμα χαλάει.",
    problemCards: [
      {
        title: "Το μηχάνημα μπήκε στο πρόγραμμα.",
        problem: "Το πιστοποιητικό είχε λήξει.",
        footer: "Το πρόβλημα φαίνεται όταν είναι ήδη αργά.",
      },
      {
        title: "Το συνεργείο δεσμεύτηκε.",
        problem: "Υπήρχε ανοιχτό service.",
        footer: "Οι άνθρωποι περιμένουν. Η δουλειά πιέζεται.",
      },
      {
        title: "Η ενοικίαση θεωρήθηκε έτοιμη.",
        problem: "Κανείς δεν επιβεβαίωσε παράδοση.",
        footer: "Το εργοτάξιο ξεκινά με αβεβαιότητα.",
      },
    ],
    problemTransition:
      "FleetLever μετατρέπει αυτές τις υποθέσεις σε μία καθαρή απόφαση: Μπορεί να ξεκινήσει η αυριανή δουλειά ή όχι;",
    workflowEyebrow: "Μία καθημερινή ροή ελέγχου",
    workflowTitle: "Ένας απλός έλεγχος πριν δεσμευτεί η αυριανή δουλειά.",
    workflowBody: "Χωρίς ERP rollout. Χωρίς GPS hardware. Χωρίς περίπλοκο σύστημα. Μόνο η απόφαση που έχει σημασία.",
    workflowCta: "Δείτε παράδειγμα ελέγχου",
    workflowSteps: [
      "Επιλέγεις εργοτάξιο",
      "Βλέπεις τα απαιτούμενα μηχανήματα",
      "Το FleetLever βρίσκει blockers",
      "Απελευθερώνεις μόνο ό,τι είναι έτοιμο",
    ],
    productEyebrow: "Αυριανή δουλειά",
    productTitle: "Η πρώτη οθόνη πριν δεσμευτεί η αυριανή δουλειά.",
    productBody: "Δείτε ποια μηχανήματα είναι ready, ποια θέλουν έλεγχο και ποια είναι blocked πριν φύγουν συνεργεία και εξοπλισμός.",
    statusLabels: ["Ready", "Σε έλεγχο", "Blocked"],
    productAlt: "Πίνακας readiness για την αυριανή δουλειά",
    stopsEyebrow: "Γιατί σταματά η δουλειά",
    stopsTitle: "Όταν η δουλειά δεν μπορεί να ξεκινήσει, το FleetLever δείχνει το γιατί.",
    stopsBody: "Κάθε blocked μηχάνημα έχει αιτία, υπεύθυνο, επόμενη ενέργεια και προθεσμία.",
    stopsItems: ["Αιτία blocker", "Υπεύθυνος", "Απαραίτητη ενέργεια", "Προθεσμία", "Συνημμένο evidence"],
    stopsAlt: "Drawer μηχανήματος που δείχνει γιατί σταματά η αυριανή δουλειά",
    passportEyebrow: "Machine Passport",
    passportTitle: "Κάθε μηχάνημα αποκτά επιχειρησιακή μνήμη.",
    passportBody: "Πιστοποιητικά, επιθεωρήσεις, ιστορικό service, έγγραφα και readiness state ζουν σε ένα machine passport.",
    passportNote: "Όχι άλλο ψάξιμο σε φακέλους, WhatsApp, email και spreadsheets.",
    passportAlt: "Machine passport drawer με έγγραφα και service record",
    auditEyebrow: "Ιστορικό αποφάσεων",
    auditTitle: "Οι αποφάσεις γίνονται τεκμηριωμένες.",
    auditBody: "Το FleetLever κρατά τι απελευθερώθηκε, τι μπλοκαρίστηκε, ποιος ενήργησε και τι άλλαξε.",
    auditNote: "Λιγότερες ευθύνες στον αέρα, λιγότερη σύγχυση, λιγότερο “ποιος το ήξερε;”.",
    auditAlt: "Ιστορικό αποφάσεων FleetLever με audit trail",
    useCasesTitle: "Για ομάδες που εξαρτώνται από μηχανήματα έργου.",
    useCases: [
      {
        title: "Εταιρείες γερανών και ανυψώσεων",
        body: "Όταν ένας γερανός μπλοκάρει, μπλοκάρει όλο το πρόγραμμα.",
      },
      {
        title: "Εταιρείες ενοικίασης μηχανημάτων",
        body: "Ξέρετε τι μπορεί να φύγει αύριο και τι χρειάζεται έλεγχο πρώτα.",
      },
      {
        title: "Χωματουργικοί εργολάβοι",
        body: "Μειώστε χαμένες εκκινήσεις από ληγμένα έγγραφα ή ανοιχτό service.",
      },
      {
        title: "Υπεργολάβοι υποδομών",
        body: "Κρατήστε καθαρή εικόνα ανά εργοτάξιο, μηχάνημα και υπεύθυνο.",
      },
    ],
    valueEyebrow: "Γιατί αξίζει",
    valueTitle: "Μία αποφυγή χαμένης εκκίνησης μπορεί να πληρώσει μήνες χρήσης.",
    valueBody: "Δεν πληρώνετε για “διαχείριση εγγράφων”. Πληρώνετε για να πιάσετε το πρόβλημα πριν φανεί αύριο το πρωί.",
    blockedCrane: {
      label: "Ένας μπλοκαρισμένος γερανός",
      price: "€1.000-€3.000+",
      body: "Έκθεση από μία καθυστερημένη εκκίνηση.",
    },
    fleetleverValue: {
      label: "FleetLever",
      price: "Από €499/μήνα",
      body: "Μετά από pilot που αποδεικνύει αξία.",
    },
    pricingTitle: "Ξεκινήστε στενά. Αποδείξτε αξία.",
    pricing: [
      {
        name: "Pilot",
        price: "€1.000 fixed",
        detail: "30 ημέρες",
        items: ["Μία εταιρεία", "Μία ροή εργοταξίου", "Concierge setup"],
      },
      {
        name: "Starter",
        price: "€499/μήνα",
        detail: "Μετά το pilot",
        items: ["Έως 30 κρίσιμα μηχανήματα", "Tomorrow release board", "Machine passports", "Υπεύθυνοι blockers", "Decision history"],
      },
      {
        name: "Operations",
        price: "€999/μήνα",
        detail: "Για μεγαλύτερες ομάδες",
        items: ["Πολλαπλά εργοτάξια", "Περισσότεροι χρήστες", "Priority onboarding", "Advanced exports"],
      },
    ],
    finalEyebrow: "Πριν δεσμεύσετε την αυριανή δουλειά",
    finalTitle: "Ελέγξτε το FleetLever.",
    finalBody: "Δείτε τι είναι έτοιμο, τι είναι blocked και ποιος έχει την επόμενη ενέργεια.",
    finalCta: "Ζητήστε pilot",
    footerTagline: "Software ελέγχου εργασιών κατασκευής",
    footerLinks: ["Προϊόν", "Τιμές", "Demo", "Επικοινωνία"],
  },
} as const;

const copy = landingCopy.el;

const loginHref = "/login";

const whyStopsCarouselSlides = [
  {
    src: "/fleetlever/site/machine-why-tomorrow-stops-drawer.png",
    alt: "Drawer μηχανήματος που δείχνει lifting certificate, inspection και service blockers",
    label: "Ακριβής αιτία",
    caption: "Το blocker εμφανίζεται με λόγο, owner και επόμενη ενέργεια.",
    width: 3840,
    height: 2400,
  },
  {
    src: "/fleetlever/site/machine-drawer-why-tomorrow-stops-from-inventory.png",
    alt: "Inventory μηχανημάτων με ανοιχτό Why tomorrow stops drawer",
    label: "Μηχάνημα σε context",
    caption: "Βλέπεις ποιο μηχάνημα μπλοκάρει και γιατί.",
    width: 3840,
    height: 2442,
  },
  {
    src: "/fleetlever/site/stop-list.png",
    alt: "Stop List με blockers που χρειάζονται ενέργεια πριν το πρόγραμμα",
    label: "Λίστα ενεργειών",
    caption: "Τα ανοιχτά θέματα δεν χάνονται σε email και μηνύματα.",
    width: 3840,
    height: 2400,
  },
  {
    src: "/fleetlever/site/decision-history-audit-trail-carousel.png",
    alt: "Decision History audit trail με καταγεγραμμένες αποφάσεις",
    label: "Απόφαση με ιστορικό",
    caption: "Κρατά ποιος έκανε τι, πότε και με ποια απόδειξη.",
    width: 3840,
    height: 2442,
  },
] as const;

const machinePassportCards = [
  {
    code: "CR-04",
    title: "Mobile Crane",
    photo: "/fleetlever/machines/cr04-crane.jpg",
    appShot: "/fleetlever/site/machine-passport-drawer.png",
    status: "Blocked",
    owner: "Dimitris",
    note: "Lifting certificate expired",
    alt: "Mobile crane on a construction site",
  },
  {
    code: "EX-12",
    title: "Excavator",
    photo: "/fleetlever/machines/ex12-excavator.jpg",
    appShot: "/fleetlever/site/machine-drawer-from-inventory.png",
    status: "Ready",
    owner: "Workshop",
    note: "No blocker found",
    alt: "Excavator working on a construction site",
  },
  {
    code: "LD-03",
    title: "Loader",
    photo: "/fleetlever/machines/ld03-loader.jpg",
    appShot: "/fleetlever/site/stop-list.png",
    status: "Needs review",
    owner: "Kostas",
    note: "Inspection due in 3 days",
    alt: "Loader machine at a construction site",
  },
  {
    code: "TR-08",
    title: "Truck",
    photo: "/fleetlever/machines/tr08-truck.jpg",
    appShot: "/fleetlever/site/tomorrow-readiness-dashboard.png",
    status: "Ready",
    owner: "Maria",
    note: "Work package confirmed",
    alt: "Construction truck on site",
  },
] as const;

const useCasePanels = [
  {
    icon: Construction,
    title: "Εταιρείες γερανών",
    body: "Release μόνο όταν πιστοποιητικά, χειριστής, service και evidence είναι καθαρά.",
    signal: "Lifting readiness",
  },
  {
    icon: Shovel,
    title: "Χωματουργικά έργα",
    body: "Βλέπεις ποιο excavator, loader ή truck μπορεί να δουλέψει αύριο και ποιο μπλοκάρει.",
    signal: "Site start check",
  },
  {
    icon: PackageCheck,
    title: "Ενοικιάσεις μηχανημάτων",
    body: "Κρατάς παράδοση, ευθύνη, documents και readiness σε ένα κοινό operational record.",
    signal: "Rental handoff",
  },
  {
    icon: Landmark,
    title: "Δημόσια έργα",
    body: "Οι αποφάσεις μένουν τεκμηριωμένες όταν χρειάζεται audit, απόδειξη ή εξήγηση.",
    signal: "Proof trail",
  },
] as const;

function BrowserFrame({
  src,
  alt,
  width = 1920,
  height = 1200,
  priority = false,
  className = "",
  zoom,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  zoom?: number;
}) {
  return (
    <div className={`overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_24px_80px_rgba(19,33,31,0.15)] transition duration-300 ease-out hover:-translate-y-3 hover:rotate-[0.65deg] hover:shadow-[0_44px_120px_rgba(19,33,31,0.32)] ${className}`}>
      <div className="flex h-10 items-center gap-2 border-b border-[#e3e9e5] bg-[#f8faf7] px-4">
        <span className="h-3 w-3 rounded-full bg-[#ff6b5f]" />
        <span className="h-3 w-3 rounded-full bg-[#ffcc4d]" />
        <span className="h-3 w-3 rounded-full bg-[#34c27a]" />
        <span className="ml-3 h-4 flex-1 rounded-full bg-[#e6eeea]" />
      </div>
      <ScreenshotMagnifier
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        imageClassName="h-auto w-full"
        sizes="(min-width: 1024px) 58vw, 100vw"
        zoom={zoom}
      />
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">{eyebrow}</p> : null}
      <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl lg:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-lg leading-8 text-[#5f6c7b]">{body}</p> : null}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f4f3ef] text-[#13211f]">
      <header className="sticky top-0 z-30 border-b border-[#dbe2de] bg-[#f4f3ef]/92 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between gap-5 px-5 sm:px-6 lg:px-8">
          <Link href="/" aria-label="Αρχική FleetLever" className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe]">
            <FleetLeverLogo />
          </Link>
          <nav aria-label="Κύρια πλοήγηση" className="hidden items-center gap-6 lg:flex">
            {copy.navLinks.map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-semibold text-[#4d5f5a] transition hover:text-[#007C89]">
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href={loginHref}
              className="hidden min-h-11 items-center rounded-md border border-[#cdd8d3] bg-white px-4 text-sm font-semibold text-[#243834] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] sm:inline-flex"
            >
              {copy.login}
            </Link>
            <a
              href="mailto:hello@fleetlever.com?subject=FleetLever κατασκευαστικό demo"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#102b27] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
            >
              {copy.demo}
            </a>
          </div>
        </div>
      </header>

      <section className="bg-white px-5 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-18">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">{copy.heroEyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.04] text-[#13211f] sm:text-6xl">
              {copy.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-[#53635f]">
              {copy.heroBody}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="mailto:hello@fleetlever.com?subject=FleetLever κατασκευαστικό demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00aebe] px-5 text-sm font-bold text-white shadow-[0_18px_45px_rgba(0,174,190,0.22)] transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                {copy.heroPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#product"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#cdd8d3] bg-white px-5 text-sm font-bold text-[#243834] shadow-sm transition hover:border-[#007C89] hover:text-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
              >
                {copy.heroSecondary}
              </a>
            </div>
            <p className="mt-8 text-sm font-semibold text-[#667771]">
              {copy.heroNote}
            </p>
          </div>

          <div className="relative isolate py-10 lg:py-16">
            <div className="absolute inset-y-8 right-0 z-0 hidden w-2/3 rounded-full bg-[#00aebe]/8 blur-3xl lg:block" aria-hidden="true" />
            <BrowserFrame
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt={copy.heroAlt}
              priority
              className="relative z-10"
            />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-y border-[#dbe2de] bg-[#f7f8f5] px-5 py-20 sm:px-6 lg:px-8" id="problem">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          <div className="relative min-w-0">
            <BrowserFrame
              src="/fleetlever/site/machine-drawer-why-tomorrow-stops-from-inventory.png"
              alt="FleetLever machine inventory with the Why tomorrow stops drawer open"
              width={3840}
              height={2442}
              zoom={4.25}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Το πρόβλημα</p>
            <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Το μηχάνημα ήταν στο πρόγραμμα.
              <span className="block">Αλλά...</span>
              <span className="block text-[#b42318]">Δεν ήταν έτοιμο.</span>
            </h2>
            <div className="mt-8 grid gap-4">
              {[
                ["Ο γερανός είχε προγραμματιστεί.", "Το πιστοποιητικό είχε λήξει."],
                ["Το συνεργείο είχε δεσμευτεί.", "Το service δεν είχε ολοκληρωθεί."],
                ["Η ενοικίαση είχε επιβεβαιωθεί.", "Το μηχάνημα δεν παραδόθηκε ποτέ."],
              ].map(([assumption, reality]) => (
                <div key={assumption} className="rounded-lg bg-white p-5 shadow-[0_14px_40px_rgba(19,33,31,0.07)]">
                  <p className="text-lg font-semibold leading-7 text-[#13211f]">{assumption}</p>
                  <p className="mt-2 text-xl font-semibold leading-7 text-[#b42318]">{reality}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24 bg-white px-5 py-20 sm:px-6 lg:px-8" id="how-it-works">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Πώς λειτουργεί</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Ένας έλεγχος πριν δεσμευτεί η αυριανή δουλειά.
            </h2>
          </div>
          <div className="mx-auto mt-14 max-w-5xl">
            {[
              {
                title: "Επιλέγεις εργοτάξιο",
                body: "Ορίζεις ποια δουλειά πρέπει να ξεκινήσει αύριο.",
              },
              {
                title: "Βλέπεις τα απαιτούμενα μηχανήματα",
                body: "Όλος ο κρίσιμος εξοπλισμός μπαίνει στον ίδιο έλεγχο.",
              },
              {
                title: "Το FleetLever βρίσκει τι μπλοκάρει",
                body: "Ληγμένα έγγραφα, ανοιχτό service, διαθεσιμότητα ή παράδοση.",
                featured: true,
              },
              {
                title: "Απελευθερώνεις μόνο ό,τι είναι έτοιμο",
                body: "Η αυριανή δουλειά δεσμεύεται με καθαρή απόφαση.",
              },
            ].map((step, index) => (
              <div key={step.title} className="relative grid gap-5 pb-8 last:pb-0 sm:grid-cols-[5rem_1fr]">
                {index < 3 ? (
                  <div className="absolute bottom-0 left-10 top-20 hidden w-px bg-[#dbe2de] sm:block" aria-hidden="true" />
                ) : null}
                <div className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-semibold ${
                  step.featured
                    ? "border-[#f2b8b2] bg-[#fff6f4] text-[#b42318] shadow-[0_16px_44px_rgba(180,35,24,0.12)]"
                    : "border-[#dbe2de] bg-white text-[#007C89]"
                }`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className={`rounded-lg border p-6 ${
                  step.featured
                    ? "border-[#f2b8b2] bg-[#fff6f4] shadow-[0_18px_50px_rgba(180,35,24,0.1)]"
                    : "border-[#dbe2de] bg-white shadow-sm"
                }`}>
                  <p className={`text-2xl font-semibold leading-8 ${step.featured ? "text-[#b42318]" : "text-[#13211f]"}`}>
                    {step.title}
                  </p>
                  <p className="mt-2 max-w-2xl text-base font-semibold leading-7 text-[#667771]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-20 text-white sm:px-6 lg:px-8" id="product">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-normal text-[#72dce5]">{copy.stopsEyebrow}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Όταν κάτι μπλοκάρει τη δουλειά, το FleetLever δείχνει ακριβώς γιατί.
            </h2>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Τι συμβαίνει", "Ποιος είναι υπεύθυνος", "Τι πρέπει να γίνει", "Πότε πρέπει να γίνει"].map((item) => (
              <div key={item} className="flex min-h-20 items-center gap-3 rounded-lg border border-white/10 bg-white/8 p-5 text-base font-bold text-[#eef7f4] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <CheckCircle2 className="h-5 w-5 text-[#72dce5]" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>

          <div className="relative mx-auto mt-10 max-w-6xl">
            <ScreenshotCarousel slides={whyStopsCarouselSlides} />
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <SectionHeader
              eyebrow="Machine Passport"
              title="Όλα για το μηχάνημα σε ένα σημείο."
              body="Ένα καθαρό record για κάθε μηχάνημα: certificates, service, inspections, έγγραφα, owner και readiness."
            />
            <div className="grid gap-3 sm:grid-cols-4">
              {["Πιστοποιητικά", "Service", "Επιθεωρήσεις", "Έγγραφα"].map((item) => (
                <div key={item} className="rounded-lg border border-[#dce5e1] bg-white px-4 py-3 text-sm font-bold text-[#263b37] shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_28px_90px_rgba(19,33,31,0.14)]">
            <div className="grid gap-0 lg:grid-cols-[1fr_18rem]">
              <div>
                <div className="flex h-10 items-center gap-2 border-b border-[#e3e9e5] bg-[#f8faf7] px-4">
                  <span className="h-3 w-3 rounded-full bg-[#ff6b5f]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffcc4d]" />
                  <span className="h-3 w-3 rounded-full bg-[#34c27a]" />
                  <span className="ml-3 h-4 flex-1 rounded-full bg-[#e6eeea]" />
                </div>
                <ScreenshotMagnifier
                  src="/fleetlever/site/machine-drawer-from-inventory.png"
                  alt="FleetLever machines inventory with real machine photos and an open Machine Passport drawer"
                  width={3840}
                  height={2442}
                  imageClassName="h-auto w-full"
                  sizes="(min-width: 1024px) 58rem, 100vw"
                />
              </div>
              <div className="border-t border-[#e3e9e5] bg-[#f8faf7] p-5 lg:border-l lg:border-t-0">
                <p className="text-xs font-bold uppercase text-[#007C89]">Live machine state</p>
                <div className="mt-4 space-y-3">
                  {machinePassportCards.slice(0, 3).map((machine) => (
                    <div key={machine.code} className="rounded-lg border border-[#dce5e1] bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold uppercase text-[#007C89]">{machine.code}</p>
                          <p className="mt-1 text-base font-semibold text-[#13211f]">{machine.title}</p>
                        </div>
                        <span className="rounded-full bg-[#edf6f3] px-3 py-1 text-xs font-bold text-[#007C89]">{machine.status}</span>
                      </div>
                      <p className="mt-3 text-sm font-semibold leading-6 text-[#53635f]">{machine.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {machinePassportCards.map((machine) => (
              <article key={machine.code} className="group overflow-hidden rounded-lg border border-[#d5dfda] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(19,33,31,0.15)]">
                <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe7e2]">
                  <Image
                    src={machine.photo}
                    alt={machine.alt}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.04]"
                    sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-[#007C89]">{machine.code}</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#13211f]">{machine.title}</h3>
                    </div>
                    <span className="rounded-full bg-[#f1f4f2] px-3 py-1 text-xs font-bold text-[#53635f]">{machine.status}</span>
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#53635f]">{machine.note}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold uppercase tracking-normal text-[#72dce5]">{copy.auditEyebrow}</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
              Ποιος έκανε τι. Και πότε.
            </h2>
            <p className="mt-5 text-2xl font-semibold leading-tight text-[#eef7f4] sm:text-3xl">
              Τέλος στα: “Δεν το ήξερα.”
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["Τι άλλαξε", "Ποιος το έκανε", "Πότε έγινε", "Με ποια απόδειξη"].map((item) => (
              <div key={item} className="flex min-h-20 items-center gap-3 rounded-lg border border-white/10 bg-white/8 p-5 text-base font-bold text-[#eef7f4] shadow-[0_18px_60px_rgba(0,0,0,0.18)]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#72dce5]" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>

          <div className="relative mx-auto mt-10 max-w-6xl">
            <BrowserFrame
              src="/fleetlever/site/decision-history-audit-trail.png"
              alt={copy.auditAlt}
              width={3840}
              height={2644}
              className="border-white/15 shadow-[0_34px_110px_rgba(0,0,0,0.32)]"
              zoom={1.7}
            />
          </div>
        </div>
      </section>

      <section className="border-y border-[#dbe2de] bg-[#f7f8f5] px-5 py-20 sm:px-6 lg:px-8" id="use-cases">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Χρήσεις</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-[#13211f] sm:text-4xl lg:text-5xl">
                Για ομάδες που χάνουν χρόνο όταν ένα μηχάνημα δεν είναι έτοιμο.
              </h2>
            </div>
            <div className="rounded-lg border border-[#cdd8d3] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#102b27] text-[#72dce5]">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-base font-semibold leading-7 text-[#53635f]">
                  FleetLever ταιριάζει όπου η αυριανή δουλειά εξαρτάται από machines, certificates, service, delivery και καθαρή ευθύνη.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {useCasePanels.map((useCase) => {
              const Icon = useCase.icon;

              return (
                <article key={useCase.title} className="group overflow-hidden rounded-lg border border-[#d5dfda] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(19,33,31,0.14)]">
                  <div className="h-1.5 bg-[#007C89]" />
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#edf6f3] text-[#007C89]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <span className="rounded-full bg-[#f1f4f2] px-3 py-1 text-xs font-bold text-[#53635f]">{useCase.signal}</span>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold leading-7 text-[#13211f]">{useCase.title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#53635f]">{useCase.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#72dce5]">{copy.valueEyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-5xl">
              Ένα μπλοκαρισμένο ξεκίνημα αρκεί.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/8 p-6">
              <p className="text-sm font-bold uppercase text-[#ffcf8a]">Χαμένη ημέρα γερανού</p>
              <p className="mt-2 text-4xl font-semibold">{copy.blockedCrane.price}</p>
            </div>
            <div className="rounded-lg border border-[#72dce5]/30 bg-white p-6 text-[#13211f]">
              <p className="text-sm font-bold uppercase text-[#007C89]">{copy.fleetleverValue.label}</p>
              <p className="mt-2 text-4xl font-semibold">{copy.fleetleverValue.price}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8" id="pricing">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeader title="Τιμές" />
          <div className="mt-9 grid gap-4 lg:grid-cols-3">
            {copy.pricing.map((plan) => (
              <article key={plan.name} className="rounded-lg border border-[#dce5e1] bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase text-[#007C89]">{plan.name}</p>
                <h3 className="mt-3 text-3xl font-semibold text-[#13211f]">{plan.price}</h3>
                <p className="mt-2 text-base font-semibold text-[#65766f]">{plan.detail}</p>
                <ul className="mt-6 space-y-3">
                  {plan.items.map((item) => (
                    <li key={item} className="flex gap-3 text-base text-[#334641]">
                      <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-lg border border-[#cdd8d3] bg-white p-7 shadow-[0_18px_55px_rgba(19,33,31,0.08)] lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#007C89]">Πριν δεσμεύσεις την αυριανή δουλειά</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Έλεγξε το FleetLever.
            </h2>
          </div>
          <a
            href="mailto:hello@fleetlever.com?subject=FleetLever pilot"
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#102b27] px-5 text-sm font-bold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
          >
            Ζήτησε Demo
          </a>
        </div>
      </section>

      <footer className="border-t border-[#dbe2de] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FleetLeverLogo />
            <p className="mt-3 text-sm font-semibold text-[#65766f]">{copy.footerTagline}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#53635f]">
            <a href="#product" className="hover:text-[#007C89]">{copy.footerLinks[0]}</a>
            <a href="#pricing" className="hover:text-[#007C89]">{copy.footerLinks[1]}</a>
            <a href="mailto:hello@fleetlever.com?subject=FleetLever demo" className="hover:text-[#007C89]">{copy.footerLinks[2]}</a>
            <a href="mailto:hello@fleetlever.com" className="hover:text-[#007C89]">{copy.footerLinks[3]}</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
