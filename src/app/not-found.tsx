import Link from "next/link";
import { editionConfig, getFleetLeverEdition } from "@/lib/fleetlever/edition";

export default function NotFound() {
  const config = editionConfig(getFleetLeverEdition());

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f7f1] px-6 text-[#123c36]">
      <div className="max-w-md text-center">
        <p className="text-xs font-black uppercase text-[#008f9a]">404</p>
        <h1 className="mt-3 text-3xl font-black">Η σελίδα δεν είναι διαθέσιμη</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#64756f]">
          Η διεύθυνση δεν ανήκει σε αυτή την έκδοση του FleetLever.
        </p>
        <Link
          href={config.rootPath}
          className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#123c36] px-5 text-sm font-black text-white transition hover:bg-[#087c72]"
        >
          Επιστροφή
        </Link>
      </div>
    </main>
  );
}
