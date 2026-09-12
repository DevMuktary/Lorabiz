"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wallet, Zap, TrendingUp, PlusCircle, CheckCircle2, AlertCircle, RotateCcw } from "lucide-react";

interface DeveloperMetricCardsProps {
  environment: "LIVE" | "TEST";
  walletBalance: number;
  sandboxBalance: number;
  totalSpent: number;
  totalCallsToday: number;
  successfulCallsToday?: number;
  failedCallsToday?: number;
  successRate: number | null; // null when no calls made
  onResetSandboxSuccess?: () => void;
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
  onResetSandboxSuccess,
}) => {
  const isLive = environment === "LIVE";
  const displayBalance = isLive ? walletBalance : sandboxBalance;
  const [isResetting, setIsResetting] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleResetSandbox = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setResetFeedback(null);
    try {
      const res = await fetch("/api/developer/sandbox/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetFeedback({ type: "success", message: "Reset to ₦1,000,000" });
        onResetSandboxSuccess?.();
        setTimeout(() => setResetFeedback(null), 4000);
      } else {
        setResetFeedback({ type: "error", message: data.message || "Failed to reset" });
        setTimeout(() => setResetFeedback(null), 4000);
      }
    } catch {
      setResetFeedback({ type: "error", message: "Network error resetting balance" });
      setTimeout(() => setResetFeedback(null), 4000);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
      {/* Card 1: Wallet Balance */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-border hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isLive ? "Live Wallet Balance" : "Sandbox Test Credits"}
            </span>
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                isLive ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              }`}
            >
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ₦{displayBalance.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            {isLive ? (
              <Link
                href="/dashboard/wallet"
                className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Fund
              </Link>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleResetSandbox}
                  disabled={isResetting}
                  title="Reset Sandbox Balance to ₦1,000,000"
                  className="inline-flex items-center gap-1 rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RotateCcw className={`h-3 w-3 ${isResetting ? "animate-spin" : ""}`} />
                  {isResetting ? "Resetting..." : "Reset"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs">
          <p className="text-muted-foreground">
            {isLive
              ? "Debited per successful API request."
              : "Virtual credits for safe staging integration."}
          </p>
          {!isLive && resetFeedback && (
            <span
              className={`inline-flex items-center gap-1 font-medium text-[11px] shrink-0 ${
                resetFeedback.type === "success"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-500"
              }`}
            >
              {resetFeedback.type === "success" ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {resetFeedback.message}
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Total Spent */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-border hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {isLive ? "Total API Spend" : "Simulated Test Spend"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              ₦{totalSpent.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="rounded-xl bg-blue-500/15 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
              Cumulative
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {isLive
            ? "Cumulative live billing deductions to date."
            : "Virtual deductions logged in sandbox mode."}
        </p>
      </div>

      {/* Card 3: Today's Requests & Truth-in-Metrics */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm hover:border-border hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              API Requests (Today)
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <div className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {totalCallsToday.toLocaleString()}
            </div>

            {successRate === null ? (
              <span className="rounded-xl bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                No activity today
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-bold ${
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

        <p className="mt-4 text-xs text-muted-foreground">
          {totalCallsToday > 0
            ? `${successfulCallsToday} passed, ${failedCallsToday} failed today.`
            : "Queries executed today will register here live."}
        </p>
      </div>
    </div>
  );
};
