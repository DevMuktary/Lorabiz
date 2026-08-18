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
}

export function PersonalizationHistoryStats({ stats }: PersonalizationHistoryStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-bold uppercase tracking-wider">Total</span>
          <ListDashes weight="bold" className="h-4 w-4" />
        </div>
        <div className="text-2xl font-black text-foreground">{stats.total}</div>
      </div>

      {/* Processing */}
      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
          <span className="text-xs font-bold uppercase tracking-wider">Processing</span>
          <Clock weight="bold" className="h-4 w-4" />
        </div>
        <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
          {stats.processing}
        </div>
      </div>

      {/* Completed */}
      <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
          <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
          <CheckCircle weight="bold" className="h-4 w-4" />
        </div>
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
          {stats.completed}
        </div>
      </div>

      {/* Failed */}
      <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-2xl shadow-sm space-y-1">
        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
          <span className="text-xs font-bold uppercase tracking-wider">Failed / Refunded</span>
          <XCircle weight="bold" className="h-4 w-4" />
        </div>
        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
          {stats.failed}
        </div>
      </div>
    </div>
  );
}
