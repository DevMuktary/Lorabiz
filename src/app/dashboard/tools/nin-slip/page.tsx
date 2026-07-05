"use client";

import { useState } from "react";
import Image from "next/image";
import { 
  IdentificationCard, ShieldWarning, DownloadSimple, 
  CircleNotch, WarningCircle, Eye, MagnifyingGlass, Check
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NinSlipPage() {
  const [nin, setNin] = useState("");
  const [slipType, setSlipType] = useState<"nin_premium" | "nin_standard" | "nin_regular">("nin_regular");
  
  // Dual Attestations for platform indemnity
  const [attestation1, setAttestation1] = useState(false);
  const [attestation2, setAttestation2] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ isOpen: boolean; src: string; label: string }>({
    isOpen: false, src: "", label: ""
  });

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{11}$/.test(nin)) {
      setError("NIN must be exactly 11 digits.");
      return;
    }
    if (!attestation1 || !attestation2) {
      setError("You must check all legal attestations to protect your filing.");
      return;
    }

    setLoading(true);
    setError(null);

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
        setError(data.message || "Failed to download slip.");
        setLoading(false);
        return;
      }

      // Convert Base64 string from backend back into a client file download trigger
      const linkSource = `data:application/pdf;base64,${data.pdfBase64}`;
      const downloadLink = document.createElement("a");
      downloadLink.href = linkSource;
      downloadLink.download = `nin_slip_${nin}.pdf`;
      downloadLink.click();
      
      setLoading(false);
    } catch (err) {
      setError("Network connectivity problem. Please check your data connection.");
      setLoading(false);
    }
  };

  const SLIP_OPTIONS = [
    { id: "nin_regular" as const, label: "Regular Slip", desc: "Long official layout accepted by CAC for Business Name filings.", img: "/examples/nin_regular_example.png" },
    { id: "nin_premium" as const, label: "Premium Slip", desc: "Full-colour card design, optimized for wallet cutting or plastic printing.", img: "/examples/nin_premium_example.png" },
    { id: "nin_standard" as const, label: "Standard Slip", desc: "Compact layout containing high-density biometric parameters.", img: "/examples/nin_standard_example.png" },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-20">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 border-b border-border pb-5">
        <div className="h-12 w-12 rounded-2xl bg-[#ff3f7a]/10 text-[#ff3f7a] flex items-center justify-center border border-[#ff3f7a]/25 shrink-0">
          <IdentificationCard size={28} weight="fill" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Official NIN Slip Downloader</h1>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">Secure direct lookup integration via the National Identity Management database.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* CONFIGURATION COLUMN */}
        <form onSubmit={handleDownload} className="md:col-span-2 space-y-6">
          
          {/* ERROR ALERT DISPLAY */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-sm font-bold flex items-center gap-2.5 animate-in shake">
              <WarningCircle weight="fill" size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* INPUT FORM FIELD */}
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
                disabled={loading}
                placeholder="Enter 11-digit identification number"
                className="pl-14 h-12 text-base tracking-[3px] font-black bg-secondary/30 border-border text-foreground focus-visible:ring-[#ff3f7a]"
              />
            </div>
          </div>

          {/* DYNAMIC CARD LAYOUT FOR CARD TYPES */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest border-b border-border pb-2">Select Preferred Slip Print Variant</h3>
            <div className="space-y-3">
              {SLIP_OPTIONS.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => !loading && setSlipType(opt.id)}
                  className={`border-2 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all duration-200 bg-card ${slipType === opt.id ? "border-[#ff3f7a] shadow-md shadow-[#ff3f7a]/5" : "border-border hover:border-muted-foreground/30 cursor-pointer"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${slipType === opt.id ? "border-[#ff3f7a] bg-[#ff3f7a] text-white" : "border-muted-foreground"}`}>
                      {slipType === opt.id && <Check weight="bold" size={12} />}
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-foreground">{opt.label}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed font-medium max-w-md">{opt.desc}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightbox({ isOpen: true, src: opt.img, label: opt.label });
                    }}
                    className="p-2 bg-secondary border border-border text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
                    title="View Example Format"
                  >
                    <Eye size={18} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* LEGAL ATTESTATIONS (LEGAL PROTECTION BULLET) */}
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
                  disabled={loading}
                  onChange={(e) => setAttestation1(e.target.checked)}
                  className="mt-1 accent-[#ff3f7a] h-4 w-4 shrink-0 rounded border-border"
                />
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  I hereby authorize LoraBiz to look up and retrieve my verification data from the identity repository strictly for corporate onboarding purposes.
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group select-none">
                <input 
                  type="checkbox"
                  checked={attestation2}
                  disabled={loading}
                  onChange={(e) => setAttestation2(e.target.checked)}
                  className="mt-1 accent-[#ff3f7a] h-4 w-4 shrink-0 rounded border-border"
                />
                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  I clarify that I am the rightful owner of this identity profile or have obtained clear third-party consent. I fully indemnify LoraBiz from any external liability arising from unauthorized database queries.
                </span>
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={loading || !attestation1 || !attestation2 || nin.length !== 11}
            className="w-full h-14 font-black bg-[#ff3f7a] text-white hover:bg-[#e02b62] rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#ff3f7a]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <><CircleNotch className="animate-spin h-5 w-5" weight="bold" /> Fetching Document...</>
            ) : (
              <><DownloadSimple size={20} weight="bold" /> Download Verified PDF Slip</>
            )}
          </Button>

        </form>

        {/* SIDE BAR LAYOUT FOR CONVENIENT SAMPLE PREVIEWS */}
        <div className="space-y-4 hidden md:block">
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Format Samples</h3>
          <div className="space-y-4">
            {SLIP_OPTIONS.map((opt) => (
              <div 
                key={opt.id}
                onClick={() => setLightbox({ isOpen: true, src: opt.img, label: opt.label })}
                className="bg-card border border-border rounded-2xl p-3 shadow-sm hover:border-primary/40 group transition-all duration-200 cursor-pointer overflow-hidden text-center relative"
              >
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 text-white font-bold gap-2 text-xs">
                  <MagnifyingGlass weight="bold" /> Enlarge Format
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

      {/* COMPACT LIGHTBOX OVERLAY VIA PORTAL LOGIC */}
      {lightbox.isOpen && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setLightbox({ isOpen: false, src: "", label: "" })}
        >
          <div className="relative w-full max-w-xl flex flex-col items-center animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="w-full bg-card border border-border px-5 py-3 rounded-t-2xl flex items-center justify-between">
              <span className="text-sm font-black text-foreground">{lightbox.label} Specimen Layout</span>
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

// Icon Wrapper Configuration Shortcut
const X = ({ weight, size }: any) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 256 236" style={{ transform: weight==='bold' ? 'scale(1)' : 'none' }}>
    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
  </svg>
);
