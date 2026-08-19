"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, WarningCircle, Eye, X, Check,
  Sparkle, ShieldCheck, CheckCircle, Wrench, DeviceMobile
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NinResultModal, { DemographicData } from "@/components/features/nin/slips/NinResultModal";
import NinHistorySection, { SlipHistoryItem } from "@/components/features/nin/slips/NinHistorySection";
import SlipConfirmationModal from "@/components/features/nin/slips/SlipConfirmationModal";

interface SlipOption {
  id: "nin_basic" | "nin_regular" | "nin_standard" | "nin_premium" | "nin_vnin";
  label: string;
  img: string;
  defaultPrice: number;
}

// User-specified exact ordering:
// 1. Basic Slip (₦400)
// 2. Regular Slip (₦500)
// 3. Standard Slip (₦700)
// 4. Premium Slip (₦1,000)
// 5. VNIN Slip (₦500) — at the very bottom
const NIN_SLIP_OPTIONS: SlipOption[] = [
  { 
    id: "nin_basic", 
    label: "Basic Slip", 
    img: "/examples/nin_basic.png",
    defaultPrice: 400 
  },
  { 
    id: "nin_regular", 
    label: "Regular Slip", 
    img: "/examples/nin_regular_example.png",
    defaultPrice: 500 
  },
  { 
    id: "nin_standard", 
    label: "Standard Slip", 
    img: "/examples/nin_standard_example.png",
    defaultPrice: 700 
  },
  { 
    id: "nin_premium", 
    label: "Premium Slip", 
    img: "/examples/nin_premium_example.png",
    defaultPrice: 1000 
  },
  { 
    id: "nin_vnin", 
    label: "VNIN Slip", 
    img: "/examples/nin_vnin.png",
    defaultPrice: 500 
  },
];

export default function NinByNinPage() {
  const [nin, setNin] = useState("");
  const [slipType, setSlipType] = useState<"nin_basic" | "nin_regular" | "nin_standard" | "nin_premium" | "nin_vnin">("nin_premium");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  const [statusState, setStatusState] = useState<{
    loading: boolean;
    availableSlips: string[];
    prices: Record<string, number>;
    activeMap: Record<string, boolean>;
  }>({
    loading: true,
    availableSlips: ["nin_basic", "nin_regular", "nin_standard", "nin_premium", "nin_vnin"],
    prices: {
      nin_basic: 400,
      nin_regular: 500,
      nin_standard: 700,
      nin_premium: 1000,
      nin_vnin: 500,
    },
    activeMap: {
      nin_basic: true,
      nin_regular: true,
      nin_standard: true,
      nin_premium: true,
      nin_vnin: true,
    },
  });

  const [attestation1, setAttestation1] = useState(false);
  const [attestation2, setAttestation2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; label: string }>({
    isOpen: false, src: "", label: ""
  });

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    status: "loading" | "success" | "error";
    pdfBase64?: string;
    pdfUrl?: string;
    identifier?: string;
    searchType?: "NIN" | "PHONE";
    slipLabel?: string;
    userData?: DemographicData;
    fullName?: string;
    photo?: string;
    errorMsg?: string;
  }>({ isOpen: false, status: "loading" });

  const [history, setHistory] = useState<SlipHistoryItem[]>([]);

  const loadData = async () => {
    try {
      const [statusRes, historyRes, walletRes] = await Promise.all([
        fetch("/api/nin/slips/status", { cache: "no-store" }),
        fetch("/api/nin/slips/history?searchType=NIN", { cache: "no-store" }),
        fetch("/api/user/wallet", { cache: "no-store" }),
      ]);

      const statusData = await statusRes.json();
      const historyData = await historyRes.json();
      const walletData = await walletRes.json();

      if (walletData.success) {
        setWalletBalance(typeof walletData.balance === "number" ? walletData.balance : (walletData.wallet?.balance || 0));
      }

      if (statusData.success && statusData.status) {
        const pMap = statusData.pricing || {};
        const availableFromRouter = statusData.status.availableNINSlips || ["nin_basic", "nin_regular", "nin_standard", "nin_premium", "nin_vnin"];

        const activeMap: Record<string, boolean> = {
          nin_basic: (pMap.NIN_BASIC?.isActive !== false) && availableFromRouter.includes("nin_basic"),
          nin_regular: (pMap.NIN_REGULAR?.isActive !== false) && availableFromRouter.includes("nin_regular"),
          nin_standard: (pMap.NIN_STANDARD?.isActive !== false) && availableFromRouter.includes("nin_standard"),
          nin_premium: (pMap.NIN_PREMIUM?.isActive !== false) && availableFromRouter.includes("nin_premium"),
          nin_vnin: (pMap.NIN_VNIN?.isActive !== false) && availableFromRouter.includes("nin_vnin"),
        };

        setStatusState({
          loading: false,
          availableSlips: availableFromRouter,
          prices: {
            nin_basic: pMap.NIN_BASIC?.price || 400,
            nin_regular: pMap.NIN_REGULAR?.price || 500,
            nin_standard: pMap.NIN_STANDARD?.price || 700,
            nin_premium: pMap.NIN_PREMIUM?.price || 1000,
            nin_vnin: pMap.NIN_VNIN?.price || 500,
          },
          activeMap,
        });

        // Ensure selected slip is active, otherwise switch to first active
        if (!activeMap[slipType]) {
          const firstActive = NIN_SLIP_OPTIONS.find(o => activeMap[o.id]);
          if (firstActive) setSlipType(firstActive.id);
        }
      } else {
        setStatusState(prev => ({ ...prev, loading: false }));
      }

      if (historyData.success && historyData.history) {
        setHistory(historyData.history);
      }
    } catch (err) {
      console.error("Failed to load initial NIN status:", err);
      setStatusState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(nin.trim())) {
      setError("Please provide a valid 11-digit NIN.");
      return;
    }
    if (!attestation1 || !attestation2) {
      setError("You must check all statutory attestations to proceed.");
      return;
    }
    if (!statusState.activeMap[slipType]) {
      setError("The selected slip format is currently unavailable. Please choose another slip format.");
      return;
    }

    setError(null);
    setIsConfirmOpen(true);
  };

  const executeSlipGeneration = async () => {
    setIsConfirmOpen(false);
    setIsGenerating(true);

    const selectedOption = NIN_SLIP_OPTIONS.find(o => o.id === slipType);

    setResultModal({
      isOpen: true,
      status: "loading",
      identifier: nin.trim(),
      searchType: "NIN",
      slipLabel: selectedOption?.label
    });

    try {
      const res = await fetch("/api/nin/slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: nin.trim(),
          searchType: "NIN",
          slipType,
          attestationsAccepted: attestation1 && attestation2
        })
      });

      const data = await res.json();
      setIsGenerating(false);

      if (!res.ok || !data.success || !data.pdfBase64) {
        setResultModal({
          isOpen: true,
          status: "error",
          errorMsg: data.message || "Failed to generate NIN slip. Please verify your NIN and try again."
        });
        return;
      }

      setResultModal({
        isOpen: true,
        status: "success",
        pdfBase64: data.pdfBase64,
        pdfUrl: data.pdfUrl,
        identifier: nin.trim(),
        searchType: "NIN",
        slipLabel: selectedOption?.label,
        userData: data.userData,
        fullName: data.fullName,
        photo: data.photo
      });

      loadData();

    } catch (err: any) {
      setIsGenerating(false);
      setResultModal({
        isOpen: true,
        status: "error",
        errorMsg: err.message || "A network or server error occurred. Please try again."
      });
    }
  };

  const selectedOption = NIN_SLIP_OPTIONS.find(o => o.id === slipType) || NIN_SLIP_OPTIONS[3];
  const currentPrice = statusState.prices[slipType] || selectedOption.defaultPrice;
  const isSelectedSlipAvailable = statusState.activeMap[slipType] !== false;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      
      {/* Top Navigation - Cleanly Separated */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link 
          href="/dashboard/nin/slips" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer w-fit"
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
          Back to Verification Methods
        </Link>

        <Link
          href="/dashboard/nin/slips/phone"
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/15 border border-sky-500/20 px-3.5 py-2 rounded-xl transition-all w-fit cursor-pointer"
        >
          <DeviceMobile size={15} weight="bold" />
          <span>Switch to Phone Number Query &rarr;</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <Image src="/nimc.png" width={44} height={44} alt="NIMC Logo" className="object-contain" priority />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Query Identity by NIN</h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
            Generate and download official NIMC verification slips using an 11-digit NIN.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleOpenConfirm} className="space-y-6">
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
            <WarningCircle weight="fill" size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
            <span>11-Digit National Identity Number (NIN)</span>
            <span className="font-mono text-[11px]">{nin.length}/11</span>
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={nin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setNin(val);
                if (error) setError(null);
              }}
              placeholder="Enter 11-digit NIN"
              className="h-12 bg-card border border-border text-base font-mono font-bold pl-4 pr-10 rounded-xl"
            />
            {nin.length === 11 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle size={20} weight="fill" />
              </div>
            )}
          </div>
        </div>

        {/* Slips Radio List with Eye + "View Example" Previews & Clean Status Badges */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Slip Format
          </label>

          <div className="space-y-2">
            {NIN_SLIP_OPTIONS.map((option) => {
              const isSelected = slipType === option.id;
              const isAvailable = statusState.activeMap[option.id] !== false;
              const price = statusState.prices[option.id] || option.defaultPrice;

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
                      ? "bg-secondary/70 border-[#ff3f7a] shadow-sm cursor-pointer"
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
                      className="text-[#ff3f7a] focus:ring-[#ff3f7a] cursor-pointer disabled:cursor-not-allowed"
                    />
                    
                    <div className="flex items-center flex-wrap gap-2.5">
                      <span className={`font-bold text-sm ${!isAvailable ? "text-muted-foreground" : "text-foreground"}`}>
                        {option.label}
                      </span>
                      
                      {/* Clickable Eye Icon + "View Example" Text */}
                      <button 
                        type="button" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setLightbox({ isOpen: true, src: option.img, label: option.label }); 
                        }} 
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-[#ff3f7a] bg-secondary hover:bg-secondary/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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
                    ₦{price.toLocaleString()}
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
              checked={attestation1}
              onChange={(e) => setAttestation1(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#ff3f7a] focus:ring-[#ff3f7a] border-border cursor-pointer"
            />
            <span>I declare that I am the owner of this NIN or have lawful consent to query this record.</span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attestation2}
              onChange={(e) => setAttestation2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#ff3f7a] focus:ring-[#ff3f7a] border-border cursor-pointer"
            />
            <span>I authorize the fee of <strong>₦{currentPrice.toLocaleString()}</strong> to be debited from my wallet.</span>
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!attestation1 || !attestation2 || nin.length !== 11 || !isSelectedSlipAvailable}
          className="w-full h-12 font-black text-sm bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Sparkle size={18} weight="fill" />
          Verify & Generate Slip (₦{currentPrice.toLocaleString()})
        </Button>

      </form>

      {/* CONFIRMATION & INSUFFICIENT BALANCE MODAL (WITH SPECIMEN PREVIEW) */}
      <SlipConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeSlipGeneration}
        isLoading={isGenerating}
        identifier={nin.trim()}
        searchType="NIN"
        slipLabel={selectedOption.label}
        slipImage={selectedOption.img}
        price={currentPrice}
        walletBalance={walletBalance}
      />

      {/* LIGHTBOX SPECIMEN PREVIEW OVERLAY */}
      {lightbox.isOpen && (
        <div 
          className="fixed inset-0 z-[999999] h-[100dvh] w-screen flex items-center justify-center p-4 bg-background/80 dark:bg-background/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto overscroll-contain touch-none"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div className="relative w-full max-w-lg flex flex-col items-center animate-in zoom-in-95 duration-200 overscroll-contain touch-pan-y" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-card border border-border px-4 py-2.5 rounded-t-2xl flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{lightbox.label} Example Specimen</span>
              <button 
                onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full cursor-pointer"
              >
                <X weight="bold" size={16} />
              </button>
            </div>
            <div className="relative w-full h-[60vh] bg-card border-x border-b border-border rounded-b-2xl overflow-hidden p-3 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image src={lightbox.src} alt={lightbox.label} fill className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      <NinResultModal
        isOpen={resultModal.isOpen}
        status={resultModal.status}
        identifier={resultModal.identifier}
        searchType="NIN"
        slipLabel={resultModal.slipLabel}
        pdfBase64={resultModal.pdfBase64}
        pdfUrl={resultModal.pdfUrl}
        userData={resultModal.userData}
        fullName={resultModal.fullName}
        photo={resultModal.photo}
        errorMsg={resultModal.errorMsg}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* NIN SPECIFIC HISTORY (LAST 24 HOURS) */}
      <NinHistorySection history={history} title="NIN Verification History (Last 24 Hours)" isLoading={statusState.loading} />

    </div>
  );
}
