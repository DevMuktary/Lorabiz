"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  X, CheckCircle, FileText, ShieldCheck, RefreshCw, 
  AlertCircle, AlertTriangle, User, Phone, Check, Download, Clock,
  UploadCloud, Loader2, Eye, Trash2, Copy, FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

const sanitizeHttpUrl = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Relative or invalid protocols
  }
  return null;
};

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
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [failureReason, setFailureReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  
  // Admin-determined refund control
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | string>(ticket?.amountPaid || 2500);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!ticket) return null;

  const statusColor = 
    ticket.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    ticket.status === "PROCESSING" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllApplicantDetails = () => {
    const text = `--- BVN RETRIEVAL APPLICANT DATA ---\nTracking ID: ${ticket.trackingId}\nFull Legal Name: ${ticket.fullName}\nLinked Phone: ${ticket.phone}\nClient Email: ${ticket.clientEmail || ticket.user?.email || "N/A"}`;
    handleCopy("applicant-all", text);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds the 5MB limit. Please compress the file.");
      return;
    }

    setIsUploadingSlip(true);
    setUploadProgress(0);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (err) {
              reject(new Error("Invalid server response format."));
            }
          } else {
            try {
              const errJson = JSON.parse(xhr.responseText);
              reject(new Error(errJson.error || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Network error during file upload."));
        xhr.send(formData);
      });

      if (data.success && data.url) {
        setSlipUrl(data.url);
      } else {
        throw new Error(data.error || "Failed to upload file.");
      }
    } catch (err: any) {
      console.error("Slip upload error:", err);
      setError(err.message || "Failed to upload BVN retrieval resolution slip.");
    } finally {
      setIsUploadingSlip(false);
      setUploadProgress(0);
    }
  };

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
      onClose();
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
            <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              <span>Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</span>
              <span>•</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">Client: {ticket.clientEmail || ticket.user?.email || "N/A"}</span>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 shrink-0">
          <button
            onClick={() => { setActiveTab("INFO"); setActionType(""); setError(""); }}
            className={`py-3 text-xs font-bold border-b-2 mr-6 transition-all cursor-pointer ${
              activeTab === "INFO" 
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            Applicant &amp; Recovery Info
          </button>
          <button
            onClick={() => { setActiveTab("ACTIONS"); setError(""); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "ACTIONS" 
                ? "border-emerald-600 text-emerald-600 dark:text-emerald-400 font-black" 
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
            }`}
          >
            Take Action &amp; Upload Result Slip
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
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
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <User size={14} className="text-emerald-600" />
                    Applicant Recovery Data
                  </h3>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyAllApplicantDetails}
                    className="h-8 px-3 text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedKey === "applicant-all" ? (
                      <>
                        <Check size={13} className="text-emerald-500" />
                        <span>Copied All Details!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Applicant Data</span>
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                    <span className="text-zinc-500 block mb-0.5 text-[10px] uppercase font-bold">Full Legal Name on BVN:</span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{ticket.fullName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                    <span className="text-zinc-500 block mb-0.5 text-[10px] uppercase font-bold">Linked Phone Number:</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-sm">{ticket.phone}</span>
                      <button 
                        onClick={() => handleCopy("phone", ticket.phone)}
                        className="text-zinc-400 hover:text-emerald-600 p-0.5 cursor-pointer"
                        title="Copy Phone"
                      >
                        {copiedKey === "phone" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                      </button>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                    <span className="text-zinc-500 block mb-0.5 text-[10px] uppercase font-bold">Amount Paid:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">₦{Number(ticket.amountPaid).toLocaleString()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                    <span className="text-zinc-500 block mb-0.5 text-[10px] uppercase font-bold">Transaction Reference:</span>
                    <span className="font-mono text-zinc-500 text-xs truncate block">{ticket.transactionRef}</span>
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
                    <button
                      onClick={() => handleCopy("retBvn", ticket.retrievedBvn)}
                      className="p-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 hover:text-white dark:text-emerald-300 transition-colors cursor-pointer"
                      title="Copy BVN"
                    >
                      {copiedKey === "retBvn" ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  {sanitizeHttpUrl(ticket.slipUrl) && (
                    <div className="pt-2">
                      <a
                        href={sanitizeHttpUrl(ticket.slipUrl)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
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
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
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
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
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
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
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

                  {/* DIRECT FILE UPLOADER FOR BVN SLIP */}
                  <div className="space-y-2 pt-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                      Upload BVN Resolution Slip / Result File (PDF, PNG, JPG)
                    </label>

                    {!slipUrl ? (
                      <div className="relative border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/60 rounded-2xl p-5 text-center transition-colors bg-zinc-50 dark:bg-zinc-950/60">
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={handleFileUpload}
                          disabled={isUploadingSlip}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          <div className="p-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400">
                            {isUploadingSlip ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs">
                              {isUploadingSlip ? `Uploading slip (${uploadProgress}%)...` : "Drop slip here or click to browse"}
                            </p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Supports PDF, PNG, JPG (Max 5MB)</p>
                          </div>
                        </div>

                        {isUploadingSlip && (
                          <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5 mt-3 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-emerald-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <FileCheck size={18} />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100 text-xs truncate">Slip Uploaded</p>
                            {sanitizeHttpUrl(slipUrl) ? (
                              <a 
                                href={sanitizeHttpUrl(slipUrl)!} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 truncate"
                              >
                                <Eye size={12} /> View Uploaded File
                              </a>
                            ) : (
                              <span className="text-[11px] text-zinc-500 italic mt-0.5 block truncate">Custom/Relative URL</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSlipUrl("")}
                          className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove File"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    <div className="pt-1">
                      <span className="text-[10px] text-zinc-500 block mb-1">Or paste direct slip URL</span>
                      <input
                        type="url"
                        value={slipUrl}
                        onChange={(e) => setSlipUrl(e.target.value)}
                        placeholder="https://... (or paste file URL)"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
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
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
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
                          className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Submit Button */}
              {actionType && (
                <div className="pt-2">
                  <Button
                    type="button"
                    disabled={isProcessing || isUploadingSlip}
                    onClick={handleActionSubmit}
                    className={`w-full h-12 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      actionType === "COMPLETE"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                        : actionType === "PROCESS"
                        ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                    }`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Processing Action...</span>
                      </span>
                    ) : (
                      <span>Execute Action</span>
                    )}
                  </Button>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
