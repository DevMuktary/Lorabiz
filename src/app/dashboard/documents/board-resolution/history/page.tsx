"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  FileText, 
  DownloadSimple, 
  Eye, 
  Trash, 
  Plus, 
  MagnifyingGlass, 
  CheckCircle, 
  Clock, 
  FilePdf, 
  SpinnerGap, 
  Bank,
  CreditCard,
  Buildings,
  SealCheck,
  X,
  ArrowRight,
  Printer
} from "@phosphor-icons/react";
import ResolutionDocumentView from "@/components/features/documents/ResolutionDocumentView";
import { StructuredResolutionOutput } from "@/lib/board-resolution-generator";

type BoardResolutionRecord = {
  id: string;
  documentType: string;
  title: string;
  companyName: string;
  status: "DRAFT" | "COMPLETED" | "GENERATING" | "FAILED";
  accentColor?: string;
  logoUrl?: string;
  formData: any;
  structuredData?: StructuredResolutionOutput | null;
  pdfUrl?: string | null;
  imageUrl?: string | null;
  amountPaid: number;
  transactionRef: string;
  createdAt: string;
  updatedAt: string;
};

export default function BoardResolutionHistoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [completedDocs, setCompletedDocs] = useState<BoardResolutionRecord[]>([]);
  const [draftDocs, setDraftDocs] = useState<BoardResolutionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "COMPLETED" | "DRAFT">("ALL");

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<BoardResolutionRecord | null>(null);

  // Delete Draft Modal State
  const [draftToDelete, setDraftToDelete] = useState<BoardResolutionRecord | null>(null);
  const [isDeletingDraft, setIsDeletingDraft] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/documents/board-resolution/history");
      const json = await res.json();
      if (json.success && json.data) {
        setCompletedDocs(json.data.completed || []);
        setDraftDocs(json.data.drafts || []);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteDraft = async () => {
    if (!draftToDelete) return;
    setIsDeletingDraft(true);
    try {
      const res = await fetch(`/api/documents/board-resolution/draft?id=${draftToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setDraftDocs(prev => prev.filter(d => d.id !== draftToDelete.id));
        showToast("Draft discarded successfully.");
      } else {
        showToast(data.error || "Failed to delete draft.");
      }
    } catch {
      showToast("Network error deleting draft.");
    } finally {
      setIsDeletingDraft(false);
      setDraftToDelete(null);
    }
  };

  const handleDownloadPdf = (doc: BoardResolutionRecord) => {
    if (doc.pdfUrl) {
      const link = document.createElement("a");
      link.href = doc.pdfUrl;
      link.download = `${(doc.companyName || "Board_Resolution").replace(/[^a-zA-Z0-9_-]/g, "_")}_Resolution.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Download started!");
    } else {
      setPreviewDoc(doc);
    }
  };

  // Combine all items for unified table
  const allRecords: BoardResolutionRecord[] = [
    ...draftDocs.map(d => ({ ...d, status: "DRAFT" as const })),
    ...completedDocs.map(c => ({ ...c, status: "COMPLETED" as const }))
  ];

  // Filter records based on tab and search
  const filteredRecords = allRecords.filter((item) => {
    const matchesFilter = 
      statusFilter === "ALL" ? true :
      statusFilter === "COMPLETED" ? item.status === "COMPLETED" :
      item.status === "DRAFT";

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesFilter;

    const company = (item.companyName || "").toLowerCase();
    const title = (item.title || "").toLowerCase();
    const institution = (item.formData?.targetInstitution || "").toLowerCase();
    const ref = (item.transactionRef || "").toLowerCase();
    const rc = (item.formData?.rcNumber || "").toLowerCase();

    const matchesSearch = 
      company.includes(q) || 
      title.includes(q) || 
      institution.includes(q) || 
      ref.includes(q) ||
      rc.includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto relative pb-20 px-4 sm:px-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-[9999] flex items-center gap-3 bg-card border border-emerald-500/40 text-foreground px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3.5">
          <Link 
            href="/dashboard/documents/board-resolution"
            className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary transition-colors shadow-sm"
            title="Back to Board Resolution Generator"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Corporate Records
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
              Board Resolution History
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Resume saved drafts and access certified CAMA 2020 board resolutions.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/documents/board-resolution"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <Plus weight="bold" className="h-4 w-4" />
          <span>New Resolution</span>
        </Link>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <SealCheck weight="fill" className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed Documents</p>
            <p className="text-2xl font-black text-foreground">{completedDocs.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock weight="fill" className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unsubmitted Drafts</p>
            <p className="text-2xl font-black text-foreground">{draftDocs.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <FilePdf weight="fill" className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Records</p>
            <p className="text-2xl font-black text-foreground">{allRecords.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center p-1 bg-secondary/50 border border-border rounded-xl">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Records ({allRecords.length})
          </button>
          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "COMPLETED"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500" />
            <span>Completed ({completedDocs.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter("DRAFT")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === "DRAFT"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock weight="fill" className="h-3.5 w-3.5 text-amber-500" />
            <span>Drafts ({draftDocs.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company, RC number, or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X weight="bold" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Flow */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-muted-foreground space-y-3">
            <SpinnerGap className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading resolution history...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground/50" weight="duotone" />
            <p className="text-base font-bold text-foreground">No resolution records found</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              {searchQuery 
                ? `No records match your search "${searchQuery}". Try a different keyword.` 
                : "You have no board resolutions in this view. Generate your first CAMA 2020 resolution now."}
            </p>
            <Link
              href="/dashboard/documents/board-resolution"
              className="inline-flex items-center gap-1.5 px-4 py-2 mt-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:bg-primary/90 transition-all"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" />
              <span>Generate Resolution</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-bold">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Company & Purpose</th>
                  <th className="px-5 py-3.5">Target Institution</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Amount / Ref</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((item) => {
                  const isCompleted = item.status === "COMPLETED";
                  const dateStr = item.createdAt || item.updatedAt;
                  const formattedDate = dateStr 
                    ? format(new Date(dateStr), "MMM d, yyyy • h:mm a") 
                    : "—";
                  const institution = item.formData?.targetInstitution || "Commercial Bank / Fintech";
                  const isGateway = item.formData?.purposeCategory === "PAYMENT_GATEWAY";
                  const savedStep = item.formData?.savedCurrentStep || 1;

                  return (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Date */}
                      <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Company & Purpose */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground text-sm max-w-xs truncate">
                            {item.companyName || "Untitled Company"}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {item.formData?.rcNumber && (
                              <span>RC: {item.formData.rcNumber}</span>
                            )}
                            {item.formData?.rcNumber && <span>•</span>}
                            <span className="inline-flex items-center gap-1">
                              {isGateway ? (
                                <>
                                  <CreditCard className="h-3 w-3 text-primary" weight="fill" />
                                  <span>Payment Gateway</span>
                                </>
                              ) : (
                                <>
                                  <Bank className="h-3 w-3 text-primary" weight="fill" />
                                  <span>Corporate Account</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Target Institution */}
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {institution}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle weight="fill" className="h-3 w-3" />
                            <span>Completed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <Clock weight="fill" className="h-3 w-3" />
                            <span>Draft (Step {savedStep}/4)</span>
                          </span>
                        )}
                      </td>

                      {/* Amount / Ref */}
                      <td className="px-5 py-4">
                        {isCompleted ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₦{Number(item.amountPaid || 3500).toLocaleString()}
                            </p>
                            <p className="font-mono text-[10px] text-muted-foreground">
                              {item.transactionRef || "TX_DOC"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">
                            Unsubmitted
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {isCompleted ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewDoc(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-lg border border-border transition-colors cursor-pointer"
                              title="View Document"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleDownloadPdf(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                              title="Download PDF"
                            >
                              <DownloadSimple className="h-3.5 w-3.5" weight="bold" />
                              <span>PDF</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/documents/board-resolution?draftId=${item.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              <span>Resume</span>
                              <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                            </Link>

                            <button
                              onClick={() => setDraftToDelete(item)}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                              title="Discard Draft"
                            >
                              <Trash className="h-4 w-4" weight="bold" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* PREVIEW & PRINT MODAL                                    */}
      {/* ======================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div>
                <h3 className="text-base font-black text-foreground">{previewDoc.title || previewDoc.companyName}</h3>
                <p className="text-xs text-muted-foreground">Certified CAMA 2020 Extract & Signatories Mandate</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(previewDoc)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X weight="bold" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/40 custom-scrollbar">
              <div className="max-w-2xl mx-auto">
                <ResolutionDocumentView
                  data={previewDoc.structuredData || previewDoc.formData}
                  accentColor={previewDoc.accentColor || previewDoc.formData?.accentColor || "#0f172a"}
                  logoUrl={previewDoc.logoUrl || previewDoc.formData?.logoUrl}
                  sealUrl={previewDoc.formData?.sealUrl}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE DRAFT CONFIRMATION MODAL                          */}
      {/* ======================================================== */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
              <Trash weight="duotone" className="h-6 w-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-foreground">Discard Resolution Draft?</h3>
              <p className="text-xs text-muted-foreground">
                Are you sure you want to discard the draft for <span className="font-bold text-foreground">{draftToDelete.companyName || "Untitled Company"}</span>? This draft will be deleted permanently.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isDeletingDraft}
                onClick={() => setDraftToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingDraft}
                onClick={handleDeleteDraft}
                className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeletingDraft ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  "Discard Draft"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
