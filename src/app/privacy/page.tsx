import type { Metadata } from "next";
import { CommercialLegalPage } from "@/components/fleetlever/commercial-legal-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How FleetLever handles commercial website and demo request data.",
  alternates: { canonical: "/privacy" },
  openGraph: { url: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <CommercialLegalPage
      eyebrow="Website trust"
      title="Privacy"
      updated="14 July 2026"
      introduction="This notice explains the limited information collected by the FleetLever commercial website and how it is used."
      sections={[
        {
          title: "Information you provide",
          body: [
            "When you send a demo request, we collect your name, company, work email, optional phone number, role, fleet size and the operational problem you describe.",
            "We use this information only to respond to the request, prepare a relevant discussion and keep a record of the commercial conversation.",
          ],
        },
        {
          title: "Website measurement",
          body: [
            "The website uses first-party, cookie-free event measurement for page views and key actions. It does not create an advertising profile and the event endpoint does not intentionally store your IP address.",
            "Basic referrer and page information may be recorded so we can understand which pages help visitors make a decision.",
          ],
        },
        {
          title: "Retention and sharing",
          body: [
            "We retain commercial enquiries only for as long as they remain relevant to the request or a resulting customer relationship. We do not sell website or demo request data.",
            "Hosting and infrastructure providers may process limited data on our behalf as required to operate the website and request workflow.",
          ],
        },
        {
          title: "Your request",
          body: [
            "To ask what information we hold, request a correction or request deletion, contact hello@fleetlever.com from the email address connected to your enquiry.",
          ],
        },
      ]}
    />
  );
}
