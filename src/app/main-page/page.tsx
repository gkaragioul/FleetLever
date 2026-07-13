"use client";

import {
  ArrowRight,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, MouseEvent, useState } from "react";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

const appCards = [
  {
    name: "Δημοτικός στόλος",
    href: "/fleet-management",
    category: "Καθαριότητα και τεχνικά έργα",
    description: "Βάρδιες, οχήματα, έγγραφα και συνεργείο.",
    cta: "Άνοιγμα",
    tone: "fleet",
  },
  {
    name: "Δημοτική διαχείριση",
    href: "/civic-dispatch",
    category: "Αιτήματα και εργασίες πεδίου",
    description: "Αναφορές δημοτών, αναθέσεις και εργασίες πεδίου.",
    cta: "Άνοιγμα",
    tone: "civic",
  },
] as const;

export default function MainPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await openDemoAccess();
  }

  async function openDemoAccess() {
    setLoginError("");
    setLoginPending(true);

    try {
      const response = await fetch("/api/auth/demo-login", {
        cache: "no-store",
        method: "POST",
      });

      if (!response.ok) throw new Error("Demo login failed");

      setHasAccess(true);
      setDrawerOpen(true);
    } catch {
      setLoginError("Δεν ήταν δυνατή η είσοδος. Δοκιμάστε ξανά.");
    } finally {
      setLoginPending(false);
    }
  }

  async function openApp(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (hasAccess) return;

    event.preventDefault();
    await openDemoAccess();
    window.location.assign(href);
  }

  async function signOut() {
    await fetch("/api/auth/logout", {
      cache: "no-store",
      method: "POST",
    }).catch(() => null);

    setHasAccess(false);
    setDrawerOpen(false);
    setUsername("");
    setPassword("");
  }

  return (
    <main className="min-h-dvh bg-[#fbfcf8] text-[#163a35]">
      <section className="grid min-h-dvh w-full bg-[#fbfcf8] lg:grid-cols-[minmax(25rem,42%)_1fr]">
          <div className="flex min-h-[24rem] flex-col bg-[#123c36] p-7 text-white sm:p-10 lg:min-h-dvh lg:p-[clamp(3rem,5vw,5.5rem)]">
            <Image
              src="/municipal/elliniko-argyroupoli-logo-white.png"
              alt="Δήμος Ελληνικού Αργυρούπολης"
              width={270}
              height={78}
              className="h-auto w-60 sm:w-72"
              priority
            />

            <div className="my-14 max-w-lg sm:my-16 lg:my-auto">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#8be4df]">Εσωτερική πρόσβαση</p>
              <h1 className="mt-5 max-w-md text-4xl font-black leading-[1.04] text-white sm:text-5xl lg:text-[3.75rem]">Πύλη εργαζομένων</h1>
              <p className="mt-4 text-base font-black text-[#8be4df] sm:text-lg">Δήμος Ελληνικού-Αργυρούπολης</p>
              <p className="mt-7 max-w-md text-[0.95rem] font-bold leading-7 text-white/70 sm:text-base">
                Ένα σημείο πρόσβασης για τις εφαρμογές καθημερινής λειτουργίας του Δήμου.
              </p>
            </div>

            <div className="border-t border-white/15 pt-5 text-xs font-bold text-white/50">
              Εσωτερική υπηρεσία · Τμήμα Πληροφορικής
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-14 sm:px-12 lg:min-h-dvh lg:px-[clamp(4rem,9vw,10rem)]">
            <form onSubmit={submitLogin} className="w-full max-w-[32rem]">
              <div className="mb-10">
                <div className="flex items-center gap-2 text-[#008f9a]">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  <p className="text-xs font-black uppercase tracking-[0.1em]">Ταυτοποίηση υπαλλήλου</p>
                </div>
                <h2 className="mt-4 text-3xl font-black leading-tight text-[#123c36] sm:text-4xl">Είσοδος στην πύλη</h2>
                <p className="mt-3 text-[0.95rem] font-bold leading-6 text-[#61736d]">
                  Συμπληρώστε τα στοιχεία υπηρεσίας σας για να συνεχίσετε.
                </p>
              </div>

              <label className="block">
                <span className="text-[0.8rem] font-black text-[#526760]">Όνομα χρήστη</span>
                <div className="mt-2 flex h-[3.35rem] items-center gap-3 rounded-sm border border-[#b8cdc6] bg-white px-4 transition focus-within:border-[#008f9a] focus-within:ring-2 focus-within:ring-[#008f9a]/15">
                  <UserRound className="size-[1.1rem] text-[#65716a]" aria-hidden="true" />
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] font-bold text-[#163a35] outline-none placeholder:text-[#91a09a]"
                    autoComplete="username"
                    name="username"
                  />
                </div>
              </label>

              <label className="mt-5 block">
                <span className="text-[0.8rem] font-black text-[#526760]">Κωδικός πρόσβασης</span>
                <div className="mt-2 flex h-[3.35rem] items-center gap-3 rounded-sm border border-[#b8cdc6] bg-white px-4 transition focus-within:border-[#008f9a] focus-within:ring-2 focus-within:ring-[#008f9a]/15">
                  <KeyRound className="size-[1.1rem] text-[#65716a]" aria-hidden="true" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-full min-w-0 flex-1 bg-transparent text-[0.95rem] font-bold text-[#163a35] outline-none placeholder:text-[#91a09a]"
                    autoComplete="current-password"
                    name="password"
                    type="password"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loginPending}
                className="mt-6 flex min-h-[3.35rem] w-full items-center justify-center gap-2 rounded-sm bg-[#123c36] px-4 text-[0.95rem] font-black text-white transition duration-200 hover:bg-[#0e4a43] active:translate-y-px disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f9a] focus-visible:ring-offset-2"
              >
                <LockKeyhole className="size-4" aria-hidden="true" />
                {loginPending ? "Γίνεται είσοδος..." : "Είσοδος"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>

              {loginError ? (
                <p className="mt-3 rounded-sm border border-[#f2b8b5] bg-[#fff4f2] px-3 py-2 text-xs font-black text-[#9f2017]">
                  {loginError}
                </p>
              ) : null}

              <p className="mt-5 flex items-start gap-2 border-t border-[#e0e7e2] pt-4 text-xs font-bold leading-5 text-[#64756f]">
                <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-[#008f9a]" aria-hidden="true" />
                Για τη δοκιμή, η είσοδος λειτουργεί και χωρίς στοιχεία.
              </p>
            </form>
          </div>
      </section>

      <div
        className={`fixed inset-0 z-40 bg-[#061412]/45 transition-opacity ${drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        aria-label="Συρτάρι εφαρμογών εργαζομένου"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-[42rem] flex-col border-l border-[#d8e1dc] bg-[#fbfcf8] shadow-[0_40px_120px_rgba(7,17,15,0.24)] transition-transform duration-300 ease-out ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-5 border-b border-[#d8e1dc] px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex min-w-0 items-center gap-4">
            <Image
              src="/municipal/elliniko-argyroupoli-mark.png"
              alt="Σήμα Δήμου Ελληνικού Αργυρούπολης"
              width={72}
              height={72}
              className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
            />
            <div>
              <p className="text-[0.7rem] font-black uppercase tracking-[0.1em] text-[#008f9a]">Εφαρμογές Δήμου</p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-[#123c36] sm:text-[2rem]">Επιλέξτε εφαρμογή</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="grid size-10 shrink-0 place-items-center text-[#536a64] transition hover:text-[#008f9a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f9a]"
            aria-label="Κλείσιμο συρταριού εφαρμογών"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="grid gap-2 border-b border-[#d8e1dc] bg-[#edf2ef]">
            {appCards.map((app) => {
              const isFleet = app.tone === "fleet";

              return (
                <Link
                  key={app.name}
                  href={app.href}
                  onClick={(event) => void openApp(event, app.href)}
                  className="group block bg-[#f8fbf9] px-6 py-7 text-[#163a35] transition-colors duration-200 hover:bg-[#123c36] focus-visible:bg-[#123c36] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#008f9a] sm:px-8 sm:py-8"
                >
                  <div className="flex min-h-[13rem] flex-col justify-between">
                    <div>
                      {isFleet ? (
                        <div className="relative h-11 w-48">
                          <div className="absolute inset-0 transition-opacity duration-200 group-hover:opacity-0 group-focus-visible:opacity-0">
                            <FleetLeverLogo />
                          </div>
                          <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <FleetLeverLogo inverse />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                         <Image
                          src="/municipal/elliniko-argyroupoli-mark.png"
                           alt=""
                           width={68}
                           height={68}
                          className="h-14 w-14 shrink-0 object-contain"
                         />
                          <div>
                            <p className="text-xl font-black leading-none text-[#123c36] transition-colors group-hover:text-white group-focus-visible:text-white">Δημοτική Πύλη</p>
                            <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#008f9a] transition-colors group-hover:text-[#8be4df] group-focus-visible:text-[#8be4df]">Δήμος Ελληνικού-Αργυρούπολης</p>
                          </div>
                        </div>
                      )}

                      <p className={`mt-7 text-[0.68rem] font-black uppercase tracking-[0.1em] transition-colors group-hover:text-[#8be4df] group-focus-visible:text-[#8be4df] ${isFleet ? "text-[#008f9a]" : "text-[#087ba8]"}`}>
                        {app.category}
                      </p>
                      <h3 className="mt-2 text-2xl font-black leading-tight text-[#123c36] transition-colors group-hover:text-white group-focus-visible:text-white sm:text-[1.75rem]">{app.name}</h3>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#65716a] transition-colors group-hover:text-white/75 group-focus-visible:text-white/75 sm:text-base">{app.description}</p>
                    </div>

                    <div className="mt-8 flex items-center justify-end border-t border-[#dce6e0] pt-5 transition-colors group-hover:border-white/15 group-focus-visible:border-white/15">
                      <span className={`inline-flex items-center gap-2 text-sm font-black transition-colors group-hover:text-[#8be4df] group-focus-visible:text-[#8be4df] sm:text-base ${isFleet ? "text-[#006f78]" : "text-[#087ba8]"}`}>
                        {app.cta}
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <footer className="hidden px-6 py-4 sm:block sm:px-8">
          <button
            type="button"
            onClick={signOut}
            className="text-sm font-black text-[#65716a] transition hover:text-[#12211d]"
          >
            Αποσύνδεση
          </button>
        </footer>
      </aside>
    </main>
  );
}
