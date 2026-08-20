"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, ShieldCheck, CheckCircle, WarningCircle, 
  Sparkle, Clock, ListDashes, Wallet, Check, SpinnerGap, Info, Phone, User
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function BvnRetrievalPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
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

  // Fetch Pricing, Status, and Wallet Balance
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

  const isInsufficient = walletBalance < price;
  const remainingBalance = Math.max(0, walletBalance - price);
  const shortfall = Math.max(0, price - walletBalance);

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
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link 
          href="/dashboard/bvn" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to BVN Services
        </Link>

        <Link
          href="/dashboard/bvn/retrieval/history"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-secondary border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary text-xs font-bold transition-all w-fit cursor-pointer shadow-sm"
        >
          <ListDashes size={16} weight="bold" />
          <span>View Retrieval History</span>
        </Link>
      </div>

      {/* Header Banner */}
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
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <ShieldCheck weight="bold" className="h-3 w-3" />
            NIBSS Verified Recovery
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            BVN Number Retrieval
          </h1>
          <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
            Recover your forgotten 11-digit Bank Verification Number via official NIBSS record lookup.
          </p>
        </div>
      </div>

      {/* Turnaround Badge */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start sm:items-center gap-3">
        <Clock size={22} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs sm:text-sm text-foreground">
          <span className="font-bold">Turnaround Time:</span> Official search and recovery is typically fulfilled within{" "}
          <strong className="text-emerald-600 dark:text-emerald-400 font-black">1 to 24 hours</strong>. You will receive an automated email notification once completed.
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

          {/* Fee & Wallet Breakdown */}
          <div className="bg-secondary/40 border border-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-muted-foreground font-medium">Service Fee:</span>
              <p className="text-lg font-black text-foreground">₦{price.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground font-medium">Your Wallet Balance:</span>
              <p className={`text-base font-black ${isInsufficient ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                ₦{walletBalance.toLocaleString()}
              </p>
            </div>
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

      {/* Confirmation & Insufficient Balance Modal */}
      {mounted && isConfirmModalOpen && (
        <div 
          className="fixed inset-0 h-full w-full min-h-[100dvh] z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
          onClick={() => !isSubmitting && setIsConfirmModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-6 fade-in duration-300 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isInsufficient ? "Insufficient Balance" : "Confirm BVN Retrieval"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Official NIBSS Recovery Request</p>
                </div>
              </div>
            </div>

            {/* Content Body */}
            {isInsufficient ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                  <Wallet size={24} weight="bold" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-foreground text-sm">Wallet Top-up Required</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This retrieval service costs <strong>₦{price.toLocaleString()}</strong>. Your current balance is{" "}
                    <span className="text-destructive font-bold">₦{walletBalance.toLocaleString()}</span> (Shortfall: ₦{shortfall.toLocaleString()}).
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/dashboard/wallet"
                    className="w-full h-11 bg-primary text-primary-foreground font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/20"
                  >
                    <Wallet size={16} weight="bold" />
                    <span>Fund Wallet Now</span>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="w-full h-10 text-xs font-bold text-muted-foreground"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-secondary/40 border border-border p-4 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-bold text-foreground text-right">{fullName.trim()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Linked Phone:</span>
                    <span className="font-mono font-bold text-foreground">{cleanPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Fee:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₦{price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2">
                    <span className="text-muted-foreground">Remaining Balance:</span>
                    <span className="font-bold text-foreground">₦{remainingBalance.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Upon confirmation, <strong>₦{price.toLocaleString()}</strong> will be debited from your wallet and queued for recovery within 1 to 24 hours.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsConfirmModalOpen(false)}
                    disabled={isSubmitting}
                    className="flex-1 h-11 text-xs font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecuteSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <>
                        <SpinnerGap size={14} className="animate-spin" weight="bold" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} weight="bold" />
                        <span>Yes, Submit</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
