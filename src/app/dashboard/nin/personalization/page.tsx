"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  ListDashes, 
  CheckCircle, 
  Clock, 
  Spinner,
  ShieldCheck,
  Fingerprint
} from "@phosphor-icons/react";
import { PersonalizationSubmissionForm } from "@/components/features/nin/personalization/PersonalizationSubmissionForm";
import { PersonalizationNoticeModal } from "@/components/features/nin/personalization/PersonalizationNoticeModal";

export default function NinPersonalizationPage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [servicePrice, setServicePrice] = useState<number>(1500);
  const [isServiceActive, setIsServiceActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [submittedResult, setSubmittedResult] = useState<{ reference: string; trackingId: string } | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nin/personalization");
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.walletBalance || 0);
        setServicePrice(data.servicePrice || 1500);
        setIsServiceActive(data.isServiceActive ?? true);
      }
    } catch (err) {
      console.error("Failed to load initial Personalization data:", err);
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
          The NIN Personalization service is currently undergoing maintenance. Please check back shortly.
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
    <div className="space-y-6 max-w-6xl mx-auto relative pb-12 animate-in fade-in duration-200">
      {/* Notice Modal (I Understand) */}
      <PersonalizationNoticeModal 
        isOpen={showNoticeModal} 
        onClose={() => setShowNoticeModal(false)} 
      />

      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Services
      </Link>

      {/* Page Header */}
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
            <h1 className="text-2xl font-black text-foreground tracking-tight">NIN Personalization</h1>
            <p className="text-muted-foreground text-sm">
              Submit your enrollment tracking ID for personalization.
            </p>
          </div>
        </div>

        <Link 
          href="/dashboard/nin/personalization/history" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          <span>View History & Slips</span>
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
              Personalization Request Submitted
            </h2>
            <p className="text-sm text-muted-foreground">
              Your tracking ID <strong className="font-mono text-foreground">{submittedResult.trackingId}</strong> has been transmitted for personalization.
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
                Processing
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Turnaround:</span>
              <span className="text-foreground font-semibold">1 – 24 Hours (slight delay on weekends)</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            You will receive an automated notification as soon as personalization processing completes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/dashboard/nin/personalization/history"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:opacity-90 flex items-center justify-center gap-2 transition-all"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              <span>Go to History & Slips</span>
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
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Spinner className="h-8 w-8 animate-spin text-primary" weight="bold" />
            <span className="text-sm font-medium">Loading personalization details...</span>
          </div>
        </div>
      ) : (
        /* Standard 3-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form (Left 2 cols) */}
          <div className="lg:col-span-2">
            <PersonalizationSubmissionForm
              walletBalance={walletBalance}
              servicePrice={servicePrice}
              isServiceActive={isServiceActive}
              onSuccess={handleSuccess}
            />
          </div>

          {/* Guidelines Sidebar (Right 1 col) */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm sticky top-24 space-y-5">
              <h3 className="font-black text-sm uppercase tracking-wider text-muted-foreground">
                Fulfillment Steps
              </h3>
              
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Tracking ID Submission</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Submit your enrollment tracking ID for personalization.
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Gateway Processing</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Processed within 1 to 24 hours (slight delay may occur on weekends).
                    </p>
                  </div>
                </li>

                <li className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-primary/20">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">NIN & Slip Generation</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      Get your resolved National Identity Number (NIN) and download your identity slip.
                    </p>
                  </div>
                </li>
              </ul>

              <div className="p-3.5 rounded-xl bg-secondary/50 border border-border text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">No Refund Policy:</strong> Personalization requests are non-refundable once submitted.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
