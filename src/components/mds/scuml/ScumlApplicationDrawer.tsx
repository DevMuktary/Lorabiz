"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { X, CheckCircle, FileText, Download, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { DocumentPreview } from '../cac/CacShared';
import { FileUpload } from '@/components/FileUpload';

export default function ScumlApplicationDrawer({ 
  ticket, 
  onClose, 
  onUpdateSuccess 
}: { 
  ticket: any | null, 
  onClose: () => void,
  onUpdateSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState("DOCS");
  const [actionType, setActionType] = useState<"PROCESS" | "COMPLETE" | "">("");
  const [finalCertificateUrl, setFinalCertificateUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!ticket) return null;

  const statusColor = 
    ticket.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "PROCESSING" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");
    try {
      if (actionType === "COMPLETE" && !finalCertificateUrl) {
        throw new Error("You must upload the Final SCUML Certificate to mark as completed.");
      }

      // We will build this API route next
      const response = await fetch("/api/mds/pipeline/scuml/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: actionType,
          finalCertificateUrl: finalCertificateUrl
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
        
        {/* Header Ribbon */}
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
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{ticket.companyName}</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
          </div>
          
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          <TabButton active={activeTab === "DOCS"} onClick={() => setActiveTab("DOCS")} label="Client Documents" icon={<FileText size={16} />} />
          <TabButton active={activeTab === "ACTION"} onClick={() => setActiveTab("ACTION")} label="Admin Action Hub" icon={<CheckCircle size={16} />} alert={ticket.status === "PENDING"} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {activeTab === "DOCS" && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
               <DocumentPreview label="CAC Certificate" url={ticket.certificateUrl} downloadName={`CAC_Cert_${ticket.companyName}`} />
               <DocumentPreview label="Status Report" url={ticket.statusReportUrl} downloadName={`Status_Report_${ticket.companyName}`} />
               {ticket.memorandumUrl && <DocumentPreview label="Memorandum of Association" url={ticket.memorandumUrl} downloadName={`MEMART_${ticket.companyName}`} />}
               {ticket.constitutionUrl && <DocumentPreview label="NGO Constitution" url={ticket.constitutionUrl} downloadName={`Constitution_${ticket.companyName}`} />}
             </div>
          )}

          {activeTab === "ACTION" && (
            <div className="max-w-2xl mx-auto space-y-8 pb-20">
              
              {ticket.status === "COMPLETED" ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center">
                  <ShieldCheck size={48} className="text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Application Completed</h3>
                  <p className="text-zinc-500 text-sm mt-2 mb-6">The SCUML certificate was generated and sent to the client.</p>
                  {ticket.finalCertificateUrl && (
                    <a href={ticket.finalCertificateUrl} target="_blank" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors">
                      <Download size={18} /> View Final Certificate
                    </a>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setActionType("PROCESS")}
                      className={`p-5 rounded-2xl border-2 transition-all font-bold flex flex-col items-center justify-center ${actionType === "PROCESS" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 bg-white text-zinc-500"}`}
                    >
                      Move to Processing
                    </button>
                    <button 
                      onClick={() => setActionType("COMPLETE")}
                      className={`p-5 rounded-2xl border-2 transition-all font-bold flex flex-col items-center justify-center ${actionType === "COMPLETE" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-white text-zinc-500"}`}
                    >
                      Mark as Completed
                    </button>
                  </div>

                  {actionType === "COMPLETE" && (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                      <FileUpload 
                        label="Upload Approved SCUML Certificate *" 
                        description="PDF format required. This will be emailed to the client." 
                        accept="application/pdf" 
                        value={finalCertificateUrl} 
                        onUploadSuccess={setFinalCertificateUrl} 
                        onRemove={() => setFinalCertificateUrl(null)} 
                      />
                    </div>
                  )}

                  {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle size={16} /> {error}</div>}

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
        active ? "border-indigo-500 text-indigo-600 bg-indigo-50/50" : "border-transparent text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
      }`}
    >
      {icon} {label}
      {alert && !active && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
    </button>
  );
}
