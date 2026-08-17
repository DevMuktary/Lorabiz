// src/components/features/nin/validation/ValidationSubmissionForm.tsx
"use client";

import React, { useState } from "react";
import { 
  Tag, 
  Fingerprint, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Layers, 
  Info,
  Clock,
  Sparkles,
  ArrowRight
} from "lucide-react";
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

const CATEGORY_OPTIONS = [
  {
    id: "NO_RECORD_FOUND",
    title: "No Record Found",
    description: "For NINs that return 'No Record Found' or missing records during NIMC verification searches.",
    badge: "Search Resolution",
  },
  {
    id: "VNIN_VALIDATION",
    title: "VNIN Validation",
    description: "For Virtual NINs requiring verification sync, linking, or clearing validation gateway errors.",
    badge: "Virtual NIN Sync",
  },
  {
    id: "UPDATE_RECORD_MOD",
    title: "Update Record (Mod Validation)",
    description: "For NIN records modified at enrollment centers requiring backend validation to reflect changes.",
    badge: "Modification Sync",
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

  // Clean numeric only
  const sanitizedNin = nin.replace(/\D/g, "").slice(0, 11);
  const isNinValid = sanitizedNin.length === 11;

  const currentCategoryConfig = CATEGORY_OPTIONS.find((c) => c.id === selectedCategory) || CATEGORY_OPTIONS[0];
  const currentPricing = pricing[selectedCategory] || { price: 2000, isActive: true };
  const servicePrice = currentPricing.price;
  const isServiceActive = currentPricing.isActive;

  const canSubmit = isNinValid && attestationsAccepted && isServiceActive;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCategory) {
      setErrorMessage("Please select a validation category.");
      return;
    }

    if (!isNinValid) {
      setErrorMessage("Please enter a valid 11-digit National Identification Number (NIN).");
      return;
    }

    if (!attestationsAccepted) {
      setErrorMessage("Please accept the terms and guidelines to proceed.");
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
        category: currentCategoryConfig.title,
        nin: sanitizedNin,
        amount: servicePrice,
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
    <div className="space-y-8">
      <form onSubmit={handleFormSubmit} className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
        
        {/* SECTION 1: Category Selection */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-base font-black text-foreground flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>1. Select Validation Category</span>
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose the category that matches your NIN's specific validation requirement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catPrice = pricing[cat.id]?.price ?? 2000;
              const catActive = pricing[cat.id]?.isActive ?? true;

              return (
                <div
                  key={cat.id}
                  onClick={() => catActive && setSelectedCategory(cat.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-md shadow-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/40 bg-card hover:bg-secondary/30"
                  } ${!catActive ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-secondary text-foreground rounded-full border border-border">
                        {cat.badge}
                      </span>
                      {isSelected ? (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-border" />
                      )}
                    </div>
                    
                    <h3 className="font-black text-sm text-foreground tracking-tight pt-1">
                      {cat.title}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground">Category Fee</span>
                    <span className="font-black text-sm text-primary">
                      ₦{catPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: 11-Digit NIN Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-black text-foreground flex items-center gap-2">
              <Fingerprint className="h-4 w-4 text-primary" />
              <span>2. Enter 11-Digit NIN</span>
            </label>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                sanitizedNin.length === 11
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {sanitizedNin.length} / 11 digits
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              value={sanitizedNin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 11);
                setNin(val);
              }}
              placeholder="e.g. 12345678901"
              className="w-full bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl px-4 py-3.5 text-base md:text-lg font-mono font-bold tracking-widest text-foreground outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground"
            />
            {sanitizedNin.length === 11 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Please double-check that every single digit is accurate before proceeding.
          </p>
        </div>

        {/* SECTION 3: Attestation & Statutory Terms */}
        <div className="p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attestationsAccepted}
              onChange={(e) => setAttestationsAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I certify that I have verified that this NIN actually requires validation under <strong className="text-foreground">{currentCategoryConfig.title}</strong>. I acknowledge that this service is strictly <strong className="text-foreground">non-refundable</strong> once submitted and may take 24–48 hours for validation and up to 72 hours for portal reflection.
            </span>
          </label>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Bottom Bar: Wallet Balance & Submit Button */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-secondary border border-border">
              <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Your Wallet Balance</p>
              <p className="text-base font-black text-foreground">₦{walletBalance.toLocaleString()}</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="px-8 py-3.5 bg-primary text-primary-foreground font-bold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-2 text-sm"
          >
            <span>Continue & Submit</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

      </form>

      {/* Confirmation Modal */}
      <ValidationConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        isLoading={isSubmitting}
        categoryLabel={currentCategoryConfig.title}
        nin={sanitizedNin}
        price={servicePrice}
        walletBalance={walletBalance}
      />
    </div>
  );
}
