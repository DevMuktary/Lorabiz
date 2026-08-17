// src/components/mds/nin-validation/NinValidationApplicationDrawer.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Fingerprint, 
  Layers, 
  User, 
  Mail, 
  Phone, 
  AlertTriangle, 
  Send,
  Loader2,
  RefreshCw,
  Tag,
  ShieldCheck
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod Validation)",
};

export default function NinValidationApplicationDrawer({
  ticket,
  onClose,
  onUpdateSuccess,
}: {
  ticket: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}) {
  const [activeAction, setActiveAction] = useState<"COMPLETE" | "FAIL" | "PROCESS" | "">("");
  const [failureReason, setFailureReason] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [issueRefund, setIssueRefund] = useState<boolean>(false);
  const [refundAmount, setRefundAmount] = useState<number | string>(ticket?.amountCharged || 0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!ticket) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statusColor =
    ticket.status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : ticket.status === "FAILED"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const categoryLabel = CATEGORY_LABELS[ticket.category] || ticket.category;

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      if (!activeAction) {
        throw new Error("Please select an action to perform.");
      }

      if (activeAction === "FAIL" && !failureReason.trim()) {
        throw new Error("Please provide a reason for failing this validation.");
      }

      if (activeAction === "FAIL" && issueRefund && (!refundAmount || Number(refundAmount) <= 0)) {
        throw new Error("Please enter a valid refund amount.");
      }

      const response = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: activeAction,
          failureReason: failureReason.trim(),
          adminNotes: adminNotes.trim(),
          issueRefund,
          refundAmount: issueRefund ? Number(refundAmount) : 0,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Action execution failed.");
      }

      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Slide-over Content */}
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {ticket.transactionRef}
              </span>
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {ticket.clientName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Submitted on {format(new Date(ticket.createdAt), "PPP 'at' p")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. HIGHLIGHT CARD: 11-DIGIT NIN & QUICK COPY */}
          <div className="p-5 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-900/80 border border-zinc-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center gap-1.5 uppercase font-bold tracking-wider text-[11px] text-indigo-400">
                <Fingerprint size={14} /> National Identification Number (NIN)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                {categoryLabel}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="font-mono text-2xl md:text-3xl font-black tracking-widest text-emerald-400">
                {ticket.nin}
              </span>

              <button
                type="button"
                onClick={() => handleCopy("nin", ticket.nin)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-md shrink-0"
              >
                {copiedKey === "nin" ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy NIN</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-[11px] text-zinc-400">
              Click the button above to copy the 11-digit NIN directly to your clipboard for verification.
            </p>
          </div>

          {/* 2. CLIENT & TICKET DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <User size={13} /> Client Details
              </span>
              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{ticket.clientName}</p>
                <p className="text-zinc-500 flex items-center gap-1">
                  <Mail size={12} /> {ticket.clientEmail}
                </p>
                <p className="text-zinc-500 flex items-center gap-1">
                  <Phone size={12} /> {ticket.clientPhone}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Tag size={13} /> Order Ledger
              </span>
              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount Paid:</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">
                    ₦{Number(ticket.amountCharged).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className="font-bold">{ticket.status}</span>
                </div>
                {ticket.completedAt && (
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Completed:</span>
                    <span>{format(new Date(ticket.completedAt), "MMM dd, p")}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 3. CURRENT FAILURE REASON (If FAILED) */}
          {ticket.status === "FAILED" && ticket.failureReason && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle size={14} /> Recorded Rejection Reason:
              </p>
              <p className="leading-relaxed pl-5">{ticket.failureReason}</p>
            </div>
          )}

          {/* 4. ADMIN ACTIONS PANEL */}
          <div className="p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-5">
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-500" />
                <span>Execute Operational Action</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Update status and trigger automatic client email notification.
              </p>
            </div>

            {/* Action Buttons Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveAction("COMPLETE")}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeAction === "COMPLETE"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-500"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                }`}
              >
                <CheckCircle size={16} />
                <span>Mark Completed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction("FAIL")}
                className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeAction === "FAIL"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20 ring-2 ring-rose-500"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                }`}
              >
                <XCircle size={16} />
                <span>Mark Failed</span>
              </button>
            </div>

            {/* SUB-PANEL: COMPLETE */}
            {activeAction === "COMPLETE" && (
              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <CheckCircle size={16} />
                  <span>Validation Success Confirmation</span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Marking this ticket as <strong>COMPLETED</strong> will update the client's dashboard and immediately dispatch an automated email notification confirming successful resolution for <strong>{categoryLabel}</strong>.
                </p>
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Internal Admin Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Validated via NIMC portal batch #492"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none"
                  />
                </div>
              </div>
            )}

            {/* SUB-PANEL: FAIL */}
            {activeAction === "FAIL" && (
              <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
                  <XCircle size={16} />
                  <span>Validation Rejection Reason</span>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Reason for Failure (Required - Visible to Client)
                  </label>
                  <textarea
                    rows={2}
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    placeholder="e.g. NIN record could not be matched with provided biometric profile or duplicate record detected."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none resize-none"
                  />
                </div>

                {/* Refund toggle */}
                <div className="pt-2 border-t border-rose-200 dark:border-rose-500/20 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={issueRefund}
                      onChange={(e) => setIssueRefund(e.target.checked)}
                      className="h-4 w-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Issue wallet refund to client
                    </span>
                  </label>

                  {issueRefund && (
                    <div className="flex items-center gap-2 pt-1 animate-in fade-in">
                      <span className="text-xs text-zinc-500">Refund Amount (₦):</span>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-32 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-bold font-mono outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit Action Button */}
            {activeAction && (
              <button
                type="button"
                onClick={handleActionSubmit}
                disabled={isProcessing}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Executing Action...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Confirm & Dispatch Notification</span>
                  </>
                )}
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
