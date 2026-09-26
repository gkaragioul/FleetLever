"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FleetLeverLogo } from "./fleetlever-logo";

const configuredAppHref =
  process.env.NEXT_PUBLIC_FLEETLEVER_APP_URL ??
  process.env.NEXT_PUBLIC_FLEETLEVER_CONSOLE_URL ??
  "http://127.0.0.1:3001";

const appOrigin = configuredAppHref
  .replace(/\/(?:login|signup)\/?$/i, "")
  .replace(/\/$/, "");

export const loginHref = `${appOrigin}/login`;
export const trialHref = `${appOrigin}/signup`;
export const demoHref = trialHref;
export const requestDemoHref = "/request-demo";

const navItems = [
  ["Product", "/#product"],
  ["How it works", "/#how-it-works"],
  ["Use cases", "/#for-whom"],
  ["Pricing", "/pricing"],
] as const;

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2";

export function CommercialSiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [isOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[70] -translate-y-24 rounded-sm bg-white px-4 py-2 text-sm font-bold text-[#103d37] shadow-lg transition focus:translate-y-0"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-[#ccd7d2] bg-[#f8faf7]/96 backdrop-blur-md">
        <div className="mx-auto flex h-[4.75rem] w-full max-w-[86rem] items-center justify-between gap-4 px-5 sm:px-7 lg:px-10">
          <Link
            href="/"
            aria-label="FleetLever home"
            className={`rounded-sm ${focusRing}`}
          >
            <FleetLeverLogo />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-8 lg:flex">
            {navItems.map(([label, href]) => {
              const isCurrent = href === "/pricing" && pathname === "/pricing";
              return (
                <Link
                  key={label}
                  href={href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`border-b-2 py-2 text-sm font-semibold transition-colors duration-200 ${
                    isCurrent
                      ? "border-[#007c89] text-[#103d37]"
                      : "border-transparent text-[#53635f] hover:text-[#007c89]"
                  } ${focusRing}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={loginHref}
              className={`hidden min-h-11 items-center justify-center px-3 text-sm font-semibold text-[#334641] transition-colors hover:text-[#007c89] sm:inline-flex ${focusRing}`}
            >
              Sign in
            </a>
            <a
              href={trialHref}
              data-analytics="header_trial"
              className={`hidden min-h-11 items-center justify-center gap-2 rounded-md bg-[#103d37] px-4 text-sm font-bold text-white transition hover:bg-[#007c89] active:translate-y-px sm:inline-flex ${focusRing}`}
            >
              Try the app
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              aria-controls="commercial-mobile-menu"
              onClick={() => setIsOpen((value) => !value)}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-md border border-[#c8d4cf] bg-white text-[#103d37] lg:hidden ${focusRing}`}
            >
              <span className="sr-only">Menu</span>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div
          id="commercial-mobile-menu"
          className={`overflow-hidden border-t border-[#d7dfdb] bg-[#f8faf7] transition-[max-height,opacity] duration-300 lg:hidden ${
            isOpen ? "max-h-[32rem] opacity-100" : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          <nav aria-label="Mobile navigation" className="px-5 py-5 sm:px-7">
            {navItems.map(([label, href]) => (
              <Link
                key={label}
                href={href}
                onClick={() => setIsOpen(false)}
                className="flex min-h-12 items-center justify-between border-b border-[#d7dfdb] text-base font-semibold text-[#183d37]"
              >
                {label}
                <ArrowRight className="h-4 w-4 text-[#007c89]" aria-hidden="true" />
              </Link>
            ))}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={loginHref}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#bfcfc8] text-sm font-bold text-[#103d37]"
              >
                Sign in
              </a>
              <a
                href={trialHref}
                data-analytics="mobile_menu_trial"
                onClick={() => setIsOpen(false)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#103d37] text-sm font-bold text-white"
              >
                Try the app
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

export function CommercialSiteFooter() {
  return (
    <footer className="border-t border-[#29564f] bg-[#0c302b] px-5 py-12 text-white sm:px-7 lg:px-10 lg:py-16">
      <div className="mx-auto grid w-full max-w-[86rem] gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <FleetLeverLogo inverse />
          <p className="mt-5 max-w-lg text-base font-medium leading-7 text-[#bfd0ca]">
            Readiness and release control for vehicles, equipment, people, evidence and upcoming work.
          </p>
          <a
            href="mailto:hello@fleetlever.com"
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-[#73dce3] hover:text-white sm:mt-4 sm:min-h-8"
          >
            hello@fleetlever.com
          </a>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 lg:justify-self-end">
          <div>
            <p className="font-bold text-white">Explore</p>
            <div className="mt-2 grid text-[#bfd0ca] sm:mt-3 sm:gap-1">
              <Link href="/#product" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Product</Link>
              <Link href="/#for-whom" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Use cases</Link>
              <Link href="/pricing" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Pricing</Link>
            </div>
          </div>
          <div>
            <p className="font-bold text-white">Trust</p>
            <div className="mt-2 grid text-[#bfd0ca] sm:mt-3 sm:gap-1">
              <Link href="/security" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Security</Link>
              <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Privacy</Link>
              <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Terms</Link>
            </div>
          </div>
          <div>
            <p className="font-bold text-white">Start</p>
            <div className="mt-2 grid text-[#bfd0ca] sm:mt-3 sm:gap-1">
              <a href={trialHref} data-analytics="footer_trial" className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Start free trial</a>
              <a href={loginHref} className="inline-flex min-h-11 items-center hover:text-white sm:min-h-8">Sign in</a>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 flex w-full max-w-[86rem] flex-col gap-2 border-t border-white/15 pt-5 text-xs font-medium text-[#91aaa2] sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} FleetLever.</p>
        <p>Built for operational decisions before the shift starts.</p>
      </div>
    </footer>
  );
}
