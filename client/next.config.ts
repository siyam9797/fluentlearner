import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(configDirectory, "../.env") });

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["mysql2"],
  devIndicators: false,
  // Don't advertise the framework in every response.
  poweredByHeader: false,
  images: {
    // The optimizer caches results without checking who asked, so only public
    // images may go through it (never payment screenshots or student uploads).
    // Keep in sync with OPTIMIZABLE in src/lib/image.ts.
    localPatterns: [
      { pathname: "/uploads/images/**", search: "" },
      { pathname: "/uploads/branding/**", search: "" },
      { pathname: "/*", search: "" },
    ],
  },
  // The admin "Mock Tests" section became "IELTS Modules" (one page per module); keep old links working.
  // Basic hardening for every page and file.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Only our own pages may show the site in a frame (stops clickjacking of the admin).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The Speaking test records from the microphone; nothing uses the camera or location.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          // Browsers ignore this over plain http, so it is harmless in development.
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // v2 ran at /home-2 and /v2/* before it became the main site; keep those links working.
      { source: "/home-2", destination: "/", permanent: true },
      { source: "/v2", destination: "/", permanent: true },
      { source: "/v2/:path*", destination: "/:path*", permanent: true },
      // The old (v1) site at /old was removed; send its links to the matching live pages.
      { source: "/old", destination: "/", permanent: true },
      { source: "/old/:path*", destination: "/:path*", permanent: true },
      // Enrollments became Transactions.
      {
        source: "/admin/enrollments",
        destination: "/admin/transactions",
        permanent: true,
      },
      {
        source: "/admin/enrollments/:id",
        destination: "/admin/transactions/:id",
        permanent: true,
      },
      {
        source: "/admin/site-settings",
        destination: "/admin/website",
        permanent: false,
      },
      {
        source: "/admin/mock-results/:id",
        destination: "/admin/ielts/attempts/:id",
        permanent: false,
      },
      {
        source: "/admin/ielts",
        destination: "/admin/ielts/tests",
        permanent: false,
      },
      {
        source: "/admin/mock-results",
        destination: "/admin/ielts/listening",
        permanent: false,
      },
      {
        source: "/admin/mock-tests/:path*",
        destination: "/admin/ielts/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
