// src/app/dashboard/nin/validation/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  ListOrdered, 
  Info, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Fingerprint, 
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { ValidationNoticeModal } from "@/components/features/nin/validation/ValidationNoticeModal";
import { ValidationSubmissionForm, CategoryPricing } from "@/components/features/nin/validation/ValidationSubmissionForm";

export default function NinValidationPage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pricing, setPricing] = useState<Record<string, CategoryPricing>>({
    NO_RECORD_FOUND: { price: 2000, isActive: true },
    VNIN_VALIDATION: { price: 2500, isActive: true },
    UPDATE_RECORD_MOD: { price: 3000, isActive: true },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(true);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<{
    reference: string;
    category: string;
    nin: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nin/validation");
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.walletBalance || 0);
        if (data.pricing) setPricing(data.pricing);
      }
    } catch (err) {
      console.error("Failed to load initial validation data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300 font-sans">
      
      {/* Notice Modal */}
      <ValidationNoticeModal
        isOpen={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
      />

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/nin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to NIN Hub
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                NIN Validation Service
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Resolve No Record Found, VNIN sync, or record modification issues.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNoticeModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-bold transition-all cursor-pointer"
          >
            <Info className="h-4 w-4 text-primary" />
            <span>Read Notice</span>
          </button>

          <Link
            href="/dashboard/nin/validation/history"
            className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-xs font-bold rounded-xl hover:bg-secondary transition-colors"
          >
            <ListOrdered className="h-4 w-4 text-primary" />
            <span>Validation History</span>
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground">Loading service information...</p>
        </div>
      ) : submittedResult ? (
        
        /* Submission Success Card */
        <div className="bg-card border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 animate-in zoom-in-95 duration-300">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              Validation Request Submitted! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Your NIN validation application has been queued and is now actively being processed by the identity operations team.
            </p>
          </div>

          {/* Details Breakdown */}
          <div className="bg-secondary/40 rounded-2xl p-5 md:p-6 border border-border max-w-lg mx-auto space-y-3.5 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-bold text-foreground">{submittedResult.category}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">NIN:</span>
              <span className="font-mono font-bold text-foreground bg-background px-2.5 py-1 rounded-lg border border-border">
                {submittedResult.nin}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Amount Debited:</span>
              <span className="font-black text-primary">₦{submittedResult.amount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reference:</span>
              <button
                type="button"
                onClick={() => handleCopyRef(submittedResult.reference)}
                className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-foreground bg-background px-2 py-1 rounded border border-border hover:border-primary transition-colors cursor-pointer"
              >
                <span>{submittedResult.reference}</span>
                {copiedRef ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-primary" /> Turnaround:
              </span>
              <span className="font-bold text-foreground">24–48 Hours</span>
            </div>
          </div>

          {/* Portal reflection advisory */}
          <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs max-w-lg mx-auto leading-relaxed flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> You will receive an automated email notification once the validation is resolved. Nationwide portal reflection may take up to 72 hours.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto pt-2">
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                fetchInitialData();
              }}
              className="flex-1 py-3 bg-secondary text-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-xs sm:text-sm cursor-pointer"
            >
              Submit Another NIN
            </button>

            <Link
              href="/dashboard/nin/validation/history"
              className="flex-1 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:opacity-90 transition-opacity text-xs sm:text-sm flex items-center justify-center gap-2 text-center shadow-md cursor-pointer"
            >
              <span>View History</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      ) : (

        /* Submission Form */
        <div className="space-y-6">
          
          {/* Top Notice Banner */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs sm:text-sm flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
              <div className="space-y-1">
                <p className="font-bold text-foreground">Important Submission Advisory</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Please ensure your NIN has a genuine validation issue. This service is strictly non-refundable and takes 24–48 hours for validation (official portal sync takes up to 72 hours).
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowNoticeModal(true)}
              className="text-xs font-bold text-primary hover:underline shrink-0 cursor-pointer"
            >
              Details
            </button>
          </div>

          {/* Form */}
          <ValidationSubmissionForm
            walletBalance={walletBalance}
            pricing={pricing}
            onSuccess={(res) => {
              setSubmittedResult(res);
            }}
          />

        </div>
      )}

    </div>
  );
}
