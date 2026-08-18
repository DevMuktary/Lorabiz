"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, ArrowRight, IdentificationCard, DeviceMobile, 
  Sparkle, ShieldCheck, CheckCircle, Clock, FilePdf, Lightning,
  WarningCircle, Wrench, Eye, X, Check, Info, Phone
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NinResultModal, { DemographicData } from "@/components/features/nin/slips/NinResultModal";
import NinHistorySection, { SlipHistoryItem } from "@/components/features/nin/slips/NinHistorySection";

interface SlipOptionConfig {
  id: "nin_regular" | "nin_standard" | "nin_premium";
  label: string;
  badge?: string;
  desc: string;
  img: string;
  defaultPrice: number;
  serviceKey: string;
}

const PHONE_SLIP_OPTIONS: SlipOptionConfig[] = [
  { 
    id: "nin_regular", 
    label: "Regular Official Slip", 
    badge: "Standard Long", 
    desc: "Standard long layout accepted for corporate filings, CAC registrations, and bank documentation.", 
    img: "/examples/nin_regular_example.png",
    defaultPrice: 500,
    serviceKey: "NIN_REGULAR"
  },
  { 
    id: "nin_standard", 
    label: "Standard Biometric Slip", 
    badge: "Biometric Layout", 
    desc: "Compact layout containing high-density biometric parameters, QR verification, and citizen photo.", 
    img: "/examples/nin_standard_example.png",
    defaultPrice: 700,
    serviceKey: "NIN_STANDARD"
  },
  { 
    id: "nin_premium", 
    label: "Premium Card Slip", 
    badge: "PVC Ready", 
    desc: "Full-colour card design with front and back orientation, formatted for pocket cutting or PVC ID printing.", 
    img: "/examples/nin_premium_example.png",
    defaultPrice: 1000,
    serviceKey: "NIN_PREMIUM"
  },
];

export default function NinByPhonePage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [slipType, setSlipType] = useState<"nin_regular" | "nin_standard" | "nin_premium">("nin_premium");
  
  const [statusState, setStatusState] = useState<{
    loading: boolean;
    phoneSearchActive: boolean;
    prices: Record<string, number>;
  }>({
    loading: true,
    phoneSearchActive: true,
    prices: {
      nin_regular: 500,
      nin_standard: 700,
      nin_premium: 1000,
    },
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
    imgUrl: string;
  }>({ isOpen: false, identifier: "", slipLabel: "", price: 0, imgUrl: "" });

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

  // Fetch status, pricing, and history
  const loadData = async () => {
    try {
      const [statusRes, historyRes] = await Promise.all([
        fetch("/api/nin/slips/status", { cache: "no-store" }),
        fetch("/api/nin/slips/history", { cache: "no-store" }),
      ]);

      const statusData = await statusRes.json();
      const historyData = await historyRes.json();

      if (statusData.success && statusData.status) {
        const pMap = statusData.pricing || {};
        setStatusState({
          loading: false,
          phoneSearchActive: statusData.status.phoneSearchActive,
          prices: {
            nin_regular: pMap.NIN_REGULAR?.price || 500,
            nin_standard: pMap.NIN_STANDARD?.price || 700,
            nin_premium: pMap.NIN_PREMIUM?.price || 1000,
          },
        });
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

  const handleGenerateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(phoneNumber.trim())) {
      setError("Please provide a valid 11-digit Phone Number (e.g. 08012345678).");
      return;
    }
    if (!statusState.phoneSearchActive) {
      setError("Phone number verification is temporarily offline for maintenance. Please switch to NIN search.");
      return;
    }
    if (!attestation1 || !attestation2) {
      setError("You must agree to all statutory attestations to proceed.");
      return;
    }

    setError(null);
    const selectedOption = PHONE_SLIP_OPTIONS.find(o => o.id === slipType);
    const price = statusState.prices[slipType] || 1000;

    setConfirmModal({
      isOpen: true,
      identifier: phoneNumber.trim(),
      slipLabel: selectedOption?.label || "NIN Slip",
      price,
      imgUrl: selectedOption?.img || "/examples/nin_premium_example.png"
    });
  };

  const executeSlipGeneration = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
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
        fullName: data.fullName
      });

      // Refresh history
      loadData();

    } catch (err: any) {
      setResultModal({
        isOpen: true,
        status: "error",
        errorMsg: err.message || "A network or server error occurred. Please try again."
      });
    }
  };

  const currentOption = PHONE_SLIP_OPTIONS.find(o => o.id === slipType);
  const currentPrice = statusState.prices[slipType] || currentOption?.defaultPrice || 1000;

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      
      {/* Top Navigation & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link 
          href="/dashboard/nin/slips" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer w-fit"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to Slip Selection Hub
        </Link>

        {/* Quick Switch to NIN Search */}
        <Link
          href="/dashboard/nin/slips/nin"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#ff3f7a] hover:text-[#e02b62] bg-[#ff3f7a]/10 hover:bg-[#ff3f7a]/15 border border-[#ff3f7a]/20 px-3.5 py-2 rounded-xl cursor-pointer transition-colors w-fit"
        >
          <IdentificationCard size={16} weight="bold" />
          <span>Have your 11-digit NIN? Switch to NIN Lookup &rarr;</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <Image src="/nimc.png" width={44} height={44} alt="NIMC Logo" className="object-contain" priority />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Verify Identity by Phone Number</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-500 px-2.5 py-0.5 rounded-full border border-sky-500/20">
              SIM-Linked Lookup
            </span>
          </div>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
            Query the NIMC national registry using your registered SIM phone number and generate official slips with complete demographic records.
          </p>
        </div>
      </div>

      {/* Maintenance Banner if Phone Search is Inactive */}
      {!statusState.phoneSearchActive && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl text-amber-600 dark:text-amber-400 space-y-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <Wrench size={26} weight="fill" className="shrink-0 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Phone Number Verification is Temporarily Offline</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upstream SIM-link verification is undergoing routine network maintenance. Please use your 11-digit NIN to generate slips.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/nin/slips/nin"
            className="inline-flex items-center gap-2 bg-[#ff3f7a] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm hover:bg-[#e02b62] transition-colors"
          >
            <IdentificationCard size={16} weight="bold" />
            Switch to 11-Digit NIN Verification &rarr;
          </Link>
        </div>
      )}

      {/* MAIN FORM & SPECIMEN PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: 7 cols */}
        <form onSubmit={handleGenerateSlip} className="lg:col-span-7 space-y-6">
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
              <WarningCircle weight="fill" size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* INPUT: 11-Digit Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Registered SIM Phone Number</span>
              <span className="text-[11px] font-mono text-muted-foreground">{phoneNumber.length}/11 digits</span>
            </label>

            <div className="relative">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={11}
                disabled={!statusState.phoneSearchActive}
                value={phoneNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPhoneNumber(val);
                  if (error) setError(null);
                }}
                placeholder="Enter 11-digit Phone (e.g. 08012345678)"
                className="h-14 bg-card border-2 border-border focus:border-sky-500 text-lg sm:text-xl font-mono font-bold tracking-widest pl-4 pr-12 rounded-2xl shadow-sm disabled:opacity-60"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                {phoneNumber.length === 11 ? (
                  <CheckCircle size={22} weight="fill" className="text-emerald-500" />
                ) : (
                  <Phone size={22} weight="duotone" />
                )}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Must be the primary mobile number submitted during your NIMC NIN enrollment.
            </p>
          </div>

          {/* SLIP FORMAT SELECTION (3 SUPPORTED SLIPS) */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Choose Verification Slip Format
            </label>

            <div className="space-y-2.5">
              {PHONE_SLIP_OPTIONS.map((opt) => {
                const isSelected = slipType === opt.id;
                const price = statusState.prices[opt.id] || opt.defaultPrice;

                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      if (statusState.phoneSearchActive) setSlipType(opt.id);
                    }}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between gap-4 ${
                      !statusState.phoneSearchActive
                        ? "opacity-50 bg-secondary/20 border-border cursor-not-allowed"
                        : isSelected
                        ? "bg-sky-500/5 border-sky-500 shadow-md cursor-pointer"
                        : "bg-card hover:bg-secondary/30 border-border cursor-pointer hover:border-border/80"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? "border-sky-500 bg-sky-500" : "border-muted-foreground/40"
                      }`}>
                        {isSelected && <Check size={12} weight="bold" className="text-white" />}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-foreground">{opt.label}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            opt.id === "nin_premium"
                              ? "bg-sky-500/15 text-sky-500"
                              : "bg-secondary text-muted-foreground border border-border"
                          }`}>
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pr-2">{opt.desc}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm sm:text-base font-black text-foreground">
                        ₦{price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STATUTORY ATTESTATIONS */}
          <div className="bg-secondary/30 border border-border rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              <ShieldCheck size={16} className="text-emerald-500" weight="bold" />
              Statutory Privacy & Consent Declaration
            </div>

            <label className="flex items-start gap-3 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!statusState.phoneSearchActive}
                checked={attestation1}
                onChange={(e) => setAttestation1(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-sky-500 focus:ring-sky-500 border-border"
              />
              <span>
                I confirm that I am the legal subscriber of this mobile line or have authorized consent to query the linked NIMC record.
              </span>
            </label>

            <label className="flex items-start gap-3 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!statusState.phoneSearchActive}
                checked={attestation2}
                onChange={(e) => setAttestation2(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded text-sky-500 focus:ring-sky-500 border-border"
              />
              <span>
                I understand that this verification costs <strong>₦{currentPrice.toLocaleString()}</strong> from my wallet and results are stored in my 24-hour print history.
              </span>
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={!statusState.phoneSearchActive || !attestation1 || !attestation2 || phoneNumber.length !== 11}
            className="w-full h-14 font-black text-base bg-sky-500 text-white hover:bg-sky-600 rounded-2xl shadow-lg shadow-sky-500/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Sparkle size={20} weight="fill" />
            Verify & Generate Slip (₦{currentPrice.toLocaleString()})
          </Button>

        </form>

        {/* Right Column: Specimen Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Specimen Preview
              </span>
              <button
                type="button"
                onClick={() => currentOption && setLightbox({ isOpen: true, src: currentOption.img, label: currentOption.label })}
                className="text-xs font-bold text-sky-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye size={14} weight="bold" />
                Zoom Preview
              </button>
            </div>

            <div 
              onClick={() => currentOption && setLightbox({ isOpen: true, src: currentOption.img, label: currentOption.label })}
              className="relative w-full h-64 bg-secondary/40 border border-border rounded-2xl overflow-hidden p-4 flex items-center justify-center cursor-pointer group"
            >
              {currentOption?.img && (
                <Image
                  src={currentOption.img}
                  alt={currentOption.label}
                  fill
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                  Click to Expand
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-center">
              <h4 className="font-black text-sm text-foreground">{currentOption?.label}</h4>
              <p className="text-xs text-muted-foreground">{currentOption?.desc}</p>
            </div>
          </div>

          {/* Quick FAQ info */}
          <div className="bg-secondary/30 border border-border rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Info size={16} className="text-sky-500" weight="bold" />
              <span>SIM Verification Note</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If your phone number was recently linked or swapped, please allow up to 24 hours for telco KYC records to synchronize with NIMC databases.
            </p>
          </div>
        </div>

      </div>

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 text-left space-y-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                  <DeviceMobile size={22} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Confirm Phone Verification</h3>
                  <p className="text-xs text-muted-foreground">{confirmModal.slipLabel}</p>
                </div>
              </div>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="bg-secondary/40 p-4 rounded-2xl border border-border space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone Number:</span>
                <span className="font-mono font-black text-foreground">{confirmModal.identifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slip Layout:</span>
                <span className="font-bold text-foreground">{confirmModal.slipLabel}</span>
              </div>
              <div className="flex justify-between border-t border-border/60 pt-2 text-sm font-black">
                <span>Total Fee:</span>
                <span className="text-sky-500">₦{confirmModal.price.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Your wallet will be debited instantly and the official slip will be downloaded to your device.
            </p>

            <div className="flex gap-2.5 pt-1">
              <Button
                variant="outline"
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="flex-1 h-12 rounded-xl font-bold border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={executeSlipGeneration}
                className="flex-1 h-12 rounded-xl font-black bg-sky-500 text-white hover:bg-sky-600 shadow-lg shadow-sky-500/20"
              >
                Confirm & Pay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW OVERLAY */}
      {lightbox.isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div className="relative w-full max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-card border border-border px-5 py-3 rounded-t-2xl flex items-center justify-between">
              <span className="text-sm font-black text-foreground">{lightbox.label} Specimen Format</span>
              <button 
                onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-full cursor-pointer transition-colors"
              >
                <X weight="bold" size={16} />
              </button>
            </div>
            <div className="relative w-full h-[65vh] bg-card border-x border-b border-border rounded-b-2xl overflow-hidden p-4 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image src={lightbox.src} alt={lightbox.label} fill className="object-contain" priority />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL WITH DEMOGRAPHIC DETAILS & DOWNLOAD */}
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
        errorMsg={resultModal.errorMsg}
        onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 24-HOUR PRINT HISTORY */}
      <NinHistorySection history={history} />

    </div>
  );
}
