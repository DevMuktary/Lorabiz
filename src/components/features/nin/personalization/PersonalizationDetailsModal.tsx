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
  Fingerprint
} from "@phosphor-icons/react";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !request || typeof document === "undefined") return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSync(request.reference);
    } finally {
      setIsSyncing(false);
    }
  };

  const statusBadge =
    request.status === "COMPLETED"
      ? {
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
          icon: <CheckCircle weight="fill" className="h-4 w-4" />,
          label: "Completed",
        }
      : request.status === "FAILED"
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
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 duration-300 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Fingerprint weight="bold" className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-foreground">Personalization Details</h3>
              <p className="text-xs text-muted-foreground font-mono">Ref: {request.reference}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X weight="bold" className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Status Header */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border">
            <div>
              <span className="text-xs text-muted-foreground block">Current Status</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {request.status === "PROCESSING" && (
              <button
                type="button"
                onClick={handleSyncClick}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
              >
                <ArrowsClockwise weight="bold" className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                <span>Sync Status</span>
              </button>
            )}
          </div>

          {/* Resolved NIN Banner if completed */}
          {request.resolvedNin && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                National Identification Number (NIN)
              </span>
              <div className="text-3xl font-mono font-black text-emerald-700 dark:text-emerald-300 tracking-wider flex items-center justify-center gap-3">
                <span>{request.resolvedNin}</span>
                <button
                  type="button"
                  onClick={() => handleCopy("NIN", request.resolvedNin!)}
                  className="p-1.5 rounded-lg bg-card border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors shadow-sm"
                  title="Copy NIN"
                >
                  {copiedKey === "NIN" ? (
                    <Check weight="bold" className="h-4 w-4" />
                  ) : (
                    <Copy weight="bold" className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* PDF Slip Download Preview */}
          {request.pdfUrl && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md">
                  <FileText weight="fill" className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Official NIN Slip Ready</div>
                  <div className="text-[11px] text-muted-foreground">Download verified identity slip</div>
                </div>
              </div>
              <a
                href={request.pdfUrl.startsWith("data:") ? request.pdfUrl : `data:application/pdf;base64,${request.pdfUrl}`}
                download={`NIN_Slip_${request.resolvedNin || request.trackingId}.pdf`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:opacity-90 text-primary-foreground text-xs font-bold rounded-xl shadow transition-opacity"
              >
                <Download weight="bold" className="h-3.5 w-3.5" />
                <span>Download PDF</span>
              </a>
            </div>
          )}

          {/* Failure Banner */}
          {request.status === "FAILED" && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-destructive">
                <WarningCircle weight="fill" className="h-4 w-4" />
                <span>Personalization Outcome: Unsuccessful</span>
              </div>
              <p className="text-xs text-destructive/90 leading-relaxed">
                {request.failureReason || "The identity gateway was unable to personalize this tracking ID."}
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
                  {request.fullName || "—"}
                </span>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Date of Birth</span>
                <span className="text-xs font-bold text-foreground">
                  {request.dob || "—"}
                </span>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Gender</span>
                <span className="text-xs font-bold text-foreground">
                  {request.gender || "—"}
                </span>
              </div>
              <div className="p-3 bg-secondary/40 rounded-xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Phone</span>
                <span className="text-xs font-bold text-foreground">
                  {request.phone || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Request Details */}
          <div className="space-y-2.5 bg-secondary/30 p-4 rounded-2xl border border-border text-xs">
            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground">Tracking ID:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                <span>{request.trackingId}</span>
                <button
                  type="button"
                  onClick={() => handleCopy("TRACKING", request.trackingId)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedKey === "TRACKING" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-border/60">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-bold text-foreground">₦{request.amountCharged.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Date Submitted:</span>
              <span className="text-foreground">
                {new Date(request.createdAt).toLocaleDateString("en-NG", {
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
