"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, Check, Sparkle, 
  Eye, ArrowLeft, CheckCircle, WarningCircle, X,
  FileText
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
  img: string;
  defaultPrice: number;
}

const BVN_SLIP_OPTIONS: SlipOption[] = [
  {
    id: "bvn_standard",
    label: "Standard BVN Slip",
    badge: "Official Layout",
    img: "/examples/bvn_regular.png",
    defaultPrice: 700,
  },
  {
    id: "bvn_premium",
    label: "Premium BVN Card Slip",
    badge: "Card / Lamination Ready",
    img: "/examples/bvn_premium.png",
    defaultPrice: 1000,
  },
];

export default function BvnSlipVerificationPage() {
  const [mounted, setMounted] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);
  const [slipType, setSlipType] = useState<SlipTier>("bvn_standard");
  const [bvn, setBvn] = useState("");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lightbox State for "View Example"
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; label: string }>({
    isOpen: false,
    src: "",
    label: "",
  });

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({});
  const [isPricingLoading, setIsPricingLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [history, setHistory] = useState<BvnHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  // Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [resultModalState, setResultModalState] = useState<{
    isOpen: boolean;
    status: "loading" | "success" | "error";
    pdfBase64?: string;
    pdfUrl?: string;
    userData?: BvnDemographicData;
    fullName?: string;
    photo?: string;
    errorMsg?: string;
  }>({
    isOpen: false,
    status: "loading",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAnyModalOpen = showIntroModal || lightbox.isOpen || isConfirmOpen || resultModalState.isOpen || isDetailsModalOpen;
  const savedScrollYRef = useRef<number>(0);

  // Unscrolled top alignment for mobile status bar sync + zero bottom cut-off
  useEffect(() => {
    if (isAnyModalOpen) {
      if (window.scrollY > 0) {
        savedScrollYRef.current = window.scrollY;
      }
      document.body.style.overflow = "hidden";
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });

      return () => {
        document.body.style.overflow = "";
        if (savedScrollYRef.current > 0) {
          window.scrollTo({ top: savedScrollYRef.current, left: 0, behavior: "instant" });
        }
      };
    }
  }, [isAnyModalOpen]);

  // Fetch Pricing, Status, Wallet Balance, and 24-Hour History
  const fetchPageData = async () => {
    try {
      const [statusRes, walletRes, histRes] = await Promise.all([
        fetch("/api/bvn/status", { cache: "no-store" }),
        fetch("/api/user/wallet", { cache: "no-store" }).catch(() => fetch("/api/wallet")),
        fetch("/api/bvn/history", { cache: "no-store" }),
      ]);

      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.pricing) {
          setPrices({
            BVN_STANDARD: data.pricing.BVN_STANDARD?.price ?? 700,
            BVN_PREMIUM: data.pricing.BVN_PREMIUM?.price ?? 1000,
          });
          setActiveMap({
            bvn_standard: data.pricing.BVN_STANDARD?.isActive !== false,
            bvn_premium: data.pricing.BVN_PREMIUM?.isActive !== false,
          });
        }
      }

      if (walletRes && walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.success && typeof wData.balance === "number") {
          setWalletBalance(wData.balance);
        }
      }

      if (histRes && histRes.ok) {
        const hData = await histRes.json();
        if (hData.success && Array.isArray(hData.history)) {
          setHistory(hData.history);
        }
      }
    } catch (err) {
      console.error("Error loading BVN page data:", err);
    } finally {
      setIsHistoryLoading(false);
      setIsPricingLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, []);

  // Auto-clear validation error as soon as BVN reaches 11 digits
  useEffect(() => {
    if (bvn.length === 11 && error) {
      setError(null);
    }
  }, [bvn, error]);

  const activeOption = BVN_SLIP_OPTIONS.find((opt) => opt.id === slipType) || BVN_SLIP_OPTIONS[0];
  const activePrice = prices[slipType.toUpperCase()] ?? activeOption.defaultPrice;
  const isSelectedSlipAvailable = activeMap[slipType] ?? true;

  const activeLabel = activeOption.label;

  const isFormValid = bvn.trim().length === 11 && consent1 && consent2 && isSelectedSlipAvailable;

  const handleProceedToConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (bvn.trim().length !== 11) {
      setError("Please enter a valid 11-digit BVN.");
      return;
    }

    if (!consent1 || !consent2) {
      setError("You must accept both statutory attestations to proceed.");
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
        photo: data.photo,
      });

      // Refetch wallet and history
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
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative animate-in fade-in duration-300">
      
      {/* Intro Modal (Blocking Popup until "I Understand" is clicked, matching Tax ID) */}
      {mounted && showIntroModal && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowIntroModal(false)}
        >
          <div 
            className="relative w-full max-w-lg bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 md:p-8 animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setShowIntroModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X weight="bold" className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-secondary border border-border flex items-center justify-center p-2 shrink-0">
                <Image src="/nibss.png" alt="NIBSS Logo" width={40} height={40} className="object-contain" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Statutory Notice
                </span>
                <h2 className="text-xl font-black text-foreground">Compliance Verification</h2>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                This service is designed for users who need to confirm their BVN details or obtain a slip-like card of their BVN for official use.
              </p>
              <p>
                Please do not search BVN details of others without express permission or authorization. Unauthorized lookup violates data protection regulation.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => setShowIntroModal(false)}
              className="mt-7 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Top Navigation (Only Back to BVN Services) */}
      <div>
        <Link 
          href="/dashboard/bvn" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to BVN Services
        </Link>
      </div>

      {/* Header (Clean, No Balance Display) */}
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

      {/* Verification Form */}
      <form onSubmit={handleProceedToConfirm} className="space-y-6">
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
            <WarningCircle weight="fill" size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* BVN Input */}
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

        {/* Sleek Slip Format Selection (Matching NIN slips layout) */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Slip Format
          </label>

          <div className="space-y-2">
            {BVN_SLIP_OPTIONS.map((option) => {
              const isSelected = slipType === option.id;
              const isAvailable = activeMap[option.id] !== false;
              const rawPrice = option.id === "bvn_premium" ? prices.BVN_PREMIUM : prices.BVN_STANDARD;
              const price = rawPrice ?? option.defaultPrice ?? (option.id === "bvn_premium" ? 1000 : 700);

              return (
                <div
                  key={option.id}
                  onClick={() => {
                    if (isAvailable) setSlipType(option.id);
                  }}
                  className={`p-3.5 sm:p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    !isAvailable
                      ? "opacity-50 bg-secondary/20 border-border/60 cursor-not-allowed"
                      : isSelected
                      ? "bg-secondary/70 border-emerald-600 shadow-sm cursor-pointer ring-1 ring-emerald-600/30"
                      : "bg-card border-border hover:bg-secondary/40 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <input 
                      type="radio" 
                      name="slipType" 
                      disabled={!isAvailable}
                      checked={isSelected} 
                      onChange={() => {
                        if (isAvailable) setSlipType(option.id);
                      }} 
                      className="text-emerald-600 focus:ring-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                    />
                    
                    <div className="flex items-center flex-wrap gap-2.5">
                      <span className={`font-bold text-sm ${!isAvailable ? "text-muted-foreground" : "text-foreground"}`}>
                        {option.label}
                      </span>
                      
                      {/* Clickable Eye Icon + "View Example" Button */}
                      <button 
                        type="button" 
                        onClick={(e) => { 
                           e.stopPropagation(); 
                           setLightbox({ isOpen: true, src: option.img, label: option.label }); 
                        }} 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-emerald-600 bg-secondary hover:bg-secondary/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title={`View ${option.label} Example`}
                      >
                        <Eye size={14} weight="bold" />
                        <span>View Example</span>
                      </button>

                      {!isAvailable && (
                        <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`font-black text-sm shrink-0 pl-2 ${!isAvailable ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {isPricingLoading ? (
                      <span className="inline-block h-4 w-12 bg-secondary/80 animate-pulse rounded-md"></span>
                    ) : (
                      `₦${Number(price || option.defaultPrice || 700).toLocaleString()}`
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statutory Disclaimers */}
        <div className="bg-secondary/30 border border-border rounded-xl p-3.5 sm:p-4 space-y-2.5">
          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent1}
              onChange={(e) => {
                setConsent1(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border cursor-pointer"
            />
            <span>I declare that I am the owner of this BVN or have lawful consent to query this record.</span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consent2}
              onChange={(e) => {
                setConsent2(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border cursor-pointer"
            />
            <span>I consent to the statutory retrieval of this record for slip generation.</span>
          </label>
        </div>

        {/* Clean Submit Button */}
        <Button
          type="submit"
          disabled={isPricingLoading || !isFormValid || isGenerating}
          className="w-full h-12 font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Sparkle size={18} weight="fill" />
          {isPricingLoading ? (
            <span>Loading pricing...</span>
          ) : (
            <span>Verify &amp; Generate</span>
          )}
        </Button>

      </form>

      {/* 72-Hour Print History at the Bottom (Matching NIN layout) */}
      <BvnHistorySection history={history} title="72-Hour BVN Print History" isLoading={isHistoryLoading} onDetailsModalToggle={setIsDetailsModalOpen} />

      {/* Confirmation & Insufficient Balance Modal (with Specimen Preview) */}
      <BvnConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleExecuteVerification}
        isLoading={isGenerating}
        bvn={bvn}
        slipType={slipType}
        slipLabel={activeLabel}
        slipImage={activeOption.img}
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
        photo={resultModalState.photo}
        errorMsg={resultModalState.errorMsg}
        onClose={() => setResultModalState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Lightbox Specimen Preview Modal */}
      {mounted && lightbox.isOpen && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div className="relative w-full max-w-lg flex flex-col items-center bg-card text-card-foreground border border-border rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-card border-b border-border px-5 py-3.5 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{lightbox.label} Example Specimen</span>
              <button 
                type="button" 
                onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <div className="relative w-full h-80 sm:h-96 bg-card overflow-hidden p-3 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image 
                  src={lightbox.src} 
                  alt={lightbox.label} 
                  fill 
                  className="object-contain" 
                  priority 
                />
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
