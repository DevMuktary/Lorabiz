"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { 
  ArrowLeft, Plus, ArrowsClockwise, 
  ShieldCheck, CheckCircle, Clock, XCircle,
  MagnifyingGlass, X, DownloadSimple, Eye, Copy, Check
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { BvnRetrievalStats, BvnRetrievalStatusFilter } from "@/components/features/bvn/retrieval/BvnRetrievalStats";
import { BvnRetrievalDetailsModal, BvnRetrievalRecord } from "@/components/features/bvn/retrieval/BvnRetrievalDetailsModal";

const ITEMS_PER_PAGE = 10;

export default function BvnRetrievalHistoryPage() {
  const [requests, setRequests] = useState<BvnRetrievalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<BvnRetrievalStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedRecord, setSelectedRecord] = useState<BvnRetrievalRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  const fetchHistory = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await fetch("/api/bvn/retrieval", { cache: "no-store" });
      const data = await res.json();
      if (data.history) setRequests(data.history);
    } catch (err) {
      console.error("Fetch BVN Retrieval history error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "PENDING").length;
    const processing = requests.filter((r) => r.status === "PROCESSING").length;
    const completed = requests.filter((r) => r.status === "COMPLETED").length;
    const failed = requests.filter((r) => r.status === "FAILED").length;
    return { total, pending, processing, completed, failed };
  }, [requests]);

  const handleCopyBvn = (e: React.MouseEvent, bvn: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bvn);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSlip = async (e: React.MouseEvent, url: string, bvn: string, id: string) => {
    e.stopPropagation();
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

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !query ||
        item.fullName?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.trackingId?.toLowerCase().includes(query) ||
        item.transactionRef?.toLowerCase().includes(query) ||
        (item.retrievedBvn && item.retrievedBvn.toLowerCase().includes(query));

      const matchesStatus = activeFilter === "ALL" || item.status === activeFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, activeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const handleOpenDetails = (record: BvnRetrievalRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/bvn/retrieval" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to BVN Retrieval Form
      </Link>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle weight="fill" className="h-5 w-5 shrink-0" />
            <span>BVN Retrieval request submitted successfully! Turnaround time is 1 to 24 hours.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSuccessToast(false)}
            className="text-xs text-white/80 hover:text-white font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nibss.png" 
              alt="NIBSS Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              NIBSS Bank Verification Number Portal
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">BVN Retrieval History</h1>
            <p className="text-muted-foreground text-sm">
              Track real-time status and retrieve your 11-digit BVN records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs sm:text-sm font-bold rounded-xl border border-border transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise weight="bold" className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link 
            href="/dashboard/bvn/retrieval" 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>New Retrieval</span>
          </Link>
        </div>
      </div>

      {/* Interactive Status Metrics Cards */}
      <BvnRetrievalStats
        stats={stats}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" weight="bold" />
          <input
            type="text"
            placeholder="Search tracking ID, name, phone, BVN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-8 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          Showing <span className="font-bold text-foreground">{filteredRequests.length}</span> of {requests.length} requests
        </div>
      </div>

      {/* History Table Container */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <ArrowsClockwise size={32} className="animate-spin text-emerald-600 mx-auto" weight="bold" />
          <p className="text-xs text-muted-foreground font-medium">Loading BVN retrieval history...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-16 text-center space-y-3 border border-border/80 border-dashed rounded-3xl bg-card/40 p-8">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
            <Clock size={26} weight="duotone" />
          </div>
          <h3 className="font-bold text-foreground text-sm">No Retrieval Records Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || activeFilter !== "ALL"
              ? "No applications match your search or filter criteria."
              : "You haven't submitted any BVN retrieval requests yet."}
          </p>
          {!searchQuery && activeFilter === "ALL" && (
            <Link
              href="/dashboard/bvn/retrieval"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black mt-2 shadow-sm cursor-pointer"
            >
              <Plus weight="bold" size={14} />
              <span>Submit First Retrieval</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4 bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-3">Tracking ID</th>
                  <th className="py-3 px-3">Applicant Name</th>
                  <th className="py-3 px-3">Linked Phone</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Retrieved BVN</th>
                  <th className="py-3 px-3">Submitted</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedRequests.map((item) => {
                  const statusBadge = 
                    item.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                    item.status === "FAILED" ? "bg-destructive/10 text-destructive border-destructive/20" :
                    item.status === "PROCESSING" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" :
                    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => handleOpenDetails(item)}
                      className="hover:bg-secondary/30 transition-colors cursor-pointer"
                    >
                      {/* Tracking ID */}
                      <td className="py-3.5 px-3 font-mono font-black text-foreground">
                        {item.trackingId}
                      </td>

                      {/* Applicant Name */}
                      <td className="py-3.5 px-3 font-bold text-foreground">
                        {item.fullName}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-3 font-mono text-muted-foreground">
                        {item.phone}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
                          {item.status === "COMPLETED" && <CheckCircle size={12} weight="fill" />}
                          {item.status === "PROCESSING" && <ArrowsClockwise size={12} className="animate-spin" weight="bold" />}
                          {item.status === "FAILED" && <XCircle size={12} weight="fill" />}
                          {item.status === "PENDING" && <Clock size={12} weight="bold" />}
                          <span>{item.status}</span>
                        </span>
                      </td>

                      {/* Retrieved BVN */}
                      <td className="py-3.5 px-3">
                        {item.status === "COMPLETED" && item.retrievedBvn ? (
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {item.retrievedBvn}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopyBvn(e, item.retrievedBvn!, item.id)}
                              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                              title="Copy BVN"
                            >
                              {copiedId === item.id ? <Check size={13} className="text-emerald-600" weight="bold" /> : <Copy size={13} weight="bold" />}
                            </button>
                          </div>
                        ) : item.status === "FAILED" ? (
                          <span className="text-destructive font-medium">Unsuccessful</span>
                        ) : (
                          <span className="text-muted-foreground font-mono text-[11px]">In Progress</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.createdAt), "MMM d, yyyy")}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDetails(item)}
                            className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer bg-background"
                          >
                            <Eye size={12} weight="bold" className="mr-1" />
                            <span>Details</span>
                          </Button>

                          {item.status === "COMPLETED" && item.slipUrl && (
                            <Button
                              size="sm"
                              onClick={(e) => handleDownloadSlip(e, item.slipUrl!, item.retrievedBvn || "Slip", item.id)}
                              disabled={downloadingId === item.id}
                              className="h-7 px-2.5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shadow-xs"
                            >
                              {downloadingId === item.id ? (
                                <ArrowsClockwise size={12} className="animate-spin" weight="bold" />
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
                Page <span className="font-bold text-foreground">{currentPage}</span> of <span className="font-bold text-foreground">{totalPages}</span>
              </span>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 text-xs font-bold cursor-pointer"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8 px-3 text-xs font-bold cursor-pointer"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal */}
      <BvnRetrievalDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRecord(null);
        }}
        record={selectedRecord}
      />

    </div>
  );
}
