"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import {
  AffidavitCategoryType,
  CacFacts,
  ChangeOfNameFacts as IChangeOfNameFacts,
  AgeDeclarationFacts as IAgeDeclarationFacts,
  LossOfItemFacts as ILossOfItemFacts,
  ProofOfOwnershipFacts as IProofOfOwnershipFacts,
  GeneralPurposeFacts as IGeneralPurposeFacts,
} from "./types";
import { CacCorporateFacts } from "./facts/CacCorporateFacts";
import { ChangeOfNameFacts } from "./facts/ChangeOfNameFacts";
import { AgeDeclarationFacts } from "./facts/AgeDeclarationFacts";
import { LossOfItemFacts } from "./facts/LossOfItemFacts";
import { ProofOfOwnershipFacts } from "./facts/ProofOfOwnershipFacts";
import { GeneralPurposeFacts } from "./facts/GeneralPurposeFacts";

interface Step3SwornFactsProps {
  category: AffidavitCategoryType;
  cacFacts: CacFacts;
  nameChangeFacts: IChangeOfNameFacts;
  ageFacts: IAgeDeclarationFacts;
  lossFacts: ILossOfItemFacts;
  ownershipFacts: IProofOfOwnershipFacts;
  generalFacts: IGeneralPurposeFacts;
  onUpdateCac: (updated: Partial<CacFacts>) => void;
  onUpdateNameChange: (updated: Partial<IChangeOfNameFacts>) => void;
  onUpdateAge: (updated: Partial<IAgeDeclarationFacts>) => void;
  onUpdateLoss: (updated: Partial<ILossOfItemFacts>) => void;
  onUpdateOwnership: (updated: Partial<IProofOfOwnershipFacts>) => void;
  onUpdateGeneral: (updated: Partial<IGeneralPurposeFacts>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step3SwornFacts({
  category,
  cacFacts,
  nameChangeFacts,
  ageFacts,
  lossFacts,
  ownershipFacts,
  generalFacts,
  onUpdateCac,
  onUpdateNameChange,
  onUpdateAge,
  onUpdateLoss,
  onUpdateOwnership,
  onUpdateGeneral,
  onBack,
  onNext,
}: Step3SwornFactsProps) {
  return (
    <div className="space-y-6 animate-in fade-in bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-xs">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-black text-foreground">
          Sworn Affidavit Particulars
        </h2>
        <p className="text-xs text-muted-foreground">
          Provide the factual statements and official identifiers required for this category.
        </p>
      </div>

      {category === "CAC_CORPORATE" && (
        <CacCorporateFacts facts={cacFacts} onChange={onUpdateCac} />
      )}

      {category === "CHANGE_OF_NAME" && (
        <ChangeOfNameFacts facts={nameChangeFacts} onChange={onUpdateNameChange} />
      )}

      {category === "AGE_DECLARATION" && (
        <AgeDeclarationFacts facts={ageFacts} onChange={onUpdateAge} />
      )}

      {category === "LOSS_OF_ITEM" && (
        <LossOfItemFacts facts={lossFacts} onChange={onUpdateLoss} />
      )}

      {category === "PROOF_OF_OWNERSHIP" && (
        <ProofOfOwnershipFacts facts={ownershipFacts} onChange={onUpdateOwnership} />
      )}

      {category === "GENERAL_PURPOSE" && (
        <GeneralPurposeFacts facts={generalFacts} onChange={onUpdateGeneral} />
      )}

      <div className="pt-4 flex items-center justify-between border-t border-border">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft size={14} weight="bold" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <span>Review &amp; Pay</span>
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
