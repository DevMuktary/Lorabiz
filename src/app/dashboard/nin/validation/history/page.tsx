// src/app/dashboard/nin/validation/history/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  ListDashes, 
  Plus, 
  ArrowsClockwise, 
  ShieldCheck, 
  CheckCircle,
  Clock,
  XCircle,
  Tag,
  Copy,
  Check,
  MagnifyingGlass,
  Spinner,
  WarningCircle
} from "@phosphor-icons/react";

interface ValidationRecord {
  id: string;
  category: "NO_RECORD_FOUND" | "VNIN_VALIDATION" | "UPDATE_RECORD_MOD" | "PHOTO_ERROR";
  nin: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  amountCharged: number | string;
  transactionRef: string;
  failureReason?: string | null;
  adminNotes?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "SIM/Bank & VNIN Validation",
  UPDATE_RECORD_MOD: "Modification Validation",
  PHOTO_ERROR: "Photographic Error",
};

export default function NinValidationHistoryPage() {
  const [history, setHistory] = useState<ValidationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchHistory = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/nin/validation/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        item.transactionRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nin.includes(searchTerm) ||
        (CATEGORY_LABELS[item.category] || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === "ALL" || item.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [history, searchTerm, activeTab]);

  const stats = useMemo(() => ({
    total: history.length,
    processing: history.filter((h) => h.status === "PROCESSING").length,
    completed: history.filter((h) => h.status === "COMPLETED").length,
    failed: history.filter((h) => h.status === "FAILED").length,
  }), [history]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-12 animate-in fade-in duration-200 font-sans">
      
      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin/validation" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Validation Form
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
            <h1 className="text-2xl font-black text-foreground tracking-tight">NIN Validation History</h1>
            <p className="text-muted-foreground text-sm">
              Track and monitor the status of all your submitted NIN validation requests.
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
            href="/dashboard/nin/validation" 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>New Validation</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards - Interactive Filtering */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            activeTab === "ALL"
              ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
              : "bg-card border-border hover:border-primary/40 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className={`text-xs font-bold uppercase tracking-wider ${activeTab === "ALL" ? "text-foreground" : "text-muted-foreground"}`}>
              Total Submissions
            </p>
            <ListDashes weight={activeTab === "ALL" ? "fill" : "bold"} className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{stats.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PROCESSING")}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            activeTab === "PROCESSING"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md"
              : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              In Processing
            </p>
            <Clock weight={activeTab === "PROCESSING" ? "fill" : "bold"} className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{stats.processing}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            activeTab === "COMPLETED"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-md"
              : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Validated
            </p>
            <CheckCircle weight={activeTab === "COMPLETED" ? "fill" : "bold"} className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.completed}</p>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FAILED")}
          className={`text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
            activeTab === "FAILED"
              ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/15 shadow-md"
              : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50 shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Failed / Rejected
            </p>
            <XCircle weight={activeTab === "FAILED" ? "fill" : "bold"} className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{stats.failed}</p>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-card border border-border rounded-2xl shadow-sm flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-border scrollbar-hide bg-secondary/30">
          <TabButton
            label="All Requests"
            count={history.length}
            isActive={activeTab === "ALL"}
            onClick={() => setActiveTab("ALL")}
          />
          <TabButton
            label="In Processing"
            count={stats.processing}
            isActive={activeTab === "PROCESSING"}
            onClick={() => setActiveTab("PROCESSING")}
          />
          <TabButton
            label="Completed"
            count={stats.completed}
            isActive={activeTab === "COMPLETED"}
            onClick={() => setActiveTab("COMPLETED")}
          />
          <TabButton
            label="Failed"
            count={stats.failed}
            isActive={activeTab === "FAILED"}
            onClick={() => setActiveTab("FAILED")}
          />
        </div>

        {/* Search */}
        <div className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="relative max-w-md">
            <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search by reference, NIN, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* Records Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Spinner weight="bold" className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading history records...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="h-14 w-14 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <ShieldCheck weight="bold" className="h-7 w-7 opacity-50" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">No validation records found</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {searchTerm ? "Try searching for a different keyword or filter tab." : "You have not submitted any NIN validation requests yet."}
              </p>
            </div>
            {!searchTerm && (
              <Link
                href="/dashboard/nin/validation"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus weight="bold" className="h-4 w-4" />
                <span>Submit Validation</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredHistory.map((item) => {
              const categoryLabel = CATEGORY_LABELS[item.category] || item.category;
              const formattedDate = format(new Date(item.createdAt), "MMM dd, yyyy · p");

              return (
                <div key={item.id} className="p-5 sm:p-6 hover:bg-secondary/20 transition-colors space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                        <ShieldCheck weight="bold" className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-foreground">
                            {categoryLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary text-muted-foreground rounded-md border border-border font-mono">
                            NIN: {item.nin}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted on {formattedDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <StatusBadge status={item.status} />
                    </div>

                  </div>

                  {/* Failure reason if FAILED */}
                  {item.status === "FAILED" && item.failureReason && (
                    <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <WarningCircle weight="bold" className="h-3.5 w-3.5 shrink-0" />
                        <span>Validation Rejection Reason:</span>
                      </p>
                      <p className="leading-relaxed pl-5">{item.failureReason}</p>
                    </div>
                  )}

                  {/* Bottom info bar */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px]">Ref: {item.transactionRef}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.transactionRef)}
                        className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title="Copy Reference"
                      >
                        {copiedKey === item.id ? (
                          <Check weight="bold" className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy weight="bold" className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    <span className="font-black text-xs text-foreground">
                      ₦{Number(item.amountCharged).toLocaleString()}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
        isActive
          ? "border-primary text-primary bg-card"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
          isActive
            ? "bg-primary/10 text-primary"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle weight="fill" className="h-3.5 w-3.5" />
        <span>Validated</span>
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle weight="fill" className="h-3.5 w-3.5" />
        <span>Failed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <Clock weight="bold" className="h-3.5 w-3.5 animate-pulse" />
      <span>Processing</span>
    </span>
  );
}
