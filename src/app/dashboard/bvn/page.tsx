"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  CreditCard, ShieldCheck, Check, Sparkle, 
  Info, IdentificationCard, IdentificationBadge, 
  Wallet, ArrowRight, LockKey, SealCheck
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import BvnConfirmationModal from "@/components/features/bvn/BvnConfirmationModal";
import BvnResultModal, { BvnDemographicData } from "@/components/features/bvn/BvnResultModal";
import BvnHistorySection, { BvnHistoryItem } from "@/components/features/bvn/BvnHistorySection";

type SlipTier = "bvn_standard" | "bvn_premium";

export default function BvnVerificationPage() {
  const [slipType, setSlipType] = useState<SlipTier>("bvn_standard");
  const [bvn, setBvn] = useState("");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);

  const [prices, setPrices] = useState<Record<string, number>>({
    BVN_STANDARD: 700,
    BVN_PREMIUM: 1000,
  });
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [history, setHistory] = useState<BvnHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultModalState, setResultModalState] = useState<{
    isOpen: boolean;
    status: "loading" | "success" | "error";
    pdfBase64?: string;
    pdfUrl?: string;
    userData?: BvnDemographicData;
    fullName?: string;
    errorMsg?: string;
  }>({
    isOpen: false,
    status: "loading",
  });

  // Fetch Pricing, Wallet Balance, and 24-Hour History
  const fetchPageData = async () => {
    try {
      // 1. Fetch live pricing
      const priceRes = await fetch("/api/pricing");
      if (priceRes.ok) {
        const priceJson = await priceRes.json();
        if (priceJson.success && priceJson.data) {
          setPrices({
            BVN_STANDARD: priceJson.data.BVN_STANDARD || 700,
            BVN_PREMIUM: priceJson.data.BVN_PREMIUM || 1000,
          });
        }
      }

      // 2. Fetch wallet balance
      const walletRes = await fetch("/api/wallet");
      if (walletRes.ok) {
        const walletJson = await walletRes.json();
        if (walletJson.success && walletJson.data) {
          setWalletBalance(Number(walletJson.data.balance || 0));
        }
      }

      // 3. Fetch 24h history
      const histRes = await fetch("/api/bvn/history");
      if (histRes.ok) {
        const histJson = await histRes.json();
        if (histJson.success && histJson.history) {
          setHistory(histJson.history);
        }
      }
    } catch (err) {
      console.error("Failed to load BVN page data:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  const activePrice = slipType === "bvn_premium" ? prices.BVN_PREMIUM : prices.BVN_STANDARD;
  const activeLabel = slipType === "bvn_premium" ? "BVN Premium Card Slip" : "BVN Standard Slip";
  const isValidBvn = /^\d{11}$/.test(bvn.trim());
  const isFormValid = isValidBvn && consent1 && consent2;

  // Handle Slip Generation Submission
  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsConfirmOpen(true);
  };

  const handleExecuteVerification = async () => {
    setIsGenerating(true);
    setIsConfirmOpen(false);

    setResultModalState({
      isOpen: true,
      status: "loading",
    });

    try {
      const res = await fetch("/api/bvn/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bvn: bvn.trim(),
          slipType,
          attestationsAccepted: consent1 && consent2,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setResultModalState({
          isOpen: true,
          status: "error",
          errorMsg: data.message || "Could not generate BVN verification slip. Please check the BVN and try again.",
        });
        return;
      }

      // Success
      setResultModalState({
        isOpen: true,
        status: "success",
        pdfBase64: data.pdfBase64,
        pdfUrl: data.pdfUrl,
        userData: data.userData,
        fullName: data.fullName,
      });

      // Clear input and refresh balance + history
      setBvn("");
      setConsent1(false);
      setConsent2(false);
      fetchPageData();

    } catch (err: any) {
      setResultModalState({
        isOpen: true,
        status: "error",
        errorMsg: err.message || "A network or server error occurred while processing your request.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      
      {/* 1. Header & Live Gateway Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white p-2 border border-border shadow-sm flex items-center justify-center shrink-0">
            <Image
              src="/nibss.png"
              alt="NIBSS"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight">
                BVN Verification Slips
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                NIBSS Gateway
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Instant generation of official Bank Verification Number (BVN) slips with QR authentication.
            </p>
          </div>
        </div>

        {/* Wallet Balance Pill */}
        <div className="flex items-center gap-3 self-start md:self-auto bg-card border border-border px-4 py-2.5 rounded-2xl shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Wallet size={18} weight="bold" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Wallet Balance</span>
            <p className="text-sm font-black text-foreground">₦{walletBalance.toLocaleString()}</p>
          </div>
          <Link
            href="/dashboard/wallet"
            className="ml-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            Fund <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      </div>

      {/* 2. STATUTORY & COMPLIANCE INFORMATION BANNER */}
      <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200 space-y-2 relative overflow-hidden">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
            <ShieldCheck size={20} weight="bold" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground">
              Official Retrieval &amp; Statutory Compliance Notice
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground font-medium">
              This service is designed for users who need to retrieve or confirm their BVN details or obtain an official slip-like card of their BVN. <strong className="text-foreground font-bold">Please do not submit BVN details of others without express authorization.</strong> Unauthorized lookups violate data protection regulations.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SLIP TIER SELECTION CARDS */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Step 1: Choose Your Slip Format
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* TIER 1: STANDARD SLIP */}
          <div
            onClick={() => setSlipType("bvn_standard")}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
              slipType === "bvn_standard"
                ? "border-emerald-600 bg-emerald-500/5 shadow-md shadow-emerald-500/5 ring-2 ring-emerald-500/20"
                : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  slipType === "bvn_standard"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-secondary text-muted-foreground border-border"
                }`}>
                  <IdentificationCard size={22} weight="bold" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Official Document
                  </span>
                  <h3 className="text-base font-black text-foreground">Standard BVN Slip</h3>
                </div>
              </div>

              {/* Price Badge */}
              <div className="text-right">
                <span className="text-lg font-black text-foreground">₦{prices.BVN_STANDARD.toLocaleString()}</span>
                <p className="text-[10px] text-muted-foreground">Instant Download</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Full official A4 slip layout containing complete demographic profile, authenticated BVN watermark, and NIBSS verification barcodes.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Check size={14} className="text-emerald-600" weight="bold" /> High-Resolution PDF
              </span>
              <span className={`text-xs font-bold ${slipType === "bvn_standard" ? "text-emerald-600" : "text-muted-foreground"}`}>
                {slipType === "bvn_standard" ? "Selected" : "Select Tier"}
              </span>
            </div>
          </div>

          {/* TIER 2: PREMIUM CARD SLIP */}
          <div
            onClick={() => setSlipType("bvn_premium")}
            className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative ${
              slipType === "bvn_premium"
                ? "border-emerald-600 bg-emerald-500/5 shadow-md shadow-emerald-500/5 ring-2 ring-emerald-500/20"
                : "border-border bg-card hover:border-border/80 hover:bg-secondary/40"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                  slipType === "bvn_premium"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-secondary text-muted-foreground border-border"
                }`}>
                  <IdentificationBadge size={22} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Card / Lamination Ready
                    </span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      POPULAR
                    </span>
                  </div>
                  <h3 className="text-base font-black text-foreground">Premium BVN Card Slip</h3>
                </div>
              </div>

              {/* Price Badge */}
              <div className="text-right">
                <span className="text-lg font-black text-foreground">₦{prices.BVN_PREMIUM.toLocaleString()}</span>
                <p className="text-[10px] text-muted-foreground">Instant Download</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Compact ID card format designed specifically for plastic printing and lamination with crisp QR security code and portrait alignment.
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Check size={14} className="text-emerald-600" weight="bold" /> Wallet Sized Form Factor
              </span>
              <span className={`text-xs font-bold ${slipType === "bvn_premium" ? "text-emerald-600" : "text-muted-foreground"}`}>
                {slipType === "bvn_premium" ? "Selected" : "Select Tier"}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. BVN INPUT & CONSENT FORM */}
      <form onSubmit={handleProceedToConfirm} className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Step 2: Enter 11-Digit BVN
            </label>
            <span className="text-[11px] font-mono font-bold text-muted-foreground">
              {bvn.length}/11 digits
            </span>
          </div>

          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={bvn}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, "");
                setBvn(numericOnly);
              }}
              placeholder="e.g. 22212345678"
              className="w-full h-14 pl-4 pr-12 rounded-2xl bg-secondary/40 border-2 border-border text-lg font-mono font-bold tracking-widest text-foreground focus:outline-none focus:border-emerald-600 focus:bg-background transition-all"
            />
            {isValidBvn && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <Check size={14} weight="bold" />
              </div>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Enter the 11-digit Bank Verification Number linked to your registered Nigerian bank accounts.
          </p>
        </div>

        {/* STATUTORY CONSENT CHECKBOXES */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Step 3: Statutory Declaration &amp; Consent
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => setConsent1(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I certify and declare that I am the authorized owner of this BVN or have obtained explicit legal authorization from the BVN holder.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent2}
              onChange={(e) => setConsent2(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I consent to the statutory retrieval and verification of this record from NIBSS for official slip generation.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LockKey size={16} className="text-emerald-600" weight="bold" />
            <span>256-Bit Encrypted Statutory Request</span>
          </div>

          <Button
            type="submit"
            disabled={!isFormValid || isGenerating}
            className="w-full sm:w-auto h-12 px-8 font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkle size={18} weight="fill" />
            <span>Verify &amp; Generate ({activeLabel} - ₦{activePrice.toLocaleString()})</span>
          </Button>
        </div>

      </form>

      {/* 5. 24-HOUR PRINT HISTORY */}
      <BvnHistorySection history={history} />

      {/* CONFIRMATION MODAL */}
      <BvnConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteVerification}
        isLoading={isGenerating}
        bvn={bvn}
        slipType={slipType}
        slipLabel={activeLabel}
        price={activePrice}
        walletBalance={walletBalance}
      />

      {/* RESULT MODAL */}
      <BvnResultModal
        isOpen={resultModalState.isOpen}
        status={resultModalState.status}
        bvn={bvn}
        slipLabel={activeLabel}
        pdfBase64={resultModalState.pdfBase64}
        pdfUrl={resultModalState.pdfUrl}
        userData={resultModalState.userData}
        fullName={resultModalState.fullName}
        errorMsg={resultModalState.errorMsg}
        onClose={() => setResultModalState((prev) => ({ ...prev, isOpen: false }))}
      />

    </div>
  );
}
