import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg"],
  outputFileTracingRoot: process.cwd(),
  allowedDevOrigins: [
    "*.replit.dev",
    "*.sisko.replit.dev",
    "*.replit.app",
  ],
};

export default nextConfig;
