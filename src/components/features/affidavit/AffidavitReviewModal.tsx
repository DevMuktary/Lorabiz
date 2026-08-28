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
  ArrowRight,
  WarningCircle,
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
  isSubmitting,
  onConfirmSubmit,
}: AffidavitReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [statutoryConsent, setStatutoryConsent] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isLoadingWallet, setIsLoadingWallet] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      setIsLoadingWallet(true);

      fetch("/api/user/wallet")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.wallet) {
            setWalletBalance(Number(data.wallet.balance));
          } else if (typeof data.balance === "number") {
            setWalletBalance(data.balance);
          } else {
            setWalletBalance(0);
          }
        })
        .catch((err) => {
          console.error("Wallet fetch error inside modal:", err);
          setWalletBalance(0);
        })
        .finally(() => {
          setIsLoadingWallet(false);
        });
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
  const isInsufficient = walletBalance !== null && walletBalance < finalPrice;
  const shortfall = Math.max(0, finalPrice - (walletBalance || 0));

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-3 sm:p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 text-left font-sans">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-foreground animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
              <Gavel size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                {isLoadingWallet
                  ? "Verifying Request..."
                  : isInsufficient
                  ? "Insufficient Balance"
                  : "Review & Pay Affidavit"}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {isLoadingWallet
                  ? "Checking wallet balance..."
                  : isInsufficient
                  ? "Wallet top up required to submit"
                  : "Review details before court submission."}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0 disabled:opacity-50"
            title="Close"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Summary Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto text-xs leading-relaxed">
          {isLoadingWallet ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Spinner size={24} className="animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Checking your wallet balance...</p>
            </div>
          ) : isInsufficient ? (
            /* Insufficient Balance State with Crying Emoji */
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl select-none">😭</span>
                  <div>
                    <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Please top up your wallet to submit this sworn court affidavit.
                    </p>
                  </div>
                </div>

                <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3 border border-border space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-bold text-foreground">
                      {deponent.sealTier === "HIGH_COURT_ATTESTED" ? "Federal High Court" : "State Judiciary"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Matter:</span>
                    <span className="font-bold text-foreground">{CATEGORY_NAMES[category]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Required Fee:</span>
                    <span className="font-bold text-rose-500 font-mono">
                      {tierDiscountPct > 0 && (
                        <span className="line-through text-muted-foreground mr-1 font-normal">
                          ₦{basePrice.toLocaleString()}
                        </span>
                      )}
                      ₦{finalPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Balance:</span>
                    <span className="font-bold text-foreground font-mono">₦{(walletBalance || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-bold">
                    <span className="text-amber-600 dark:text-amber-400">Shortfall:</span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono">₦{shortfall.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-border/60 pb-1">
                  <span className="text-muted-foreground">Deponent:</span>
                  <span className="font-bold text-foreground">{deponent.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-border/60 pb-1">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-foreground">{deponent.lgaOfResidence}, {deponent.stateOfResidence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Affidavit Type:</span>
                  <span className="font-medium text-foreground">{CATEGORY_NAMES[category]}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Sufficient Balance State */
            <div className="space-y-3.5">
              {/* Deponent Summary Card */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
                <span className="text-[10px] font-black uppercase text-muted-foreground block tracking-wider">
                  Deponent Particulars
                </span>
                <p className="text-xs sm:text-sm font-bold text-foreground">{deponent.fullName}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {deponent.gender} • {deponent.calculatedAge !== null ? `${deponent.calculatedAge} Yrs` : "Age Stated"} ({deponent.religion}) • {deponent.streetAddress}, {deponent.lgaOfResidence}, {deponent.stateOfResidence}
                </p>
              </div>

              {/* Affidavit Specifics Card */}
              <div className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                    Matter &amp; Stamping Format
                  </span>
                  <span className="text-[10px] font-bold text-primary">
                    {deponent.sealTier === "HIGH_COURT_ATTESTED" ? "Federal High Court" : "State Judiciary"}
                  </span>
                </div>

                <p className="font-bold text-foreground text-xs">{CATEGORY_NAMES[category]}</p>

                {category === "CAC_CORPORATE" && (
                  <div className="text-muted-foreground text-[11px] space-y-0.5 pt-0.5">
                    <p>Company: <strong className="text-foreground">{cacFacts.companyName}</strong> ({cacFacts.rcBnNumber})</p>
                    <p>Position: {cacFacts.positionInCompany}</p>
                  </div>
                )}

                {category === "CHANGE_OF_NAME" && (
                  <div className="text-muted-foreground text-[11px] space-y-0.5 pt-0.5">
                    <p>Former: <strong className="text-foreground">{nameChangeFacts.oldName}</strong></p>
                    <p>New: <strong className="text-foreground">{nameChangeFacts.newName}</strong></p>
                  </div>
                )}

                {category === "AGE_DECLARATION" && (
                  <div className="text-muted-foreground text-[11px] space-y-0.5 pt-0.5">
                    <p>Declared DOB: <strong className="text-foreground">{ageFacts.declaredDob}</strong> ({ageFacts.placeOfBirth})</p>
                  </div>
                )}

                {category === "LOSS_OF_ITEM" && (
                  <div className="text-muted-foreground text-[11px] space-y-0.5 pt-0.5">
                    <p>Lost Item: <strong className="text-foreground">{lossFacts.itemLost}</strong></p>
                  </div>
                )}

                {category === "PROOF_OF_OWNERSHIP" && (
                  <div className="text-muted-foreground text-[11px] space-y-0.5 pt-0.5">
                    <p>Subject: <strong className="text-foreground">{ownershipFacts.subject}</strong></p>
                  </div>
                )}

                {category === "GENERAL_PURPOSE" && (
                  <div className="text-muted-foreground text-[11px] space-y-0.5 pt-0.5">
                    <p>Title: <strong className="text-foreground">{generalFacts.title}</strong></p>
                  </div>
                )}
              </div>

              {/* Pricing & Wallet Balance */}
              <div className="p-3.5 rounded-xl bg-secondary/40 border border-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sworn Affidavit Processing Fee:</span>
                  <span className="font-mono font-bold text-foreground">
                    {tierDiscountPct > 0 ? (
                      <>
                        <span className="line-through text-muted-foreground mr-1.5 font-normal">
                          ₦{basePrice.toLocaleString()}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-black">
                          ₦{finalPrice.toLocaleString()}
                        </span>
                      </>
                    ) : (
                      `₦${basePrice.toLocaleString()}`
                    )}
                  </span>
                </div>

                {tierDiscountPct > 0 && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <span>{tierName} VIP Tier ({tierDiscountPct}% OFF)</span>
                    <span className="font-mono">-₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1.5 border-t border-border font-bold">
                  <span className="text-foreground">Total Service Fee:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                    ₦{finalPrice.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <div className="flex items-center gap-1">
                    <Wallet size={13} weight="bold" />
                    <span>Wallet Balance: <strong className="text-foreground font-mono">₦{Number(walletBalance || 0).toLocaleString()}</strong></span>
                  </div>
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <CheckCircle size={12} weight="fill" /> Ready
                  </span>
                </div>
              </div>

              {/* Statutory Affirmation Agreement */}
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-secondary/30 border border-border/80 cursor-pointer text-[11px] leading-relaxed select-none">
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
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 border-t border-border bg-card flex items-center justify-end gap-2.5 shrink-0">
          {isLoadingWallet ? (
            <button
              type="button"
              disabled={true}
              className="w-full py-2.5 rounded-xl bg-secondary text-muted-foreground font-bold text-xs cursor-not-allowed"
            >
              Checking Wallet...
            </button>
          ) : isInsufficient ? (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-border text-foreground font-bold text-xs hover:bg-secondary transition-all cursor-pointer text-center"
              >
                Cancel
              </button>

              <Link
                href="/dashboard/wallet"
                className="py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-90 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer text-center"
              >
                <Wallet weight="bold" className="h-4 w-4" />
                <span>Fund Wallet</span>
                <ArrowRight weight="bold" className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

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
                    <CheckCircle size={14} weight="fill" />
                    <span>Pay ₦{finalPrice.toLocaleString()} &amp; Submit</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
