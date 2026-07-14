import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FleetLeverLogo } from "./fleetlever-logo";

export const demoHref = "mailto:hello@fleetlever.com?subject=FleetLever demo";

const consoleHref =
  process.env.NEXT_PUBLIC_FLEETLEVER_CONSOLE_URL ??
  (process.env.NODE_ENV === "development"
    ? "http://127.0.0.1:3001/login"
    : "https://fleetlever-app-production.up.railway.app/login");

const navItems = [
  ["Πώς λειτουργεί", "/landing#how-it-works"],
  ["Προϊόν", "/landing#product"],
  ["Για ποιους", "/landing#for-whom"],
  ["Τιμές", "/pricing"],
] as const;

export function CommercialSiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#d7dfdb] bg-[#f8faf7]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] w-full max-w-[86rem] items-center justify-between gap-4 px-5 sm:px-7 lg:px-10">
        <Link
          href="/"
          aria-label="Αρχική FleetLever"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-4"
        >
          <FleetLeverLogo />
        </Link>

        <nav aria-label="Κύρια πλοήγηση" className="hidden items-center gap-7 lg:flex">
          {navItems.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm font-semibold text-[#53635f] transition-colors duration-200 hover:text-[#007c89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={consoleHref}
            className="hidden min-h-11 items-center justify-center px-3 text-sm font-semibold text-[#334641] transition-colors duration-200 hover:text-[#007c89] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] sm:inline-flex"
          >
            Σύνδεση
          </a>
          <a
            href={demoHref}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#103d37] px-4 text-sm font-bold text-white transition duration-200 hover:bg-[#007c89] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00aebe] focus-visible:ring-offset-2"
          >
            Ζήτησε demo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </header>
  );
}

export function CommercialSiteFooter() {
  return (
    <footer className="border-t border-[#d7dfdb] bg-[#f8faf7] px-5 py-10 sm:px-7 lg:px-10">
      <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <FleetLeverLogo />
          <p className="mt-3 max-w-md text-sm font-medium leading-6 text-[#65766f]">
            Ο καθημερινός έλεγχος πριν δεσμευτούν μηχανήματα, συνεργεία και αυριανή δουλειά.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-[#53635f]">
          <Link href="/landing#product" className="transition-colors hover:text-[#007c89]">Προϊόν</Link>
          <Link href="/pricing" className="transition-colors hover:text-[#007c89]">Τιμές</Link>
          <a href={demoHref} className="transition-colors hover:text-[#007c89]">Demo</a>
          <a href="mailto:hello@fleetlever.com" className="transition-colors hover:text-[#007c89]">Επικοινωνία</a>
        </div>
      </div>
    </footer>
  );
}
