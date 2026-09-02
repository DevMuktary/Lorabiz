// src/components/mds/nin-validation/NinValidationApplicationDrawer.tsx
"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Fingerprint, 
  User, 
  Mail, 
  Phone, 
  AlertTriangle, 
  Send,
  Loader2,
  RefreshCw,
  Tag,
  ShieldCheck,
  Zap,
  Code2,
  ChevronDown,
  ChevronUp,
  Edit3
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "SIM/Bank & VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod Validation)",
  PHOTO_ERROR: "Photographic Error",
};

export default function NinValidationApplicationDrawer({
  ticket: initialTicket,
  onClose,
  onUpdateSuccess,
}: {
  ticket: any | null;
  onClose: () => void;
  onUpdateSuccess?: (updatedTicket?: any) => void;
}) {
  const [ticket, setTicket] = useState<any | null>(initialTicket);
  const [activeAction, setActiveAction] = useState<"COMPLETE" | "FAIL" | "PROCESS" | "">("");
  const [failureReason, setFailureReason] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [issueRefund, setIssueRefund] = useState<boolean>(false);
  const [refundAmount, setRefundAmount] = useState<number | string>(initialTicket?.amountCharged || 0);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPushingToAbj, setIsPushingToAbj] = useState<boolean>(false);
  const [isSyncingStatus, setIsSyncingStatus] = useState<boolean>(false);
  const [isLinkingManual, setIsLinkingManual] = useState<boolean>(false);
  const [manualTicketInput, setManualTicketInput] = useState<string>("");
  const [showDebugJson, setShowDebugJson] = useState<boolean>(true); // Default to visible for easy diagnostics
  
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    setTicket(initialTicket);
    if (initialTicket) {
      setRefundAmount(initialTicket.amountCharged || 0);
    }
  }, [initialTicket]);

  if (!ticket) return null;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const statusColor =
    ticket.status === "COMPLETED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
      : ticket.status === "FAILED"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

  const categoryLabel = CATEGORY_LABELS[ticket.category] || ticket.category;

  // Handle Admin Manual Push to Abjiktech
  const handlePushToAbjiktech = async () => {
    setIsPushingToAbj(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: "PUSH_TO_PROVIDER",
          adminNotes: "Pushed to Abjiktech API via MDS Drawer",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        if (result.data) {
          setTicket(result.data);
          onUpdateSuccess?.(result.data);
        }
        throw new Error(result.error || "Failed to push ticket to Abjiktech.");
      }

      const updated = result.data || {
        ...ticket,
        externalStatus: "pending",
        lastSyncedAt: new Date().toISOString(),
      };
      setTicket(updated);
      setSuccessMsg(result.message || "Successfully transmitted to Abjiktech!");
      onUpdateSuccess?.(updated);
    } catch (err: any) {
      setError(err.message || "Failed to transmit to Abjiktech.");
    } finally {
      setIsPushingToAbj(false);
    }
  };

  // Handle Admin Live Status Check from Abjiktech
  const handleSyncAbjiktechStatus = async () => {
    setIsSyncingStatus(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: "SYNC_PROVIDER",
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch status from Abjiktech.");
      }

      const updated = {
        ...ticket,
        status: result.status || ticket.status,
        externalStatus: result.rawStatus || ticket.externalStatus,
        lastSyncedAt: new Date().toISOString(),
        apiResponse: result.rawStatus ? { status: result.rawStatus, message: result.message } : ticket.apiResponse,
      };

      setTicket(updated);
      setSuccessMsg(result.message || "Live status synced from Abjiktech!");
      onUpdateSuccess?.(updated);
    } catch (err: any) {
      setError(err.message || "Failed to sync status from Abjiktech.");
    } finally {
      setIsSyncingStatus(false);
    }
  };

  // Handle Manual Transaction/Ticket ID Linking
  const handleLinkManualTicket = async () => {
    if (!manualTicketInput.trim()) {
      setError("Please enter a valid Abjiktech Transaction ID.");
      return;
    }
    setIsProcessing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: "SET_EXTERNAL_TICKET",
          manualId: manualTicketInput.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to link transaction ID.");
      }

      const updated = result.data || {
        ...ticket,
        externalTxId: manualTicketInput.trim(),
      };
      setTicket(updated);
      setIsLinkingManual(false);
      setSuccessMsg(`Transaction ID ${manualTicketInput.trim()} linked successfully!`);
      onUpdateSuccess?.(updated);
    } catch (err: any) {
      setError(err.message || "Failed to link transaction ID.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionSubmit = async () => {
    setIsProcessing(true);
    setError("");
    setSuccessMsg("");

    try {
      if (!activeAction) {
        throw new Error("Please select an action to perform.");
      }

      if (activeAction === "FAIL" && !failureReason.trim()) {
        throw new Error("Please provide a reason for failing this validation.");
      }

      if (activeAction === "FAIL" && issueRefund && (!refundAmount || Number(refundAmount) <= 0)) {
        throw new Error("Please enter a valid refund amount.");
      }

      const response = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: activeAction,
          failureReason: failureReason.trim(),
          adminNotes: adminNotes.trim(),
          issueRefund,
          refundAmount: issueRefund ? Number(refundAmount) : 0,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Action execution failed.");
      }

      const updated = {
        ...ticket,
        status: activeAction === "COMPLETE" ? "COMPLETED" : activeAction === "FAIL" ? "FAILED" : "PROCESSING",
        failureReason: activeAction === "FAIL" ? failureReason : ticket.failureReason,
        completedAt: activeAction === "COMPLETE" ? new Date().toISOString() : ticket.completedAt,
      };

      setTicket(updated);
      setSuccessMsg(`Ticket successfully updated to ${activeAction}!`);
      onUpdateSuccess?.(updated);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  const hasPushedToAbj = Boolean(ticket.externalTicketId || ticket.externalTxId);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose} 
      />

      {/* Slide-over Content */}
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 z-10">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
              <span className={`px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md ${statusColor}`}>
                {ticket.status}
              </span>
              <span className="font-mono text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                {ticket.transactionRef}
              </span>
              {ticket.externalTxId && (
                <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-500/20">
                  ABJ: {ticket.externalTxId}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              {ticket.clientName}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Submitted on {format(new Date(ticket.createdAt), "PPP 'at' p")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Notification Banners */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold animate-in fade-in">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. NIN & VERIFICATION CATEGORY HERO */}
          <div className="p-5 rounded-2xl bg-zinc-900 text-white space-y-4 shadow-sm border border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint size={16} className="text-indigo-400" />
                <span>NIN To Validate</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs border border-indigo-500/30">
                {categoryLabel}
              </span>
            </div>

            <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-white">
                {ticket.nin}
              </span>
              <button
                type="button"
                onClick={() => handleCopy("nin_copy", ticket.nin)}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                {copiedKey === "nin_copy" ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedKey === "nin_copy" ? "Copied" : "Copy NIN"}</span>
              </button>
            </div>
          </div>

          {/* 2. ABJIKTECH GATEWAY & AUTOMATION PANEL */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border-2 border-indigo-500/30 dark:bg-indigo-950/30 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                <Zap size={15} className="text-indigo-500 fill-indigo-500" />
                <span>Abjiktech Automated Gateway</span>
              </div>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${
                hasPushedToAbj 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
              }`}>
                {hasPushedToAbj ? `Pushed (${ticket.externalStatus || "pending"})` : "Manual Queue (Not Pushed)"}
              </span>
            </div>

            {hasPushedToAbj ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Abjik Ticket ID</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{ticket.externalTicketId || "N/A"}</span>
                      {ticket.externalTicketId && (
                        <button
                          type="button"
                          onClick={() => handleCopy("ticket_id", ticket.externalTicketId)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400"
                        >
                          {copiedKey === "ticket_id" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-zinc-400">Abjik Transaction ID</span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 text-[11px] truncate max-w-[140px]">{ticket.externalTxId || "N/A"}</span>
                      {ticket.externalTxId && (
                        <button
                          type="button"
                          onClick={() => handleCopy("tx_id", ticket.externalTxId)}
                          className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400"
                        >
                          {copiedKey === "tx_id" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {ticket.apiMessage && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 italic bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                    "{ticket.apiMessage}"
                  </p>
                )}

                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-zinc-400">
                    {ticket.lastSyncedAt ? `Last Synced: ${format(new Date(ticket.lastSyncedAt), "p")}` : "Not synced yet"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLinkingManual(!isLinkingManual)}
                      className="px-2.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={12} />
                      <span>Edit ID</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSyncAbjiktechStatus}
                      disabled={isSyncingStatus}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isSyncingStatus ? "animate-spin" : ""} />
                      <span>{isSyncingStatus ? "Syncing..." : "Check Live Status"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  This request is queued in the manual ledger. Click the button below to transmit the 11-digit NIN and category (<strong>{categoryLabel}</strong>) to the Abjiktech verification engine.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePushToAbjiktech}
                    disabled={isPushingToAbj}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isPushingToAbj ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{isPushingToAbj ? "Transmitting..." : "Push to Abjiktech Gateway"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsLinkingManual(!isLinkingManual)}
                    className="px-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Link Manual ID
                  </button>
                </div>
              </div>
            )}

            {/* Manual ID Input */}
            {isLinkingManual && (
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 animate-in fade-in">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Input Abjiktech Transaction / Ticket ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. nin_val_649f... or TKT171000..."
                    value={manualTicketInput}
                    onChange={(e) => setManualTicketInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleLinkManualTicket}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Link ID
                  </button>
                </div>
              </div>
            )}

            {/* Always-Accessible Live Gateway Raw JSON Response Viewer */}
            <div className="pt-2 border-t border-indigo-500/20">
              <button
                type="button"
                onClick={() => setShowDebugJson(!showDebugJson)}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between w-full cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Code2 size={14} />
                  <span>Last Gateway JSON Response</span>
                </div>
                {showDebugJson ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showDebugJson && (
                <div className="mt-2.5 p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56 animate-in fade-in">
                  <div className="flex justify-between items-center mb-1.5 text-zinc-500 text-[10px] border-b border-zinc-800 pb-1">
                    <span>RAW GATEWAY RESPONSE</span>
                    <button
                      type="button"
                      onClick={() => handleCopy("debug_json", JSON.stringify(ticket.apiResponse || { message: ticket.apiMessage || "No raw JSON response recorded yet." }, null, 2))}
                      className="text-zinc-400 hover:text-zinc-100 cursor-pointer font-bold"
                    >
                      {copiedKey === "debug_json" ? "Copied!" : "Copy JSON"}
                    </button>
                  </div>
                  <pre>{JSON.stringify(ticket.apiResponse || { message: ticket.apiMessage || "No raw JSON recorded yet." }, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

          {/* 3. CLIENT & TICKET DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <User size={13} /> Client Details
              </span>
              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{ticket.clientName}</p>
                <p className="text-zinc-500 flex items-center gap-1">
                  <Mail size={12} /> {ticket.clientEmail}
                </p>
                <p className="text-zinc-500 flex items-center gap-1">
                  <Phone size={12} /> {ticket.clientPhone}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                <Tag size={13} /> Order Ledger
              </span>
              <div className="text-xs space-y-1 text-zinc-700 dark:text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount Paid:</span>
                  <span className="font-black text-zinc-900 dark:text-zinc-100">
                    ₦{Number(ticket.amountCharged).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status:</span>
                  <span className="font-bold">{ticket.status}</span>
                </div>
                {ticket.completedAt && (
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Completed:</span>
                    <span>{format(new Date(ticket.completedAt), "MMM dd, p")}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* 4. CURRENT FAILURE REASON (If FAILED) */}
          {ticket.status === "FAILED" && ticket.failureReason && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle size={14} /> Recorded Rejection Reason:
              </p>
              <p className="leading-relaxed pl-5">{ticket.failureReason}</p>
            </div>
          )}

          {/* 5. ADMIN OVERRIDE PANEL */}
          <div className="p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-5">
            <div>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                <ShieldCheck size={16} className="text-indigo-500" />
                <span>Manual Status Override</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Manually mark this ticket as Completed, Failed, or Queued if resolving outside the gateway.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveAction(activeAction === "COMPLETE" ? "" : "COMPLETE")}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeAction === "COMPLETE"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500"
                }`}
              >
                <CheckCircle size={15} />
                <span>Mark Completed</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveAction(activeAction === "FAIL" ? "" : "FAIL")}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeAction === "FAIL"
                    ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-rose-500"
                }`}
              >
                <XCircle size={15} />
                <span>Mark Failed</span>
              </button>
            </div>

            {/* Action Form Inputs */}
            {activeAction === "FAIL" && (
              <div className="space-y-3 p-4 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-200 dark:border-rose-500/20 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-rose-800 dark:text-rose-300 block">Failure / Rejection Reason</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. NIN does not exist in NIMC database, or invalid biometric match"
                    value={failureReason}
                    onChange={(e) => setFailureReason(e.target.value)}
                    className="w-full p-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-rose-200 dark:border-rose-500/20">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={issueRefund}
                      onChange={(e) => setIssueRefund(e.target.checked)}
                      className="rounded border-zinc-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Issue Refund to Client Wallet (₦{Number(ticket.amountCharged).toLocaleString()})
                    </span>
                  </label>
                </div>
              </div>
            )}

            {activeAction && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Admin Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Internal notes for this action..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleActionSubmit}
                  disabled={isProcessing}
                  className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{isProcessing ? "Executing Action..." : `Confirm ${activeAction} Override`}</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
