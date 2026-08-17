// src/components/features/nin/ipe/IpeDetailsModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { 
  X, 
  Check, 
  CheckCircle, 
  Clock, 
  Copy, 
  Eye, 
  EyeSlash, 
  ArrowsClockwise, 
  XCircle, 
  Key, 
  User, 
  WarningCircle, 
  ShieldCheck 
} from "@phosphor-icons/react";

export interface IpeRequestRecord {
  id: string;
  trackingId: string;
  reference: string;
  externalReqId?: string | null;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  resolvedNin?: string | null;
  fullName?: string | null;
  dob?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  apiMessage?: string | null;
  failureReason?: string | null;
  amountCharged: number | string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  apiResponse?: any;
}

interface IpeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: IpeRequestRecord | null;
  onSyncStatus?: (reference: string) => Promise<void>;
}

export function IpeDetailsModal({
  isOpen,
  onClose,
  request,
  onSyncStatus,
}: IpeDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !request || !mounted || typeof document === "undefined") return null;

  const handleCopyNin = (nin: string) => {
    navigator.clipboard.writeText(nin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    if (!onSyncStatus || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncStatus(request.reference);
    } finally {
      setIsSyncing(false);
    }
  };

  const formattedDate = (dateStr?: string | null) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const displayedNin = request.resolvedNin
    ? isMasked
    ? `${request.resolvedNin.slice(0, 3)}*****${request.resolvedNin.slice(-3)}`
      : request.resolvedNin
    : "Pending Release";

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Key weight="bold" className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-foreground">
                  Clearance Record Details
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    request.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : request.status === "FAILED"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {request.status}
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Ref: {request.reference}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {request.status === "PROCESSING" && onSyncStatus && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Check Live Status with Gateway"
                className="h-8 px-3 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <ArrowsClockwise weight="bold" className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                <span>{isSyncing ? "Checking..." : "Sync"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X weight="bold" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Status Alert Banner */}
          {request.status === "PROCESSING" && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-700 dark:text-amber-300">
              <Clock weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">Clearance In Processing</span>
                <p className="leading-relaxed">
                  This request is actively being processed by the NIMC clearance gateway. Processing typically completes within ~24 hours. You will receive an automated email notification as soon as the result is ready.
                </p>
              </div>
            </div>
          )}

          {request.status === "COMPLETED" && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">In-Processing Error Resolved Successfully</span>
                <p className="leading-relaxed">
                  The In-Processing Error for Tracking ID <strong>{request.trackingId}</strong> has been cleared, and your National Identification Number (NIN) has been released.
                </p>
              </div>
            </div>
          )}

          {request.status === "FAILED" && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
              <XCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">Request Failed</span>
                <p className="leading-relaxed">
                  {request.failureReason || request.apiMessage || "The clearance could not be completed for this Tracking ID. A full wallet refund has been processed."}
                </p>
              </div>
            </div>
          )}

          {/* Resolved NIN Box (When Available) */}
          {request.resolvedNin && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle weight="fill" className="h-4 w-4" />
                  Resolved National Identification Number (NIN)
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="hover:text-white flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
                >
                  {isMasked ? <Eye weight="bold" className="h-3.5 w-3.5" /> : <EyeSlash weight="bold" className="h-3.5 w-3.5" />}
                  <span>{isMasked ? "Show" : "Mask"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white">
                  {displayedNin}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyNin(request.resolvedNin!)}
                  className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check weight="bold" className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy weight="bold" className="h-4 w-4" />
                      <span>Copy NIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Demographics & Photo Preview (If returned by API) */}
          {(request.fullName || request.dob || request.gender || request.photoUrl) && (
            <div className="bg-secondary/40 rounded-2xl p-5 border border-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User weight="bold" className="h-3.5 w-3.5 text-primary" />
                Applicant Demographics
              </h4>

              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {request.photoUrl && (
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-secondary border border-border shrink-0 shadow-sm relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={request.photoUrl.startsWith("data:") ? request.photoUrl : `data:image/jpeg;base64,${request.photoUrl}`}
                      alt="NIMC Applicant Photo"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 text-xs">
                  {request.fullName && (
                    <div>
                      <span className="text-muted-foreground block">Full Name:</span>
                      <span className="font-bold text-foreground text-sm">
                        {request.fullName}
                      </span>
                    </div>
                  )}

                  {request.dob && (
                    <div>
                      <span className="text-muted-foreground block">Date of Birth:</span>
                      <span className="font-bold text-foreground">
                        {request.dob}
                      </span>
                    </div>
                  )}

                  {request.gender && (
                    <div>
                      <span className="text-muted-foreground block">Gender:</span>
                      <span className="font-bold text-foreground uppercase">
                        {request.gender}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit Details Breakdown */}
          <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border text-xs">
            <div className="p-3.5 flex justify-between items-center bg-secondary/30">
              <span className="text-muted-foreground">Tracking ID:</span>
              <span className="font-mono font-bold text-foreground">
                {request.trackingId}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-muted-foreground">Transaction Reference:</span>
              <span className="font-mono text-foreground font-bold">
                {request.reference}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center bg-secondary/30">
              <span className="text-muted-foreground">Amount Charged:</span>
              <span className="font-bold text-foreground">
                ₦{Number(request.amountCharged).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-muted-foreground">Submitted Date:</span>
              <span className="text-foreground">
                {formattedDate(request.createdAt)}
              </span>
            </div>

            {request.completedAt && (
              <div className="p-3.5 flex justify-between items-center bg-secondary/30">
                <span className="text-muted-foreground">Completed Date:</span>
                <span className="text-foreground">
                  {formattedDate(request.completedAt)}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
