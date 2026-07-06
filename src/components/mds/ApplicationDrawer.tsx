"use client";

import { useState } from 'react';
import { X, FileText, AlertOctagon, CheckCircle2, RefreshCw, Clock, XCircle, ShieldAlert, UserMinus } from 'lucide-react';

export function StatusPill({ status }: { status: string }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={12} className="mr-1" /> Approved</span>;
  if (status === 'PENDING') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><Clock size={12} className="mr-1" /> Pending</span>;
  if (status === 'QUERIED') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"><AlertOctagon size={12} className="mr-1" /> Queried</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"><XCircle size={12} className="mr-1" /> Failed</span>;
  return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">{status}</span>;
}

export default function ApplicationDrawer({ ticket, onClose, onUpdateSuccess }: { ticket: any, onClose: () => void, onUpdateSuccess: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [overrideAction, setOverrideAction] = useState(""); // APPROVE, QUERY, FAIL, UNASSIGN
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  if (!ticket) return null;

  const handleOverride = async () => {
    if (!overrideAction) return;
    if (!reason.trim() || reason.length < 5) {
      setError("Please provide a valid reason for the audit log.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/mds/pipeline/cac/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ticketId: ticket.id, 
          ticketType: ticket.type, // "BUSINESS_NAME" or "LLC"
          actionType: overrideAction, 
          reason 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute override");
      
      onUpdateSuccess(); // Refreshes the pipeline table and closes drawer
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
        
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
            <FileText size={20} className="mr-2 text-indigo-500" />
            Application Inspection
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-6 flex-1">
          {/* Header Summary */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{ticket.displayType}</span>
              <StatusPill status={ticket.status} />
            </div>
            <h4 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight mb-2">{ticket.proposedName}</h4>
            <span className="font-mono text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">
              TRK: {ticket.trackingId}
            </span>
          </div>

          {/* Client & Staff Info */}
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
              <span className="text-sm font-medium text-zinc-500">Client Name</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ticket.clientName}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
              <span className="text-sm font-medium text-zinc-500">Client Email</span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ticket.clientEmail}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-zinc-100 dark:border-zinc-800/50">
              <span className="text-sm font-medium text-zinc-500">Staff Assigned</span>
              {ticket.assignedStaff ? (
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{ticket.assignedStaff}</span>
              ) : (
                <span className="text-sm font-medium text-amber-600 dark:text-amber-500">Unassigned Pool</span>
              )}
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Executive Override Zone */}
          <div className="p-5 border-2 border-dashed border-red-200 dark:border-red-500/30 rounded-xl bg-red-50/50 dark:bg-red-500/5">
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400 flex items-center mb-1">
              <ShieldAlert size={16} className="mr-1.5" /> Executive Override
            </h4>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mb-4">Warning: This bypasses standard staff workflows. Actions are permanently audited.</p>
            
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button 
                onClick={() => setOverrideAction(overrideAction === "APPROVE" ? "" : "APPROVE")}
                className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${overrideAction === "APPROVE" ? "bg-emerald-500 text-white border-emerald-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-emerald-500"}`}
              >
                Force Approve
              </button>
              <button 
                onClick={() => setOverrideAction(overrideAction === "FAIL" ? "" : "FAIL")}
                className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${overrideAction === "FAIL" ? "bg-red-500 text-white border-red-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-red-500"}`}
              >
                Force Fail
              </button>
              <button 
                onClick={() => setOverrideAction(overrideAction === "QUERY" ? "" : "QUERY")}
                className={`py-2 text-xs font-bold uppercase rounded-lg border transition-all ${overrideAction === "QUERY" ? "bg-indigo-500 text-white border-indigo-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-500"}`}
              >
                Query Client
              </button>
              <button 
                onClick={() => setOverrideAction(overrideAction === "UNASSIGN" ? "" : "UNASSIGN")}
                disabled={!ticket.assignedStaff}
                className={`flex justify-center items-center py-2 text-xs font-bold uppercase rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${overrideAction === "UNASSIGN" ? "bg-amber-500 text-white border-amber-600" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-amber-500"}`}
              >
                <UserMinus size={14} className="mr-1" /> Unassign
              </button>
            </div>

            {overrideAction && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder={`Reason for ${overrideAction} (Required)`} 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" 
                />
                {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
                <button 
                  onClick={handleOverride}
                  disabled={isProcessing}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex justify-center items-center text-sm font-bold shadow-sm disabled:opacity-70 transition-colors"
                >
                  {isProcessing ? <RefreshCw size={16} className="animate-spin" /> : `Execute ${overrideAction}`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
