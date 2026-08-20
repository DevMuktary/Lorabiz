"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  X, CheckCircle, FileText, ShieldCheck, RefreshCw, 
  AlertCircle, AlertTriangle, User, Phone, Check, Download, Clock
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";

interface BvnRetrievalDrawerProps {
  ticket: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function BvnRetrievalDrawer({
  ticket,
  onClose,
  onUpdateSuccess,
}: BvnRetrievalDrawerProps) {
  const [activeTab, setActiveTab] = useState<"INFO" | "ACTIONS">("INFO");
  const [actionType, setActionType] = useState<"PROCESS" | "COMPLETE" | "FAIL" | "">("");

  const [retrievedBvn, setRetrievedBvn] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  
  // Admin-determined refund control
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | string>(ticket?.amountPaid || 2500);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!ticket) return null;

  const statusColor = 
    ticket.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    ticket.status === "PROCESSING" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      if (actionType === "COMPLETE") {
        const cleanBvn = retrievedBvn.trim();
        if (!cleanBvn || cleanBvn.length !== 11 || !/^\d{11}$/.test(cleanBvn)) {
          throw new Error("You must provide a valid 11-digit BVN to complete this retrieval.");
        }
      }

      if (actionType === "FAIL" && !failureReason.trim()) {
        throw new Error("You must provide a failure reason to reject this request.");
      }

      if (actionType === "FAIL" && issueRefund && (!refundAmount || Number(refundAmount) <= 0)) {
        throw new Error("Please enter a valid refund amount.");
      }

      const response = await fetch("/api/mds/pipeline/bvn-retrieval/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType,
          retrievedBvn: retrievedBvn.trim(),
          slipUrl: slipUrl.trim() || null,
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
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`px-2.5 py-0.5 text-xs font-black uppercase tracking-wider rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {ticket.trackingId}
              </span>
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {ticket.fullName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}
            </p>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 shrink-0">
          <button
            onClick={() => { setActiveTab("INFO"); setActionType(""); setError(""); }}
            className={`py-3 text-xs font-bold border-b-2 mr-6 transition-all ${
              activeTab === "INFO" 
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            Application Overview
          </button>
          <button
            onClick={() => { setActiveTab("ACTIONS"); setError(""); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === "ACTIONS" 
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            Take Action
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-3 text-rose-700 dark:text-rose-400 text-xs font-bold">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === "INFO" ? (
            <div className="space-y-6">
              
              {/* Applicant & Recovery Info Card */}
              <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <User size={14} className="text-emerald-600" />
                  Applicant Recovery Data
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Full Legal Name:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{ticket.fullName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Linked Phone:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">{ticket.phone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Client User Email:</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{ticket.clientEmail}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Amount Paid:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₦{Number(ticket.amountPaid).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Transaction Ref:</span>
                    <span className="font-mono text-zinc-500">{ticket.transactionRef}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-0.5">Tracking ID:</span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{ticket.trackingId}</span>
                  </div>
                </div>
              </div>

              {/* Status Outcome Card */}
              {ticket.status === "COMPLETED" && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle size={15} />
                    Retrieved BVN Result
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black font-mono tracking-widest text-emerald-800 dark:text-emerald-300">
                      {ticket.retrievedBvn}
                    </span>
                  </div>
                  {ticket.slipUrl && (
                    <div className="pt-2">
                      <a
                        href={ticket.slipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                      >
                        <Download size={14} />
                        <span>View / Download Attached Slip</span>
                      </a>
                    </div>
                  )}
                </div>
              )}

              {ticket.status === "FAILED" && (
                <div className="bg-rose-50 dark:bg-rose-950/30 p-5 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <AlertCircle size={15} />
                    Failure / Rejection Notice
                  </h3>
                  <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                    {ticket.failureReason}
                  </p>
                  {ticket.isRefunded && (
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 pt-1">
                      &#10004; Refund of ₦{Number(ticket.refundAmount || ticket.amountPaid).toLocaleString()} issued to client wallet.
                    </p>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Action Selection Buttons */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => { setActionType("PROCESS"); setError(""); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    actionType === "PROCESS" 
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500/20" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                  }`}
                >
                  <Clock className={`mb-2 ${actionType === "PROCESS" ? "text-blue-600" : "text-zinc-400"}`} size={20} />
                  <span className="font-bold text-xs block text-zinc-900 dark:text-zinc-100">In Progress</span>
                  <span className="text-[10px] text-zinc-500">Mark as Processing</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActionType("COMPLETE"); setError(""); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    actionType === "COMPLETE" 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                  }`}
                >
                  <CheckCircle className={`mb-2 ${actionType === "COMPLETE" ? "text-emerald-600" : "text-zinc-400"}`} size={20} />
                  <span className="font-bold text-xs block text-zinc-900 dark:text-zinc-100">Approve &amp; Complete</span>
                  <span className="text-[10px] text-zinc-500">Input 11-digit BVN</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActionType("FAIL"); setError(""); }}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    actionType === "FAIL" 
                      ? "border-rose-500 bg-rose-50 dark:bg-rose-950/50 ring-2 ring-rose-500/20" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300"
                  }`}
                >
                  <AlertCircle className={`mb-2 ${actionType === "FAIL" ? "text-rose-600" : "text-zinc-400"}`} size={20} />
                  <span className="font-bold text-xs block text-zinc-900 dark:text-zinc-100">Reject / Fail</span>
                  <span className="text-[10px] text-zinc-500">Reason &amp; Refund</span>
                </button>
              </div>

              {/* Action Forms */}
              {actionType === "PROCESS" && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h4 className="text-xs font-black uppercase text-zinc-400">Process Application</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Marking this ticket as <strong>PROCESSING</strong> informs the client that an operator is actively searching NIBSS databases.
                  </p>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 block mb-1.5">Optional Operator Notes</label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal remarks (not shown to client)..."
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {actionType === "COMPLETE" && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck size={16} />
                    Complete Retrieval
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                      Retrieved 11-Digit BVN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={retrievedBvn}
                      onChange={(e) => setRetrievedBvn(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 22234567890"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 font-mono font-bold text-sm tracking-wider text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="text-[10px] text-zinc-500 font-mono">{retrievedBvn.length}/11 digits</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                      Optional BVN Slip Document / Image URL
                    </label>
                    <input
                      type="url"
                      value={slipUrl}
                      onChange={(e) => setSlipUrl(e.target.value)}
                      placeholder="https://... (or paste file URL)"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 block">Internal Notes</label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal audit notes..."
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

              {actionType === "FAIL" && (
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <h4 className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle size={16} />
                    Reject Application
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                      Failure Reason (Sent to Client) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      placeholder="e.g. Phone number does not match registered NIBSS record for this legal name..."
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-rose-500/50"
                    />
                  </div>

                  {/* Admin-Determined Refund Toggle */}
                  <div className="bg-zinc-50 dark:bg-zinc-800/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={issueRefund}
                        onChange={(e) => setIssueRefund(e.target.checked)}
                        className="h-4 w-4 rounded text-emerald-600 border-zinc-300 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Issue Wallet Refund to Client
                      </span>
                    </label>

                    {issueRefund && (
                      <div className="pl-6 space-y-1">
                        <label className="text-[11px] font-bold text-zinc-500 block">Refund Amount (₦)</label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="w-full max-w-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 block">Internal Notes</label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal audit notes..."
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            Cancel
          </button>

          {activeTab === "ACTIONS" && actionType && (
            <button
              type="button"
              onClick={handleActionSubmit}
              disabled={isProcessing}
              className={`px-5 py-2.5 text-xs font-black rounded-xl text-white shadow-sm flex items-center gap-2 transition-all cursor-pointer ${
                actionType === "COMPLETE" ? "bg-emerald-600 hover:bg-emerald-700" :
                actionType === "FAIL" ? "bg-rose-600 hover:bg-rose-700" :
                "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing Action...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Execute {actionType}</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
