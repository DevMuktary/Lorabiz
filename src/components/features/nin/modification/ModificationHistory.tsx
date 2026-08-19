"use client";

import React, { useState, useEffect } from "react";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowSquareOut, 
  DownloadSimple, 
  ArrowsClockwise, 
  Info,
  WarningCircle,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  FilePdf
} from "@phosphor-icons/react";

interface ModificationRequestItem {
  id: string;
  trackingId: string;
  type: "CHANGE_OF_NAME" | "CHANGE_OF_PHONE" | "CHANGE_OF_ADDRESS";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  nin: string;
  ninMasked: string;
  currentPhone?: string;
  newFirstName?: string;
  newLastName?: string;
  newMiddleName?: string;
  currentFullName?: string;
  newPhoneNumber?: string;
  newAddress?: string;
  newState?: string;
  newLga?: string;
  adminNotes?: string;
  rejectionReason?: string;
  slipUrl?: string;
  amountPaid: number;
  refundAmount?: number | null;
  isRefunded: boolean;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  CHANGE_OF_NAME: { label: "Change of Name", icon: <User weight="duotone" className="h-4 w-4" /> },
  CHANGE_OF_PHONE: { label: "Change of Phone", icon: <Phone weight="duotone" className="h-4 w-4" /> },
  CHANGE_OF_ADDRESS: { label: "Change of Address", icon: <MapPin weight="duotone" className="h-4 w-4" /> },
};

export function ModificationHistory() {
  const [requests, setRequests] = useState<ModificationRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nin/modification/history");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        setError(data.message || "Failed to load history.");
      }
    } catch (err) {
      console.error("Error fetching modification history:", err);
      setError("Network error loading your history.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: ModificationRequestItem["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock weight="bold" className="h-3.5 w-3.5" />
            Pending Review
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 animate-spin" />
            In Processing
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle weight="bold" className="h-3.5 w-3.5" />
            Completed
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle weight="bold" className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">Your Modification Requests</h2>
          <p className="text-xs text-muted-foreground">Track real-time progress and download completed slips.</p>
        </div>
        <button
          type="button"
          onClick={fetchHistory}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all disabled:opacity-50"
        >
          <ArrowsClockwise weight="bold" className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
          <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-secondary/40 border border-border animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center rounded-3xl bg-card border border-border space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto">
            <ShieldCheck weight="duotone" className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Modification Requests Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            When you submit a Change of Name, Phone Number, or Address request, it will appear here for live tracking.
          </p>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4">
          {requests.map((item) => {
            const typeConfig = TYPE_LABELS[item.type] || { label: item.type, icon: null };

            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-card border border-border shadow-sm space-y-4 hover:border-primary/40 transition-all"
              >
                {/* Top Row: Type, Tracking ID, Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {typeConfig.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{typeConfig.label}</h4>
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-secondary text-foreground font-bold">
                          {item.trackingId}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Submitted on {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(item.status)}</div>
                </div>

                {/* Middle Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-secondary/20 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold">NIN Number</span>
                    <span className="font-mono font-bold text-foreground">{item.ninMasked}</span>
                  </div>

                  {item.type === "CHANGE_OF_NAME" && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Requested New Name</span>
                      <span className="font-bold text-foreground">
                        {[item.newFirstName, item.newMiddleName, item.newLastName].filter(Boolean).join(" ")}
                      </span>
                    </div>
                  )}

                  {item.type === "CHANGE_OF_PHONE" && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">New Phone Linked</span>
                      <span className="font-mono font-bold text-foreground">{item.newPhoneNumber}</span>
                    </div>
                  )}

                  {item.type === "CHANGE_OF_ADDRESS" && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">New Address</span>
                      <span className="font-medium text-foreground">
                        {item.newAddress}, {item.newState}, {item.newLga}
                      </span>
                    </div>
                  )}
                </div>

                {/* Admin Rejection Callout & Refund Note */}
                {item.status === "REJECTED" && item.rejectionReason && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold">
                      <WarningCircle weight="bold" className="h-4 w-4 shrink-0" />
                      <span>Rejection Reason:</span>
                    </div>
                    <p className="text-rose-900/90 dark:text-rose-200/90 pl-5 leading-relaxed">
                      {item.rejectionReason}
                    </p>
                    {item.isRefunded && item.refundAmount && (
                      <div className="pl-5 pt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ✓ Refund of ₦{item.refundAmount.toLocaleString()} has been credited to your LoraBiz wallet.
                      </div>
                    )}
                  </div>
                )}

                {/* Completed Slip Download Action */}
                {item.status === "COMPLETED" && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle weight="bold" className="h-4 w-4" />
                      <span>Modification Concluded. Official slip ready for download.</span>
                    </div>

                    {item.slipUrl ? (
                      <a
                        href={item.slipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all"
                      >
                        <FilePdf weight="bold" className="h-4 w-4" />
                        Download Modification Slip
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Slip attached to completion notification</span>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
