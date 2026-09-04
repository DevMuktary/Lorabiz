// src/app/dashboard/nin/ipe/page.tsx
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
import { IpeSubmissionForm } from "@/components/features/nin/ipe/IpeSubmissionForm";

export default function IpeClearancePage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [servicePrice, setServicePrice] = useState<number>(2500);
  const [originalPrice, setOriginalPrice] = useState<number>(2500);
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const [discountBadge, setDiscountBadge] = useState<string | undefined>(undefined);
  const [isServiceActive, setIsServiceActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showIntroModal, setShowIntroModal] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = useState<{ reference: string; trackingId: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nin/ipe/history");
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.walletBalance || 0);
        setServicePrice(data.servicePrice || 2500);
        setOriginalPrice(data.originalPrice || data.servicePrice || 2500);
        setHasDiscount(Boolean(data.hasDiscount));
        setDiscountBadge(data.discountBadge || undefined);
        setIsServiceActive(data.isServiceActive ?? true);
      }
    } catch (err) {
      console.error("Failed to load initial IPE data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = (result: { reference: string; trackingId: string }) => {
    setSubmittedResult(result);
  };

  if (!isServiceActive && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-foreground">Service Temporarily Unavailable</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The NIMC IPE Clearance service is undergoing scheduled system maintenance. Please check back shortly.
        </p>
        <Link 
          href="/dashboard/nin" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Services
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto relative pb-16 animate-in fade-in duration-200">
      
      {/* Intro Modal (Processing Timeline) */}
      {mounted && showIntroModal && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 min-h-screen w-screen z-[99999] flex items-center justify-center p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-6 fade-in duration-300">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0">
                <Info weight="fill" className="h-6 w-6 text-blue-500" />
              </div>
              <h2 className="text-xl font-black text-foreground">Processing Timeline</h2>
            </div>
            
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                This service will be processed within <strong className="text-foreground">~24 hours</strong>. Please ensure the Tracking ID you are submitting actually has an In-Processing Error issue.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => setShowIntroModal(false)}
              className="mt-8 w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              I Understand
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Services
      </Link>

      {/* Page Header matching Tax ID */}
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
            <h1 className="text-2xl font-black text-foreground tracking-tight">IPE Clearance</h1>
            <p className="text-muted-foreground text-sm">
              Clear In-Processing Errors on your NIN.
            </p>
          </div>
        </div>

        <Link 
          href="/dashboard/nin/ipe/history" 
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
              Clearance Request Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Your IPE clearance request for Tracking ID <strong className="font-mono text-foreground">{submittedResult.trackingId}</strong> has been transmitted to NIMC.
            </p>
          </div>

          <div className="bg-secondary/60 border border-border rounded-2xl p-5 max-w-md mx-auto text-left space-y-2.5 text-xs">
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
              <span className="text-foreground font-semibold">~24 Hours</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You will receive an automated email notification as soon as the error is cleared. You can track real-time progress on your History page.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/nin/ipe/history"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-90 flex items-center justify-center gap-2 transition-all"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              <span>Go to History & Tracking</span>
            </Link>
            
            <button
              type="button"
              onClick={() => setSubmittedResult(null)}
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
            <span className="text-sm font-medium">Loading IPE clearance service details...</span>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <IpeSubmissionForm
            walletBalance={walletBalance}
            servicePrice={servicePrice}
            originalPrice={originalPrice}
            hasDiscount={hasDiscount}
            discountBadge={discountBadge}
            isServiceActive={isServiceActive}
            onSuccess={handleSuccess}
          />
        </div>
      )}

    </div>
  );
}
