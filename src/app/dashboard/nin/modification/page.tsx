"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  CheckCircle, 
  ListDashes, 
  Spinner
} from "@phosphor-icons/react";
import { NinTermsModal } from "@/components/features/nin/modification/NinTermsModal";
import { ModificationForm, PricingConfig } from "@/components/features/nin/modification/ModificationForm";

export default function NinModificationPage() {
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [hasConsented, setHasConsented] = useState<boolean>(true); // default true while loading
  const [userFullName, setUserFullName] = useState<string>("");
  const [pricing, setPricing] = useState<Record<string, PricingConfig>>({
    CHANGE_OF_NAME: { price: 2500, isActive: true, label: "Change of Name" },
    CHANGE_OF_PHONE: { price: 2000, isActive: true, label: "Change of Phone Number" },
    CHANGE_OF_ADDRESS: { price: 2000, isActive: true, label: "Change of Address" },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successSubmission, setSuccessSubmission] = useState<{
    trackingId: string;
    type: string;
    amountPaid: number;
  } | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/nin/modification");
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.walletBalance || 0);
        if (data.pricing) setPricing(data.pricing);
        if (data.userFullName) setUserFullName(data.userFullName);
        setHasConsented(data.hasConsented);
      }
    } catch (err) {
      console.error("Failed to load initial NIN Modification data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleConsentAgreed = () => {
    setHasConsented(true);
    fetchInitialData();
  };

  const handleSubmissionSuccess = (result: {
    trackingId: string;
    type: string;
    amountPaid: number;
    newBalance: number;
  }) => {
    setWalletBalance(result.newBalance);
    setSuccessSubmission({
      trackingId: result.trackingId,
      type: result.type,
      amountPaid: result.amountPaid,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* Back Breadcrumb */}
      <Link 
        href="/dashboard/nin" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Services
      </Link>

      {/* Page Header (Matching Standard IPE Layout) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
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
            <h1 className="text-2xl font-black text-foreground tracking-tight">NIN Modification</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Official processing for Change of Name, Phone Number, and Address on your National Identity record.
            </p>
          </div>
        </div>

        {/* Action Button: Modification History */}
        <Link 
          href="/dashboard/nin/modification/history" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0 shadow-sm"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          <span>Modification History</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Success Banner upon Submission */}
      {successSubmission && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                <CheckCircle weight="bold" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Modification Request Successfully Submitted!</h3>
                <p className="text-xs opacity-90">
                  Your request is queued for processing. Tracking ID: <strong className="font-mono">{successSubmission.trackingId}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessSubmission(null)}
              className="text-xs font-bold opacity-75 hover:opacity-100 px-2 py-1 rounded-lg bg-emerald-500/20 cursor-pointer"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
            <Link
              href="/dashboard/nin/modification/history"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              Track Status in Modification History &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="h-8 w-8 animate-spin text-primary" weight="bold" />
          <p className="text-sm font-bold text-muted-foreground">Loading service status...</p>
        </div>
      ) : !hasConsented ? (
        /* Render ONLY Terms & Authorization Gate when consent is not yet given */
        <NinTermsModal
          isOpen={true}
          userFullName={userFullName}
          onAgreed={handleConsentAgreed}
        />
      ) : (
        /* Render Modification Form ONLY after consent is active */
        <ModificationForm
          walletBalance={walletBalance}
          pricing={pricing}
          onSuccess={handleSubmissionSuccess}
          onRequireConsent={() => setHasConsented(false)}
        />
      )}

    </div>
  );
}
