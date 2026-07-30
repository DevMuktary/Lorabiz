import { withSentryConfig } from "@sentry/nextjs";
import withPWAInit from "@ducanh2912/next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Leave this empty again! instrumentation.ts runs automatically now.
  reactStrictMode: true,
};

// 1. Initialize PWA Configuration
const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Removed swcMinify as it is now natively handled by Next.js
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

// 2. Wrap NextConfig with PWA
const pwaConfig = withPWA(nextConfig);

// 3. Wrap the resulting PWA Config with Sentry
export default withSentryConfig(pwaConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "quadrox-technologies-limited",
  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      removeDebugLogging: true,
    },
  }
});
