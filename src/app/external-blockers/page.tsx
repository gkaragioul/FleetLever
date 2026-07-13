import { ExternalBlockersTool } from "@/components/fleetlever/external-blockers-tool";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "External Blockers Tool",
  description: "A standalone FleetLever tool for tracking city and site-adjacent issues that may block tomorrow's work.",
};

export default function ExternalBlockersPage() {
  return <ExternalBlockersTool />;
}
