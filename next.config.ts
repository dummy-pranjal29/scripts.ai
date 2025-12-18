import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure source maps for better debugging
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Disable production browser source maps to avoid issues
  productionBrowserSourceMaps: false,
  // Empty turbopack config to avoid webpack/turbopack conflict
  turbopack: {},
};

export default nextConfig;
