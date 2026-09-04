"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { createPortal } from "react-dom";
import { 
  ArrowLeft, 
  Plus, 
  ArrowsClockwise, 
  ShieldCheck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MagnifyingGlass, 
  Funnel, 
  Eye, 
  DownloadSimple, 
  Buildings, 
  X, 
  FileText, 
  Copy, 
  Check, 
  WarningCircle, 
  Wallet,
  Receipt,
  FilePdf
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export interface AnnualReturnRecord {
  id: string;
  trackingId: string;
  companyType: "BUSINESS_NAME" | "LLC";
  companyName: string;
  registrationNumber: string;
  filingYears: string | null;
  documentType: string;
  documentUrl: string;
  designeeFullName: string;
  designeeRole: string;
  designeeSignatureUrl: string;
  status: "PENDING" | "PROCESSING" | "APPROVED" | "QUERIED" | "REJECTED";
  queryReason?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  acknowledgementLetterUrl?: string | null;
  amountPaid: number;
  transactionRef: string;
  createdAt: string;
  approvedAt?: string | null;
}

export type AnnualReturnStatusFilter = "ALL" | "PENDING" | "PROCESSING" | "APPROVED" | "REJECTED";

export default function AnnualReturnsHistoryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [records, setRecords] = useState<AnnualReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<AnnualReturnStatusFilter>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState<AnnualReturnRecord | null>(null);
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("submitted") === "true") {
        setToastMessage("Your CAC Annual Returns application has been submitted and is pending review!");
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        setTimeout(() => setToastMessage(null), 6000);
      }
    }
  }, []);

  const fetchHistory = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/cac/annual-returns");
      const data = await res.json();
      if (data.success && data.history) {
        setRecords(data.history);
      }
    } catch (err) {
      console.error("Failed to load Annual Returns history:", err);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter((r) => r.status === "PENDING").length,
      processing: records.filter((r) => r.status === "PROCESSING").length,
      approved: records.filter((r) => r.status === "APPROVED").length,
      rejected: records.filter((r) => r.status === "REJECTED" || r.status === "QUERIED").length,
    };
  }, [records]);

  // Stat Cards Config (Exact Glowing Cards from NIN Modification)
  const statCards = [
    {
      id: "ALL" as const,
      title: "Total Filings",
      value: stats.total,
      icon: FileText,
      color: "text-foreground",
      iconClass: "text-muted-foreground",
      activeClass: "ring-2 ring-primary border-primary bg-primary/5 shadow-md",
      defaultClass: "bg-card border-border hover:border-primary/40",
    },
    {
      id: "PENDING" as const,
      title: "Pending Review",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      iconClass: "text-amber-500",
      activeClass: "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md",
      defaultClass: "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50",
      badge: stats.pending > 0 ? "Queued" : undefined,
    },
    {
      id: "PROCESSING" as const,
      title: "In Processing",
      value: stats.processing,
      icon: ArrowsClockwise,
      color: "text-sky-600 dark:text-sky-400",
      iconClass: "text-sky-500",
      activeClass: "ring-2 ring-sky-500 border-sky-500 bg-sky-500/15 shadow-md",
      defaultClass: "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50",
      badge: stats.processing > 0 ? "Active" : undefined,
    },
    {
      id: "APPROVED" as const,
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      iconClass: "text-emerald-500",
      activeClass: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-md",
      defaultClass: "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50",
    },
    {
      id: "REJECTED" as const,
      title: "Rejected / Query",
      value: stats.rejected,
      icon: XCircle,
      color: "text-destructive",
      iconClass: "text-destructive",
      activeClass: "ring-2 ring-destructive border-destructive bg-destructive/15 shadow-md",
      defaultClass: "bg-destructive/5 border-destructive/20 hover:border-destructive/50",
    },
  ];

  // Filtered and Searched Records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const s = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !s ||
        rec.companyName.toLowerCase().includes(s) ||
        rec.registrationNumber.toLowerCase().includes(s) ||
        rec.trackingId.toLowerCase().includes(s) ||
        (rec.filingYears && rec.filingYears.toLowerCase().includes(s));

      const matchesStatus =
        activeFilter === "ALL"
          ? true
          : activeFilter === "REJECTED"
          ? rec.status === "REJECTED" || rec.status === "QUERIED"
          : rec.status === activeFilter;

      const matchesType = typeFilter === "ALL" || rec.companyType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [records, searchQuery, activeFilter, typeFilter]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleForceDownload = (url: string, filename: string, id: string) => {
    setDownloadingId(id);
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      window.open(url, "_blank");
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  const getStatusBadge = (status: AnnualReturnRecord["status"]) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock weight="bold" className="h-3 w-3" />
            Pending Review
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <ArrowsClockwise weight="bold" className="h-3 w-3 animate-spin" />
            In Processing
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle weight="bold" className="h-3 w-3" />
            Approved
          </span>
        );
      case "QUERIED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <WarningCircle weight="bold" className="h-3 w-3" />
            Queried
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle weight="bold" className="h-3 w-3" />
            Rejected
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* Back Breadcrumb (Exact NIN Modification Layout) */}
      <Link 
        href="/dashboard/cac/post-incorporation/annual-returns" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Annual Returns Form
      </Link>

      {/* Page Header (Exact Standard IPE Layout matching NIN Modification History) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/cac.png" 
              alt="CAC Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              CAC Statutory Compliance Desk
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">CAC Annual Returns History</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Track real-time status and retrieve official acknowledgement letters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchHistory(true)}
            disabled={isRefreshing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs sm:text-sm font-bold rounded-xl border border-border transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise weight="bold" className={`h-4 w-4 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link 
            href="/dashboard/cac/post-incorporation/annual-returns" 
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all shrink-0 cursor-pointer"
          >
            <Plus weight="bold" className="h-4 w-4" />
            <span>New Filing</span>
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 text-foreground font-bold">
            <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* GLOWING INTERACTIVE STATS CARDS (Exact NIN Modification History Stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const IconComponent = card.icon;
          const isActive = activeFilter === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveFilter(card.id)}
              className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isActive ? card.activeClass : card.defaultClass
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? card.color : "text-muted-foreground"}`}>
                  {card.title}
                </span>
                <IconComponent weight={isActive ? "fill" : "bold"} className={`h-4 w-4 ${card.iconClass}`} />
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span className={`text-2xl sm:text-3xl font-black ${card.color}`}>
                  {card.value}
                </span>
                {card.badge && (
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {card.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filters and Search Bar (Exact NIN Modification Table Controls) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-3.5 rounded-2xl shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by company name, RC/BN number, or tracking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-border rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-secondary/50 border border-border px-3 py-1.5 rounded-xl">
            <Funnel weight="bold" className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Structures</option>
              <option value="BUSINESS_NAME">Business Name</option>
              <option value="LLC">Company (LLC)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary/50 border border-border px-3 py-1.5 rounded-xl">
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as AnnualReturnStatusFilter)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="PROCESSING">In Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected / Query</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Data Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <ArrowsClockwise className="h-8 w-8 animate-spin text-primary mb-3" weight="bold" />
            <p className="text-xs font-bold">Loading filing records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <FileText weight="duotone" className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">No Filings Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                {searchQuery || activeFilter !== "ALL" || typeFilter !== "ALL"
                  ? "No annual return filings match your search criteria or status filter."
                  : "You have not submitted any CAC Annual Returns filings yet."}
              </p>
            </div>
            <Link
              href="/dashboard/cac/post-incorporation/annual-returns"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={14} weight="bold" />
              <span>Submit New Filing</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-5 py-3.5 font-bold text-muted-foreground">Tracking ID & Date</th>
                  <th className="px-5 py-3.5 font-bold text-muted-foreground">Entity Name & Reg No</th>
                  <th className="px-5 py-3.5 font-bold text-muted-foreground">Structure & Year</th>
                  <th className="px-5 py-3.5 font-bold text-muted-foreground">Status</th>
                  <th className="px-5 py-3.5 font-bold text-muted-foreground">Amount</th>
                  <th className="px-5 py-3.5 font-bold text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    
                    {/* Tracking ID & Date with Copy button */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-foreground">{item.trackingId}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.id, item.trackingId)}
                          className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy Tracking ID"
                        >
                          {copiedId === item.id ? (
                            <Check weight="bold" className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy weight="bold" className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(item.createdAt), "MMM d, yyyy • h:mm a")}
                      </p>
                    </td>

                    {/* Entity Name & Reg No */}
                    <td className="px-5 py-4">
                      <p className="font-bold text-foreground max-w-[240px] truncate">
                        {item.companyName}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {item.registrationNumber}
                      </p>
                    </td>

                    {/* Structure & Year */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        item.companyType === "LLC"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {item.companyType === "LLC" ? "LLC / LTD" : "Business Name"}
                      </span>
                      <p className="text-[11px] text-muted-foreground font-bold mt-0.5">
                        Year: {item.filingYears || "2026"}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4">
                      <span className="font-black text-foreground font-mono">
                        ₦{Number(item.amountPaid).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* If Approved, direct force download button */}
                        {item.status === "APPROVED" && item.acknowledgementLetterUrl && (
                          <button
                            type="button"
                            onClick={() => handleForceDownload(
                              item.acknowledgementLetterUrl!,
                              `CAC_Acknowledgement_${item.trackingId}.pdf`,
                              item.id
                            )}
                            disabled={downloadingId === item.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors disabled:opacity-50"
                            title="Download Official Acknowledgement Letter"
                          >
                            <DownloadSimple size={13} weight="bold" />
                            <span>Download Letter</span>
                          </button>
                        )}

                        {/* View Details Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(item)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <Eye size={13} weight="bold" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- MODAL: FILING DETAILS (Matches ModificationDetailsModal) ---------------- */}
      {mounted && selectedRecord && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedRecord(null)}
        >
          <div 
            className="w-full max-w-2xl bg-card border border-border rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm">
                  <Buildings size={22} weight="duotone" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-foreground">
                      {selectedRecord.companyName}
                    </h3>
                    {getStatusBadge(selectedRecord.status)}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    Tracking ID: {selectedRecord.trackingId} • Reg: {selectedRecord.registrationNumber}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            {/* QUERIED NOTICE */}
            {selectedRecord.status === "QUERIED" && selectedRecord.queryReason && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <WarningCircle size={15} weight="bold" />
                  <span>Action Required: Filing Query</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {selectedRecord.queryReason}
                </p>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Please reach out to support or submit required documentation to resolve this query.
                </p>
              </div>
            )}

            {/* REJECTED NOTICE */}
            {selectedRecord.status === "REJECTED" && selectedRecord.rejectionReason && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <XCircle size={15} weight="bold" />
                  <span>Application Rejected</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {selectedRecord.rejectionReason}
                </p>
              </div>
            )}

            {/* APPROVED & LETTER AVAILABLE */}
            {selectedRecord.status === "APPROVED" && selectedRecord.acknowledgementLetterUrl && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    <CheckCircle size={15} weight="bold" />
                    <span>Official CAC Acknowledgement Letter Ready</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your Annual Returns filing is concluded and registered on the CAC portal.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocUrl(selectedRecord.acknowledgementLetterUrl!);
                      setPreviewDocTitle("CAC Acknowledgement Letter");
                    }}
                    className="p-2 rounded-xl bg-card hover:bg-secondary text-foreground border border-border cursor-pointer transition-colors"
                    title="Preview Letter"
                  >
                    <Eye size={15} weight="bold" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleForceDownload(
                      selectedRecord.acknowledgementLetterUrl!,
                      `CAC_Acknowledgement_${selectedRecord.trackingId}.pdf`,
                      selectedRecord.id
                    )}
                    className="inline-flex items-center gap-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer transition-colors"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>Force Download</span>
                  </button>
                </div>
              </div>
            )}

            {/* Details Summary Grid */}
            <div className="bg-secondary/30 border border-border rounded-2xl p-4 grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Structure:</span>
                <span className="font-bold text-foreground">
                  {selectedRecord.companyType === "LLC" ? "Company (LLC / LTD)" : "Business Name"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Filing Year:</span>
                <span className="font-mono font-bold text-foreground">
                  {selectedRecord.filingYears || "2026"}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Authorizing Officer:</span>
                <span className="font-bold text-foreground">
                  {selectedRecord.designeeFullName}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Designation:</span>
                <span className="font-bold text-foreground">
                  {selectedRecord.designeeRole}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Amount Paid:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₦{Number(selectedRecord.amountPaid).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Payment Reference:</span>
                <span className="font-mono text-muted-foreground text-[11px]">
                  {selectedRecord.transactionRef}
                </span>
              </div>
            </div>

            {/* Attached Documents */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                Submitted Documentation
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Document */}
                <div className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FilePdf size={18} weight="bold" className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {selectedRecord.documentType === "STATUS_REPORT" ? "CAC Status Report" : "CAC Certificate"}
                      </p>
                      <span className="text-[10px] text-muted-foreground">Supporting Document</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocUrl(selectedRecord.documentUrl);
                      setPreviewDocTitle(`${selectedRecord.companyName} - Verification Document`);
                    }}
                    className="p-1.5 rounded-lg bg-card hover:bg-secondary border border-border text-foreground cursor-pointer transition-colors"
                    title="View Document"
                  >
                    <Eye size={14} weight="bold" />
                  </button>
                </div>

                {/* Signature */}
                <div className="p-3 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-7 rounded bg-white p-0.5 border border-border overflow-hidden flex items-center justify-center shrink-0">
                      <img 
                        src={selectedRecord.designeeSignatureUrl} 
                        alt="Signature" 
                        className="max-h-full max-w-full object-contain" 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        Officer Signature
                      </p>
                      <span className="text-[10px] text-muted-foreground">Attestation Signed</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPreviewDocUrl(selectedRecord.designeeSignatureUrl);
                      setPreviewDocTitle(`${selectedRecord.designeeFullName} - Signature`);
                    }}
                    className="p-1.5 rounded-lg bg-card hover:bg-secondary border border-border text-foreground cursor-pointer transition-colors"
                    title="View Signature"
                  >
                    <Eye size={14} weight="bold" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-border flex justify-end">
              <Button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="h-9 px-5 text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Details
              </Button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* ---------------- MODAL: IN-APP DOCUMENT PREVIEW ---------------- */}
      {mounted && previewDocUrl && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-background/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewDocUrl(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={18} weight="bold" className="text-primary shrink-0" />
                <h3 className="font-extrabold text-sm text-foreground truncate">
                  {previewDocTitle || "Document Preview"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              >
                <X size={15} weight="bold" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-black/5 dark:bg-black/20 flex items-center justify-center min-h-[300px]">
              {previewDocUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewDocUrl}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-2xl border border-border bg-white"
                />
              ) : (
                <img 
                  src={previewDocUrl} 
                  alt="Document Preview" 
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-md"
                />
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-secondary/20 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDocUrl(null)}
                className="h-9 px-5 text-xs font-bold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
