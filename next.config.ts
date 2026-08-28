import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Skip heavy type checking during the build to prevent memory thrashing
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip linting during the build to save memory and time
    ignoreDuringBuilds: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: "quadrox-technologies-limited",
  project: "javascript-nextjs",

  // Suppress verbose logs in build
  silent: true,

  // ⚡ CRITICAL: Set to false to stop the 4GB RAM spike & 15-minute wait
  widenClientFileUpload: false,

  // Don't expose source maps publicly
  hideSourceMaps: true,

  // Route browser requests to Sentry through a Next.js rewrite
  tunnelRoute: "/monitoring",

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
