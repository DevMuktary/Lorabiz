// src/app/quadrox-lorabiz-team/mds/dashboard/orders/nin-validation/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  Fingerprint, 
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Code2,
  Send,
  AlertTriangle
} from "lucide-react";
import NinValidationApplicationDrawer from "@/components/mds/nin-validation/NinValidationApplicationDrawer";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "SIM/Bank & VNIN",
  UPDATE_RECORD_MOD: "Modification",
  PHOTO_ERROR: "Photo Error",
};

export default function NinValidationAdminPipelinePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [pushFilter, setPushFilter] = useState<"ALL" | "PUSHED" | "NOT_PUSHED">("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 15;
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [quickPushingId, setQuickPushingId] = useState<string | null>(null);
  const [quickSyncingId, setQuickSyncingId] = useState<string | null>(null);
  const [jsonModalData, setJsonModalData] = useState<{ title: string; json: any } | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/pipeline/nin-validation");
      if (!res.ok) throw new Error("Failed to fetch NIN Validation pipeline");
      const result = await res.json();
      setPipeline(result.pipeline || []);
    } catch (error) {
      console.error("Pipeline error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab, categoryFilter, pushFilter, sortOrder]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Quick Inline Push to Gateway
  const handleQuickPush = async (ticket: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickPushingId(ticket.id);
    try {
      const res = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: "PUSH_TO_PROVIDER",
          adminNotes: "Pushed via Quick Table Action",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchPipeline();
        if (selectedTicket?.id === ticket.id && data.data) {
          setSelectedTicket(data.data);
        }
      } else {
        alert(data.error || "Failed to push to Abjiktech");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setQuickPushingId(null);
    }
  };

  // Quick Inline Sync Status
  const handleQuickSync = async (ticket: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickSyncingId(ticket.id);
    try {
      const res = await fetch("/api/mds/pipeline/nin-validation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: ticket.id,
          actionType: "SYNC_PROVIDER",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchPipeline();
      } else {
        alert(data.error || "Failed to sync status");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setQuickSyncingId(null);
    }
  };

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const matchesSearch =
        ticket.nin?.includes(searchTerm) ||
        ticket.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.externalTxId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.externalTicketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientPhone?.includes(searchTerm);

      const matchesTab = activeTab === "ALL" || ticket.status === activeTab;
      const matchesCategory = categoryFilter === "ALL" || ticket.category === categoryFilter;
      
      const isPushed = Boolean(ticket.externalTxId || ticket.externalTicketId);
      const matchesPush = pushFilter === "ALL" || (pushFilter === "PUSHED" ? isPushed : !isPushed);

      return matchesSearch && matchesTab && matchesCategory && matchesPush;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, categoryFilter, pushFilter, sortOrder]);

  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: pipeline.length,
    processing: pipeline.filter((t) => t.status === "PROCESSING").length,
    completed: pipeline.filter((t) => t.status === "COMPLETED").length,
    failed: pipeline.filter((t) => t.status === "FAILED").length,
    pushed: pipeline.filter((t) => t.externalTxId || t.externalTicketId).length,
    unpushed: pipeline.filter((t) => t.status === "PROCESSING" && !t.externalTxId && !t.externalTicketId).length,
  }), [pipeline]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 font-sans">
      
      {/* Header & Back Button */}
      <div>
        <Link 
          href="/quadrox-lorabiz-team/mds/dashboard/orders" 
          className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Fingerprint className="text-indigo-500" size={24} />
              <span>NIN Validation Operations Ledger</span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Live gateway tracking, automated Abjiktech transmission, and JSON response diagnostics.
            </p>
          </div>
          <button 
            onClick={fetchPipeline}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={16} className={`mr-2 ${isLoading ? "animate-spin text-indigo-500" : ""}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{stats.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shadow-sm">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Awaiting Push (Unsent)</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.unpushed}</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 shadow-sm">
          <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">Pushed to Gateway</p>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-1">{stats.pushed}</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Completed</p>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{stats.completed}</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 shadow-sm">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Failed / Rejected</p>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">{stats.failed}</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton label="All Submissions" count={pipeline.length} isActive={activeTab === "ALL"} onClick={() => setActiveTab("ALL")} />
          <TabButton label="Processing (Action Needed)" count={stats.processing} isActive={activeTab === "PROCESSING"} onClick={() => setActiveTab("PROCESSING")} alert={stats.unpushed > 0} />
          <TabButton label="Completed" count={stats.completed} isActive={activeTab === "COMPLETED"} onClick={() => setActiveTab("COMPLETED")} />
          <TabButton label="Failed" count={stats.failed} isActive={activeTab === "FAILED"} onClick={() => setActiveTab("FAILED")} />
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by NIN, Client, Ref, or Abjik Tx ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Gateway Push Filter */}
            <select
              value={pushFilter}
              onChange={(e) => setPushFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Gateway States</option>
              <option value="PUSHED">✓ Pushed to Abjiktech</option>
              <option value="NOT_PUSHED">⚠️ Not Pushed (Queued)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="NO_RECORD_FOUND">No Record Found</option>
              <option value="VNIN_VALIDATION">SIM/Bank & VNIN</option>
              <option value="UPDATE_RECORD_MOD">Modification</option>
              <option value="PHOTO_ERROR">Photographic Error</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>

        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">11-Digit NIN</th>
                <th className="py-3 px-4">Gateway / Transmission</th>
                <th className="py-3 px-4">Last Gateway Reply</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-400">
                    <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto mb-2" />
                    <span>Loading validation pipeline records...</span>
                  </td>
                </tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-zinc-400">
                    <Fingerprint size={32} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">No validation requests found</p>
                    <p className="text-xs text-zinc-500 mt-0.5">No tickets matched the current filter or search criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((ticket) => {
                  const categoryLabel = CATEGORY_LABELS[ticket.category] || ticket.category;
                  const formattedDate = format(new Date(ticket.createdAt), "MMM dd, yyyy · p");
                  const isPushed = Boolean(ticket.externalTxId || ticket.externalTicketId);
                  const isQuickPushing = quickPushingId === ticket.id;
                  const isQuickSyncing = quickSyncingId === ticket.id;

                  return (
                    <tr key={ticket.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                      
                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{ticket.clientName}</div>
                        <div className="text-[11px] text-zinc-500">{ticket.clientEmail}</div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[11px] border border-zinc-200 dark:border-zinc-700">
                          {categoryLabel}
                        </span>
                      </td>

                      {/* 11-Digit NIN with 1-click COPY */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-sm text-zinc-900 dark:text-zinc-100 tracking-wider">
                            {ticket.nin}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(ticket.id, ticket.nin)}
                            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Copy 11-digit NIN"
                          >
                            {copiedKey === ticket.id ? (
                              <Check size={13} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-400 block">{ticket.transactionRef}</span>
                      </td>

                      {/* Gateway / Push Status Column */}
                      <td className="py-3.5 px-4">
                        {isPushed ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                              <Zap size={11} className="fill-indigo-500" />
                              <span>PUSHED ({ticket.externalStatus || "pending"})</span>
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500 block truncate max-w-[130px]" title={ticket.externalTxId || ticket.externalTicketId}>
                              ID: {ticket.externalTxId || ticket.externalTicketId}
                            </span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              <Clock size={11} />
                              <span>NOT PUSHED (Queued)</span>
                            </span>
                            {ticket.status === "PROCESSING" && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickPush(ticket, e)}
                                disabled={isQuickPushing}
                                className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                              >
                                <Send size={10} className={isQuickPushing ? "animate-spin" : ""} />
                                <span>{isQuickPushing ? "Pushing..." : "Push to Gateway"}</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Last Gateway Reply & JSON Viewer Chip */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[180px]">
                          {ticket.apiMessage ? (
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate italic" title={ticket.apiMessage}>
                              "{ticket.apiMessage}"
                            </p>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">No message yet</span>
                          )}

                          {ticket.apiResponse && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setJsonModalData({
                                  title: `Gateway JSON — NIN ${ticket.nin} (${ticket.transactionRef})`,
                                  json: ticket.apiResponse,
                                });
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                            >
                              <Code2 size={11} />
                              <span>View Raw JSON</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusPill status={ticket.status} />
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap text-[11px]">
                        {formattedDate}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPushed && ticket.status === "PROCESSING" && (
                            <button
                              type="button"
                              onClick={(e) => handleQuickSync(ticket, e)}
                              disabled={isQuickSyncing}
                              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs transition-colors cursor-pointer"
                              title="Sync Status with Abjiktech"
                            >
                              <RefreshCw size={13} className={isQuickSyncing ? "animate-spin text-indigo-500" : ""} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedTicket(ticket)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-500/20 shadow-sm"
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between text-xs text-zinc-500">
            <span>Showing page {currentPage} of {totalPages} ({filteredPipeline.length} records)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 disabled:opacity-40 hover:bg-zinc-50 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 disabled:opacity-40 hover:bg-zinc-50 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Slide-over Inspection & Action Drawer (Keeps open upon updates!) */}
      <NinValidationApplicationDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdateSuccess={(updatedTicket) => {
          if (updatedTicket) {
            setSelectedTicket(updatedTicket);
          }
          fetchPipeline();
        }}
      />

      {/* Standalone JSON Modal Viewer */}
      {jsonModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <Code2 size={16} className="text-indigo-500" />
                <span>{jsonModalData.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setJsonModalData(null)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-950 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[400px] border border-zinc-800">
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => handleCopy("modal_json", JSON.stringify(jsonModalData.json, null, 2))}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                >
                  {copiedKey === "modal_json" ? "Copied!" : "Copy JSON"}
                </button>
              </div>
              <pre>{JSON.stringify(jsonModalData.json, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TabButton({ label, count, isActive, onClick, alert }: { label: string; count: number; isActive: boolean; onClick: () => void; alert?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3.5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
        isActive
          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-500/5"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
          alert
            ? "bg-amber-500 text-white animate-pulse"
            : isActive
            ? "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 size={12} />
        <span>COMPLETED</span>
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
        <XCircle size={12} />
        <span>FAILED</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
      <Clock size={12} className="animate-spin" />
      <span>PROCESSING</span>
    </span>
  );
}
