"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, UserPlus, ShieldAlert, RefreshCw } from "lucide-react";
import { FileUpload } from "@/components/FileUpload";

export default function CacActionTab({ 
  ticket, 
  staffList, 
  onUpdateSuccess 
}: { 
  ticket: any, 
  staffList: any[], 
  onUpdateSuccess: () => void 
}) {
  const isLlc = ticket.type === "LLC";

  const [actionType, setActionType] = useState<"APPROVE" | "QUERY" | "ASSIGN" | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // Document States
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [statusReportUrl, setStatusReportUrl] = useState<string | null>(null);
  const [memorandumUrl, setMemorandumUrl] = useState<string | null>(null);
  
  // Text Input States
  const [rcNumber, setRcNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [queryReason, setQueryReason] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      if (actionType === "APPROVE") {
        if (!rcNumber.trim()) throw new Error(`Please provide the approved ${isLlc ? 'RC' : 'BN'} Number.`);
        if (!taxId.trim()) throw new Error("Please provide the Tax ID (TIN).");
        if (!certificateUrl) throw new Error("The final CAC Certificate is required.");
        if (!statusReportUrl) throw new Error("The Status Report is required.");
        if (isLlc && !memorandumUrl) throw new Error("The Memorandum of Association is required for LLC formations.");
      }

      if (actionType === "QUERY" && !queryReason.trim()) {
        throw new Error("You must provide a clear reason for the query.");
      }

      if (actionType === "ASSIGN" && !selectedStaff) {
        throw new Error("Please select a staff member to assign.");
      }

      const payload = {
        action: actionType,
        ticketId: ticket.id,
        ticketType: ticket.type,
        rcNumber,
        taxId,
        certificateUrl,
        statusReportUrl,
        memorandumUrl: isLlc ? memorandumUrl : undefined,
        queryReason,
        assignedTo: selectedStaff
      };

      const response = await fetch("/api/mds/pipeline/cac/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || result.error || "Server rejected the request. Please verify the provided data.");
      }

      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      
      <div className="bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-r-2xl shadow-sm">
        <p className="text-base font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
          <ShieldAlert size={18} /> Critical Operation Zone
        </p>
        <p className="text-sm font-medium text-amber-700/80 dark:text-amber-500/80 mt-1">
          Actions taken here will trigger automated emails to the client and permanently alter the application state.
        </p>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Select Resolution Path</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionToggle 
            active={actionType === "APPROVE"} 
            onClick={() => setActionType("APPROVE")} 
            label="Approve & Fulfill" 
            icon={<CheckCircle size={20} />} 
            color="emerald" 
          />
          <ActionToggle 
            active={actionType === "QUERY"} 
            onClick={() => setActionType("QUERY")} 
            label="Raise CAC Query" 
            icon={<AlertCircle size={20} />} 
            color="rose" 
          />
          <ActionToggle 
            active={actionType === "ASSIGN"} 
            onClick={() => setActionType("ASSIGN")} 
            label="Assign to Staff" 
            icon={<UserPlus size={20} />} 
            color="indigo" 
          />
        </div>
      </div>

      {/* Dynamic Action Forms */}
      {actionType && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
          
          {actionType === "APPROVE" && (
            <div className="space-y-8">
              <h3 className="font-bold text-xl text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-500/20 pb-4">
                Fulfill {isLlc ? "LLC" : "Business Name"} Registration
              </h3>
              
              {/* Manual Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                    Approved {isLlc ? 'RC' : 'BN'} Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={rcNumber}
                    onChange={(e) => setRcNumber(e.target.value)}
                    placeholder={isLlc ? "RC-1234567" : "BN-1234567"}
                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-600 dark:text-zinc-400">
                    Company Tax ID (TIN) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Enter assigned TIN"
                    className="w-full h-12 px-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-sm font-bold text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <hr className="border-zinc-100 dark:border-zinc-800" />

              {/* Document Uploads */}
              <div className="space-y-6">
                <FileUpload 
                  label="Upload Final CAC Certificate *"
                  description="PDF format required."
                  accept="application/pdf"
                  value={certificateUrl}
                  onUploadSuccess={(url) => setCertificateUrl(url)}
                  onRemove={() => setCertificateUrl(null)}
                />

                <FileUpload 
                  label="Upload Status Report *"
                  description="PDF format required."
                  accept="application/pdf"
                  value={statusReportUrl}
                  onUploadSuccess={(url) => setStatusReportUrl(url)}
                  onRemove={() => setStatusReportUrl(null)}
                />

                {isLlc && (
                  <FileUpload 
                    label="Upload Memorandum of Association *"
                    description="PDF format required for LLC formations."
                    accept="application/pdf"
                    value={memorandumUrl}
                    onUploadSuccess={(url) => setMemorandumUrl(url)}
                    onRemove={() => setMemorandumUrl(null)}
                  />
                )}
              </div>
            </div>
          )}

          {actionType === "QUERY" && (
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-rose-700 dark:text-rose-400 border-b border-rose-100 dark:border-rose-500/20 pb-4 mb-4">Query Details</h3>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">Exact reason from CAC Portal:</label>
              <textarea 
                value={queryReason}
                onChange={(e) => setQueryReason(e.target.value)}
                placeholder="E.g., Proposed name is too similar to an existing entity. Please provide an alternative."
                rows={5}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm"
              />
            </div>
          )}

          {actionType === "ASSIGN" && (
            <div className="space-y-4">
              <h3 className="font-bold text-xl text-indigo-700 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-500/20 pb-4 mb-4">Staff Assignment</h3>
              <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300">Select Processor:</label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm font-medium cursor-pointer"
              >
                <option value="">-- Choose Staff Member --</option>
                {staffList.map((staff: any) => (
                  <option key={staff.id} value={staff.id}>{staff.firstName} {staff.lastName} ({staff.email})</option>
                ))}
              </select>
            </div>
          )}

          {error && <div className="mt-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

          <button 
            onClick={handleActionSubmit}
            disabled={isProcessing}
            className="w-full mt-8 flex items-center justify-center gap-2 h-14 rounded-xl font-black text-white bg-zinc-900 dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="animate-spin" /> : "Execute Confirmation"}
          </button>
        </div>
      )}
    </div>
  );
}

// Local UI Helper
function ActionToggle({ active, onClick, label, icon, color }: any) {
  const colorMap: any = {
    emerald: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    indigo: "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
  };
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all cursor-pointer ${
        active ? colorMap[color] : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}