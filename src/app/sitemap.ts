import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleetlever.gr";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-06-01");

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/console`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];
}
