import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["greek", "latin"],
});

const notoMono = Noto_Sans_Mono({
  variable: "--font-noto-mono",
  subsets: ["greek", "latin"],
});

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleetlever.gr");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "FleetLever | Prevent Expensive Construction Downtime",
    template: "%s | FleetLever",
  },
  description:
    "FleetLever is the operational gate construction companies use before releasing machines to tomorrow's work.",
  applicationName: "FleetLever",
  keywords: [
    "construction downtime",
    "construction equipment management",
    "machine passport",
    "release for work",
    "εργοτάξιο",
    "μηχανήματα έργου",
    "τεχνικές εταιρείες",
  ],
  authors: [{ name: "FleetLever" }],
  creator: "FleetLever",
  publisher: "FleetLever",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "FleetLever",
    description: "Prevent expensive construction downtime before tomorrow's work starts.",
    url: "/",
    siteName: "FleetLever",
    locale: "el_GR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FleetLever",
    description: "Know exactly what will stop tomorrow's work before it happens.",
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
      lang="el"
      className={`${notoSans.variable} ${notoMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
