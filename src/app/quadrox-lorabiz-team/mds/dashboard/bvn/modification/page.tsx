"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle, 
  Eye, FileText, Download, User, Phone, Calendar, ArrowRight, RotateCcw, 
  UploadCloud, X, Check, Filter, Upload, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminBvnModificationPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [actionType, setActionType] = useState<"PROCESSING" | "COMPLETE" | "REJECT" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [slipUrl, setSlipUrl] = useState("");
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [issueRefund, setIssueRefund] = useState(true);
  const [refundAmount, setRefundAmount] = useState<number | string>("");

  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const url = new URL("/api/mds/bvn/modification", window.location.origin);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString(), { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setRequests(data.requests || []);
        }
      }
    } catch (err) {
      console.error("Failed to load admin BVN modifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  // Handle direct file upload to Cloudinary/API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingSlip(true);
    setActionErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload file");
      }

      setSlipUrl(data.url);
    } catch (err: any) {
      console.error("Slip upload error:", err);
      setActionErrorMsg(err.message || "Failed to upload modification slip.");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleOpenActionModal = (r: any) => {
    setSelectedRequest(r);
    setActionType(null);
    setAdminNotes(r.adminNotes || "");
    setRejectionReason(r.rejectionReason || "");
    setSlipUrl(r.slipUrl || "");
    setIssueRefund(true);
    setRefundAmount(r.amountPaid || 0);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
  };

  const handleExecuteAdminAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsExecutingAction(true);
    setActionErrorMsg(null);

    try {
      const payload = {
        id: selectedRequest.id,
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
        throw new Error(data.message || "Failed to process request.");
      }

      setActionSuccessMsg(data.message || "Action executed successfully.");
      setTimeout(() => {
        setActionSuccessMsg(null);
        setSelectedRequest(null);
        setActionType(null);
        setAdminNotes("");
        setRejectionReason("");
        setSlipUrl("");
        fetchRequests();
      }, 1500);
    } catch (err: any) {
      setActionErrorMsg(err.message || "Action failed.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Stats
  const totalCount = requests.length;
  const pendingCount = requests.filter((r) => r.status === "PENDING" || r.status === "PROCESSING").length;
  const completedCount = requests.filter((r) => r.status === "COMPLETED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
            <ShieldCheck size={12} />
            MDS Compliance Management
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">BVN Modifications Queue</h1>
          <p className="text-zinc-400 text-xs sm:text-sm">
            Review user-submitted legal modifications, verify affidavits, approve with resolution slips, or decline with custom refund options.
          </p>
        </div>

        <Button
          onClick={fetchRequests}
          variant="outline"
          className="h-10 text-xs font-bold gap-1.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          <span>Refresh Queue</span>
        </Button>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Total Applications</span>
          <p className="text-2xl font-black text-white mt-1">{totalCount}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Pending / In Review</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Completed &amp; Slips Issued</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{completedCount}</p>
        </div>
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4">
          <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Rejected Applications</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            placeholder="Search tracking ID, BVN, name, or email..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "PROCESSING", "COMPLETED", "REJECTED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-zinc-900/60 text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Loading modification queue...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-bold">
            No BVN modification applications found in this view.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-mono uppercase text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Tracking ID</th>
                  <th className="py-3.5 px-4 font-bold">Enrolling Bank</th>
                  <th className="py-3.5 px-4 font-bold">User</th>
                  <th className="py-3.5 px-4 font-bold">BVN &amp; Name</th>
                  <th className="py-3.5 px-4 font-bold">Amount Paid</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-medium">
                {requests.map((r) => {
                  return (
                    <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-emerald-400">
                        {r.trackingId}
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        {r.enrollingBank}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-white font-bold">{[r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || "User"}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{r.user?.email}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-white">{r.bvn}</div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[140px]">{r.currentFullName}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        ₦{Number(r.amountPaid).toLocaleString()}
                        {r.surchargeApplied && <span className="block text-[10px] text-amber-400 font-normal">+Surcharge</span>}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          r.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                          r.status === "PROCESSING" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                          r.status === "REJECTED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleOpenActionModal(r)}
                          className="h-8 px-3 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer"
                        >
                          Review &amp; Action
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Review Modal */}
      {selectedRequest && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedRequest(null)}
        >
          <div 
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300 my-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">MDS Review Portal</span>
                <h3 className="text-base font-black text-white font-mono">{selectedRequest.trackingId}</h3>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Request Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
              <div>
                <span className="text-zinc-500 font-medium">Enrolling Bank:</span>
                <p className="font-bold text-white">{selectedRequest.enrollingBank}</p>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Target BVN:</span>
                <p className="font-mono font-bold text-white text-sm">{selectedRequest.bvn}</p>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Applicant:</span>
                <p className="font-bold text-white">{[selectedRequest.user?.firstName, selectedRequest.user?.lastName].filter(Boolean).join(" ") || "User"} ({selectedRequest.user?.email})</p>
              </div>
              <div>
                <span className="text-zinc-500 font-medium">Amount Paid:</span>
                <p className="font-bold text-emerald-400">₦{Number(selectedRequest.amountPaid).toLocaleString()}</p>
              </div>
            </div>

            {/* Modifications requested */}
            <div className="space-y-2.5 text-xs">
              <h4 className="font-bold uppercase text-zinc-400 text-[11px]">Requested Updates</h4>
              {selectedRequest.modifyName && (
                <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">New Legal Name:</span>
                  <strong className="block text-white mt-0.5">
                    {[selectedRequest.newFirstName, selectedRequest.newMiddleName, selectedRequest.newLastName].filter(Boolean).join(" ")}
                  </strong>
                </div>
              )}
              {selectedRequest.modifyPhone && (
                <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">New Phone Number:</span>
                  <strong className="block font-mono text-white mt-0.5">{selectedRequest.newPhone}</strong>
                </div>
              )}
              {selectedRequest.modifyDob && (
                <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800">
                  <span className="text-zinc-400">New Date of Birth:</span>
                  <strong className="block text-white mt-0.5">
                    {selectedRequest.newDob} (Current: {selectedRequest.currentDob || "N/A"}) - {selectedRequest.yearsDifference} yrs shift
                  </strong>
                </div>
              )}
            </div>

            {/* Action Selector */}
            <div className="space-y-3 pt-2 border-t border-zinc-800">
              <h4 className="font-bold uppercase text-zinc-400 text-[11px]">Select Action</h4>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActionType("PROCESSING")}
                  className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                    actionType === "PROCESSING" 
                      ? "bg-sky-500/20 border-sky-500 text-sky-300"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  Mark Processing
                </button>

                <button
                  type="button"
                  onClick={() => setActionType("COMPLETE")}
                  className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                    actionType === "COMPLETE" 
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  Approve &amp; Upload Slip
                </button>

                <button
                  type="button"
                  onClick={() => setActionType("REJECT")}
                  className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer transition-colors ${
                    actionType === "REJECT" 
                      ? "bg-rose-500/20 border-rose-500 text-rose-300"
                      : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  Reject &amp; Action
                </button>
              </div>

              {/* Conditional Inputs: COMPLETE (Direct Slip Upload + URL Fallback) */}
              {actionType === "COMPLETE" && (
                <div className="space-y-3 p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">
                      Upload NIBSS BVN Resolution Slip (PDF or Image) <span className="text-rose-500">*</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-all shrink-0">
                        {isUploadingSlip ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Uploading Slip...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={14} />
                            <span>Choose File to Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="application/pdf,image/*"
                          onChange={handleFileUpload}
                          disabled={isUploadingSlip}
                          className="hidden"
                        />
                      </label>

                      {slipUrl && (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono truncate">
                          <CheckCircle2 size={14} className="shrink-0" />
                          <span className="truncate max-w-[200px]">{slipUrl}</span>
                          <a
                            href={slipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs underline text-zinc-300 hover:text-white shrink-0"
                          >
                            Preview
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-zinc-500 block mb-1">Or direct URL:</span>
                    <input
                      type="text"
                      value={slipUrl}
                      onChange={(e) => setSlipUrl(e.target.value)}
                      placeholder="https://res.cloudinary.com/.../slip.pdf"
                      className="w-full h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Inputs: REJECT (Reason + Optional Refund Checkbox + Amount) */}
              {actionType === "REJECT" && (
                <div className="space-y-3 p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800">
                  <div>
                    <label className="text-xs font-bold text-rose-400 block mb-1.5">
                      Rejection Reason (Sent to user via email and in-app alert) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Enrolling bank mismatch or details not reflecting on VNIN."
                      className="w-full p-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-white"
                      required
                    />
                  </div>

                  {/* Admin Controlled Refund Box */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={issueRefund}
                        onChange={(e) => setIssueRefund(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white">
                        Issue Wallet Refund to User?
                      </span>
                    </label>

                    {issueRefund && (
                      <div className="pl-6.5 space-y-1">
                        <label className="text-[11px] font-bold text-zinc-400 block">
                          Refund Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="Amount in ₦"
                          className="w-full sm:w-48 h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-mono font-bold text-emerald-400"
                        />
                        <span className="text-[10px] text-zinc-500 block">
                          Default is full service fee (₦{Number(selectedRequest.amountPaid).toLocaleString()}). You can adjust or zero out.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-zinc-400">Admin Internal Notes (Optional)</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Verified against NIBSS portal batch #894"
                  className="w-full h-10 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-xs text-white"
                />
              </div>

              {actionErrorMsg && (
                <p className="text-xs font-bold text-rose-400">{actionErrorMsg}</p>
              )}

              {actionSuccessMsg && (
                <p className="text-xs font-bold text-emerald-400">{actionSuccessMsg}</p>
              )}

              {/* Submit Action */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="flex-1 h-11 text-xs font-bold border-zinc-800 bg-zinc-950 text-zinc-400 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!actionType || isExecutingAction || isUploadingSlip || (actionType === "REJECT" && !rejectionReason.trim()) || (actionType === "COMPLETE" && !slipUrl.trim())}
                  onClick={handleExecuteAdminAction}
                  className={`flex-1 h-11 font-black text-xs rounded-xl cursor-pointer ${
                    actionType === "REJECT" 
                      ? "bg-rose-600 hover:bg-rose-700 text-white" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  {isExecutingAction ? "Processing..." : "Confirm & Save Action"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
