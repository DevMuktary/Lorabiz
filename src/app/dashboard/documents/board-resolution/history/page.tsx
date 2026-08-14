"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkle,
  Bank,
  CreditCard,
  BuildingOffice,
  Calendar,
  SealCheck,
  X,
  ArrowRight
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
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [completedDocs, setCompletedDocs] = useState<BoardResolutionRecord[]>([]);
  const [draftDocs, setDraftDocs] = useState<BoardResolutionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "COMPLETED" | "DRAFT">("ALL");

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
        showToast("Draft deleted successfully.");
      } else {
        alert(data.message || "Failed to delete draft.");
      }
    } catch (err) {
      console.error("Error deleting draft:", err);
      alert("An error occurred while deleting draft.");
    } finally {
      setIsDeletingDraft(false);
      setDraftToDelete(null);
    }
  };

  const handleDownloadPdf = (doc: BoardResolutionRecord) => {
    if (doc.pdfUrl) {
      const link = document.createElement("a");
      link.href = doc.pdfUrl;
      const safeName = (doc.companyName || "Board_Resolution").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${safeName}_Board_Resolution.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Download started!");
    } else {
      // Fallback: Open preview modal
      setPreviewDoc(doc);
    }
  };

  // Filter items based on search query
  const filteredCompleted = completedDocs.filter(d => 
    d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.formData?.targetInstitution && d.formData.targetInstitution.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDrafts = draftDocs.filter(d => 
    d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.formData?.targetInstitution && d.formData.targetInstitution.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 px-4 sm:px-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-[9999] flex items-center gap-3 bg-slate-900 border border-emerald-500/40 text-emerald-400 px-5 py-3.5 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle weight="fill" className="h-5 w-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div className="flex items-center gap-3.5">
          <Link 
            href="/dashboard/documents/board-resolution"
            className="h-10 w-10 flex items-center justify-center bg-card border border-border rounded-xl hover:bg-secondary/70 transition-colors shadow-sm"
            title="Back to Generator"
          >
            <ArrowLeft weight="bold" className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Legal Document Vault
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-foreground">
              Board Resolution History
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Resume unsubmitted drafts and access certified CAMA 2020 board resolutions.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/documents/board-resolution"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all active:scale-[0.98]"
        >
          <Plus weight="bold" className="h-4 w-4" />
          Generate New Resolution
        </Link>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <SealCheck weight="fill" className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-foreground">{completedDocs.length}</p>
          </div>
        </div>

        <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock weight="fill" className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unsubmitted Drafts</p>
            <p className="text-2xl font-black text-foreground">{draftDocs.length}</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 flex items-center gap-3.5 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FilePdf weight="fill" className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Vault Records</p>
            <p className="text-2xl font-black text-foreground">{completedDocs.length + draftDocs.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-secondary/50 border border-border/60 rounded-xl">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "ALL" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Records ({completedDocs.length + draftDocs.length})
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "COMPLETED" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-500" />
            Completed ({completedDocs.length})
          </button>
          <button
            onClick={() => setActiveTab("DRAFT")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "DRAFT" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock weight="fill" className="h-3.5 w-3.5 text-amber-500" />
            Drafts ({draftDocs.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search company, institution, or bank..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-card border border-border/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
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

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4 py-12 text-center">
          <SpinnerGap className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm font-medium text-muted-foreground">Loading your Board Resolutions...</p>
        </div>
      ) : (
        <div className="space-y-10">

          {/* ======================================================== */}
          {/* SECTION 1: UNSUBMITTED DRAFTS (CONTINUE RESOLUTION) */}
          {/* ======================================================== */}
          {(activeTab === "ALL" || activeTab === "DRAFT") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                  <h2 className="text-lg font-black text-foreground">
                    Unsubmitted Drafts ({filteredDrafts.length})
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">Continue where you left off</p>
              </div>

              {filteredDrafts.length === 0 ? (
                activeTab === "DRAFT" ? (
                  <div className="bg-card/40 border border-dashed border-border/80 rounded-2xl p-10 text-center space-y-3">
                    <Clock weight="duotone" className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm font-bold text-foreground">No unsubmitted drafts found</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      All your board resolution applications have been completed and generated.
                    </p>
                  </div>
                ) : null
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDrafts.map((draft) => {
                    const savedStep = draft.formData?.savedCurrentStep || 1;
                    const institution = draft.formData?.targetInstitution || "Not specified";
                    const formattedDate = draft.updatedAt 
                      ? format(new Date(draft.updatedAt), "dd MMM yyyy, hh:mm a")
                      : "Recently";

                    return (
                      <div 
                        key={draft.id}
                        className="bg-card border border-amber-500/30 hover:border-amber-500/60 transition-all rounded-2xl p-5 shadow-sm space-y-4 relative group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Step {savedStep} of 3
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Saved {formattedDate}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-foreground line-clamp-1">
                              {draft.companyName || "Untitled Company"}
                            </h3>
                          </div>

                          <button
                            onClick={() => setDraftToDelete(draft)}
                            className="text-muted-foreground/60 hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Delete draft"
                          >
                            <Trash weight="bold" className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="bg-secondary/40 rounded-xl p-3 text-xs space-y-1.5 border border-border/40">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Target Institution:</span>
                            <span className="font-bold text-foreground">{institution}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Purpose:</span>
                            <span className="font-bold text-foreground">
                              {draft.formData?.purposeCategory === "PAYMENT_GATEWAY" ? "Payment Gateway Integration" : "Bank Account Opening"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1 flex items-center justify-between gap-3">
                          <button
                            onClick={() => setDraftToDelete(draft)}
                            className="text-xs font-bold text-muted-foreground hover:text-destructive transition-colors py-2 px-3"
                          >
                            Discard
                          </button>

                          <Link
                            href={`/dashboard/documents/board-resolution?draftId=${draft.id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-sm transition-all active:scale-[0.98]"
                          >
                            Resume Resolution
                            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* SECTION 2: COMPLETED RESOLUTIONS */}
          {/* ======================================================== */}
          {(activeTab === "ALL" || activeTab === "COMPLETED") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                  <h2 className="text-lg font-black text-foreground">
                    Completed Legal Documents ({filteredCompleted.length})
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground">Official CAMA 2020 Certified Extracts</p>
              </div>

              {filteredCompleted.length === 0 ? (
                <div className="bg-card/40 border border-dashed border-border/80 rounded-2xl p-10 text-center space-y-3">
                  <FileText weight="duotone" className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                  <p className="text-sm font-bold text-foreground">No completed board resolutions yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Generate your first certified CAMA 2020 resolution for corporate bank account opening or payment gateway KYC.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/dashboard/documents/board-resolution"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-all"
                    >
                      <Plus weight="bold" className="h-3.5 w-3.5" />
                      Generate Resolution Now
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCompleted.map((doc) => {
                    const formattedDate = doc.createdAt 
                      ? format(new Date(doc.createdAt), "dd MMM yyyy")
                      : "Completed";
                    const institution = doc.formData?.targetInstitution || "Commercial Bank / Fintech";
                    const isGateway = doc.formData?.purposeCategory === "PAYMENT_GATEWAY";

                    return (
                      <div 
                        key={doc.id}
                        className="bg-card border border-border/70 hover:border-emerald-500/50 transition-all rounded-2xl p-5 shadow-sm space-y-4 relative group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle weight="fill" className="h-3 w-3" />
                                Official Resolution
                              </span>
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formattedDate}
                              </span>
                            </div>
                            <h3 className="text-base font-black text-foreground line-clamp-1">
                              {doc.companyName}
                            </h3>
                            {doc.formData?.rcNumber && (
                              <p className="text-xs font-bold text-muted-foreground">
                                RC: {doc.formData.rcNumber}
                              </p>
                            )}
                          </div>

                          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            {isGateway ? (
                              <CreditCard weight="fill" className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Bank weight="fill" className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                        </div>

                        <div className="bg-secondary/40 rounded-xl p-3 text-xs space-y-1.5 border border-border/40">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Institution:</span>
                            <span className="font-bold text-foreground">{institution}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Mandate:</span>
                            <span className="font-bold text-foreground">
                              {doc.formData?.signingMandate === "ANY_ONE" ? "Any 1 Signatory" :
                               doc.formData?.signingMandate === "ANY_TWO" ? "Any 2 Signatories" :
                               doc.formData?.signingMandate === "CHAIRMAN_AND_SECRETARY" ? "Chairman & Secretary" :
                               doc.formData?.signingMandate === "ALL_DIRECTORS" ? "All Directors Jointly" : "Custom Mandate"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Reference:</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{doc.transactionRef}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 flex items-center gap-2.5">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border/60 transition-all"
                          >
                            <Eye weight="bold" className="h-4 w-4 text-muted-foreground" />
                            View Document
                          </button>

                          <button
                            onClick={() => handleDownloadPdf(doc)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98]"
                          >
                            <DownloadSimple weight="bold" className="h-4 w-4" />
                            Download PDF
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* PREVIEW MODAL */}
      {/* ======================================================== */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div>
                <h3 className="text-base font-black text-foreground">{previewDoc.title}</h3>
                <p className="text-xs text-muted-foreground">Generated extract & certified mandate</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(previewDoc)}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all"
                >
                  <DownloadSimple weight="bold" className="h-3.5 w-3.5" />
                  Download PDF
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X weight="bold" className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-900/40">
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
      {/* DELETE DRAFT MODAL */}
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
                Are you sure you want to delete the draft for <span className="font-bold text-foreground">{draftToDelete.companyName || "Untitled Company"}</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isDeletingDraft}
                onClick={() => setDraftToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={isDeletingDraft}
                onClick={handleDeleteDraft}
                className="flex-1 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {isDeletingDraft ? (
                  <SpinnerGap className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete Draft"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
