// src/components/mds/affidavit/AffidavitApplicationDrawer.tsx
"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  X,
  CheckCircle,
  FileText,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Gavel,
  ExternalLink,
  Download,
  Copy,
  Check,
  User,
  Image as ImageIcon,
  CheckCheck,
} from "lucide-react";
import { FileUpload } from "@/components/FileUpload";

interface AffidavitApplicationDrawerProps {
  ticket: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function AffidavitApplicationDrawer({
  ticket,
  onClose,
  onUpdateSuccess,
}: AffidavitApplicationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"INFO" | "FACTS" | "MEDIA">("INFO");
  const [actionType, setActionType] = useState<"PROCESS" | "COMPLETE" | "QUERY" | "REJECT" | "">("");

  // Action form inputs
  const [certificateUrl, setCertificateUrl] = useState<string>("");
  const [courtName, setCourtName] = useState<string>("High Court Registry");
  const [commissionerName, setCommissionerName] = useState<string>("Commissioner for Oaths");
  const [queryReason, setQueryReason] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [shouldRefund, setShouldRefund] = useState<boolean>(true);
  const [adminNotes, setAdminNotes] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!ticket) return null;

  const statusColor =
    ticket.status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : ticket.status === "REJECTED"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
      : ticket.status === "QUERIED"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
      : ticket.status === "PROCESSING"
      ? "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
      : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400";

  // Build formatted deponent text for 1-click copying
  const getDeponentCopyText = () => {
    return `DEPONENT PARTICULARS
Full Legal Name: ${ticket.deponentFullName}
Gender: ${ticket.gender}
Date of Birth: ${ticket.dob} (${ticket.age} Years Old)
Religion: ${ticket.religion}
Nationality: ${ticket.nationality}
Residential Address: ${ticket.residentialAddress}
Occupation: ${ticket.occupation || "N/A"}
Tracking ID: ${ticket.trackingId}
Amount Paid: ₦${Number(ticket.amountCharged).toLocaleString()}
Contact Email: ${ticket.clientEmail}
Contact Phone: ${ticket.clientPhone || "N/A"}`;
  };

  // Build formatted sworn facts text for 1-click copying
  const getFactsCopyText = () => {
    const details = ticket.details || {};
    let text = `SWORN FACTS - ${ticket.category?.replace(/_/g, " ")}\n`;

    if (ticket.category === "CHANGE_OF_NAME") {
      text += `Former Name: ${details.oldName || details.formerFirstName || "N/A"}
New Legal Name: ${details.newName || details.newFirstName || "N/A"}
Reason: ${details.reason || "Marriage / Personal Decision"}
Usage Destination: ${details.usageDestination || "Banks, NIN, BVN & Passport"}`;
    } else if (ticket.category === "AGE_DECLARATION") {
      text += `Declared DOB: ${details.declaredDob || "N/A"}
Place of Birth: ${details.placeOfBirth || "N/A"}
State of Birth: ${details.stateOfBirth || "N/A"}
Reason for Affidavit: ${details.reason || "Birth Certificate Not Issued / Unavailable"}`;
    } else if (ticket.category === "CAC_CORPORATE") {
      text += `Company Name: ${details.companyName || "N/A"}
RC / BN Number: ${details.rcBnNumber || "N/A"}
Position: ${details.positionInCompany || "N/A"}
Document Lost: ${details.documentLost || "N/A"}
Matter: ${details.matter || "N/A"}`;
    } else if (ticket.category === "LOSS_OF_ITEM") {
      text += `Item / Document Lost: ${details.itemLost || "N/A"}
Serial / Ref Number: ${details.identifyingNumber || "N/A"}
Date of Loss: ${details.lossDate || "N/A"}
Circumstances / Location: ${details.circumstances || "N/A"}
Police Report No: ${details.policeReportNumber || "N/A"}`;
    } else if (ticket.category === "PROOF_OF_OWNERSHIP") {
      text += `Asset / Vehicle / Property: ${details.subject || "N/A"}
Serial / Engine / Chassis No: ${details.identifyingNumber || "N/A"}
Acquisition Details: ${details.acquisitionDetails || "N/A"}`;
    } else {
      text += `Title: ${details.title || "Sworn Affidavit"}
Clauses:\n${(details.statements || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}`;
    }

    return text;
  };

  // Build full affidavit legal draft
  const getFullAffidavitDraft = () => {
    const d = getDeponentCopyText();
    const f = getFactsCopyText();
    return `IN THE HIGH COURT OF JUSTICE
IN THE HIGH COURT REGISTRY

IN THE MATTER OF: ${ticket.category?.replace(/_/g, " ")}
AND IN THE MATTER OF THE STATUTORY DECLARATION / OATHS ACT

AFFIDAVIT

I, ${ticket.deponentFullName}, ${ticket.gender}, ${ticket.religion}, Nigerian citizen of ${ticket.residentialAddress}, do hereby make oath and state as follows:

1. That I am the deponent herein and a citizen of the Federal Republic of Nigeria.
2. That I was born on the ${ticket.dob} and I am currently ${ticket.age} years of age.
3. ${f.replace(/\n/g, "\n   ")}
4. That I depose to this affidavit conscientiously believing the same to be true and correct, and in accordance with the Statutory Declaration and Oaths Act.

__________________________
DEPONENT SIGNATURE

SWORN TO at the High Court Registry,
This _____ day of _______________ 2026.

BEFORE ME:

_____________________________________
COMMISSIONER FOR OATHS`;
  };

  const handleCopyText = (type: "DEPONENT" | "FACTS" | "DRAFT") => {
    let content = "";
    if (type === "DEPONENT") content = getDeponentCopyText();
    else if (type === "FACTS") content = getFactsCopyText();
    else content = getFullAffidavitDraft();

    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");

    try {
      if (actionType === "COMPLETE" && !certificateUrl.trim()) {
        throw new Error("You must upload the sealed High Court Affidavit PDF or picture to complete.");
      }
      if (actionType === "QUERY" && !queryReason.trim()) {
        throw new Error("Please provide a clear compliance query reason for the client.");
      }
      if (actionType === "REJECT" && !rejectionReason.trim()) {
        throw new Error("Please provide a rejection reason for refund audit.");
      }

      const res = await fetch("/api/mds/pipeline/affidavit/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType,
          certificateUrl,
          courtName,
          commissionerName,
          queryReason,
          rejectionReason,
          adminNotes,
          shouldRefund,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || "Action failed");
      }

      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans text-left">
      <div
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      <div className="relative w-full max-w-4xl h-full bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-white dark:bg-zinc-900 shrink-0 shadow-sm z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 text-[11px] font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {ticket.trackingId}
              </span>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                {ticket.category?.replace(/_/g, " ")}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {ticket.deponentFullName}
            </h2>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
              Client: {ticket.clientName} ({ticket.clientEmail}) • {ticket.clientPhone || "No Phone"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Universal 1-Click Copy Bar */}
        <div className="px-6 sm:px-8 py-3 bg-zinc-100/80 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
            Universal Copy:
          </span>

          <button
            type="button"
            onClick={() => handleCopyText("DEPONENT")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold shadow-xs hover:border-primary hover:text-primary transition-all cursor-pointer"
          >
            {copiedType === "DEPONENT" ? (
              <Check size={13} className="text-emerald-500" />
            ) : (
              <Copy size={13} />
            )}
            <span>{copiedType === "DEPONENT" ? "Copied Bio!" : "Copy Deponent Bio"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopyText("FACTS")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold shadow-xs hover:border-primary hover:text-primary transition-all cursor-pointer"
          >
            {copiedType === "FACTS" ? (
              <Check size={13} className="text-emerald-500" />
            ) : (
              <Copy size={13} />
            )}
            <span>{copiedType === "FACTS" ? "Copied Facts!" : "Copy Sworn Facts"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopyText("DRAFT")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold shadow-xs hover:bg-primary hover:text-white transition-all cursor-pointer"
          >
            {copiedType === "DRAFT" ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <CheckCheck size={13} />
            )}
            <span>{copiedType === "DRAFT" ? "Copied Full Draft!" : "Copy Full Affidavit Draft"}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 sm:px-8 flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <button
            onClick={() => setActiveTab("INFO")}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "INFO"
                ? "border-primary text-primary"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Deponent Particulars
          </button>
          <button
            onClick={() => setActiveTab("FACTS")}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "FACTS"
                ? "border-primary text-primary"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Sworn Facts &amp; Clauses
          </button>
          <button
            onClick={() => setActiveTab("MEDIA")}
            className={`py-3 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "MEDIA"
                ? "border-primary text-primary"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
          >
            Passport &amp; Signature
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* TAB 1: DEPONENT PARTICULARS */}
          {activeTab === "INFO" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Full Legal Name
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {ticket.deponentFullName}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Gender &amp; Age
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {ticket.gender} • {ticket.age} Years Old (DOB: {ticket.dob}) {ticket.isAdult && "• Adult"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Religion &amp; Nationality
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {ticket.religion} • {ticket.nationality}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Amount Charged
                  </span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ₦{Number(ticket.amountCharged).toLocaleString()}
                  </p>
                </div>

                <div className="md:col-span-2 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Residential Address
                  </span>
                  <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {ticket.residentialAddress}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACTS & CLAUSES */}
          {activeTab === "FACTS" && (
            <div className="space-y-4">
              {/* Change of Name Facts */}
              {ticket.category === "CHANGE_OF_NAME" && ticket.details && (
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Change of Name Specifics
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">Former Legal Name:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{ticket.details.oldName || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">New Legal Name:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{ticket.details.newName || "N/A"}</strong>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">Reason for Change:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{ticket.details.reason || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Usage Destination:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{ticket.details.usageDestination || "Official Records"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Age Declaration Facts */}
              {ticket.category === "AGE_DECLARATION" && ticket.details && (
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Declaration of Age Specifics
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">Declared Date of Birth:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{ticket.details.declaredDob || ticket.dob}</strong>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">Place of Birth:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{ticket.details.placeOfBirth}, {ticket.details.stateOfBirth} State</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Compulsory Reason for Affidavit:</span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-bold">{ticket.details.reason || "Birth Certificate Not Issued"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* CAC Corporate Facts */}
              {ticket.category === "CAC_CORPORATE" && ticket.details && (
                <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    CAC Corporate Specifics
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">Company Name:</span>
                      <strong className="text-zinc-900 dark:text-zinc-100">{ticket.details.companyName}</strong>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">RC / BN Number:</span>
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{ticket.details.rcBnNumber}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">Deponent Position:</span>
                      <span className="text-zinc-900 dark:text-zinc-100">{ticket.details.positionInCompany}</span>
                    </div>
                    {ticket.details.documentLost && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Lost Document:</span>
                        <span className="text-zinc-900 dark:text-zinc-100">{ticket.details.documentLost}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON Payload */}
              <div className="p-4 rounded-xl bg-zinc-950 text-zinc-200 text-xs font-mono overflow-x-auto">
                <pre>{JSON.stringify(ticket.details, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: MEDIA (PASSPORT & SIGNATURE) */}
          {activeTab === "MEDIA" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Deponent Passport Photo
                </span>
                {ticket.passportUrl ? (
                  <div className="space-y-2">
                    <img
                      src={ticket.passportUrl}
                      alt="Deponent Passport"
                      className="w-32 h-32 object-cover rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-xs"
                    />
                    <a
                      href={ticket.passportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                    >
                      <ExternalLink size={12} /> Open Full Photo
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No passport photo attached</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Deponent Specimen Signature
                </span>
                {ticket.signatureUrl ? (
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-white border border-zinc-200 shadow-inner inline-block">
                      <img
                        src={ticket.signatureUrl}
                        alt="Deponent Signature"
                        className="h-20 max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <a
                        href={ticket.signatureUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline"
                      >
                        <ExternalLink size={12} /> View Signature High-Res
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">No signature on file</p>
                )}
              </div>
            </div>
          )}

          {/* Stamped Certificate Preview if Completed */}
          {ticket.status === "COMPLETED" && ticket.certificateUrl && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                    Sealed Court Affidavit Delivered
                  </span>
                </div>
                <a
                  href={ticket.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <Download size={14} /> Download PDF
                </a>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Sealed under {ticket.courtName || "High Court Registry"} by {ticket.commissionerName || "Commissioner for Oaths"}.
              </p>
            </div>
          )}

          {/* ACTION PANEL FOR STAFF */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Staff Compliance Operations
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActionType("PROCESS")}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  actionType === "PROCESS"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Mark Processing (Triggers Email)
              </button>

              <button
                type="button"
                onClick={() => setActionType("COMPLETE")}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  actionType === "COMPLETE"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Complete &amp; Deliver Stamped PDF
              </button>

              <button
                type="button"
                onClick={() => setActionType("QUERY")}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  actionType === "QUERY"
                    ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Issue Compliance Query
              </button>

              <button
                type="button"
                onClick={() => setActionType("REJECT")}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  actionType === "REJECT"
                    ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                }`}
              >
                Reject &amp; Refund Wallet
              </button>
            </div>

            {/* PROCESS FORM */}
            {actionType === "PROCESS" && (
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                  <strong>Notification Notice:</strong> Clicking Execute will update the status to <strong>PROCESSING</strong> and send an automated court processing email to <strong>{ticket.clientEmail}</strong>.
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Admin Internal Notes (Optional)</label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Sent to Lagos High Court Commissioner for stamping"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            {/* COMPLETE FORM */}
            {actionType === "COMPLETE" && (
              <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Upload Sealed Court Affidavit (PDF or High-Res Image) <span className="text-rose-500">*</span>
                  </label>
                  <FileUpload
                    label="Upload Stamped PDF / High-Res Picture"
                    value={certificateUrl || null}
                    accept="application/pdf, image/jpeg, image/png"
                    onUploadSuccess={(url) => setCertificateUrl(url)}
                    onRemove={() => setCertificateUrl("")}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Court Registry Name</label>
                    <input
                      type="text"
                      value={courtName}
                      onChange={(e) => setCourtName(e.target.value)}
                      placeholder="e.g. High Court of Lagos State"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Commissioner for Oaths</label>
                    <input
                      type="text"
                      value={commissionerName}
                      onChange={(e) => setCommissionerName(e.target.value)}
                      placeholder="e.g. Barrister O. Adeleke"
                      className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* QUERY FORM */}
            {actionType === "QUERY" && (
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Query Reason (Displayed to client &amp; emailed) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={queryReason}
                  onChange={(e) => setQueryReason(e.target.value)}
                  placeholder="e.g. Deponent signature is blurry. Please re-upload a clean signature on white paper."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* REJECT FORM */}
            {actionType === "REJECT" && (
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in">
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-medium space-y-2">
                  <p>
                    <strong>Automatic Refund Notice:</strong> Rejecting this request can automatically credit ₦{Number(ticket.amountCharged).toLocaleString()} back to the client&apos;s wallet balance.
                  </p>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={shouldRefund}
                      onChange={(e) => setShouldRefund(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    <span className="font-bold text-xs text-rose-900 dark:text-rose-200">
                      Issue instant ₦{Number(ticket.amountCharged).toLocaleString()} wallet refund to client
                    </span>
                  </label>
                </div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Ineligible corporate resolution or falsified details."
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Submit Action Button */}
            {actionType && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleActionSubmit}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Executing Action...</span>
                    </>
                  ) : (
                    <span>Execute {actionType} Action</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
