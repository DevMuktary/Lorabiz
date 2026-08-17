// src/app/dashboard/nin/validation/history/page.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  Fingerprint, 
  Layers, 
  AlertTriangle,
  Plus,
  Loader2,
  Tag
} from "lucide-react";

interface ValidationRecord {
  id: string;
  category: "NO_RECORD_FOUND" | "VNIN_VALIDATION" | "UPDATE_RECORD_MOD";
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
  VNIN_VALIDATION: "VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod)",
};

export default function NinValidationHistoryPage() {
  const [history, setHistory] = useState<ValidationRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/nin/validation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to NIN Validation Form
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <Fingerprint className="h-7 w-7 text-primary" />
            <span>Validation History</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track and monitor the status of all your submitted NIN validation requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHistory}
            className="inline-flex items-center justify-center p-2.5 bg-card border border-border text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl hover:bg-secondary transition-colors cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
          </button>

          <Link
            href="/dashboard/nin/validation"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Validation</span>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col">
        
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
            count={history.filter((h) => h.status === "PROCESSING").length}
            isActive={activeTab === "PROCESSING"}
            onClick={() => setActiveTab("PROCESSING")}
          />
          <TabButton
            label="Completed"
            count={history.filter((h) => h.status === "COMPLETED").length}
            isActive={activeTab === "COMPLETED"}
            onClick={() => setActiveTab("COMPLETED")}
          />
          <TabButton
            label="Failed"
            count={history.filter((h) => h.status === "FAILED").length}
            isActive={activeTab === "FAILED"}
            onClick={() => setActiveTab("FAILED")}
          />
        </div>

        {/* Search */}
        <div className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Loading history records...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="h-14 w-14 bg-secondary rounded-full flex items-center justify-center mx-auto text-muted-foreground">
              <Fingerprint className="h-7 w-7 opacity-50" />
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
                <Plus className="h-4 w-4" />
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
                      <div className="h-10 w-10 rounded-2xl bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5 text-foreground">
                        <Fingerprint className="h-5 w-5 text-primary" />
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
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
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
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
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
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Validated</span>
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle className="h-3.5 w-3.5" />
        <span>Failed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <Clock className="h-3.5 w-3.5 animate-pulse" />
      <span>Processing</span>
    </span>
  );
}
