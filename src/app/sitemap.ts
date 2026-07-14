import type { MetadataRoute } from "next";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleetlever.gr";

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
  ];
}
