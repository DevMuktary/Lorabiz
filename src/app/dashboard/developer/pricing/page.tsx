"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Tag,
  Search,
  ExternalLink,
  Sparkles,
  Zap,
  Webhook,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Mail,
  HelpCircle,
  Layers,
} from "lucide-react";

interface ApiServicePricing {
  serviceKey: string;
  name: string;
  endpoint: string;
  method: "POST" | "GET";
  category: "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";
  categoryLabel: string;
  slipType?: string | null;
  validationType?: string | null;
  mode: "Synchronous (Instant)" | "Asynchronous (Webhook + Polling)";
  description: string;
  price: number;
  currency: string;
  isActive: boolean;
  maintenanceMsg?: string | null;
  updatedAt?: string | null;
}

type TabKey = "ALL" | "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";

export default function DeveloperPricingPage() {
  const [services, setServices] = useState<ApiServicePricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadPricing = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`/api/developer/pricing?t=${Date.now()}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.services)) {
        setServices(data.services);
      } else {
        throw new Error(data.message || "Failed to load pricing data");
      }
    } catch (err: any) {
      console.error("❌ Failed to fetch developer pricing:", err);
      setError("Unable to load real-time rate card. Please retry.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPricing();
  }, [loadPricing]);

  // Tab counts
  const counts = useMemo(() => {
    return {
      ALL: services.length,
      NIN_VERIFICATION: services.filter((s) => s.category === "NIN_VERIFICATION").length,
      PHONE_VERIFICATION: services.filter((s) => s.category === "PHONE_VERIFICATION").length,
      NIN_VALIDATION: services.filter((s) => s.category === "NIN_VALIDATION").length,
      NIMC_SPECIAL_SERVICES: services.filter((s) => s.category === "NIMC_SPECIAL_SERVICES").length,
    };
  }, [services]);

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      const matchesTab = activeTab === "ALL" || item.category === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.endpoint.toLowerCase().includes(q) ||
        item.serviceKey.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.slipType && item.slipType.toLowerCase().includes(q)) ||
        (item.validationType && item.validationType.toLowerCase().includes(q))
      );
    });
  }, [services, activeTab, searchQuery]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPricing(true)}
            disabled={isLoading || isRefreshing}
            title="Refresh real-time prices"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Rates</span>
          </button>
          <Link
            href="/docs"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <span>API Docs</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Tag className="h-3.5 w-3.5" />
              <span>Real-Time Wholesale Rate Card</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Developer API Pricing &amp; Rate Cards
            </h1>
            <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Transparent, pay-as-you-go wholesale rates for automated Nigerian identity verification and regulatory compliance. Rates are fetched directly from our live gateway and charged atomically per successful 2xx request.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Free Sandbox Testing</span>
            </div>
            <p className="mt-1 text-xs opacity-90 max-w-xs">
              ₦1,000,000 in virtual sandbox credits is included free for safe testing. Real funds are never deducted.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-muted/50 rounded-2xl border border-border/60">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "ALL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Services ({counts.ALL})
            </button>
            <button
              onClick={() => setActiveTab("NIN_VERIFICATION")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "NIN_VERIFICATION"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              By NIN ({counts.NIN_VERIFICATION})
            </button>
            <button
              onClick={() => setActiveTab("PHONE_VERIFICATION")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "PHONE_VERIFICATION"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              By Phone ({counts.PHONE_VERIFICATION})
            </button>
            <button
              onClick={() => setActiveTab("NIN_VALIDATION")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "NIN_VALIDATION"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Validation Pipeline ({counts.NIN_VALIDATION})
            </button>
            <button
              onClick={() => setActiveTab("NIMC_SPECIAL_SERVICES")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === "NIMC_SPECIAL_SERVICES"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              IPE &amp; Personalization ({counts.NIMC_SPECIAL_SERVICES})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter endpoint, slip, or name..."
              className="w-full rounded-xl border border-border bg-card pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Services Grid / List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-5 animate-pulse flex items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-muted rounded-md w-1/3" />
                <div className="h-3 bg-muted/60 rounded-md w-1/2" />
              </div>
              <div className="h-8 bg-muted rounded-xl w-24" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center space-y-3">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={() => loadPricing()}
            className="rounded-xl bg-red-500/10 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-500/20 transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center space-y-2">
          <HelpCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No services matched your query</h3>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search keywords or switching category tabs.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/80 bg-card shadow-sm divide-y divide-border/60 overflow-hidden">
          {filteredServices.map((service) => {
            const isSync = service.mode.startsWith("Synchronous");
            return (
              <div
                key={service.serviceKey}
                className="p-5 sm:p-6 hover:bg-muted/15 transition-colors flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-2 flex-1 max-w-2xl">
                  {/* Top Metadata Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground tracking-tight">
                      {service.name}
                    </span>

                    {/* Method & Endpoint Path Badge */}
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                      {service.method} {service.endpoint}
                    </span>

                    {/* Slip or Validation Variant Tag */}
                    {(service.slipType || service.validationType) && (
                      <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-primary">
                        {service.slipType || service.validationType}
                      </span>
                    )}

                    {/* Live Availability Badge (Active vs Inactive) */}
                    {service.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        Inactive / Maintenance
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>

                  {/* Delivery Mode & Maintenance Notice */}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1 font-medium">
                      {isSync ? (
                        <Zap className="h-3 w-3 text-primary" />
                      ) : (
                        <Webhook className="h-3 w-3 text-blue-500" />
                      )}
                      <span>Delivery: {service.mode}</span>
                    </span>

                    {!service.isActive && service.maintenanceMsg && (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        Notice: {service.maintenanceMsg}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pricing Display */}
                <div className="shrink-0 text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-border/50">
                  <div className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    ₦{service.price.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    per verified query
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    ₦0.00 on 4xx errors
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Zero Risk Billing Policy Guarantee */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 sm:p-6 text-xs text-muted-foreground space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-foreground">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span>Zero-Risk Billing Policy &amp; SLA Commitment</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] leading-relaxed">
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <span className="font-bold text-foreground">Sandbox Mode:</span> All test requests deduct from your virtual ₦1,000,000.00 test credit. You can reset your sandbox balance at any time with one click. Zero real funds are touched.
          </div>
          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <span className="font-bold text-foreground">Live Mode:</span> Wallet deductions occur atomically per successful 2xx verification. Incomplete requests, not-found lookups, or validation errors (4xx codes) are always billed <strong>₦0.00</strong>.
          </div>
        </div>
      </div>

      {/* Enterprise / Volume Callout (Polished & Dedicated) */}
      <div className="rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/10 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[11px] font-bold text-primary">
            <Layers className="h-3 w-3" />
            <span>High-Volume Platforms &amp; Institutions</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            Need Custom Volume Pricing or Dedicated SLAs?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For fintechs, commercial banks, and enterprise platforms processing over 25,000 monthly verifications, we offer tiered wholesale volume rebates, custom rate limits, and dedicated 99.9% uptime SLA agreements.
          </p>
        </div>

        <a
          href="mailto:devs-lorabiz@quadrox.dev?subject=Enterprise%20API%20Volume%20Pricing%20Inquiry"
          className="shrink-0 rounded-2xl bg-foreground px-6 py-3 text-xs font-bold text-background hover:bg-foreground/90 transition-all inline-flex items-center justify-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
        >
          <Mail className="h-4 w-4" />
          <span>Contact Integrations Team</span>
        </a>
      </div>
    </div>
  );
}
