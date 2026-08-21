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
  Tag
} from "@phosphor-icons/react";
import { PersonalizationHistoryStats } from "@/components/features/nin/personalization/PersonalizationHistoryStats";
import { PersonalizationHistoryTable } from "@/components/features/nin/personalization/PersonalizationHistoryTable";
import { PersonalizationRequestRecord } from "@/components/features/nin/personalization/PersonalizationDetailsModal";

export default function PersonalizationHistoryPage() {
  const [requests, setRequests] = useState<PersonalizationRequestRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [activeFilter, setActiveFilter] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchHistory = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/nin/personalization/history");
      const data = await res.json();

      if (data.success) {
        const loadedRequests = data.requests || [];
        setRequests(loadedRequests);
        const calculatedStats = data.stats || data.metrics || {
          total: loadedRequests.length,
          processing: loadedRequests.filter((r: any) => r.status === "PROCESSING").length,
          completed: loadedRequests.filter((r: any) => r.status === "COMPLETED").length,
          failed: loadedRequests.filter((r: any) => r.status === "FAILED").length,
        };
        setStats(calculatedStats);
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (err) {
      console.error("Failed to load Personalization history:", err);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSyncStatus = async (reference: string) => {
    try {
      const res = await fetch(`/api/nin/personalization/status?reference=${encodeURIComponent(reference)}`);
      const data = await res.json();

      if (data.success) {
        await fetchHistory();
        
        if (data.request?.status === "COMPLETED") {
          setToastMessage(`Personalization Complete! NIN: ${data.request.resolvedNin || "Resolved"}`);
        } else if (data.request?.status === "FAILED") {
          setToastMessage("Personalization request was unsuccessful.");
        } else {
          setToastMessage(data.message || "Status checked: Still processing.");
        }

        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error("Status sync error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-12 animate-in fade-in duration-200">
      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin/personalization" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Personalization
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
              National Identity Management Commission
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Personalization Records</h1>
            <p className="text-muted-foreground text-sm">
              Live status tracking, NIN resolution, and PDF slip downloads.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise weight="bold" className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link 
            href="/dashboard/nin/personalization" 
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>New Personalization</span>
          </Link>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <ShieldCheck weight="fill" className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Metrics Row - Interactive Filtering */}
      <PersonalizationHistoryStats
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* History Table */}
      <PersonalizationHistoryTable
        requests={requests}
        onSync={handleSyncStatus}
        isLoading={isLoading}
        activeStatus={activeFilter}
        onStatusChange={setActiveFilter}
      />
    </div>
  );
}
