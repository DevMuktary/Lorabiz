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
  User, 
  Phone, 
  MapPin, 
  DownloadSimple, 
  ArrowSquareOut, 
  Receipt, 
  WarningCircle, 
  Info,
  ShieldCheck
} from "@phosphor-icons/react";

export interface NinModificationRecord {
  id: string;
  trackingId: string;
  type: "CHANGE_OF_NAME" | "CHANGE_OF_PHONE" | "CHANGE_OF_ADDRESS";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  nin: string;
  ninMasked: string;
  currentPhone?: string | null;
  newFirstName?: string | null;
  newLastName?: string | null;
  newMiddleName?: string | null;
  currentFullName?: string | null;
  newPhoneNumber?: string | null;
  newAddress?: string | null;
  newState?: string | null;
  newLga?: string | null;
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

interface ModificationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: NinModificationRecord | null;
}

const TYPE_CONFIG = {
  CHANGE_OF_NAME: {
    label: "Change of Name",
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  CHANGE_OF_PHONE: {
    label: "Change of Phone Number",
    icon: Phone,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  CHANGE_OF_ADDRESS: {
    label: "Change of Address",
    icon: MapPin,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
};

export function ModificationDetailsModal({
  isOpen,
  onClose,
  request,
}: ModificationDetailsModalProps) {
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

  const getStatusBadge = (status: NinModificationRecord["status"]) => {
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

  const typeConfig = TYPE_CONFIG[request.type] || TYPE_CONFIG.CHANGE_OF_NAME;
  const TypeIcon = typeConfig.icon;

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

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] overflow-y-auto bg-background/95 dark:bg-background/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full mx-auto bg-card border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden text-foreground my-auto flex flex-col max-h-[92vh]">
        
        {/* Header with NIMC Logo & Close */}
        <div className="p-4 sm:p-6 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
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
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                  Modification Details
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

          {/* Modification Category */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${typeConfig.bgColor} ${typeConfig.color}`}>
                <TypeIcon weight="duotone" className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Service Requested
                </span>
                <span className="font-bold text-foreground text-sm">
                  {typeConfig.label}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                NIN on Record
              </span>
              <span className="font-mono font-bold text-foreground text-sm">
                {request.ninMasked}
              </span>
            </div>
          </div>

          {/* Detailed Request Information */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info weight="bold" className="h-3.5 w-3.5" />
              Submitted Modification Details
            </h3>

            {request.type === "CHANGE_OF_NAME" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {request.currentFullName && (
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[11px] text-muted-foreground block">Previous Full Name</span>
                    <span className="font-bold text-foreground">{request.currentFullName}</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New First Name</span>
                  <span className="font-bold text-foreground">{request.newFirstName || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Last Name</span>
                  <span className="font-bold text-foreground">{request.newLastName || "N/A"}</span>
                </div>
                {request.newMiddleName && (
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[11px] text-muted-foreground block">New Middle Name</span>
                    <span className="font-bold text-foreground">{request.newMiddleName}</span>
                  </div>
                )}
              </div>
            )}

            {request.type === "CHANGE_OF_PHONE" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {request.currentPhone && (
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[11px] text-muted-foreground block">Current Phone Number</span>
                    <span className="font-mono font-bold text-foreground">{request.currentPhone}</span>
                  </div>
                )}
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Phone Number</span>
                  <span className="font-mono font-bold text-foreground">{request.newPhoneNumber || "N/A"}</span>
                </div>
              </div>
            )}

            {request.type === "CHANGE_OF_ADDRESS" && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-card border border-border">
                  <span className="text-[11px] text-muted-foreground block">New Street Address</span>
                  <span className="font-bold text-foreground">{request.newAddress || "N/A"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[11px] text-muted-foreground block">State of Residence</span>
                    <span className="font-bold text-foreground">{request.newState || "N/A"}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <span className="text-[11px] text-muted-foreground block">Local Government (LGA)</span>
                    <span className="font-bold text-foreground">{request.newLga || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rejection / Failure Notice */}
          {request.status === "REJECTED" && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <WarningCircle weight="fill" className="h-4 w-4 shrink-0 text-rose-500" />
                <span>Modification Request Not Approved</span>
              </div>
              <p className="text-xs leading-relaxed pl-6 text-rose-900/90 dark:text-rose-200/90">
                {request.rejectionReason || "The submitted documentation or NIN details did not meet NIMC verification standards."}
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
                    Your official NIMC modification record has been updated.
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
                  Download Slip
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
