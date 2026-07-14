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
  title: "Fleet and equipment readiness before release",
  description:
    "Know which vehicles and equipment can go to their next job, rental or assignment, what blocks them and who owns the next action.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

const useCases = [
  [
    "Construction and heavy equipment",
    "Verify machines, operators, attachments and job requirements before release to site.",
  ],
  [
    "Equipment rental",
    "Control return, inspection, damage, cleaning, accessories and checkout before the next customer.",
  ],
  [
    "Municipal and public works",
    "Confirm vehicles, crews, routes and compliance before the next public-service assignment.",
  ],
  [
    "Specialist and service fleets",
    "Check vans, tools, technicians and job-specific requirements before dispatch.",
  ],
] as const;

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "FleetLever",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "A readiness and release-control layer for vehicles, equipment, people, evidence and upcoming operations.",
  offers: {
    "@type": "Offer",
    price: "1000",
    priceCurrency: "EUR",
    description: "30-day founding pilot",
  },
};

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
    <main id="main-content" className="min-h-screen bg-[#f3f6f2] text-[#13211f]">
      <CommercialSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <section className="relative isolate flex min-h-[620px] max-h-[780px] items-end overflow-hidden bg-[#071b18] sm:min-h-[680px] lg:min-h-[720px]">
        <Image
          src="/fleetlever/site/hero-photos/site-crew-crane.jpg"
          alt="Construction crew working beside a crawler crane"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[62%_58%]"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/74" aria-hidden="true" />

        <div className="mx-auto w-full max-w-[86rem] px-5 pb-14 sm:px-7 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="max-w-[49rem] text-white">
            <p className="text-sm font-bold uppercase text-[#9af6f7]">Fleet and equipment readiness</p>
            <h1 className="mt-4 text-6xl font-semibold leading-none sm:text-7xl lg:text-8xl">FleetLever</h1>
            <p className="mt-6 max-w-[44rem] text-3xl font-semibold leading-tight text-balance sm:text-4xl">
              Know what can go out next. And what cannot.
            </p>
            <p className="mt-5 max-w-[42rem] text-base font-medium leading-7 text-white sm:text-lg">
              FleetLever checks vehicles, equipment, documents, maintenance, people and job requirements before
              assets are released to their next job, rental or assignment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={demoHref}
                data-analytics="hero_demo"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See it with your fleet
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/55 bg-[#071b18]/45 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-[#071b18]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>
      </section>

      <ReadinessLanes />

      <section className="scroll-mt-24 bg-white px-5 py-16 sm:px-7 lg:px-10 lg:py-24" id="product">
        <div className="mx-auto w-full max-w-[86rem]">
          <div className="grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-[#007c89]">Tomorrow&apos;s operation</p>
              <h2 className="mt-3 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                One screen. One release decision.
              </h2>
            </div>
            <p className="max-w-2xl text-lg font-medium leading-8 text-[#53635f] lg:justify-self-end">
              See what is ready, what needs review, what is blocked and who owns the next action before the shift
              starts.
            </p>
          </div>
          <div className="mt-10">
            <ProductScreenshot
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt="FleetLever tomorrow-readiness board showing ready, review and blocked assets"
              priority
            />
          </div>
          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-[#d9e1dd] bg-[#d9e1dd] sm:grid-cols-3">
            {["Ready for the next shift", "Needs review", "Stops the operation"].map((label, index) => (
              <div key={label} className="flex items-center gap-3 bg-[#f8faf7] px-5 py-4">
                <span
                  className={`h-2.5 w-2.5 ${
                    index === 0 ? "bg-[#16834b]" : index === 1 ? "bg-[#c07808]" : "bg-[#be2f2a]"
                  }`}
                  aria-hidden="true"
                />
                <span className="text-sm font-bold text-[#263b37]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="scroll-mt-24" id="how-it-works">
        <PreMorningTimeline />
      </div>

      <section className="border-y border-[#d7dfdb] bg-[#f3f6f2] px-5 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="mx-auto w-full max-w-[86rem]">
          <article className="grid gap-10 border-b border-[#cfd8d4] pb-16 lg:grid-cols-[1.14fr_0.86fr] lg:items-center lg:pb-24">
            <ProductScreenshot
              src="/fleetlever/site/stop-list.png"
              alt="FleetLever action queue with blockers, owners and next actions"
            />
            <div>
              <ClipboardCheck className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Action queue</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">Every blocker becomes an owned action.</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-[#53635f]">
                Cause, operational impact, owner, next step, deadline and required evidence stay together. The team
                knows exactly what must close today.
              </p>
            </div>
          </article>

          <MachinePassportAssembly />

          <article className="grid gap-10 pt-16 lg:grid-cols-[1.14fr_0.86fr] lg:items-center lg:pt-24">
            <ProductScreenshot
              src="/fleetlever/site/decision-history-audit-trail.png"
              alt="FleetLever decision history with actions, release decisions and evidence"
            />
            <div>
              <History className="h-7 w-7 text-[#007c89]" aria-hidden="true" />
              <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Decision history</p>
              <h2 className="mt-3 text-4xl font-semibold leading-tight">
                The decision has the evidence behind it.
              </h2>
              <p className="mt-5 text-lg font-medium leading-8 text-[#53635f]">
                Every release, hold, replacement and authorized override remains traceable: who decided, when it
                happened and what proof supported it.
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
              <p className="mt-6 text-sm font-bold uppercase text-[#007c89]">Who it is for</p>
              <h2 className="mt-3 max-w-lg text-4xl font-semibold leading-tight sm:text-5xl">
                For operations that cannot discover the problem in the morning.
              </h2>
            </div>
            <div className="border-t border-[#cfd8d4]">
              {useCases.map(([title, body]) => (
                <article
                  key={title}
                  className="grid gap-3 border-b border-[#cfd8d4] py-6 sm:grid-cols-[0.72fr_1.28fr] sm:gap-8"
                >
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="text-base font-medium leading-7 text-[#53635f]">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-[#071b18] px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-28">
        <Image
          src="/fleetlever/site/hero-photos/heavy-lift-steel.jpg"
          alt="Heavy lifting machine working beside a steel structure"
          fill
          sizes="100vw"
          className="-z-20 object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-[#071b18]/82" aria-hidden="true" />
        <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-[#9af6f7]">30-day founding pilot</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Use your real fleet. Measure what changes.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#d8e5e1]">
              Up to 30 critical assets, one real readiness workflow, guided setup and a measured final review. You
              finish with evidence, not a sales promise.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#d8e5e1]">
              {["Fixed scope", "Real operational data", "Measured results review"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#73dce3]" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:text-right">
            <p className="font-mono text-4xl font-semibold">EUR 1,000</p>
            <p className="mt-1 text-sm font-medium text-[#c7d7d2]">fixed pilot fee, excluding VAT</p>
            <Link
              href={demoHref}
              data-analytics="pilot_demo"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-6 text-sm font-bold text-[#0b302c] transition hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Request a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="mt-4 block text-sm font-semibold text-[#d8e5e1] underline decoration-white/40 underline-offset-4 hover:text-white"
            >
              View pricing and pilot terms
            </Link>
          </div>
        </div>
      </section>

      <CommercialSiteFooter />
    </main>
  );
}
