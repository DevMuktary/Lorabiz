// src/app/dashboard/nin/validation/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  ListDashes, 
  Info, 
  CheckCircle, 
  Clock, 
  Spinner,
  ShieldCheck
} from "@phosphor-icons/react";
import { ValidationNoticeModal } from "@/components/features/nin/validation/ValidationNoticeModal";
import { ValidationSubmissionForm, CategoryPricing } from "@/components/features/nin/validation/ValidationSubmissionForm";

export default function NinValidationPage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [pricing, setPricing] = useState<Record<string, CategoryPricing>>({
    NO_RECORD_FOUND: { price: 2000, isActive: true },
    VNIN_VALIDATION: { price: 2500, isActive: true },
    UPDATE_RECORD_MOD: { price: 3000, isActive: true },
    PHOTO_ERROR: { price: 1600, isActive: true },
  });
  const [availablePasses, setAvailablePasses] = useState<number>(0);
  const [useRewardCredit, setUseRewardCredit] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<{
    reference: string;
    category: string;
    nin: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
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
        const passes = Number(data.freePassCount || 0);
        setAvailablePasses(passes);
        if (passes > 0) setUseRewardCredit(true);
      }
    } catch (err) {
      console.error("Failed to load initial validation data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (result: { reference: string; category: string; nin: string; amount: number }) => {
    setSubmittedResult(result);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative pb-12 animate-in fade-in duration-200 font-sans">
      
      {/* Intro Modal (Processing Timeline) */}
      <ValidationNoticeModal
        isOpen={mounted && showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
      />

      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Services
      </Link>

      {/* Page Header matching IPE & Tax ID */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nimc.png" 
              alt="NIMC Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              National Identity Management Commission
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">NIN Validation</h1>
            <p className="text-muted-foreground text-sm">
              Validate your NIN record, VNIN sync, or record modifications.
            </p>
          </div>
        </div>

        <Link 
          href="/dashboard/nin/validation/history" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          <span>View History & Status</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Post-Submission Success State */}
      {submittedResult ? (
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6 max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-500/20">
            <CheckCircle weight="fill" className="h-9 w-9" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-2xl font-black text-foreground">
              Validation Request Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Your validation request for NIN <strong className="font-mono text-foreground">{submittedResult.nin}</strong> has been transmitted and queued.
            </p>
          </div>

          <div className="bg-secondary/60 border border-border rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Category:</span>
              <span className="font-bold text-foreground">{submittedResult.category}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Reference:</span>
              <span className="font-mono font-bold text-foreground">{submittedResult.reference}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-bold text-amber-500 flex items-center gap-1">
                <Clock weight="bold" className="h-3.5 w-3.5" />
                PROCESSING
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estimated Turnaround:</span>
              <span className="text-foreground font-semibold">24–48 Hours</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You will receive an automated email notification as soon as the validation is resolved. You can track real-time progress on your History page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/nin/validation/history"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-90 flex items-center justify-center gap-2 transition-all"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              <span>Go to History & Tracking</span>
            </Link>
            
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                fetchInitialData();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold text-sm transition-colors cursor-pointer"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      ) : isLoading ? (
        /* Loading Skeleton */
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="h-8 w-8 animate-spin text-primary" weight="bold" />
            <span className="text-sm font-medium">Loading NIN validation details...</span>
          </div>
        </div>
      ) : (
        /* 3-Column Standard Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Form (Left 2 cols) */}
          <div className="lg:col-span-2">
            <ValidationSubmissionForm
              walletBalance={walletBalance}
              pricing={pricing}
              availablePasses={availablePasses}
              useRewardCredit={useRewardCredit}
              onToggleRewardCredit={setUseRewardCredit}
              onSuccess={handleSuccess}
            />
          </div>

          {/* Info Sidebar (Right 1 col) matching IPE & Tax ID */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24 space-y-5">
              <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">
                How to Track Your Request
              </h3>
              
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Select Category & Submit</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Choose your validation category, enter your 11-digit NIN, and submit your request.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Validation & Verification</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Our operations team verifies your record with the central identity database.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Instant Notification</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      You will receive an automated email when resolved. Full details remain accessible in your History.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Need help?</strong> If you have questions about your validation status, reach out to our team via live support.
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
