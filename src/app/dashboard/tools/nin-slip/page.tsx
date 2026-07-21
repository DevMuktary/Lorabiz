"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldWarning, DownloadSimple, WarningCircle, 
  Eye, MagnifyingGlass, Check, X, ArrowLeft, Wrench,
  Wallet, Sparkle, Question
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import NinResultModal from "@/components/features/tools/nin-slip/NinResultModal";
import NinHistorySection, { SlipHistoryItem } from "@/components/features/tools/nin-slip/NinHistorySection";

export default function NinSlipPage() {
  const [nin, setNin] = useState("");
  const [slipType, setSlipType] = useState<"nin_premium" | "nin_standard" | "nin_regular">("nin_regular");
  
  // Status state for individual NIN options and prices from Admin Panel
  const [ninStatuses, setNinStatuses] = useState<{
    loading: boolean;
    options: Record<string, boolean>;
    prices: Record<string, number>;
  }>({
    loading: true,
    options: { nin_regular: true, nin_standard: true, nin_premium: true },
    prices: { nin_regular: 0, nin_standard: 0, nin_premium: 0 }
  });

  const [attestation1, setAttestation1] = useState(false);
  const [attestation2, setAttestation2] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; label: string }>({
    isOpen: false, src: "", label: ""
  });

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    nin: string;
    slipLabel: string;
    price: number;
    imgUrl: string;
  }>({ isOpen: false, nin: "", slipLabel: "", price: 0, imgUrl: "" });

  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    status: "loading" | "success" | "error";
    pdfBase64?: string;
    nin?: string;
    slipLabel?: string;
    errorMsg?: string;
  }>({ isOpen: false, status: "loading" });

  const [history, setHistory] = useState<SlipHistoryItem[]>([]);

  // Fetch Live Toggles, Pricing & 24-Hour History from Database
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // 1. Fetch Admin Settings & Pricing
        const settingsRes = await fetch("/api/settings/global", { cache: "no-store" });
        const settingsData = await settingsRes.json();
        
        if (settingsData.success && settingsData.settings?.ninOptions) {
          const opts = settingsData.settings.ninOptions;
          const prcs = settingsData.settings.ninPrices || { nin_regular: 0, nin_standard: 0, nin_premium: 0 };

          setNinStatuses({
            loading: false,
            options: opts,
            prices: prcs
          });
          
          // Auto-select the first active option if current is disabled
          if (!opts[slipType]) {
            const available = Object.keys(opts).find(k => opts[k]);
            if (available) setSlipType(available as any);
          }
        } else {
          setNinStatuses(p => ({ ...p, loading: false }));
        }

        // 2. Fetch User's Real 24-Hour Print History
        const historyRes = await fetch("/api/tools/nin-slip/history", { cache: "no-store" });
        const historyData = await historyRes.json();
        if (historyData.success && historyData.history) {
          setHistory(historyData.history);
        }

      } catch (err) {
        setNinStatuses(p => ({ ...p, loading: false }));
      }
    };
    fetchInitialData();
  }, [slipType]);

  const triggerPdfDownload = (base64Data: string, ninNum: string) => {
    const linkSource = `data:application/pdf;base64,${base64Data}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `nin_slip_${ninNum}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Intercept form submission to open confirmation modal
  const handleGenerateSlip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(nin)) {
      setError("NIN must be exactly 11 digits.");
      return;
    }
    if (!attestation1 || !attestation2) {
      setError("You must check all statutory attestations to proceed.");
      return;
    }

    setError(null);
    const selectedOption = SLIP_OPTIONS.find(o => o.id === slipType);
    const price = ninStatuses.prices[slipType] || 0;

    // Open Confirmation Alert instead of firing API immediately
    setConfirmModal({
      isOpen: true,
      nin,
      slipLabel: selectedOption?.label || "NIN Slip",
      price,
      imgUrl: selectedOption?.img || "/examples/nin_regular_example.png"
    });
  };

  // Actual API execution after user confirms in the modal
  const executeSlipGeneration = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    const selectedOption = SLIP_OPTIONS.find(o => o.id === slipType);

    setResultModal({
      isOpen: true,
      status: "loading",
      nin,
      slipLabel: selectedOption?.label
    });

    try {
      const res = await fetch("/api/tools/nin-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nin,
          slipType,
          attestationsAccepted: attestation1 && attestation2
        })
      });

      const data = await res.json();

      if (!data.success) {
        setResultModal({
          isOpen: true,
          status: "error",
          errorMsg: data.message || "Could not generate slip details from database."
        });
        return;
      }

      triggerPdfDownload(data.pdfBase64, nin);

      setResultModal({
        isOpen: true,
        status: "success",
        pdfBase64: data.pdfBase64,
        nin,
        slipLabel: selectedOption?.label
      });

      setHistory(prev => [
        {
          id: Date.now().toString(),
          ninMasked: `${nin.slice(0, 3)}*****${nin.slice(-3)}`,
          slipType: selectedOption?.label || "Regular Slip",
          createdAt: "Just now",
          pdfBase64: data.pdfBase64,
          pdfUrl: data.pdfUrl
        },
        ...prev
      ]);

    } catch (err) {
      setResultModal({
        isOpen: true,
        status: "error",
        errorMsg: "Network connectivity error. Please verify your connection."
      });
    }
  };

  const SLIP_OPTIONS = [
    { id: "nin_regular" as const, label: "Regular Slip", desc: "Standard long layout accepted for corporate filings and business documentation.", img: "/examples/nin_regular_example.png" },
    { id: "nin_premium" as const, label: "Premium Card Slip", desc: "Full-colour card design, formatted for pocket cutting or PVC ID printing.", img: "/examples/nin_premium_example.png" },
    { id: "nin_standard" as const, label: "Standard Biometric Slip", desc: "Compact layout containing high-density biometric and identification parameters.", img: "/examples/nin_standard_example.png" },
  ];

  // Helper variables for component states
  const isSelectedActive = ninStatuses.loading ? true : ninStatuses.options[slipType];
  const allDisabled = !ninStatuses.loading && !Object.values(ninStatuses.options).some(v => v);
  const currentPrice = ninStatuses.loading ? null : ninStatuses.prices[slipType];

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24">
      
      {/* NAVIGATION: BACK TO DASHBOARD */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors bg-secondary/50 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* HEADER SECTION WITH NIMC LOGO */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center p-2.5 border border-border shrink-0 shadow-sm">
          <Image src="/nimc.png" width={44} height={44} alt="NIMC Logo" className="object-contain" priority />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">NIN Slip Generation & Printing Tool</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Direct query connection to generate standardized identity slips.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* CONFIGURATION FORM */}
        <form onSubmit={handleGenerateSlip} className="md:col-span-2 space-y-6">
          
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
              <WarningCircle weight="fill" size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* GLOBAL MAINTENANCE BANNER IF ALL ARE OFF */}
          {allDisabled && (
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-amber-600 text-sm font-bold flex items-center gap-3 animate-in fade-in">
              <Wrench weight="fill" size={24} className="shrink-0" />
              <span>NIN Slip Generation is currently down for maintenance. You can still view and download your previous slips from your history below.</span>
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5 space-y-2 shadow-sm">
            <label htmlFor="nin" className="text-sm font-black text-foreground uppercase tracking-wider">National Identity Number (NIN)</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-muted-foreground font-bold text-sm select-none">NIN</span>
              <Input
                id="nin"
                type="text"
                maxLength={11}
                value={nin}
                onChange={(e) => {
                  setNin(e.target.value.replace(/\D/g, ""));
                  if (error) setError(null);
                }}
                placeholder="Enter 11-digit identification number"
                className="pl-14 h-12 text-base tracking-[3px] font-black bg-secondary/30 border-border text-foreground focus-visible:ring-[#ff3f7a]"
              />
            </div>
          </div>

          {/* SLIP TYPE SELECTION */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Select Preferred Slip Print Format</h3>
            <div className="space-y-3">
              {SLIP_OPTIONS.map((opt) => {
                const isActive = ninStatuses.loading ? true : ninStatuses.options[opt.id];
                const price = ninStatuses.loading ? null : ninStatuses.prices[opt.id];

                return (
                <div 
                  key={opt.id}
                  onClick={() => { if (isActive) setSlipType(opt.id); }}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 bg-card ${
                    !isActive 
                      ? "opacity-50 grayscale cursor-not-allowed border-border"
                      : slipType === opt.id 
                        ? "border-[#ff3f7a] shadow-md shadow-[#ff3f7a]/5" 
                        : "border-border hover:border-muted-foreground/30 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      !isActive 
                        ? "border-muted-foreground/50" 
                        : slipType === opt.id ? "border-[#ff3f7a] bg-[#ff3f7a] text-white" : "border-muted-foreground"
                    }`}>
                      {slipType === opt.id && isActive && <Check weight="bold" size={12} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-foreground">{opt.label}</h4>
                        {price !== null && isActive && (
                          <span className="bg-[#ff3f7a]/10 text-[#ff3f7a] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            ₦{price.toLocaleString()}
                          </span>
                        )}
                        {!isActive && !ninStatuses.loading && (
                          <span className="text-[9px] uppercase tracking-wider font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded shadow-sm">Maintenance</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium max-w-md">{opt.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ isOpen: true, src: opt.img, label: opt.label });
                    }}
                    className="p-2 bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer shrink-0"
                    title="View Example Format"
                  >
                    <Eye size={18} weight="bold" />
                  </button>
                </div>
              )})}
            </div>
          </div>

          {/* STATUTORY ATTESTATIONS */}
          <div className="bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 border-b border-amber-500/10 pb-2">
              <ShieldWarning size={20} className="text-amber-500" weight="fill" />
              <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">Statutory Attestation & Consent</h3>
            </div>
            
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input 
                  type="checkbox"
                  checked={attestation1}
                  onChange={(e) => setAttestation1(e.target.checked)}
                  className="mt-1 accent-[#ff3f7a] h-4 w-4 shrink-0 rounded border-border"
                />
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  I authorize LoraBiz to process and format my identification parameters strictly for corporate compliance and documentation onboarding.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input 
                  type="checkbox"
                  checked={attestation2}
                  onChange={(e) => setAttestation2(e.target.checked)}
                  className="mt-1 accent-[#ff3f7a] h-4 w-4 shrink-0 rounded border-border"
                />
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  I clarify that I am the rightful holder of this identification number or possess clear third-party consent. I fully indemnify LoraBiz against external liability arising from unauthorized database queries.
                </span>
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!attestation1 || !attestation2 || nin.length !== 11 || !isSelectedActive || allDisabled}
            className="w-full h-14 font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#ff3f7a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <DownloadSimple size={20} weight="bold" /> 
            Generate & Print Slip {currentPrice !== null && isSelectedActive ? `(₦${currentPrice.toLocaleString()})` : ""}
          </Button>

        </form>

        {/* SIDE BAR PREVIEWS */}
        <div className="space-y-4 hidden md:block">
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Layout Specimens</h3>
          <div className="space-y-4">
            {SLIP_OPTIONS.map((opt) => (
              <div 
                key={opt.id}
                onClick={() => setLightbox({ isOpen: true, src: opt.img, label: opt.label })}
                className="bg-card border border-border rounded-2xl p-3 shadow-sm hover:border-primary/40 group transition-all duration-200 cursor-pointer overflow-hidden text-center relative"
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-white font-bold gap-2 text-xs">
                  <MagnifyingGlass weight="bold" /> Enlarge Layout
                </div>
                <div className="relative w-full h-28 rounded-lg bg-secondary/50 border border-border overflow-hidden mb-2">
                  <Image src={opt.img} alt={opt.label} fill className="object-cover blur-[0.5px] brightness-95" />
                </div>
                <span className="text-xs font-black text-foreground">{opt.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ISOLATED HISTORY COMPONENT */}
      <NinHistorySection history={history} />

      {/* ISOLATED RESULT MODAL COMPONENT */}
      <NinResultModal
        isOpen={resultModal.isOpen}
        status={resultModal.status}
        nin={resultModal.nin}
        slipLabel={resultModal.slipLabel}
        pdfBase64={resultModal.pdfBase64}
        errorMsg={resultModal.errorMsg}
        onClose={() => setResultModal({ isOpen: false, status: "loading" })}
      />

      {/* BEAUTIFUL CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#ff3f7a]/10 border-b border-[#ff3f7a]/20 p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[#ff3f7a] text-white flex items-center justify-center shadow-md shadow-[#ff3f7a]/20">
                  <Question size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">Confirm Slip Generation</h3>
                  <p className="text-xs text-muted-foreground font-medium">Please review before charging your wallet</p>
                </div>
              </div>
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 text-muted-foreground hover:text-foreground rounded-full hover:bg-secondary transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Slip Specimen Preview */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Selected Layout Specimen</span>
                <div className="relative w-full h-36 rounded-2xl bg-secondary/50 border border-border overflow-hidden flex items-center justify-center p-2">
                  <Image src={confirmModal.imgUrl} alt={confirmModal.slipLabel} fill className="object-contain drop-shadow-md" />
                </div>
              </div>

              {/* Transaction Summary Box */}
              <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Target NIN:</span>
                  <span className="text-foreground tracking-widest font-mono font-black text-sm">{confirmModal.nin}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Slip Format:</span>
                  <span className="text-foreground">{confirmModal.slipLabel}</span>
                </div>
                <div className="border-t border-border/60 pt-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                    <Wallet size={16} className="text-[#ff3f7a]" weight="fill" /> Wallet Deduction:
                  </span>
                  <span className="text-base font-black text-[#ff3f7a]">
                    ₦{confirmModal.price.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-medium text-center leading-relaxed">
                By confirming, <strong className="text-foreground">₦{confirmModal.price.toLocaleString()}</strong> will be debited from your wallet balance immediately to query the NIMC database.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="h-12 rounded-xl font-bold border-border bg-transparent hover:bg-secondary cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  onClick={executeSlipGeneration}
                  className="h-12 rounded-xl font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62] shadow-lg shadow-[#ff3f7a]/25 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkle size={18} weight="fill" />
                  Confirm & Pay
                </Button>
              </div>

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

    </div>
  );
}
