import { CivicDispatchTool } from "@/components/fleetlever/civic-dispatch-tool";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

export const metadata: Metadata = {
  title: "Civic Dispatch Tool",
  description: "Standalone civic request intake and municipal dispatch workflow prototype.",
};

export default function CivicDispatchPage() {
  if (getFleetLeverEdition() !== "elliniko") notFound();
  return <CivicDispatchTool />;
}
