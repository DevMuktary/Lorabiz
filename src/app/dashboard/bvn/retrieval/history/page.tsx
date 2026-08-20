"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { 
  ArrowLeft, Clock, CheckCircle, SpinnerGap, 
  MagnifyingGlass, X, Funnel, XCircle, Warning, Wallet, Copy, Check, DownloadSimple, Eye,
  IdentificationBadge, Phone, User, ShieldCheck, ArrowClockwise
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface BvnRetrievalRecord {
  id: string;
  trackingId: string;
  fullName: string;
  phone: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  retrievedBvn?: string | null;
  slipUrl?: string | null;
  failureReason?: string | null;
  adminNotes?: string | null;
  amountPaid: number;
  refundAmount?: number | null;
  isRefunded?: boolean;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function BvnRetrievalHistoryPage() {
  const [history, setHistory] = useState<BvnRetrievalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");

  const [selectedRecord, setSelectedRecord] = useState<BvnRetrievalRecord | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        setShowSuccessToast(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    }
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bvn/retrieval", { cache: "no-store" });
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch (err) {
      console.error("Fetch BVN Retrieval history error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleCopyBvn = (bvn: string, id: string) => {
    navigator.clipboard.writeText(bvn);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSlip = async (url: string, bvn: string, id: string) => {
    setDownloadingId(id);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch file");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `BVN_Slip_${bvn || "Retrieved"}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.fullName?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.trackingId?.toLowerCase().includes(query) ||
        item.transactionRef?.toLowerCase().includes(query) ||
        item.retrievedBvn?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredHistory, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      
      {/* SUCCESS TOAST BANNER */}
      {showSuccessToast && (
        <div className="bg-emerald-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} weight="fill" className="shrink-0" />
            <div>
              <h4 className="font-black text-sm">Request Submitted Successfully!</h4>
              <p className="text-xs opacity-90">Your BVN Retrieval is queued and will be processed within 1 to 24 hours.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="p-1 rounded-full hover:bg-emerald-600 cursor-pointer">
            <X size={18} weight="bold" />
          </button>
        </div>
      )}

      {/* Breadcrumb Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <Link 
            href="/dashboard/bvn/retrieval" 
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit mb-2"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Back to Retrieval Form
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <IdentificationBadge size={22} weight="bold" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                BVN Retrieval History &amp; Status
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Track your submitted recovery applications and access retrieved BVN numbers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchHistory}
            variant="outline"
            size="sm"
            className="h-9 px-3 text-xs font-bold gap-1.5 cursor-pointer bg-secondary border-border"
          >
            <ArrowClockwise size={14} className={isLoading ? "animate-spin" : ""} weight="bold" />
            <span>Refresh</span>
          </Button>

          <Link
            href="/dashboard/bvn/retrieval"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer"
          >
            <span>+ New Retrieval</span>
          </Link>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" weight="bold" />
          <input
            type="text"
            placeholder="Search tracking ID, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-secondary/50 rounded-xl border border-border">
          {(["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1 text-xs font-black rounded-lg transition-all cursor-pointer capitalize ${
                statusFilter === tab
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "ALL" ? "All" : tab.toLowerCase()}
            </button>
          ))}
        </div>

      </div>

      {/* History Table */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <SpinnerGap size={36} className="animate-spin text-emerald-600 mx-auto" weight="bold" />
          <p className="text-xs text-muted-foreground font-medium">Loading BVN retrieval requests...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-border/80 border-dashed rounded-3xl bg-card/40 p-8">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <IdentificationBadge size={26} weight="duotone" />
          </div>
          <h3 className="font-bold text-foreground text-sm">No Retrieval Records Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL"
              ? "No applications match your search or filter criteria."
              : "You haven't submitted any BVN retrieval requests yet."}
          </p>
          {!searchQuery && statusFilter === "ALL" && (
            <Link
              href="/dashboard/bvn/retrieval"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black mt-2 shadow-sm"
            >
              <span>Submit First Request</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Applicant Name</th>
                  <th className="py-3 px-3">Linked Phone</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Retrieved BVN</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedHistory.map((item) => {
                  const statusBadge = 
                    item.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                    item.status === "FAILED" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    item.status === "PROCESSING" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" :
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                  return (
                    <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                      
                      {/* Tracking ID */}
                      <td className="py-3.5 px-3 font-mono font-black text-foreground">
                        {item.trackingId}
                      </td>

                      {/* Full Name */}
                      <td className="py-3.5 px-3 font-bold text-foreground">
                        {item.fullName}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3 font-mono text-muted-foreground">
                        {item.phone}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                          {item.status === "COMPLETED" && <CheckCircle size={11} weight="fill" />}
                          {item.status === "PROCESSING" && <SpinnerGap size={11} className="animate-spin" weight="bold" />}
                          {item.status === "FAILED" && <XCircle size={11} weight="fill" />}
                          {item.status === "PENDING" && <Clock size={11} weight="bold" />}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Retrieved BVN */}
                      <td className="py-3.5 px-3">
                        {item.status === "COMPLETED" && item.retrievedBvn ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {item.retrievedBvn}
                            </span>
                            <button
                              onClick={() => handleCopyBvn(item.retrievedBvn!, item.id)}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy BVN"
                            >
                              {copiedId === item.id ? <Check size={13} className="text-emerald-600" weight="bold" /> : <Copy size={13} weight="bold" />}
                            </button>
                          </div>
                        ) : item.status === "FAILED" ? (
                          <span className="text-destructive font-medium">Unsuccessful</span>
                        ) : (
                          <span className="text-muted-foreground font-mono">In Progress</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedRecord(item)}
                            className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer bg-background"
                          >
                            <Eye size={12} weight="bold" className="mr-1" />
                            <span>Details</span>
                          </Button>

                          {item.status === "COMPLETED" && item.slipUrl && (
                            <Button
                              size="sm"
                              onClick={() => handleDownloadSlip(item.slipUrl!, item.retrievedBvn || "Slip", item.id)}
                              disabled={downloadingId === item.id}
                              className="h-7 px-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shadow-xs"
                            >
                              {downloadingId === item.id ? (
                                <SpinnerGap size={12} className="animate-spin" weight="bold" />
                              ) : (
                                <>
                                  <DownloadSimple size={12} weight="bold" className="mr-1" />
                                  <span>Slip</span>
                                </>
                              )}
                            </Button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border gap-3 text-xs">
              <span className="text-muted-foreground font-medium">
                Page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span> ({filteredHistory.length} total)
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs font-bold"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      {selectedRecord && (
        <div 
          className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="relative w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IdentificationBadge size={18} weight="bold" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground">BVN Retrieval Ticket</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">{selectedRecord.trackingId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Status Banner */}
            <div className="p-3.5 rounded-2xl border border-border bg-secondary/40 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-muted-foreground">Application Status</span>
                <span className="text-xs font-black uppercase text-foreground">{selectedRecord.status}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {selectedRecord.status === "COMPLETED" && "Your BVN has been successfully retrieved from NIBSS records."}
                {selectedRecord.status === "PROCESSING" && "Our operations team is currently executing the search with NIBSS."}
                {selectedRecord.status === "PENDING" && "Queued for processing. Expected turnaround is 1 to 24 hours."}
                {selectedRecord.status === "FAILED" && "Your retrieval could not be fulfilled. See the reason below."}
              </p>
            </div>

            {/* Completed BVN Display */}
            {selectedRecord.status === "COMPLETED" && selectedRecord.retrievedBvn && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Retrieved 11-Digit BVN
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black font-mono tracking-wider text-emerald-700 dark:text-emerald-300">
                    {selectedRecord.retrievedBvn}
                  </span>
                  <button
                    onClick={() => handleCopyBvn(selectedRecord.retrievedBvn!, selectedRecord.id)}
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    title="Copy BVN"
                  >
                    {copiedId === selectedRecord.id ? <Check size={14} weight="bold" /> : <Copy size={14} weight="bold" />}
                  </button>
                </div>
              </div>
            )}

            {/* Failure Reason Display */}
            {selectedRecord.status === "FAILED" && selectedRecord.failureReason && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-destructive">
                  Reason for Failure
                </span>
                <p className="text-xs text-destructive leading-relaxed">
                  {selectedRecord.failureReason}
                </p>
                {selectedRecord.isRefunded && (
                  <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    &#10004; Full refund of ₦{Number(selectedRecord.refundAmount || selectedRecord.amountPaid).toLocaleString()} credited to your wallet.
                  </p>
                )}
              </div>
            )}

            {/* Ticket Details List */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Applicant Name:</span>
                <span className="font-bold text-foreground text-right">{selectedRecord.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Linked Phone:</span>
                <span className="font-mono font-bold text-foreground">{selectedRecord.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Amount Paid:</span>
                <span className="font-black text-foreground">₦{Number(selectedRecord.amountPaid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/60">
                <span className="text-muted-foreground">Transaction Reference:</span>
                <span className="font-mono text-muted-foreground text-[11px]">{selectedRecord.transactionRef}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Submitted At:</span>
                <span className="text-muted-foreground">{format(new Date(selectedRecord.createdAt), "PPP 'at' p")}</span>
              </div>
            </div>

            {/* Download Slip action if available */}
            {selectedRecord.status === "COMPLETED" && selectedRecord.slipUrl && (
              <Button
                onClick={() => handleDownloadSlip(selectedRecord.slipUrl!, selectedRecord.retrievedBvn || "Slip", selectedRecord.id)}
                disabled={downloadingId === selectedRecord.id}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {downloadingId === selectedRecord.id ? (
                  <SpinnerGap size={16} className="animate-spin" weight="bold" />
                ) : (
                  <>
                    <DownloadSimple size={16} weight="bold" />
                    <span>Download Official BVN Slip</span>
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => setSelectedRecord(null)}
              className="w-full h-10 text-xs font-bold cursor-pointer"
            >
              Close
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
