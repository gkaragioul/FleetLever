import Link from "next/link";
import { editionConfig, getFleetLeverEdition } from "@/lib/fleetlever/edition";

export default function NotFound() {
  const edition = getFleetLeverEdition();
  const config = editionConfig(edition);
  const copy = edition === "site"
    ? {
        title: "Page not found",
        body: "The address may have changed or the page is not part of the public FleetLever site.",
        action: "Back to FleetLever",
      }
    : {
        title: "Page not found",
        body: "That address is not part of the FleetLever console.",
        action: "Back to the console",
      };

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4f7f1] px-6 text-[#123c36]">
      <div className="max-w-md text-center">
        <p className="text-xs font-black uppercase text-[#008f9a]">404</p>
        <h1 className="mt-3 text-3xl font-black">{copy.title}</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-[#64756f]">
          {copy.body}
        </p>
        <Link
          href={config.rootPath}
          className="mt-6 inline-flex min-h-11 items-center justify-center bg-[#123c36] px-5 text-sm font-black text-white transition hover:bg-[#087c72]"
        >
          {copy.action}
        </Link>
      </div>
    </main>
  );
}
