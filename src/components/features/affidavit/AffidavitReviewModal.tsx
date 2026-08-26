// src/components/features/affidavit/AffidavitReviewModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ShieldCheck,
  Wallet,
  Gavel,
  CheckCircle,
  X,
  Spinner,
  Lock,
  WarningCircle,
  Plus,
} from "@phosphor-icons/react";
import {
  AffidavitCategoryType,
  DeponentInfo,
  CacFacts,
  ChangeOfNameFacts,
  AgeDeclarationFacts,
  LossOfItemFacts,
  ProofOfOwnershipFacts,
  GeneralPurposeFacts,
} from "./types";

const CATEGORY_NAMES: Record<AffidavitCategoryType, string> = {
  CAC_CORPORATE: "CAC Corporate Affidavit",
  CHANGE_OF_NAME: "Change / Correction of Name",
  AGE_DECLARATION: "Declaration of Age",
  LOSS_OF_ITEM: "Loss of Document / SIM Card",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose Sworn Affidavit",
};

interface AffidavitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AffidavitCategoryType;
  deponent: DeponentInfo;
  cacFacts: CacFacts;
  nameChangeFacts: ChangeOfNameFacts;
  ageFacts: AgeDeclarationFacts;
  lossFacts: LossOfItemFacts;
  ownershipFacts: ProofOfOwnershipFacts;
  generalFacts: GeneralPurposeFacts;
  basePrice: number;
  tierName?: string;
  tierDiscountPct: number;
  walletBalance: number;
  isSubmitting: boolean;
  onConfirmSubmit: () => void;
}

export function AffidavitReviewModal({
  isOpen,
  onClose,
  category,
  deponent,
  cacFacts,
  nameChangeFacts,
  ageFacts,
  lossFacts,
  ownershipFacts,
  generalFacts,
  basePrice,
  tierName = "Starter",
  tierDiscountPct = 0,
  walletBalance,
  isSubmitting,
  onConfirmSubmit,
}: AffidavitReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [statutoryConsent, setStatutoryConsent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      setStatutoryConsent(false);
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const discountAmount = Math.round((basePrice * tierDiscountPct) / 100);
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const hasEnoughFunds = walletBalance >= finalPrice;

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Gavel size={22} weight="fill" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary block">
                Court Registry Confirmation
              </span>
              <h2 className="text-base font-black text-foreground tracking-tight">
                Review &amp; Pay Affidavit
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Close"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Summary Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs leading-relaxed">
          
          {/* Deponent Summary Card */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">
              Deponent Details
            </span>
            <p className="text-sm font-bold text-foreground">{deponent.fullName}</p>
            <p className="text-muted-foreground">
              {deponent.gender} • {deponent.calculatedAge !== null ? `${deponent.calculatedAge} Yrs` : "Age Stated"} ({deponent.religion})
            </p>
            <p className="text-muted-foreground truncate">
              {deponent.streetAddress}, {deponent.lgaOfResidence}, {deponent.stateOfResidence} State
            </p>
          </div>

          {/* Affidavit Specifics Card */}
          <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                Affidavit Matter &amp; Format
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black border border-primary/20">
                {deponent.sealTier === "HIGH_COURT_ATTESTED" ? "High Court Attested" : "Standard Stamped"}
              </span>
            </div>

            <p className="font-bold text-foreground">{CATEGORY_NAMES[category]}</p>

            {/* Category Facts Rendering */}
            {category === "CAC_CORPORATE" && (
              <div className="text-muted-foreground space-y-0.5">
                <p>Company: <strong className="text-foreground">{cacFacts.companyName}</strong> ({cacFacts.rcBnNumber})</p>
                <p>Position: {cacFacts.positionInCompany}</p>
              </div>
            )}

            {category === "CHANGE_OF_NAME" && (
              <div className="text-muted-foreground space-y-0.5">
                <p>Former: <strong className="text-foreground">{nameChangeFacts.oldName}</strong></p>
                <p>New: <strong className="text-foreground">{nameChangeFacts.newName}</strong></p>
                <p>Reason: {nameChangeFacts.reason}</p>
              </div>
            )}

            {category === "AGE_DECLARATION" && (
              <div className="text-muted-foreground space-y-0.5">
                <p>Declared DOB: <strong className="text-foreground">{ageFacts.declaredDob}</strong></p>
                <p>Birthplace: {ageFacts.placeOfBirth}, {ageFacts.stateOfBirth} State</p>
              </div>
            )}

            {category === "LOSS_OF_ITEM" && (
              <div className="text-muted-foreground space-y-0.5">
                <p>Item Lost: <strong className="text-foreground">{lossFacts.itemLost}</strong></p>
                {lossFacts.identifyingNumber && <p>Ref: {lossFacts.identifyingNumber}</p>}
              </div>
            )}

            {category === "PROOF_OF_OWNERSHIP" && (
              <div className="text-muted-foreground space-y-0.5">
                <p>Subject: <strong className="text-foreground">{ownershipFacts.subject}</strong></p>
                {ownershipFacts.identifyingNumber && <p>ID / Ref: {ownershipFacts.identifyingNumber}</p>}
              </div>
            )}

            {category === "GENERAL_PURPOSE" && (
              <div className="text-muted-foreground space-y-0.5">
                <p>Title: <strong className="text-foreground">{generalFacts.title}</strong></p>
                <p>{generalFacts.statements.filter(Boolean).length} Sworn Declarations</p>
              </div>
            )}
          </div>

          {/* Pricing & Wallet Balance */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sworn Affidavit Processing Fee</span>
              <span className="font-mono font-bold text-foreground">₦{basePrice.toLocaleString()}</span>
            </div>

            {tierDiscountPct > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <span>{tierName} VIP Tier ({tierDiscountPct}% OFF)</span>
                <span className="font-mono">-₦{discountAmount.toLocaleString()}</span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="font-extrabold text-foreground text-sm">Total Due</span>
              <span className="text-base font-black text-primary font-mono">
                ₦{finalPrice.toLocaleString()}
              </span>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Wallet size={14} weight="bold" />
                <span>Balance: <strong className="text-foreground font-mono">₦{walletBalance.toLocaleString()}</strong></span>
              </div>

              {!hasEnoughFunds ? (
                <span className="text-rose-600 font-bold flex items-center gap-1">
                  <WarningCircle size={12} weight="fill" /> Insufficient Balance
                </span>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle size={12} weight="fill" /> Sufficient Funds
                </span>
              )}
            </div>
          </div>

          {/* Statutory Affirmation Agreement */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-secondary/30 border border-border/80 cursor-pointer text-[11px] leading-relaxed select-none">
            <input
              type="checkbox"
              checked={statutoryConsent}
              onChange={(e) => setStatutoryConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary cursor-pointer shrink-0"
            />
            <span className="text-muted-foreground">
              I solemnly affirm that the facts stated herein are true and sworn under the <strong>Oaths Act</strong>.
            </span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          {!hasEnoughFunds ? (
            <Link
              href="/dashboard/wallet"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus size={14} weight="bold" />
              <span>Fund Wallet (Need ₦{finalPrice.toLocaleString()})</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled={isSubmitting || !statutoryConsent}
              onClick={onConfirmSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} weight="bold" />
                  <span>Pay ₦{finalPrice.toLocaleString()} &amp; Submit</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
