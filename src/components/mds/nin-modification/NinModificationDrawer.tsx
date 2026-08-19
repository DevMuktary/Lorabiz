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
  User, 
  Mail, 
  Phone, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  ExternalLink,
  MapPin,
  DollarSign
} from "lucide-react";

interface NinModificationDrawerProps {
  request: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

const TYPE_TITLES: Record<string, string> = {
  CHANGE_OF_NAME: "Change of Name",
  CHANGE_OF_PHONE: "Change of Phone Number",
  CHANGE_OF_ADDRESS: "Change of Address",
};

export default function NinModificationDrawer({
  request,
  onClose,
  onUpdateSuccess,
}: NinModificationDrawerProps) {
  const [activeAction, setActiveAction] = useState<"PROCESS" | "COMPLETE" | "REJECT" | "">("");
  const [adminNotes, setAdminNotes] = useState<string>(request?.adminNotes || "");
  const [slipUrl, setSlipUrl] = useState<string>(request?.slipUrl || "");
  const [isUploadingSlip, setIsUploadingSlip] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>(request?.rejectionReason || "");
  const [issueRefund, setIssueRefund] = useState<boolean>(true);
  const [refundAmount, setRefundAmount] = useState<number | string>(request?.amountPaid || 0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!request) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSlip(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload file");
      }

      setSlipUrl(data.url);
    } catch (err: any) {
      console.error("Slip upload error:", err);
      setError(err.message || "Failed to upload modification slip.");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      if (!activeAction) {
        throw new Error("Please select an action to perform.");
      }

      if (activeAction === "COMPLETE" && !slipUrl.trim()) {
        throw new Error("Modification Transaction Slip is compulsory to complete the request.");
      }

      if (activeAction === "REJECT" && !rejectionReason.trim()) {
        throw new Error("Please provide a reason for rejecting this modification.");
      }

      if (activeAction === "REJECT" && issueRefund && (!refundAmount || Number(refundAmount) <= 0)) {
        throw new Error("Please enter a valid refund amount.");
      }

      const response = await fetch("/api/mds/pipeline/nin-modification/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request.id,
          actionType: activeAction,
          adminNotes: adminNotes.trim(),
          slipUrl: slipUrl.trim(),
          rejectionReason: rejectionReason.trim(),
          issueRefund,
          refundAmount: issueRefund ? Number(refundAmount) : 0,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Action execution failed.");
      }

      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      console.error("Action error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = () => {
    switch (request.status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">COMPLETED</span>;
      case "PROCESSING":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">PROCESSING</span>;
      case "REJECTED":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">PENDING</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20 font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {TYPE_TITLES[request.type] || request.type}
                  </h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    {request.trackingId}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Received {format(new Date(request.createdAt), "MMM d, yyyy · hh:mm a")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {statusBadge()}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Client Overview Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Client Information</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{request.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-medium text-slate-900 dark:text-white truncate block">{request.clientEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{request.clientPhone}</span>
                </div>
              </div>
            </div>

            {/* 2. Target NIN & Payment Record */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Target NIN (11 Digits)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white text-base tracking-wider">{request.nin}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("nin", request.nin)}
                  className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-sm"
                  title="Copy NIN"
                >
                  {copiedKey === "nin" ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Amount Paid / Fee</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">₦{request.amountPaid.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  <span>Ref: </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{request.transactionRef.slice(0, 14)}...</span>
                </div>
              </div>
            </div>

            {/* 3. Modification Details (Old vs Requested New) */}
            <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">
                  Submitted Modification Details
                </span>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {TYPE_TITLES[request.type]}
                </span>
              </div>

              {request.type === "CHANGE_OF_NAME" && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">Current Linked Phone:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{request.currentPhone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">New First Name:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{request.newFirstName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">New Surname (Last Name):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{request.newLastName}</span>
                  </div>
                  {request.newMiddleName && (
                    <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                      <span className="text-slate-500">New Middle Name:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{request.newMiddleName}</span>
                    </div>
                  )}
                  <div className="pt-1 flex justify-between">
                    <span className="text-slate-500">Complete New Full Name:</span>
                    <span className="font-black text-indigo-950 dark:text-indigo-200">
                      {[request.newFirstName, request.newMiddleName, request.newLastName].filter(Boolean).join(" ")}
                    </span>
                  </div>
                </div>
              )}

              {request.type === "CHANGE_OF_PHONE" && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">Full Name on NIN:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{request.currentFullName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">New Phone to Link:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{request.newPhoneNumber}</span>
                  </div>
                </div>
              )}

              {request.type === "CHANGE_OF_ADDRESS" && (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">Applicant Full Name:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{request.currentFullName || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">Current Phone:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{request.currentPhone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-indigo-100 dark:border-indigo-900/30">
                    <span className="text-slate-500">New Residential Address:</span>
                    <span className="font-bold text-slate-900 dark:text-white text-right max-w-xs">{request.newAddress}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">State / LGA:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{request.newState}, {request.newLga}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Action Selector */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Action Operations</span>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveAction("PROCESS")}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    activeAction === "PROCESS"
                      ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-700 dark:text-sky-300 ring-2 ring-sky-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <RefreshCw size={16} />
                  <span>Set In-Processing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAction("COMPLETE")}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    activeAction === "COMPLETE"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <CheckCircle size={16} />
                  <span>Complete & Upload Slip</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAction("REJECT")}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all ${
                    activeAction === "REJECT"
                      ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <XCircle size={16} />
                  <span>Reject / Refund</span>
                </button>
              </div>
            </div>

            {/* 5. Dynamic Action Configuration Panels */}
            
            {/* Panel for COMPLETE: Compulsory Slip Upload */}
            {activeAction === "COMPLETE" && (
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <UploadCloud size={16} />
                  <span>Upload Modification Transaction Slip (Compulsory)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        onChange={handleFileUpload}
                        disabled={isUploadingSlip}
                        className="hidden"
                      />
                      <div className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-50/50 transition-colors">
                        {isUploadingSlip ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-emerald-600" />
                            <span>Uploading Slip to Cloud...</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} className="text-emerald-600" />
                            <span>{slipUrl ? "Replace Uploaded Slip" : "Click to Upload Slip (PDF / Image)"}</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="text-[11px]">
                    <label className="text-slate-500 block mb-1">Or direct document URL:</label>
                    <input
                      type="url"
                      value={slipUrl}
                      onChange={(e) => setSlipUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {slipUrl && (
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[280px]">
                        ✓ Slip attached
                      </span>
                      <a
                        href={slipUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        Preview <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Panel for REJECT: Reason + Refund Liberty */}
            {activeAction === "REJECT" && (
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/50 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                  <AlertTriangle size={16} />
                  <span>Rejection Details & Refund Discretion</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rejection Reason (Dispatched to customer) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Identity mismatch on the central NIMC database. Please visit a NIMC enrollment centre."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Refund Amount to Customer's Wallet?
                    </span>
                    <input
                      type="checkbox"
                      checked={issueRefund}
                      onChange={(e) => setIssueRefund(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                  </label>

                  {issueRefund && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Refund Amount (₦)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={request.amountPaid}
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Default is full fee (₦{request.amountPaid.toLocaleString()}). You can alter if administrative cost is deducted.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Internal Admin Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Private remarks for administrative staff..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

          </div>

          {/* Drawer Footer / Submit Action */}
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleActionSubmit}
              disabled={isProcessing || !activeAction}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                activeAction === "REJECT"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : activeAction === "COMPLETE"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Executing Action...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>
                    {activeAction === "PROCESS" && "Confirm Move to Processing"}
                    {activeAction === "COMPLETE" && "Confirm Completion & Deliver Slip"}
                    {activeAction === "REJECT" && "Confirm Rejection"}
                    {!activeAction && "Select Action"}
                  </span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
