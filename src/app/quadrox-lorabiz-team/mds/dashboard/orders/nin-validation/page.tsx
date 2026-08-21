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
  ShieldCheck
} from "lucide-react";
import NinValidationApplicationDrawer from "@/components/mds/nin-validation/NinValidationApplicationDrawer";

const CATEGORY_LABELS: Record<string, string> = {
  NO_RECORD_FOUND: "No Record Found",
  VNIN_VALIDATION: "VNIN Validation",
  UPDATE_RECORD_MOD: "Update Record (Mod)",
};

export default function NinValidationAdminPipelinePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
  }, [searchTerm, activeTab, categoryFilter, sortOrder]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const matchesSearch =
        ticket.nin?.includes(searchTerm) ||
        ticket.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientPhone?.includes(searchTerm);

      const matchesTab = activeTab === "ALL" || ticket.status === activeTab;
      const matchesCategory = categoryFilter === "ALL" || ticket.category === categoryFilter;

      return matchesSearch && matchesTab && matchesCategory;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, categoryFilter, sortOrder]);

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
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Fingerprint className="text-indigo-500" size={24} />
              <span>NIN Validation Operations Ledger</span>
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Process manual validation requests for No Record Found, VNIN, and Record Update tickets.
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Total Submissions</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{stats.total}</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 shadow-sm">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Awaiting Action</p>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.processing}</p>
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
          <TabButton label="Processing (Action Needed)" count={stats.processing} isActive={activeTab === "PROCESSING"} onClick={() => setActiveTab("PROCESSING")} alert={stats.processing > 0} />
          <TabButton label="Completed" count={stats.completed} isActive={activeTab === "COMPLETED"} onClick={() => setActiveTab("COMPLETED")} />
          <TabButton label="Failed" count={stats.failed} isActive={activeTab === "FAILED"} onClick={() => setActiveTab("FAILED")} />
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by NIN, client, email, phone, or reference..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="NO_RECORD_FOUND">No Record Found</option>
              <option value="VNIN_VALIDATION">VNIN Validation</option>
              <option value="UPDATE_RECORD_MOD">Update Record (Mod)</option>
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
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    <RefreshCw size={24} className="animate-spin text-indigo-500 mx-auto mb-2" />
                    <span>Loading validation pipeline records...</span>
                  </td>
                </tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-zinc-400">
                    <Fingerprint size={32} className="mx-auto mb-2 opacity-40 text-zinc-400" />
                    <p className="font-bold text-zinc-700 dark:text-zinc-300">No validation requests found</p>
                    <p className="text-xs text-zinc-500 mt-0.5">No tickets matched the current filter or search criteria.</p>
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((ticket) => {
                  const categoryLabel = CATEGORY_LABELS[ticket.category] || ticket.category;
                  const formattedDate = format(new Date(ticket.createdAt), "MMM dd, yyyy · p");

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
                        <div className="flex items-center gap-2">
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

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black text-zinc-900 dark:text-zinc-100">
                        ₦{Number(ticket.amountCharged).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusPill status={ticket.status} />
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg text-xs transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-500/20 shadow-sm"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>
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

      {/* Slide-over Inspection & Action Drawer */}
      <NinValidationApplicationDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdateSuccess={() => {
          setSelectedTicket(null);
          fetchPipeline();
        }}
      />

    </div>
  );
}

function TabButton({
  label,
  count,
  isActive,
  onClick,
  alert,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  alert?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
        isActive
          ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 bg-white dark:bg-zinc-900"
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <span>{label}</span>
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
          alert
            ? "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 font-bold"
            : isActive
            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
        <CheckCircle2 size={11} />
        <span>Completed</span>
      </span>
    );
  }
  if (status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
        <XCircle size={11} />
        <span>Failed</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
      <Clock size={11} className="animate-pulse" />
      <span>Processing</span>
    </span>
  );
}
