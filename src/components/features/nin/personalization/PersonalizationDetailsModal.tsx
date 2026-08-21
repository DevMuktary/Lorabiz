"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Copy, 
  Check, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowsClockwise, 
  FileText, 
  Download, 
  WarningCircle,
  Fingerprint,
  DownloadSimple
} from "@phosphor-icons/react";
import { downloadPdfSlip } from "@/lib/download-slip";

export interface PersonalizationRequestRecord {
  id: string;
  trackingId: string;
  reference: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  amountCharged: number;
  provider: string;
  resolvedNin?: string | null;
  fullName?: string | null;
  dob?: string | null;
  gender?: string | null;
  phone?: string | null;
  residenceState?: string | null;
  photoUrl?: string | null;
  pdfUrl?: string | null;
  failureReason?: string | null;
  apiMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

interface PersonalizationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: PersonalizationRequestRecord | null;
  onSync: (reference: string) => Promise<void>;
}

export function PersonalizationDetailsModal({
  isOpen,
  onClose,
  request,
  onSync,
}: PersonalizationDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: "success" | "info" | "error"; message: string } | null>(null);
  const [currentRecord, setCurrentRecord] = useState<PersonalizationRequestRecord | null>(request);

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

  if (!isOpen || !mounted || !currentRecord || typeof document === "undefined") return null;

  const handleDownloadSlip = async () => {
    if (!currentRecord?.pdfUrl) return;
    setIsDownloadingPdf(true);
    try {
      await downloadPdfSlip(
        currentRecord.pdfUrl,
        `NIN_Slip_${currentRecord.resolvedNin || currentRecord.trackingId}.pdf`
      );
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSyncClick = async () => {
    if (!currentRecord) return;
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      // First query status API directly to immediately update local modal view
      const res = await fetch(`/api/nin/personalization/status?reference=${encodeURIComponent(currentRecord.reference)}`);
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
          phone: reqData.phone || prev.phone,
          residenceState: reqData.residenceState || prev.residenceState,
          photoUrl: reqData.photoUrl || prev.photoUrl,
          pdfUrl: reqData.pdfUrl || prev.pdfUrl,
          failureReason: reqData.failureReason || prev.failureReason,
          apiMessage: reqData.apiMessage || prev.apiMessage,
          completedAt: reqData.completedAt || prev.completedAt,
        } : null);

        if (reqData.status === "COMPLETED") {
          setSyncFeedback({
            type: "success",
            message: data.message || `Personalization Complete! Resolved NIN: ${reqData.resolvedNin || "Generated"}`
          });
        } else if (reqData.status === "FAILED") {
          setSyncFeedback({
            type: "error",
            message: reqData.failureReason || data.message || "Personalization outcome: Unsuccessful"
          });
        } else {
          setSyncFeedback({
            type: "info",
            message: data.message || "Verification in progress. Your request is currently being processed."
          });
        }
      } else {
        setSyncFeedback({
          type: "error",
          message: data.message || "Unable to sync status at this moment."
        });
      }

      // Notify parent to refresh table
      await onSync(currentRecord.reference);
    } catch (err) {
      console.error("Status sync failed:", err);
      setSyncFeedback({
        type: "error",
        message: "Failed to connect to gateway. Please try again."
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const statusBadge =
    currentRecord.status === "COMPLETED"
      ? {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle weight="fill" className="h-4 w-4" />,
          label: "Completed",
        }
      : currentRecord.status === "FAILED"
      ? {
          bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
          icon: <XCircle weight="fill" className="h-4 w-4" />,
          label: "Failed",
        }
      : {
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
          icon: <Clock weight="fill" className="h-4 w-4" />,
          label: "Processing",
        };

  return createPortal(
    <div 
      className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-card text-card-foreground border border-border w-full max-w-lg rounded-3xl shadow-2xl animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Fingerprint weight="bold" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Personalization Details</h3>
              <p className="text-xs text-muted-foreground font-mono">Ref: {currentRecord.reference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${statusBadge.bg}`}>
            <div className="flex items-center gap-2.5">
              {statusBadge.icon}
              <span className="text-sm font-bold">{statusBadge.label}</span>
            </div>
            
            {/* Sync Live Status Button */}
            {currentRecord.status === "PROCESSING" && (
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs font-bold shadow-xs hover:bg-secondary transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowsClockwise className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
                <span>{isSyncing ? "Checking..." : "Sync Status"}</span>
              </button>
            )}
          </div>

          {/* Sync Feedback Toast */}
          {syncFeedback && (
            <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
              syncFeedback.type === "success" 
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                : syncFeedback.type === "info" 
                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                : "bg-destructive/10 text-destructive border border-destructive/20"
            }`}>
              {syncFeedback.type === "success" ? <CheckCircle weight="fill" className="h-4 w-4 shrink-0" /> : <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />}
              <span>{syncFeedback.message}</span>
            </div>
          )}

          {/* Resolved NIN Highlight */}
          {currentRecord.resolvedNin && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Generated &amp; Resolved NIN
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-wider">
                  {currentRecord.resolvedNin}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy("NIN", currentRecord.resolvedNin!)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  {copiedKey === "NIN" ? (
                    <>
                      <Check weight="bold" className="h-3.5 w-3.5" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy weight="bold" className="h-3.5 w-3.5" />
                      <span>Copy NIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PDF Slip Download Preview */}
          {currentRecord.pdfUrl && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <FileText weight="fill" className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Verified NIN Slip Ready</div>
                  <div className="text-[11px] text-muted-foreground">Download identity slip</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadSlip}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloadingPdf ? (
                  <>
                    <ArrowsClockwise weight="bold" className="h-3.5 w-3.5 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Check weight="bold" className="h-3.5 w-3.5" />
                    <span>Download Started!</span>
                  </>
                ) : (
                  <>
                    <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Failure Banner */}
          {currentRecord.status === "FAILED" && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-destructive">
                <WarningCircle weight="fill" className="h-4 w-4" />
                <span>Personalization Outcome: Unsuccessful</span>
              </div>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {currentRecord.failureReason || "The identity gateway was unable to personalize this tracking ID."}
              </p>
              <p className="text-[11px] text-muted-foreground pt-1 border-t border-destructive/20 font-medium">
                Please contact support if you require assistance with this enrollment tracking ID.
              </p>
            </div>
          )}

          {/* Applicant Demographics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Applicant Information
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Full Name</span>
                <span className="text-xs font-bold text-foreground">
                  {currentRecord.fullName || "—"}
                </span>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Date of Birth</span>
                <span className="text-xs font-bold text-foreground">
                  {currentRecord.dob || "—"}
                </span>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Gender</span>
                <span className="text-xs font-bold text-foreground">
                  {currentRecord.gender || "—"}
                </span>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Phone</span>
                <span className="text-xs font-bold text-foreground">
                  {currentRecord.phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Request Details */}
          <div className="space-y-2.5 bg-secondary/30 p-4 rounded-2xl border border-border text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground">Tracking ID:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                <span>{currentRecord.trackingId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy("TRACKING", currentRecord.trackingId)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {copiedKey === "TRACKING" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-foreground">₦{Number(currentRecord.amountCharged).toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Date Submitted:</span>
              <span className="text-foreground">
                {new Date(currentRecord.createdAt).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-secondary/20 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary text-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
