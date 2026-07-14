import type { MetadataRoute } from "next";
import { getFleetLeverEdition } from "@/lib/fleetlever/edition";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fleetlever-site-production.up.railway.app";

export default function robots(): MetadataRoute.Robots {
  if (getFleetLeverEdition() !== "site") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
