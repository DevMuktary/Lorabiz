"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Clock, 
  Wallet, 
  PlusCircle, 
  CheckCircle, 
  ListDashes, 
  FileText,
  Sparkle,
  WarningCircle
} from "@phosphor-icons/react";
import { NinTermsModal } from "@/components/features/nin/modification/NinTermsModal";
import { ModificationForm, PricingConfig } from "@/components/features/nin/modification/ModificationForm";
import { ModificationHistory } from "@/components/features/nin/modification/ModificationHistory";

export default function NinModificationPage() {
  const [activeTab, setActiveTab] = useState<"form" | "history">("form");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [hasConsented, setHasConsented] = useState<boolean>(true); // default true while loading
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
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
        setHasConsented(data.hasConsented);
        if (!data.hasConsented) {
          setShowTermsModal(true);
        }
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
    setShowTermsModal(false);
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
      
      {/* Terms of Agreement & Digital Signature Gate */}
      <NinTermsModal
        isOpen={showTermsModal}
        userFullName={userFullName}
        onAgreed={handleConsentAgreed}
      />

      {/* Back Link & Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/nin" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" /> Back to NIN Services
        </Link>

        {/* Live Wallet Balance Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold shadow-sm">
          <Wallet weight="duotone" className="h-4 w-4 text-emerald-500" />
          <span className="text-muted-foreground">Wallet:</span>
          <span className="text-foreground font-mono">₦{walletBalance.toLocaleString()}</span>
          <Link
            href="/dashboard/wallet"
            className="text-primary hover:underline text-[11px] font-black ml-1 flex items-center gap-0.5"
          >
            <PlusCircle weight="bold" className="h-3 w-3" /> Fund
          </Link>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nimc.png" 
              alt="NIMC Logo" 
              width={42} 
              height={42} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              National Identity Management Commission (NIMC)
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">NIN Modification</h1>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Official processing for Change of Name, Phone Number, and Address on your National Identity record.
            </p>
          </div>
        </div>

        {/* Turnaround Badge */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 p-3 rounded-2xl bg-card border border-border shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Clock weight="bold" className="h-4 w-4 text-emerald-500" />
            <span>Turnaround Time</span>
          </div>
          <span className="text-xs text-muted-foreground font-medium">1–48 Business Hours</span>
        </div>
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
              className="text-xs font-bold opacity-75 hover:opacity-100 px-2 py-1 rounded-lg bg-emerald-500/20"
            >
              Dismiss
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={() => {
                setSuccessSubmission(null);
                setActiveTab("history");
              }}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <ListDashes weight="bold" className="h-4 w-4" />
              Track Status in History &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "form"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          New Modification Request
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "history"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
          }`}
        >
          <ListDashes weight="bold" className="h-4 w-4" />
          My Modification History
        </button>
      </div>

      {/* Main Content Body */}
      {activeTab === "form" ? (
        <ModificationForm
          walletBalance={walletBalance}
          pricing={pricing}
          onSuccess={handleSubmissionSuccess}
          onRequireConsent={() => setShowTermsModal(true)}
        />
      ) : (
        <ModificationHistory />
      )}

    </div>
  );
}
