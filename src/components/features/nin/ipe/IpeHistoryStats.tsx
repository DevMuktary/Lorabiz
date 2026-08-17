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
}

export function IpeHistoryStats({ stats }: IpeStatsProps) {
  const statCards = [
    {
      title: "Total Submissions",
      value: stats.total,
      icon: FileText,
      color: "text-muted-foreground",
      bgColor: "bg-secondary",
      borderColor: "border-border",
    },
    {
      title: "In Processing",
      value: stats.processing,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      badge: stats.processing > 0 ? "Active" : undefined,
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Failed",
      value: stats.failed,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      borderColor: "border-destructive/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {statCards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl border ${card.borderColor} bg-card shadow-sm transition-all hover:shadow-md flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">
                {card.title}
              </span>
              <div className={`h-8 w-8 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <IconComponent weight="fill" className="h-4 w-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-black text-foreground">
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  {card.badge}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
