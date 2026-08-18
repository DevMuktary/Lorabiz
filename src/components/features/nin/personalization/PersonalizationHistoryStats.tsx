"use client";

import React from "react";
import { 
  ListDashes, 
  Clock, 
  CheckCircle, 
  XCircle 
} from "@phosphor-icons/react";

interface PersonalizationHistoryStatsProps {
  stats: {
    total: number;
    processing: number;
    completed: number;
    failed: number;
  };
  activeFilter?: "ALL" | "PROCESSING" | "COMPLETED" | "FAILED";
  onFilterChange?: (filter: "ALL" | "PROCESSING" | "COMPLETED" | "FAILED") => void;
}

export function PersonalizationHistoryStats({
  stats,
  activeFilter = "ALL",
  onFilterChange,
}: PersonalizationHistoryStatsProps) {
  const cards = [
    {
      id: "ALL" as const,
      label: "Total Submissions",
      value: stats.total,
      icon: ListDashes,
      activeClass: "ring-2 ring-primary border-primary bg-primary/5 shadow-md",
      defaultClass: "bg-card border-border hover:border-primary/40",
      textClass: "text-foreground",
      iconClass: "text-muted-foreground",
    },
    {
      id: "PROCESSING" as const,
      label: "In Processing",
      value: stats.processing,
      icon: Clock,
      activeClass: "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md",
      defaultClass: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50",
      textClass: "text-amber-600 dark:text-amber-400",
      iconClass: "text-amber-500",
    },
    {
      id: "COMPLETED" as const,
      label: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      activeClass: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-md",
      defaultClass: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50",
      textClass: "text-emerald-600 dark:text-emerald-400",
      iconClass: "text-emerald-500",
    },
    {
      id: "FAILED" as const,
      label: "Failed / Rejected",
      value: stats.failed,
      icon: XCircle,
      activeClass: "ring-2 ring-rose-500 border-rose-500 bg-rose-500/15 shadow-md",
      defaultClass: "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50",
      textClass: "text-rose-600 dark:text-rose-400",
      iconClass: "text-rose-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onFilterChange && onFilterChange(card.id)}
            className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
              isActive ? card.activeClass : card.defaultClass
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? card.textClass : "text-muted-foreground"}`}>
                {card.label}
              </span>
              <IconComponent weight={isActive ? "fill" : "bold"} className={`h-4 w-4 ${card.iconClass}`} />
            </div>
            <div className={`text-2xl sm:text-3xl font-black mt-2 ${card.textClass}`}>
              {card.value}
            </div>
          </button>
        );
      })}
    </div>
  );
}
