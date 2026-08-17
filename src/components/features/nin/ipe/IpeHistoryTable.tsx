"use client";

import React, { useState, useMemo } from "react";
import { 
  Check, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Eye, 
  Filter, 
  KeyRound, 
  RefreshCw, 
  Search, 
  XCircle 
} from "lucide-react";
import { IpeRequestRecord, IpeDetailsModal } from "./IpeDetailsModal";

interface IpeHistoryTableProps {
  requests: IpeRequestRecord[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onSyncStatus: (reference: string) => Promise<void>;
}

export function IpeHistoryTable({
  requests,
  isLoading,
  onRefresh,
  onSyncStatus,
}: IpeHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");
  const [selectedRecord, setSelectedRecord] = useState<IpeRequestRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [syncingRef, setSyncingRef] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter requests by search term and status
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        req.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.resolvedNin && req.resolvedNin.includes(searchTerm));

      const matchesStatus =
        statusFilter === "ALL" || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSingleSync = async (reference: string) => {
    setSyncingRef(reference);
    try {
      await onSyncStatus(reference);
    } finally {
      setSyncingRef(null);
    }
  };

  const openDetails = (record: IpeRequestRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const formattedDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formattedTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-6">
      
      {/* Controls Bar: Search & Status Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Tracking ID, Reference, or NIN..."
            className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
          {(["ALL", "PROCESSING", "COMPLETED", "FAILED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab === "ALL" ? "All Submissions" : tab === "PROCESSING" ? "In Processing" : tab === "COMPLETED" ? "Completed" : "Unsuccessful"}
            </button>
          ))}
        </div>

      </div>

      {/* Table Container */}
      <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Tracking ID</th>
                <th className="py-3.5 px-4">Reference</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Released NIN</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading && requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span className="text-xs">Loading IPE clearance history...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <KeyRound className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <span className="text-xs font-medium">No matching IPE clearance records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((item) => {
                  const isSyncingThis = syncingRef === item.reference;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {formattedDate(item.createdAt)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {formattedTime(item.createdAt)}
                        </div>
                      </td>

                      {/* Tracking ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            {item.trackingId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id + "_track", item.trackingId)}
                            title="Copy Tracking ID"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {copiedId === item.id + "_track" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Reference */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-500 dark:text-slate-400">
                        {item.reference}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                        {item.status === "PROCESSING" && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            Processing
                          </span>
                        )}
                        {item.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            Unsuccessful
                          </span>
                        )}
                      </td>

                      {/* Released NIN */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.resolvedNin ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {item.resolvedNin}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(item.id + "_nin", item.resolvedNin!)}
                              title="Copy NIN"
                              className="text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              {copiedId === item.id + "_nin" ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {item.status === "PROCESSING" ? "In processing" : "Unavailable"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "PROCESSING" && (
                            <button
                              type="button"
                              onClick={() => handleSingleSync(item.reference)}
                              disabled={isSyncingThis}
                              title="Check Live Status"
                              className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingThis ? "animate-spin text-emerald-600" : ""}`} />
                              <span className="hidden sm:inline">{isSyncingThis ? "Checking..." : "Sync"}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openDetails(item)}
                            className="h-8 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
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
      </div>

      {/* Details Modal */}
      <IpeDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        request={selectedRecord}
        onSyncStatus={onSyncStatus}
      />
    </div>
  );
}
