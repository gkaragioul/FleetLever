import type { MetadataRoute } from "next";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3002";

export default function sitemap(): MetadataRoute.Sitemap {
  if (getFleetLeverEdition() !== "site") return [];

  const lastModified = new Date("2026-07-14");

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/request-demo`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...["/privacy", "/terms", "/security"].map((pathname) => ({
      url: `${siteUrl}${pathname}`,
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
