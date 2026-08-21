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
  Filter, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  UserCheck, 
  FileText,
  Lock,
  Calendar,
  DollarSign,
  ExternalLink
} from "lucide-react";
import NinModificationDrawer from "@/components/mds/nin-modification/NinModificationDrawer";

const TYPE_LABELS: Record<string, string> = {
  CHANGE_OF_NAME: "Change of Name",
  CHANGE_OF_PHONE: "Change of Phone",
  CHANGE_OF_ADDRESS: "Change of Address",
};

export default function NinModificationAdminPipelinePage() {
  const [activeViewTab, setActiveViewTab] = useState<"pipeline" | "consents">("pipeline");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [consents, setConsents] = useState<any[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"NEWEST" | "OLDEST">("NEWEST");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchPipeline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/pipeline/nin-modification");
      if (!res.ok) throw new Error("Failed to fetch pipeline data");
      const result = await res.json();
      setPipeline(result.pipeline || []);
      setConsents(result.consents || []);
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
  }, [searchTerm, statusFilter, typeFilter, sortOrder, activeViewTab]);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered pipeline
  const filteredPipeline = useMemo(() => {
    let result = pipeline.filter((ticket) => {
      const matchesSearch =
        ticket.nin?.includes(searchTerm) ||
        ticket.trackingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.clientPhone?.includes(searchTerm);

      const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      const matchesType = typeFilter === "ALL" || ticket.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });

    result = result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortOrder === "NEWEST") return dateB - dateA;
      if (sortOrder === "OLDEST") return dateA - dateB;
      return 0;
    });

    return result;
  }, [pipeline, searchTerm, statusFilter, typeFilter, sortOrder]);

  // Filtered consents
  const filteredConsents = useMemo(() => {
    return consents.filter((c) => {
      const s = searchTerm.toLowerCase();
      return (
        c.fullName?.toLowerCase().includes(s) ||
        c.clientName?.toLowerCase().includes(s) ||
        c.clientEmail?.toLowerCase().includes(s) ||
        c.clientPhone?.includes(s) ||
        c.ipAddress?.includes(s)
      );
    });
  }, [consents, searchTerm]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: pipeline.length,
      pending: pipeline.filter((p) => p.status === "PENDING").length,
      processing: pipeline.filter((p) => p.status === "PROCESSING").length,
      completed: pipeline.filter((p) => p.status === "COMPLETED").length,
      rejected: pipeline.filter((p) => p.status === "REJECTED").length,
      consents: consents.length,
    };
  }, [pipeline, consents]);

  // Paginated pipeline
  const paginatedPipeline = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPipeline.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPipeline, currentPage]);

  const totalPages = Math.ceil(
    (activeViewTab === "pipeline" ? filteredPipeline.length : filteredConsents.length) / ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6 font-sans">
      
      {/* Drawer */}
      {selectedRequest && (
        <NinModificationDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateSuccess={fetchPipeline}
        />
      )}

      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/quadrox-lorabiz-team/mds/dashboard/orders"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft size={16} /> Back to Order Pipeline
        </Link>

        <button
          type="button"
          onClick={fetchPipeline}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-1">
            <ShieldCheck size={14} /> NIMC Identity Modifications
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            NIN Modification Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Process Change of Name, Phone Number, and Address requests, deliver slips, and audit legal consent signatures.
          </p>
        </div>

        {/* Top Metric Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">Pending</span>
            <span className="text-base font-black text-amber-700 dark:text-amber-300 font-mono">{counts.pending}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block">Processing</span>
            <span className="text-base font-black text-sky-700 dark:text-sky-300 font-mono">{counts.processing}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Completed</span>
            <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">{counts.completed}</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-center">
            <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 block">Rejected</span>
            <span className="text-base font-black text-rose-700 dark:text-rose-300 font-mono">{counts.rejected}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs: Active Pipeline vs Signed Consents */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveViewTab("pipeline")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeViewTab === "pipeline"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Layers size={16} />
          <span>Active Pipeline Orders ({counts.all})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab("consents")}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeViewTab === "consents"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <UserCheck size={16} />
          <span>Legal Consent Signatures Audit ({counts.consents})</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeViewTab === "pipeline"
                ? "Search Tracking ID, NIN, Client Name, Email, or Phone..."
                : "Search Signatory Name, Email, IP Address..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {activeViewTab === "pipeline" && (
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Types</option>
              <option value="CHANGE_OF_NAME">Change of Name</option>
              <option value="CHANGE_OF_PHONE">Change of Phone</option>
              <option value="CHANGE_OF_ADDRESS">Change of Address</option>
            </select>
          </div>
        )}
      </div>

      {/* PIPELINE TAB TABLE */}
      {activeViewTab === "pipeline" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Tracking ID / Date</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Target NIN</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading modification pipeline...
                    </td>
                  </tr>
                ) : paginatedPipeline.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No modification requests found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedPipeline.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      
                      {/* Tracking ID & Date */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.trackingId}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {format(new Date(item.createdAt), "MMM d, yyyy · hh:mm a")}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.clientName}</div>
                        <span className="text-[10px] text-slate-400 block">{item.clientEmail}</span>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {TYPE_LABELS[item.type] || item.type}
                        </span>
                      </td>

                      {/* NIN */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {item.nin}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        ₦{item.amountPaid.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {item.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <CheckCircle2 size={12} /> Completed
                          </span>
                        )}
                        {item.status === "PROCESSING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400">
                            <RefreshCw size={12} className="animate-spin" /> Processing
                          </span>
                        )}
                        {item.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                            <XCircle size={12} /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-300 text-xs font-bold transition-colors"
                        >
                          <Eye size={14} /> Review / Action
                        </button>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONSENTS AUDIT TAB TABLE */}
      {activeViewTab === "consents" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Signed Date</th>
                  <th className="py-3 px-4">Signatory Legal Name</th>
                  <th className="py-3 px-4">User Account</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Signature Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-indigo-500" />
                      Loading legal consent records...
                    </td>
                  </tr>
                ) : filteredConsents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No signed consent records found.
                    </td>
                  </tr>
                ) : (
                  filteredConsents.map((consent) => (
                    <tr key={consent.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {format(new Date(consent.agreedAt), "MMM d, yyyy · hh:mm a")}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {consent.fullName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-900 dark:text-white block">{consent.clientName}</span>
                        <span className="text-[10px] text-slate-400">{consent.clientEmail}</span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">
                        {consent.ipAddress || "N/A"}
                      </td>

                      <td className="py-3 px-4">
                        {consent.signature?.startsWith("data:image") ? (
                          <div className="h-10 w-28 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center">
                            <img
                              src={consent.signature}
                              alt="Digital Signature"
                              className="max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <span className="font-serif italic font-bold text-slate-900 dark:text-white text-sm">
                            {consent.signature?.replace("TYPED:", "")}
                          </span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              activeViewTab === "pipeline" ? filteredPipeline.length : filteredConsents.length
            )}{" "}
            of {activeViewTab === "pipeline" ? filteredPipeline.length : filteredConsents.length} entries
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-900 dark:text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
