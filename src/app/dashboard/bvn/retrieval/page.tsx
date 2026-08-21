"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ShieldCheck, WarningCircle, 
  Sparkle, ListDashes, SpinnerGap, Phone, User
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import BvnRetrievalIntroModal from "@/components/features/bvn/BvnRetrievalIntroModal";
import BvnRetrievalConfirmationModal from "@/components/features/bvn/BvnRetrievalConfirmationModal";

export default function BvnRetrievalPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showIntroModal, setShowIntroModal] = useState(true);
  
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);
  
  const [price, setPrice] = useState<number>(2500);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Pricing, Status, and Wallet Balance dynamically
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusRes, walletRes] = await Promise.all([
          fetch("/api/bvn/retrieval/status", { cache: "no-store" }),
          fetch("/api/user/wallet", { cache: "no-store" }).catch(() => fetch("/api/wallet")),
        ]);

        if (statusRes.ok) {
          const sData = await statusRes.json();
          if (typeof sData.price === "number") setPrice(sData.price);
          if (typeof sData.isActive === "boolean") setIsActive(sData.isActive);
          if (sData.maintenanceMsg) setMaintenanceMsg(sData.maintenanceMsg);
        }

        if (walletRes && walletRes.ok) {
          const wData = await walletRes.json();
          if (wData.success && typeof wData.balance === "number") {
            setWalletBalance(wData.balance);
          } else if (typeof wData.balance === "number") {
            setWalletBalance(wData.balance);
          }
        }
      } catch (err) {
        console.error("Failed to load BVN Retrieval page data:", err);
      }
    };

    loadData();
  }, []);

  const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");
  const isPhoneValid = /^\d{11}$/.test(cleanPhone);
  const isNameValid = fullName.trim().length >= 3;
  const isFormValid = isNameValid && isPhoneValid && consent1 && consent2 && isActive;

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNameValid) {
      setError("Please enter the full legal name registered on the BVN.");
      return;
    }
    if (!isPhoneValid) {
      setError("Please enter a valid 11-digit phone number (e.g. 08012345678).");
      return;
    }
    if (!consent1 || !consent2) {
      setError("Please accept all statutory declarations before continuing.");
      return;
    }
    setError(null);
    setIsConfirmModalOpen(true);
  };

  const handleExecuteSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/bvn/retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: cleanPhone,
          attestationsAccepted: consent1 && consent2,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit BVN Retrieval request. Please try again.");
      }

      setIsConfirmModalOpen(false);
      router.push("/dashboard/bvn/retrieval/history?success=true");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsConfirmModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-24 animate-in fade-in duration-300">
      
      {/* Statutory Notice Modal on Page Load */}
      <BvnRetrievalIntroModal 
        isOpen={mounted && showIntroModal} 
        onClose={() => setShowIntroModal(false)} 
      />

      {/* Top Breadcrumb Navigation */}
      <Link 
        href="/dashboard/bvn" 
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" />
        Back to BVN Services
      </Link>

      {/* Header Banner */}
      <div className="border-b border-border pb-6 space-y-4">
        <div className="flex items-center gap-4">
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
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              NIBSS Bank Verification Number Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              BVN Number Retrieval
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
              Recover your forgotten 11-digit BVN using your full registered name and linked phone number.
            </p>
          </div>
        </div>

        {/* Action Button: Retrieval History (Underneath Description) */}
        <div>
          <Link
            href="/dashboard/bvn/retrieval/history"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-bold transition-all w-fit cursor-pointer shadow-sm"
          >
            <ListDashes size={16} weight="bold" />
            <span>View Retrieval History</span>
          </Link>
        </div>
      </div>

      {/* Maintenance Alert if applicable */}
      {!isActive && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-3 text-destructive text-sm font-bold animate-in shake">
          <WarningCircle size={22} weight="fill" className="shrink-0" />
          <span>{maintenanceMsg || "BVN Retrieval service is temporarily unavailable for scheduled maintenance."}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleOpenConfirm} className="space-y-6">
        
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl text-destructive text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in shake">
            <WarningCircle weight="fill" size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Fields Container */}
        <div className="space-y-5 bg-card border border-border p-5 sm:p-7 rounded-3xl shadow-sm">
          
          {/* Full Name */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User size={15} weight="bold" />
              <span>Full Name on BVN Account <span className="text-destructive">*</span></span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. John Chukwuemeka Adebayo"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-muted-foreground/60"
            />
            <p className="text-[11px] text-muted-foreground">
              Provide the exact first, middle, and last names registered with your bank.
            </p>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone size={15} weight="bold" />
                <span>Linked Phone Number <span className="text-destructive">*</span></span>
              </span>
              <span className="font-mono text-[11px]">{cleanPhone.length}/11</span>
            </label>
            <input
              type="tel"
              required
              maxLength={14}
              placeholder="08012345678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-muted-foreground/60"
            />
            <p className="text-[11px] text-muted-foreground">
              The registered telephone number linked with this BVN.
            </p>
          </div>

        </div>

        {/* Declarations / Checkboxes */}
        <div className="space-y-3 p-4 sm:p-5 bg-card border border-border rounded-2xl text-xs text-muted-foreground">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              required
              checked={consent1}
              onChange={(e) => {
                setConsent1(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border cursor-pointer"
            />
            <span>I attest that I am the legal owner or duly authorized representative requesting retrieval of this BVN record.</span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox"
              required
              checked={consent2}
              onChange={(e) => {
                setConsent2(e.target.checked);
                if (error) setError(null);
              }}
              className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-border cursor-pointer"
            />
            <span>I understand that this service takes 1 to 24 hours to process and I will be notified via email upon completion.</span>
          </label>
        </div>

        {/* Submit Action */}
        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="w-full h-12 sm:h-13 font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <SpinnerGap size={18} className="animate-spin" weight="bold" />
              <span>Submitting Request...</span>
            </>
          ) : (
            <>
              <Sparkle size={18} weight="fill" />
              <span>Submit BVN Retrieval Request</span>
            </>
          )}
        </Button>

      </form>

      {/* Confirmation Modal with Dynamic Insufficient Balance Check */}
      <BvnRetrievalConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteSubmit}
        isLoading={isSubmitting}
        fullName={fullName.trim()}
        phone={cleanPhone}
        price={price}
        walletBalance={walletBalance}
      />

    </div>
  );
}
