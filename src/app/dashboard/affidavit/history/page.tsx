// src/app/dashboard/affidavit/history/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Gavel,
  ArrowLeft,
  MagnifyingGlass,
  DownloadSimple,
  Clock,
  CheckCircle,
  WarningCircle,
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
  ArrowsClockwise,
  Lock,
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
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");
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

  const stats = {
    total: affidavits.length,
    pending: affidavits.filter((a) => a.status === "PENDING").length,
    processing: affidavits.filter((a) => a.status === "PROCESSING").length,
    completed: affidavits.filter((a) => a.status === "COMPLETED").length,
    queried: affidavits.filter((a) => a.status === "QUERIED" || a.status === "REJECTED").length,
  };

  const filteredAffidavits = affidavits.filter((item) => {
    const matchesSearch =
      item.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.deponentFullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;

    let matchesStatus = true;
    if (activeStatusFilter === "PENDING") matchesStatus = item.status === "PENDING";
    if (activeStatusFilter === "PROCESSING") matchesStatus = item.status === "PROCESSING";
    if (activeStatusFilter === "COMPLETED") matchesStatus = item.status === "COMPLETED";
    if (activeStatusFilter === "QUERIED") matchesStatus = item.status === "QUERIED" || item.status === "REJECTED";

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto pb-20 pt-2 font-sans relative space-y-6 animate-in fade-in duration-200 text-left">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/affidavit"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} weight="bold" /> Back to Affidavit Form
        </Link>

        <Link
          href="/dashboard/affidavit"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-sm hover:shadow-md transition-all"
        >
          <Plus size={14} weight="bold" />
          <span>New Affidavit</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
          <Image
            src="/court.png"
            alt="High Court Seal"
            width={44}
            height={44}
            className="object-contain"
            priority
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <ShieldCheck size={11} weight="bold" />
            Registry Tracking &amp; Status
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Court Affidavit History
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Monitor swearing progress, answer compliance queries, and download sealed court certificates.
          </p>
        </div>
      </div>

      {/* 5 Status Filter Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setActiveStatusFilter("ALL")}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "ALL"
              ? "ring-2 ring-primary border-primary bg-primary/5 shadow-md"
              : "bg-card border-border hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total
            </span>
            <FileText weight={activeStatusFilter === "ALL" ? "fill" : "bold"} className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{stats.total}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("PENDING")}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "PENDING"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-md"
              : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Pending
            </span>
            <Clock weight={activeStatusFilter === "PENDING" ? "fill" : "bold"} className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("PROCESSING")}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "PROCESSING"
              ? "ring-2 ring-sky-500 border-sky-500 bg-sky-500/15 shadow-md"
              : "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Processing
            </span>
            <ArrowsClockwise weight={activeStatusFilter === "PROCESSING" ? "fill" : "bold"} className="h-4 w-4 text-sky-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400">{stats.processing}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("COMPLETED")}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "COMPLETED"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-md"
              : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Completed
            </span>
            <CheckCircle weight={activeStatusFilter === "COMPLETED" ? "fill" : "bold"} className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("QUERIED")}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "QUERIED"
              ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/15 shadow-md"
              : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Queried / Issue
            </span>
            <WarningCircle weight={activeStatusFilter === "QUERIED" ? "fill" : "bold"} className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.queried}</span>
          </div>
        </button>
      </div>

      {/* Search & Matter Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Tracking ID, Deponent Name, or Matter..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-card border border-border text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-card border border-border text-xs font-bold focus:outline-none focus:border-primary shadow-xs"
        >
          <option value="ALL">All Affidavit Categories</option>
          <option value="CAC_CORPORATE">CAC Corporate</option>
          <option value="CHANGE_OF_NAME">Change of Name</option>
          <option value="AGE_DECLARATION">Age Declaration</option>
          <option value="LOSS_OF_ITEM">Loss of Item / SIM</option>
          <option value="PROOF_OF_OWNERSHIP">Proof of Ownership</option>
          <option value="GENERAL_PURPOSE">General Purpose</option>
        </select>
      </div>

      {/* Affidavit Items List */}
      {loading ? (
        <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
          <Spinner size={32} className="animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground">Loading sworn affidavits...</p>
        </div>
      ) : filteredAffidavits.length === 0 ? (
        <div className="p-12 rounded-3xl bg-card border border-border text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <Gavel size={24} />
          </div>
          <h3 className="text-sm font-bold text-foreground">No Affidavits Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || activeStatusFilter !== "ALL" || selectedCategory !== "ALL"
              ? "No applications matched your filter criteria."
              : "You have not submitted any court affidavits yet."}
          </p>
          <Link
            href="/dashboard/affidavit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:shadow-sm"
          >
            <Plus size={14} weight="bold" />
            <span>Submit New Affidavit</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAffidavits.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] || Scales;
            return (
              <div
                key={item.id}
                className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/80 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                      <Icon size={20} weight="bold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-primary">
                          {item.trackingId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.trackingId)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="Copy Tracking ID"
                        >
                          {copiedId === item.trackingId ? (
                            <Check size={12} weight="bold" className="text-emerald-500" />
                          ) : (
                            <Copy size={12} weight="bold" />
                          )}
                        </button>
                        <span className="px-2 py-0.2 rounded-md bg-secondary text-[10px] font-bold">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-foreground mt-1">
                        {item.deponentFullName}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 self-start ${
                      item.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : item.status === "PROCESSING"
                        ? "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                        : item.status === "QUERIED"
                        ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                        : item.status === "REJECTED"
                        ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        : "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20"
                    }`}
                  >
                    {item.status === "COMPLETED" && <CheckCircle size={14} weight="fill" />}
                    {item.status === "PROCESSING" && <ArrowsClockwise size={14} weight="bold" className="animate-spin" />}
                    {item.status === "QUERIED" && <WarningCircle size={14} weight="fill" />}
                    {item.status === "REJECTED" && <XCircle size={14} weight="fill" />}
                    {item.status === "PENDING" && <Clock size={14} weight="bold" />}
                    <span>{item.status}</span>
                  </span>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Deponent Particulars</span>
                    <p className="font-medium text-foreground">
                      {item.gender} • {item.age} Yrs • {item.religion}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Residential Address</span>
                    <p className="font-medium text-foreground truncate">{item.residentialAddress}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Amount Paid</span>
                    <p className="font-mono font-bold text-foreground">₦{Number(item.amountCharged).toLocaleString()}</p>
                  </div>
                </div>

                {/* Query Banner */}
                {item.status === "QUERIED" && item.queryReason && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-xs">
                      <WarningCircle size={16} weight="fill" />
                      <span>Compliance Query Issued by Registry</span>
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-200">{item.queryReason}</p>
                    <button
                      type="button"
                      onClick={() => handleOpenQueryModal(item)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs"
                    >
                      <span>Resolve Query &amp; Re-Submit</span>
                    </button>
                  </div>
                )}

                {/* Completed Certificate Actions */}
                {item.status === "COMPLETED" && item.certificateUrl && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck size={20} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                          Sealed Court Affidavit Certificate Available
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Sealed by {item.commissionerName || "Commissioner for Oaths"} ({item.courtName || "High Court Registry"})
                        </p>
                      </div>
                    </div>

                    <a
                      href={item.certificateUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
                    >
                      <DownloadSimple size={14} weight="bold" />
                      <span>Download Stamped PDF</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Query Resolution Modal */}
      {activeQueryAffidavit && (
        <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 text-left">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[90vh]">
            <div className="p-5 border-b border-border bg-card flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider">
                  Query Correction
                </span>
                <h3 className="text-base font-black text-foreground">
                  Resolve Affidavit Query ({activeQueryAffidavit.trackingId})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQueryAffidavit(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                <strong>Registry Query:</strong> {activeQueryAffidavit.queryReason}
              </div>

              {resolutionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold">
                  {resolutionSuccess}
                </div>
              )}

              {resolutionError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 font-bold">
                  {resolutionError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Re-upload Deponent Passport (if requested)</label>
                <FileUpload
                  label="Update Photo"
                  value={fixPassportUrl}
                  accept="image/jpeg, image/png"
                  onUploadSuccess={(url) => setFixPassportUrl(url)}
                  onRemove={() => setFixPassportUrl(null)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Re-upload Signature (if requested)</label>
                <FileUpload
                  label="Update Signature"
                  value={fixSignatureUrl}
                  accept="image/jpeg, image/png"
                  onUploadSuccess={(url) => setFixSignatureUrl(url)}
                  onRemove={() => setFixSignatureUrl(null)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Clarification / Correction Notes</label>
                <textarea
                  rows={3}
                  value={fixDetailsText}
                  onChange={(e) => setFixDetailsText(e.target.value)}
                  placeholder="Explain your correction or provide corrected data..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                disabled={isResolving}
                onClick={() => setActiveQueryAffidavit(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResolving}
                onClick={handleResolveQuery}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5"
              >
                {isResolving ? <Spinner size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                <span>Submit Query Resolution</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
