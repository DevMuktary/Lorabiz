"use client";

import React, { useState, useEffect } from "react";
import { Activity, Filter, RefreshCw, ChevronRight } from "lucide-react";
import { RequestInspectDrawer } from "./RequestInspectDrawer";
import { formatWATDateTime } from "@/lib/developer/format-wat";

export interface LogItem {
  id: string;
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  amountCharged: number;
  clientReference: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface RequestStreamTableProps {
  environment: "LIVE" | "TEST";
}

export const RequestStreamTable: React.FC<RequestStreamTableProps> = ({ environment }) => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set());

  // Filters
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Inspect Drawer
  const [inspectLogId, setInspectLogId] = useState<string | null>(null);

  // Reset to page 1 whenever filters or environment change
  useEffect(() => {
    setCurrentPage(1);
    fetchLogs(1);
  }, [environment, serviceFilter, statusFilter]);

  // Real-Time Live Log Ingestion on page 1 only
  useEffect(() => {
    if (currentPage !== 1) return;
    let isCancelled = false;

    const pollLatestLogs = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      try {
        const url = new URL("/api/developer/logs", window.location.origin);
        url.searchParams.set("environment", environment);
        url.searchParams.set("service", serviceFilter);
        url.searchParams.set("statusCode", statusFilter);
        url.searchParams.set("page", "1");
        url.searchParams.set("limit", "15");

        const res = await fetch(url.toString(), { cache: "no-store" });
        const data = await res.json();

        if (data.success && Array.isArray(data.data?.logs) && !isCancelled) {
          const freshLogs: LogItem[] = data.data.logs;
          setTotalLogs(data.data.pagination?.totalLogs ?? freshLogs.length);
          setTotalPages(data.data.pagination?.totalPages ?? 1);

          setLogs((prevLogs) => {
            if (!prevLogs.length) return freshLogs;
            const existingIds = new Set(prevLogs.map((l) => l.id));
            const newItems = freshLogs.filter((l) => !existingIds.has(l.id));
            if (newItems.length > 0) {
              setNewlyArrivedIds((prev) => {
                const nextSet = new Set(prev);
                newItems.forEach((item) => nextSet.add(item.id));
                return nextSet;
              });

              setTimeout(() => {
                setNewlyArrivedIds((prev) => {
                  const updated = new Set(prev);
                  newItems.forEach((item) => updated.delete(item.id));
                  return updated;
                });
              }, 2500);

              return freshLogs;
            }
            return prevLogs;
          });
        }
      } catch {
        // silent fail
      }
    };

    const interval = setInterval(pollLatestLogs, 3000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [environment, serviceFilter, statusFilter, currentPage]);

  const fetchLogs = async (pageToFetch: number) => {
    setIsLoading(true);
    try {
      const url = new URL("/api/developer/logs", window.location.origin);
      url.searchParams.set("environment", environment);
      url.searchParams.set("service", serviceFilter);
      url.searchParams.set("statusCode", statusFilter);
      url.searchParams.set("page", pageToFetch.toString());
      url.searchParams.set("limit", "15");

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        setLogs(data.data.logs || []);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalLogs(data.data.pagination.totalLogs || 0);
          setCurrentPage(data.data.pagination.page || pageToFetch);
        }
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchLogs(newPage);
  };

  const formatWATTime = (dateStr: string) => {
    return formatWATDateTime(dateStr);
  };

  const getStatusBadge = (code: number) => {
    if (code >= 200 && code < 300) {
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          {code} OK
        </span>
      );
    }
    if (code >= 400 && code < 500) {
      return (
        <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          {code} Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
        {code} Fail
      </span>
    );
  };

  const renderPaginationButtons = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
        >
          Previous
        </button>

        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={idx}
              onClick={() => handlePageChange(p)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                currentPage === p
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border bg-card text-foreground hover:bg-secondary"
              }`}
            >
              {p}
            </button>
          ) : (
            <span key={idx} className="px-1 text-xs text-muted-foreground">
              ...
            </span>
          )
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-40 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              API Request History
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time HTTP requests, payloads sent, and response status codes. Click any row to inspect.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Granular Service / Endpoint Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Endpoints</option>
              <option value="NIN_SEARCH">/v1/nin/by-nin (NIN Search)</option>
              <option value="NIN_PHONE">/v1/nin/by-phone (Phone Search)</option>
              <option value="NIN_IPE">/v1/nin/ipe (IPE Clearance)</option>
              <option value="NIN_VALIDATION">/v1/nin/validation (Validation)</option>
              <option value="NIN_PERSONALIZATION">/v1/nin/personalization</option>
              <option value="BVN">/v1/bvn/verify (BVN Verify)</option>
            </select>
          </div>

          {/* Status Code Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="2xx">2xx Success</option>
              <option value="4xx">4xx Client Errors</option>
              <option value="5xx">5xx Server Errors</option>
            </select>
          </div>

          <button
            onClick={() => fetchLogs(currentPage)}
            title="Refresh stream"
            className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading request logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No API calls recorded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send your first {environment === "LIVE" ? "live" : "test"} request with your secret key to see it appear live.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5 font-medium">Time</th>
                <th className="px-6 py-3.5 font-medium">Method</th>
                <th className="px-6 py-3.5 font-medium">Endpoint</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Latency</th>
                <th className="px-6 py-3.5 font-medium">Debited</th>
                <th className="px-6 py-3.5 text-right font-medium">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {logs.map((log) => {
                const isNew = newlyArrivedIds.has(log.id);
                return (
                  <tr
                    key={log.id}
                    onClick={() => setInspectLogId(log.id)}
                    className={`cursor-pointer transition-all duration-300 ${
                      isNew
                        ? "bg-emerald-500/15 dark:bg-emerald-500/20 ring-1 ring-emerald-500/30 animate-in fade-in"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatWATTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                      {log.endpoint}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(log.statusCode)}</td>
                    <td className="px-6 py-4 text-muted-foreground">{log.latencyMs}ms</td>
                    <td className="px-6 py-4 text-foreground font-semibold">
                      ₦{Number(log.amountCharged || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline">
                        <span>Inspect</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Numbered Pagination Footer */}
      {!isLoading && totalLogs > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/40 px-6 py-4">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(currentPage - 1) * 15 + 1}</span> to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * 15, totalLogs)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalLogs}</span> requests
          </p>

          {renderPaginationButtons()}
        </div>
      )}

      {/* Slide-over Inspect Drawer */}
      <RequestInspectDrawer
        logId={inspectLogId}
        onClose={() => setInspectLogId(null)}
      />
    </div>
  );
};
