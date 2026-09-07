"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RequestStreamTable } from "@/components/features/developer/RequestStreamTable";

export default function DeveloperHistoryPage() {
  const [environment, setEnvironment] = useState<"LIVE" | "TEST">("TEST");

  // Load active environment preference
  useEffect(() => {
    fetch("/api/developer/overview")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.activeMode) {
          setEnvironment(data.data.activeMode);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/developer"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors shadow-xs"
            title="Return to Developer Hub"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                API Service History
              </h1>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  environment === "LIVE"
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}
              >
                {environment} MODE
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Unified request audit logs, response latency metrics, and payload inspector for all API integrations.
            </p>
          </div>
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto rounded-xl border border-border bg-card p-1 text-xs">
          <button
            type="button"
            onClick={() => setEnvironment("TEST")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              environment === "TEST"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sandbox (Test)
          </button>
          <button
            type="button"
            onClick={() => setEnvironment("LIVE")}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors ${
              environment === "LIVE"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Live Production
          </button>
        </div>
      </div>

      {/* Quick Service Portals */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link
          href="/dashboard/nin/slips"
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-border hover:shadow-sm transition-all"
        >
          <p className="text-[11px] font-semibold text-muted-foreground">NIN Slips</p>
          <p className="mt-1 text-xs font-bold text-foreground flex items-center justify-between">
            <span>Printed Slips Log</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </p>
        </Link>
        <Link
          href="/dashboard/nin/ipe/history"
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-border hover:shadow-sm transition-all"
        >
          <p className="text-[11px] font-semibold text-muted-foreground">NIN IPE Clearance</p>
          <p className="mt-1 text-xs font-bold text-foreground flex items-center justify-between">
            <span>Clearance History</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </p>
        </Link>
        <Link
          href="/dashboard/bvn"
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-border hover:shadow-sm transition-all"
        >
          <p className="text-[11px] font-semibold text-muted-foreground">BVN Services</p>
          <p className="mt-1 text-xs font-bold text-foreground flex items-center justify-between">
            <span>Verification Orders</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </p>
        </Link>
        <Link
          href="/dashboard/transactions"
          className="rounded-2xl border border-border/80 bg-card p-4 shadow-xs hover:border-border hover:shadow-sm transition-all"
        >
          <p className="text-[11px] font-semibold text-muted-foreground">Wallet Audit</p>
          <p className="mt-1 text-xs font-bold text-foreground flex items-center justify-between">
            <span>API Debit Records</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </p>
        </Link>
      </div>

      {/* Main HTTP Request Stream Table */}
      <RequestStreamTable environment={environment} />
    </div>
  );
}
