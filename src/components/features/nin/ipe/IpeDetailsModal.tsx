"use client";

import React, { useState } from "react";
import { 
  AlertCircle, 
  Calendar, 
  Check, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  FileText, 
  KeyRound, 
  RefreshCw, 
  User, 
  X, 
  XCircle 
} from "lucide-react";

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

  if (!isOpen || !request) return null;

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

  // Helper to format or mask NIN
  const displayedNin = request.resolvedNin
    ? isMasked
      ? `${request.resolvedNin.slice(0, 3)}*****${request.resolvedNin.slice(-3)}`
      : request.resolvedNin
    : "Pending Release";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  IPE Clearance Details
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    request.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : request.status === "FAILED"
                      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse"
                  }`}
                >
                  {request.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
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
                className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
                <span>{isSyncing ? "Checking..." : "Sync"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Status Alert Banner */}
          {request.status === "PROCESSING" && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3 text-amber-900 dark:text-amber-300">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">Clearance In Processing</span>
                <p className="leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  This request is actively being processed by the NIMC exception clearance system. Processing typically completes within ~24 hours. You will receive an email notification as soon as the result is ready.
                </p>
              </div>
            </div>
          )}

          {request.status === "COMPLETED" && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3 text-emerald-900 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">Exception Resolved Successfully</span>
                <p className="leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                  The initial processing exception for Tracking ID <strong>{request.trackingId}</strong> has been cleared, and your National Identification Number (NIN) is ready.
                </p>
              </div>
            </div>
          )}

          {request.status === "FAILED" && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 flex items-start gap-3 text-rose-900 dark:text-rose-300">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <span className="font-bold block">Request Unsuccessful</span>
                <p className="leading-relaxed text-rose-800/90 dark:text-rose-300/90">
                  {request.failureReason || request.apiMessage || "The exception clearance could not be completed for this Tracking ID. A full wallet refund has been processed."}
                </p>
              </div>
            </div>
          )}

          {/* Resolved NIN Box (When Available) */}
          {request.resolvedNin && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved National Identification Number (NIN)
                </span>
                <button
                  type="button"
                  onClick={() => setIsMasked(!isMasked)}
                  className="hover:text-white flex items-center gap-1 text-[11px] transition-colors"
                >
                  {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isMasked ? "Show" : "Mask"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-xl p-4">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold tracking-widest text-white">
                  {displayedNin}
                </span>

                <button
                  type="button"
                  onClick={() => handleCopyNin(request.resolvedNin!)}
                  className="h-10 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-emerald-500/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy NIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Demographics & Photo Preview (If returned by API) */}
          {(request.fullName || request.dob || request.gender || request.photoUrl) && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Applicant Demographics
              </h4>

              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                {request.photoUrl && (
                  <div className="w-20 h-24 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0 shadow-sm">
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
                      <span className="text-slate-400 block">Full Name:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                        {request.fullName}
                      </span>
                    </div>
                  )}

                  {request.dob && (
                    <div>
                      <span className="text-slate-400 block">Date of Birth:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {request.dob}
                      </span>
                    </div>
                  )}

                  {request.gender && (
                    <div>
                      <span className="text-slate-400 block">Gender:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 uppercase">
                        {request.gender}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submission & Audit Details Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="p-3.5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-400">Tracking ID:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {request.trackingId}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-400">Transaction Reference:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {request.reference}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-slate-400">Amount Charged:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₦{Number(request.amountCharged).toLocaleString()}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-400">Submitted Date:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {formattedDate(request.createdAt)}
              </span>
            </div>

            {request.completedAt && (
              <div className="p-3.5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                <span className="text-slate-400">Completed Date:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {formattedDate(request.completedAt)}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
