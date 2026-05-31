"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#edf1ee] px-4 py-6 text-[#13211f] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-2xl rounded-md border border-[#d9e2dc] bg-[#fbfaf6] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#117064]">FleetLever</p>
        <h1 className="mt-2 text-2xl font-semibold">Δεν φορτώθηκε το workspace</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Κάτι πήγε στραβά όσο φορτώναμε τα δεδομένα του στόλου. Δοκίμασε ξανά και έλεγξε το database health αν συνεχιστεί.
        </p>
        <p className="mt-4 rounded-md border border-[#d9e2dc] bg-[#fdfbf7] px-3 py-2 font-mono text-xs text-slate-500">
          {error.digest ?? error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center rounded-md bg-[#11685f] px-4 text-sm font-semibold text-white transition hover:bg-[#0f5c55]"
        >
          Επανάληψη
        </button>
      </section>
    </main>
  );
}
