"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  History, 
  KeyRound, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  Wallet 
} from "lucide-react";
import { IpeHistoryStats } from "@/components/features/nin/ipe/IpeHistoryStats";
import { IpeHistoryTable } from "@/components/features/nin/ipe/IpeHistoryTable";
import { IpeRequestRecord } from "@/components/features/nin/ipe/IpeDetailsModal";

export default function IpeHistoryPage() {
  const [requests, setRequests] = useState<IpeRequestRecord[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchHistory = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/nin/ipe/history");
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests || []);
        setStats(data.stats || { total: 0, processing: 0, completed: 0, failed: 0 });
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (err) {
      console.error("Failed to load IPE history:", err);
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
      const res = await fetch(`/api/nin/ipe/status?reference=${encodeURIComponent(reference)}`);
      const data = await res.json();

      if (data.success) {
        // Refresh local requests array
        await fetchHistory();
        
        if (data.request?.status === "COMPLETED") {
          setToastMessage(`Clearance Complete! NIN: ${data.request.resolvedNin || "Released"}`);
        } else if (data.request?.status === "FAILED") {
          setToastMessage("Clearance request was unsuccessful. Refund processed.");
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20">
      
      {/* Top Header & Breadcrumbs */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/nin"
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Link href="/dashboard" className="hover:text-slate-600 dark:hover:text-slate-300">Dashboard</Link>
                <span>/</span>
                <Link href="/dashboard/nin" className="hover:text-slate-600 dark:hover:text-slate-300">NIMC Services</Link>
                <span>/</span>
                <Link href="/dashboard/nin/ipe" className="hover:text-slate-600 dark:hover:text-slate-300">IPE Clearance</Link>
                <span>/</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">History & Status</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
                <History className="w-5 h-5 text-emerald-600" />
                IPE Clearance History
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fetchHistory(true)}
              disabled={isRefreshing}
              className="h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              href="/dashboard/nin/ipe"
              className="h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New IPE Request</span>
            </Link>
          </div>

        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-medium shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white dark:hover:text-slate-900 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <IpeHistoryStats stats={stats} />

        {/* History Table */}
        <IpeHistoryTable
          requests={requests}
          isLoading={isLoading}
          onRefresh={() => fetchHistory(true)}
          onSyncStatus={handleSyncStatus}
        />

      </div>
    </div>
  );
}
