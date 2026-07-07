"use client";

import { useState } from 'react';
import { X, FileText, CheckCircle2, RefreshCw, Clock, XCircle, UserMinus, AlertCircle, Building, Users } from 'lucide-react';

export function StatusPill({ status }: { status: string }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700"><CheckCircle2 size={12} className="mr-1" /> Approved</span>;
  if (status === 'PENDING') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700"><Clock size={12} className="mr-1" /> Pending</span>;
  if (status === 'QUERIED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700"><AlertCircle size={12} className="mr-1" /> Queried</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700"><XCircle size={12} className="mr-1" /> Failed</span>;
  return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700">{status}</span>;
}

export default function ApplicationDrawer({ ticket, onClose, onUpdateSuccess }: { ticket: any, onClose: () => void, onUpdateSuccess: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("INFO"); // INFO, ACTION
  const [overrideAction, setOverrideAction] = useState(""); // APPROVE, QUERY, FAIL, UNASSIGN
  
  // Form State
  const [reason, setReason] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [statusUrl, setStatusUrl] = useState("");
  const [memoUrl, setMemoUrl] = useState(""); // LLC only
  const [error, setError] = useState("");

  if (!ticket) return null;

  const handleActionSubmit = async () => {
    if (!overrideAction) return;

    // Validate Approval Deliverables
    if (overrideAction === "APPROVE") {
      if (!regNumber || !taxId || !certUrl || !statusUrl) {
        setError("Please provide all required registration numbers and document links.");
        return;
      }
      if (ticket.type === "LLC" && !memoUrl) {
        setError("LLC Approval requires a Memorandum of Association document link.");
        return;
      }
    } else if (overrideAction === "FAIL" || overrideAction === "QUERY") {
      if (!reason.trim() || reason.length < 5) {
        setError("Please provide a valid reason for the client and audit log.");
        return;
      }
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/mds/pipeline/cac/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ticketId: ticket.id, 
          ticketType: ticket.type,
          actionType: overrideAction, 
          reason,
          registrationNumber: regNumber,
          taxId,
          certificateUrl: certUrl,
          statusReportUrl: statusUrl,
          memorandumUrl: memoUrl
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process action");
      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
              <FileText size={20} className="mr-2 text-indigo-500" />
              Application Dashboard
            </h3>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
          </div>
          
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{ticket.displayType}</span>
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{ticket.proposedName}</h4>
              <p className="text-xs text-zinc-500 mt-1 font-mono">TRK: {ticket.trackingId}</p>
            </div>
            <StatusPill status={ticket.status} />
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex gap-4 mt-6 border-b border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setActiveTab("INFO")} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "INFO" ? "border-indigo-500 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>Data View</button>
            <button onClick={() => setActiveTab("ACTION")} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "ACTION" ? "border-indigo-500 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>Take Action</button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* TAB 1: DATA VIEW */}
          {activeTab === "INFO" && (
            <div className="space-y-8 animate-in fade-in">
              
              {/* Business Info */}
              <section>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center mb-4"><Building size={16} className="mr-2 text-zinc-400" /> Business Details</h4>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-3 text-sm border border-zinc-100 dark:border-zinc-800">
                  <DetailRow label="Primary Name" value={ticket.proposedName} />
                  <DetailRow label="Alternative 1" value={ticket.altName1 || "N/A"} />
                  <DetailRow label="Alternative 2" value={ticket.altName2 || "N/A"} />
                  <DetailRow label="Nature of Biz" value={ticket.natureOfBusiness} />
                  <DetailRow label="Address" value={ticket.address || "See specific address logic"} />
                </div>
              </section>

              {/* People Info */}
              <section>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center mb-4"><Users size={16} className="mr-2 text-zinc-400" /> Stakeholders ({ticket.people?.length || 0})</h4>
                <div className="space-y-3">
                  {ticket.people?.map((person: any, idx: number) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm mb-2">{person.firstName} {person.surname}</p>
                      <div className="space-y-1 text-xs">
                        <DetailRow label="Email" value={person.email || "N/A"} />
                        <DetailRow label="Phone" value={person.phone} />
                        {/* ID Documents Link logic would go here */}
                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
                          <button className="text-indigo-600 font-medium hover:underline">View ID Card</button>
                          <button className="text-indigo-600 font-medium hover:underline">View Signature</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: TAKE ACTION */}
          {activeTab === "ACTION" && (
            <div className="space-y-6 animate-in fade-in">
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <ActionButton active={overrideAction === "APPROVE"} onClick={() => setOverrideAction("APPROVE")} color="emerald" label="Approve" />
                <ActionButton active={overrideAction === "QUERY"} onClick={() => setOverrideAction("QUERY")} color="indigo" label="Query" />
                <ActionButton active={overrideAction === "FAIL"} onClick={() => setOverrideAction("FAIL")} color="red" label="Fail" />
                <ActionButton active={overrideAction === "UNASSIGN"} onClick={() => setOverrideAction("UNASSIGN")} color="amber" label="Unassign" disabled={!ticket.assignedStaff} />
              </div>

              {/* DYNAMIC FORMS BASED ON ACTION */}
              {overrideAction === "APPROVE" && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Upload Approval Deliverables</h4>
                  <div className="space-y-3">
                    <Input label={ticket.type === "LLC" ? "RC Number" : "BN Number"} value={regNumber} onChange={setRegNumber} placeholder="e.g. RC 1234567" />
                    <Input label="TIN / Tax ID" value={taxId} onChange={setTaxId} placeholder="e.g. 23456789-0001" />
                    <Input label="Certificate of Incorporation (URL)" value={certUrl} onChange={setCertUrl} placeholder="Paste document link..." />
                    <Input label="Status Report (URL)" value={statusUrl} onChange={setStatusUrl} placeholder="Paste document link..." />
                    {ticket.type === "LLC" && (
                      <Input label="Memorandum of Association (URL)" value={memoUrl} onChange={setMemoUrl} placeholder="Paste document link..." />
                    )}
                  </div>
                </div>
              )}

              {(overrideAction === "QUERY" || overrideAction === "FAIL" || overrideAction === "UNASSIGN") && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Reason (Required)</label>
                  <textarea 
                    rows={4}
                    placeholder={`Provide a clear reason for ${overrideAction.toLowerCase()}ing this application...`}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              )}

              {/* Submit Button Area */}
              {overrideAction && (
                <div className="pt-4">
                  {error && <p className="text-xs text-red-600 font-medium mb-3">{error}</p>}
                  <button 
                    onClick={handleActionSubmit}
                    disabled={isProcessing}
                    className={`w-full py-3 rounded-lg flex justify-center items-center text-sm font-bold text-white shadow-sm transition-colors disabled:opacity-50 ${
                      overrideAction === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" :
                      overrideAction === "FAIL" ? "bg-red-600 hover:bg-red-700" :
                      overrideAction === "QUERY" ? "bg-indigo-600 hover:bg-indigo-700" :
                      "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : `Confirm ${overrideAction}`}
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Helpers
function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">{label}</span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 text-right">{value}</span>
    </div>
  );
}

function ActionButton({ active, onClick, color, label, disabled = false }: any) {
  const baseClasses = "py-2.5 text-xs font-bold uppercase rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  let colorClasses = "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
  
  if (active) {
    if (color === "emerald") colorClasses = "bg-emerald-500 text-white border-emerald-600";
    if (color === "indigo") colorClasses = "bg-indigo-500 text-white border-indigo-600";
    if (color === "red") colorClasses = "bg-red-500 text-white border-red-600";
    if (color === "amber") colorClasses = "bg-amber-500 text-white border-amber-600";
  } else if (!disabled) {
    if (color === "emerald") colorClasses += " hover:border-emerald-500";
    if (color === "indigo") colorClasses += " hover:border-indigo-500";
    if (color === "red") colorClasses += " hover:border-red-500";
    if (color === "amber") colorClasses += " hover:border-amber-500";
  }

  return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${colorClasses}`}>{label}</button>;
}

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-500 mb-1 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
    </div>
  );
}
