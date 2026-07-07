"use client";

import { useState } from 'react';
import { X, FileText, CheckCircle2, RefreshCw, Clock, XCircle, UserMinus, AlertCircle, Building, Users, UploadCloud, Link as LinkIcon, DollarSign } from 'lucide-react';

export function StatusPill({ status }: { status: string }) {
  if (status === 'APPROVED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700"><CheckCircle2 size={12} className="mr-1" /> Approved</span>;
  if (status === 'PENDING') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700"><Clock size={12} className="mr-1" /> Pending</span>;
  if (status === 'QUERIED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700"><AlertCircle size={12} className="mr-1" /> Queried</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700"><XCircle size={12} className="mr-1" /> Failed</span>;
  return <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-zinc-100 text-zinc-700">{status}</span>;
}

// Helper to upload files to Cloudinary directly from browser
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'quadrox_preset'); // Update with your actual preset

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload file to Cloudinary");
  const data = await res.json();
  return data.secure_url;
};

export default function ApplicationDrawer({ ticket, onClose, onUpdateSuccess }: { ticket: any, onClose: () => void, onUpdateSuccess: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("INFO"); // INFO, ACTION
  const [overrideAction, setOverrideAction] = useState(""); 
  
  // Action State
  const [reason, setReason] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  
  // File State
  const [certFile, setCertFile] = useState<File | null>(null);
  const [statusFile, setStatusFile] = useState<File | null>(null);
  const [memoFile, setMemoFile] = useState<File | null>(null);

  // Refund State (For Fail Action)
  const [issueRefund, setIssueRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");

  const [error, setError] = useState("");

  if (!ticket) return null;

  const handleActionSubmit = async () => {
    if (!overrideAction) return;

    let certUrl = "";
    let statusUrl = "";
    let memoUrl = "";

    if (overrideAction === "APPROVE") {
      if (!regNumber || !taxId || !certFile || !statusFile) {
        setError("BN/RC Number, TIN, Certificate, and Status Report are required.");
        return;
      }
      if (ticket.type === "LLC" && !memoFile) {
        setError("LLC Approval requires a Memorandum of Association.");
        return;
      }
    } else if (overrideAction === "FAIL" || overrideAction === "QUERY") {
      if (!reason.trim() || reason.length < 5) {
        setError("Please provide a valid reason for the audit log.");
        return;
      }
      if (overrideAction === "FAIL" && issueRefund && (!refundAmount || Number(refundAmount) <= 0)) {
        setError("Please enter a valid refund amount.");
        return;
      }
    }

    setIsProcessing(true);
    setError("");

    try {
      // 1. Upload files to Cloudinary if approving
      if (overrideAction === "APPROVE") {
        certUrl = await uploadToCloudinary(certFile as File);
        statusUrl = await uploadToCloudinary(statusFile as File);
        if (ticket.type === "LLC") {
          memoUrl = await uploadToCloudinary(memoFile as File);
        }
      }

      // 2. Submit to API
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
          memorandumUrl: memoUrl,
          issueRefund: overrideAction === "FAIL" ? issueRefund : false,
          refundAmount: issueRefund ? Number(refundAmount) : 0
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

  // Helper to render JSON cleanly
  const renderJsonField = (json: any) => {
    if (!json) return "N/A";
    if (typeof json === 'string') return json;
    return (
      <ul className="list-disc pl-4 mt-1 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
        {Object.entries(json).map(([key, val]) => (
          <li key={key}><strong className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {String(val)}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
              <FileText size={20} className="mr-2 text-indigo-500" /> Application Dashboard
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

          <div className="flex gap-4 mt-6 border-b border-zinc-200 dark:border-zinc-800">
            <button onClick={() => setActiveTab("INFO")} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "INFO" ? "border-indigo-500 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>Data View</button>
            <button onClick={() => setActiveTab("ACTION")} className={`pb-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "ACTION" ? "border-indigo-500 text-indigo-600" : "border-transparent text-zinc-500 hover:text-zinc-900"}`}>Take Action</button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          
          {/* ===================== DATA VIEW ===================== */}
          {activeTab === "INFO" && (
            <div className="space-y-8 animate-in fade-in">
              
              {/* Business Data */}
              <section>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center mb-4"><Building size={16} className="mr-2 text-zinc-400" /> Complete Business Details</h4>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 space-y-4 text-sm border border-zinc-100 dark:border-zinc-800">
                  <DetailRow label="Primary Name" value={ticket.proposedName} />
                  <DetailRow label="Alternative 1" value={ticket.altName1 || "N/A"} />
                  <DetailRow label="Alternative 2" value={ticket.altName2 || "N/A"} />
                  <DetailRow label="Entity Type" value={ticket.entityType || ticket.companyType || "N/A"} />
                  <DetailRow label="Category" value={ticket.category || "N/A"} />
                  <DetailRow label="Specific Nature / Activity" value={ticket.specificNature || ticket.principalActivity || "N/A"} />
                  <DetailRow label="Ownership Type" value={ticket.ownershipType || "N/A"} />
                  
                  {ticket.type === "LLC" && (
                    <>
                      <DetailRow label="Share Capital" value={`₦${ticket.totalShareCapital?.toLocaleString() || "0"}`} />
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-xs font-medium text-zinc-500 block mb-1">Registered Address</span>
                        {renderJsonField(ticket.registeredAddress)}
                      </div>
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                        <span className="text-xs font-medium text-zinc-500 block mb-1">Head Office Address</span>
                        {renderJsonField(ticket.headOfficeAddress)}
                      </div>
                    </>
                  )}
                  {ticket.type === "BUSINESS_NAME" && (
                    <DetailRow label="Company Address" value={`${ticket.companyStreetNo || ''} ${ticket.companyAddress || ''}, ${ticket.companyCity || ''}, ${ticket.companyState || ''}`} />
                  )}
                </div>
              </section>

              {/* Stakeholder Data */}
              <section>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center mb-4"><Users size={16} className="mr-2 text-zinc-400" /> Stakeholders ({ticket.people?.length || 0})</h4>
                <div className="space-y-4">
                  {ticket.people?.map((person: any, idx: number) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{person.firstName} {person.otherName || ''} {person.surname}</p>
                        {person.roles && <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded uppercase">{person.roles.join(", ")}</span>}
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <DetailRow label="Email" value={person.email || "N/A"} />
                        <DetailRow label="Phone" value={person.phone} />
                        <DetailRow label="Gender/DOB" value={`${person.gender} | ${person.dob}`} />
                        {person.sharesAllotted && <DetailRow label="Shares Allotted" value={person.sharesAllotted.toLocaleString()} />}
                        
                        {/* Address handling for both types */}
                        <div className="mt-2 text-zinc-600 dark:text-zinc-400">
                          <strong>Address: </strong> 
                          {person.serviceAddress && typeof person.serviceAddress === 'string' ? person.serviceAddress : renderJsonField(person.residentialAddress || person.serviceAddress)}
                        </div>

                        {/* Uploaded Documents */}
                        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700 flex flex-wrap gap-3">
                          <DocLink label="ID Card" url={person.ninUrl || person.idDocumentUrl || person.passportUrl} />
                          <DocLink label="Signature" url={person.signatureUrl} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* ===================== ACTION VIEW ===================== */}
          {activeTab === "ACTION" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                <ActionButton active={overrideAction === "APPROVE"} onClick={() => setOverrideAction("APPROVE")} color="emerald" label="Approve" />
                <ActionButton active={overrideAction === "QUERY"} onClick={() => setOverrideAction("QUERY")} color="indigo" label="Query" />
                <ActionButton active={overrideAction === "FAIL"} onClick={() => setOverrideAction("FAIL")} color="red" label="Fail" />
                <ActionButton active={overrideAction === "UNASSIGN"} onClick={() => setOverrideAction("UNASSIGN")} color="amber" label="Unassign" disabled={!ticket.assignedStaff} />
              </div>

              {/* APPROVE FORM (File Uploads) */}
              {overrideAction === "APPROVE" && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Final Deliverables (CAC)</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-500 mb-1 block">{ticket.type === "LLC" ? "RC Number" : "BN Number"}</label>
                      <input type="text" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="e.g. RC 1234567" className="w-full bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-500 mb-1 block">TIN / Tax ID</label>
                      <input type="text" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. 23456789-0001" className="w-full bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <FileInput label="Certificate of Incorporation (PDF)" file={certFile} onChange={setCertFile} />
                    <FileInput label="Status Report (PDF)" file={statusFile} onChange={setStatusFile} />
                    {ticket.type === "LLC" && (
                      <FileInput label="Memorandum of Association (PDF)" file={memoFile} onChange={setMemoFile} />
                    )}
                  </div>
                </div>
              )}

              {/* FAIL FORM (With Refund Option) */}
              {overrideAction === "FAIL" && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-zinc-500">Reason for Failure (Sent to client)</label>
                    <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Name was entirely rejected by CAC." className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 mt-1" />
                  </div>

                  {/* REFUND TOGGLE */}
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                    <label className="flex items-center cursor-pointer mb-3">
                      <input type="checkbox" checked={issueRefund} onChange={(e) => setIssueRefund(e.target.checked)} className="rounded border-red-300 text-red-600 focus:ring-red-500 w-4 h-4 mr-2 cursor-pointer" />
                      <span className="text-sm font-bold text-red-800 dark:text-red-400">Issue Refund to Client Wallet</span>
                    </label>
                    
                    {issueRefund && (
                      <div className="pl-6 animate-in fade-in">
                        <label className="text-xs font-bold uppercase text-red-800/70 dark:text-red-400/70 block mb-1">Refund Amount (₦)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" size={14} />
                          <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="e.g. 15000" className="w-full pl-8 pr-3 py-2 bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-md text-sm focus:ring-2 focus:ring-red-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QUERY OR UNASSIGN FORM */}
              {(overrideAction === "QUERY" || overrideAction === "UNASSIGN") && (
                <div className="space-y-3 animate-in slide-in-from-top-2">
                  <label className="text-xs font-bold uppercase text-zinc-500">Reason / Notes</label>
                  <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Provide audit reason..." className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}

              {/* Submit Button */}
              {overrideAction && (
                <div className="pt-4 mt-auto">
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
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4 border-b border-zinc-100 dark:border-zinc-800/50 pb-2 last:border-0 last:pb-0">
      <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">{label}</span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:text-right">{value}</span>
    </div>
  );
}

function DocLink({ label, url }: { label: string, url: string | null }) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-1 rounded hover:underline">
      <LinkIcon size={12} className="mr-1.5" /> {label}
    </a>
  );
}

function ActionButton({ active, onClick, color, label, disabled = false }: any) {
  const baseClasses = "py-2 text-xs font-bold uppercase rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  let colorClasses = "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700";
  
  if (active) {
    if (color === "emerald") colorClasses = "bg-emerald-500 text-white border-emerald-600";
    if (color === "indigo") colorClasses = "bg-indigo-500 text-white border-indigo-600";
    if (color === "red") colorClasses = "bg-red-500 text-white border-red-600";
    if (color === "amber") colorClasses = "bg-amber-500 text-white border-amber-600";
  } else if (!disabled) {
    if (color === "emerald") colorClasses += " hover:border-emerald-500 hover:text-emerald-600";
    if (color === "indigo") colorClasses += " hover:border-indigo-500 hover:text-indigo-600";
    if (color === "red") colorClasses += " hover:border-red-500 hover:text-red-600";
    if (color === "amber") colorClasses += " hover:border-amber-500 hover:text-amber-600";
  }
  return <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${colorClasses}`}>{label}</button>;
}

function FileInput({ label, file, onChange }: any) {
  return (
    <div className="bg-white dark:bg-zinc-950 border border-emerald-200 dark:border-emerald-500/30 rounded-md p-3 flex items-center justify-between">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-500">{label}</span>
        <span className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px]">{file ? file.name : "No file chosen"}</span>
      </div>
      <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg transition-colors">
        <UploadCloud size={16} />
        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => onChange(e.target.files?.[0] || null)} />
      </label>
    </div>
  );
}
