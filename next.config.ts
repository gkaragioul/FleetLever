import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  assetPrefix: process.env.FLEETLEVER_ASSET_PREFIX?.replace(/\/$/, ""),
  distDir: process.env.FLEETLEVER_DIST_DIR ?? ".next",
  devIndicators: false,
  env: {
    NEXT_PUBLIC_FLEETLEVER_EDITION: process.env.FLEETLEVER_EDITION ?? "console",
  },
  turbopack: {
    root: path.resolve("."),
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "fleetlever.com",
        "www.fleetlever.com",
        "fleetlever.gr",
        "www.fleetlever.gr",
      ],
    },
  },
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "fleetlever\\.gr" }],
        destination: "https://www.fleetlever.gr/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

    if (!appUrl) {
      return [];
    }

    const fleetleverDomain = "((www\\.)?fleetlever\\.com|www\\.fleetlever\\.gr)";

    return {
      beforeFiles: [
        {
          source: "/login",
          has: [{ type: "host", value: fleetleverDomain }],
          destination: `${appUrl}/login`,
        },
        {
          source: "/console/:path*",
          has: [{ type: "host", value: fleetleverDomain }],
          destination: `${appUrl}/console/:path*`,
        },
        {
          source: "/field/:path*",
          has: [{ type: "host", value: fleetleverDomain }],
          destination: `${appUrl}/field/:path*`,
        },
        {
          source: "/api/fleetlever/:path*",
          has: [{ type: "host", value: fleetleverDomain }],
          destination: `${appUrl}/api/fleetlever/:path*`,
        },
        {
          source: "/api/auth/:path*",
          has: [{ type: "host", value: fleetleverDomain }],
          destination: `${appUrl}/api/auth/:path*`,
        },
        {
          source: "/app-assets/_next/:path*",
          has: [{ type: "host", value: fleetleverDomain }],
          destination: `${appUrl}/_next/:path*`,
        },
      ],
      afterFiles: [
        {
          source: "/app-assets/_next/:path*",
          destination: "/_next/:path*",
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "media-src 'self' blob:",
              "worker-src 'self' blob:",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
