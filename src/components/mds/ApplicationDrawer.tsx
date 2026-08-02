"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  X, CheckCircle, AlertCircle, FileText, UserPlus, File, RefreshCw, Briefcase, Building2, MapPin, Download, Users, ShieldAlert, PieChart
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
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
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

  // ==========================================
  // SAFE DATA PARSERS 
  // ==========================================
  const parseJsonSafe = (data: any, fallback: any = []) => {
    if (!data) return fallback;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return fallback; }
    }
    return data;
  };
  
  const parseAddress = () => {
    if (isLlc && ticket.registeredAddress) {
      const addr = parseJsonSafe(ticket.registeredAddress, {});
      return `${addr.street || ""}, ${addr.lga || ""}, ${addr.state || ""} State.`.replace(/^, /, '').trim();
    } else {
      return `${ticket.companyAddress || ""}, ${ticket.companyCity || ""}, ${ticket.companyState || ""} State.`.replace(/^, /, '').trim();
    }
  };

  const parsePersonAddress = (person: any) => {
    if (isLlc && person.residentialAddress) {
      const addr = parseJsonSafe(person.residentialAddress, {});
      return `${addr.street || ""}, ${addr.lga || ""}, ${addr.state || ""}`.replace(/^, /, '').trim();
    } else {
      return person.serviceAddress || `${person.streetNo ? person.streetNo + ' ' : ''}${person.city || ''}, ${person.lga || ''}, ${person.state || ''}`.replace(/^, /, '').trim();
    }
  };

  const categoryLabel = isLlc ? ticket.principalActivity : ticket.category;
  const specificObjLabel = isLlc ? ticket.specificActivity : ticket.specificNature;
  const addressLabel = parseAddress();
  
  const shareClassesData = isLlc ? parseJsonSafe(ticket.shareClasses) : [];
  const customArticlesData = isLlc ? parseJsonSafe(ticket.customArticles) : [];

  // ==========================================
  // PEOPLE CATEGORIZATION LOGIC
  // ==========================================
  const directors = ticket.people?.filter((p: any) => p.roles?.includes("DIRECTOR")) || [];
  const shareholders = ticket.people?.filter((p: any) => p.roles?.includes("SHAREHOLDER")) || [];
  const secretaries = ticket.people?.filter((p: any) => p.roles?.includes("SECRETARY")) || [];
  const pscs = ticket.people?.filter((p: any) => p.isPsc || p.roles?.includes("PSC") || p.pscDetails) || [];
  const proprietors = ticket.people || []; // For Business Names

  // ==========================================
  // FORCE DOWNLOAD HELPER
  // ==========================================
  const handleForceDownload = async (url: string, filename: string) => {
    try {
      setDownloadingFile(url);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, falling back to new tab", err);
      window.open(url, '_blank');
    } finally {
      setDownloadingFile(null);
    }
  };

  // ==========================================
  // ACTION HANDLER
  // ==========================================
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
      
      <div className="relative w-full max-w-5xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header Ribbon */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 text-xs font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                Ref: {ticket.trackingId}
              </span>
              {isLlc ? (
                <span className="flex items-center text-xs font-bold text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/10 px-2 py-1 rounded">
                  <Building2 size={12} className="mr-1.5" /> LLC Formation
                </span>
              ) : (
                <span className="flex items-center text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-1 rounded">
                  <Briefcase size={12} className="mr-1.5" /> Business Name
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{ticket.proposedName}</h2>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-1">Submitted: {format(new Date(ticket.createdAt), "PPP 'at' p")}</p>
          </div>
          
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto scrollbar-hide z-10 shadow-sm">
          <TabButton active={activeTab === "INFO"} onClick={() => setActiveTab("INFO")} label="Application Info" icon={<FileText size={16} />} />
          <TabButton active={activeTab === "PEOPLE"} onClick={() => setActiveTab("PEOPLE")} label="Personnel & Roles" icon={<Users size={16} />} />
          <TabButton active={activeTab === "DOCS"} onClick={() => setActiveTab("DOCS")} label="Client Documents" icon={<File size={16} />} />
          <TabButton active={activeTab === "ACTION"} onClick={() => setActiveTab("ACTION")} label="Admin Action Hub" icon={<CheckCircle size={16} />} alert={ticket.status === "PENDING"} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          
          {/* TAB 1: Application Info */}
          {activeTab === "INFO" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
              
              <Section title="Proposed Names">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <DataBlock label="Option 1 (Primary)" value={ticket.proposedName} highlight />
                  <DataBlock label="Option 2" value={ticket.altName1} />
                  <DataBlock label="Option 3" value={ticket.altName2} />
                </div>
              </Section>

              <Section title="Classification & Objectives">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DataBlock label="Business Category" value={categoryLabel} />
                  <DataBlock label="Specific Objective" value={specificObjLabel} />
                  
                  {ticket.description && (
                    <div className="md:col-span-2">
                      <DataBlock label="Nature of Business / Detailed Description" value={ticket.description} />
                    </div>
                  )}
                </div>

                {isLlc && ticket.memorandumObjects && ticket.memorandumObjects.length > 0 && (
                  <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-indigo-500" /> Memorandum Objects (To submit to CAC)
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm font-medium text-zinc-900 dark:text-zinc-100 ml-2">
                      {ticket.memorandumObjects.map((obj: string, i: number) => (
                        <li key={i} className="leading-relaxed">{obj}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              {/* CAPITAL & SHARES (LLC ONLY) */}
              {isLlc && (
                <Section title="Share Capital Structure">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DataBlock label="Total Share Capital" value={ticket.totalShareCapital ? `₦${Number(ticket.totalShareCapital).toLocaleString()}` : "N/A"} highlight />
                    <DataBlock label="Company Type" value={ticket.companyType || "Private Company Limited by Shares"} />
                  </div>
                  
                  {shareClassesData && shareClassesData.length > 0 && (
                    <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                        <PieChart size={14} className="text-indigo-500" /> Breakdown of Share Classes
                      </p>
                      <div className="space-y-3">
                        {shareClassesData.map((sc: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-sm p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100">{sc.type || sc.className || "Ordinary"} Shares</span>
                              <span className="text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-lg">
                                {Number(sc.value || sc.allotted || 0).toLocaleString()} Units
                              </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Section>
              )}

              {/* ARTICLES OF ASSOCIATION (LLC ONLY) */}
              {isLlc && (
                <Section title="Articles of Association">
                  {ticket.useDefaultArticles ? (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5 flex items-start gap-3 shadow-sm">
                      <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={20} />
                      <div>
                        <p className="font-bold text-emerald-800 dark:text-emerald-400">Adopted Default CAC Articles</p>
                        <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-500/80 mt-1">The client chose to use the standard prescribed Articles of Association. No custom typing required.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">Custom Articles Provided by Client</p>
                      <ul className="list-disc list-inside space-y-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 ml-2">
                        {customArticlesData && customArticlesData.length > 0 ? customArticlesData.map((art: any, i: number) => (
                          <li key={i} className="leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">{art.article || art.text || art}</li>
                        )) : <li className="text-zinc-500 italic list-none">No custom articles parsed.</li>}
                      </ul>
                    </div>
                  )}
                </Section>
              )}

              {/* Address */}
              <Section title="Principal Address">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-indigo-500 shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{addressLabel || "Address not fully provided"}</p>
                    </div>
                  </div>
                </div>
              </Section>
              
            </div>
          )}

          {/* TAB 2: People (Categorized) */}
          {activeTab === "PEOPLE" && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto pb-10">
              
              {!isLlc && (
                <RoleSection title="Proprietors" count={proprietors.length} color="blue">
                   {proprietors.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={false} parseAddress={parsePersonAddress} />)}
                </RoleSection>
              )}

              {isLlc && directors.length > 0 && (
                <RoleSection title="Directors" count={directors.length} color="indigo">
                   {directors.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} parseAddress={parsePersonAddress} />)}
                </RoleSection>
              )}

              {isLlc && shareholders.length > 0 && (
                <RoleSection title="Shareholders" count={shareholders.length} color="emerald">
                   {shareholders.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} parseAddress={parsePersonAddress} showShares />)}
                </RoleSection>
              )}

              {isLlc && secretaries.length > 0 && (
                <RoleSection title="Secretaries" count={secretaries.length} color="amber">
                   {secretaries.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} parseAddress={parsePersonAddress} />)}
                </RoleSection>
              )}

              {isLlc && pscs.length > 0 && (
                <RoleSection title="Persons with Significant Control (PSC)" count={pscs.length} color="rose">
                   {pscs.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} parseAddress={parsePersonAddress} showPsc />)}
                </RoleSection>
              )}
            </div>
          )}

          {/* TAB 3: Documents */}
          {activeTab === "DOCS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto pb-10">
              
              {/* Application Wide Documents */}
              {isLlc && (ticket.declarantSignatureUrl || ticket.witnessSignatureUrl) && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
                    General Signatures & Declarations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DocumentPreview 
                      label="Declarant Signature" 
                      url={ticket.declarantSignatureUrl} 
                      downloadName={`Declarant_Signature_${ticket.trackingId}.jpg`} 
                      isDownloading={downloadingFile === ticket.declarantSignatureUrl}
                      onDownload={handleForceDownload}
                    />
                    <DocumentPreview 
                      label="Witness Signature" 
                      url={ticket.witnessSignatureUrl} 
                      downloadName={`Witness_Signature_${ticket.trackingId}.jpg`} 
                      isDownloading={downloadingFile === ticket.witnessSignatureUrl}
                      onDownload={handleForceDownload}
                    />
                  </div>
                </div>
              )}

              {/* Personal Documents */}
              {ticket.people?.map((person: any, idx: number) => {
                const safeName = (person.firstName || "Client").replace(/\s+/g, '_');
                
                return (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 flex justify-between items-center">
                      <span>{person.firstName} {person.surname}</span>
                      <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Documents</span>
                    </h3>
                    
                    {isLlc ? (
                      <DocumentPreview 
                        label={`ID Card (${person.idType || "ID"})`} 
                        url={person.idDocumentUrl} 
                        downloadName={`ID_${safeName}_${ticket.trackingId}`} 
                        isDownloading={downloadingFile === person.idDocumentUrl}
                        onDownload={handleForceDownload}
                      />
                    ) : (
                      <>
                        <DocumentPreview 
                          label="NIN Slip / Card" 
                          url={person.ninUrl} 
                          downloadName={`NIN_${safeName}_${ticket.trackingId}`} 
                          isDownloading={downloadingFile === person.ninUrl}
                          onDownload={handleForceDownload}
                        />
                        <DocumentPreview 
                          label="Passport Photograph" 
                          url={person.passportUrl} 
                          downloadName={`Passport_${safeName}_${ticket.trackingId}`} 
                          isDownloading={downloadingFile === person.passportUrl}
                          onDownload={handleForceDownload}
                        />
                      </>
                    )}
                    <DocumentPreview 
                      label="Specimen Signature" 
                      url={person.signatureUrl} 
                      downloadName={`Signature_${safeName}_${ticket.trackingId}`} 
                      isDownloading={downloadingFile === person.signatureUrl}
                      onDownload={handleForceDownload}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: Admin Action Hub */}
          {activeTab === "ACTION" && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
              
              <div className="bg-amber-50 dark:bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-r-2xl shadow-sm">
                <p className="text-base font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <ShieldAlert size={18} /> Critical Operation Zone
                </p>
                <p className="text-sm font-medium text-amber-700/80 dark:text-amber-500/80 mt-1">Actions taken here will trigger automated emails to the client and permanently alter the application state.</p>
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

              {actionType && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                  
                  {actionType === "APPROVE" && (
                    <div className="space-y-6">
                      <h3 className="font-bold text-xl text-emerald-700 dark:text-emerald-400 border-b border-emerald-100 dark:border-emerald-500/20 pb-4 mb-6">Fulfill Order</h3>
                      
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
      className={`flex items-center gap-2 px-6 py-5 text-sm font-bold border-b-[3px] transition-all whitespace-nowrap ${
        active 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-900" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
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
      <h3 className="text-sm font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function RoleSection({ title, count, color, children }: { title: string, count: number, color: string, children: React.ReactNode }) {
  const colorStyles: any = {
    blue: "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    indigo: "text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20",
    emerald: "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    amber: "text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    rose: "text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  };

  return (
    <div className="space-y-4">
      <h3 className={`text-base font-black uppercase tracking-widest border-b pb-2 flex items-center gap-3 ${colorStyles[color]}`}>
        {title} 
        <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px]">{count}</span>
      </h3>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function PersonCard({ person, isLlc, parseAddress, showShares, showPsc }: any) {
  const fullName = `${person.firstName || ''} ${person.surname || ''} ${person.otherName || ''}`.trim();
  const pscData = showPsc ? (typeof person.pscDetails === 'string' ? JSON.parse(person.pscDetails) : person.pscDetails) : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg">{fullName || "Unnamed Person"}</h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <DataBlock label="Email" value={person.email} />
        <DataBlock label="Phone" value={person.phone} />
        <DataBlock label="Gender" value={person.gender} />
        <DataBlock label="Date of Birth" value={person.dob} />
        
        {isLlc ? (
          <>
            <DataBlock label="Occupation" value={person.occupation} />
            <DataBlock label="ID Document Type" value={person.idType} />
            <DataBlock label="ID Number" value={person.idNumber} highlight />
          </>
        ) : (
          <DataBlock label="NIN Status" value={person.ninUrl ? "Uploaded" : "Missing"} highlight />
        )}
        
        {showShares && person.sharesAllotted && (
          <DataBlock label="Total Shares Allotted" value={Number(person.sharesAllotted).toLocaleString()} highlight />
        )}

        {showPsc && pscData && (
          <div className="md:col-span-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 p-4 rounded-xl">
             <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Significant Control Declarations</p>
             <ul className="list-disc list-inside text-sm text-rose-900 dark:text-rose-200 space-y-1">
               {pscData.natureOfControl?.map((control: string, i: number) => <li key={i}>{control}</li>)}
             </ul>
          </div>
        )}
        
        <div className="md:col-span-3">
           <DataBlock label="Residential / Service Address" value={parseAddress(person)} />
        </div>
      </div>
    </div>
  );
}

function DataBlock({ label, value, highlight }: { label: string, value: string | undefined, highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-xl border ${highlight ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-500/5 dark:border-indigo-500/30 shadow-sm' : 'bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</p>
      <p className={`text-sm font-semibold whitespace-pre-wrap break-words ${highlight ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function DocumentPreview({ label, url, downloadName, isDownloading, onDownload }: { label: string, url: string | undefined, downloadName: string, isDownloading: boolean, onDownload: (url: string, filename: string) => void }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between p-5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
        <span className="text-sm font-semibold text-zinc-500">{label}</span>
        <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded">Missing</span>
      </div>
    );
  }

  const extension = url.split('.').pop() || 'pdf';
  const finalDownloadName = `${downloadName}.${extension}`;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl shrink-0">
          <File size={24} />
        </div>
        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate" title={label}>{label}</span>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-xs font-bold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-center"
        >
          View
        </a>
        <button 
          onClick={() => onDownload(url, finalDownloadName)}
          disabled={isDownloading}
          className="flex items-center text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity text-center cursor-pointer disabled:opacity-50"
        >
          {isDownloading ? <RefreshCw size={14} className="mr-1.5 animate-spin" /> : <Download size={14} className="mr-1.5" />}
          {isDownloading ? "Saving..." : "Save File"}
        </button>
      </div>
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
      className={`flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all cursor-pointer ${
        active ? colorMap[color] : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="mb-2">{icon}</div>
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}
