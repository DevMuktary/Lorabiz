// src/components/features/affidavit/AffidavitDetailsModal.tsx
"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Gavel,
  ShieldCheck,
  CheckCircle,
  Clock,
  WarningCircle,
  XCircle,
  ArrowsClockwise,
  DownloadSimple,
  Copy,
  Check,
  User,
  FileText,
  Eye,
  Buildings,
  TextT,
  Cake,
  Car,
  Scales,
} from "@phosphor-icons/react";

export interface CourtAffidavitRecord {
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
  occupation?: string | null;
  signatureUrl?: string | null;
  details: any;
  certificateUrl?: string | null;
  courtName?: string | null;
  commissionerName?: string | null;
  queryReason?: string | null;
  adminNotes?: string | null;
  amountCharged: number;
  isRefunded?: boolean;
  refundAmount?: number | null;
  createdAt: string;
  completedAt?: string | null;
}

interface AffidavitDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: CourtAffidavitRecord | null;
  onOpenQueryResolve?: (record: CourtAffidavitRecord) => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  CAC_CORPORATE: "CAC Corporate Affidavit",
  CHANGE_OF_NAME: "Change / Correction of Name",
  AGE_DECLARATION: "Declaration of Age",
  LOSS_OF_ITEM: "Loss of Document / SIM Card",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose Sworn Affidavit",
};

export function AffidavitDetailsModal({
  isOpen,
  onClose,
  record,
  onOpenQueryResolve,
}: AffidavitDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"DEPONENT" | "FACTS" | "MEDIA" | "ATTESTATION">("DEPONENT");
  const [copied, setCopied] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; title: string } | null>(null);

  if (!isOpen || !record || typeof document === "undefined") return null;

  const handleCopyTrackingId = () => {
    navigator.clipboard.writeText(record.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAttested = record.subCategory === "HIGH_COURT_ATTESTED" || record.details?.sealTier === "HIGH_COURT_ATTESTED";
  const tierName = isAttested ? "Federal High Court" : "State Judiciary";
  const categoryLabel = CATEGORY_NAMES[record.category] || record.category.replace(/_/g, " ");

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-3 sm:p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-card border border-border w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Gavel size={20} weight="fill" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  {record.trackingId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTrackingId}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Copy Tracking ID"
                >
                  {copied ? <Check size={13} weight="bold" className="text-emerald-500" /> : <Copy size={13} weight="bold" />}
                </button>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    record.status === "COMPLETED"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : record.status === "PROCESSING"
                      ? "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                      : record.status === "REJECTED" || record.status === "QUERIED"
                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      : "bg-secondary text-muted-foreground border border-border"
                  }`}
                >
                  {record.status === "REJECTED" || record.status === "QUERIED" ? "FAILED" : record.status}
                </span>
              </div>
              <h2 className="text-base font-black text-foreground mt-0.5 truncate">
                {record.deponentFullName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Status Alerts */}
        {record.status === "COMPLETED" && record.certificateUrl && (
          <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Sworn Court Affidavit Sealed &amp; Ready
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Attested by {record.commissionerName || "Commissioner for Oaths"} ({record.courtName || "High Court Registry"})
                </p>
              </div>
            </div>

            <a
              href={record.certificateUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
            >
              <DownloadSimple size={14} weight="bold" />
              <span>Download PDF</span>
            </a>
          </div>
        )}

        {(record.status === "REJECTED" || record.status === "QUERIED") && (
          <div className="px-5 py-3 bg-rose-500/10 border-b border-rose-500/20 flex items-start gap-2 shrink-0 text-xs">
            <XCircle size={18} weight="fill" className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-900 dark:text-rose-300 block">Application Failed / Rejected</span>
              <p className="text-rose-800 dark:text-rose-200 text-[11px]">
                {record.adminNotes || record.queryReason || "This application could not be completed by the High Court Registry."}
                {record.isRefunded && ` (₦${Number(record.refundAmount || record.amountCharged).toLocaleString()} refunded to wallet)`}
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 flex border-b border-border bg-card shrink-0 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("DEPONENT")}
            className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "DEPONENT"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Deponent Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("FACTS")}
            className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "FACTS"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Sworn Legal Facts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MEDIA")}
            className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "MEDIA"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Passport &amp; Signature
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ATTESTATION")}
            className={`py-3 px-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "ATTESTATION"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Registry &amp; Billing
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
          
          {/* TAB 1: DEPONENT PROFILE */}
          {activeTab === "DEPONENT" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Full Legal Name
                  </span>
                  <p className="font-bold text-foreground text-sm">{record.deponentFullName}</p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Gender &amp; Age
                  </span>
                  <p className="font-bold text-foreground">
                    {record.gender} • {record.age} Yrs (DOB: {record.dob})
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Religion &amp; Oath Formula
                  </span>
                  <p className="font-bold text-foreground">{record.religion}</p>
                </div>

                <div className="p-3 rounded-xl bg-secondary/30 border border-border space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Nationality &amp; Occupation
                  </span>
                  <p className="font-bold text-foreground">
                    {record.nationality} • {record.occupation || "Not Stated"}
                  </p>
                </div>

                <div className="sm:col-span-2 p-3 rounded-xl bg-secondary/30 border border-border space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Residential Address
                  </span>
                  <p className="font-bold text-foreground">{record.residentialAddress}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SWORN FACTS */}
          {activeTab === "FACTS" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Affidavit Matter</span>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px] border border-primary/20">
                  {categoryLabel}
                </span>
              </div>

              {/* Formatted Fact Summaries */}
              {record.category === "CHANGE_OF_NAME" && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Former Legal Name:</span>
                    <strong className="text-foreground">{record.details?.oldName || record.details?.formerFirstName || "N/A"}</strong>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">New Desired Legal Name:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{record.details?.newName || record.details?.newFirstName || "N/A"}</strong>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Reason for Change:</span>
                    <span className="text-foreground">{record.details?.reason || "Marriage / Personal Decision"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage Destination:</span>
                    <span className="text-foreground">{record.details?.usageDestination || "Commercial Banks, NIN, BVN & Passport"}</span>
                  </div>
                </div>
              )}

              {record.category === "AGE_DECLARATION" && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Declared Date of Birth:</span>
                    <strong className="text-foreground">{record.details?.declaredDob || "N/A"}</strong>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Place of Birth:</span>
                    <span className="text-foreground">{record.details?.placeOfBirth}, {record.details?.stateOfBirth} State</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reason for Affidavit:</span>
                    <span className="text-foreground">{record.details?.reason || "Birth Certificate Not Issued at Birth"}</span>
                  </div>
                </div>
              )}

              {record.category === "CAC_CORPORATE" && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Company Name:</span>
                    <strong className="text-foreground">{record.details?.companyName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">RC / BN Number:</span>
                    <span className="font-mono font-bold text-foreground">{record.details?.rcBnNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Deponent Position:</span>
                    <span className="text-foreground">{record.details?.positionInCompany}</span>
                  </div>
                  {record.details?.documentLost && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lost Document:</span>
                      <span className="text-foreground">{record.details.documentLost}</span>
                    </div>
                  )}
                </div>
              )}

              {record.category === "LOSS_OF_ITEM" && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Lost Item / Document:</span>
                    <strong className="text-foreground">{record.details?.itemLost}</strong>
                  </div>
                  {record.details?.identifyingNumber && (
                    <div className="flex justify-between border-b border-border/60 pb-1.5">
                      <span className="text-muted-foreground">Identifying Number / Ref:</span>
                      <span className="font-mono text-foreground">{record.details.identifyingNumber}</span>
                    </div>
                  )}
                  {record.details?.lossDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date of Loss:</span>
                      <span className="text-foreground">{record.details.lossDate}</span>
                    </div>
                  )}
                </div>
              )}

              {record.category === "PROOF_OF_OWNERSHIP" && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Subject of Ownership:</span>
                    <strong className="text-foreground">{record.details?.subject}</strong>
                  </div>
                  {record.details?.identifyingNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Chassis / Serial No:</span>
                      <span className="font-mono text-foreground">{record.details.identifyingNumber}</span>
                    </div>
                  )}
                </div>
              )}

              {record.category === "GENERAL_PURPOSE" && (
                <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                  <span className="font-bold text-foreground block">Title: {record.details?.title}</span>
                  <div className="space-y-1 text-muted-foreground pt-1">
                    {(record.details?.statements || []).map((stmt: string, i: number) => (
                      <p key={i} className="leading-relaxed">
                        <strong className="text-foreground">{i + 1}.</strong> {stmt}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDIA (PASSPORT & SIGNATURE) */}
          {activeTab === "MEDIA" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Passport */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Deponent Passport Photograph
                </span>
                {record.passportUrl ? (
                  <div className="space-y-2">
                    <img
                      src={record.passportUrl}
                      alt="Passport"
                      className="w-32 h-32 object-cover rounded-xl border border-border shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightboxImg({ src: record.passportUrl!, title: "Deponent Passport Photograph" })}
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxImg({ src: record.passportUrl!, title: "Deponent Passport Photograph" })}
                      className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline cursor-pointer"
                    >
                      <Eye size={12} weight="bold" /> View Full Image
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No passport photograph attached</p>
                )}
              </div>

              {/* Specimen Signature */}
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2">
                <span className="text-xs font-bold text-foreground block">
                  Deponent Specimen Signature
                </span>
                {record.signatureUrl ? (
                  <div className="space-y-2">
                    <div className="p-2 rounded-xl bg-white border border-border inline-block">
                      <img
                        src={record.signatureUrl}
                        alt="Signature"
                        className="h-20 max-w-full object-contain cursor-pointer"
                        onClick={() => setLightboxImg({ src: record.signatureUrl!, title: "Deponent Specimen Signature" })}
                      />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setLightboxImg({ src: record.signatureUrl!, title: "Deponent Specimen Signature" })}
                        className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline cursor-pointer"
                      >
                        <Eye size={12} weight="bold" /> View High-Res
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No specimen signature on file</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ATTESTATION & BILLING */}
          {activeTab === "ATTESTATION" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-2 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-1.5">
                  <span className="text-muted-foreground">Court Stamping Format:</span>
                  <strong className="text-foreground">{tierName}</strong>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-1.5">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ₦{Number(record.amountCharged).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-1.5">
                  <span className="text-muted-foreground">Submission Date:</span>
                  <span className="text-foreground">{new Date(record.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registry Processing Turnaround:</span>
                  <span className="text-foreground">2–5 Working Hours (Mon–Fri, Excludes Weekends)</span>
                </div>
              </div>

              {record.certificateUrl && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
                  <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                    Court Registry Delivery Details
                  </span>
                  <p className="text-emerald-800 dark:text-emerald-300">
                    Sealed under <strong>{record.courtName || "High Court Registry"}</strong> by{" "}
                    <strong>{record.commissionerName || "Commissioner for Oaths"}</strong>.
                  </p>
                  <a
                    href={record.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                  >
                    <DownloadSimple size={14} weight="bold" />
                    <span>Download Stamped Affidavit PDF</span>
                  </a>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Lightbox for Images */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="bg-card border border-border p-3 rounded-2xl max-w-md w-full shadow-2xl relative space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground">{lightboxImg.title}</span>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="h-72 w-full relative flex items-center justify-center bg-secondary/30 rounded-xl overflow-hidden">
              <img
                src={lightboxImg.src}
                alt={lightboxImg.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
