// src/components/mds/tax-id/TaxIdApplicationDrawer.tsx
"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { X, CheckCircle, FileText, ShieldCheck, RefreshCw, AlertCircle, AlertTriangle, FileDigit } from 'lucide-react';
import { FileUpload } from "@/components/FileUpload"; // Imported FileUpload

export default function TaxIdApplicationDrawer({ 
  ticket, 
  onClose, 
  onUpdateSuccess 
}: { 
  ticket: any | null, 
  onClose: () => void,
  onUpdateSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState("INFO");
  const [actionType, setActionType] = useState<"PROCESS" | "COMPLETE" | "FAIL" | "">("");
  
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [taxIdImageUrl, setTaxIdImageUrl] = useState(""); // NEW: State for image upload
  const [failureReason, setFailureReason] = useState("");
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | string>(ticket?.amountPaid || 0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!ticket) return null;

  const isCorporate = ticket.type === "CORPORATE";
  const statusColor = 
    ticket.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    ticket.status === "PROCESSING" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");
    try {
      if (actionType === "COMPLETE" && !taxIdNumber.trim()) {
        throw new Error("You must input the generated Tax ID number to mark as completed.");
      }
      if (actionType === "COMPLETE" && !taxIdImageUrl) {
        throw new Error("You must upload the Tax ID screenshot to mark as completed.");
      }
      if (actionType === "FAIL" && !failureReason.trim()) {
        throw new Error("You must provide a reason for failing this application.");
      }
      if (actionType === "FAIL" && issueRefund && (!refundAmount || Number(refundAmount) <= 0)) {
        throw new Error("Please enter a valid refund amount.");
      }

      const response = await fetch("/api/mds/pipeline/tax-id/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: actionType,
          taxIdNumber: taxIdNumber,
          taxIdImageUrl: taxIdImageUrl, // Sent to backend
          failureReason: failureReason,
          issueRefund: issueRefund,
          refundAmount: issueRefund ? Number(refundAmount) : 0
        })
      });

      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || "Action failed");
      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      <div className="relative w-full max-w-4xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                Ref: {ticket.transactionRef}
              </span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {isCorporate ? ticket.cacNumber : `${ticket.firstName} ${ticket.lastName}`}
            </h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          <TabButton active={activeTab === "INFO"} onClick={() => setActiveTab("INFO")} label="Submitted Data" icon={<FileText size={16} />} />
          <TabButton active={activeTab === "ACTION"} onClick={() => setActiveTab("ACTION")} label="Admin Action Hub" icon={<CheckCircle size={16} />} alert={ticket.status === "PENDING"} />
        </div>

        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {activeTab === "INFO" && (
             <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-3">Application Details</h3>
                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">Request Type</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">{isCorporate ? "Corporate Entity" : "Individual"}</p>
                    </div>
                    {isCorporate ? (
                      <>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase">CAC / RC Number</p>
                          <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 mt-1">{ticket.cacNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase">Corporate Category</p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">{ticket.corporateCategory?.replace('_', ' ')}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase">NIN (National Identity No.)</p>
                          <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 mt-1">{ticket.nin}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase">Date of Birth</p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">{ticket.dob}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-500 uppercase">Legal Name</p>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mt-1">{ticket.firstName} {ticket.lastName}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
             </div>
          )}

          {activeTab === "ACTION" && (
            <div className="max-w-2xl mx-auto space-y-8 pb-20">
              {ticket.status === "COMPLETED" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
                  <ShieldCheck size={48} className="text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Application Completed</h3>
                  <p className="text-zinc-500 text-sm mt-2 mb-6">The Tax ID has been generated and issued.</p>
                  <div className="inline-flex items-center justify-center gap-3 px-6 py-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-xl font-bold rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                    <FileDigit size={24} /> {ticket.taxIdNumber}
                  </div>
                </div>
              )}

              {ticket.status === "FAILED" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Application Failed</h3>
                  </div>
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Failure Reason Provided:</p>
                  <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-900 dark:text-rose-200 text-sm font-medium border border-rose-100 dark:border-rose-500/20">
                    {ticket.failureReason}
                  </div>
                </div>
              )}

              {ticket.status !== "COMPLETED" && ticket.status !== "FAILED" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <button onClick={() => setActionType("PROCESS")} className={`p-5 rounded-2xl border-2 transition-all font-bold flex flex-col items-center justify-center ${actionType === "PROCESS" ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>Process</button>
                    <button onClick={() => setActionType("COMPLETE")} className={`p-5 rounded-2xl border-2 transition-all font-bold flex flex-col items-center justify-center ${actionType === "COMPLETE" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>Complete</button>
                    <button onClick={() => setActionType("FAIL")} className={`p-5 rounded-2xl border-2 transition-all font-bold flex flex-col items-center justify-center ${actionType === "FAIL" ? "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"}`}>Fail & Reject</button>
                  </div>

                  {actionType === "COMPLETE" && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200 space-y-6">
                      <div>
                        <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Generated Tax ID (TIN) *</label>
                        <input 
                          type="text" 
                          value={taxIdNumber}
                          onChange={(e) => setTaxIdNumber(e.target.value)}
                          placeholder="Enter the official TIN..."
                          className="w-full mt-2 h-12 px-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-base font-bold text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      
                      {/* ADDED FILE UPLOAD HERE */}
                      <div>
                        <FileUpload
                          label="Tax ID Screenshot *"
                          description="Upload the generated TIN image from NRS"
                          value={taxIdImageUrl}
                          onUploadSuccess={setTaxIdImageUrl}
                          onRemove={() => setTaxIdImageUrl("")}
                          accept="image/jpeg, image/png, image/webp"
                        />
                      </div>
                    </div>
                  )}

                  {actionType === "FAIL" && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl animate-in fade-in zoom-in-95 duration-200 space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Reason for Failure *</label>
                        <textarea 
                          value={failureReason}
                          onChange={(e) => setFailureReason(e.target.value)}
                          placeholder="Explain why this request was rejected."
                          rows={4}
                          className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={issueRefund} 
                            onChange={(e) => setIssueRefund(e.target.checked)}
                            className="w-5 h-5 rounded border-zinc-300 text-rose-600 focus:ring-rose-500 bg-white dark:bg-zinc-900"
                          />
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">Issue Wallet Refund</span>
                        </label>
                        
                        {issueRefund && (
                          <div className="pl-8 animate-in slide-in-from-top-2">
                            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Refund Amount (₦)</label>
                            <input 
                              type="number" 
                              value={refundAmount} 
                              onChange={(e) => setRefundAmount(e.target.value)}
                              className="w-full h-10 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm font-bold text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {error && <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

                  {actionType && (
                    <button 
                      onClick={handleActionSubmit} disabled={isProcessing}
                      className="w-full h-14 rounded-xl font-black text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                    >
                      {isProcessing ? <RefreshCw className="animate-spin" /> : "Execute Confirmation"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick, icon, alert = false }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
        active 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      }`}
    >
      {icon} {label}
      {alert && !active && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
    </button>
  );
}
