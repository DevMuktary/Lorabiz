// src/app/quadrox-lorabiz-team/mds/dashboard/orders/annual-returns/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Eye,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Download,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import AnnualReturnsApplicationDrawer from "@/components/mds/annual-returns/AnnualReturnsApplicationDrawer";

export default function MdsAnnualReturnsPipelinePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipeline, setPipeline] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/pipeline/annual-returns");
      if (!res.ok) throw new Error("Failed to fetch");
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
  }, [searchTerm, activeTab, typeFilter, sortOrder]);

  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const searchTarget = `${ticket.companyName} ${ticket.registrationNumber} ${ticket.trackingId} ${ticket.clientName} ${ticket.clientEmail} ${ticket.designeeFullName}`;
      const matchesSearch = searchTarget.toLowerCase().includes(searchTerm.toLowerCase());

      let matchesTab = true;
      if (activeTab === "PENDING") matchesTab = ticket.status === "PENDING";
      if (activeTab === "PROCESSING") matchesTab = ticket.status === "PROCESSING";
      if (activeTab === "APPROVED") matchesTab = ticket.status === "APPROVED";
      if (activeTab === "QUERIED") matchesTab = ticket.status === "QUERIED";
      if (activeTab === "REJECTED") matchesTab = ticket.status === "REJECTED";

      const matchesType = typeFilter === "ALL" || ticket.companyType === typeFilter;

      return matchesSearch && matchesTab && matchesType;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, activeTab, typeFilter, sortOrder]);

  const paginatedPipeline = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(filteredPipeline.length / ITEMS_PER_PAGE);

  // Metrics
  const metrics = useMemo(() => {
    return {
      pending: pipeline.filter((t) => t.status === "PENDING").length,
      processing: pipeline.filter((t) => t.status === "PROCESSING").length,
      approved: pipeline.filter((t) => t.status === "APPROVED").length,
      queried: pipeline.filter((t) => t.status === "QUERIED").length,
      rejected: pipeline.filter((t) => t.status === "REJECTED").length,
    };
  }, [pipeline]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 font-sans">
      
      {/* Header & Navigation */}
      <div>
        <Link
          href="/quadrox-lorabiz-team/mds/dashboard/orders"
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Global Pipeline
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Building2 className="text-emerald-600 dark:text-emerald-400" />
              CAC Annual Returns Pipeline
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Review, regularize, and approve statutory annual compliance filings for Business Names and LLCs.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPipeline}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer self-start shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin text-emerald-600" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Awaiting Review</span>
            <Clock size={16} className="text-zinc-500" />
          </div>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-2">{metrics.pending}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-blue-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Processing</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">{metrics.processing}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Approved</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{metrics.approved}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Queried</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{metrics.queried}</p>
        </div>

        <div className="bg-white dark:bg-zinc-900/60 p-4 rounded-xl border border-rose-500/20 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Rejected</span>
            <XCircle size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{metrics.rejected}</p>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              placeholder="Search by Company Name, RC/BN, Tracking ID, or Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-600 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
            >
              <option value="ALL">All Entities</option>
              <option value="BUSINESS_NAME">Business Name (BN)</option>
              <option value="LLC">Limited Company (LLC)</option>
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold outline-none cursor-pointer"
            >
              <option value="NEWEST">Newest First</option>
              <option value="OLDEST">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
          {["ALL", "PENDING", "PROCESSING", "APPROVED", "QUERIED", "REJECTED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                <th className="py-3 px-4">Entity & Ref</th>
                <th className="py-3 px-4">Registration No</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Years</th>
                <th className="py-3 px-4">Authorizing Officer</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading pipeline records...
                  </td>
                </tr>
              ) : paginatedPipeline.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-zinc-500">
                    No annual return requests match your criteria.
                  </td>
                </tr>
              ) : (
                paginatedPipeline.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <strong className="font-bold text-zinc-900 dark:text-white block truncate max-w-xs">
                        {ticket.companyName}
                      </strong>
                      <span className="font-mono text-[10px] text-emerald-600 font-bold">{ticket.trackingId}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {ticket.registrationNumber}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-zinc-600 dark:text-zinc-300">
                        {ticket.companyType === "LLC" ? "LLC" : "BN"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-zinc-700 dark:text-zinc-300">
                      {ticket.filingYears || "Current"}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-900 dark:text-white block">{ticket.designeeFullName}</span>
                      <span className="text-[10px] text-zinc-400">{ticket.designeeRole}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 block">{ticket.clientName}</span>
                      <span className="text-[10px] text-zinc-400">{ticket.clientPhone}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          ticket.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/20"
                            : ticket.status === "PROCESSING"
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-500/20"
                            : ticket.status === "QUERIED"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-500/20"
                            : ticket.status === "REJECTED"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/20"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-700"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(ticket)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-lg transition-colors cursor-pointer shadow-sm text-xs"
                      >
                        <Eye size={12} />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>
              Showing {paginatedPipeline.length} of {filteredPipeline.length} requests
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <AnnualReturnsApplicationDrawer
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdateSuccess={() => {
          fetchPipeline();
          setSelectedTicket(null);
        }}
      />

    </div>
  );
}
