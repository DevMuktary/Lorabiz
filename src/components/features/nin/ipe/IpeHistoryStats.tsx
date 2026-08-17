"use client";

import React from "react";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";

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
      color: "text-slate-600 dark:text-slate-300",
      bgColor: "bg-slate-100 dark:bg-slate-800",
      borderColor: "border-slate-200 dark:border-slate-800",
    },
    {
      title: "In Processing",
      value: stats.processing,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-200/60 dark:border-amber-900/40",
      badge: stats.processing > 0 ? "Active" : undefined,
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: CheckCircle2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-200/60 dark:border-emerald-900/40",
    },
    {
      title: "Unsuccessful",
      value: stats.failed,
      icon: XCircle,
      color: "text-rose-600 dark:text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-200/60 dark:border-rose-900/40",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {statCards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 sm:p-5 rounded-2xl border ${card.borderColor} bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-lg ${card.bgColor} ${card.color} flex items-center justify-center`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {card.value}
              </span>
              {card.badge && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
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
