"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Phone, 
  FileText, 
  Copy, 
  Check, 
  Eye, 
  Layers, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BvnModificationDrawer from "@/components/mds/bvn-modification/BvnModificationDrawer";

const MOD_LABELS: Record<string, string> = {
  CHANGE_OF_NAME: "Change of Name",
  CHANGE_OF_DOB: "Change of DOB",
  CHANGE_OF_PHONE: "Change of Phone",
  CHANGE_OF_NAME_PHONE: "Name & Phone",
  CHANGE_OF_DOB_PHONE: "DOB & Phone",
  CHANGE_OF_NAME_DOB: "Name & DOB",
  CHANGE_OF_ALL: "All Details (3-in-1)",
};

const ITEMS_PER_PAGE = 10;

export default function AdminBvnModificationPipelinePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleCopy = (key: string, text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtered requests client-side for smooth instant search
  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return requests;

    return requests.filter((r) => {
      const applicantName = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ").toLowerCase();
      const newName = [r.newFirstName, r.newMiddleName, r.newLastName].filter(Boolean).join(" ").toLowerCase();
      const oldName = (r.currentFullName || "").toLowerCase();

      return (
        r.trackingId?.toLowerCase().includes(q) ||
        r.bvn?.toLowerCase().includes(q) ||
        r.nin?.toLowerCase().includes(q) ||
        r.enrollingBank?.toLowerCase().includes(q) ||
        applicantName.includes(q) ||
        newName.includes(q) ||
        oldName.includes(q) ||
        r.user?.email?.toLowerCase().includes(q) ||
        r.user?.phone?.includes(q) ||
        r.newPhone?.includes(q) ||
        r.transactionRef?.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ITEMS_PER_PAGE));
  const paginatedRequests = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);

  // Statistics counters
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING").length,
      processing: requests.filter((r) => r.status === "PROCESSING").length,
      completed: requests.filter((r) => r.status === "COMPLETED").length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
    };
  }, [requests]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-16 font-sans">
      
      {/* Top Bar with Back to Order Pipeline */}
      <div>
        <Link 
          href="/quadrox-lorabiz-team/mds/dashboard/orders" 
          className="inline-flex items-center text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Order Pipeline
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1.5">
              <ShieldCheck size={13} />
              NIBSS Legal Modification Queue
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              BVN Modification Pipeline
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm mt-0.5">
              Review applicant identity documents, verify NIBSS changes, issue resolution slips, or decline with automated wallet refunds.
            </p>
          </div>

          <Button
            onClick={fetchRequests}
            variant="outline"
            className="h-10 text-xs font-bold gap-1.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white cursor-pointer self-start sm:self-auto shadow-xs"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh Queue</span>
          </Button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Total Orders</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">Pending Review</span>
          <p className="text-2xl font-black text-amber-500 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-sky-500 font-bold">In Processing</span>
          <p className="text-2xl font-black text-sky-500 mt-1">{stats.processing}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-mono uppercase text-emerald-500 font-bold">Completed &amp; Slips</span>
          <p className="text-2xl font-black text-emerald-500 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-[10px] font-mono uppercase text-rose-500 font-bold">Rejected / Declined</span>
          <p className="text-2xl font-black text-rose-500 mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
            placeholder="Search tracking ID, BVN, NIN, applicant name, email, phone..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 text-xs font-bold text-slate-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PENDING", "PROCESSING", "COMPLETED", "REJECTED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
                statusFilter === st
                  ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-bold">Loading BVN modification queue...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 text-xs font-bold">
            No BVN modification applications found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Tracking ID</th>
                  <th className="py-3.5 px-4 font-bold">Enrolling Bank</th>
                  <th className="py-3.5 px-4 font-bold">Applicant Client</th>
                  <th className="py-3.5 px-4 font-bold">BVN &amp; NIN</th>
                  <th className="py-3.5 px-4 font-bold">Modification Requested</th>
                  <th className="py-3.5 px-4 font-bold">Fee Paid</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-medium">
                {paginatedRequests.map((r) => {
                  const categoryTitle = MOD_LABELS[r.modificationCategory] || MOD_LABELS[r.type] || r.modificationCategory || r.type;
                  const clientFullName = [r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || "User Client";

                  return (
                    <tr key={r.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                      {/* Tracking ID & Date */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">{r.trackingId}</div>
                        <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
                          {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy · p") : "–"}
                        </div>
                      </td>

                      {/* Enrolling Bank */}
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-[11px]">
                          {r.enrollingBank || "N/A"}
                        </span>
                      </td>

                      {/* Applicant User */}
                      <td className="py-4 px-4">
                        <div className="text-slate-900 dark:text-white font-bold">{clientFullName}</div>
                        <div className="text-[11px] text-zinc-500 font-mono">{r.user?.email || "–"}</div>
                        {r.user?.phone && (
                          <div className="text-[10px] text-zinc-400 font-mono">{r.user?.phone}</div>
                        )}
                      </td>

                      {/* BVN & NIN */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                          <span>BVN: {r.bvn}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(`bvn-${r.id}`, r.bvn)}
                            className="text-zinc-400 hover:text-emerald-500 p-0.5"
                            title="Copy BVN"
                          >
                            {copiedKey === `bvn-${r.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                          </button>
                        </div>
                        {r.nin ? (
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                            <span>NIN: {r.nin}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`nin-${r.id}`, r.nin)}
                              className="text-zinc-400 hover:text-emerald-500 p-0.5"
                              title="Copy NIN"
                            >
                              {copiedKey === `nin-${r.id}` ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-500">NIN: Not Provided</div>
                        )}
                      </td>

                      {/* Modification Requested */}
                      <td className="py-4 px-4">
                        <span className="inline-block font-bold text-slate-800 dark:text-zinc-200 text-xs">
                          {categoryTitle}
                        </span>
                        {r.modifyName && r.newFirstName && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[170px] mt-0.5">
                            ➔ {[r.newFirstName, r.newLastName].filter(Boolean).join(" ")}
                          </div>
                        )}
                        {r.modifyDob && r.newDob && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                            ➔ DOB: {r.newDob} {r.surchargeApplied && "(+Surcharge)"}
                          </div>
                        )}
                        {r.modifyPhone && r.newPhone && (
                          <div className="text-[10px] text-violet-600 dark:text-violet-400 font-mono mt-0.5">
                            ➔ Tel: {r.newPhone}
                          </div>
                        )}
                      </td>

                      {/* Fee Paid */}
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">
                        <div>₦{Number(r.amountPaid || 0).toLocaleString()}</div>
                        {r.surchargeApplied && (
                          <span className="inline-block text-[10px] text-amber-600 dark:text-amber-400 font-mono font-normal">
                            +₦{Number(r.surchargeAmount || 5000).toLocaleString()} Surcharge
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                          r.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" :
                          r.status === "PROCESSING" ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" :
                          r.status === "REJECTED" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" :
                          "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}>
                          {r.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setSelectedRequest(r)}
                          className="h-8 px-3.5 text-xs font-bold bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-800 dark:hover:bg-zinc-700 text-white cursor-pointer shadow-xs"
                        >
                          <Eye size={13} className="mr-1.5" /> Review &amp; Action
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {filteredRequests.length > 0 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40 text-xs">
            <span className="text-zinc-500 font-medium">
              Showing <strong className="text-zinc-900 dark:text-white">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</strong> to{" "}
              <strong className="text-zinc-900 dark:text-white">{Math.min(currentPage * ITEMS_PER_PAGE, filteredRequests.length)}</strong> of{" "}
              <strong className="text-zinc-900 dark:text-white">{filteredRequests.length}</strong> applications
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft size={14} className="mr-1" /> Prev
              </Button>
              <span className="font-bold text-zinc-700 dark:text-zinc-300 px-2 font-mono">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 px-2.5 text-xs border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer disabled:opacity-50"
              >
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review & Action Drawer */}
      {selectedRequest && (
        <BvnModificationDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateSuccess={() => {
            fetchRequests();
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
