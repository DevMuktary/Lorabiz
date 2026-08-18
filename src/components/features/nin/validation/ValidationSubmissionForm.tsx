// src/components/features/nin/validation/ValidationSubmissionForm.tsx
"use client";

import React, { useState } from "react";
import { 
  MagnifyingGlass,
  QrCode,
  ArrowsClockwise,
  CheckCircle, 
  Circle,
  WarningCircle, 
  ShieldCheck,
  IdentificationCard
} from "@phosphor-icons/react";
import { ValidationConfirmationModal } from "./ValidationConfirmationModal";

export interface CategoryPricing {
  price: number;
  isActive: boolean;
  maintenanceMsg?: string | null;
}

interface ValidationSubmissionFormProps {
  walletBalance: number;
  pricing: Record<string, CategoryPricing>;
  onSuccess: (result: { reference: string; category: string; nin: string; amount: number }) => void;
}

const CATEGORIES = [
  {
    id: "NO_RECORD_FOUND",
    label: "No Record Found",
    icon: MagnifyingGlass,
  },
  {
    id: "VNIN_VALIDATION",
    label: "VNIN Validation",
    icon: QrCode,
  },
  {
    id: "UPDATE_RECORD_MOD",
    label: "Update Record (Mod Validation)",
    icon: ArrowsClockwise,
  },
];

export function ValidationSubmissionForm({
  walletBalance,
  pricing,
  onSuccess,
}: ValidationSubmissionFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("NO_RECORD_FOUND");
  const [nin, setNin] = useState<string>("");
  const [attestationsAccepted, setAttestationsAccepted] = useState<boolean>(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sanitizedNin = nin.replace(/\D/g, "").slice(0, 11);
  const isValidNin = sanitizedNin.length === 11;

  const currentCategoryConfig = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const currentPricing = pricing[selectedCategory] || { price: 2000, isActive: true };
  const currentPrice = currentPricing.price;
  const isServiceActive = currentPricing.isActive;

  const canSubmit = isValidNin && attestationsAccepted && isServiceActive;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidNin) {
      setErrorMessage("Please enter a valid 11-digit National Identification Number (NIN).");
      return;
    }

    if (!attestationsAccepted) {
      setErrorMessage("Please check the authorization box to proceed.");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/nin/validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          nin: sanitizedNin,
          attestationsAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to submit NIN validation request.");
        setIsConfirmModalOpen(false);
        return;
      }

      setIsConfirmModalOpen(false);
      onSuccess({
        reference: data.reference,
        category: currentCategoryConfig.label,
        nin: sanitizedNin,
        amount: currentPrice,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error. Please try again.";
      setErrorMessage(msg);
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <form onSubmit={handleFormSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-7">
        
        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3 animate-in fade-in">
            <WarningCircle weight="bold" className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm font-bold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Category Selection Cards (Clean, Simple, No Long Explanations) */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-foreground block">
            1. Select Validation Category
          </label>
          
          <div className="space-y-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catPrice = pricing[cat.id]?.price ?? 2000;
              const IconComponent = cat.icon;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    isSelected
                      ? "border-primary bg-primary/[0.04] ring-2 ring-primary/20 shadow-sm"
                      : "border-border hover:border-primary/40 bg-background/50 hover:bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <IconComponent weight={isSelected ? "bold" : "regular"} className="h-5 w-5" />
                    </div>

                    <span className="font-bold text-sm text-foreground">
                      {cat.label}
                    </span>
                  </div>

                  <div className="flex items-center shrink-0 gap-3">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-tight border ${
                      isSelected 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                        : "bg-secondary text-muted-foreground border-border"
                    }`}>
                      ₦{catPrice.toLocaleString()}
                    </div>

                    <div>
                      {isSelected ? (
                        <CheckCircle weight="fill" className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle weight="regular" className="h-5 w-5 text-muted-foreground/40" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: 11-Digit NIN Input Field */}
        <div className="space-y-2.5 pt-5 border-t border-border">
          <label htmlFor="nin" className="text-sm font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                2
              </span>
              <span>National Identity Number (NIN)</span>
            </span>
            <span className="text-xs font-mono font-medium text-muted-foreground">
              {sanitizedNin.length} / 11 digits
            </span>
          </label>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <IdentificationCard weight="bold" className="h-5 w-5" />
            </div>

            <input
              id="nin"
              type="text"
              inputMode="numeric"
              pattern="\d{11}"
              maxLength={11}
              required
              value={sanitizedNin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="Enter 11-digit NIN (e.g. 12345678901)"
              className="w-full bg-background border border-border rounded-xl pl-12 pr-12 py-3.5 text-sm sm:text-base font-mono tracking-wider font-bold text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
            />

            {isValidNin && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-in zoom-in-50 duration-200">
                <CheckCircle weight="fill" className="h-5 w-5" />
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Concise Attestation Checkbox */}
        <div className="space-y-4 pt-5 border-t border-border">
          <label className="flex items-start gap-3 p-4 bg-secondary/40 hover:bg-secondary/60 rounded-xl cursor-pointer border border-border/80 transition-colors select-none">
            <input
              type="checkbox"
              required
              checked={attestationsAccepted}
              onChange={(e) => setAttestationsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I confirm that I am the applicant or an authorized agent submitting this NIN for validation.
            </span>
          </label>

          {/* Action Button */}
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm"
          >
            <ShieldCheck weight="bold" className="h-4 w-4" />
            <span>Submit NIN Validation · ₦{currentPrice.toLocaleString()}</span>
          </button>
        </div>

      </form>

      {/* Confirmation Modal */}
      <ValidationConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        isLoading={isSubmitting}
        categoryLabel={currentCategoryConfig.label}
        nin={sanitizedNin}
        price={currentPrice}
        walletBalance={walletBalance}
      />
    </div>
  );
}
