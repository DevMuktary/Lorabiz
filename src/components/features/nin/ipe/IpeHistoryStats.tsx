// src/components/features/nin/ipe/IpeHistoryStats.tsx
"use client";

import React from "react";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle 
} from "@phosphor-icons/react";

interface IpeStatsProps {
  stats: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
  };
  activeFilter?: "ALL" | "PROCESSING" | "COMPLETED" | "FAILED";
  onFilterChange?: (filter: "ALL" | "PROCESSING" | "COMPLETED" | "FAILED") => void;
}

export function IpeHistoryStats({
  stats,
  activeFilter = "ALL",
  onFilterChange,
}: IpeStatsProps) {
  const statCards = [
    {
      id: "ALL" as const,
      title: "Total Submissions",
      value: stats.total,
      icon: FileText,
      color: "text-foreground",
      iconClass: "text-muted-foreground",
      activeClass: "ring-2 ring-primary border-primary bg-primary/5 shadow-md",
      defaultClass: "bg-card border-border hover:border-primary/40",
    },
    {
      id: "PROCESSING" as const,
      title: "In Processing",
      value: stats.processing,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      iconClass: "text-amber-500",
      activeClass: "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md",
      defaultClass: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50",
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
      title: "Failed / Rejected",
      value: stats.failed,
      icon: XCircle,
      color: "text-destructive",
      iconClass: "text-destructive",
      activeClass: "ring-2 ring-destructive border-destructive bg-destructive/15 shadow-md",
      defaultClass: "bg-destructive/5 border-destructive/20 hover:border-destructive/50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
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
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? card.color : "text-muted-foreground"}`}>
                {card.title}
              </span>
              <IconComponent weight={isActive ? "fill" : "bold"} className={`h-4 w-4 ${card.iconClass}`} />
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className={`text-2xl sm:text-3xl font-black ${card.color}`}>
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
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
