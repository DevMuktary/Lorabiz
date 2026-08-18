"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock, 
  ChevronLeft, ChevronRight, Copy, Check, Fingerprint, Filter, FileText
} from "lucide-react";
import PersonalizationDrawer from "@/components/mds/personalization/PersonalizationDrawer";

export default function PersonalizationPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/pipeline/personalization");
      if (!res.ok) throw new Error("Failed to fetch Personalization pipeline");
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
  }, [searchTerm, activeTab, sortOrder]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const matchesSearch =
        ticket.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.resolvedNin && ticket.resolvedNin.includes(searchTerm));

      const matchesTab = activeTab === "ALL" || ticket.status === activeTab;

      return matchesSearch && matchesTab;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, sortOrder]);

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
  }), [pipeline]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      {/* Header & Back Button */}
      <div>
        <Link 
          href="/quadrox-lorabiz-team/mds/dashboard/orders" 
          className="inline-flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Operations Hub
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Fingerprint className="text-emerald-500" size={24} /> NIN Personalization Pipeline
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Live fulfillment queue for enrollment tracking ID personalization and NIN slip retrievals.
            </p>
          </div>
          <button
            onClick={fetchPipeline}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm transition-all"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> Refresh Pipeline
          </button>
        </div>
      </div>

      {/* Metrics Row - Interactive Filtering */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "ring-2 ring-zinc-900 dark:ring-white border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800 shadow-md"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 shadow-sm"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Requests</span>
          <div className="text-2xl font-black text-zinc-900 dark:text-white mt-1">{stats.total}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PROCESSING")}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "PROCESSING"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md"
              : "bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/50 shadow-sm"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <Clock size={14} /> In Processing
          </span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.processing}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("COMPLETED")}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "COMPLETED"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-md"
              : "bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/50 shadow-sm"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Completed
          </span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</div>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("FAILED")}
          className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "FAILED"
              ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/15 shadow-md"
              : "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 hover:border-rose-500/50 shadow-sm"
          }`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <XCircle size={14} /> Failed / Rejected
          </span>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.failed}</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by Tracking ID, Reference, Client Name, Email, or NIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={(e: any) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 focus:outline-none"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-2 overflow-x-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {(["ALL", "PROCESSING", "COMPLETED", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab === "ALL" ? "All Orders" : tab === "PROCESSING" ? "Processing" : tab === "COMPLETED" ? "Completed" : "Failed"}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-medium">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Tracking ID</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Resolved NIN</th>
                <th className="py-3.5 px-4">Fee</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <RefreshCw className="animate-spin inline-block mr-2" size={16} /> Loading Personalization pipeline...
                  </td>
                </tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No Personalization orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((item) => {
                  const statusBadge =
                    item.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : item.status === "FAILED"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-600 border-amber-500/20";

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {item.trackingId}
                          <button
                            onClick={() => handleCopy(item.id, item.trackingId)}
                            className="text-zinc-400 hover:text-zinc-600"
                          >
                            {copiedKey === item.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">{item.reference}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">{item.clientName}</div>
                        <div className="text-[10px] text-zinc-400 font-mono">{item.clientEmail}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {item.provider || "DATAVERIFY"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}`}>
                          {item.status === "PROCESSING" ? "Processing" : item.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.resolvedNin ? (
                          <span className="font-mono font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                            {item.resolvedNin}
                          </span>
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-zinc-700 dark:text-zinc-300">
                        ₦{Number(item.amountCharged).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                        {format(new Date(item.createdAt), "MMM d, h:mm a")}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTicket(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg transition-all"
                        >
                          <Eye size={13} /> Manage
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Page {currentPage} of {totalPages} ({filteredPipeline.length} total)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Drawer */}
      {selectedTicket && (
        <PersonalizationDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateSuccess={() => {
            setSelectedTicket(null);
            fetchPipeline();
          }}
        />
      )}
    </div>
  );
}
