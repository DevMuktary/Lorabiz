// src/components/features/nin/ipe/IpeSubmissionForm.tsx
"use client";

import React, { useState } from "react";
import {
  Tag,
  Key,
  CheckCircle,
  WarningCircle,
  ShieldCheck
} from "@phosphor-icons/react";
import { IpeConfirmationModal } from "./IpeConfirmationModal";

interface IpeSubmissionFormProps {
  walletBalance: number;
  servicePrice: number;
  originalPrice?: number;
  hasDiscount?: boolean;
  discountBadge?: string;
  isServiceActive: boolean;
  onSuccess: (result: { reference: string; trackingId: string }) => void;
}

export function IpeSubmissionForm({
  walletBalance,
  servicePrice,
  originalPrice,
  hasDiscount,
  discountBadge,
  isServiceActive,
  onSuccess,
}: IpeSubmissionFormProps) {
  const [trackingId, setTrackingId] = useState("");
  const [attestationsAccepted, setAttestationsAccepted] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sanitizedTrackingId = trackingId.trim().toUpperCase();
  const isValidTrackingId = sanitizedTrackingId.length >= 8 && sanitizedTrackingId.length <= 30;
  const canSubmit = isValidTrackingId && attestationsAccepted && isServiceActive;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isValidTrackingId) {
      setErrorMessage("Please enter a valid NIMC Tracking ID (e.g., 0SQT6M4S4RJISV1).");
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
      const response = await fetch("/api/nin/ipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: sanitizedTrackingId,
          attestationsAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Failed to submit IPE clearance request.");
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

        {/* Processing Fee Tag Badge */}
        <div className="animate-in fade-in flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl w-fit">
          <Tag weight="fill" className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
            <span>Processing Fee:</span>
            {hasDiscount && originalPrice && originalPrice > servicePrice && (
              <span className="line-through text-muted-foreground opacity-70 font-normal">
                ₦{originalPrice.toLocaleString()}
              </span>
            )}
            <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">
              ₦{servicePrice.toLocaleString()}
            </span>
            {discountBadge && (
              <span className="bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md ml-1 shadow-xs">
                {discountBadge} AUTO-APPLIED
              </span>
            )}
          </span>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 flex items-start gap-3 animate-in fade-in">
            <WarningCircle weight="bold" className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="text-xs sm:text-sm font-bold leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Input Field for Tracking ID */}
        <div className="space-y-2">
          <label htmlFor="trackingId" className="text-sm font-bold text-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Key weight="bold" className="h-4 w-4 text-primary" />
              National Identity Number (NIMC) Tracking ID
            </span>
            <span className="text-xs font-mono font-normal text-muted-foreground">
              {sanitizedTrackingId.length} chars
            </span>
          </label>

          <div className="relative">
            <input
              id="trackingId"
              type="text"
              required
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="e.g. 0SQT6M4S4RJISV1"
              maxLength={30}
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-sm font-mono tracking-wider font-bold text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all uppercase"
            />
            {isValidTrackingId && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle weight="fill" className="h-5 w-5" />
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Found on your NIMC enrollment slip (usually 15 alphanumeric characters).
          </p>
        </div>

        {/* Statutory Attestation */}
        <label className="flex items-start gap-3 p-4 bg-secondary/50 rounded-xl cursor-pointer border border-transparent hover:border-border transition-colors select-none">
          <input
            type="checkbox"
            required
            checked={attestationsAccepted}
            onChange={(e) => setAttestationsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer shrink-0"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            I confirm that I am the applicant or hold lawful authorization to request IPE clearance for this Tracking ID in accordance with the <strong>Nigeria Data Protection Act (NDPA) 2023</strong> and LoraBiz Terms.
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
            <span>Submit IPE Clearance</span>
          </button>
        </div>

      </form>

      {/* Confirmation Modal */}
      <IpeConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmission}
        isLoading={isSubmitting}
        trackingId={sanitizedTrackingId}
        price={servicePrice}
        walletBalance={walletBalance}
      />
    </div>
  );
}
