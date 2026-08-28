"use client";

import {
  Buildings,
  TextT,
  Cake,
  FileText,
  Car,
  Scales,
  Check,
  ArrowRight,
} from "@phosphor-icons/react";
import { AffidavitCategoryType } from "./types";

interface CategoryDef {
  id: AffidavitCategoryType;
  title: string;
  subtitle: string;
  icon: any;
  badge?: string;
}

const CATEGORIES: CategoryDef[] = [
  {
    id: "CAC_CORPORATE",
    title: "CAC Corporate Affidavits",
    subtitle: "Loss of Certificate / MEMART, Signature Variation, Director / Shareholder corrections",
    icon: Buildings,
    badge: "Official CAC",
  },
  {
    id: "CHANGE_OF_NAME",
    title: "Change / Correction of Name",
    subtitle: "For NIN, BVN, Bank accounts, NYSC, International Passport, and Academic credentials",
    icon: TextT,
    badge: "Most Popular",
  },
  {
    id: "AGE_DECLARATION",
    title: "Age Declaration / DOB Correction",
    subtitle: "Official declaration of age or date of birth correction for NIN, pension, or employment",
    icon: Cake,
    badge: "High Demand",
  },
  {
    id: "LOSS_OF_ITEM",
    title: "Loss of Document / SIM Card",
    subtitle: "Sworn affidavit for lost MTN/Airtel/Glo SIM, original certificates, or vehicle papers",
    icon: FileText,
  },
  {
    id: "PROOF_OF_OWNERSHIP",
    title: "Proof of Ownership / Next of Kin",
    subtitle: "Vehicle ownership, property, electronics, or declaration of marital/single status",
    icon: Car,
  },
  {
    id: "GENERAL_PURPOSE",
    title: "General Purpose Sworn Affidavit",
    subtitle: "Custom sworn legal statement of facts stamped by the Commissioner for Oaths",
    icon: Scales,
  },
];

interface Step1CategorySelectProps {
  selectedCategory: AffidavitCategoryType;
  onSelectCategory: (cat: AffidavitCategoryType) => void;
  onNext: () => void;
}

export function Step1CategorySelect({
  selectedCategory,
  onSelectCategory,
  onNext,
}: Step1CategorySelectProps) {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-black text-foreground">
          Select Affidavit Category
        </h2>
        <p className="text-xs text-muted-foreground">
          Choose the specific type of court affidavit you wish to process.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                  : "border-border bg-card hover:border-border/80 hover:bg-secondary/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon size={20} weight={isSelected ? "fill" : "bold"} />
                  </div>
                  {cat.badge && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border text-[9px] font-black uppercase tracking-wider">
                      {cat.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-foreground mb-1">
                  {cat.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground text-[11px]">Court Sworn</span>
                <span
                  className={
                    isSelected
                      ? "text-primary font-black flex items-center gap-1"
                      : "text-muted-foreground"
                  }
                >
                  {isSelected ? (
                    <>
                      <Check size={14} weight="bold" /> Selected
                    </>
                  ) : (
                    "Select ➔"
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <span>Continue to Deponent Info</span>
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}
