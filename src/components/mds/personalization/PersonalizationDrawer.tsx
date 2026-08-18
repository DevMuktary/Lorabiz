"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  X, CheckCircle2, XCircle, Clock, RefreshCw, Copy, Check, User, 
  Wallet, ShieldAlert, ArrowRight, ShieldCheck, AlertCircle, Fingerprint,
  RotateCw, FileText, Download
} from "lucide-react";

export default function PersonalizationDrawer({
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
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [residenceState, setResidenceState] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

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
        payload.dob = dob.trim() || undefined;
        payload.gender = gender.trim() || undefined;
        payload.phone = phone.trim() || undefined;
        payload.residenceState = residenceState.trim() || undefined;
        payload.adminNotes = adminNotes.trim() || undefined;
      } else if (actionType === "FAIL") {
        if (!failureReason.trim()) {
          throw new Error("Please specify the failure/rejection reason.");
        }
        payload.action = "MARK_FAILED_REFUND";
        payload.reason = failureReason.trim();
        payload.adminNotes = adminNotes.trim() || undefined;
      } else {
        throw new Error("No action selected");
      }

      const res = await fetch("/api/mds/pipeline/personalization/action", {
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
      />

      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 z-10 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Fingerprint size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  {ticket.trackingId}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                  {ticket.status === "PROCESSING" ? "Processing" : ticket.status}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  {ticket.provider || "DATAVERIFY"}
                </span>
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-0.5">Ref: {ticket.reference}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 px-5">
          <button
            onClick={() => setActiveTab("INFO")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === "INFO"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Ticket Overview
          </button>
          <button
            onClick={() => setActiveTab("ACTIONS")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === "ACTIONS"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <RotateCw size={12} /> Operator Actions
          </button>
          <button
            onClick={() => setActiveTab("RAW")}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === "RAW"
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            Gateway Payload
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === "INFO" && (
            <div className="space-y-6">
              {/* Resolved NIN Banner */}
              {ticket.resolvedNin && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Resolved National Identification Number
                    </div>
                    <div className="text-2xl font-mono font-black text-emerald-700 dark:text-emerald-300 mt-1">
                      {ticket.resolvedNin}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy("NIN", ticket.resolvedNin)}
                    className="p-2 rounded-lg bg-white dark:bg-zinc-800 text-emerald-600 shadow-sm border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50"
                  >
                    {copiedKey === "NIN" ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              )}

              {/* PDF Slip Download Preview if available */}
              {ticket.pdfUrl && (
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Official NIN Slip Generated</div>
                      <div className="text-[11px] text-zinc-500">Base64 PDF Slip is available for immediate download</div>
                    </div>
                  </div>
                  <a
                    href={ticket.pdfUrl.startsWith("data:") ? ticket.pdfUrl : `data:application/pdf;base64,${ticket.pdfUrl}`}
                    download={`NIN_Slip_${ticket.resolvedNin || ticket.trackingId}.pdf`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm"
                  >
                    <Download size={14} /> Download PDF
                  </a>
                </div>
              )}

              {/* Failure Banner */}
              {ticket.status === "FAILED" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
                    <AlertCircle size={15} /> Failure Reason
                  </div>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    {ticket.failureReason || "Personalization request could not be completed."}
                  </p>
                </div>
              )}

              {/* Applicant Demographic Information */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Applicant Demographics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Full Name</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {ticket.fullName || "Pending Retrieval"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Date of Birth</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {ticket.dob || "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Gender</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {ticket.gender || "—"}
                    </span>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 block">Phone Number</span>
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {ticket.phone || "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client & Payment Info */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Client & Billing Details
                </h3>
                <div className="space-y-2 bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-zinc-500">Client Name:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{ticket.clientName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-zinc-500">Client Email:</span>
                    <span className="font-mono text-zinc-700 dark:text-zinc-300">{ticket.clientEmail}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                    <span className="text-zinc-500">Amount Charged:</span>
                    <span className="font-bold text-emerald-600">₦{Number(ticket.amountCharged).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-zinc-500">Submitted At:</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {format(new Date(ticket.createdAt), "MMM d, yyyy • h:mm a")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "ACTIONS" && (
            <div className="space-y-6">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold rounded-xl flex items-center gap-2">
                  <CheckCircle2 size={16} /> {successMsg}
                </div>
              )}

              {/* Action Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                  Select Action
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActionType("SYNC")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      actionType === "SYNC"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <RefreshCw size={14} className="mx-auto mb-1.5" />
                    Live Gateway Sync
                  </button>

                  <button
                    onClick={() => setActionType("COMPLETE")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      actionType === "COMPLETE"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <CheckCircle2 size={14} className="mx-auto mb-1.5" />
                    Manual Complete
                  </button>

                  <button
                    onClick={() => setActionType("FAIL")}
                    className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                      actionType === "FAIL"
                        ? "bg-rose-600 text-white border-rose-600 shadow-md"
                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                    }`}
                  >
                    <XCircle size={14} className="mx-auto mb-1.5" />
                    Reject & Refund
                  </button>
                </div>
              </div>

              {/* Action Form Inputs */}
              {actionType === "SYNC" && (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300 space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <RefreshCw size={14} className="animate-spin" /> Query Identity Gateway (DataVerify)
                  </div>
                  <p>
                    This will poll the upstream DataVerify server with Tracking ID{" "}
                    <strong className="font-mono">{ticket.trackingId}</strong>. If completed, the NIN and demographics will be retrieved and stored automatically.
                  </p>
                </div>
              )}

              {actionType === "COMPLETE" && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-800/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      11-Digit Resolved NIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={resolvedNin}
                      onChange={(e) => setResolvedNin(e.target.value.replace(/\D/g, ""))}
                      placeholder="e.g. 12345678901"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                      Applicant Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. JOHN DOE"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Date of Birth (Optional)
                      </label>
                      <input
                        type="text"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        placeholder="DD-MM-YYYY"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">
                        Gender (Optional)
                      </label>
                      <input
                        type="text"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        placeholder="Male / Female"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {actionType === "FAIL" && (
                <div className="space-y-4 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-900/40">
                  <div>
                    <label className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-1">
                      Reason for Rejection / Failure <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                      placeholder="e.g. Tracking ID record invalid or unverified by NIMC."
                      className="w-full p-3 bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    ⚠️ Marking as failed will immediately refund ₦{Number(ticket.amountCharged).toLocaleString()} to the user&apos;s wallet.
                  </p>
                </div>
              )}

              {actionType && (
                <button
                  onClick={handleActionSubmit}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-white text-xs font-bold shadow-lg flex items-center justify-center transition-all"
                >
                  {isProcessing ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : (
                    "Confirm & Execute Action"
                  )}
                </button>
              )}
            </div>
          )}

          {activeTab === "RAW" && (
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
              <pre>{JSON.stringify(ticket.apiResponse || ticket.userData || { status: ticket.status }, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
