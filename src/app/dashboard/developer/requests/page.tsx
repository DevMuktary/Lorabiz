"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Layers,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { UnifiedApiRequestItem } from "@/app/api/developer/requests/route";
import { ApiServiceOrderDrawer } from "@/components/features/developer/ApiServiceOrderDrawer";
import { formatWATDateTime } from "@/lib/developer/format-wat";

export default function ApiRequestsHistoryPage() {
  const [requests, setRequests] = useState<UnifiedApiRequestItem[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected order for inspect drawer
  const [selectedOrder, setSelectedOrder] = useState<UnifiedApiRequestItem | null>(null);

  const fetchRequests = async (pageToFetch = currentPage) => {
    setIsLoading(true);
    try {
      const url = new URL("/api/developer/requests", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      if (serviceFilter !== "ALL") url.searchParams.set("service", serviceFilter);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      url.searchParams.set("page", String(pageToFetch));
      url.searchParams.set("limit", "15");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.data) {
        setRequests(data.data.requests || []);
        if (data.data.summary) setSummary(data.data.summary);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalCount(data.data.pagination.totalCount || 0);
          setCurrentPage(data.data.pagination.page || 1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch API service requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchRequests(1);
  }, [serviceFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchRequests(newPage);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "VALIDATED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {status === "VALIDATED" ? "Validated" : "Completed"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-3 w-3 animate-spin" />
            Processing
          </span>
        );
      case "FAILED":
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
    }
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
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {pages.map((p, idx) =>
          typeof p === "number" ? (
            <button
              key={idx}
              onClick={() => handlePageChange(p)}
              className={`min-w-[32px] rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors ${
                currentPage === p
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "border border-border text-foreground hover:bg-muted"
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
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/developer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Developer Hub</span>
        </Link>
      </div>

      {/* Dedicated Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-xs">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              API Service Requests
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Live automated identity order history across NIN Personalization, IPE Clearance, Validation, and Verifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/developer/transactions"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <span>Transactions</span>
          </Link>
          <Link
            href="/docs"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
          >
            <span>API Docs</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Summary Counter Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Total Live Requests</span>
          <div className="mt-2 text-2xl font-bold text-foreground">{summary.total.toLocaleString()}</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Completed / Validated</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {summary.completed.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">In Processing</span>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {summary.processing.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs font-semibold text-muted-foreground">Failed</span>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            {summary.failed.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
        {/* Controls Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by Tracking ID, NIN, Phone, Reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </form>

          {/* Filters & Refresh */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Service Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Services</option>
                <option value="PERSONALIZATION">NIN Personalization</option>
                <option value="IPE">NIMC IPE Clearance</option>
                <option value="VALIDATION">NIN Validation</option>
                <option value="SEARCH">NIN Verification (by NIN)</option>
                <option value="PHONE">NIN Verification (by Phone)</option>
                <option value="BVN">BVN Verification</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PROCESSING">Processing</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            <button
              onClick={() => fetchRequests(currentPage)}
              title="Refresh requests"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="w-full overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading service requests...</div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-foreground">No live service requests found</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When you make live requests to NIN Personalization, IPE Clearance, or Verifications, they will appear here with full demographics.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Date &amp; Time</th>
                  <th className="px-6 py-3.5 font-medium">Service</th>
                  <th className="px-6 py-3.5 font-medium">Input Identifier</th>
                  <th className="px-6 py-3.5 font-medium">Reference</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Fee</th>
                  <th className="px-6 py-3.5 text-right font-medium">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    onClick={() => setSelectedOrder(req)}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatWATDateTime(req.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary whitespace-nowrap">
                        {req.serviceName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-bold text-foreground">
                          {req.inputIdentifier}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {req.inputLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground">
                      {req.reference}
                    </td>
                    <td className="px-6 py-4">
                      {renderStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground whitespace-nowrap">
                      ₦{req.amountCharged.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(req);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition-colors"
                      >
                        <span>View</span>
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Numbered Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/40 px-6 py-4 bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {totalCount === 0 ? 0 : (currentPage - 1) * 15 + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(currentPage * 15, totalCount)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{totalCount}</span> live requests
          </span>

          {renderPaginationButtons()}
        </div>
      </div>

      {/* Inspect Order Drawer */}
      <ApiServiceOrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
}
