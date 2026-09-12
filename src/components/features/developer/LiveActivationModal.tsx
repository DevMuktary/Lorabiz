"use client";

import React, { useState } from "react";
import { Zap, Clock, AlertCircle, X, Check } from "lucide-react";

interface LiveActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (toastData?: { type: "success" | "error"; title: string; message: string }) => void;
  currentProfile: {
    status: string;
    businessName?: string;
    websiteUrl?: string | null;
    ownerNinMasked?: string;
    useCase?: string;
    rejectionReason?: string | null;
  } | null;
}

export const LiveActivationModal: React.FC<LiveActivationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentProfile,
}) => {
  if (!isOpen) return null;

  const isPending = currentProfile?.status === "PENDING_APPROVAL";
  const isRejected = currentProfile?.status === "REJECTED";

  const [businessName, setBusinessName] = useState(currentProfile?.businessName || "");
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.websiteUrl || "");
  const [ownerNin, setOwnerNin] = useState("");
  const [useCase, setUseCase] = useState(currentProfile?.useCase || "Customer KYC & Onboarding");
  const [customUseCase, setCustomUseCase] = useState("");
  const [attestationAccepted, setAttestationAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attestationAccepted) {
      setErrorMessage("Please accept the legal data protection attestation to proceed.");
      return;
    }

    if (!/^\d{11}$/.test(ownerNin.trim())) {
      setErrorMessage("Please enter a valid 11-digit NIN for the account owner.");
      return;
    }

    const cleanWebsite = normalizeUrl(websiteUrl);
    setWebsiteUrl(cleanWebsite);

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/developer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          websiteUrl: cleanWebsite || undefined,
          ownerNin: ownerNin.trim(),
          useCase,
          customUseCase: useCase === "Other" ? customUseCase.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMessage(data.message || "Failed to submit live activation request.");
        return;
      }

      onSuccess({
        type: "success",
        title: "Application Submitted Successfully",
        message: "Your live mode API access request has been submitted for review. Verification status is now Pending Review.",
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5 text-emerald-600 dark:text-emerald-400">
          <Zap className="h-6 w-6" />
          <h2 className="text-lg font-bold text-foreground">Live Mode API Activation</h2>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          To comply with regulatory standards (NDPA & NIMC), please provide your application details to unlock live keys.
        </p>

        {isPending ? (
          <div className="mt-5 space-y-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                Application Under Review
              </h3>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                Your application for <strong>{currentProfile?.businessName}</strong> has been submitted and is currently being verified by our compliance team.
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Typical Turnaround Time: &lt; 2 hours during business hours. You will receive an email once approved.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-foreground px-4 py-2.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                Close & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
            {isRejected && currentProfile?.rejectionReason && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                      Previous Application Update Required:
                    </p>
                    <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                      {currentProfile.rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Business or Application Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Apex Corporate Services or Kano Logistics"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Website or Application URL <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                onBlur={() => {
                  if (websiteUrl) {
                    setWebsiteUrl(normalizeUrl(websiteUrl));
                  }
                }}
                placeholder="https://yourwebsite.com or company.com"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Account Owner&apos;s NIN (11 Digits) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={ownerNin}
                onChange={(e) => setOwnerNin(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678901"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Your NIN is securely held for compliance accountability and is never disclosed publicly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                Intended Use Case <span className="text-red-500">*</span>
              </label>
              <select
                value={useCase}
                onChange={(e) => setUseCase(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Multi-Service Agency / Business Partner">Multi-Service Agency / Business Partner (Identity, CAC, Compliance)</option>
                <option value="Corporate Services & Company Registration">Corporate Services &amp; Company Registration</option>
                <option value="Customer KYC & Identity Verification">Customer KYC &amp; Identity Verification</option>
                <option value="Staff & Employee Onboarding">Staff &amp; Employee Onboarding</option>
                <option value="Fintech & Digital Payments">Fintech &amp; Digital Payments</option>
                <option value="Agent Banking & POS Operations">Agent Banking &amp; POS Operations</option>
                <option value="E-Commerce & Logistics">E-Commerce &amp; Logistics</option>
                <option value="Other">Other (Specify below)</option>
              </select>
            </div>

            {useCase === "Other" && (
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Describe Your Use Case <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={customUseCase}
                  onChange={(e) => setCustomUseCase(e.target.value)}
                  placeholder="Briefly explain what your app or company does..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Legal Attestation */}
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={attestationAccepted}
                  onChange={(e) => setAttestationAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  I hereby certify that our organization obtains lawful consent from individuals before submitting verification queries, in full accordance with the <strong>Nigeria Data Protection Act (NDPA)</strong>.
                </span>
              </label>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !attestationAccepted}
                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
