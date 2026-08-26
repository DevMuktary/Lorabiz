"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gavel,
  ArrowLeft,
  MagnifyingGlass,
  DownloadSimple,
  Clock,
  CheckCircle,
  Warning,
  XCircle,
  Copy,
  Check,
  Plus,
  Spinner,
  FileText,
  ShieldCheck,
  Buildings,
  TextT,
  Cake,
  Car,
  Scales,
} from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";

interface CourtAffidavitItem {
  id: string;
  trackingId: string;
  category: string;
  subCategory?: string | null;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "QUERIED" | "REJECTED";
  deponentFullName: string;
  passportUrl?: string | null;
  gender: string;
  dob: string;
  age: number;
  religion: string;
  nationality: string;
  residentialAddress: string;
  signatureUrl?: string | null;
  details: any;
  certificateUrl?: string | null;
  courtName?: string | null;
  commissionerName?: string | null;
  queryReason?: string | null;
  amountCharged: number;
  createdAt: string;
  completedAt?: string | null;
}

const CATEGORY_ICONS: Record<string, any> = {
  CAC_CORPORATE: Buildings,
  CHANGE_OF_NAME: TextT,
  AGE_DECLARATION: Cake,
  LOSS_OF_ITEM: FileText,
  PROOF_OF_OWNERSHIP: Car,
  GENERAL_PURPOSE: Scales,
};

const CATEGORY_LABELS: Record<string, string> = {
  CAC_CORPORATE: "CAC Corporate Affidavit",
  CHANGE_OF_NAME: "Change of Name",
  AGE_DECLARATION: "Age Declaration",
  LOSS_OF_ITEM: "Loss of Document / SIM",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose",
};

export default function AffidavitHistoryPage() {
  const [affidavits, setAffidavits] = useState<CourtAffidavitItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Query Resolution Modal
  const [activeQueryAffidavit, setActiveQueryAffidavit] = useState<CourtAffidavitItem | null>(null);
  const [fixPassportUrl, setFixPassportUrl] = useState<string | null>(null);
  const [fixSignatureUrl, setFixSignatureUrl] = useState<string | null>(null);
  const [fixDetailsText, setFixDetailsText] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const fetchAffidavits = async () => {
    try {
      const res = await fetch("/api/affidavit");
      const json = await res.json();
      if (json.success) {
        setAffidavits(json.requests || []);
      }
    } catch (err) {
      console.error("Failed to fetch affidavits:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffidavits();
  }, []);

  const handleCopy = (trackingId: string) => {
    navigator.clipboard.writeText(trackingId);
    setCopiedId(trackingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenQueryModal = (aff: CourtAffidavitItem) => {
    setActiveQueryAffidavit(aff);
    setFixPassportUrl(aff.passportUrl || null);
    setFixSignatureUrl(aff.signatureUrl || null);
    setFixDetailsText("");
    setResolutionSuccess(null);
    setResolutionError(null);
  };

  const handleResolveQuery = async () => {
    if (!activeQueryAffidavit) return;
    setIsResolving(true);
    setResolutionError(null);

    try {
      const payload: any = {};
      if (fixPassportUrl) payload.passportUrl = fixPassportUrl;
      if (fixSignatureUrl) payload.signatureUrl = fixSignatureUrl;
      if (fixDetailsText.trim()) {
        payload.details = {
          ...activeQueryAffidavit.details,
          queryCorrectionNote: fixDetailsText.trim(),
        };
      }

      const res = await fetch(`/api/affidavit/${activeQueryAffidavit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setResolutionSuccess("Query resolved successfully! Our compliance team has resumed processing.");
        setTimeout(() => {
          setActiveQueryAffidavit(null);
          fetchAffidavits();
        }, 1500);
      } else {
        setResolutionError(json.message || "Failed to update affidavit.");
      }
    } catch (err: any) {
      setResolutionError("Network error. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  const filteredAffidavits = affidavits.filter((item) => {
    const matchesSearch =
      item.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deponentFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 font-sans text-left">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Back to Dashboard</span>
        </Link>

        <Link
          href="/dashboard/affidavit"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={14} weight="bold" />
          <span>New Affidavit</span>
        </Link>
      </div>

      {/* Main Banner */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <Gavel size={24} weight="fill" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              My Sworn Court Affidavits
            </h1>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Track processing status, resolve queries, and download signed &amp; sealed court PDFs.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2 rounded-xl bg-secondary/60 border border-border text-center self-start sm:self-auto">
          <span className="text-[10px] font-black uppercase text-muted-foreground block">Total Requested</span>
          <span className="text-sm font-black text-foreground">{affidavits.length} Applications</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tracking ID (e.g. AFF-849201) or Deponent Name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="ALL">All Categories</option>
          <option value="CAC_CORPORATE">CAC Corporate</option>
          <option value="CHANGE_OF_NAME">Change of Name</option>
          <option value="AGE_DECLARATION">Age Declaration</option>
          <option value="LOSS_OF_ITEM">Loss of Item / SIM</option>
          <option value="PROOF_OF_OWNERSHIP">Proof of Ownership</option>
          <option value="GENERAL_PURPOSE">General Purpose</option>
        </select>
      </div>

      {/* Affidavits List */}
      {loading ? (
        <div className="p-12 text-center bg-card border border-border rounded-3xl flex flex-col items-center justify-center">
          <Spinner size={32} className="animate-spin text-primary mb-3" />
          <p className="text-xs font-bold text-muted-foreground">Loading your court affidavits...</p>
        </div>
      ) : filteredAffidavits.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-3xl flex flex-col items-center justify-center space-y-3">
          <div className="h-16 w-16 rounded-3xl bg-secondary flex items-center justify-center text-muted-foreground">
            <Gavel size={32} weight="duotone" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Court Affidavits Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            {searchQuery
              ? "No applications matched your search query."
              : "You haven't requested any court affidavits yet. Create one in 2–5 hours!"}
          </p>
          <Link
            href="/dashboard/affidavit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:shadow-md transition-all mt-2"
          >
            <Plus size={14} weight="bold" />
            <span>Request Affidavit</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAffidavits.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Scales;
            const categoryLabel = CATEGORY_LABELS[item.category] || item.category;

            return (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-card border border-border hover:border-border/80 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="h-11 w-11 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shrink-0 mt-0.5">
                    <Icon size={22} weight="bold" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md flex items-center gap-1">
                        {item.trackingId}
                        <button
                          type="button"
                          onClick={() => handleCopy(item.trackingId)}
                          className="hover:opacity-75"
                          title="Copy Tracking ID"
                        >
                          {copiedId === item.trackingId ? (
                            <Check size={10} weight="bold" className="text-emerald-500" />
                          ) : (
                            <Copy size={10} weight="bold" />
                          )}
                        </button>
                      </span>

                      {/* Status Badges */}
                      {item.status === "PENDING" && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black flex items-center gap-1">
                          <Clock size={10} weight="bold" /> Queued for Stamping
                        </span>
                      )}
                      {item.status === "PROCESSING" && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-[10px] font-black flex items-center gap-1">
                          <Spinner size={10} className="animate-spin" /> In Court Registry
                        </span>
                      )}
                      {item.status === "COMPLETED" && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1">
                          <CheckCircle size={10} weight="fill" /> Sealed &amp; Ready
                        </span>
                      )}
                      {item.status === "QUERIED" && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black flex items-center gap-1">
                          <Warning size={10} weight="fill" /> Action Required (Queried)
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground text-[10px] font-black flex items-center gap-1">
                          <XCircle size={10} weight="fill" /> Refunded
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-foreground truncate">
                      {item.deponentFullName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {categoryLabel} • {item.gender} • {item.age} Yrs • Submitted on {new Date(item.createdAt).toLocaleDateString()}
                    </p>

                    {item.status === "QUERIED" && item.queryReason && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                        <strong>Query:</strong> {item.queryReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                  {item.status === "COMPLETED" && item.certificateUrl && (
                    <a
                      href={item.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <DownloadSimple size={14} weight="bold" />
                      <span>Download Court PDF</span>
                    </a>
                  )}

                  {item.status === "QUERIED" && (
                    <button
                      type="button"
                      onClick={() => handleOpenQueryModal(item)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <span>Fix Query &amp; Resume</span>
                    </button>
                  )}

                  {(item.status === "PENDING" || item.status === "PROCESSING") && (
                    <div className="px-3.5 py-1.5 rounded-xl bg-secondary/80 border border-border text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                      <Clock size={12} weight="bold" className="text-primary" />
                      <span>Delivery in 2–5 Hrs</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUERY RESOLUTION MODAL                                                    */}
      {/* ========================================================================= */}
      {activeQueryAffidavit && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="border-b border-border pb-3">
              <span className="text-[10px] font-black uppercase text-rose-500 block">
                Resolve Application Query
              </span>
              <h3 className="text-base font-black text-foreground">
                {activeQueryAffidavit.deponentFullName} ({activeQueryAffidavit.trackingId})
              </h3>
            </div>

            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
              <strong>Compliance Query:</strong> {activeQueryAffidavit.queryReason}
            </div>

            {resolutionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                {resolutionError}
              </div>
            )}

            {resolutionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                {resolutionSuccess}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Update Passport Photo (If Requested)</label>
                <FileUpload
                  label="Re-upload Passport Photo"
                  value={fixPassportUrl}
                  accept="image/jpeg, image/png"
                  aspectRatio={1}
                  onUploadSuccess={(url) => setFixPassportUrl(url)}
                  onRemove={() => setFixPassportUrl(null)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Update Signature (If Requested)</label>
                <FileUpload
                  label="Re-upload Signature Image"
                  value={fixSignatureUrl}
                  accept="image/jpeg, image/png"
                  aspectRatio={2}
                  onUploadSuccess={(url) => setFixSignatureUrl(url)}
                  onRemove={() => setFixSignatureUrl(null)}
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Clarification / Additional Note</label>
                <textarea
                  rows={3}
                  value={fixDetailsText}
                  onChange={(e) => setFixDetailsText(e.target.value)}
                  placeholder="Type any clarification or corrected details for the legal compliance officer..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveQueryAffidavit(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground font-bold text-xs hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isResolving}
                onClick={handleResolveQuery}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:shadow-md transition-all disabled:opacity-50"
              >
                {isResolving ? (
                  <>
                    <Spinner size={14} className="animate-spin" />
                    <span>Submitting Correction...</span>
                  </>
                ) : (
                  <span>Submit Correction</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
