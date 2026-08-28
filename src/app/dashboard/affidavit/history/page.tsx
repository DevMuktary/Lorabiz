// src/app/dashboard/affidavit/history/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowsClockwise,
  Eye,
} from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";
import { AffidavitDetailsModal, CourtAffidavitRecord } from "@/components/features/affidavit/AffidavitDetailsModal";

const CATEGORY_LABELS: Record<string, string> = {
  CAC_CORPORATE: "CAC Corporate",
  CHANGE_OF_NAME: "Change of Name",
  AGE_DECLARATION: "Age Declaration",
  LOSS_OF_ITEM: "Loss of Item / SIM",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose",
};

export default function AffidavitHistoryPage() {
  const [affidavits, setAffidavits] = useState<CourtAffidavitRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Details Modal State
  const [selectedRecord, setSelectedRecord] = useState<CourtAffidavitRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);

  // Query Resolution Modal State
  const [activeQueryAffidavit, setActiveQueryAffidavit] = useState<CourtAffidavitRecord | null>(null);
  const [fixPassportUrl, setFixPassportUrl] = useState<string | null>(null);
  const [fixSignatureUrl, setFixSignatureUrl] = useState<string | null>(null);
  const [fixDetailsText, setFixDetailsText] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [resolutionSuccess, setResolutionSuccess] = useState<string | null>(null);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const fetchAffidavits = async (showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
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
      if (showSpinner) setIsRefreshing(false);
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

  const handleOpenDetails = (record: CourtAffidavitRecord) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const handleOpenQueryModal = (aff: CourtAffidavitRecord) => {
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
      console.error("Query resolution error:", err);
      setResolutionError("Network error. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  const stats = useMemo(() => ({
    total: affidavits.length,
    pending: affidavits.filter((a) => a.status === "PENDING").length,
    processing: affidavits.filter((a) => a.status === "PROCESSING").length,
    completed: affidavits.filter((a) => a.status === "COMPLETED").length,
    queried: affidavits.filter((a) => a.status === "QUERIED" || a.status === "REJECTED").length,
  }), [affidavits]);

  const filteredAffidavits = useMemo(() => {
    return affidavits.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.trackingId.toLowerCase().includes(q) ||
        item.deponentFullName.toLowerCase().includes(q) ||
        (item.residentialAddress && item.residentialAddress.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;

      let matchesStatus = true;
      if (activeStatusFilter === "PENDING") matchesStatus = item.status === "PENDING";
      if (activeStatusFilter === "PROCESSING") matchesStatus = item.status === "PROCESSING";
      if (activeStatusFilter === "COMPLETED") matchesStatus = item.status === "COMPLETED";
      if (activeStatusFilter === "QUERIED") matchesStatus = item.status === "QUERIED" || item.status === "REJECTED";

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [affidavits, searchQuery, selectedCategory, activeStatusFilter]);

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-2 font-sans relative space-y-6 animate-in fade-in duration-200 text-left">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/affidavit"
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft size={14} weight="bold" /> Back to Affidavit Form
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchAffidavits(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowsClockwise size={13} weight="bold" className={isRefreshing ? "animate-spin text-primary" : ""} />
            <span>Refresh</span>
          </button>

          <Link
            href="/dashboard/affidavit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Plus size={14} weight="bold" />
            <span>New Affidavit</span>
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-white flex items-center justify-center p-1.5 border border-slate-200/80 dark:border-white/20 shrink-0 shadow-xs">
            <Image
              src="/court.png"
              alt="High Court Seal"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck size={11} weight="bold" />
              High Court Registry Tracking
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Court Affidavit History
            </h1>
            <p className="text-muted-foreground text-xs font-medium">
              Monitor swearing progress, view submitted details, resolve queries, and download stamped certificates (2–5 Working Hours • Mon–Fri).
            </p>
          </div>
        </div>
      </div>

      {/* 5 Status Filter Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          type="button"
          onClick={() => setActiveStatusFilter("ALL")}
          className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "ALL"
              ? "ring-2 ring-primary border-primary bg-primary/5 shadow-xs"
              : "bg-card border-border hover:border-primary/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</span>
            <FileText weight={activeStatusFilter === "ALL" ? "fill" : "bold"} className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-foreground mt-2">{stats.total}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("PENDING")}
          className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "PENDING"
              ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/15 shadow-xs"
              : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending</span>
            <Clock weight={activeStatusFilter === "PENDING" ? "fill" : "bold"} className="h-4 w-4 text-amber-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{stats.pending}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("PROCESSING")}
          className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "PROCESSING"
              ? "ring-2 ring-sky-500 border-sky-500 bg-sky-500/15 shadow-xs"
              : "bg-sky-500/5 border-sky-500/20 hover:border-sky-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Processing</span>
            <ArrowsClockwise weight={activeStatusFilter === "PROCESSING" ? "fill" : "bold"} className="h-4 w-4 text-sky-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 mt-2">{stats.processing}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("COMPLETED")}
          className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
            activeStatusFilter === "COMPLETED"
              ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/15 shadow-xs"
              : "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Completed</span>
            <CheckCircle weight={activeStatusFilter === "COMPLETED" ? "fill" : "bold"} className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{stats.completed}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusFilter("QUERIED")}
          className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
            activeStatusFilter === "QUERIED"
              ? "ring-2 ring-rose-500 border-rose-500 bg-rose-500/15 shadow-xs"
              : "bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Queried / Issue</span>
            <WarningCircle weight={activeStatusFilter === "QUERIED" ? "fill" : "bold"} className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">{stats.queried}</span>
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
            placeholder="Search by Tracking ID, Deponent Name, or Address..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-xs font-medium focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-card border border-border text-xs font-bold focus:outline-none focus:border-primary shadow-xs"
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

      {/* Affidavit Table View */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-secondary/40 border-b border-border text-muted-foreground uppercase font-black tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Tracking ID &amp; Date</th>
                <th className="px-5 py-3.5">Deponent Details</th>
                <th className="px-5 py-3.5">Matter</th>
                <th className="px-5 py-3.5">Court Stamping</th>
                <th className="px-5 py-3.5">Fee</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <Spinner size={24} className="animate-spin inline-block text-primary mb-2" />
                    <p className="font-bold">Loading sworn affidavits...</p>
                  </td>
                </tr>
              ) : filteredAffidavits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground space-y-2">
                    <Gavel size={28} className="mx-auto text-muted-foreground opacity-50" />
                    <p className="font-bold text-foreground">No affidavits found matching your criteria</p>
                    <p className="text-[11px]">Submit a new sworn affidavit or clear your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredAffidavits.map((item) => {
                  const isAttested = item.subCategory === "HIGH_COURT_ATTESTED" || item.details?.sealTier === "HIGH_COURT_ATTESTED";
                  return (
                    <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                      {/* Tracking ID & Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-primary">{item.trackingId}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.trackingId)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Copy Tracking ID"
                          >
                            {copiedId === item.trackingId ? (
                              <Check size={12} weight="bold" className="text-emerald-500" />
                            ) : (
                              <Copy size={12} weight="bold" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </td>

                      {/* Deponent Details */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-foreground block">{item.deponentFullName}</span>
                        <span className="text-[11px] text-muted-foreground truncate max-w-[200px] block">
                          {item.gender} • {item.age} Yrs • {item.religion}
                        </span>
                      </td>

                      {/* Matter Category */}
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-secondary text-foreground text-[11px] font-bold inline-block">
                          {CATEGORY_LABELS[item.category] || item.category}
                        </span>
                      </td>

                      {/* Court Stamping */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isAttested
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }`}
                        >
                          {isAttested ? "Federal High Court" : "State Judiciary"}
                        </span>
                      </td>

                      {/* Fee */}
                      <td className="px-5 py-4 font-mono font-bold text-foreground">
                        ₦{Number(item.amountCharged).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            item.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : item.status === "PROCESSING"
                              ? "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                              : item.status === "QUERIED"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                              : item.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                              : "bg-secondary text-muted-foreground border border-border"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
                            title="View Full Application Particulars"
                          >
                            <Eye size={13} weight="bold" />
                            <span>Details</span>
                          </button>

                          {item.status === "COMPLETED" && item.certificateUrl && (
                            <a
                              href={item.certificateUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-xs"
                              title="Download Stamped PDF"
                            >
                              <DownloadSimple size={13} weight="bold" />
                              <span>PDF</span>
                            </a>
                          )}

                          {item.status === "QUERIED" && (
                            <button
                              type="button"
                              onClick={() => handleOpenQueryModal(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
                              title="Resolve Query"
                            >
                              <span>Fix</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      <AffidavitDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        record={selectedRecord}
        onOpenQueryResolve={(aff) => handleOpenQueryModal(aff)}
      />

      {/* Query Resolution Modal */}
      {activeQueryAffidavit && (
        <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 text-left">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[90vh]">
            <div className="p-5 border-b border-border bg-card flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">
                  Registry Query Correction
                </span>
                <h3 className="text-base font-black text-foreground">
                  Resolve Query for {activeQueryAffidavit.trackingId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveQueryAffidavit(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200">
                <strong>Registry Compliance Query:</strong> {activeQueryAffidavit.queryReason}
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
                <label className="font-bold text-foreground">Re-upload Deponent Passport Photo (if requested)</label>
                <FileUpload
                  label="Update Photo"
                  value={fixPassportUrl}
                  accept="image/jpeg, image/png"
                  onUploadSuccess={(url) => setFixPassportUrl(url)}
                  onRemove={() => setFixPassportUrl(null)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Re-upload Specimen Signature (if requested)</label>
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
                  placeholder="Explain your correction or provide the corrected details..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border focus:outline-none focus:border-primary text-base sm:text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex justify-end gap-2 shrink-0">
              <button
                type="button"
                disabled={isResolving}
                onClick={() => setActiveQueryAffidavit(null)}
                className="px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResolving}
                onClick={handleResolveQuery}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
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
