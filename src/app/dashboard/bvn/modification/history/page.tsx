"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, History, Lock, Plus } from "lucide-react";
import BvnModificationHistory from "@/components/features/bvn/modification/BvnModificationHistory";

export default function BvnModificationHistoryPage() {
  return (
    <div className="max-w-5xl mx-auto pb-20 pt-4 font-sans relative space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/bvn/modification" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Modification Form
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <Image 
            src="/nibss.png" 
            alt="NIBSS BVN Logo" 
            width={44} 
            height={44} 
            className="object-contain" 
            priority 
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <Lock size={11} />
            Tracking &amp; Status Portal
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">BVN Modification History</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Monitor real-time progress, review statutory updates, and download completed NIBSS slips.
          </p>
        </div>
      </div>

      {/* History Table Component */}
      <BvnModificationHistory />
    </div>
  );
}
