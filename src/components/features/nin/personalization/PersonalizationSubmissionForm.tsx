"use client";

import React, { useState } from "react";
import { 
  Tag, 
  Key, 
  CheckCircle, 
  WarningCircle, 
  ShieldCheck 
} from "@phosphor-icons/react";
import { PersonalizationConfirmationModal } from "./PersonalizationConfirmationModal";

interface PersonalizationSubmissionFormProps {
  walletBalance: number;
  servicePrice: number;
  isServiceActive: boolean;
  onSuccess: (result: { reference: string; trackingId: string }) => void;
}

export function PersonalizationSubmissionForm({
  walletBalance,
  servicePrice,
  isServiceActive,
  onSuccess,
}: PersonalizationSubmissionFormProps) {
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
        {/* Processing Fee Tag Badge */}
        <div className="animate-in fade-in flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 px-3 py-2 rounded-lg w-fit">
          <Tag weight="fill" className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Processing Fee: ₦{servicePrice.toLocaleString()}
          </span>
        </div>

        {/* Form Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">NIN Personalization Request</h2>
          <p className="text-sm text-muted-foreground">
            Submit your enrollment tracking ID for personalization (and maybe retrieve your verified identity slip).
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
              className="w-full px-4 py-3.5 bg-background border border-input rounded-xl text-foreground font-mono font-bold text-base placeholder:font-sans placeholder:font-normal placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase tracking-wider"
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Enter the tracking ID printed on your NIMC enrollment slip.</span>
            {sanitizedTrackingId.length > 0 && (
              <span className="font-mono">{sanitizedTrackingId.length} characters</span>
            )}
          </p>
        </div>

        {/* Attestation Checkbox (Minimized) */}
        <div className="pt-2">
          <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={attestationsAccepted}
              onChange={(e) => setAttestationsAccepted(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer shrink-0"
            />
            <span className="text-xs font-medium text-foreground leading-relaxed">
              I confirm that this Tracking ID is correct and authorize Lorabiz to process this personalization request.
            </span>
          </label>
        </div>

        {/* Submit Button */}
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
            <CheckCircle weight="bold" className="h-4 w-4" />
            <span>Proceed to Personalization</span>
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
      />
    </div>
  );
}
