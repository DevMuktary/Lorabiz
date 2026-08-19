"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, WarningCircle, Eye, X, Check,
  Sparkle, ShieldCheck, CheckCircle, Wrench, IdentificationCard
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NinResultModal, { DemographicData } from "@/components/features/nin/slips/NinResultModal";
import NinHistorySection, { SlipHistoryItem } from "@/components/features/nin/slips/NinHistorySection";
import SlipConfirmationModal from "@/components/features/nin/slips/SlipConfirmationModal";

interface SlipOption {
  id: "nin_regular" | "nin_standard" | "nin_premium";
  label: string;
  img: string;
  defaultPrice: number;
}

// User-specified ordering for Phone Query:
// 1. Regular Slip (₦500)
// 2. Standard Slip (₦700)
// 3. Premium Slip (₦1,000)
const PHONE_SLIP_OPTIONS: SlipOption[] = [
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
];

export default function NinByPhonePage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [slipType, setSlipType] = useState<"nin_regular" | "nin_standard" | "nin_premium">("nin_premium");
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const [statusState, setStatusState] = useState<{
    loading: boolean;
    phoneSearchActive: boolean;
    prices: Record<string, number>;
    activeMap: Record<string, boolean>;
  }>({
    loading: true,
    phoneSearchActive: true,
    prices: {
      nin_regular: 500,
      nin_standard: 700,
      nin_premium: 1000,
    },
    activeMap: {
      nin_regular: true,
      nin_standard: true,
      nin_premium: true,
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
  }>({
    isOpen: false,
    status: "loading"
  });

  const [history, setHistory] = useState<SlipHistoryItem[]>([]);

  const loadData = async () => {
    try {
      const [statusRes, historyRes, walletRes] = await Promise.all([
        fetch("/api/nin/slips/status", { cache: "no-store" }),
        fetch("/api/nin/slips/history?searchType=PHONE", { cache: "no-store" }),
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
        const isMasterPhoneActive = statusData.status.phoneSearchActive !== false;

        const activeMap: Record<string, boolean> = {
          nin_regular: (pMap.NIN_PHONE_REGULAR?.isActive !== false) && isMasterPhoneActive,
          nin_standard: (pMap.NIN_PHONE_STANDARD?.isActive !== false) && isMasterPhoneActive,
          nin_premium: (pMap.NIN_PHONE_PREMIUM?.isActive !== false) && isMasterPhoneActive,
        };

        setStatusState({
          loading: false,
          phoneSearchActive: isMasterPhoneActive,
          prices: {
            nin_regular: pMap.NIN_PHONE_REGULAR?.price || 500,
            nin_standard: pMap.NIN_PHONE_STANDARD?.price || 700,
            nin_premium: pMap.NIN_PHONE_PREMIUM?.price || 1000,
          },
          activeMap,
        });

        // Ensure selected slip is active, otherwise switch to first active
        if (!activeMap[slipType]) {
          const firstActive = PHONE_SLIP_OPTIONS.find(o => activeMap[o.id]);
          if (firstActive) setSlipType(firstActive.id);
        }
      } else {
        setStatusState(prev => ({ ...prev, loading: false }));
      }

      if (historyData.success && historyData.history) {
        setHistory(historyData.history);
      }
    } catch (err) {
      console.error("Failed to load Phone NIN status:", err);
      setStatusState(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(phoneNumber.trim())) {
      setError("Please provide a valid 11-digit Phone Number.");
      return;
    }
    if (!statusState.phoneSearchActive) {
      setError("Phone search is currently offline for maintenance. Please switch to NIN query.");
      return;
    }
    if (!statusState.activeMap[slipType]) {
      setError("The selected slip format is currently unavailable for phone verification.");
      return;
    }
    if (!attestation1 || !attestation2) {
      setError("You must check all statutory attestations to proceed.");
      return;
    }

    setError(null);
    setIsConfirmOpen(true);
  };

  const executeSlipGeneration = async () => {
    setIsConfirmOpen(false);
    setIsGenerating(true);

    const selectedOption = PHONE_SLIP_OPTIONS.find(o => o.id === slipType);

    setResultModal({
      isOpen: true,
      status: "loading",
      identifier: phoneNumber.trim(),
      searchType: "PHONE",
      slipLabel: selectedOption?.label
    });

    try {
      const res = await fetch("/api/nin/slips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: phoneNumber.trim(),
          searchType: "PHONE",
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
          errorMsg: data.message || "Failed to retrieve slip via phone number. Please ensure the SIM is registered with NIMC or try your 11-digit NIN."
        });
        return;
      }

      setResultModal({
        isOpen: true,
        status: "success",
        pdfBase64: data.pdfBase64,
        pdfUrl: data.pdfUrl,
        identifier: phoneNumber.trim(),
        searchType: "PHONE",
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

  const selectedOption = PHONE_SLIP_OPTIONS.find(o => o.id === slipType) || PHONE_SLIP_OPTIONS[2];
  const currentPrice = statusState.prices[slipType] || selectedOption.defaultPrice;
  const isSelectedSlipAvailable = statusState.activeMap[slipType] !== false && statusState.phoneSearchActive;

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
          href="/dashboard/nin/slips/nin"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#ff3f7a] bg-[#ff3f7a]/10 hover:bg-[#ff3f7a]/15 border border-[#ff3f7a]/20 px-3.5 py-2 rounded-xl transition-all w-fit cursor-pointer"
        >
          <IdentificationCard size={15} weight="bold" />
          <span>Switch to NIN Query &rarr;</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <Image src="/nimc.png" width={44} height={44} alt="NIMC Logo" className="object-contain" priority />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Query Identity by Phone Number</h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
            Generate and download NIMC verification slips using a NIN-linked phone number.
          </p>
        </div>
      </div>

      {/* Outage banner if phone search is globally disabled */}
      {!statusState.phoneSearchActive && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
          <Wrench size={18} weight="fill" className="shrink-0 text-amber-500" />
          <span>NIMC Phone Number search is temporarily offline for maintenance. Please switch to 11-digit NIN search.</span>
        </div>
      )}

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
            <span>11-Digit SIM Phone Number</span>
            <span className="font-mono text-[11px]">{phoneNumber.length}/11</span>
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPhoneNumber(val);
                if (error) setError(null);
              }}
              placeholder="e.g. 08012345678"
              className="h-12 bg-card border border-border text-base font-mono font-bold pl-4 pr-10 rounded-xl"
            />
            {phoneNumber.length === 11 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                <CheckCircle size={20} weight="fill" />
              </div>
            )}
          </div>
        </div>

        {/* Slips Radio List with Eye + "View Example" & Maintenance Badges */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Slip Format
          </label>

          <div className="space-y-2">
            {PHONE_SLIP_OPTIONS.map((option) => {
              const isSelected = slipType === option.id;
              const isAvailable = statusState.activeMap[option.id] !== false && statusState.phoneSearchActive;
              const price = statusState.prices[option.id] || option.defaultPrice;

              return (
                <div
                  key={option.id}
                  onClick={() => {
                    if (isAvailable) setSlipType(option.id);
                  }}
                  className={`p-3.5 sm:p-4 rounded-xl border-2 flex items-center justify-between transition-all ${!isAvailable
                      ? "opacity-50 bg-secondary/20 border-border/60 cursor-not-allowed"
                      : isSelected
                        ? "bg-secondary/70 border-sky-500 shadow-sm cursor-pointer"
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
                      className="text-sky-500 focus:ring-sky-500 cursor-pointer disabled:cursor-not-allowed"
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
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-sky-500 bg-secondary hover:bg-secondary/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
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
              className="mt-0.5 h-4 w-4 rounded text-sky-500 focus:ring-sky-500 border-border cursor-pointer"
            />
            <span>I declare that I am the owner of this phone number or have lawful consent to query this record.</span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attestation2}
              onChange={(e) => setAttestation2(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded text-sky-500 focus:ring-sky-500 border-border cursor-pointer"
            />
            <span>I authorize the fee of <strong>₦{currentPrice.toLocaleString()}</strong> to be debited from my wallet.</span>
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!attestation1 || !attestation2 || phoneNumber.length !== 11 || !statusState.phoneSearchActive || !isSelectedSlipAvailable}
          className="w-full h-12 font-black text-sm bg-sky-500 text-white hover:bg-sky-600 rounded-xl shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
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
        identifier={phoneNumber.trim()}
        searchType="PHONE"
        slipLabel={selectedOption.label}
        slipImage={selectedOption.img}
        price={currentPrice}
        walletBalance={walletBalance}
      />

      {/* LIGHTBOX SPECIMEN PREVIEW OVERLAY */}
      {lightbox.isOpen && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div className="relative w-full max-w-lg flex flex-col items-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
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
        searchType="PHONE"
        slipLabel={resultModal.slipLabel}
        pdfBase64={resultModal.pdfBase64}
        pdfUrl={resultModal.pdfUrl}
        userData={resultModal.userData}
        fullName={resultModal.fullName}
        photo={resultModal.photo}
        errorMsg={resultModal.errorMsg}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* PHONE SPECIFIC HISTORY (LAST 24 HOURS) */}
      <NinHistorySection history={history} title="Phone Verification History (Last 24 Hours)" isLoading={statusState.loading} />

    </div>
  );
}
