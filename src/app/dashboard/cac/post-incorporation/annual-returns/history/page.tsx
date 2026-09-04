"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, Clock, CheckCircle, SpinnerGap, 
  DownloadSimple, FileText, MagnifyingGlass, Eye, X, Funnel, XCircle, Warning, Wallet
} from "@phosphor-icons/react";

export type AnnualReturnRecord = {
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
};

export default function AnnualReturnsHistoryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [history, setHistory] = useState<AnnualReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "APPROVED" | "QUERIED" | "REJECTED">("ALL");

  const [viewDocsModal, setViewDocsModal] = useState<AnnualReturnRecord | null>(null);
  const [viewFailedModal, setViewFailedModal] = useState<AnnualReturnRecord | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileTitle, setPreviewFileTitle] = useState<string>("");
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("submitted") === "true" || params.get("success") === "true") {
        setShowSuccessToast(true);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/cac/annual-returns");
        const data = await res.json();
        if (data.history) setHistory(data.history);
      } catch (err) {
        console.error("Failed to load Annual Returns history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    const searchTarget = `${item.companyName} ${item.registrationNumber} ${item.trackingId}`;
    const matchesSearch = searchTarget.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = history.filter(h => h.status === "PENDING").length;
  const processingCount = history.filter(h => h.status === "PROCESSING").length;
  const approvedCount = history.filter(h => h.status === "APPROVED").length;
  const rejectedCount = history.filter(h => h.status === "REJECTED" || h.status === "QUERIED").length;

  const handleDownload = async (url: string, fileName: string, id: string) => {
    if (!url) return;
    setDownloadingId(id);
    try {
      const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(fileName)}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(url, "_blank");
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative pb-12 font-sans">
      
      {showSuccessToast && (
        <div className="fixed top-24 right-4 sm:right-8 z-[9999] flex items-center gap-4 bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 fade-in duration-500">
          <CheckCircle weight="fill" className="h-7 w-7" />
          <div className="pr-4">
            <h4 className="font-black text-sm tracking-wide">Application Submitted!</h4>
            <p className="text-xs font-medium opacity-90 mt-0.5">Your CAC Annual Returns application is now PENDING review.</p>
          </div>
          <button 
            onClick={() => setShowSuccessToast(false)} 
            className="ml-auto hover:bg-emerald-600 p-1.5 rounded-full transition-colors border border-transparent hover:border-white/20 cursor-pointer"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/cac/post-incorporation/annual-returns"
            className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground">CAC Annual Returns History</h1>
            <p className="text-muted-foreground text-sm">Track your filings, resolve queries, and download official CAC acknowledgement letters.</p>
          </div>
        </div>

        <Link
          href="/dashboard/cac/post-incorporation/annual-returns"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all shrink-0 cursor-pointer w-fit"
        >
          <span>File New Return</span>
        </Link>
      </div>

      {/* Metrics Cards (Exact SCUML / Tax ID Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Clock weight="fill" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Pending</p>
            <p className="text-xl sm:text-2xl font-black text-foreground">{pendingCount}</p>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
            <SpinnerGap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Processing</p>
            <p className="text-xl sm:text-2xl font-black text-foreground">{processingCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle weight="fill" className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Approved</p>
            <p className="text-xl sm:text-2xl font-black text-foreground">{approvedCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle weight="fill" className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Queried / Rejected</p>
            <p className="text-xl sm:text-2xl font-black text-foreground">{rejectedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by company name, RC/BN number, or tracking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Funnel weight="bold" className="h-4 w-4 text-muted-foreground" />
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto bg-background border border-border rounded-xl px-4 py-2.5 text-sm outline-none font-bold cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="APPROVED">Approved</option>
            <option value="QUERIED">Queried</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <SpinnerGap className="h-8 w-8 animate-spin mb-4" />
            <p>Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground text-center">
            <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-bold">No filings found</p>
            <p className="text-sm mt-1">Adjust your filters or submit a new CAC Annual Returns application.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Entity Info</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Filing Year</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Documents</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground text-right">Acknowledgement Letter / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    
                    {/* Date & Tracking */}
                    <td className="px-6 py-4 text-muted-foreground">
                      <p className="font-bold text-foreground">
                        {format(new Date(item.createdAt), "MMM dd, yyyy")}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground mt-0.5">
                        {item.trackingId}
                      </p>
                    </td>

                    {/* Entity Info */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground max-w-[260px] truncate">
                        {item.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                        {item.registrationNumber} • {item.companyType === "LLC" ? "LLC / LTD" : "Business Name"}
                      </p>
                    </td>

                    {/* Filing Year */}
                    <td className="px-6 py-4">
                      <span className="font-bold text-foreground">
                        {item.filingYears || "2026"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {item.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1.5 text-yellow-600 bg-yellow-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-yellow-500/20">
                          <Clock weight="fill" className="h-3 w-3" /> Pending
                        </span>
                      )}
                      {item.status === "PROCESSING" && (
                        <span className="inline-flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-500/20">
                          <SpinnerGap className="h-3 w-3 animate-spin" /> Processing
                        </span>
                      )}
                      {item.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-green-500/20">
                          <CheckCircle weight="fill" className="h-3 w-3" /> Approved
                        </span>
                      )}
                      {item.status === "QUERIED" && (
                        <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                          <Warning weight="fill" className="h-3 w-3" /> Queried
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="inline-flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-red-500/20">
                          <XCircle weight="fill" className="h-3 w-3" /> Rejected
                        </span>
                      )}
                    </td>

                    {/* Uploaded Documents Button */}
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setViewDocsModal(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors bg-secondary px-3 py-1.5 rounded-lg border border-border cursor-pointer"
                      >
                        <Eye weight="bold" className="h-4 w-4" />
                        <span>View Files</span>
                      </button>
                    </td>

                    {/* Action / Certificate Column */}
                    <td className="px-6 py-4 text-right">
                      {item.status === "APPROVED" && item.acknowledgementLetterUrl ? (
                        <button 
                          onClick={() => handleDownload(
                            item.acknowledgementLetterUrl!, 
                            `${item.companyName.replace(/\s+/g, '_')}_CAC_Acknowledgement.pdf`,
                            item.id
                          )}
                          disabled={downloadingId === item.id}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary hover:opacity-90 px-3.5 py-1.5 rounded-lg shadow-sm transition-opacity cursor-pointer disabled:opacity-50"
                        >
                          {downloadingId === item.id ? (
                            <SpinnerGap className="h-4 w-4 animate-spin" />
                          ) : (
                            <DownloadSimple weight="bold" className="h-4 w-4" />
                          )}
                          <span>Download Letter</span>
                        </button>
                      ) : (item.status === "QUERIED" || item.status === "REJECTED") ? (
                        <button 
                          onClick={() => setViewFailedModal(item)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20 cursor-pointer"
                        >
                          <Warning weight="bold" className="h-4 w-4" />
                          <span>View Reason</span>
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic px-4">Processing with CAC</span>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- MODALS (MATCHING SCUML / TAX ID) ---------------- */}

      {/* 1. View Uploaded Documents Modal */}
      {mounted && viewDocsModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewDocsModal(null)}
        >
          <div 
            className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-border bg-secondary/30 shrink-0 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-black text-foreground">{viewDocsModal.companyName}</h3>
                <p className="text-xs text-muted-foreground">Uploaded Documents & Signatures</p>
              </div>
              <button 
                onClick={() => setViewDocsModal(null)} 
                className="p-1.5 hover:bg-background rounded-full transition-colors border border-transparent hover:border-border cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X weight="bold" className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-4">
              {/* CAC Verification Document */}
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border">
                <div>
                  <span className="font-bold text-sm block text-foreground">
                    {viewDocsModal.documentType === "STATUS_REPORT" ? "CAC Status Report" : "CAC Registration Certificate"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Uploaded Supporting Document</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFileUrl(viewDocsModal.documentUrl);
                    setPreviewFileTitle(`${viewDocsModal.companyName} - Verification Document`);
                  }}
                  className="text-primary text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Eye weight="bold" className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
              </div>

              {/* Officer Signature */}
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-8 rounded bg-white p-1 border border-border overflow-hidden flex items-center justify-center shrink-0">
                    <img 
                      src={viewDocsModal.designeeSignatureUrl} 
                      alt="Signature" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-sm block text-foreground">Authorizing Signature</span>
                    <span className="text-[11px] text-muted-foreground">
                      {viewDocsModal.designeeFullName} ({viewDocsModal.designeeRole})
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFileUrl(viewDocsModal.designeeSignatureUrl);
                    setPreviewFileTitle(`${viewDocsModal.designeeFullName} - Signature`);
                  }}
                  className="text-primary text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Eye weight="bold" className="h-3.5 w-3.5" />
                  <span>Preview</span>
                </button>
              </div>

              {/* Acknowledgement Letter if available */}
              {viewDocsModal.acknowledgementLetterUrl && (
                <div className="bg-emerald-500/10 rounded-xl p-4 flex items-center justify-between border border-emerald-500/20">
                  <div>
                    <span className="font-bold text-sm block text-emerald-700 dark:text-emerald-300">
                      CAC Acknowledgement Letter
                    </span>
                    <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                      Official Document Issued
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewFileUrl(viewDocsModal.acknowledgementLetterUrl!);
                      setPreviewFileTitle(`${viewDocsModal.companyName} - CAC Acknowledgement Letter`);
                    }}
                    className="text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Eye weight="bold" className="h-3.5 w-3.5" />
                    <span>Preview</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. View Queried / Failed Reason & Details Modal (Exact SCUML Style) */}
      {mounted && viewFailedModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewFailedModal(null)}
        >
          <div 
            className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl flex flex-col scale-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex flex-col items-center text-center p-8 relative rounded-t-3xl ${
              viewFailedModal.status === "QUERIED" 
                ? "bg-amber-50/50 dark:bg-amber-500/5"
                : "bg-red-50/50 dark:bg-red-500/5"
            }`}>
              <button 
                onClick={() => setViewFailedModal(null)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 cursor-pointer"
              >
                <X weight="bold" className="h-5 w-5" />
              </button>
              
              <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 ${
                viewFailedModal.status === "QUERIED"
                  ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                  : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
              }`}>
                <Warning weight="fill" className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-foreground">
                {viewFailedModal.status === "QUERIED" ? "Filing Queried" : "Application Rejected"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                Your CAC Annual Returns filing for <strong>{viewFailedModal.companyName}</strong> requires attention.
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                  {viewFailedModal.status === "QUERIED" ? "Query Details from Compliance Desk" : "Reason for Rejection"}
                </p>
                <div className="p-4 bg-secondary/50 border border-border rounded-xl text-sm font-medium text-foreground whitespace-pre-wrap">
                  {viewFailedModal.status === "QUERIED" 
                    ? (viewFailedModal.queryReason || "Documentation query raised by CAC compliance officer.") 
                    : (viewFailedModal.rejectionReason || "No specific reason provided by the examiner.")}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 flex gap-3">
                <Wallet weight="fill" className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-900 dark:text-yellow-400 mb-1">Assistance & Resolution</p>
                  <p className="text-xs text-yellow-800/80 dark:text-yellow-500/80 leading-relaxed">
                    {viewFailedModal.status === "QUERIED"
                      ? "Please contact LoraBiz compliance support with your updated documents to resolve this query promptly."
                      : "If this rejection qualified for a refund, the funds have been credited back to your LoraBiz Wallet."}
                  </p>
                  <Link 
                    href="/dashboard/transactions"
                    className="inline-block mt-3 text-xs font-bold text-yellow-700 dark:text-yellow-400 hover:underline"
                  >
                    View Transaction History ↗
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 3. In-App Document Preview Modal */}
      {mounted && previewFileUrl && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-background/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewFileUrl(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={20} weight="bold" className="text-primary shrink-0" />
                <h3 className="font-extrabold text-sm text-foreground truncate">
                  {previewFileTitle || "Document Preview"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFileUrl(null)}
                className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto bg-black/5 dark:bg-black/20 flex items-center justify-center min-h-[300px]">
              {previewFileUrl.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewFileUrl}
                  title="PDF Preview"
                  className="w-full h-[70vh] rounded-2xl border border-border bg-white"
                />
              ) : (
                <img 
                  src={previewFileUrl} 
                  alt="Document Preview" 
                  className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-md"
                />
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-secondary/20 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewFileUrl(null)}
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
