import type { NextConfig } from "next";

const API_URL = process.env.NEST_API_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: [
    "*.replit.dev",
    "*.sisko.replit.dev",
    "*.replit.app",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
