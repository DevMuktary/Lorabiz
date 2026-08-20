"use client";

import React from "react";
import { 
  FileText, 
  Clock, 
  ArrowsClockwise, 
  CheckCircle, 
  XCircle 
} from "@phosphor-icons/react";

export type BvnRetrievalStatusFilter = "ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

interface BvnRetrievalStatsProps {
  stats: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  activeFilter?: BvnRetrievalStatusFilter;
  onFilterChange?: (filter: BvnRetrievalStatusFilter) => void;
}

export function BvnRetrievalStats({
  stats,
  activeFilter = "ALL",
  onFilterChange,
}: BvnRetrievalStatsProps) {
  const statCards = [
    {
      id: "ALL" as const,
      title: "Total Requests",
      value: stats.total,
      icon: FileText,
      color: "text-foreground",
      iconClass: "text-muted-foreground",
      activeClass: "ring-2 ring-primary border-primary bg-primary/5 shadow-md",
      defaultClass: "bg-card border-border hover:border-primary/40",
    },
    {
      id: "PENDING" as const,
      title: "Pending",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      iconClass: "text-amber-500",
      activeClass: "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md",
      defaultClass: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50",
      badge: stats.pending > 0 ? "Queued" : undefined,
    },
    {
      id: "PROCESSING" as const,
      title: "In Processing",
      value: stats.processing,
      icon: ArrowsClockwise,
      color: "text-sky-600 dark:text-sky-400",
      iconClass: "text-sky-500",
      activeClass: "ring-2 ring-sky-500 border-sky-500 bg-sky-500/15 shadow-md",
      defaultClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50",
      badge: stats.processing > 0 ? "Active" : undefined,
    },
    {
      id: "COMPLETED" as const,
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      iconClass: "text-emerald-500",
      activeClass: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-md",
      defaultClass: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50",
    },
    {
      id: "FAILED" as const,
      title: "Failed",
      value: stats.failed,
      icon: XCircle,
      color: "text-destructive",
      iconClass: "text-destructive",
      activeClass: "ring-2 ring-destructive border-destructive bg-destructive/15 shadow-md",
      defaultClass: "bg-destructive/5 border-destructive/20 hover:border-destructive/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {statCards.map((card) => {
        const IconComponent = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange && onFilterChange(card.id)}
            className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              isActive ? card.activeClass : card.defaultClass
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground line-clamp-1">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-xl bg-background border border-border/80 shrink-0 ${card.iconClass}`}>
                <IconComponent weight="bold" className="h-4 w-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 mt-auto">
              <span className={`text-2xl sm:text-3xl font-black tracking-tight ${card.color}`}>
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-background border border-border text-foreground shadow-xs">
                  {card.badge}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
