import { CivicDispatchTool } from "@/components/fleetlever/civic-dispatch-tool";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Civic Dispatch Tool",
  description: "Standalone civic request intake and municipal dispatch workflow prototype.",
};

export default function CivicDispatchPage() {
  return <CivicDispatchTool />;
}
