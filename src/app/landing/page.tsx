import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  CommercialSiteFooter,
  CommercialSiteHeader,
  demoHref,
  requestDemoHref,
} from "@/components/fleetlever/commercial-site-shell";
import { IndustrySwitchboard } from "@/components/fleetlever/industry-switchboard";
import { MultiIndustryHero } from "@/components/fleetlever/multi-industry-hero";
import { ConfigurableWorkspaceStrip } from "@/components/fleetlever/configurable-workspace-strip";
import { ReadinessLanes } from "@/components/fleetlever/readiness-lanes";
import { ReleaseControlProcess } from "@/components/fleetlever/release-control-process";
import { FleetInventoryStrip } from "@/components/fleetlever/fleet-inventory-strip";
import { ServiceKanbanStrip } from "@/components/fleetlever/service-kanban-strip";
import { ScreenshotMagnifier } from "@/components/fleetlever/screenshot-magnifier";
import landingStyles from "./landing-page.module.css";

export const metadata: Metadata = {
  title: "Fleet and equipment readiness before release",
  description:
    "Know which vehicles and equipment can go to their next job, rental or assignment, what blocks them and who owns the next action.",
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

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
  mobileFocus = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  mobileFocus?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-[#cfd8d4] bg-white shadow-[0_24px_70px_rgba(16,61,55,0.14)] ${
        mobileFocus ? "h-[13rem] sm:h-auto" : ""
      }`}
      data-mobile-focus={mobileFocus ? "true" : undefined}
    >
      <ScreenshotMagnifier
        src={src}
        alt={alt}
        width={1920}
        height={1200}
        priority={priority}
        sizes="(min-width: 1024px) 72vw, 100vw"
        imageClassName={
          mobileFocus
            ? "h-full w-[160%] max-w-none -translate-x-[21%] object-cover object-top sm:h-auto sm:w-full sm:max-w-full sm:translate-x-0"
            : "h-auto w-full"
        }
      />
    </div>
  );
}

export default function LandingPage() {
  return (
    <main id="main-content" className={landingStyles.page}>
      <CommercialSiteHeader />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <section className="relative isolate flex min-h-[620px] max-h-[780px] items-end overflow-hidden bg-[#071b18] sm:min-h-[680px] lg:min-h-[720px]">
        <MultiIndustryHero />

        <div className="mx-auto w-full max-w-[86rem] px-5 pb-14 sm:px-7 sm:pb-16 lg:px-10 lg:pb-20">
          <div className="max-w-[49rem] text-white">
            <p className="text-sm font-bold uppercase text-[#9af6f7]">Fleet and equipment readiness</p>
            <h1 className="mt-4 text-6xl font-semibold leading-none sm:text-7xl lg:text-8xl">FleetLever</h1>
            <p className="mt-6 max-w-[44rem] text-3xl font-semibold leading-tight text-balance sm:text-4xl">
              Know what can go out next. And what cannot.
            </p>
            <p className="mt-5 max-w-[42rem] text-base font-medium leading-7 text-white sm:text-lg">
              FleetLever checks every asset before its next job, rental or assignment, then assigns whatever is
              missing before it causes a delay.
            </p>
            <p className="mt-3 max-w-[42rem] text-sm font-semibold leading-6 text-[#cce5e0] sm:text-base">
              Add the fields and columns your operation needs without waiting for custom development.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={demoHref}
                data-analytics="hero_trial"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-5 text-sm font-bold text-[#0b302c] transition hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Start 15-day trial
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/55 bg-[#071b18]/45 px-5 text-sm font-bold text-white transition hover:border-white hover:bg-[#071b18]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                See the release flow
              </a>
            </div>
          </div>
        </div>
      </section>

      <ConfigurableWorkspaceStrip />

      <ReadinessLanes />

      <section
        className={`${landingStyles.regularStrip} ${landingStyles.paperStrip} scroll-mt-24`}
        data-home-strip="regular"
        id="product"
        data-section-tone="white"
      >
        <div className={landingStyles.shell} data-home-shell>
          <header className={landingStyles.splitLead}>
            <div>
              <p className={landingStyles.eyebrow}>See the operational truth</p>
              <h2 className={landingStyles.sectionTitle}>
                One board shows what can go out next.
              </h2>
            </div>
            <p className={landingStyles.sectionIntro}>
              The plan becomes a clear operational answer: ready, needs review or blocked, with the next action and
              owner visible before the shift starts.
            </p>
          </header>
          <div className={landingStyles.productFrame}>
            <ProductScreenshot
              src="/fleetlever/site/tomorrow-readiness-dashboard.png"
              alt="FleetLever tomorrow-readiness board showing ready, review and blocked assets"
              priority
              mobileFocus
            />
          </div>
          <div className={landingStyles.statusRail}>
            {["Ready for the next shift", "Needs review", "Stops the operation"].map((label, index) => (
              <div key={label} className={landingStyles.statusItem}>
                <span
                  className={`${landingStyles.statusDot} ${
                    index === 0 ? "bg-[#16834b]" : index === 1 ? "bg-[#c07808]" : "bg-[#be2f2a]"
                  }`}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FleetInventoryStrip />
      <ServiceKanbanStrip />

      <div className="scroll-mt-24" id="how-it-works">
        <ReleaseControlProcess />
      </div>

      <IndustrySwitchboard />

      <section className="relative isolate overflow-hidden bg-[#071b18] px-5 py-20 text-white sm:px-7 lg:px-10 lg:py-24">
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
            <p className="text-sm font-bold uppercase text-[#9af6f7]">Start with one real operation</p>
            <h2 className="mt-3 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl">
              Use your fleet. Measure what changes before morning.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-[#d8e5e1]">
              Up to 30 critical assets, one real readiness workflow, guided setup and a measured final review. You
              finish with evidence, not a sales promise.
            </p>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#d8e5e1]">
              {["Readiness at cutoff", "Blockers resolved", "Replacements secured", "Failed releases prevented"].map((item) => (
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
              href={requestDemoHref}
              data-analytics="pilot_demo"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#73dce3] px-6 text-sm font-bold text-[#0b302c] transition hover:bg-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Request a demo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/pricing"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#d8e5e1] underline decoration-white/40 underline-offset-4 hover:text-white lg:justify-end"
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
