"use client";

import React from "react";
import Link from "next/link";
import { BookOpen, Activity, Sparkles, Tag } from "lucide-react";

interface DeveloperConsoleHeaderProps {
  environment: "LIVE" | "TEST";
  onToggleEnvironment: (env: "LIVE" | "TEST") => void;
  liveApprovalStatus?: string | null;
}

export const DeveloperConsoleHeader: React.FC<DeveloperConsoleHeaderProps> = ({
  environment,
  onToggleEnvironment,
  liveApprovalStatus,
}) => {
  const isLive = environment === "LIVE";

  const handleToggleClick = () => {
    onToggleEnvironment(isLive ? "TEST" : "LIVE");
  };

  return (
    <div className="flex flex-col gap-5 border-b border-border/60 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Developer Hub
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Self-serve B2B identity &amp; verification infrastructure, API keys, and real-time logs.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Prominent, Bigger Documentation Button */}
        <Link
          href="/docs"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
        >
          <BookOpen className="h-4 w-4" />
          <span>Documentation</span>
        </Link>

        {/* Dedicated Developer API Pricing */}
        <Link
          href="/dashboard/developer/pricing"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Tag className="h-4 w-4 text-primary" />
          <span>API Pricing</span>
        </Link>

        {/* System Status */}
        <a
          href="https://status.lorabiz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Activity className="h-4 w-4 text-blue-500" />
          <span>System Status</span>
        </a>

        {/* Modern Interactive Switch Toggle */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-border/80 bg-muted/40 px-3.5 py-2">
          <span className={`text-xs font-semibold transition-colors ${!isLive ? "text-amber-600 dark:text-amber-400 font-bold" : "text-muted-foreground"}`}>
            Test
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={isLive}
            onClick={handleToggleClick}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isLive ? "bg-emerald-600" : "bg-amber-500"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isLive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>

          <span className={`text-xs font-semibold transition-colors ${isLive ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-muted-foreground"}`}>
            Live
          </span>
        </div>
      </div>
    </div>
  );
};
