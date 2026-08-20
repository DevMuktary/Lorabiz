"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { 
  X, Copy, Check, DownloadSimple, Clock, 
  ArrowsClockwise, CheckCircle, XCircle, 
  IdentificationBadge, ShieldCheck, User, Phone, Wallet
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface BvnRetrievalRecord {
  id: string;
  trackingId: string;
  fullName: string;
  phone: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  retrievedBvn?: string | null;
  slipUrl?: string | null;
  failureReason?: string | null;
  adminNotes?: string | null;
  amountPaid: number;
  refundAmount?: number | null;
  isRefunded?: boolean;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

interface BvnRetrievalDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BvnRetrievalRecord | null;
}

export function BvnRetrievalDetailsModal({
  isOpen,
  onClose,
  record,
}: BvnRetrievalDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedBvn, setCopiedBvn] = useState(false);
  const [copiedTrackingId, setCopiedTrackingId] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  if (!isOpen || !record || !mounted || typeof document === "undefined") return null;

  const handleCopy = (text: string, type: "bvn" | "tracking") => {
    navigator.clipboard.writeText(text);
    if (type === "bvn") {
      setCopiedBvn(true);
      setTimeout(() => setCopiedBvn(false), 2000);
    } else {
      setCopiedTrackingId(true);
      setTimeout(() => setCopiedTrackingId(false), 2000);
    }
  };

  const handleDownloadSlip = async () => {
    if (!record.slipUrl) return;
    setIsDownloading(true);
    try {
      const response = await fetch(record.slipUrl);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `BVN_Slip_${record.retrievedBvn || record.trackingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(record.slipUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const statusConfig = {
    PENDING: {
      label: "Pending Review",
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
      description: "Your request is queued and awaiting operator processing with NIBSS.",
    },
    PROCESSING: {
      label: "In Processing",
      icon: ArrowsClockwise,
      color: "text-sky-600 dark:text-sky-400",
      bgColor: "bg-sky-500/10 border-sky-500/20",
      description: "An operator is actively retrieving your record from NIBSS database.",
    },
    COMPLETED: {
      label: "Completed",
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
      description: "Your BVN has been successfully retrieved.",
    },
    FAILED: {
      label: "Failed",
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10 border-destructive/20",
      description: "Your retrieval request could not be fulfilled.",
    },
  }[record.status];

  const StatusIcon = statusConfig.icon;

  return createPortal(
    <div 
      className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IdentificationBadge size={22} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  Retrieval Ticket Details
                </h3>
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Tracking ID: {record.trackingId}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Status Card */}
        <div className={`p-4 rounded-2xl border ${statusConfig.bgColor} space-y-1.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon weight="bold" className={`h-4 w-4 ${statusConfig.color}`} />
              <span className={`text-xs font-black uppercase tracking-wider ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {format(new Date(record.createdAt), "MMM d, yyyy • p")}
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">
            {statusConfig.description}
          </p>
        </div>

        {/* Retrieved BVN Box (when completed) */}
        {record.status === "COMPLETED" && record.retrievedBvn && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-2xl text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Retrieved 11-Digit BVN
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-widest text-emerald-700 dark:text-emerald-300">
                {record.retrievedBvn}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(record.retrievedBvn!, "bvn")}
                className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
                title="Copy BVN"
              >
                {copiedBvn ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
              </button>
            </div>
          </div>
        )}

        {/* Failure Reason Box (when failed) */}
        {record.status === "FAILED" && record.failureReason && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-destructive">
              Failure Reason
            </span>
            <p className="text-xs text-destructive leading-relaxed">
              {record.failureReason}
            </p>
            {record.isRefunded && (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                &#10004; A refund of ₦{Number(record.refundAmount || record.amountPaid).toLocaleString()} has been credited to your wallet.
              </p>
            )}
          </div>
        )}

        {/* Submitted Data Summary Table */}
        <div className="space-y-3 bg-secondary/30 border border-border p-4 rounded-2xl text-xs">
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-muted-foreground">Applicant Full Name:</span>
            <span className="font-bold text-foreground text-right">{record.fullName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-muted-foreground">Linked Phone Number:</span>
            <span className="font-mono font-bold text-foreground">{record.phone}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-muted-foreground">Amount Paid:</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              ₦{Number(record.amountPaid).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-border/60">
            <span className="text-muted-foreground">Transaction Reference:</span>
            <span className="font-mono text-[11px] text-muted-foreground">{record.transactionRef}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">Submitted At:</span>
            <span className="text-muted-foreground font-medium">
              {format(new Date(record.createdAt), "PPP 'at' p")}
            </span>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col gap-2 pt-2">
          {record.status === "COMPLETED" && record.slipUrl && (
            <Button
              type="button"
              onClick={handleDownloadSlip}
              disabled={isDownloading}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isDownloading ? (
                <ArrowsClockwise size={16} className="animate-spin" weight="bold" />
              ) : (
                <>
                  <DownloadSimple size={16} weight="bold" />
                  <span>Download BVN Slip</span>
                </>
              )}
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full h-10 text-xs font-bold cursor-pointer"
          >
            Close
          </Button>
        </div>

      </div>
    </div>,
    document.body
  );
}
