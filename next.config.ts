import { withSentryConfig } from "@sentry/nextjs";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leave this empty again! instrumentation.ts runs automatically now.
  reactStrictMode: true,
};

// 1. Initialize Serwist PWA Configuration
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
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
