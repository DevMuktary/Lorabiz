"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { 
  X, 
  CheckCircle, 
  Clock, 
  ArrowsClockwise, 
  XCircle, 
  Copy, 
  Check, 
  DownloadSimple, 
  WarningCircle, 
  Info,
  Bank
} from "@phosphor-icons/react";

export interface BvnModificationRecord {
  id: string;
  trackingId: string;
  type: "CHANGE_OF_NAME" | "CHANGE_OF_PHONE" | "CHANGE_OF_DOB" | "COMBINED";
  modificationCategory: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  enrollingBank: string;
  nin: string;
  bvn: string;
  currentFullName?: string | null;
  oldFirstName: string;
  oldLastName: string;
  oldMiddleName?: string | null;
  modifyName: boolean;
  modifyPhone: boolean;
  modifyDob: boolean;
  newFirstName?: string | null;
  newLastName?: string | null;
  newMiddleName?: string | null;
  currentPhone?: string | null;
  newPhone?: string | null;
  currentDob?: string | null;
  newDob?: string | null;
  yearsDifference?: number | null;
  surchargeApplied: boolean;
  surchargeAmount?: number | null;
  adminNotes?: string | null;
  rejectionReason?: string | null;
  slipUrl?: string | null;
  amountPaid: number;
  refundAmount?: number | null;
  isRefunded: boolean;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
}

interface BvnModificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: BvnModificationRecord | null;
}

const MOD_LABELS: Record<string, string> = {
  CHANGE_OF_NAME: "Change of Name Only",
  CHANGE_OF_DOB: "Change of Date of Birth Only",
  CHANGE_OF_PHONE: "Change of Phone Number Only",
  CHANGE_OF_NAME_PHONE: "Change of Name & Phone Number",
  CHANGE_OF_DOB_PHONE: "Change of Date of Birth & Phone Number",
  CHANGE_OF_NAME_DOB: "Change of Name & Date of Birth",
  CHANGE_OF_ALL: "Change of Name, DOB & Phone Number (All 3)",
};

export function BvnModificationDetailsModal({
  isOpen,
  onClose,
  request,
}: BvnModificationDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !request || !mounted || typeof document === "undefined") return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getStatusBadge = (status: BvnModificationRecord["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock weight="bold" className="h-3.5 w-3.5" />
            Pending Review
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 animate-spin" />
            In Processing
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle weight="bold" className="h-3.5 w-3.5" />
            Completed
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle weight="bold" className="h-3.5 w-3.5" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const formattedDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const modLabel = MOD_LABELS[request.modificationCategory] || request.modificationCategory || request.type;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] overflow-y-auto bg-background/95 dark:bg-background/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full mx-auto bg-card border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden text-foreground my-auto flex flex-col max-h-[92vh]">
        
        {/* Header with Close */}
        <div className="p-4 sm:p-6 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center p-2 border border-emerald-500/20 shrink-0 shadow-sm">
              <Bank weight="duotone" className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  BVN Modification Details
                </h2>
                {getStatusBadge(request.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                Tracking ID: {request.trackingId}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Close"
          >
            <X weight="bold" className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm leading-relaxed">
          
          {/* Tracking ID & Reference Box */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Tracking ID
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-foreground text-sm">
                  {request.trackingId}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("trackingId", request.trackingId)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                  title="Copy Tracking ID"
                >
                  {copiedKey === "trackingId" ? (
                    <Check weight="bold" className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy weight="bold" className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Transaction Reference
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground truncate">
                  {request.transactionRef}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("transRef", request.transactionRef)}
                  className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-all shrink-0"
                  title="Copy Reference"
                >
                  {copiedKey === "transRef" ? (
                    <Check weight="bold" className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy weight="bold" className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modification Category & Bank Banner */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Service Requested
              </span>
              <span className="font-bold text-foreground text-sm block">
                {modLabel}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Enrolling Bank
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm block">
                {request.enrollingBank}
              </span>
            </div>
          </div>

          {/* Identifiers (BVN & NIN) */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                BVN on Record
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                {request.bvn}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Linked NIN
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                {request.nin}
              </span>
            </div>
          </div>

          {/* Detailed Request Information */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info weight="bold" className="h-3.5 w-3.5" />
              Submitted Modification Details
            </h3>

            {/* Old / Registered Info */}
            <div className="p-3 rounded-xl bg-card border border-border">
              <span className="text-[11px] text-muted-foreground block">Registered Name on BVN</span>
              <span className="font-bold text-foreground">
                {[request.oldFirstName, request.oldMiddleName, request.oldLastName].filter(Boolean).join(" ")}
              </span>
            </div>

            {/* Name Change Details */}
            {request.modifyName && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New First Name</span>
                  <span className="font-bold text-foreground">{request.newFirstName || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Surname</span>
                  <span className="font-bold text-foreground">{request.newLastName || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Middle Name</span>
                  <span className="font-bold text-foreground">{request.newMiddleName || "N/A"}</span>
                </div>
              </div>
            )}

            {/* DOB Change Details */}
            {request.modifyDob && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">Old Date of Birth</span>
                  <span className="font-bold text-foreground">{request.currentDob || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Date of Birth</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{request.newDob || "N/A"}</span>
                  {request.surchargeApplied && (
                    <span className="text-[10px] text-amber-500 font-bold block mt-0.5">
                      (DOB difference &gt; 5 yrs surcharge included)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Phone Change Details */}
            {request.modifyPhone && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {request.currentPhone && (
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[11px] text-muted-foreground block">Current Phone Number</span>
                    <span className="font-mono font-bold text-foreground">{request.currentPhone}</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Phone to Link</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{request.newPhone || "N/A"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Rejection / Failure Notice */}
          {request.status === "REJECTED" && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-rose-500" />
                <span>Modification Request Declined</span>
              </div>
              <p className="text-xs leading-relaxed pl-6 text-rose-900/90 dark:text-rose-200/90">
                {request.rejectionReason || "The submitted details or verification parameters did not match NIBSS compliance requirements."}
              </p>
              {request.isRefunded && (
                <div className="pl-6 pt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  ✓ Refund of ₦{Number(request.refundAmount || request.amountPaid).toLocaleString()} has been credited to your wallet.
                </div>
              )}
            </div>
          )}

          {/* Admin Notes */}
          {request.adminNotes && (
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                Processing Notes
              </span>
              <p className="text-xs text-foreground font-medium">
                {request.adminNotes}
              </p>
            </div>
          )}

          {/* Payment & Timestamps Summary */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] text-muted-foreground block">Amount Paid</span>
              <span className="font-bold text-foreground text-sm">
                ₦{request.amountPaid.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Submitted Date</span>
              <span className="text-xs font-medium text-foreground">
                {formattedDate(request.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-muted-foreground block">Last Updated</span>
              <span className="text-xs font-medium text-foreground">
                {formattedDate(request.updatedAt)}
              </span>
            </div>
          </div>

          {/* Completed Slip Download Banner */}
          {request.status === "COMPLETED" && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle weight="duotone" className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-foreground text-sm block">
                    Modification Completed Successfully
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Your official BVN modification record has been updated on NIBSS.
                  </span>
                </div>
              </div>

              {request.slipUrl ? (
                <a
                  href={request.slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all shrink-0"
                >
                  <DownloadSimple weight="bold" className="h-4 w-4" />
                  Download BVN Slip
                </a>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Slip document processing...
                </span>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-border bg-card flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
