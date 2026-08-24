"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  User, 
  Mail, 
  Phone, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  UploadCloud, 
  FileText, 
  ExternalLink,
  Calendar,
  DollarSign,
  Building2,
  FileCheck,
  AlertCircle,
  Eye,
  Trash2,
  FileSpreadsheet,
  IdCard,
  CreditCard,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BvnModificationDrawerProps {
  request: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

const MOD_TITLES: Record<string, string> = {
  CHANGE_OF_NAME: "Change of Name Only",
  CHANGE_OF_DOB: "Change of Date of Birth (DOB) Only",
  CHANGE_OF_PHONE: "Change of Phone Number Only",
  CHANGE_OF_NAME_PHONE: "Change of Name & Phone Number",
  CHANGE_OF_DOB_PHONE: "Change of DOB & Phone Number",
  CHANGE_OF_NAME_DOB: "Change of Name & Date of Birth",
  CHANGE_OF_ALL: "Change of Name, DOB & Phone (All 3)",
};

const sanitizeHttpUrl = (value: string): string | null => {
  const trimmed = (value || "").trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  return null;
};

export default function BvnModificationDrawer({
  request,
  onClose,
  onUpdateSuccess,
}: BvnModificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"DETAILS" | "ACTIONS">("DETAILS");
  const [actionType, setActionType] = useState<"PROCESSING" | "COMPLETE" | "REJECT" | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>(request?.adminNotes || "");
  const [slipUrl, setSlipUrl] = useState<string>(request?.slipUrl || "");
  const [isUploadingSlip, setIsUploadingSlip] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>(request?.rejectionReason || "");
  const [issueRefund, setIssueRefund] = useState<boolean>(true);
  const [refundAmount, setRefundAmount] = useState<number | string>(request?.amountPaid || 0);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!request) return null;

  const registeredFullName = [request.oldFirstName, request.oldMiddleName, request.oldLastName].filter(Boolean).join(" ") || request.currentFullName || "N/A";
  const requestedNewFullName = [request.newFirstName, request.newMiddleName, request.newLastName].filter(Boolean).join(" ") || "N/A";
  const categoryLabel = MOD_TITLES[request.modificationCategory] || MOD_TITLES[request.type] || request.modificationCategory || request.type;
  const previewSlipUrl = sanitizeHttpUrl(slipUrl || request.slipUrl);

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Grouped Copy: Primary Identifiers (Old Details)
  const copyPrimaryIdentifiers = () => {
    const lines = [
      `--- PRIMARY IDENTIFIERS (OLD DETAILS) ---`,
      `BVN: ${request.bvn || "N/A"}`,
      `NIN: ${request.nin || "N/A"}`,
      `Enrolling Bank: ${request.enrollingBank || "N/A"}`,
      `Full Name on BVN: ${registeredFullName}`,
      `Phone Number: ${request.currentPhone || "N/A"}`,
      `Date of Birth: ${request.currentDob || "N/A"}`
    ];
    handleCopy("primary-all", lines.join("\n"));
  };

  // Grouped Copy: Requested New Modification Details
  const copyNewModificationDetails = () => {
    const lines = [`--- REQUESTED MODIFICATIONS (NEW DETAILS) ---`];
    if (request.modifyName || request.newFirstName || request.newLastName) {
      lines.push(`New Full Name: ${requestedNewFullName}`);
    }
    if (request.modifyPhone || request.newPhone) {
      lines.push(`New Phone Number: ${request.newPhone}`);
    }
    if (request.modifyDob || request.newDob) {
      lines.push(`New Date of Birth: ${request.newDob}`);
      if (request.yearsDifference) {
        lines.push(`Age Difference: ${request.yearsDifference.toFixed(1)} years`);
      }
    }
    handleCopy("new-all", lines.join("\n"));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setActionErrorMsg("File size exceeds the 5MB limit. Please compress the file.");
      return;
    }

    setIsUploadingSlip(true);
    setUploadProgress(0);
    setActionErrorMsg(null);

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
      setActionErrorMsg(err.message || "Failed to upload modification resolution slip.");
    } finally {
      setIsUploadingSlip(false);
      setUploadProgress(0);
    }
  };

  const handleExecuteAdminAction = async () => {
    if (!actionType) {
      setActionErrorMsg("Please select an action type.");
      return;
    }

    if (actionType === "COMPLETE" && !slipUrl.trim()) {
      setActionErrorMsg("Uploading or providing a valid resolution slip is required to complete this modification.");
      return;
    }

    if (actionType === "REJECT" && (!rejectionReason.trim() || rejectionReason.trim().length < 3)) {
      setActionErrorMsg("Please provide a clear rejection reason explaining why the application could not be processed.");
      return;
    }

    if (actionType === "REJECT" && issueRefund && (!refundAmount || Number(refundAmount) < 0)) {
      setActionErrorMsg("Please enter a valid refund amount (₦0 or higher).");
      return;
    }

    setIsExecutingAction(true);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    try {
      const payload = {
        id: request.id,
        action: actionType,
        adminNotes: adminNotes.trim(),
        rejectionReason: rejectionReason.trim(),
        slipUrl: slipUrl.trim(),
        issueRefund: actionType === "REJECT" ? issueRefund : false,
        refundAmount: actionType === "REJECT" && issueRefund ? Number(refundAmount) : 0,
      };

      const res = await fetch("/api/mds/bvn/modification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to execute admin action.");
      }

      setActionSuccessMsg(data.message || "Action executed successfully.");
      setTimeout(() => {
        onUpdateSuccess();
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Admin action execution error:", err);
      setActionErrorMsg(err.message || "Action failed.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  const statusBadge = () => {
    switch (request.status) {
      case "COMPLETED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>;
      case "PROCESSING":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">PROCESSING</span>;
      case "REJECTED":
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">REJECTED</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING REVIEW</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Drawer Container */}
      <div className="relative w-full max-w-2xl h-full bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-900/90 flex items-start justify-between shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-zinc-800 text-emerald-400 font-bold border border-zinc-700">
                {request.trackingId}
              </span>
              {statusBadge()}
              {request.enrollingBank && (
                <span className="text-[11px] font-bold px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                  {request.enrollingBank}
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              {categoryLabel}
            </h2>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span>Submitted: {request.createdAt ? format(new Date(request.createdAt), "PPP 'at' p") : "N/A"}</span>
              <span>•</span>
              <span className="text-zinc-300 font-medium">Client: {request.user?.email || "N/A"}</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/80 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50 px-6 shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab("DETAILS"); setActionErrorMsg(null); }}
            className={`py-3 text-xs font-bold border-b-2 mr-6 transition-all cursor-pointer ${
              activeTab === "DETAILS" 
                ? "border-emerald-500 text-emerald-400" 
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Primary Identifiers &amp; Changes
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("ACTIONS"); setActionErrorMsg(null); }}
            className={`py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "ACTIONS" 
                ? "border-emerald-500 text-emerald-400" 
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
          >
            Take Action &amp; Upload Slip
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs text-left">
          
          {actionErrorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 font-bold">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{actionErrorMsg}</span>
            </div>
          )}

          {actionSuccessMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 font-bold">
              <CheckCircle size={16} className="shrink-0" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {activeTab === "DETAILS" ? (
            <div className="space-y-6">

              {/* 1. PRIMARY IDENTIFIERS (OLD / CURRENT RECORD) */}
              <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <IdCard size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Primary Identifiers (Old / Current Record)
                      </h3>
                      <p className="text-[11px] text-zinc-400">Official registered profile data on NIBSS database</p>
                    </div>
                  </div>
                  
                  {/* Single 1-Click Copy All Primary Identifiers Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyPrimaryIdentifiers}
                    className="h-8 px-3 text-xs font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedKey === "primary-all" ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span>Copied All Old Details!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Primary Identifiers</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Primary Identifiers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  
                  {/* BVN Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Target BVN (11 Digits)</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-white text-sm tracking-wider">
                        {request.bvn || "N/A"}
                      </span>
                      {request.bvn && (
                        <button
                          type="button"
                          onClick={() => handleCopy("bvn", request.bvn)}
                          className="text-zinc-500 hover:text-emerald-400 p-1 cursor-pointer"
                          title="Copy BVN only"
                        >
                          {copiedKey === "bvn" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* NIN Card */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Target NIN (11 Digits)</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-white text-sm tracking-wider">
                        {request.nin || "Not Provided"}
                      </span>
                      {request.nin && (
                        <button
                          type="button"
                          onClick={() => handleCopy("nin", request.nin)}
                          className="text-zinc-500 hover:text-emerald-400 p-1 cursor-pointer"
                          title="Copy NIN only"
                        >
                          {copiedKey === "nin" ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Enrolling Bank */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Enrolling Bank on File</span>
                    <span className="font-bold text-emerald-400 text-xs">
                      {request.enrollingBank || "N/A"}
                    </span>
                  </div>

                  {/* Old Name */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Registered Old Full Name</span>
                    <span className="font-bold text-zinc-200 text-xs">
                      {registeredFullName}
                    </span>
                  </div>

                  {/* Old Phone */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Old Phone Number</span>
                    <span className="font-mono font-bold text-zinc-200 text-xs">
                      {request.currentPhone || "N/A"}
                    </span>
                  </div>

                  {/* Old DOB */}
                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Old Date of Birth</span>
                    <span className="font-bold text-zinc-200 text-xs">
                      {request.currentDob || "N/A"}
                    </span>
                  </div>

                </div>
              </div>

              {/* 2. REQUESTED MODIFICATIONS (NEW DETAILS) */}
              <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                      <ShieldCheck size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        Requested Modifications (New Details)
                      </h3>
                      <p className="text-[11px] text-zinc-400">Specific updates submitted for verification &amp; approval</p>
                    </div>
                  </div>

                  {/* Single 1-Click Copy All New Details Button */}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyNewModificationDetails}
                    className="h-8 px-3 text-xs font-bold border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer flex items-center gap-1.5"
                  >
                    {copiedKey === "new-all" ? (
                      <>
                        <Check size={13} className="text-sky-400" />
                        <span>Copied All New Details!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy New Modification Data</span>
                      </>
                    )}
                  </Button>
                </div>

                <div className="space-y-3.5 pt-1">
                  
                  {/* Name Modification */}
                  {(request.modifyName || request.newFirstName || request.newLastName) && (
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-400 flex items-center gap-1.5">
                          <User size={13} /> New Legal Name Request
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                          Name Change
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">Old Name</span>
                          <p className="font-medium text-zinc-300">{registeredFullName}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-sky-400 block uppercase font-bold">New Requested Name</span>
                          <p className="font-bold text-emerald-400 text-sm">{requestedNewFullName}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phone Modification */}
                  {(request.modifyPhone || request.newPhone) && (
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                          <Phone size={13} /> New Phone Number Request
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Phone Change
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">Old Phone</span>
                          <p className="font-mono text-zinc-300">{request.currentPhone || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-400 block uppercase font-bold">New Phone</span>
                          <p className="font-mono font-bold text-emerald-400 text-sm">{request.newPhone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DOB Modification */}
                  {(request.modifyDob || request.newDob) && (
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-400 flex items-center gap-1.5">
                          <Calendar size={13} /> Date of Birth Modification
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          DOB Change
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <span className="text-[10px] text-zinc-500 block uppercase font-bold">Old DOB</span>
                          <p className="font-medium text-zinc-300">{request.currentDob || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-amber-400 block uppercase font-bold">New Requested DOB</span>
                          <p className="font-bold text-amber-300 text-sm">{request.newDob}</p>
                        </div>
                      </div>
                      {request.yearsDifference !== null && request.yearsDifference !== undefined && (
                        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                          <span className="text-zinc-400">
                            Age Difference: <strong className="text-zinc-200">{request.yearsDifference.toFixed(1)} years</strong>
                          </span>
                          {request.surchargeApplied && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold text-[10px]">
                              5-Year Statutory Surcharge Applied (+₦{Number(request.surchargeAmount || 0).toLocaleString()})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>

              {/* 3. SUPPORTING DOCUMENTS */}
              {request.documentUrls && request.documentUrls.length > 0 && (
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-sm">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                    <FileText size={14} className="text-emerald-400" />
                    Client Supporting Documents ({request.documentUrls.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {request.documentUrls.map((url: string, index: number) => {
                      const isPdf = url.toLowerCase().includes(".pdf");
                      return (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className="p-2 rounded-lg bg-zinc-900 text-zinc-300 shrink-0">
                              {isPdf ? <FileSpreadsheet size={16} className="text-rose-400" /> : <FileCheck size={16} className="text-emerald-400" />}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-white block truncate text-[11px]">Document #{index + 1}</span>
                              <span className="text-[10px] text-zinc-500">{isPdf ? "PDF File" : "Image File"}</span>
                            </div>
                          </div>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-emerald-600 hover:text-white text-zinc-400 transition-colors shrink-0"
                            title="View Document"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. BILLING & TRANSACTION DETAILS */}
              <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-3 shadow-sm">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-400" />
                  Financial &amp; Transaction Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Total Paid</span>
                    <span className="font-black text-emerald-400 text-base">
                      ₦{Number(request.amountPaid || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold">Transaction Reference</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-zinc-300 truncate max-w-[200px]">{request.transactionRef || "N/A"}</span>
                      {request.transactionRef && (
                        <button
                          type="button"
                          onClick={() => handleCopy("txRef", request.transactionRef)}
                          className="text-zinc-500 hover:text-emerald-400 p-0.5 cursor-pointer"
                        >
                          {copiedKey === "txRef" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Resolution Slip (If completed) */}
              {previewSlipUrl && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <FileCheck size={16} /> Resolution Slip Available
                  </span>
                  <p className="text-zinc-300 text-xs">A resolution slip has been uploaded for this client.</p>
                  <a 
                    href={previewSlipUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
                  >
                    <Eye size={14} /> View Resolution Slip
                  </a>
                </div>
              )}

            </div>
          ) : (
            /* ACTIONS TAB */
            <div className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                  Select Admin Workflow Action
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Complete Button */}
                  <button
                    type="button"
                    onClick={() => { setActionType("COMPLETE"); setActionErrorMsg(null); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === "COMPLETE"
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <CheckCircle size={20} className="mb-1.5" />
                    <span className="font-bold block text-sm">Approve &amp; Complete</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Upload resolution slip</span>
                  </button>

                  {/* Processing Button */}
                  <button
                    type="button"
                    onClick={() => { setActionType("PROCESSING"); setActionErrorMsg(null); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === "PROCESSING"
                        ? "bg-sky-500/15 border-sky-500 text-sky-400 ring-2 ring-sky-500/30"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <RefreshCw size={20} className="mb-1.5" />
                    <span className="font-bold block text-sm">In Processing</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Update status to client</span>
                  </button>

                  {/* Reject Button */}
                  <button
                    type="button"
                    onClick={() => { setActionType("REJECT"); setActionErrorMsg(null); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === "REJECT"
                        ? "bg-rose-500/15 border-rose-500 text-rose-400 ring-2 ring-rose-500/30"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <XCircle size={20} className="mb-1.5" />
                    <span className="font-bold block text-sm">Reject / Query</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">Refund wallet balance</span>
                  </button>

                </div>
              </div>

              {/* ACTION: COMPLETE - Direct Slip Uploader */}
              {actionType === "COMPLETE" && (
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-zinc-800 pb-3">
                    <UploadCloud size={18} />
                    <span>Upload Modification Resolution Slip</span>
                  </div>

                  <div className="space-y-3">
                    {/* Drag & Drop Upload Zone */}
                    {!slipUrl ? (
                      <div className="relative border-2 border-dashed border-zinc-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center transition-colors bg-zinc-950/60">
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={handleFileUpload}
                          disabled={isUploadingSlip}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                          <div className="p-3 rounded-full bg-zinc-800/80 text-emerald-400">
                            {isUploadingSlip ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-200 text-xs">
                              {isUploadingSlip ? `Uploading resolution slip (${uploadProgress}%)...` : "Drop slip here or click to browse"}
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Supports PDF, PNG, JPG (Max 5MB)</p>
                          </div>
                        </div>

                        {isUploadingSlip && (
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-4 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full transition-all duration-300 rounded-full" 
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Uploaded Slip Preview */
                      <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-3 truncate">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                            <FileCheck size={20} />
                          </div>
                          <div className="truncate">
                            <p className="font-bold text-white text-xs truncate">Slip Uploaded Successfully</p>
                            <a href={slipUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 truncate">
                              <Eye size={12} /> View Uploaded Document
                            </a>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSlipUrl("")}
                          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Remove Slip"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}

                    {/* Fallback Direct URL Input */}
                    <div className="space-y-1 pt-2">
                      <label className="text-[11px] text-zinc-400 block font-medium">Or paste direct slip URL (Cloudinary / S3 / External)</label>
                      <input 
                        type="url"
                        value={slipUrl}
                        onChange={(e) => setSlipUrl(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 pt-2">
                    <label className="text-[11px] text-zinc-400 block font-medium">Optional Completion Notes</label>
                    <textarea
                      rows={2}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Notes for client / audit trail..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* ACTION: PROCESSING */}
              {actionType === "PROCESSING" && (
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-zinc-800 pb-3">
                    <RefreshCw size={18} />
                    <span>Set Status to Processing</span>
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    This notifies the client that their modification request is actively being processed with NIBSS and the enrolling bank.
                  </p>
                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-400 block font-medium">Optional Operator Notes</label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Sent for verification with enrolling bank..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              {/* ACTION: REJECT */}
              {actionType === "REJECT" && (
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-2 text-rose-400 font-bold border-b border-zinc-800 pb-3">
                    <AlertCircle size={18} />
                    <span>Reject Application &amp; Issue Refund</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-zinc-300 font-bold block">
                      Rejection Reason (Sent to Client) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Enrolling bank record does not match the provided affidavits..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={issueRefund}
                        onChange={(e) => setIssueRefund(e.target.checked)}
                        className="rounded border-zinc-700 text-rose-500 focus:ring-rose-500 h-4 w-4 bg-zinc-900 cursor-pointer"
                      />
                      <span className="font-bold text-zinc-200 text-xs">Credit Refund to Client Wallet</span>
                    </label>

                    {issueRefund && (
                      <div className="space-y-1 pt-1">
                        <label className="text-[11px] text-zinc-400 block">Refund Amount (₦)</label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Execution Button */}
              {actionType && (
                <div className="pt-4 border-t border-zinc-800">
                  <Button
                    type="button"
                    disabled={isExecutingAction || isUploadingSlip}
                    onClick={handleExecuteAdminAction}
                    className={`w-full h-12 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                      actionType === "COMPLETE"
                        ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                        : actionType === "PROCESSING"
                        ? "bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20"
                        : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20"
                    }`}
                  >
                    {isExecutingAction ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Executing Action...</span>
                      </span>
                    ) : (
                      <span>Confirm &amp; Execute Action</span>
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
