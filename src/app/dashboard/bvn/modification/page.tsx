"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight,
  ShieldCheck, 
  ListDashes, 
  Spinner,
  CheckCircle
} from "@phosphor-icons/react";
import BvnModificationForm from "@/components/features/bvn/modification/BvnModificationForm";
import { BvnGuidelinesModal } from "@/components/features/bvn/modification/BvnGuidelinesModal";

export default function BvnModificationPage() {
  const router = useRouter();
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [pricing, setPricing] = useState<Record<string, number>>({
    BVN_MOD_NAME: 3000,
    BVN_MOD_PHONE: 2500,
    BVN_MOD_DOB: 15000,
    BVN_MOD_NAME_PHONE: 5000,
    BVN_MOD_DOB_PHONE: 17000,
    BVN_MOD_NAME_DOB: 17500,
    BVN_MOD_ALL: 19500,
    BVN_MOD_DOB_SURCHARGE: 5000,
  });
  const [originalPricing, setOriginalPricing] = useState<Record<string, number>>({});
  const [hasDiscount, setHasDiscount] = useState<boolean>(false);
  const [discountBadge, setDiscountBadge] = useState<string | undefined>(undefined);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [dobOver5YearsAllowed, setDobOver5YearsAllowed] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [successSubmission, setSuccessSubmission] = useState<{
    trackingId: string;
    amountPaid: number;
  } | null>(null);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bvn/modification", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.pricing) setPricing(data.pricing);
          if (data.originalPricing) setOriginalPricing(data.originalPricing);
          if (data.hasDiscount !== undefined) setHasDiscount(Boolean(data.hasDiscount));
          if (data.discountBadge) setDiscountBadge(data.discountBadge);
          if (data.walletBalance !== undefined) setWalletBalance(Number(data.walletBalance) || 0);
          if (data.dobOver5YearsAllowed !== undefined) setDobOver5YearsAllowed(Boolean(data.dobOver5YearsAllowed));
        }
      }
    } catch (err) {
      console.error("Failed to load BVN modification initial data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSubmissionSuccess = (result: any) => {
    setSuccessSubmission({
      trackingId: result.trackingId || "N/A",
      amountPaid: result.amountPaid || 0,
    });
    fetchInitialData();
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Auto redirect to history after 2.5s
    setTimeout(() => {
      router.push("/dashboard/bvn/modification/history");
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* Short & Sleek Guidelines & Rules Modal */}
      <BvnGuidelinesModal
        isOpen={showGuidelines}
        onClose={() => setShowGuidelines(false)}
      />

      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/bvn" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" /> Back to BVN Services
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nibss.png" 
              alt="NIBSS BVN Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              Nigeria Inter-Bank Settlement System (NIBSS)
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">BVN Record Modification</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Official processing for Change of Name, Phone Number, and Date of Birth on your Bank Verification Number.
            </p>
          </div>
        </div>

        {/* Action Button: Modification History */}
        <Link 
          href="/dashboard/bvn/modification/history" 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0 shadow-sm cursor-pointer"
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          <span>Modification History</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Success Confirmation Banner with Auto Redirect */}
      {successSubmission && (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                <CheckCircle weight="bold" className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">BVN Modification Successfully Submitted!</h3>
                <p className="text-xs opacity-90">
                  Your request is queued for processing. Tracking ID: <strong className="font-mono">{successSubmission.trackingId}</strong>
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  Redirecting you to Modification History...
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
            <Link
              href="/dashboard/bvn/modification/history"
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              Track Status in Modification History &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Spinner className="h-8 w-8 animate-spin text-primary" weight="bold" />
          <p className="text-sm font-bold text-muted-foreground">Loading BVN modification service...</p>
        </div>
      ) : (
        <BvnModificationForm 
          pricing={pricing} 
          originalPricing={originalPricing}
          hasDiscount={hasDiscount}
          discountBadge={discountBadge}
          walletBalance={walletBalance} 
          dobOver5YearsAllowed={dobOver5YearsAllowed}
          onSuccess={handleSubmissionSuccess} 
        />
      )}
    </div>
  );
}
