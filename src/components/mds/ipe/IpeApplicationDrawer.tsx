// src/components/mds/ipe/IpeApplicationDrawer.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  X, CheckCircle2, XCircle, Clock, RefreshCw, Copy, Check, User, 
  Wallet, ShieldAlert, ArrowRight, ShieldCheck, AlertCircle, Fingerprint,
  RotateCw
} from "lucide-react";

export default function IpeApplicationDrawer({
  ticket,
  onClose,
  onUpdateSuccess,
}: {
  ticket: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"INFO" | "ACTIONS" | "RAW">("INFO");
  const [actionType, setActionType] = useState<"SYNC" | "COMPLETE" | "FAIL" | "">("");
  
  const [resolvedNin, setResolvedNin] = useState("");
  const [fullName, setFullName] = useState("");
  const [failureReason, setFailureReason] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!ticket) return null;

  const statusColor =
    ticket.status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20"
      : ticket.status === "FAILED"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/20"
      : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20";

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");
    setSuccessMsg("");

    try {
      let payload: any = { id: ticket.id, reference: ticket.reference };

      if (actionType === "SYNC") {
        payload.action = "SYNC_STATUS";
      } else if (actionType === "COMPLETE") {
        if (!resolvedNin.trim() || resolvedNin.trim().length !== 11) {
          throw new Error("Please provide a valid 11-digit National Identification Number.");
        }
        payload.action = "MARK_COMPLETED";
        payload.resolvedNin = resolvedNin.trim();
        payload.fullName = fullName.trim() || undefined;
      } else if (actionType === "FAIL") {
        if (!failureReason.trim()) {
          throw new Error("Please specify the failure/rejection reason.");
        }
        payload.action = "MARK_FAILED_REFUND";
        payload.reason = failureReason.trim();
      } else {
        throw new Error("No action selected");
      }

      const res = await fetch("/api/mds/pipeline/ipe/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to execute action");
      }

      setSuccessMsg(result.message || "Action executed successfully");
      setTimeout(() => {
        onUpdateSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-3xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md border ${statusColor}`}>
                {ticket.status === "COMPLETED" ? "Completed" : ticket.status === "FAILED" ? "Failed" : "In Processing"}
              </span>
              <span className="font-mono text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                Ref: {ticket.reference}
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Fingerprint className="text-teal-500" size={22} />
              Tracking ID: <span className="font-mono">{ticket.trackingId}</span>
              <button
                type="button"
                onClick={() => handleCopy("track", ticket.trackingId)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                title="Copy Tracking ID"
              >
                {copiedKey === "track" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}
            </p>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 shrink-0">
          <button 
            onClick={() => setActiveTab("INFO")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${activeTab === "INFO" ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            Request Details & Profile
          </button>
          <button 
            onClick={() => setActiveTab("ACTIONS")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${activeTab === "ACTIONS" ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            Resolution & Actions
          </button>
          <button 
            onClick={() => setActiveTab("RAW")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${activeTab === "RAW" ? "border-teal-500 text-teal-600 dark:text-teal-400" : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
          >
            AgentHub Raw Response
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: INFO */}
          {activeTab === "INFO" && (
            <div className="space-y-6">
              
              {/* Clearance Status Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Service Status Overview</h3>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    Fee: ₦{ticket.amountCharged?.toLocaleString()}
                  </span>
                </div>

                {ticket.status === "COMPLETED" && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 size={16} className="text-emerald-500" /> Released National Identification Number (NIN)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy("nin", ticket.resolvedNin)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        {copiedKey === "nin" ? "Copied!" : "Copy NIN"}
                      </button>
                    </div>
                    <p className="font-mono text-2xl font-black tracking-widest text-emerald-700 dark:text-emerald-400">
                      {ticket.resolvedNin || "N/A"}
                    </p>
                    {ticket.fullName && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400">
                        Full Name on Record: <strong>{ticket.fullName}</strong>
                      </p>
                    )}
                  </div>
                )}

                {ticket.status === "FAILED" && (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 space-y-2">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                      <XCircle size={16} className="text-rose-500" /> Rejection / Failure Reason
                    </span>
                    <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                      {ticket.failureReason || ticket.apiMessage || "Clearance rejected by provider."}
                    </p>
                  </div>
                )}

                {ticket.status === "PROCESSING" && (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-1">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <Clock size={16} className="text-amber-500 animate-spin" /> NIMC Gateway Processing
                    </span>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Tracking ID is pending verification and release at NIMC central database.
                    </p>
                  </div>
                )}
              </div>

              {/* Client Profile */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <User size={14} /> Client Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-400">Full Name</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{ticket.clientName}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Email Address</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{ticket.clientEmail}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Phone Number</span>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">{ticket.clientPhone || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400">Current Wallet Balance</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₦{ticket.walletBalance?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIONS */}
          {activeTab === "ACTIONS" && (
            <div className="space-y-6">
              
              {/* Option A: AgentHub Live Status Query */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <RefreshCw size={16} className="text-teal-500" /> Check AgentHub Status Now
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Directly query the AgentHub identity gateway for updated clearance status on this tracking ID.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActionType("SYNC");
                    setTimeout(() => handleActionSubmit(), 50);
                  }}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCw size={14} className={isProcessing && actionType === "SYNC" ? "animate-spin" : ""} />
                  {isProcessing && actionType === "SYNC" ? "Querying Gateway..." : "Trigger Live Status Sync"}
                </button>
              </div>

              {/* Option B: Manual Mark Completed */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500" /> Manually Resolve & Release NIN
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    If you cleared this IPE manually through NIMC support, enter the released 11-digit NIN here.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Released NIN (11 Digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      placeholder="e.g. 12345678901"
                      value={resolvedNin}
                      onChange={(e) => setResolvedNin(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Applicant Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. JOHN DOE"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType("COMPLETE");
                      setTimeout(() => handleActionSubmit(), 50);
                    }}
                    disabled={isProcessing || resolvedNin.length !== 11}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isProcessing && actionType === "COMPLETE" ? "Processing..." : "Mark as Completed & Notify Client"}
                  </button>
                </div>
              </div>

              {/* Option C: Force Reject & Credit Refund */}
              <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                    <XCircle size={16} /> Mark as Failed & Process Refund
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    This will mark the request as Failed, refund ₦{ticket.amountCharged?.toLocaleString()} to the user's wallet, and send an automated failure email.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Failure / Rejection Reason *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Invalid tracking ID or biometric mismatch at NIMC."
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActionType("FAIL");
                      setTimeout(() => handleActionSubmit(), 50);
                    }}
                    disabled={isProcessing || !failureReason.trim()}
                    className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {isProcessing && actionType === "FAIL" ? "Refunding..." : `Confirm Failure & Refund ₦${ticket.amountCharged?.toLocaleString()}`}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: RAW RESPONSE */}
          {activeTab === "RAW" && (
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Provider Payload Dump</h3>
              <pre className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto">
                {JSON.stringify(ticket.apiResponse || { message: ticket.apiMessage || "No raw payload stored yet" }, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
