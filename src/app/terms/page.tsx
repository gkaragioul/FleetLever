import type { Metadata } from "next";
import { CommercialLegalPage } from "@/components/fleetlever/commercial-legal-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms for using the FleetLever commercial website.",
  alternates: { canonical: "/terms" },
  openGraph: { url: "/terms" },
};

export default function TermsPage() {
  return (
    <CommercialLegalPage
      eyebrow="Website terms"
      title="Terms of use"
      updated="14 July 2026"
      introduction="These terms apply to the public FleetLever website. Product pilots and subscriptions are governed by the separate written agreement accepted by each customer."
      sections={[
        {
          title: "Website information",
          body: [
            "The website describes FleetLever, pilot options and indicative commercial scopes. It is not a binding offer, service-level commitment or substitute for a signed order form.",
            "We may update product descriptions, availability and pricing before a written agreement is signed.",
          ],
        },
        {
          title: "Acceptable use",
          body: [
            "Do not interfere with the website, attempt unauthorised access, submit malicious content or use automated traffic that degrades the service.",
          ],
        },
        {
          title: "Intellectual property",
          body: [
            "FleetLever names, product interfaces, copy and visual assets are protected by applicable intellectual property rights. No ownership transfers through use of this website.",
          ],
        },
        {
          title: "Contact",
          body: [
            "Questions about these terms can be sent to hello@fleetlever.com. Contract-specific questions should be handled through the relevant FleetLever order form or agreement.",
          ],
        },
      ]}
    />
  );
}
