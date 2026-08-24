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
  FileSpreadsheet
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

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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

  const categoryLabel = MOD_TITLES[request.modificationCategory] || MOD_TITLES[request.type] || request.modificationCategory || request.type;
  const registeredFullName = [request.oldFirstName, request.oldMiddleName, request.oldLastName].filter(Boolean).join(" ") || request.currentFullName;
  const requestedNewFullName = [request.newFirstName, request.newMiddleName, request.newLastName].filter(Boolean).join(" ");
  const previewSlipUrl = sanitizeHttpUrl(slipUrl || request.slipUrl);

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
            <p className="text-xs text-zinc-400">
              Submitted on {request.createdAt ? format(new Date(request.createdAt), "PPP 'at' p") : "N/A"}
            </p>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800/80 hover:bg-zinc-800 transition-colors"
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
            Application &amp; Modification Details
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

              {/* 1. Client & Account Overview */}
              <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                  <User size={13} className="text-emerald-400" />
                  Client Account Information
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">User Account Name:</span>
                    <span className="font-bold text-white text-xs">
                      {[request.user?.firstName, request.user?.lastName].filter(Boolean).join(" ") || "User Client"}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Email Address:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-medium text-white truncate max-w-[170px]">{request.user?.email || "N/A"}</span>
                      {request.user?.email && (
                        <button
                          type="button"
                          onClick={() => handleCopy("email", request.user.email)}
                          className="text-zinc-400 hover:text-emerald-400 p-0.5 rounded cursor-pointer"
                          title="Copy Email"
                        >
                          {copiedKey === "email" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Phone Number:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-medium text-white">{request.user?.phone || "N/A"}</span>
                      {request.user?.phone && (
                        <button
                          type="button"
                          onClick={() => handleCopy("userPhone", request.user.phone)}
                          className="text-zinc-400 hover:text-emerald-400 p-0.5 rounded cursor-pointer"
                          title="Copy Phone"
                        >
                          {copiedKey === "userPhone" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Core Identifiers (BVN, NIN, Enrolling Bank) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Target BVN Card */}
                <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Target BVN (11 Digits)</span>
                    <span className="font-mono font-black text-white text-base tracking-wider block mt-1">
                      {request.bvn}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy("bvn", request.bvn)}
                    className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors border border-zinc-700"
                    title="Copy 11-digit BVN"
                  >
                    {copiedKey === "bvn" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                </div>

                {/* Target NIN Card */}
                <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">Target NIN (11 Digits)</span>
                    <span className="font-mono font-black text-white text-base tracking-wider block mt-1">
                      {request.nin || "Not Provided"}
                    </span>
                  </div>
                  {request.nin && (
                    <button
                      type="button"
                      onClick={() => handleCopy("nin", request.nin)}
                      className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer transition-colors border border-zinc-700"
                      title="Copy 11-digit NIN"
                    >
                      {copiedKey === "nin" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>

              </div>

              {/* 3. Enrolling Bank & Service Details */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Enrolling Bank on Record:</span>
                    <span className="font-bold text-emerald-400 text-sm">{request.enrollingBank || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Service Classification:</span>
                    <span className="font-bold text-white text-xs">{categoryLabel}</span>
                  </div>
                </div>
              </div>

              {/* 4. BEFORE VS AFTER COMPARISON (The Core Submission Changes) */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Submitted Modification Data (Current vs New)
                </span>

                {/* Name Modification */}
                {request.modifyName && (
                  <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <User size={13} className="text-sky-400" /> Legal Name Modification
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                        Name Change Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Old Name (On BVN)</span>
                        <div className="font-bold text-zinc-300 text-xs leading-relaxed">
                          {registeredFullName || "N/A"}
                        </div>
                        {(request.oldFirstName || request.oldLastName) && (
                          <div className="text-[10px] text-zinc-500 mt-1 space-y-0.5 font-mono">
                            <div>First: <strong className="text-zinc-400">{request.oldFirstName || "–"}</strong></div>
                            <div>Middle: <strong className="text-zinc-400">{request.oldMiddleName || "–"}</strong></div>
                            <div>Surname: <strong className="text-zinc-400">{request.oldLastName || "–"}</strong></div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold">New Requested Legal Name</span>
                          {requestedNewFullName && (
                            <button
                              type="button"
                              onClick={() => handleCopy("newName", requestedNewFullName)}
                              className="text-emerald-400 hover:text-white p-0.5 cursor-pointer"
                              title="Copy New Name"
                            >
                              {copiedKey === "newName" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                        <div className="font-black text-emerald-300 text-xs leading-relaxed">
                          {requestedNewFullName || "N/A"}
                        </div>
                        {(request.newFirstName || request.newLastName) && (
                          <div className="text-[10px] text-emerald-400/80 mt-1 space-y-0.5 font-mono">
                            <div>First: <strong className="text-emerald-300">{request.newFirstName || "–"}</strong></div>
                            <div>Middle: <strong className="text-emerald-300">{request.newMiddleName || "–"}</strong></div>
                            <div>Surname: <strong className="text-emerald-300">{request.newLastName || "–"}</strong></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Date of Birth Modification */}
                {request.modifyDob && (
                  <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Calendar size={13} className="text-amber-400" /> Date of Birth (DOB) Modification
                      </span>
                      {request.surchargeApplied ? (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          &gt; 5-Year Shift (₦5,000 Surcharge)
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          Standard DOB Shift (&le; 5 Yrs)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Old DOB (On Record)</span>
                        <div className="font-mono font-bold text-zinc-300 text-xs">
                          {request.currentDob || "N/A"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-amber-400 uppercase font-bold">New Requested Date of Birth</span>
                          {request.newDob && (
                            <button
                              type="button"
                              onClick={() => handleCopy("newDob", request.newDob)}
                              className="text-amber-400 hover:text-white p-0.5 cursor-pointer"
                              title="Copy New DOB"
                            >
                              {copiedKey === "newDob" ? <Check size={12} className="text-amber-400" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                        <div className="font-mono font-black text-amber-300 text-xs">
                          {request.newDob || "N/A"}
                        </div>
                        {request.yearsDifference !== null && request.yearsDifference !== undefined && (
                          <div className="text-[10px] text-amber-400/90 mt-1 font-medium">
                            Variance: <strong>{Number(request.yearsDifference).toFixed(1)} years</strong> gap between records.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone Number Modification */}
                {request.modifyPhone && (
                  <div className="bg-zinc-900/90 rounded-2xl border border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                      <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                        <Phone size={13} className="text-violet-400" /> Phone Number Modification
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-bold">
                        Phone Change Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800">
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Old Phone (On Record)</span>
                        <div className="font-mono font-bold text-zinc-300 text-xs">
                          {request.currentPhone || "Not Specified"}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-violet-950/20 border border-violet-500/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-violet-400 uppercase font-bold">New Requested Phone</span>
                          {request.newPhone && (
                            <button
                              type="button"
                              onClick={() => handleCopy("newPhone", request.newPhone)}
                              className="text-violet-400 hover:text-white p-0.5 cursor-pointer"
                              title="Copy New Phone"
                            >
                              {copiedKey === "newPhone" ? <Check size={12} className="text-violet-400" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                        <div className="font-mono font-black text-violet-300 text-xs">
                          {request.newPhone || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Payment, Fee & Transaction Reference */}
              <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                  <DollarSign size={13} className="text-emerald-400" />
                  Billing &amp; Transaction Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Total Fee Paid:</span>
                    <span className="font-black text-emerald-400 text-base">
                      ₦{Number(request.amountPaid || 0).toLocaleString()}
                    </span>
                    {request.surchargeApplied && (
                      <span className="text-[10px] text-amber-400 block mt-0.5 font-medium">
                        (Includes ₦{Number(request.surchargeAmount || 5000).toLocaleString()} DOB Surcharge)
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[11px]">Transaction Reference:</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono text-zinc-300 font-bold text-xs truncate max-w-[150px]">
                        {request.transactionRef || "N/A"}
                      </span>
                      {request.transactionRef && (
                        <button
                          type="button"
                          onClick={() => handleCopy("txRef", request.transactionRef)}
                          className="text-zinc-400 hover:text-emerald-400 p-0.5 cursor-pointer"
                          title="Copy Transaction Ref"
                        >
                          {copiedKey === "txRef" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-zinc-500 block text-[11px]">Refund Status:</span>
                    {request.isRefunded ? (
                      <span className="font-bold text-amber-400 text-xs block mt-0.5">
                        Refunded ₦{Number(request.refundAmount || request.amountPaid).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs block mt-0.5">No Refund Issued</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Supporting Documents / Uploaded Attachments (if any) */}
              {Array.isArray(request.documentUrls) && request.documentUrls.length > 0 && (
                <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 flex items-center gap-1.5">
                    <FileText size={13} className="text-sky-400" />
                    Applicant Supporting Documents ({request.documentUrls.length})
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {request.documentUrls.map((docUrl: string, idx: number) => {
                      const safeUrl = sanitizeHttpUrl(docUrl);
                      return safeUrl ? (
                        <a
                          key={idx}
                          href={safeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 transition-colors text-zinc-300 hover:text-white"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className="text-emerald-400 shrink-0" />
                            <span className="truncate font-mono text-xs">Attachment #{idx + 1}</span>
                          </div>
                          <ExternalLink size={14} className="shrink-0 text-zinc-500" />
                        </a>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* 7. Existing Slip Resolution (If Completed) */}
              {request.status === "COMPLETED" && request.slipUrl && (
                <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                      <FileCheck size={14} /> Completed BVN Resolution Slip Available
                    </span>
                    {previewSlipUrl && (
                      <a
                        href={previewSlipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
                      >
                        <Eye size={13} /> View Slip <ExternalLink size={12} className="ml-0.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 font-mono truncate">{request.slipUrl}</p>
                </div>
              )}

              {/* 8. Rejection Information (If Rejected) */}
              {request.status === "REJECTED" && (
                <div className="bg-rose-950/20 border border-rose-500/30 p-4 sm:p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-400 flex items-center gap-1.5">
                    <XCircle size={14} /> Rejection Notice
                  </span>
                  <p className="text-xs text-rose-300 font-medium leading-relaxed">
                    {request.rejectionReason || "No rejection reason recorded."}
                  </p>
                  {request.isRefunded && (
                    <span className="text-[11px] text-zinc-400 block font-mono">
                      Refund Amount: ₦{Number(request.refundAmount || 0).toLocaleString()} credited back to user wallet.
                    </span>
                  )}
                </div>
              )}

              {/* 9. Internal Notes */}
              {request.adminNotes && (
                <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 block">Internal Staff Notes</span>
                  <p className="text-xs text-zinc-300 italic">{request.adminNotes}</p>
                </div>
              )}

            </div>
          ) : (
            
            /* TAB 2: TAKE ACTION & SLIP UPLOAD */
            <div className="space-y-6">

              <div className="bg-zinc-900/90 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-4">
                <div>
                  <h3 className="text-sm font-black text-white">Select Management Action</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Change ticket operational state, upload final resolution slips, or decline with automated refunds.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setActionType("PROCESSING")}
                    className={`p-3.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      actionType === "PROCESSING" 
                        ? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <Clock size={18} className={actionType === "PROCESSING" ? "text-sky-400" : "text-zinc-500"} />
                    <span>Mark In Processing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType("COMPLETE")}
                    className={`p-3.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      actionType === "COMPLETE" 
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <CheckCircle size={18} className={actionType === "COMPLETE" ? "text-emerald-400" : "text-zinc-500"} />
                    <span>Approve &amp; Upload Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType("REJECT")}
                    className={`p-3.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                      actionType === "REJECT" 
                        ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-md shadow-rose-500/10"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <XCircle size={18} className={actionType === "REJECT" ? "text-rose-400" : "text-zinc-500"} />
                    <span>Reject Application</span>
                  </button>
                </div>
              </div>

              {/* ACTION: COMPLETE / UPLOAD RESOLUTION SLIP */}
              {actionType === "COMPLETE" && (
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">
                      NIBSS BVN Modification Resolution Slip (PDF or Image) <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-xs text-zinc-400">
                      Upload the official NIBSS modification confirmation slip. The applicant will instantly receive an email alert and download access.
                    </p>
                  </div>

                  {/* Drag-and-Drop / Direct File Upload Card */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-dashed border-zinc-700 hover:border-emerald-500/60 transition-colors">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        {isUploadingSlip ? (
                          <Loader2 size={22} className="animate-spin text-emerald-400" />
                        ) : (
                          <UploadCloud size={22} />
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">
                          {isUploadingSlip ? `Uploading document... (${uploadProgress}%)` : "Select or drag resolution slip file here"}
                        </p>
                        <p className="text-[11px] text-zinc-500">Supports PDF, PNG, JPG files up to 5MB</p>
                      </div>

                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all">
                        {isUploadingSlip ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Uploading {uploadProgress}%</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud size={14} />
                            <span>Browse &amp; Upload Slip</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="application/pdf,image/jpeg,image/png"
                          onChange={handleFileUpload}
                          disabled={isUploadingSlip}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Progress Bar */}
                    {isUploadingSlip && (
                      <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-1.5 transition-all duration-200" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Slip Preview & Removal */}
                  {slipUrl && (
                    <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                        <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                        <span className="font-mono text-xs text-emerald-300 truncate">{slipUrl}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {previewSlipUrl && (
                          <a
                            href={previewSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-300 hover:text-white underline"
                          >
                            Preview
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setSlipUrl("")}
                          className="p-1 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove Slip URL"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fallback Direct URL Input */}
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Or direct file URL:</label>
                    <input
                      type="text"
                      value={slipUrl}
                      onChange={(e) => setSlipUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../bvn-slip.pdf"
                      className="w-full h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* ACTION: REJECT & REFUND */}
              {actionType === "REJECT" && (
                <div className="bg-zinc-900/90 p-5 rounded-2xl border border-zinc-800 space-y-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-xs font-bold text-rose-400 block mb-1">
                      Decline Reason (Visible to user via email and dashboard) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Enrolling bank mismatch or details do not reflect on NIBSS server."
                      className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      required
                    />
                  </div>

                  {/* Optional Refund Section */}
                  <div className="pt-2 border-t border-zinc-800 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={issueRefund}
                        onChange={(e) => setIssueRefund(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">
                        Issue Instant Wallet Refund to User?
                      </span>
                    </label>

                    {issueRefund && (
                      <div className="pl-6 space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 block">
                          Refund Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="Amount in ₦"
                          className="w-full sm:w-48 h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-[10px] text-zinc-500 block">
                          Original fee paid: ₦{Number(request.amountPaid || 0).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Internal Notes Input */}
              <div className="bg-zinc-900/90 p-4 rounded-2xl border border-zinc-800 space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 block">Internal Staff Notes (Optional)</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified against NIBSS portal batch #914"
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Action Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setActiveTab("DETAILS"); setActionType(null); }}
                  className="flex-1 h-11 text-xs font-bold border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white cursor-pointer"
                >
                  Back to Details
                </Button>

                <Button
                  type="button"
                  disabled={!actionType || isExecutingAction || isUploadingSlip || (actionType === "REJECT" && !rejectionReason.trim()) || (actionType === "COMPLETE" && !slipUrl.trim())}
                  onClick={handleExecuteAdminAction}
                  className={`flex-1 h-11 font-black text-xs rounded-xl cursor-pointer shadow-sm ${
                    actionType === "REJECT"
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isExecutingAction ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving Action...</span>
                    </div>
                  ) : (
                    "Confirm & Execute Action"
                  )}
                </Button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
