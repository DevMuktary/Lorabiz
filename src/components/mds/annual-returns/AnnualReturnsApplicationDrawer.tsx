// src/components/mds/annual-returns/AnnualReturnsApplicationDrawer.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  X,
  CheckCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Download,
  Copy,
  Check,
  User,
  Image as ImageIcon,
  CheckCheck,
  Eye,
  PenTool,
  Clock,
  Send,
  Loader2,
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";

interface AnnualReturnsApplicationDrawerProps {
  ticket: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function AnnualReturnsApplicationDrawer({
  ticket,
  onClose,
  onUpdateSuccess,
}: AnnualReturnsApplicationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"DETAILS" | "DOCUMENTS" | "ACTION">("DETAILS");
  const [actionType, setActionType] = useState<"START_PROCESSING" | "APPROVE" | "QUERY" | "REJECT" | "">("");

  // Action Form Inputs
  const [acknowledgementLetterUrl, setAcknowledgementLetterUrl] = useState<string>("");
  const [queryReason, setQueryReason] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!ticket) return null;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      let payloadAction = actionType;
      if (actionType === "APPROVE") payloadAction = "APPROVE_APPLICATION" as any;
      if (actionType === "QUERY") payloadAction = "QUERY_APPLICATION" as any;
      if (actionType === "REJECT") payloadAction = "REJECT_APPLICATION" as any;

      const res = await fetch("/api/mds/pipeline/annual-returns/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: payloadAction,
          acknowledgementLetterUrl: acknowledgementLetterUrl.trim(),
          queryReason: queryReason.trim(),
          rejectionReason: rejectionReason.trim(),
          adminNotes: adminNotes.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to execute staff action.");
      }

      onUpdateSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to perform action.");
    } finally {
      setIsProcessing(false);
    }
  };

  const statusColor =
    ticket.status === "APPROVED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20"
      : ticket.status === "PROCESSING"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/20"
      : ticket.status === "QUERIED"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20"
      : ticket.status === "REJECTED"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/20"
      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400 border-zinc-500/20";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {ticket.trackingId}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                  {ticket.status}
                </span>
                <span className="text-xs text-zinc-500 uppercase font-semibold">
                  {ticket.companyType === "LLC" ? "LLC / LTD" : "Business Name"}
                </span>
              </div>
              <h2 className="text-lg font-black text-zinc-900 dark:text-white truncate max-w-md">
                {ticket.companyName}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto text-xs">
            {ticket.status === "PENDING" && (
              <button
                type="button"
                onClick={() => {
                  setActionType("START_PROCESSING");
                  setActiveTab("ACTION");
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Clock size={14} />
                <span>Mark Processing</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActionType("APPROVE");
                setActiveTab("ACTION");
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <CheckCircle size={14} />
              <span>Approve & Upload Letter</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionType("QUERY");
                setActiveTab("ACTION");
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <AlertCircle size={14} />
              <span>Query Application</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionType("REJECT");
                setActiveTab("ACTION");
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <X size={14} />
              <span>Reject</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6">
            <button
              type="button"
              onClick={() => setActiveTab("DETAILS")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === "DETAILS"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Entity & Filing Data
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("DOCUMENTS")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === "DOCUMENTS"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Documents & Signature
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ACTION")}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === "ACTION"
                  ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Staff Action Panel {actionType ? `(${actionType})` : ""}
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB: DETAILS */}
            {activeTab === "DETAILS" && (
              <div className="space-y-6">
                
                {/* 1. Entity Information */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Registered Entity Profile
                  </span>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Company Name:</span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{ticket.companyName}</strong>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Registration Number:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono text-zinc-900 dark:text-white">{ticket.registrationNumber}</strong>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(ticket.registrationNumber, "regNo")}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                        >
                          {copiedField === "regNo" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Classification:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{ticket.companyType}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Filing Year(s):</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{ticket.filingYears || "Current"}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Client Profile */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Client & Account Profile
                  </span>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Submitted By:</span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{ticket.clientName}</strong>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Client Email:</span>
                      <a href={`mailto:${ticket.clientEmail}`} className="text-blue-600 hover:underline">
                        {ticket.clientEmail}
                      </a>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Phone Number:</span>
                      <span className="text-zinc-800 dark:text-zinc-200">{ticket.clientPhone}</span>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Amount Charged:</span>
                      <span className="font-bold text-emerald-600 font-mono">₦{ticket.amountPaid.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* 3. Query or Rejection Notice if applicable */}
                {ticket.queryReason && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-1">
                    <strong className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-bold">
                      <AlertCircle size={15} />
                      Current Query Active
                    </strong>
                    <p className="text-amber-800 dark:text-amber-300">{ticket.queryReason}</p>
                  </div>
                )}

                {ticket.rejectionReason && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs space-y-1">
                    <strong className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-bold">
                      <AlertCircle size={15} />
                      Application Rejection Reason
                    </strong>
                    <p className="text-rose-800 dark:text-rose-300">{ticket.rejectionReason}</p>
                  </div>
                )}

                {ticket.adminNotes && (
                  <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 block">Internal Staff Notes</span>
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{ticket.adminNotes}</p>
                  </div>
                )}

              </div>
            )}

            {/* TAB: DOCUMENTS & SIGNATURE */}
            {activeTab === "DOCUMENTS" && (
              <div className="space-y-6">
                
                {/* Document Preview */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                        Verification Document
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                        {ticket.documentType === "CERTIFICATE" ? "CAC Certificate of Registration" : "CAC Status Report"}
                      </h4>
                    </div>

                    <a
                      href={ticket.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} />
                      <span>Open Full Document</span>
                    </a>
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 p-2 max-h-80 flex items-center justify-center">
                    {ticket.documentUrl?.toLowerCase().endsWith(".pdf") ? (
                      <iframe src={ticket.documentUrl} className="w-full h-72 rounded border-none" />
                    ) : (
                      <img src={ticket.documentUrl} alt="CAC Document" className="max-h-72 object-contain" />
                    )}
                  </div>
                </div>

                {/* Authorizing Officer & Signature */}
                <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 block">
                    Authorizing Officer & Signature
                  </span>

                  <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                    <div>
                      <span className="text-zinc-500 block">Officer Name:</span>
                      <strong className="text-zinc-900 dark:text-white font-bold">{ticket.designeeFullName}</strong>
                    </div>

                    <div>
                      <span className="text-zinc-500 block">Designation:</span>
                      <span className="font-bold text-emerald-600">{ticket.designeeRole}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500 block mb-2 font-medium">Digital / Uploaded Signature:</span>
                    <div className="h-28 bg-white dark:bg-white rounded-xl border border-zinc-200 p-2 flex items-center justify-center shadow-inner">
                      {ticket.designeeSignatureUrl ? (
                        <img src={ticket.designeeSignatureUrl} alt="Signature" className="max-h-full object-contain" />
                      ) : (
                        <span className="text-xs text-zinc-400">No signature attached</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Official Acknowledgement Letter (if uploaded) */}
                {ticket.acknowledgementLetterUrl && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">
                          Official CAC Acknowledgement Letter
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-white">Uploaded & Delivered to Client</span>
                      </div>

                      <a
                        href={ticket.acknowledgementLetterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Download size={13} />
                        <span>Download Letter</span>
                      </a>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB: STAFF ACTION PANEL */}
            {activeTab === "ACTION" && (
              <div className="space-y-5">
                
                {error && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 text-xs font-bold">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Select Action to Execute:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setActionType("START_PROCESSING")}
                      className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                        actionType === "START_PROCESSING"
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      }`}
                    >
                      <span>1. Start Processing</span>
                      <span className="block text-[10px] font-normal text-zinc-400 mt-0.5">Move status to PROCESSING</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType("APPROVE")}
                      className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                        actionType === "APPROVE"
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      }`}
                    >
                      <span>2. Approve & Deliver Letter</span>
                      <span className="block text-[10px] font-normal text-zinc-400 mt-0.5">Attach CAC Acknowledgement</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType("QUERY")}
                      className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                        actionType === "QUERY"
                          ? "border-amber-600 bg-amber-50 dark:bg-amber-500/10 text-amber-600"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      }`}
                    >
                      <span>3. Query Application</span>
                      <span className="block text-[10px] font-normal text-zinc-400 mt-0.5">Request client clarification</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType("REJECT")}
                      className={`p-3 rounded-xl border font-bold text-left transition-all cursor-pointer ${
                        actionType === "REJECT"
                          ? "border-rose-600 bg-rose-50 dark:bg-rose-500/10 text-rose-600"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                      }`}
                    >
                      <span>4. Reject Application</span>
                      <span className="block text-[10px] font-normal text-zinc-400 mt-0.5">Mark non-compliant / failed</span>
                    </button>
                  </div>
                </div>

                {/* Contextual Action Inputs */}
                {actionType === "APPROVE" && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">
                      Upload Official CAC Acknowledgement Letter / Receipt <span className="text-destructive">*</span>
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Upload the PDF or scanned image receipt issued by CAC confirming successful Annual Return filing.
                    </p>

                    <FileUpload
                      label="CAC Acknowledgement Letter (PDF / Image)"
                      value={acknowledgementLetterUrl}
                      onUploadSuccess={(url) => setAcknowledgementLetterUrl(url)}
                      onRemove={() => setAcknowledgementLetterUrl("")}
                    />
                  </div>
                )}

                {actionType === "QUERY" && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-500/20 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-amber-700 dark:text-amber-400 block">
                      Query Reason / Instructions for Client <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={queryReason}
                      onChange={(e) => setQueryReason(e.target.value)}
                      placeholder="e.g. The uploaded status report is illegible. Please upload a clear copy of your Certificate of Registration."
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-xs outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                {actionType === "REJECT" && (
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-2">
                    <label className="text-xs font-bold text-rose-700 dark:text-rose-400 block">
                      Rejection Reason <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this filing cannot be executed..."
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                )}

                {/* Internal Admin Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                    Internal Staff Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. CAC agent assigned: Bamidele (CRP Portal Ref: 4892)"
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Execute Action Button */}
                {actionType && (
                  <button
                    type="button"
                    onClick={handleActionSubmit}
                    disabled={isProcessing}
                    className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Executing Action...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Confirm Action: {actionType}</span>
                      </>
                    )}
                  </button>
                )}

              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
