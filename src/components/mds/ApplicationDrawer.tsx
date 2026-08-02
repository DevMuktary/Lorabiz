"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  X, CheckCircle, AlertCircle, FileText, UserPlus, File, RefreshCw, Briefcase, Building2, MapPin
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';

export default function ApplicationDrawer({ 
  ticket, 
  staffList, 
  onClose, 
  onUpdateSuccess 
}: { 
  ticket: any | null, 
  staffList: any[],
  onClose: () => void,
  onUpdateSuccess: () => void
}) {
  const [activeTab, setActiveTab] = useState("INFO"); // INFO, PEOPLE, DOCS, ACTION
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // Action States
  const [actionType, setActionType] = useState<"APPROVE" | "QUERY" | "ASSIGN" | "">("");
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [statusReportUrl, setStatusReportUrl] = useState<string | null>(null);
  const [queryReason, setQueryReason] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  if (!ticket) return null;

  const isLlc = ticket.type === "LLC";
  const statusColor = 
    ticket.status === "APPROVED" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
    ticket.status === "QUERIED" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400" :
    ticket.status === "FAILED" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
    "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      if (actionType === "APPROVE") {
        if (!certificateUrl || !statusReportUrl) {
          throw new Error("Both Certificate and Status Report are required for approval.");
        }
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
        certificateUrl,
        statusReportUrl,
        queryReason,
        assignedTo: selectedStaff
      };

      const response = await fetch("/api/mds/pipeline/cac/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Failed to execute action.");

      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
      
      {/* DRAWER WIDENED to max-w-4xl for absolute clarity */}
      <div className="relative w-full max-w-4xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Ribbon */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">
                Ref: {ticket.trackingId}
              </span>
              {isLlc ? (
                <span className="flex items-center text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded">
                  <Building2 size={12} className="mr-1.5" /> LLC Formation
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
                  <Briefcase size={12} className="mr-1.5" /> Business Name
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{ticket.proposedName}</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
          </div>
          
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0 overflow-x-auto scrollbar-hide">
          <TabButton active={activeTab === "INFO"} onClick={() => setActiveTab("INFO")} label="Application Info" icon={<FileText size={16} />} />
          <TabButton active={activeTab === "PEOPLE"} onClick={() => setActiveTab("PEOPLE")} label={isLlc ? "Directors & Shareholders" : "Proprietors"} icon={<UserPlus size={16} />} />
          {/* FIXED: Using File instead of FilePdf */}
          <TabButton active={activeTab === "DOCS"} onClick={() => setActiveTab("DOCS")} label="Client Documents" icon={<File size={16} />} />
          <TabButton active={activeTab === "ACTION"} onClick={() => setActiveTab("ACTION")} label="Admin Action Hub" icon={<CheckCircle size={16} />} alert={ticket.status === "PENDING"} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 dark:bg-zinc-950/50">
          
          {/* TAB 1: Application Info */}
          {activeTab === "INFO" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Names Section */}
              <Section title="Proposed Names">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DataBlock label="Option 1 (Primary)" value={ticket.proposedName} highlight />
                  <DataBlock label="Option 2" value={ticket.altName1} />
                  <DataBlock label="Option 3" value={ticket.altName2} />
                </div>
              </Section>

              {/* Classification */}
              <Section title="Classification">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DataBlock label="Business Category" value={ticket.category} />
                  <DataBlock label="Specific Objective" value={ticket.specificObjective} />
                  {isLlc && (
                    <DataBlock label="Total Share Capital" value={`₦${Number(ticket.totalShareCapital).toLocaleString()}`} highlight />
                  )}
                </div>
              </Section>

              {/* Address */}
              <Section title="Principal Address">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{ticket.address}</p>
                      <p className="text-sm font-medium text-zinc-500 mt-1">{ticket.lga}, {ticket.state} State.</p>
                    </div>
                  </div>
                </div>
              </Section>
              
            </div>
          )}

          {/* TAB 2: People */}
          {activeTab === "PEOPLE" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {ticket.people?.map((person: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{person.firstName} {person.lastName}</h3>
                    <div className="flex gap-2">
                      {person.roles?.map((r: string) => (
                        <span key={r} className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-2 py-1 rounded">
                          {r}
                        </span>
                      ))}
                      {person.isPsc && (
                         <span className="text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 px-2 py-1 rounded">
                           PSC
                         </span>
                      )}
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DataBlock label="Email" value={person.email} />
                    <DataBlock label="Phone" value={person.phone} />
                    <DataBlock label="Gender" value={person.gender} />
                    <DataBlock label="Occupation" value={person.occupation} />
                    <DataBlock label="NIN" value={person.nin} highlight />
                    <DataBlock label="Identity Doc Type" value={person.identityType} />
                    {person.sharesAllotted > 0 && (
                      <DataBlock label="Shares Allotted" value={person.sharesAllotted.toLocaleString()} highlight />
                    )}
                    <div className="md:col-span-3">
                       <DataBlock label="Residential Address" value={`${person.address}, ${person.lga}, ${person.state}.`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Documents */}
          {activeTab === "DOCS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {ticket.people?.map((person: any, idx: number) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                    Documents: {person.firstName} {person.lastName}
                  </h3>
                  <DocumentPreview label="Identity Document (ID)" url={person.identityDocumentUrl} />
                  <DocumentPreview label="Passport Photograph" url={person.passportPhotoUrl} />
                  <DocumentPreview label="Signature" url={person.signatureUrl} />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Admin Action Hub */}
          {activeTab === "ACTION" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
              
              {/* Context Warning */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Critical Operation Zone</p>
                <p className="text-xs font-medium text-amber-700/80 dark:text-amber-500/80 mt-1">Actions taken here will trigger automated emails to the client and permanently alter the application state.</p>
              </div>

              {/* Action Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Select Resolution Path</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ActionToggle 
                    active={actionType === "APPROVE"} 
                    onClick={() => setActionType("APPROVE")} 
                    label="Approve & Fulfill" 
                    icon={<CheckCircle size={18} />} 
                    color="emerald" 
                  />
                  <ActionToggle 
                    active={actionType === "QUERY"} 
                    onClick={() => setActionType("QUERY")} 
                    label="Raise CAC Query" 
                    icon={<AlertCircle size={18} />} 
                    color="rose" 
                  />
                  <ActionToggle 
                    active={actionType === "ASSIGN"} 
                    onClick={() => setActionType("ASSIGN")} 
                    label="Assign to Staff" 
                    icon={<UserPlus size={18} />} 
                    color="indigo" 
                  />
                </div>
              </div>

              {/* Dynamic Action Forms */}
              {actionType && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-xl">
                  
                  {/* APPROVAL FORM - INTEGRATING THE LIVE FILE UPLOADER */}
                  {actionType === "APPROVE" && (
                    <div className="space-y-6">
                      <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-500/20 pb-3 mb-6">Fulfill Order</h3>
                      
                      <FileUpload 
                        label="Upload Final CAC Certificate"
                        description="PDF format required."
                        accept="application/pdf"
                        value={certificateUrl}
                        onUploadSuccess={(url) => setCertificateUrl(url)}
                        onRemove={() => setCertificateUrl(null)}
                      />

                      <FileUpload 
                        label="Upload Status Report"
                        description="PDF format required."
                        accept="application/pdf"
                        value={statusReportUrl}
                        onUploadSuccess={(url) => setStatusReportUrl(url)}
                        onRemove={() => setStatusReportUrl(null)}
                      />
                    </div>
                  )}

                  {/* QUERY FORM */}
                  {actionType === "QUERY" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-rose-700 dark:text-rose-400 border-b border-rose-100 dark:border-rose-500/20 pb-3 mb-4">Query Details</h3>
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

                  {/* ASSIGN FORM */}
                  {actionType === "ASSIGN" && (
                    <div className="space-y-4">
                      <h3 className="font-bold text-lg text-indigo-700 dark:text-indigo-400 border-b border-indigo-100 dark:border-indigo-500/20 pb-3 mb-4">Staff Assignment</h3>
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

                  {/* Error & Submit */}
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
          )}
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// UI HELPERS
// ----------------------------------------------------------------------

function TabButton({ label, icon, active, onClick, alert }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
        active 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
      }`}
    >
      {icon} {label}
      {alert && !active && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
    </button>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{title}</h3>
      {children}
    </div>
  );
}

function DataBlock({ label, value, highlight }: { label: string, value: string | undefined, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-500/5 dark:border-indigo-500/20' : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</p>
      <p className={`text-sm font-semibold truncate ${highlight ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function DocumentPreview({ label, url }: { label: string, url: string | undefined }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-500">{label}</span>
        <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Missing</span>
      </div>
    );
  }

  const isPdf = url.toLowerCase().endsWith('.pdf');

  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-lg">
          {/* FIXED: Using File and FileText consistently */}
          {isPdf ? <File size={20} /> : <FileText size={20} />}
        </div>
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
        View File
      </a>
    </div>
  );
}

function ActionToggle({ active, onClick, label, icon, color }: any) {
  const colorMap: any = {
    emerald: "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    rose: "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
    indigo: "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
  };
  
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
        active ? colorMap[color] : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
