"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Filter, RefreshCw, ChevronRight, History, ExternalLink } from "lucide-react";
import { RequestInspectDrawer } from "./RequestInspectDrawer";

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
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Filters
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // History Quick-Links dropdown
  const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);

  // Inspect Drawer
  const [inspectLogId, setInspectLogId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs(true);
  }, [environment, serviceFilter, statusFilter]);

  const fetchLogs = async (reset = false) => {
    if (reset) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const url = new URL("/api/developer/logs", window.location.origin);
      url.searchParams.set("environment", environment);
      url.searchParams.set("service", serviceFilter);
      url.searchParams.set("statusCode", statusFilter);
      url.searchParams.set("limit", "20");

      if (!reset && nextCursor) {
        url.searchParams.set("cursor", nextCursor);
      }

      const res = await fetch(url.toString());
      const data = await res.json();

      if (data.success) {
        if (reset) {
          setLogs(data.data.logs || []);
        } else {
          setLogs((prev) => [...prev, ...(data.data.logs || [])]);
        }
        setNextCursor(data.data.nextCursor);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
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

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {/* Header & Filter Controls */}
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              HTTP Request Stream (API Debugger)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Low-level HTTP traffic and payload debugger for developer integrations.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Direct Link to Service Order History */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsHistoryMenuOpen(!isHistoryMenuOpen)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              <History className="h-3.5 w-3.5 text-primary" />
              <span>Service Order History</span>
            </button>

            {isHistoryMenuOpen && (
              <div className="absolute right-0 top-10 z-30 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Service Records
                </div>
                <Link
                  href="/dashboard/nin/slips"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsHistoryMenuOpen(false)}
                >
                  <span>NIN Slips Printed</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
                <Link
                  href="/dashboard/nin/ipe/history"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsHistoryMenuOpen(false)}
                >
                  <span>NIN IPE Clearances</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
                <Link
                  href="/dashboard/nin/personalization/history"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsHistoryMenuOpen(false)}
                >
                  <span>NIN Personalizations</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
                <Link
                  href="/dashboard/bvn"
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                  onClick={() => setIsHistoryMenuOpen(false)}
                >
                  <span>BVN Verifications</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </div>
            )}
          </div>

          {/* Granular Service / Endpoint Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground">
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
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground">
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
            onClick={() => fetchLogs(true)}
            title="Refresh stream"
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Streaming request logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-foreground">No API calls recorded yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Send your first {environment === "LIVE" ? "live" : "test"} request with your secret key to see it appear live.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Time (UTC)</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium">Endpoint</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Latency</th>
                <th className="px-5 py-3 font-medium">Debited</th>
                <th className="px-5 py-3 text-right font-medium">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setInspectLogId(log.id)}
                  className="cursor-pointer transition-colors hover:bg-muted/40"
                >
                  <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {log.method}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-foreground whitespace-nowrap">
                    {log.endpoint}
                  </td>
                  <td className="px-5 py-3">{getStatusBadge(log.statusCode)}</td>
                  <td className="px-5 py-3 text-muted-foreground">{log.latencyMs}ms</td>
                  <td className="px-5 py-3 text-foreground font-semibold">
                    ₦{Number(log.amountCharged || 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline">
                      <span>Inspect</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {nextCursor && (
        <div className="border-t border-border/40 p-3.5 text-center">
          <button
            onClick={() => fetchLogs(false)}
            disabled={isLoadingMore}
            className="rounded-xl border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? "Loading more..." : "Load Older Logs"}
          </button>
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
