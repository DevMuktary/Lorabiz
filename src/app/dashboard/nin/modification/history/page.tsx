"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ListDashes, 
  Plus, 
  ArrowsClockwise, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  XCircle,
  Tag
} from "@phosphor-icons/react";
import { ModificationHistoryStats, ModificationStatusFilter } from "@/components/features/nin/modification/ModificationHistoryStats";
import { ModificationHistoryTable } from "@/components/features/nin/modification/ModificationHistoryTable";
import { NinModificationRecord } from "@/components/features/nin/modification/ModificationDetailsModal";

export default function NinModificationHistoryPage() {
  const [requests, setRequests] = useState<NinModificationRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    rejected: 0,
  });
  const [activeFilter, setActiveFilter] = useState<ModificationStatusFilter>("ALL");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchHistory = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/nin/modification/history");
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests || []);
        setStats(data.stats || { total: 0, pending: 0, processing: 0, completed: 0, rejected: 0 });
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (err) {
      console.error("Failed to load NIN Modification history:", err);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-12 animate-in fade-in duration-200 font-sans">
      
      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin/modification" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Modification Form
      </Link>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nimc.png" 
              alt="NIMC Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              NIMC Authorized Agency
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">NIN Modification History</h1>
            <p className="text-muted-foreground text-sm">
              Track real-time status and retrieve modification slips.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs sm:text-sm font-bold rounded-xl border border-border transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise weight="bold" className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link 
            href="/dashboard/nin/modification" 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>New Request</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Statistics Cards - Interactive Filtering */}
      <ModificationHistoryStats
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* History Table */}
      <ModificationHistoryTable
        requests={requests}
        isLoading={isLoading}
        onRefresh={() => fetchHistory(true)}
        activeStatus={activeFilter}
        onStatusChange={setActiveFilter}
      />

    </div>
  );
}
