"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, Search, RefreshCw, Eye, ShieldCheck, Filter, 
  ChevronLeft, ChevronRight, User, Phone, CheckCircle, Clock, XCircle, AlertCircle
} from "lucide-react";
import BvnRetrievalDrawer from "@/components/mds/bvn-retrieval/BvnRetrievalDrawer";

export default function BvnRetrievalPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL"); 
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST"); 
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/pipeline/bvn-retrieval", { cache: "no-store" }); 
      if (!res.ok) throw new Error("Failed to fetch pipeline data");
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

  const stats = useMemo(() => {
    const total = pipeline.length;
    const pending = pipeline.filter(p => p.status === "PENDING").length;
    const processing = pipeline.filter(p => p.status === "PROCESSING").length;
    const completed = pipeline.filter(p => p.status === "COMPLETED").length;
    const failed = pipeline.filter(p => p.status === "FAILED").length;
    const totalRevenue = pipeline
      .filter(p => p.status !== "FAILED" || !p.isRefunded)
      .reduce((acc, p) => acc + Number(p.amountPaid || 0), 0);

    return { total, pending, processing, completed, failed, totalRevenue };
  }, [pipeline]);

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch = 
        ticket.fullName?.toLowerCase().includes(query) ||
        ticket.phone?.toLowerCase().includes(query) ||
        ticket.trackingId?.toLowerCase().includes(query) ||
        ticket.transactionRef?.toLowerCase().includes(query) ||
        ticket.clientName?.toLowerCase().includes(query) ||
        ticket.clientEmail?.toLowerCase().includes(query) ||
        ticket.retrievedBvn?.toLowerCase().includes(query);
      
      let matchesTab = true;
      if (activeTab === "PENDING") matchesTab = ticket.status === "PENDING"; 
      if (activeTab === "PROCESSING") matchesTab = ticket.status === "PROCESSING";
      if (activeTab === "COMPLETED") matchesTab = ticket.status === "COMPLETED";
      if (activeTab === "FAILED") matchesTab = ticket.status === "FAILED";

      return matchesSearch && matchesTab;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE));
  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      
      {/* Top Bar */}
      <div>
        <Link 
          href="/quadrox-lorabiz-team/mds/dashboard/orders" 
          className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Global Orders
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
              <ShieldCheck size={12} className="inline mr-1" />
              NIBSS Verification Queue
            </div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              BVN Retrieval Directory
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fulfill customer requests for forgotten 11-digit BVN recovery.
            </p>
          </div>

          <button 
            onClick={fetchPipeline}
            className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <RefreshCw size={14} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-zinc-400">Total Volume</span>
          <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-amber-500">Pending</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-blue-500">Processing</span>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-500">Completed</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* Search and Tabs */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name, phone, tracking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 text-xs font-black rounded-lg transition-all capitalize ${
                  activeTab === tab 
                    ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs" 
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {tab === "ALL" ? "All" : tab.toLowerCase()}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* Pipeline Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs text-zinc-500 font-medium">Loading retrieval orders...</p>
          </div>
        ) : filteredPipeline.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-medium">
            No BVN retrieval orders match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-zinc-500 uppercase tracking-wider text-[10px] font-black border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Tracking ID</th>
                  <th className="py-3 px-4">Applicant Name</th>
                  <th className="py-3 px-4">Linked Phone</th>
                  <th className="py-3 px-4">Client User</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Retrieved BVN</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {paginatedPipeline.map((ticket) => {
                  const statusBadge = 
                    ticket.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
                    ticket.status === "FAILED" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" :
                    ticket.status === "PROCESSING" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
                    "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400";

                  return (
                    <tr key={ticket.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {ticket.trackingId}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {ticket.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                        {ticket.phone}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">{ticket.clientName}</div>
                        <div className="text-[10px] text-zinc-400">{ticket.clientEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${statusBadge}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">
                        {ticket.status === "COMPLETED" && ticket.retrievedBvn ? (
                          <span className="text-emerald-600 dark:text-emerald-400">{ticket.retrievedBvn}</span>
                        ) : ticket.status === "FAILED" ? (
                          <span className="text-rose-500">Unsuccessful</span>
                        ) : (
                          <span className="text-zinc-400">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500 whitespace-nowrap">
                        {format(new Date(ticket.createdAt), "MMM d, HH:mm")}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View Ticket</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <span>
              Page <strong className="text-zinc-900 dark:text-zinc-100">{currentPage}</strong> of <strong className="text-zinc-900 dark:text-zinc-100">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Drawer */}
      {selectedTicket && (
        <BvnRetrievalDrawer
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
