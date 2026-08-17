"use client";

import React, { useState } from "react";
import { 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  KeyRound, 
  ShieldCheck, 
  Sparkles,
  Wallet
} from "lucide-react";
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
      setErrorMessage("Please confirm the statutory declaration to proceed.");
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
      {/* Turnaround Time & Critical Notice */}
      <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/50 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 text-amber-950 dark:text-amber-200">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Turnaround Time
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 font-semibold">
                ~24 Hours
              </span>
            </div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              This service will be processed within ~24 hours. Please ensure the Tracking ID you are submitting actually has an IPE issue.
            </p>
          </div>
        </div>
      </div>

      {/* Main Submission Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none space-y-6">
        
        {/* Form Title & Pricing Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Submit IPE Tracking ID
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                Live Automated Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter the NIMC Tracking ID with an Initial Processing Exception to initiate clearance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Service Fee
              </span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                ₦{servicePrice.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-800 dark:text-rose-300 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium leading-relaxed">
              {errorMessage}
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* Tracking ID Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="trackingId" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                NIMC Tracking ID
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {sanitizedTrackingId.length} characters
              </span>
            </div>

            <div className="relative">
              <input
                id="trackingId"
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                placeholder="e.g. 0SQT6M4S4RJISV1"
                maxLength={30}
                required
                className="w-full h-14 px-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl font-mono text-base tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
              {isValidTrackingId && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>
            
            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Found on your NIMC National Identity Management Commission registration slip.
            </p>
          </div>

          {/* Statutory Declaration Checkbox */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:p-5">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={attestationsAccepted}
                onChange={(e) => setAttestationsAccepted(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
              />
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Statutory Authorization & Legal Acknowledgment
                </span>
                <p>
                  I certify that I am the authorized applicant or legally designated agent requesting exception clearance for this Tracking ID. I understand this service will be submitted to the NIMC exception gateway and is processed within ~24 hours.
                </p>
              </div>
            </label>
          </div>

          {/* Wallet Balance Summary & Submit Button */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                  Available Wallet Balance
                </span>
                <span className={`text-sm font-bold ${isBalanceSufficient ? "text-slate-900 dark:text-white" : "text-rose-600"}`}>
                  ₦{walletBalance.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="h-13 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Proceed to Clearance</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>

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
