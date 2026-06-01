import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Gauge,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

const capabilities = [
  {
    icon: Gauge,
    title: "Ετοιμότητα πριν την ανάθεση",
    body: "Βλέπεις ποια πάγια μπορούν να δουλέψουν σήμερα και τι κρατά τα υπόλοιπα πίσω.",
  },
  {
    icon: FileCheck2,
    title: "KTEO, άδειες και έγγραφα",
    body: "Λήξεις, ανανεώσεις και αρχεία μπαίνουν στην ίδια σειρά προτεραιότητας.",
  },
  {
    icon: Wrench,
    title: "Service και βλάβες",
    body: "Οι ανοιχτές εργασίες φαίνονται πριν βγει πρόγραμμα, διαδρομή ή εργοτάξιο.",
  },
];

const proofPoints = [
  "Λήξεις, service και ανοιχτές βλάβες σε μία καθημερινή εικόνα.",
  "Κάθε προτεραιότητα ανοίγει το σωστό πάγιο, έγγραφο ή εργασία.",
  "Πάγια, χειριστές και έγγραφα έχουν κοινή κατάσταση πριν ξεκινήσει η δουλειά.",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#edf1ee] text-[#13211f]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-6 lg:px-8">
        <Link href="/landing" aria-label="FleetLever landing">
          <FleetLeverLogo />
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#13211f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#007C89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007C89] focus-visible:ring-offset-2"
        >
          Άνοιγμα εφαρμογής
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </header>

      <section className="px-5 pb-10 pt-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto grid min-h-[620px] w-full max-w-7xl overflow-hidden rounded-2xl border border-[#173a34]/20 bg-[#102b27] shadow-[0_34px_110px_rgba(19,33,31,0.18)] lg:grid-cols-[0.92fr_1.08fr]">
          <div className="relative z-10 flex flex-col justify-end p-6 text-white sm:p-10 lg:p-12">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-1.5 text-sm font-semibold text-[#d8f4ef]">
              <span className="h-2 w-2 rounded-full bg-[#74dce5]" aria-hidden="true" />
              KTEO, service και βλάβες πριν την ανάθεση
            </div>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[0.98] tracking-normal sm:text-6xl lg:text-7xl">
              FleetLever
            </h1>
            <p className="mt-6 max-w-xl text-2xl font-semibold leading-tight sm:text-3xl">
              Βλέπεις ποια πάγια μπορούν να ανατεθούν σήμερα.
            </p>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#d9e7e3]">
              Κεντρική εικόνα για στόλο, εξοπλισμό, KTEO, έγγραφα, service,
              βλάβες και αναθέσεις.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#00aebe] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#0794a0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27]"
              >
                Δες την εφαρμογή
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="mailto:hello@fleetlever.gr?subject=FleetLever"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/22 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:border-[#74dce5] hover:text-[#74dce5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#74dce5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#102b27]"
              >
                Κλείσε συζήτηση
              </a>
            </div>
          </div>

          <div className="relative min-h-[360px] border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
            <Image
              src="/fleetlever-console-dashboard.png"
              alt="FleetLever εφαρμογή με ετοιμότητα στόλου, προθεσμίες και αναθέσεις."
              fill
              priority
              sizes="(min-width: 1024px) 680px, 100vw"
              className="object-cover object-left-top opacity-95"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,43,39,0.2),rgba(16,43,39,0.02))]" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {capabilities.map((item) => (
          <article key={item.title} className="rounded-lg border border-[#d4ddd7] bg-white p-6 shadow-sm">
            <item.icon className="h-6 w-6 text-[#007C89]" aria-hidden="true" />
            <h2 className="mt-5 text-xl font-semibold text-[#13211f]">{item.title}</h2>
            <p className="mt-3 text-base leading-7 text-[#53665f]">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-[#007C89]">Για ομάδες λειτουργίας</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Η ομάδα ξέρει τι είναι διαθέσιμο και τι κρατά τον στόλο πίσω.
          </h2>
        </div>
        <div className="grid gap-3">
          {proofPoints.map((point) => (
            <div key={point} className="flex items-start gap-3 rounded-lg border border-[#d4ddd7] bg-white p-4 shadow-sm">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#007C89]" aria-hidden="true" />
              <p className="text-base font-medium leading-7 text-[#263b37]">{point}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#13211f] px-5 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-4 sm:grid-cols-3">
          {[
            { icon: Truck, label: "Μεταφορικές και λεωφορεία" },
            { icon: Wrench, label: "Τεχνικές εταιρείες και εργοτάξια" },
            { icon: ShieldCheck, label: "Ομάδες με έγγραφα και ελέγχους" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-white/12 bg-white/[0.06] p-5">
              <item.icon className="h-5 w-5 text-[#79d9e3]" aria-hidden="true" />
              <p className="mt-4 text-base font-semibold leading-7">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
