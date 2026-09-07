"use client";

import React from "react";
import Link from "next/link";
import { Wallet, Zap, TrendingUp, PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";

interface DeveloperMetricCardsProps {
  environment: "LIVE" | "TEST";
  walletBalance: number;
  sandboxBalance: number;
  totalSpent: number;
  totalCallsToday: number;
  successfulCallsToday?: number;
  failedCallsToday?: number;
  successRate: number | null; // null when no calls made
}

export const DeveloperMetricCards: React.FC<DeveloperMetricCardsProps> = ({
  environment,
  walletBalance,
  sandboxBalance,
  totalSpent,
  totalCallsToday,
  successfulCallsToday = 0,
  failedCallsToday = 0,
  successRate,
}) => {
  const isLive = environment === "LIVE";
  const displayBalance = isLive ? walletBalance : sandboxBalance;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
      <div className="grid grid-cols-1 divide-y divide-border/60 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        {/* Card 1: Wallet Balance */}
        <div className="p-5 sm:p-6 flex flex-col justify-between transition-colors hover:bg-muted/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isLive ? "Live Wallet Balance" : "Sandbox Test Credits"}
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  isLive ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                }`}
              >
                <Wallet className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                ₦{displayBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {isLive ? (
                <Link
                  href="/dashboard/wallet"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Fund
                </Link>
              ) : (
                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  Virtual ₦1M
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {isLive
              ? "Debited per successful API request."
              : "Virtual credits for safe staging integration."}
          </p>
        </div>

        {/* Card 2: Total Spent */}
        <div className="p-5 sm:p-6 flex flex-col justify-between transition-colors hover:bg-muted/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isLive ? "Total API Spend" : "Simulated Test Spend"}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                ₦{totalSpent.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Cumulative
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {isLive
              ? "Cumulative live billing deductions to date."
              : "Virtual deductions logged in sandbox mode."}
          </p>
        </div>

        {/* Card 3: Today's Requests & Truth-in-Metrics */}
        <div className="p-5 sm:p-6 flex flex-col justify-between transition-colors hover:bg-muted/10">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                API Requests (Today)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Zap className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {totalCallsToday.toLocaleString()}
              </div>

              {successRate === null ? (
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  No activity today
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                    successRate >= 98
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : successRate >= 90
                      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                      : "bg-red-500/15 text-red-600 dark:text-red-400"
                  }`}
                >
                  {successRate >= 90 ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {successRate}% Success
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {totalCallsToday > 0
              ? `${successfulCallsToday} passed, ${failedCallsToday} failed today.`
              : "Queries executed today will register here live."}
          </p>
        </div>
      </div>
    </div>
  );
};
