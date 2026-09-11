"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { formatWATDateTime } from "@/lib/developer/format-wat";

interface ApiTransactionItem {
  id: string;
  reference: string;
  serviceName: string;
  description: string;
  type: "DEBIT" | "CREDIT" | string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: "SUCCESS" | "FAILED" | "PENDING" | string;
  createdAt: string;
}

import { DeveloperConsoleHeader } from "@/components/features/developer/DeveloperConsoleHeader";

export default function ApiTransactionsPage() {
  const [transactions, setTransactions] = useState<ApiTransactionItem[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [totalDebited, setTotalDebited] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  const fetchTransactions = async (pageToFetch = currentPage) => {
    setIsLoading(true);
    try {
      const url = new URL("/api/developer/transactions", window.location.origin);
      if (searchQuery) url.searchParams.set("search", searchQuery);
      if (serviceFilter !== "ALL") url.searchParams.set("service", serviceFilter);
      if (startDate) url.searchParams.set("startDate", startDate);
      if (endDate) url.searchParams.set("endDate", endDate);
      url.searchParams.set("page", String(pageToFetch));
      url.searchParams.set("limit", "15");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.data) {
        setTransactions(data.data.transactions || []);
        setWalletBalance(data.data.walletBalance || 0);
        setTotalDebited(data.data.totalDebited || 0);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalCount(data.data.pagination.totalCount || 0);
          setCurrentPage(data.data.pagination.page || 1);
        }
      }
    } catch (err) {
      console.error("Failed to fetch API transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchTransactions(1);
  }, [serviceFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
    fetchTransactions(newPage);
  };

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
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
      {/* Developer Console Header with Tabs */}
      <DeveloperConsoleHeader environment="LIVE" />

      {/* Page Title & Breadcrumb Info */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            API Transactions Ledger
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Financial ledger tracking wallet deductions and service fees debited by your API integrations.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>LIVE WALLET LEDGER</span>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Wallet Balance</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            ₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Available balance for live API calls</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Debited by API</span>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
            ₦{totalDebited.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Cumulative fees deducted for API requests</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total API Transactions</span>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {totalCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">Historical ledger entries recorded</p>
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
              placeholder="Search reference or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Service Name Filter */}
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
                <option value="VERIFICATION">NIN Verification</option>
                <option value="BVN">BVN Verification</option>
              </select>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <button
              onClick={() => fetchTransactions(currentPage)}
              title="Refresh ledger"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="w-full overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">Loading transaction ledger...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-foreground">No API transactions recorded yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Charges debited for automated identity verification will appear here with service breakdown.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Date &amp; Time (WAT)</th>
                  <th className="px-6 py-3.5 font-medium">Service Name</th>
                  <th className="px-6 py-3.5 font-medium">Reference</th>
                  <th className="px-6 py-3.5 font-medium">Type</th>
                  <th className="px-6 py-3.5 font-medium">Amount</th>
                  <th className="px-6 py-3.5 font-medium">Balance Before</th>
                  <th className="px-6 py-3.5 font-medium">Balance After</th>
                  <th className="px-6 py-3.5 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatWATDateTime(tx.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary whitespace-nowrap">
                        {tx.serviceName}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-foreground">
                          {tx.reference}
                        </span>
                        <button
                          onClick={() => copyRef(tx.reference)}
                          className="rounded p-1 hover:bg-muted text-muted-foreground transition-colors"
                          title="Copy Reference"
                        >
                          {copiedRef === tx.reference ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tx.type === "DEBIT" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <ArrowDownRight className="h-3 w-3" />
                          Debit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <ArrowUpRight className="h-3 w-3" />
                          Refund / Credit
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground whitespace-nowrap">
                      {tx.type === "DEBIT" ? "-" : "+"}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      ₦{tx.balanceBefore.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                      ₦{tx.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {tx.status === "SUCCESS" ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-600 dark:text-red-400">
                          {tx.status}
                        </span>
                      )}
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
            of <span className="font-semibold text-foreground">{totalCount}</span> transactions
          </span>

          {renderPaginationButtons()}
        </div>
      </div>
    </div>
  );
}
