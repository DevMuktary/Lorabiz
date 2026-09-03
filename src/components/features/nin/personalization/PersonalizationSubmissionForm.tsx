// src/components/features/nin/personalization/PersonalizationSubmissionForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  Tag, 
  Key, 
  CheckCircle, 
  WarningCircle, 
  ShieldCheck,
  Gift
} from "@phosphor-icons/react";
import { PersonalizationConfirmationModal } from "./PersonalizationConfirmationModal";

interface PersonalizationSubmissionFormProps {
  walletBalance: number;
  servicePrice: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  discountBadge?: string;
  savedAmount?: number;
  freePassCount?: number;
  isServiceActive: boolean;
  onSuccess: (result: { reference: string; trackingId: string }) => void;
}

export function PersonalizationSubmissionForm({
  walletBalance,
  servicePrice,
  originalPrice,
  hasDiscount,
  discountBadge,
  savedAmount,
  freePassCount = 0,
  isServiceActive,
  onSuccess,
}: PersonalizationSubmissionFormProps) {
  const [trackingId, setTrackingId] = useState("");
  const [attestationsAccepted, setAttestationsAccepted] = useState(false);
  const [useRewardCredit, setUseRewardCredit] = useState(freePassCount > 0);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (freePassCount > 0) {
      setUseRewardCredit(true);
    }
  }, [freePassCount]);

  const sanitizedTrackingId = trackingId.trim().toUpperCase();
  const isValidTrackingId = sanitizedTrackingId.length >= 8 && sanitizedTrackingId.length <= 30;
  const canSubmit = isValidTrackingId && attestationsAccepted && isServiceActive;

  const isPassApplied = Boolean(useRewardCredit && freePassCount > 0);
  const effectiveFee = isPassApplied ? 0 : servicePrice;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidTrackingId) {
      setErrorMessage("Please enter a valid NIMC Tracking ID (e.g. 0SQT6M4S4RJISV1).");
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
      const response = await fetch("/api/nin/personalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: sanitizedTrackingId,
          attestationsAccepted,
          useRewardCredit: isPassApplied,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to submit personalization request.");
        setIsConfirmModalOpen(false);
        return;
      }

      setIsConfirmModalOpen(false);
      onSuccess({
        reference: data.reference,
        trackingId: sanitizedTrackingId,
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
        
        {/* PalmPay / OPay Style Free Pass Voucher Card (Compact) */}
        {freePassCount > 0 && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-2 sm:px-3.5 sm:py-2.5 transition-all">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Gift size={15} weight="fill" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-foreground">Free Personalization Pass</span>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white px-1.5 py-0.2 rounded">
                      {freePassCount} Ready (100% Free)
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {useRewardCredit
                      ? "Pass applied · Fee slashed to ₦0.00"
                      : "Pass available · Click toggle to apply"}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setUseRewardCredit(!useRewardCredit)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  useRewardCredit ? "bg-emerald-600" : "bg-muted-foreground/30"
                }`}
                title={useRewardCredit ? "Remove Free Pass" : "Apply Free Pass"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    useRewardCredit ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Processing Fee Tag Badge with Discount Support */}
        <div className="animate-in fade-in flex items-center gap-2 bg-secondary/60 border border-border px-3 py-2 rounded-xl w-fit">
          <Tag weight="fill" className="h-4 w-4 shrink-0 text-primary" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-foreground">
              Processing Fee:
            </span>
            {isPassApplied ? (
              <div className="flex items-center gap-1.5">
                <span className="line-through text-muted-foreground text-xs opacity-75">
                  ₦{servicePrice.toLocaleString()}
                </span>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                  ₦0.00 FREE WITH PASS
                </span>
              </div>
            ) : hasDiscount && originalPrice && originalPrice > servicePrice ? (
              <div className="flex items-center gap-1.5">
                <span className="line-through text-muted-foreground text-xs opacity-75">
                  ₦{originalPrice.toLocaleString()}
                </span>
                <span className="font-bold text-xs text-foreground">
                  ₦{servicePrice.toLocaleString()}
                </span>
                <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                  {discountBadge || "DISCOUNTED"}
                </span>
              </div>
            ) : (
              <span className="font-bold text-xs text-foreground">
                ₦{servicePrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Form Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">NIN Personalization Request</h2>
          <p className="text-sm text-muted-foreground">
            Submit your enrollment tracking ID for personalization.
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl text-sm flex items-start gap-3 animate-in fade-in duration-200">
            <WarningCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Submission Error</span>
              <span className="text-xs leading-relaxed opacity-90">{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Tracking ID Input */}
        <div className="space-y-2">
          <label htmlFor="trackingId" className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Key weight="bold" className="h-4 w-4 text-primary" />
            NIMC Enrollment Tracking ID <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <input
              id="trackingId"
              type="text"
              required
              maxLength={30}
              placeholder="e.g. 0SQT6M4S4RJISV1"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              className="w-full px-4 py-3.5 bg-background border border-input rounded-xl text-foreground font-mono font-bold text-base placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase tracking-wider text-base sm:text-base"
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Enter the tracking ID printed on your NIMC enrollment slip.</span>
            {sanitizedTrackingId.length > 0 && (
              <span className="font-mono">{sanitizedTrackingId.length} characters</span>
            )}
          </p>
        </div>

        {/* Attestation Checkbox */}
        <div className="pt-2">
          <label className="flex items-start gap-3 p-4 bg-secondary/40 hover:bg-secondary/60 rounded-xl cursor-pointer border border-border/80 transition-colors select-none">
            <input
              type="checkbox"
              required
              checked={attestationsAccepted}
              onChange={(e) => setAttestationsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I verify that this Tracking ID belongs to the applicant and authorize LoraBiz to submit this enrollment record for official personalization processing.
            </span>
          </label>
        </div>

        {/* Submit Button with Live Price Slash */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground text-center sm:text-left">
            <span>Turnaround: </span>
            <strong className="text-foreground">1 – 24 Hours (slight delay on weekends)</strong>
          </div>

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShieldCheck weight="bold" className="h-4 w-4" />
            {isPassApplied ? (
              <span className="flex items-center gap-2">
                <span>Submit Personalization (₦0.00 Free)</span>
                <span className="text-xs opacity-75 line-through">₦{servicePrice.toLocaleString()}</span>
              </span>
            ) : (
              <span>Proceed to Personalization · ₦{servicePrice.toLocaleString()}</span>
            )}
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      <PersonalizationConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        isLoading={isSubmitting}
        trackingId={sanitizedTrackingId}
        price={servicePrice}
        walletBalance={walletBalance}
        isUsingCredit={isPassApplied}
      />
    </div>
  );
}
