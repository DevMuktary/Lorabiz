"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, WarningCircle, Eye, X, Check,
  Sparkle, ShieldCheck, CheckCircle, Wrench
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NinResultModal, { DemographicData } from "@/components/features/nin/slips/NinResultModal";
import NinHistorySection, { SlipHistoryItem } from "@/components/features/nin/slips/NinHistorySection";

interface SlipOption {
  id: "nin_basic" | "nin_vnin" | "nin_regular" | "nin_standard" | "nin_premium";
  label: string;
  desc: string;
  img: string;
  defaultPrice: number;
}

const NIN_SLIP_OPTIONS: SlipOption[] = [
  { 
    id: "nin_basic", 
    label: "Basic Slip", 
    desc: "Compact text verification slip.", 
    img: "/examples/nin_regular_example.png",
    defaultPrice: 400 
  },
  { 
    id: "nin_vnin", 
    label: "VNIN Slip", 
    desc: "Tokenized Virtual NIN format.", 
    img: "/examples/nin_regular_example.png",
    defaultPrice: 500 
  },
  { 
    id: "nin_regular", 
    label: "Regular Slip", 
    desc: "Standard long format for official & corporate filings.", 
    img: "/examples/nin_regular_example.png",
    defaultPrice: 500 
  },
  { 
    id: "nin_standard", 
    label: "Standard Biometric Slip", 
    desc: "Biometric layout with photo & QR verification.", 
    img: "/examples/nin_standard_example.png",
    defaultPrice: 700 
  },
  { 
    id: "nin_premium", 
    label: "Premium Card Slip", 
    desc: "Full-colour card format for PVC printing.", 
    img: "/examples/nin_premium_example.png",
    defaultPrice: 1000 
  },
];

export default function NinByNinPage() {
  const [nin, setNin] = useState("");
  const [slipType, setSlipType] = useState<"nin_basic" | "nin_vnin" | "nin_regular" | "nin_standard" | "nin_premium">("nin_premium");
  
  const [statusState, setStatusState] = useState<{
    loading: boolean;
    availableSlips: string[];
    prices: Record<string, number>;
    isDegraded: boolean;
  }>({
    loading: true,
    availableSlips: ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"],
    prices: {
      nin_basic: 400,
      nin_vnin: 500,
      nin_regular: 500,
      nin_standard: 700,
      nin_premium: 1000,
    },
    isDegraded: false,
  });

  const [attestation1, setAttestation1] = useState(false);
  const [attestation2, setAttestation2] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; label: string }>({
    isOpen: false, src: "", label: ""
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    identifier: string;
    slipLabel: string;
    price: number;
  }>({ isOpen: false, identifier: "", slipLabel: "", price: 0 });

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
    errorMsg?: string;
  }>({ isOpen: false, status: "loading" });

  const [history, setHistory] = useState<SlipHistoryItem[]>([]);

  const loadData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch("/api/nin/slips/status", { cache: "no-store" }),
        fetch("/api/nin/slips/history?searchType=NIN", { cache: "no-store" }),
      ]);

      const statusData = await statusRes.json();
      const historyData = await historyRes.json();

      if (statusData.success && statusData.status) {
        const pMap = statusData.pricing || {};
        setStatusState({
          loading: false,
          availableSlips: statusData.status.availableNINSlips || ["nin_basic", "nin_vnin", "nin_regular", "nin_standard", "nin_premium"],
          prices: {
            nin_basic: pMap.NIN_BASIC?.price || 400,
            nin_vnin: pMap.NIN_VNIN?.price || 500,
            nin_regular: pMap.NIN_REGULAR?.price || 500,
            nin_standard: pMap.NIN_STANDARD?.price || 700,
            nin_premium: pMap.NIN_PREMIUM?.price || 1000,
          },
          isDegraded: statusData.status.isDataVerifyDegraded || statusData.status.activeRouting === "SLIPAPI",
        });
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

  const handleGenerateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(nin.trim())) {
      setError("Please provide a valid 11-digit NIN.");
      return;
    }
    if (!attestation1 || !attestation2) {
      setError("You must check all statutory attestations to proceed.");
      return;
    }
    if (!statusState.availableSlips.includes(slipType)) {
      setError("The selected slip type is temporarily offline. Please select Standard or Premium.");
      return;
    }

    setError(null);
    const selectedOption = NIN_SLIP_OPTIONS.find(o => o.id === slipType);
    const price = statusState.prices[slipType] || selectedOption?.defaultPrice || 1000;

    setConfirmModal({
      isOpen: true,
      identifier: nin.trim(),
      slipLabel: selectedOption?.label || "NIN Slip",
      price,
    });
  };

  const executeSlipGeneration = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
        fullName: data.fullName
      });

      loadData();

    } catch (err: any) {
      setResultModal({
        isOpen: true,
        status: "error",
        errorMsg: err.message || "A network or server error occurred. Please try again."
      });
    }
  };

  const currentPrice = statusState.prices[slipType] || 1000;

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/nin/slips" 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
          Back to Verification Methods
        </Link>

        <Link
          href="/dashboard/nin/slips/phone"
          className="text-xs font-bold text-sky-500 hover:text-sky-400 transition-colors"
        >
          Switch to Phone Number query &rarr;
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

      {/* Provider degradation banner */}
      {statusState.isDegraded && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <Wrench size={18} weight="fill" className="shrink-0 text-amber-500" />
          <span>Backup router active: Standard & Premium slips are available.</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleGenerateSlip} className="space-y-6">
        
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

        {/* Slips Radio List with Eye Example Previews */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Slip Format
          </label>

          <div className="space-y-2.5">
            {NIN_SLIP_OPTIONS.map((option) => {
              const isSelected = slipType === option.id;
              const isAvailable = statusState.availableSlips.includes(option.id);
              const price = statusState.prices[option.id] || option.defaultPrice;

              return (
                <div
                  key={option.id}
                  onClick={() => {
                    if (isAvailable) setSlipType(option.id);
                  }}
                  className={`p-3.5 sm:p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                    !isAvailable
                      ? "opacity-50 bg-secondary/20 border-border cursor-not-allowed"
                      : isSelected
                      ? "bg-secondary/70 border-[#ff3f7a] shadow-sm cursor-pointer"
                      : "bg-card border-border hover:bg-secondary/40 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name="slipType" 
                      disabled={!isAvailable}
                      checked={isSelected} 
                      onChange={() => {
                        if (isAvailable) setSlipType(option.id);
                      }} 
                      className="text-[#ff3f7a] focus:ring-[#ff3f7a]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{option.label}</span>
                        
                        {/* Eye Example Preview Button */}
                        <button 
                          type="button" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setLightbox({ isOpen: true, src: option.img, label: option.label }); 
                          }} 
                          className="text-muted-foreground hover:text-[#ff3f7a] p-1 transition-colors cursor-pointer"
                          title={`Preview ${option.label} Example`}
                        >
                          <Eye size={16} weight="bold" />
                        </button>

                        {!isAvailable && (
                          <span className="text-[10px] font-bold bg-amber-500/15 text-amber-600 px-1.5 py-0.2 rounded">
                            Offline
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </div>

                  <div className="font-black text-sm text-foreground shrink-0 pl-2">
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
              className="mt-0.5 h-4 w-4 rounded text-[#ff3f7a] focus:ring-[#ff3f7a] border-border"
            />
            <span>I declare that I am the owner of this NIN or have lawful consent to query this record.</span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attestation2}
              onChange={(e) => setAttestation2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-[#ff3f7a] focus:ring-[#ff3f7a] border-border"
            />
            <span>I authorize the fee of <strong>₦{currentPrice.toLocaleString()}</strong> to be debited from my wallet.</span>
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!attestation1 || !attestation2 || nin.length !== 11}
          className="w-full h-12 font-black text-sm bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Sparkle size={18} weight="fill" />
          Verify & Generate Slip (₦{currentPrice.toLocaleString()})
        </Button>

      </form>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-left space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-black text-foreground">Confirm Generation</h3>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            <div className="bg-secondary/40 p-3.5 rounded-xl border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">NIN:</span>
                <span className="font-mono font-bold text-foreground">{confirmModal.identifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slip:</span>
                <span className="font-bold text-foreground">{confirmModal.slipLabel}</span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 text-sm font-black">
                <span>Charge:</span>
                <span className="text-[#ff3f7a]">₦{confirmModal.price.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="h-11 rounded-xl font-bold border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={executeSlipGeneration}
                className="h-11 rounded-xl font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62]"
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX SPECIMEN PREVIEW OVERLAY */}
      {lightbox.isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div className="relative w-full max-w-lg flex flex-col items-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-card border border-border px-4 py-2.5 rounded-t-2xl flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{lightbox.label} Example</span>
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
        errorMsg={resultModal.errorMsg}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* NIN SPECIFIC HISTORY (LAST 24 HOURS) */}
      <NinHistorySection history={history} title="NIN Verification History (Last 24 Hours)" />

    </div>
  );
}
