// next.config.ts
import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

// 1. Initialize Serwist PWA Configuration
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: true, // CRITICAL: Force disable the service worker to stop the freezing
});

// 2. Wrap NextConfig with Serwist
const pwaConfig = withSerwist(nextConfig);

// 3. Wrap the resulting PWA Config with Sentry
export default withSentryConfig(pwaConfig, {
  org: "quadrox-technologies-limited",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
