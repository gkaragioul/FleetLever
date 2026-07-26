import type { Metadata } from "next";
import { CommercialAnalytics } from "@/components/fleetlever/commercial-analytics";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";
import "./globals.css";

const edition = getFleetLeverEdition();
const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleetlever-site-production.up.railway.app");

const metadataCopy = {
  site: {
    title: "FleetLever | Prevent expensive fleet downtime",
    description:
      "FleetLever controls whether vehicles and equipment are ready for their next job, rental or assignment before release.",
    ogDescription: "Know what can go out next. And what cannot.",
    twitterDescription: "Find fleet and equipment blockers before dispatch.",
  },
  console: {
    title: "FleetLever | Prevent costly delays on site",
    description:
      "FleetLever is the readiness check construction companies run before sending machines to tomorrow's job.",
    ogDescription: "Catch costly site delays before tomorrow's work begins.",
    twitterDescription: "Know what will stop tomorrow's work before it happens.",
  },
} as const;

const meta = edition === "site" ? metadataCopy.site : metadataCopy.console;
const siteOpenGraph = { locale: "en_GB" } as const;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: meta.title,
    template: "%s | FleetLever",
  },
  description: meta.description,
  applicationName: "FleetLever",
  keywords: [
    "fleet readiness",
    "construction downtime",
    "heavy equipment management",
    "asset passport",
    "release for work",
  ],
  authors: [{ name: "FleetLever" }],
  creator: "FleetLever",
  publisher: "FleetLever",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FleetLever",
    description: meta.ogDescription,
    url: "/",
    siteName: "FleetLever",
    locale: edition === "site" ? siteOpenGraph.locale : "el_GR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetLever",
    description: meta.twitterDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full scroll-smooth antialiased"
    >
      <body className="min-h-full flex flex-col">
        {children}
        {edition === "site" ? <CommercialAnalytics /> : null}
      </body>
    </html>
  );
}
