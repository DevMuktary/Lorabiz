"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, Clock, CheckCircle, SpinnerGap, 
  DownloadSimple, FileText, MagnifyingGlass, Eye, X, Funnel, XCircle, Warning, Wallet
} from "@phosphor-icons/react";

type ScumlRecord = {
  id: string;
  companyName: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  certificateUrl: string;
  statusReportUrl: string;
  memorandumUrl?: string | null;
  constitutionUrl?: string | null;
  finalCertificateUrl?: string | null;
  failureReason?: string | null;
};

export default function ScumlHistoryPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [history, setHistory] = useState<ScumlRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED">("ALL");

  const [viewDocsModal, setViewDocsModal] = useState<ScumlRecord | null>(null);
  const [viewFailedModal, setViewFailedModal] = useState<ScumlRecord | null>(null);
  
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
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
        const res = await fetch("/api/scuml");
        const data = await res.json();
        if (data.history) setHistory(data.history);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredHistory = history.filter(item => {
    const matchesSearch = item.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = history.filter(h => h.status === "PENDING").length;
  const processingCount = history.filter(h => h.status === "PROCESSING").length;
  const completedCount = history.filter(h => h.status === "COMPLETED").length;
  const failedCount = history.filter(h => h.status === "FAILED").length;

  const handleDownload = (url: string, fileName: string) => {
    if (!url) return;
    const downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative">
      
      {showSuccessToast && (
        <div className="fixed top-24 right-4 sm:right-8 z-[9999] flex items-center gap-4 bg-emerald-500 text-white px-5 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-8 fade-in duration-500">
          <CheckCircle weight="fill" className="h-7 w-7" />
          <div className="pr-4">
            <h4 className="font-black text-sm tracking-wide">Application Submitted!</h4>
            <p className="text-xs font-medium opacity-90 mt-0.5">Your SCUML application is now PENDING.</p>
          </div>
          <button 
            onClick={() => setShowSuccessToast(false)} 
            className="ml-auto hover:bg-emerald-600 p-1.5 rounded-full transition-colors border border-transparent hover:border-white/20"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/scuml"
          className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary transition-colors"
        >
          <ArrowLeft weight="bold" className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black">SCUML History</h1>
          <p className="text-muted-foreground text-sm">Track your applications and download certificates.</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <Clock weight="fill" className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Pending</p>
            <p className="text-xl sm:text-2xl font-black">{pendingCount}</p>
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
            <SpinnerGap className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 animate-spin" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Processing</p>
            <p className="text-xl sm:text-2xl font-black">{processingCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle weight="fill" className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Completed</p>
            <p className="text-xl sm:text-2xl font-black">{completedCount}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-500/10 rounded-full flex items-center justify-center">
            <XCircle weight="fill" className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground">Failed</p>
            <p className="text-xl sm:text-2xl font-black">{failedCount}</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search by company name..."
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
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <SpinnerGap className="h-8 w-8 animate-spin mb-4" />
            <p>Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground text-center">
            <FileText className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-bold">No applications found</p>
            <p className="text-sm mt-1">Adjust your filters or submit a new SCUML application.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Date</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Company Name</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Status</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground">Submitted Docs</th>
                  <th className="px-6 py-4 font-bold text-muted-foreground text-right">Action / Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(item.createdAt), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{item.companyName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.type.replace("_", " ")}</p>
                    </td>
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
                      {item.status === "COMPLETED" && (
                        <span className="inline-flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-green-500/20">
                          <CheckCircle weight="fill" className="h-3 w-3" /> Completed
                        </span>
                      )}
                      {item.status === "FAILED" && (
                        <span className="inline-flex items-center gap-1.5 text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full text-xs font-bold border border-red-500/20">
                          <XCircle weight="fill" className="h-3 w-3" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setViewDocsModal(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground hover:text-primary transition-colors bg-secondary px-3 py-1.5 rounded-lg border border-border cursor-pointer"
                      >
                        <Eye weight="bold" className="h-4 w-4" />
                        View Files
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {item.status === "COMPLETED" && item.finalCertificateUrl ? (
                        <button 
                          onClick={() => handleDownload(item.finalCertificateUrl!, `${item.companyName.replace(/\s+/g, '_')}_SCUML.pdf`)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-foreground bg-primary hover:opacity-90 px-3.5 py-1.5 rounded-lg shadow-sm transition-opacity cursor-pointer"
                        >
                          <DownloadSimple weight="bold" className="h-4 w-4" />
                          Download
                        </button>
                      ) : item.status === "FAILED" ? (
                        <button 
                          onClick={() => setViewFailedModal(item)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20 cursor-pointer"
                        >
                          <Warning weight="bold" className="h-4 w-4" />
                          View Reason
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic px-4">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------- MODALS ---------------- */}

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
                <h3 className="text-lg font-black">{viewDocsModal.companyName}</h3>
                <p className="text-xs text-muted-foreground">Uploaded Documents</p>
              </div>
              <button onClick={() => setViewDocsModal(null)} className="p-1.5 hover:bg-background rounded-full transition-colors border border-transparent hover:border-border cursor-pointer">
                <X weight="bold" className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-4">
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border">
                <span className="font-bold text-sm">CAC Certificate</span>
                <a href={viewDocsModal.certificateUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">Open File ↗</a>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border">
                <span className="font-bold text-sm">Status Report</span>
                <a href={viewDocsModal.statusReportUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">Open File ↗</a>
              </div>
              {viewDocsModal.memorandumUrl && (
                <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border">
                  <span className="font-bold text-sm">Memorandum (MEMART)</span>
                  <a href={viewDocsModal.memorandumUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">Open File ↗</a>
                </div>
              )}
              {viewDocsModal.constitutionUrl && (
                <div className="bg-secondary/50 rounded-xl p-4 flex items-center justify-between border border-border">
                  <span className="font-bold text-sm">Constitution</span>
                  <a href={viewDocsModal.constitutionUrl} target="_blank" rel="noreferrer" className="text-primary text-xs font-bold hover:underline">Open File ↗</a>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 2. View Failed Reason & Refund Modal */}
      {mounted && viewFailedModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setViewFailedModal(null)}
        >
          <div 
            className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl flex flex-col scale-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center p-8 bg-red-50/50 dark:bg-red-500/5 relative rounded-t-3xl">
              <button 
                onClick={() => setViewFailedModal(null)} 
                className="absolute top-4 right-4 p-1.5 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 cursor-pointer"
              >
                <X weight="bold" className="h-5 w-5" />
              </button>
              
              <div className="h-16 w-16 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-full flex items-center justify-center mb-4">
                <Warning weight="fill" className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-foreground">Application Rejected</h3>
              <p className="text-sm text-muted-foreground mt-1 px-4">
                Your SCUML application for <strong>{viewFailedModal.companyName}</strong> could not be processed.
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Reason for Rejection</p>
                <div className="p-4 bg-secondary/50 border border-border rounded-xl text-sm font-medium text-foreground whitespace-pre-wrap">
                  {viewFailedModal.failureReason || "No specific reason provided by the examiner."}
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl p-4 flex gap-3">
                <Wallet weight="fill" className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-yellow-900 dark:text-yellow-400 mb-1">About Your Refund</p>
                  <p className="text-xs text-yellow-800/80 dark:text-yellow-500/80 leading-relaxed">
                    If this rejection qualified for a refund (full or partial), the funds have already been automatically credited back to your Lorabiz Wallet.
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

    </div>
  );
}
