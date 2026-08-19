"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, Check, Sparkle, 
  IdentificationCard, IdentificationBadge, 
  ArrowLeft, CheckCircle, WarningCircle, X
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import BvnConfirmationModal from "@/components/features/bvn/BvnConfirmationModal";
import BvnResultModal, { BvnDemographicData } from "@/components/features/bvn/BvnResultModal";
import BvnHistorySection, { BvnHistoryItem } from "@/components/features/bvn/BvnHistorySection";

type SlipTier = "bvn_standard" | "bvn_premium";

interface SlipOption {
  id: SlipTier;
  label: string;
  badge: string;
  description: string;
  defaultPrice: number;
}

const BVN_SLIP_OPTIONS: SlipOption[] = [
  {
    id: "bvn_standard",
    label: "Standard BVN Slip",
    badge: "Official Layout",
    description: "Full A4 slip layout with complete demographic profile and verification barcodes.",
    defaultPrice: 700,
  },
  {
    id: "bvn_premium",
    label: "Premium BVN Card Slip",
    badge: "Card / Lamination Ready",
    description: "Compact wallet-size ID card format designed specifically for plastic lamination.",
    defaultPrice: 1000,
  },
];

export default function BvnSlipVerificationPage() {
  const [slipType, setSlipType] = useState<SlipTier>("bvn_standard");
  const [bvn, setBvn] = useState("");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNotice, setShowNotice] = useState(true);

  const [prices, setPrices] = useState<Record<string, number>>({
    BVN_STANDARD: 700,
    BVN_PREMIUM: 1000,
  });
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({
    bvn_standard: true,
    bvn_premium: true,
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

  // Fetch Pricing, Status, Wallet Balance, and 24-Hour History
  const fetchPageData = async () => {
    try {
      const [statusRes, walletRes, histRes] = await Promise.all([
        fetch("/api/bvn/status", { cache: "no-store" }),
        fetch("/api/user/wallet", { cache: "no-store" }).catch(() => fetch("/api/wallet")),
        fetch("/api/bvn/history", { cache: "no-store" }),
      ]);

      if (statusRes.ok) {
        const statusJson = await statusRes.json();
        if (statusJson.success && statusJson.pricing) {
          setPrices({
            BVN_STANDARD: statusJson.pricing.BVN_STANDARD?.price || 700,
            BVN_PREMIUM: statusJson.pricing.BVN_PREMIUM?.price || 1000,
          });
          setActiveMap({
            bvn_standard: statusJson.pricing.BVN_STANDARD?.isActive !== false,
            bvn_premium: statusJson.pricing.BVN_PREMIUM?.isActive !== false,
          });
        }
      }

      if (walletRes.ok) {
        const walletJson = await walletRes.json();
        if (walletJson.success) {
          const bal = typeof walletJson.balance === "number" 
            ? walletJson.balance 
            : (walletJson.wallet?.balance || walletJson.data?.balance || 0);
          setWalletBalance(Number(bal));
        }
      }

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
  const activeOption = BVN_SLIP_OPTIONS.find((o) => o.id === slipType) || BVN_SLIP_OPTIONS[0];
  const activeLabel = activeOption.label;
  const isValidBvn = /^\d{11}$/.test(bvn.trim());
  const isSelectedSlipAvailable = activeMap[slipType] !== false;
  const isFormValid = isValidBvn && consent1 && consent2 && isSelectedSlipAvailable;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidBvn) {
      setError("Please provide a valid 11-digit Bank Verification Number (BVN).");
      return;
    }
    if (!consent1 || !consent2) {
      setError("You must check all statutory declarations to proceed.");
      return;
    }
    if (!isSelectedSlipAvailable) {
      setError("The selected slip format is currently unavailable. Please choose another format.");
      return;
    }

    setError(null);
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
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link 
          href="/dashboard/bvn" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer w-fit"
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
          Back to BVN Services
        </Link>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl cursor-pointer w-fit"
        >
          Dashboard &rarr;
        </Link>
      </div>

      {/* Header (No Balance Display) */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
          <Image 
            src="/nibss.png" 
            width={44} 
            height={44} 
            alt="NIBSS Logo" 
            className="object-contain" 
            priority 
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <ShieldCheck weight="bold" className="h-3 w-3" />
            Nigeria Inter-Bank Settlement System
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            BVN Verification Slips
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
            Generate standard and premium BVN verification slips with instant lookup.
          </p>
        </div>
      </div>

      {/* Statutory Compliance Notice Banner */}
      {showNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-950 dark:text-emerald-200 relative animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0 mt-0.5">
                <ShieldCheck size={20} weight="bold" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-foreground">
                  Statutory Compliance Notice
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground font-medium">
                  This service is designed for users who need to confirm their BVN details or obtain a slip-like card of their BVN for official use. Please do not search BVN details of others without express permission or authorization. Unauthorized lookup violates data protection regulation.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNotice(false)}
              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer shrink-0 border border-emerald-500/30"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleProceedToConfirm} className="space-y-6">
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
            <WarningCircle weight="fill" size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
            <span>11-Digit Bank Verification Number (BVN)</span>
            <span className="font-mono text-[11px]">{bvn.length}/11</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={bvn}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setBvn(val);
                if (error) setError(null);
              }}
              placeholder="Enter 11-digit BVN (e.g. 22212345678)"
              className="w-full h-12 bg-card border border-border text-base font-mono font-bold pl-4 pr-10 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-foreground"
            />
            {bvn.length === 11 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle size={20} weight="fill" />
              </div>
            )}
          </div>
        </div>

        {/* Compact Slip Format Cards */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Slip Format
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {BVN_SLIP_OPTIONS.map((option) => {
              const isSelected = slipType === option.id;
              const isAvailable = activeMap[option.id] !== false;
              const price = option.id === "bvn_premium" ? prices.BVN_PREMIUM : prices.BVN_STANDARD;

              return (
                <div
                  key={option.id}
                  onClick={() => {
                    if (isAvailable) setSlipType(option.id);
                  }}
                  className={`p-4 rounded-2xl border-2 flex flex-col justify-between space-y-3 transition-all ${
                    !isAvailable
                      ? "opacity-50 bg-secondary/20 border-border/60 cursor-not-allowed"
                      : isSelected
                      ? "bg-secondary/70 border-emerald-600 shadow-sm cursor-pointer ring-1 ring-emerald-600/30"
                      : "bg-card border-border hover:bg-secondary/40 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}>
                        {option.id === "bvn_premium" ? (
                          <IdentificationBadge size={20} weight="bold" />
                        ) : (
                          <IdentificationCard size={20} weight="bold" />
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {option.badge}
                        </span>
                        <h3 className="text-sm font-bold text-foreground">{option.label}</h3>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-foreground">₦{price.toLocaleString()}</span>
                      <p className="text-[10px] text-muted-foreground">Instant</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-snug">
                    {option.description}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Check size={13} className="text-emerald-600" weight="bold" /> High-Resolution PDF
                    </span>
                    <span className={`text-[11px] font-bold ${isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {isSelected ? "Selected" : "Select Format"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statutory Consent Checkboxes */}
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/60 space-y-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Statutory Declaration &amp; Consent
          </label>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => {
                setConsent1(e.target.checked);
                if (error) setError(null);
              }}
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
              onChange={(e) => {
                setConsent2(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-1 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I consent to the statutory retrieval of this record for slip generation.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-1">
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

      {/* 24-Hour Print History at the Bottom (Matching NIN layout) */}
      <BvnHistorySection history={history} title="24-Hour BVN Print History" />

      {/* Confirmation Modal */}
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

      {/* Result Modal */}
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
