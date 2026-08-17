// src/components/features/nin/ipe/IpeSubmissionForm.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Tag, 
  Clock, 
  Key, 
  CheckCircle, 
  WarningCircle, 
  ArrowRight, 
  Wallet, 
  SmileySad,
  ShieldCheck
} from "@phosphor-icons/react";
import { IpeConfirmationModal } from "./IpeConfirmationModal";

interface IpeSubmissionFormProps {
  walletBalance: number;
  servicePrice: number;
  isServiceActive: boolean;
  onSuccess: (result: { reference: string; trackingId: string }) => void;
}

export function IpeSubmissionForm({
  walletBalance,
  servicePrice,
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
  const isBalanceSufficient = walletBalance >= servicePrice;
  const canSubmit = isValidTrackingId && attestationsAccepted && isServiceActive && isBalanceSufficient;

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

    if (!isBalanceSufficient) {
      setErrorMessage(
        `Insufficient wallet balance. You need ₦${servicePrice.toLocaleString()} to submit this request.`
      );
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
        
        {/* Header Badges & Pricing */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Clearance Application
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit your NIMC enrollment Tracking ID for exception resolution.
            </p>
          </div>

          <div className="animate-in fade-in flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-500 px-3 py-1.5 rounded-xl w-fit">
            <Tag weight="fill" className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Processing Fee: ₦{servicePrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Turnaround Notice */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-700 dark:text-amber-300 flex items-start gap-3">
          <Clock weight="fill" className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
          <p className="text-xs sm:text-sm leading-relaxed font-medium">
            This service will be processed within <strong>~24 hours</strong>. Please ensure the Tracking ID you are submitting actually has an IPE issue.
          </p>
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
              NIMC Tracking ID
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
            Found on your official NIMC enrollment slip (usually 15 alphanumeric characters).
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
            I confirm that I am the applicant or a designated agent authorized to request IPE clearance for this Tracking ID.
          </span>
        </label>

        {/* Insufficient Wallet Balance Custom Card (With Appealing Crying Icon & Direct Dashboard Link) */}
        {!isBalanceSufficient && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <SmileySad weight="duotone" className="h-6 w-6 animate-pulse text-amber-500" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <span>Insufficient Wallet Balance</span>
                  <span className="text-base">🥺</span>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Available: <strong className="text-foreground">₦{walletBalance.toLocaleString()}</strong> • Required: <strong className="text-foreground">₦{servicePrice.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              You need at least <strong className="text-foreground">₦{servicePrice.toLocaleString()}</strong> in your wallet to process this IPE clearance. Please head to your dashboard to fund your wallet.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer"
            >
              <Wallet weight="bold" className="h-4 w-4" />
              <span>Go to Dashboard / Fund Wallet</span>
              <ArrowRight weight="bold" className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer text-sm"
          >
            <ShieldCheck weight="bold" className="h-4 w-4" />
            <span>Submit Clearance & Pay ₦{servicePrice.toLocaleString()}</span>
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
