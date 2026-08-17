// src/components/features/nin/validation/ValidationSubmissionForm.tsx
"use client";

import React, { useState } from "react";
import { 
  Tag, 
  Key, 
  CheckCircle, 
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
  { id: "NO_RECORD_FOUND", label: "No Record Found" },
  { id: "VNIN_VALIDATION", label: "VNIN Validation" },
  { id: "UPDATE_RECORD_MOD", label: "Update Record (Mod)" },
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
      
      <form onSubmit={handleFormSubmit} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        
        {/* Processing Fee Tag Badge */}
        <div className="animate-in fade-in flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 px-3 py-2 rounded-lg w-fit">
          <Tag weight="fill" className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Processing Fee: ₦{currentPrice.toLocaleString()}
          </span>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3 animate-in fade-in">
            <WarningCircle weight="bold" className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm font-bold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* 1. Category Selection Tabs */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-foreground">
            1. Select Validation Category
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-secondary/60 p-1.5 rounded-xl border border-border">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catPrice = pricing[cat.id]?.price ?? 2000;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center justify-center py-3 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-background shadow-sm text-primary border border-border"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <span className="font-black text-xs">{cat.label}</span>
                  <span className="text-[11px] font-semibold text-muted-foreground mt-0.5">
                    ₦{catPrice.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. 11-Digit NIN Input Field */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label htmlFor="nin" className="text-sm font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <IdentificationCard weight="bold" className="h-4 w-4 text-primary" />
              National Identity Number (NIN)
            </span>
            <span className="text-xs font-mono font-normal text-muted-foreground">
              {sanitizedNin.length} / 11 digits
            </span>
          </label>

          <div className="relative">
            <input
              id="nin"
              type="text"
              inputMode="numeric"
              pattern="\d{11}"
              maxLength={11}
              required
              value={sanitizedNin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="Enter your 11-digit NIN"
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-mono tracking-wider font-bold text-foreground placeholder:font-sans placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
            />
            {isValidNin && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle weight="fill" className="h-5 w-5" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Please double-check that every single digit is accurate before proceeding.
          </p>
        </div>

        {/* Concise Statutory Attestation */}
        <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors select-none">
          <input
            type="checkbox"
            required
            checked={attestationsAccepted}
            onChange={(e) => setAttestationsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I confirm that I am the applicant or authorized agent submitting this NIN for validation.
          </span>
        </label>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm"
          >
            <ShieldCheck weight="bold" className="h-4 w-4" />
            <span>Submit NIN Validation</span>
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
