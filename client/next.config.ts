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
  // The admin "Mock Tests" section became "IELTS Modules" (one page per module); keep old links working.
  async redirects() {
    return [
      {
        source: "/admin/mock-results/:id",
        destination: "/admin/ielts/attempts/:id",
        permanent: false,
      },
      {
        source: "/admin/ielts",
        destination: "/admin/ielts/listening",
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
