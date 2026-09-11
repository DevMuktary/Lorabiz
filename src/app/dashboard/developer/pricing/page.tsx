"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Tag,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Layers,
  Webhook,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

interface ApiPricingPlan {
  category: string;
  description: string;
  endpoints: {
    name: string;
    method: "POST" | "GET";
    path: string;
    mode: "Synchronous (Instant)" | "Asynchronous (Webhook)";
    price: string;
    badge?: string;
    description: string;
  }[];
}

const API_PRICING_DATA: ApiPricingPlan[] = [
  {
    category: "Instant Identity Verification (Synchronous)",
    description:
      "Direct low-latency HTTP REST endpoints. Responses are returned immediately in milliseconds.",
    endpoints: [
      {
        name: "NIN Verification",
        method: "POST",
        path: "/api/v1/identity/nin/verify",
        mode: "Synchronous (Instant)",
        price: "₦100",
        badge: "Standard",
        description: "Verify full National Identification Number details with NIMC database photo & biometric records.",
      },
      {
        name: "BVN Verification",
        method: "POST",
        path: "/api/v1/identity/bvn/verify",
        mode: "Synchronous (Instant)",
        price: "₦100",
        badge: "Instant",
        description: "Query Central Bank of Nigeria / NIBSS bank verification number for KYC match.",
      },
      {
        name: "Phone to NIN Resolution",
        method: "POST",
        path: "/api/v1/identity/phone/lookup",
        mode: "Synchronous (Instant)",
        price: "₦120",
        description: "Resolve verified subscriber MSISDN phone numbers to valid Nigerian identity profiles.",
      },
      {
        name: "CAC Company / Business Lookup",
        method: "POST",
        path: "/api/v1/business/cac/search",
        mode: "Synchronous (Instant)",
        price: "₦150",
        description: "Live Corporate Affairs Commission registration status, RC/BN number, and active directors.",
      },
    ],
  },
  {
    category: "Asynchronous Operations & Heavy Filings (Webhooks)",
    description:
      "Queued background processing. Real-time updates delivered via automated webhooks upon completion.",
    endpoints: [
      {
        name: "IPE Clearance Service",
        method: "POST",
        path: "/api/v1/identity/ipe/clearance",
        mode: "Asynchronous (Webhook)",
        price: "Wholesale Tier",
        badge: "Manual Review",
        description: "Automated submission and tracking for IPE clearance queues with instant webhook callback on approval.",
      },
      {
        name: "NIN Modification & Validation",
        method: "POST",
        path: "/api/v1/identity/nin/modify",
        mode: "Asynchronous (Webhook)",
        price: "Wholesale Tier",
        badge: "Manual Review",
        description: "Submit legal name, date of birth, or phone record corrections to NIMC with real-time status webhooks.",
      },
      {
        name: "CAC Corporate Filing Pipeline",
        method: "POST",
        path: "/api/v1/business/cac/filing",
        mode: "Asynchronous (Webhook)",
        price: "Wholesale Tier",
        badge: "Async Workflow",
        description: "Complete Business Name and Private Limited Company (LLC) formation API integration.",
      },
      {
        name: "ID Card Personalization & Print",
        method: "POST",
        path: "/api/v1/identity/cards/personalize",
        mode: "Asynchronous (Webhook)",
        price: "Per Unit",
        badge: "Async Workflow",
        description: "Secure plastic & digital identity card personalization and fulfillment tracking.",
      },
    ],
  },
];

export default function DeveloperPricingPage() {
  const [activeTab, setActiveTab] = useState<"standard" | "enterprise">("standard");

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/developer"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Developer Hub</span>
        </Link>
        <Link
          href="/docs"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <span>API Docs</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </Link>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Tag className="h-3.5 w-3.5" />
              <span>B2B Developer Rates</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Developer API Pricing &amp; Rate Cards
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Transparent, pay-as-you-go wholesale pricing for high-volume automated identity verification and business compliance. Rates are debited automatically from your unified wallet balance on live API requests.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Free Sandbox Testing</span>
            </div>
            <p className="mt-1 text-xs opacity-90">
              ₦1,000,000 in virtual sandbox credits is included free on all developer test accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Value Pillars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Zero Monthly Minimums</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            No recurring subscription or maintenance fees. You only pay for successful live API requests.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Webhook className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Free Webhook Retries</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            HMAC-signed webhook event notifications with automated exponential backoff retries at zero extra cost.
          </p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground">Tiered Volume Rebates</h3>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Processing over 25,000 queries per month? Contact our developer integrations team for customized wholesale rates.
          </p>
        </div>
      </div>

      {/* Pricing Tables */}
      <div className="space-y-6">
        {API_PRICING_DATA.map((section, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden"
          >
            <div className="border-b border-border/60 p-5 sm:p-6 bg-muted/20">
              <h2 className="text-base font-bold text-foreground">{section.category}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
            </div>

            <div className="divide-y divide-border/60">
              {section.endpoints.map((ep, eIdx) => (
                <div
                  key={eIdx}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 hover:bg-muted/10 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-foreground">{ep.name}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                        {ep.method} {ep.path}
                      </span>
                      {ep.badge && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {ep.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ep.description}
                    </p>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                      <span>Delivery: {ep.mode}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <div className="text-lg font-bold text-foreground">{ep.price}</div>
                    <div className="text-[10px] text-muted-foreground">per verified query</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Enterprise Tier Callout */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Need Custom Volume Pricing or SLA?</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            For fintechs, commercial banks, and enterprises with high throughput requirements or bespoke integration needs, we offer custom SLAs and wholesale rate agreements.
          </p>
        </div>
        <a
          href="mailto:support@lorabiz.com?subject=Enterprise%20API%20Volume%20Pricing%20Inquiry"
          className="shrink-0 rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors inline-flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>Contact Sales</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
