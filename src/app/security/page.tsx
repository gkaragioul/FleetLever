import type { Metadata } from "next";
import { CommercialLegalPage } from "@/components/fleetlever/commercial-legal-page";

export const metadata: Metadata = {
  title: "Security",
  description: "FleetLever security principles for access, tenant data and decision evidence.",
  alternates: { canonical: "/security" },
  openGraph: { url: "/security" },
};

export default function SecurityPage() {
  return (
    <CommercialLegalPage
      eyebrow="Product trust"
      title="Security"
      updated="14 July 2026"
      introduction="FleetLever is designed to keep operational access, asset evidence and release decisions within clear system boundaries."
      sections={[
        {
          title: "Access control",
          body: [
            "The access control model requires an authenticated session and supports role-aware access for people who decide, review and contribute evidence.",
            "Tenant data queries run with an organisation and profile context so application access is scoped to an active organisation membership.",
          ],
        },
        {
          title: "Decision evidence",
          body: [
            "Release decisions are linked to the relevant asset, action and supporting evidence. Decision history is retained so teams can review who changed a state and why.",
          ],
        },
        {
          title: "Infrastructure",
          body: [
            "Hosted environments use encrypted HTTPS connections. Database and object-storage access is configured through server-side credentials rather than exposed browser keys.",
            "FleetLever does not claim a third-party security certification on this page. Any customer-specific security review is handled as part of the commercial process.",
          ],
        },
        {
          title: "Report a concern",
          body: [
            "Send a suspected vulnerability or security question to hello@fleetlever.com with enough detail for us to reproduce and assess it. Please do not include live customer data in the first message.",
          ],
        },
      ]}
    />
  );
}
