"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, Search, RefreshCw, Eye, CheckCircle2, XCircle, Clock, Zap, 
  ChevronLeft, ChevronRight, Copy, Check, Fingerprint, Filter
} from "lucide-react";
import IpeApplicationDrawer from "@/components/mds/ipe/IpeApplicationDrawer";

export default function IpePipelinePage() {
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
      const res = await fetch("/api/mds/pipeline/ipe");
      if (!res.ok) throw new Error("Failed to fetch IPE pipeline");
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
          <ArrowLeft size={14} className="mr-1.5" /> Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
              <Fingerprint className="text-teal-500" size={26} />
              NIMC IPE Clearance Directory
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 rounded-full uppercase tracking-wider flex items-center">
                <Zap size={10} className="mr-1" /> Automated
              </span>
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Live operations and resolution manager for In-Processing Errors on NIMC NIN Tracking IDs.
            </p>
          </div>
          <button 
            onClick={fetchPipeline}
            className="flex items-center justify-center px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <RefreshCw size={14} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide">
          <TabButton 
            label="All Submissions" 
            count={stats.total} 
            isActive={activeTab === "ALL"} 
            onClick={() => setActiveTab("ALL")} 
          />
          <TabButton 
            label="In Processing" 
            count={stats.processing} 
            isActive={activeTab === "PROCESSING"} 
            onClick={() => setActiveTab("PROCESSING")} 
            badgeColor="bg-amber-500/10 text-amber-500 border-amber-500/20"
          />
          <TabButton 
            label="Completed" 
            count={stats.completed} 
            isActive={activeTab === "COMPLETED"} 
            onClick={() => setActiveTab("COMPLETED")} 
            badgeColor="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          />
          <TabButton 
            label="Failed / Refunded" 
            count={stats.failed} 
            isActive={activeTab === "FAILED"} 
            onClick={() => setActiveTab("FAILED")} 
            badgeColor="bg-rose-500/10 text-rose-500 border-rose-500/20"
          />
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
            <input 
              type="text" 
              placeholder="Search by Tracking ID, Reference, Client, or NIN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Tracking ID</th>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Released NIN</th>
                <th className="px-5 py-3.5">Fee</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading && pipeline.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-teal-500" />
                    Loading IPE requests...
                  </td>
                </tr>
              ) : filteredPipeline.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-zinc-400">
                    No IPE clearance records match your filters.
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    {/* Client */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.clientName}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {item.clientEmail}
                      </div>
                    </td>

                    {/* Tracking ID */}
                    <td className="px-5 py-3.5 font-mono font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{item.trackingId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id + "_track", item.trackingId)}
                          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Copy Tracking ID"
                        >
                          {copiedKey === item.id + "_track" ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Reference */}
                    <td className="px-5 py-3.5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {item.reference}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {item.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Completed
                        </span>
                      )}
                      {item.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock size={12} className="animate-spin" /> Processing
                        </span>
                      )}
                      {item.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <XCircle size={12} /> Failed
                        </span>
                      )}
                    </td>

                    {/* Released NIN */}
                    <td className="px-5 py-3.5 whitespace-nowrap font-mono">
                      {item.resolvedNin ? (
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                          <span>{item.resolvedNin}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id + "_nin", item.resolvedNin)}
                            className="text-zinc-400 hover:text-emerald-500"
                            title="Copy NIN"
                          >
                            {copiedKey === item.id + "_nin" ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 font-mono text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      ₦{item.amountCharged?.toLocaleString()}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      <div>{format(new Date(item.createdAt), "MMM d, yyyy")}</div>
                      <div className="text-[10px] text-zinc-400">{format(new Date(item.createdAt), "h:mm a")}</div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTicket(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-500/20 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Eye size={13} /> Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 text-xs bg-zinc-50/50 dark:bg-zinc-800/10">
            <span className="text-zinc-500">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredPipeline.length} total records)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoading}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoading}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Drawer */}
      {selectedTicket && (
        <IpeApplicationDrawer
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateSuccess={() => {
            fetchPipeline();
            setSelectedTicket(null);
          }}
        />
      )}

    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
  badgeColor = "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  badgeColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
        isActive
          ? "border-teal-500 text-teal-600 dark:text-teal-400 bg-teal-50/20 dark:bg-teal-500/5"
          : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      }`}
    >
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
        {count}
      </span>
    </button>
  );
}
