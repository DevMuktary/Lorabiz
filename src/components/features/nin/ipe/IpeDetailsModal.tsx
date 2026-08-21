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
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<IpeRequestRecord | null>(request);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  useEffect(() => {
    setCurrentRecord(request);
    setSyncFeedback(null);
  }, [request]);

  if (!isOpen || !currentRecord || !mounted || typeof document === "undefined") return null;

  const handleCopyNin = (nin: string) => {
    navigator.clipboard.writeText(nin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSync = async () => {
    if (isSyncing || !currentRecord) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      // First query status API directly to immediately update local modal view
      const res = await fetch(`/api/nin/ipe/status?reference=${encodeURIComponent(currentRecord.reference)}`);
      const data = await res.json();

      if (data.success && data.request) {
        const reqData = data.request;
        setCurrentRecord((prev) => prev ? {
          ...prev,
          status: reqData.status || prev.status,
          resolvedNin: reqData.resolvedNin || prev.resolvedNin,
          fullName: reqData.fullName || prev.fullName,
          dob: reqData.dob || prev.dob,
          gender: reqData.gender || prev.gender,
          photoUrl: reqData.photoUrl || prev.photoUrl,
          failureReason: reqData.failureReason || prev.failureReason,
          apiMessage: reqData.apiMessage || prev.apiMessage,
          completedAt: reqData.completedAt || prev.completedAt,
        } : null);

        if (reqData.status === "COMPLETED") {
          setSyncFeedback({
            type: "success",
            message: data.message || `IPE Clearance Complete! Resolved NIN: ${reqData.resolvedNin || "Generated"}`
          });
        } else if (reqData.status === "FAILED") {
          setSyncFeedback({
            type: "error",
            message: reqData.failureReason || data.message || "IPE Clearance outcome: Unsuccessful"
          });
        } else {
          setSyncFeedback({
            type: "info",
            message: data.message || "Verification in progress. Your clearance request is currently processing."
          });
        }
      } else {
        setSyncFeedback({
          type: "error",
          message: data.message || "Unable to sync status at this moment."
        });
      }

      if (onSyncStatus) {
        await onSyncStatus(currentRecord.reference);
      }
    } catch (err) {
      console.error("IPE status sync failed:", err);
      setSyncFeedback({
        type: "error",
        message: "Failed to connect to gateway. Please try again."
      });
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

  const displayedNin = currentRecord.resolvedNin
    ? isMasked
    ? `${currentRecord.resolvedNin.slice(0, 3)}*****${currentRecord.resolvedNin.slice(-3)}`
      : currentRecord.resolvedNin
    : "Pending Release";

  return createPortal(
    <div 
      className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
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
                    currentRecord.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : currentRecord.status === "FAILED"
                      ? "bg-destructive/10 text-destructive border border-destructive/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {currentRecord.status}
                </span>
              </div>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                Ref: {currentRecord.reference}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentRecord.status === "PROCESSING" && (
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
          
          {/* In-Modal Realtime Sync Feedback Banner */}
          {syncFeedback && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
              syncFeedback.type === "success" 
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20" 
                : syncFeedback.type === "error"
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
            }`}>
              {syncFeedback.type === "success" && <CheckCircle weight="fill" className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />}
              {syncFeedback.type === "error" && <XCircle weight="fill" className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />}
              {syncFeedback.type === "info" && <Clock weight="fill" className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />}
              <div className="flex-1 leading-relaxed">
                {syncFeedback.message}
              </div>
              <button 
                type="button" 
                onClick={() => setSyncFeedback(null)} 
                className="opacity-70 hover:opacity-100 cursor-pointer p-0.5 -mr-1"
              >
                <X weight="bold" className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Status Alert Banner */}
          {currentRecord.status === "PROCESSING" && (
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

          {currentRecord.status === "COMPLETED" && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-700 dark:text-emerald-300">
              <CheckCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-emerald-500" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">In-Processing Error Resolved Successfully</span>
                <p className="leading-relaxed">
                  The In-Processing Error for Tracking ID <strong>{currentRecord.trackingId}</strong> has been cleared, and your National Identification Number (NIN) has been released.
                </p>
              </div>
            </div>
          )}

          {currentRecord.status === "FAILED" && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 text-destructive">
              <XCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">Request Failed</span>
                <p className="leading-relaxed">
                  {currentRecord.failureReason || currentRecord.apiMessage || "The clearance could not be completed for this Tracking ID. A full wallet refund has been processed."}
                </p>
              </div>
            </div>
          )}

          {/* Resolved NIN Box (When Available) */}
          {currentRecord.resolvedNin && (
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
                  onClick={() => handleCopyNin(currentRecord.resolvedNin!)}
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
          {(currentRecord.fullName || currentRecord.dob || currentRecord.gender || currentRecord.photoUrl) && (
            <div className="bg-secondary/40 rounded-2xl p-5 border border-border space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User weight="bold" className="h-3.5 w-3.5 text-primary" />
                Applicant Demographics
              </h4>

              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {currentRecord.photoUrl && (
                  <div className="w-20 h-24 rounded-xl bg-secondary border border-border shrink-0 shadow-sm relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentRecord.photoUrl.startsWith("data:") ? currentRecord.photoUrl : `data:image/jpeg;base64,${currentRecord.photoUrl}`}
                      alt="NIMC Applicant Photo"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 text-xs">
                  {currentRecord.fullName && (
                    <div>
                      <span className="text-muted-foreground block">Full Name:</span>
                      <span className="font-bold text-foreground text-sm">
                        {currentRecord.fullName}
                      </span>
                    </div>
                  )}

                  {currentRecord.dob && (
                    <div>
                      <span className="text-muted-foreground block">Date of Birth:</span>
                      <span className="font-bold text-foreground">
                        {currentRecord.dob}
                      </span>
                    </div>
                  )}

                  {currentRecord.gender && (
                    <div>
                      <span className="text-muted-foreground block">Gender:</span>
                      <span className="font-bold text-foreground uppercase">
                        {currentRecord.gender}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audit Details Breakdown */}
          <div className="border border-border rounded-2xl divide-y divide-border text-xs">
            <div className="p-3.5 flex justify-between items-center bg-secondary/30">
              <span className="text-muted-foreground">Tracking ID:</span>
              <span className="font-mono font-bold text-foreground">
                {currentRecord.trackingId}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-muted-foreground">Transaction Reference:</span>
              <span className="font-mono text-foreground font-bold">
                {currentRecord.reference}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center bg-secondary/30">
              <span className="text-muted-foreground">Amount Charged:</span>
              <span className="font-bold text-foreground">
                ₦{Number(currentRecord.amountCharged).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-muted-foreground">Submitted Date:</span>
              <span className="text-foreground">
                {formattedDate(currentRecord.createdAt)}
              </span>
            </div>

            {currentRecord.completedAt && (
              <div className="p-3.5 flex justify-between items-center bg-secondary/30">
                <span className="text-muted-foreground">Completed Date:</span>
                <span className="text-foreground">
                  {formattedDate(currentRecord.completedAt)}
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
