"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Search,
  Mail,
  AlertTriangle,
  HelpCircle,
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
  price: number;
  currency: string;
  isActive: boolean;
  maintenanceMsg?: string | null;
  updatedAt?: string | null;
}

type CategoryKey = "ALL" | "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";

interface SectionGroup {
  key: "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";
  title: string;
  endpointBadge?: string;
  services: ApiServicePricing[];
}

export default function DeveloperPricingPage() {
  const [services, setServices] = useState<ApiServicePricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL");
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
      setError("Unable to load real-time rates. Please try again.");
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

  // Group services by section to cleanly separate By-NIN vs By-Phone slips
  const sections: SectionGroup[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const matchesQuery = (s: ApiServicePricing) => {
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.endpoint.toLowerCase().includes(q) ||
        s.serviceKey.toLowerCase().includes(q) ||
        (s.slipType && s.slipType.toLowerCase().includes(q)) ||
        (s.validationType && s.validationType.toLowerCase().includes(q))
      );
    };

    const allSections: SectionGroup[] = [
      {
        key: "NIN_VERIFICATION",
        title: "NIN Verification (by NIN)",
        endpointBadge: "POST /api/v1/nin/by-nin",
        services: services.filter((s) => s.category === "NIN_VERIFICATION" && matchesQuery(s)),
      },
      {
        key: "PHONE_VERIFICATION",
        title: "NIN Verification (by Phone)",
        endpointBadge: "POST /api/v1/nin/by-phone",
        services: services.filter((s) => s.category === "PHONE_VERIFICATION" && matchesQuery(s)),
      },
      {
        key: "NIN_VALIDATION",
        title: "NIN Validation",
        endpointBadge: "POST /api/v1/nin/validation",
        services: services.filter((s) => s.category === "NIN_VALIDATION" && matchesQuery(s)),
      },
      {
        key: "NIMC_SPECIAL_SERVICES",
        title: "Special Operations",
        services: services.filter((s) => s.category === "NIMC_SPECIAL_SERVICES" && matchesQuery(s)),
      },
    ];

    if (selectedCategory === "ALL") {
      return allSections.filter((sec) => sec.services.length > 0);
    }

    return allSections.filter((sec) => sec.key === selectedCategory && sec.services.length > 0);
  }, [services, selectedCategory, searchQuery]);

  const totalDisplayed = sections.reduce((acc, sec) => acc + sec.services.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
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
            title="Sync live prices"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sync Rates</span>
          </button>
          <Link
            href="/docs"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <span>API Docs</span>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          API Pricing
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Transparent pay-as-you-go rates.
        </p>
      </div>

      {/* Category Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Horizontal Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-muted/60 rounded-xl border border-border/60 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "ALL"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({counts.ALL})
          </button>
          <button
            onClick={() => setSelectedCategory("NIN_VERIFICATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "NIN_VERIFICATION"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            By NIN ({counts.NIN_VERIFICATION})
          </button>
          <button
            onClick={() => setSelectedCategory("PHONE_VERIFICATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "PHONE_VERIFICATION"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            By Phone ({counts.PHONE_VERIFICATION})
          </button>
          <button
            onClick={() => setSelectedCategory("NIN_VALIDATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "NIN_VALIDATION"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Validation ({counts.NIN_VALIDATION})
          </button>
          <button
            onClick={() => setSelectedCategory("NIMC_SPECIAL_SERVICES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === "NIMC_SPECIAL_SERVICES"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Special Operations ({counts.NIMC_SPECIAL_SERVICES})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service..."
            className="w-full rounded-xl border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Services List / Grouped Sections */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border/70 bg-card p-4 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-48" />
              <div className="space-y-2 pt-2">
                <div className="h-8 bg-muted/60 rounded-xl w-full" />
                <div className="h-8 bg-muted/60 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center space-y-3">
          <AlertTriangle className="h-6 w-6 text-red-500 mx-auto" />
          <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button
            onClick={() => loadPricing()}
            className="rounded-xl bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : totalDisplayed === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-2">
          <HelpCircle className="h-7 w-7 text-muted-foreground mx-auto" />
          <h3 className="text-xs font-semibold text-foreground">No matching services found</h3>
          <p className="text-[11px] text-muted-foreground">
            Clear your search filter to view all rates.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <div
              key={section.key}
              className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden"
            >
              {/* Section Header */}
              <div className="bg-muted/40 px-4 py-2.5 sm:px-5 border-b border-border/60 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {section.title}
                  </span>
                </div>
                {section.endpointBadge && (
                  <span className="font-mono text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-md border border-border/60">
                    {section.endpointBadge}
                  </span>
                )}
              </div>

              {/* High-density compact rows */}
              <div className="divide-y divide-border/60">
                {section.services.map((service) => {
                  const subLabel = service.slipType || service.validationType;

                  return (
                    <div
                      key={service.serviceKey}
                      className="px-4 py-3 sm:px-5 hover:bg-muted/20 transition-colors flex items-center justify-between gap-3"
                    >
                      {/* Left: Name + Identifier Pill */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                          {service.name}
                        </span>

                        {subLabel && (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                            {subLabel}
                          </span>
                        )}

                        {/* If special operation with custom endpoint */}
                        {section.key === "NIMC_SPECIAL_SERVICES" && (
                          <span className="shrink-0 font-mono text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded hidden sm:inline-block">
                            {service.method} {service.endpoint}
                          </span>
                        )}
                      </div>

                      {/* Right: Availability Status + Price */}
                      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        {/* Live Status */}
                        {service.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}

                        {/* Price */}
                        <div className="text-right min-w-[70px]">
                          <div className="text-xs sm:text-sm font-bold text-foreground">
                            ₦{service.price.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[9px] sm:text-[10px] text-muted-foreground -mt-0.5">
                            / query
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enterprise / Volume Callout (Clean & Concise) */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-xs sm:text-sm font-bold text-foreground">
            Need custom volume pricing?
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground">
            Contact our sales team for high-volume tiered rates.
          </p>
        </div>

        <a
          href="mailto:support@lorabiz.com?subject=API%20Volume%20Pricing%20Inquiry"
          className="shrink-0 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:bg-foreground/90 transition-all inline-flex items-center justify-center gap-2"
        >
          <Mail className="h-3.5 w-3.5" />
          <span>Contact Sales</span>
        </a>
      </div>
    </div>
  );
}
