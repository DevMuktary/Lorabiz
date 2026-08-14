"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Play,
  Eye,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  userId: string;
  action: string;
  category: "AUTH" | "CAC" | "WALLET" | "SERVICES" | "SECURITY";
  description: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  referenceId?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalAllTime: 0,
    totalToday: 0,
    failedTotal: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Scanner status
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (categoryFilter !== "ALL") params.append("category", categoryFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (debouncedSearch) params.append("search", debouncedSearch);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/mds/activity?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data || []);
        setMetrics(data.metrics || { totalAllTime: 0, totalToday: 0, failedTotal: 0 });
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error("Failed to load admin activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, categoryFilter, statusFilter, debouncedSearch, startDate, endDate]);

  const handleRunAbandonedScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await fetch("/api/mds/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SCAN_ABANDONED_CAC" }),
      });
      const data = await res.json();
      if (data.success) {
        setScanMessage(data.message);
        fetchLogs();
      } else {
        alert(data.message || "Failed to execute scan");
      }
    } catch (err) {
      alert("Error running abandoned CAC scan.");
    } finally {
      setIsScanning(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "CAC":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "WALLET":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "SERVICES":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "SECURITY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "AUTH":
      default:
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-indigo-500" />
            User Activity & Event Log
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time audit trail of client activities, registrations, and transactions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRunAbandonedScan}
            disabled={isScanning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            {isScanning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            Run Abandoned CAC Scan
          </button>

          <button
            onClick={fetchLogs}
            className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {scanMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Total Activity Events</span>
            <Layers className="h-4 w-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mt-2 font-mono">
            {metrics.totalAllTime.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Activity Today</span>
            <Clock className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-500 mt-2 font-mono">
            +{metrics.totalToday.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Failed Attempts / Errors</span>
            <ShieldAlert className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-500 mt-2 font-mono">
            {metrics.failedTotal.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user, action, description, or reference ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="CAC">CAC Filings</option>
            <option value="WALLET">Wallet & Payments</option>
            <option value="SERVICES">Services (SCUML/TIN/NIN)</option>
            <option value="AUTH">Account & Auth</option>
            <option value="SECURITY">Security</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Activity Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Category & Action</th>
                <th className="px-5 py-3.5">Description & Reference</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading activity records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-400">
                    No activity logs match your filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    {/* User */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : "Unknown User"}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {log.user?.email || log.userId}
                      </div>
                    </td>

                    {/* Category & Action */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(
                            log.category
                          )}`}
                        >
                          {log.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-1">
                        {log.action}
                      </div>
                    </td>

                    {/* Description & Reference */}
                    <td className="px-5 py-3.5">
                      <div className="text-zinc-800 dark:text-zinc-200 font-medium">
                        {log.description}
                      </div>
                      {log.referenceId && (
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          Ref: {log.referenceId}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : log.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {log.status === "SUCCESS" && <CheckCircle2 size={12} />}
                        {log.status === "PENDING" && <Clock size={12} />}
                        {log.status === "FAILED" && <XCircle size={12} />}
                        {log.status}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="text-zinc-900 dark:text-zinc-200">
                        {format(new Date(log.createdAt), "MMM d, yyyy • h:mm a")}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
                        title="View Metadata"
                      >
                        <Eye size={14} />
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
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail / Metadata Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Activity Event Inspection
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-zinc-500">Action:</span>
                <p className="font-mono text-zinc-200 mt-0.5 font-bold">{selectedLog.action}</p>
              </div>
              <div>
                <span className="text-zinc-500">User:</span>
                <p className="text-zinc-200 mt-0.5">
                  {selectedLog.user?.firstName} {selectedLog.user?.lastName} ({selectedLog.user?.email})
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Description:</span>
                <p className="text-zinc-200 mt-0.5">{selectedLog.description}</p>
              </div>
              {selectedLog.referenceId && (
                <div>
                  <span className="text-zinc-500">Reference:</span>
                  <p className="font-mono text-zinc-200 mt-0.5">{selectedLog.referenceId}</p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <span className="text-zinc-500">IP Address:</span>
                  <p className="font-mono text-zinc-200 mt-0.5">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-zinc-500">Event Metadata:</span>
                  <pre className="mt-1 p-3 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto text-[11px] font-mono text-zinc-300">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
