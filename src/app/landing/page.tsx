import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";
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

      <section className="px-5 py-20 sm:px-6 lg:px-8" id="product">
        <div className="mx-auto w-full max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-normal text-[#007C89]">Αυριανή δουλειά</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight text-[#13211f] sm:text-5xl">
              Η πρώτη οθόνη πριν το αυριανό πρόγραμμα.
            </h2>
          </div>
          <div className="relative mx-auto mt-12 max-w-6xl">
            <BrowserFrame src="/fleetlever/site/tomorrow-readiness-dashboard.png" alt={copy.productAlt} zoom={4} />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["2", "έτοιμα", "text-[#15803d]"],
                ["1", "θέλει έλεγχο", "text-[#b45309]"],
                ["2", "μπλοκάρουν τη δουλειά", "text-[#b42318]"],
              ].map(([number, label, color]) => (
                <div key={label} className="rounded-lg bg-white p-5 text-center shadow-sm">
                  <p className={`text-4xl font-semibold ${color}`}>{number}</p>
                  <p className="mt-1 text-base font-bold text-[#334641]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#102b27] px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <BrowserFrame src="/fleetlever/site/machine-why-tomorrow-stops-drawer.png" alt={copy.stopsAlt} />
          <div>
            <p className="text-sm font-bold uppercase tracking-normal text-[#72dce5]">{copy.stopsEyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
              Όταν κάτι μπλοκάρει τη δουλειά, το FleetLever δείχνει ακριβώς γιατί.
            </h2>
            <ul className="mt-7 grid gap-3 text-base font-semibold text-[#eef7f4] sm:grid-cols-2">
              {["Τι συμβαίνει", "Ποιος είναι υπεύθυνος", "Τι πρέπει να γίνει", "Πότε πρέπει να γίνει"].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#72dce5]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
          <div>
            <SectionHeader
              eyebrow="Machine Passport"
              title="Όλα για το μηχάνημα σε ένα σημείο."
            />
            <div className="mt-7 flex flex-wrap gap-3">
              {["Πιστοποιητικά", "Service", "Επιθεωρήσεις", "Έγγραφα", "Ιστορικό"].map((item) => (
                <span key={item} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#263b37] shadow-sm">{item}</span>
              ))}
            </div>
          </div>
          <BrowserFrame src="/fleetlever/site/machine-passport-drawer.png" alt={copy.passportAlt} />
        </div>
      </section>

      <section className="border-y border-[#dbe2de] bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:items-center">
          <BrowserFrame src="/fleetlever/site/decision-history-audit-trail.png" alt={copy.auditAlt} />
          <div>
            <SectionHeader
              eyebrow={copy.auditEyebrow}
              title="Ποιος έκανε τι. Και πότε."
            />
            <p className="mt-6 text-3xl font-semibold leading-tight text-[#13211f]">
              Τέλος στα: “Δεν το ήξερα.”
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-6 lg:px-8" id="use-cases">
        <div className="mx-auto w-full max-w-7xl">
          <SectionHeader title={copy.useCasesTitle} />
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["🏗", "Εταιρείες γερανών"],
              ["🚜", "Χωματουργικά έργα"],
              ["📦", "Ενοικιάσεις μηχανημάτων"],
              ["🚧", "Δημόσια έργα"],
            ].map(([icon, title]) => (
              <article key={title} className="rounded-lg border border-[#dce5e1] bg-white p-5 shadow-sm">
                <span className="text-3xl" aria-hidden="true">{icon}</span>
                <h3 className="mt-5 text-xl font-semibold text-[#13211f]">{title}</h3>
              </article>
            ))}
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
