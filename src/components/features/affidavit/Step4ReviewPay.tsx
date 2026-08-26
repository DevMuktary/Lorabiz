"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Clock,
  Wallet,
  Gavel,
  Spinner,
} from "@phosphor-icons/react";
import {
  AffidavitCategoryType,
  DeponentInfo,
  CacFacts,
  ChangeOfNameFacts as IChangeOfNameFacts,
  AgeDeclarationFacts as IAgeDeclarationFacts,
  LossOfItemFacts as ILossOfItemFacts,
  ProofOfOwnershipFacts as IProofOfOwnershipFacts,
  GeneralPurposeFacts as IGeneralPurposeFacts,
} from "./types";

const CATEGORY_NAMES: Record<AffidavitCategoryType, string> = {
  CAC_CORPORATE: "CAC Corporate Affidavit",
  CHANGE_OF_NAME: "Change / Correction of Name",
  AGE_DECLARATION: "Declaration of Age",
  LOSS_OF_ITEM: "Loss of Document / SIM Card",
  PROOF_OF_OWNERSHIP: "Proof of Ownership",
  GENERAL_PURPOSE: "General Purpose Sworn Affidavit",
};

interface Step4ReviewPayProps {
  category: AffidavitCategoryType;
  deponent: DeponentInfo;
  cacFacts: CacFacts;
  nameChangeFacts: IChangeOfNameFacts;
  ageFacts: IAgeDeclarationFacts;
  lossFacts: ILossOfItemFacts;
  ownershipFacts: IProofOfOwnershipFacts;
  generalFacts: IGeneralPurposeFacts;
  basePrice: number;
  tierName?: string;
  tierDiscountPct: number;
  walletBalance: number;
  isSubmitting: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function Step4ReviewPay({
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
  tierDiscountPct,
  walletBalance,
  isSubmitting,
  onBack,
  onSubmit,
}: Step4ReviewPayProps) {
  const discountAmount = Math.round((basePrice * tierDiscountPct) / 100);
  const finalPrice = Math.max(0, basePrice - discountAmount);
  const hasEnoughFunds = walletBalance >= finalPrice;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Summary Box */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={22} weight="fill" className="text-emerald-500" />
            <h2 className="text-base font-black text-foreground">
              Review Court Affidavit Particulars
            </h2>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-black text-[10px]">
            Ready for Registry Stamping
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Deponent Summary */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground block">
              Deponent Details
            </span>
            <p className="font-bold text-foreground text-sm">{deponent.fullName}</p>
            <p className="text-muted-foreground">
              {deponent.gender} • {deponent.calculatedAge} Years Old ({deponent.religion})
            </p>
            <p className="text-muted-foreground truncate">
              {deponent.streetAddress}, {deponent.lgaOfResidence}, {deponent.stateOfResidence}
            </p>
            {deponent.occupation && (
              <p className="text-muted-foreground">Occupation: {deponent.occupation}</p>
            )}
          </div>

          {/* Affidavit Specifics */}
          <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground block">
              Affidavit Type &amp; Specifics
            </span>
            <p className="font-bold text-foreground text-sm">{CATEGORY_NAMES[category]}</p>

            {category === "CAC_CORPORATE" && (
              <>
                <p className="text-muted-foreground font-mono">
                  {cacFacts.companyName} ({cacFacts.rcBnNumber})
                </p>
                <p className="text-muted-foreground">Capacity: {cacFacts.positionInCompany}</p>
              </>
            )}

            {category === "CHANGE_OF_NAME" && (
              <p className="text-muted-foreground">
                From: <strong>{nameChangeFacts.oldName}</strong> ➔ To: <strong>{nameChangeFacts.newName}</strong>
              </p>
            )}

            {category === "AGE_DECLARATION" && (
              <p className="text-muted-foreground">
                Correct DOB: <strong>{ageFacts.declaredDob}</strong> ({ageFacts.placeOfBirth}, {ageFacts.stateOfBirth})
              </p>
            )}

            {category === "LOSS_OF_ITEM" && (
              <p className="text-muted-foreground">
                Lost: <strong>{lossFacts.itemLost}</strong> {lossFacts.identifyingNumber && `(${lossFacts.identifyingNumber})`}
              </p>
            )}

            {category === "PROOF_OF_OWNERSHIP" && (
              <p className="text-muted-foreground">
                Item: <strong>{ownershipFacts.subject}</strong> ({ownershipFacts.identifyingNumber})
              </p>
            )}

            {category === "GENERAL_PURPOSE" && (
              <p className="text-muted-foreground">
                Title: <strong>{generalFacts.title}</strong>
              </p>
            )}

            <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Clock size={12} weight="bold" /> Estimated Fulfillment: 2–5 Hours
            </p>
          </div>
        </div>
      </div>

      {/* Pricing & Checkout Card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Payment Breakdown
          </span>
          <div className="flex items-center gap-2">
            <Wallet size={14} className="text-primary" />
            <span className="text-xs font-bold text-muted-foreground">
              Your Wallet Balance:{" "}
              <strong className="text-foreground">
                ₦{walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </strong>
            </span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>Standard Court Swearing &amp; Stamping Fee</span>
            <span className="font-semibold text-foreground">₦{basePrice.toLocaleString()}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
              <span>
                Level {tierName} Discount ({tierDiscountPct}%)
              </span>
              <span>-₦{discountAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-between items-baseline">
            <span className="font-black text-foreground text-base">Total Amount to Pay</span>
            <span className="text-2xl font-black text-primary">
              ₦{finalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {!hasEnoughFunds ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-amber-700 dark:text-amber-400 font-medium">
              <strong>Insufficient Balance:</strong> You need ₦
              {(finalPrice - walletBalance).toLocaleString()} more to proceed.
            </div>
            <Link
              href="/dashboard/wallet"
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-center shrink-0 shadow-xs"
            >
              Fund Wallet Now
            </Link>
          </div>
        ) : null}

        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
          >
            Back to Edit
          </button>

          <button
            type="button"
            disabled={isSubmitting || !hasEnoughFunds}
            onClick={onSubmit}
            className="flex-1 max-w-xs inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-extrabold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Spinner size={18} className="animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <Gavel size={18} weight="fill" />
                <span>Pay ₦{finalPrice.toLocaleString()} &amp; Submit</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
