"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  Sparkle, 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  Phone, 
  Check, 
  X, 
  Copy, 
  ArrowsClockwise,
  Spinner,
  ShieldCheck,
  ListDashes,
  Plus,
  Wallet
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface DataPlan {
  id: string;
  planId: number;
  network: string;
  category: string;
  name: string;
  price: number | string;
  costPrice?: number | string | null;
  validity?: string | null;
  capacity?: string | null;
  isActive: boolean;
}

interface DataTransaction {
  reference: string;
  phone: string;
  planName: string;
  amount: number;
  network: string;
  date: Date;
}

const NETWORKS = [
  { id: "MTN", name: "MTN", logo: "/mtn.png", color: "border-yellow-400 bg-yellow-400/10 shadow-amber-500/20", available: true },
  { id: "AIRTEL", name: "Airtel", logo: "/airtel.png", color: "border-red-500 bg-red-500/10 shadow-rose-500/20", available: true },
  { id: "GLO", name: "Glo", logo: "/glo.png", color: "border-green-500 bg-green-500/10 shadow-emerald-500/20", available: true },
  { id: "9MOBILE", name: "9mobile", logo: "/9mobile.png", color: "border-emerald-700 bg-emerald-700/10 shadow-emerald-700/20", available: false },
];

const CATEGORY_NAMES: Record<string, string> = {
  ALL: "All Plans",
  SME: "SME Data",
  DATA_SHARE: "Data Share",
  GIFTING: "Direct Gifting",
  CORPORATE: "Corporate CG",
  AWOOF: "Awoof / Specials",
  LITE: "SME Lite",
};

export default function MobileDataPage() {
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [groupedPlans, setGroupedPlans] = useState<Record<string, DataPlan[]>>({});
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [history, setHistory] = useState<DataTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [selectedNetwork, setSelectedNetwork] = useState<string>("MTN");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phone, setPhone] = useState("");
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Process & Modal States
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<DataTransaction | null>(null);

  // Fetch Plans, Wallet, and History
  const fetchData = async () => {
    try {
      const [plansRes, walletRes, txRes] = await Promise.all([
        fetch("/api/utilities/mobile-data", { cache: "no-store" }),
        fetch("/api/user/wallet", { cache: "no-store" }),
        fetch("/api/user/transactions?status=SUCCESS", { cache: "no-store" }),
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        if (pData.success) {
          setPlans(pData.plans || []);
          setGroupedPlans(pData.grouped || {});
        }
      }

      if (walletRes.ok) {
        const wData = await walletRes.json();
        if (wData.success && wData.wallet) {
          setWalletBalance(Number(wData.wallet.balance));
        }
      }

      if (txRes.ok) {
        const tData = await txRes.json();
        if (tData.success && tData.transactions) {
          const dataTxs = tData.transactions
            .filter((tx: any) => tx.description && tx.description.includes("Mobile Data"))
            .map((tx: any) => {
              const match = tx.description.match(/Mobile Data - (.+) \((\d+)\)/);
              return {
                reference: tx.reference,
                planName: match ? match[1] : "Data Bundle",
                phone: match ? match[2] : "Unknown",
                amount: Number(tx.amount),
                network: tx.description.includes("MTN") ? "MTN" : tx.description.includes("AIRTEL") ? "AIRTEL" : tx.description.includes("GLO") ? "GLO" : "Telecom",
                date: new Date(tx.createdAt),
              };
            });
          setHistory(dataTxs);
        }
      }
    } catch (err) {
      console.error("Failed to load mobile data page:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter plans based on selected network and category
  const availablePlansForNetwork = useMemo(() => {
    return (groupedPlans[selectedNetwork] || []).filter((p) => p.isActive);
  }, [groupedPlans, selectedNetwork]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    availablePlansForNetwork.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["ALL", ...Array.from(cats)];
  }, [availablePlansForNetwork]);

  const displayedPlans = useMemo(() => {
    if (selectedCategory === "ALL") return availablePlansForNetwork;
    return availablePlansForNetwork.filter((p) => p.category === selectedCategory);
  }, [availablePlansForNetwork, selectedCategory]);

  // Reset selected plan if not in current displayed plans
  useEffect(() => {
    if (selectedPlan && selectedPlan.network !== selectedNetwork) {
      setSelectedPlan(null);
    }
  }, [selectedNetwork, selectedPlan]);

  const cleanPhone = phone.replace(/\s+/g, "").replace(/^\+234/, "0");
  const isPhoneValid = /^\d{11}$/.test(cleanPhone);
  const selectedPlanPrice = selectedPlan ? Number(selectedPlan.price) : 0;
  const isInsufficientBalance = walletBalance < selectedPlanPrice;

  // Auto Network Detector
  const detectedNetwork = useMemo(() => {
    if (cleanPhone.length < 4) return null;
    const prefix = cleanPhone.slice(0, 4);
    const mtnPrefixes = ["0803", "0806", "0703", "0706", "0813", "0816", "0810", "0814", "0903", "0906", "0913", "0916"];
    const airtelPrefixes = ["0802", "0808", "0708", "0812", "0701", "0902", "0901", "0904", "0907", "0912", "0911"];
    const gloPrefixes = ["0805", "0807", "0705", "0815", "0811", "0905", "0915"];
    const nineMobilePrefixes = ["0809", "0818", "0817", "0909", "0908"];

    if (mtnPrefixes.includes(prefix)) return "MTN";
    if (airtelPrefixes.includes(prefix)) return "AIRTEL";
    if (gloPrefixes.includes(prefix)) return "GLO";
    if (nineMobilePrefixes.includes(prefix)) return "9MOBILE";
    return null;
  }, [cleanPhone]);

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorToast(null);

    if (!selectedPlan) {
      setErrorToast("Please choose a data plan bundle to proceed.");
      return;
    }
    if (!isPhoneValid) {
      setErrorToast("Please enter a valid 11-digit phone number (e.g. 08012345678).");
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleExecutePurchase = async () => {
    if (!selectedPlan) return;
    setShowConfirmModal(false);
    setIsProcessing(true);
    setErrorToast(null);

    try {
      const res = await fetch("/api/utilities/mobile-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.planId,
          phone: cleanPhone,
          network: selectedPlan.network,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const newTx: DataTransaction = {
          reference: data.reference || `ref_${Date.now()}`,
          phone: cleanPhone,
          planName: selectedPlan.name,
          amount: selectedPlanPrice,
          network: selectedPlan.network,
          date: new Date(),
        };

        setWalletBalance(data.newBalance);
        setHistory((prev) => [newTx, ...prev]);
        setCurrentReceipt(newTx);
      } else {
        setErrorToast(data.message || "Failed to complete data vending.");
      }
    } catch (err: any) {
      setErrorToast(err.message || "A network error occurred. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 pt-4 font-sans relative space-y-6 animate-in fade-in duration-200">
      
      {/* Top Breadcrumb */}
      <Link 
        href="/dashboard/utilities" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Utilities
      </Link>

      {/* Slide-in Error Toast */}
      {errorToast && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm font-bold flex items-center justify-between gap-3 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} weight="fill" className="shrink-0" />
            <span>{errorToast}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorToast(null)} 
            className="text-xs text-destructive hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex items-center gap-3.5 border-b border-border pb-5">
        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
          <Image 
            src="/airtime.png" 
            alt="Mobile Data Logo" 
            width={38} 
            height={38} 
            className="object-contain" 
            priority 
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
            <ShieldCheck weight="bold" className="h-3 w-3" />
            Automated Telecom Data Gateway
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">Mobile Data Vending</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">
            Instant SME, Direct Gifting, Corporate &amp; Awoof bundles delivered to recipient SIMs.
          </p>
        </div>
      </div>

      {/* Main Form + Plans Selection Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Plan Selector */}
        <div className="lg:col-span-7 space-y-6">
          
          <form onSubmit={handleOpenConfirm} className="bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
            
            {/* 1. SELECT NETWORK */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>1. Select Network Provider <span className="text-destructive">*</span></span>
                {detectedNetwork && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Detected: {detectedNetwork}
                  </span>
                )}
              </label>

              <div className="grid grid-cols-4 gap-2.5">
                {NETWORKS.map((net) => {
                  const isSelected = selectedNetwork === net.id;

                  if (!net.available) {
                    return (
                      <div
                        key={net.id}
                        className="relative h-16 rounded-2xl border-2 border-border/50 bg-secondary/20 opacity-50 cursor-not-allowed flex flex-col items-center justify-center p-2 text-center"
                        title="Currently unavailable from provider"
                      >
                        <Image src={net.logo} alt={net.name} width={28} height={28} className="object-contain grayscale opacity-60 mb-0.5" />
                        <span className="text-[8px] font-black uppercase text-destructive">
                          Unavailable
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => {
                        setSelectedNetwork(net.id);
                        setSelectedCategory("ALL");
                        if (errorToast) setErrorToast(null);
                      }}
                      className={`relative h-16 rounded-2xl border-2 transition-all flex flex-col items-center justify-center p-2 cursor-pointer ${
                        isSelected 
                          ? `${net.color} shadow-md scale-[1.02]` 
                          : "border-border hover:border-primary/40 bg-secondary/30 grayscale opacity-75 hover:grayscale-0 hover:opacity-100"
                      }`}
                    >
                      <Image src={net.logo} alt={net.name} width={34} height={34} className="object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SELECT CATEGORY TABS */}
            {availableCategories.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  2. Filter Plan Type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map((cat) => {
                    const isCatActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          if (errorToast) setErrorToast(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isCatActive
                            ? "bg-foreground text-background shadow-xs"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {CATEGORY_NAMES[cat] || cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. SELECT DATA PLAN BUNDLE (Natural Grid Layout without inner scroll trap) */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>3. Choose Data Bundle <span className="text-destructive">*</span></span>
                <span className="text-[11px] font-medium text-muted-foreground">
                  {isLoading ? "Loading plans..." : `${displayedPlans.length} plans available`}
                </span>
              </label>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 border border-border border-dashed rounded-2xl bg-secondary/10">
                  <ArrowsClockwise size={24} className="animate-spin text-emerald-600" weight="bold" />
                  <span className="text-xs text-muted-foreground">Loading active bundles...</span>
                </div>
              ) : displayedPlans.length === 0 ? (
                <div className="p-6 text-center border border-border border-dashed rounded-2xl bg-secondary/20">
                  <p className="text-xs text-muted-foreground">No active plans available for this category right now.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {displayedPlans.map((plan) => {
                    const isPlanSelected = selectedPlan?.planId === plan.planId;
                    return (
                      <button
                        key={plan.planId}
                        type="button"
                        onClick={() => {
                          setSelectedPlan(plan);
                          if (errorToast) setErrorToast(null);
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isPlanSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-500/10 shadow-sm"
                            : "bg-background border-border hover:border-emerald-500/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-black text-foreground">{plan.capacity || plan.name}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{plan.validity || "30D"}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{plan.name}</p>
                        </div>
                        <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            ₦{Number(plan.price).toLocaleString()}
                          </span>
                          {isPlanSelected && (
                            <Check size={12} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. RECIPIENT PHONE NUMBER */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone size={15} weight="bold" />
                  <span>Recipient Phone Number <span className="text-destructive">*</span></span>
                </span>
                <span className="font-mono text-[11px]">{cleanPhone.length}/11</span>
              </label>
              <input
                type="tel"
                required
                maxLength={14}
                placeholder="e.g. 08012345678"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errorToast) setErrorToast(null);
                }}
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground font-mono text-sm tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              disabled={!selectedPlan || !isPhoneValid || isProcessing}
              className="w-full h-12 font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Spinner size={16} className="animate-spin" weight="bold" />
                  <span>Processing Vending...</span>
                </>
              ) : (
                <>
                  <Sparkle size={18} weight="fill" />
                  <span>
                    {selectedPlan 
                      ? `Buy ${selectedPlan.name} (₦${Number(selectedPlan.price).toLocaleString()})`
                      : "Select a Data Plan"}
                  </span>
                </>
              )}
            </Button>

          </form>

        </div>

        {/* Right Column: History & Concise Helper Note */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* History Card */}
          <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ListDashes size={18} weight="bold" />
                </div>
                <h3 className="text-sm font-black text-foreground">Recent Data Purchases</h3>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">{history.length} purchases</span>
            </div>

            {history.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Clock size={24} className="text-muted-foreground mx-auto" weight="duotone" />
                <p className="text-xs text-muted-foreground">Your recent mobile data purchases will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[360px] overflow-y-auto pr-1">
                {history.slice(0, 10).map((tx) => (
                  <div 
                    key={tx.reference} 
                    onClick={() => setCurrentReceipt(tx)}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-secondary/30 rounded-xl px-2 cursor-pointer transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-foreground">{tx.planName}</span>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                          {tx.network}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-muted-foreground">{tx.phone}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                        ₦{tx.amount.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Concise Delivery Notice */}
          <div className="bg-secondary/30 border border-border/80 rounded-2xl p-4 text-xs text-muted-foreground space-y-1.5">
            <h4 className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkle size={14} weight="fill" className="text-emerald-500" />
              <span>Instant Data Delivery</span>
            </h4>
            <p className="leading-relaxed text-[11px]">
              Data subscriptions are credited to the recipient SIM within seconds. Check data balance using standard operator USSD codes (*323# on MTN/Airtel, *310# on Glo).
            </p>
          </div>

        </div>

      </div>

      {/* MODAL 1: Confirmation Modal (With crying emoji on insufficient balance) */}
      {showConfirmModal && selectedPlan && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-6 duration-300 text-left my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {isInsufficientBalance ? "Insufficient Balance" : "Confirm Data Purchase"}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{selectedPlan.network} Telecom Network</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={14} weight="bold" />
              </button>
            </div>

            {/* Insufficient balance state with crying emoji */}
            {isInsufficientBalance ? (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">😭</span>
                    <div>
                      <h4 className="font-black text-sm text-foreground">You don&apos;t have enough balance</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Please top up your wallet to buy this data bundle.</p>
                    </div>
                  </div>
                  <div className="bg-background/80 dark:bg-background/50 rounded-xl p-3 border border-border text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Required Price:</span>
                      <span className="font-bold text-destructive">₦{selectedPlanPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-bold text-foreground">₦{walletBalance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t border-border/60 pt-1.5">
                      <span className="text-muted-foreground font-semibold">Shortfall:</span>
                      <span className="font-black text-destructive">₦{(selectedPlanPrice - walletBalance).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Link 
                    href="/dashboard/wallet"
                    className="w-full h-11 bg-primary text-primary-foreground font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:opacity-90 cursor-pointer"
                  >
                    <Wallet size={16} weight="bold" />
                    <span>Fund Wallet</span>
                  </Link>
                  <Button variant="outline" onClick={() => setShowConfirmModal(false)} className="h-10 text-xs font-bold cursor-pointer">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              /* Sufficient balance confirmation */
              <div className="space-y-4">
                <div className="bg-secondary/40 border border-border rounded-2xl p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Provider:</span>
                    <span className="font-bold text-foreground">{selectedPlan.network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data Plan:</span>
                    <span className="font-bold text-foreground">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recipient Phone:</span>
                    <span className="font-mono font-bold text-foreground">{cleanPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount to Debit:</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₦{selectedPlanPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/60 pt-2">
                    <span className="text-muted-foreground">Balance After:</span>
                    <span className="font-bold text-foreground">₦{(walletBalance - selectedPlanPrice).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Upon confirmation, <strong>₦{selectedPlanPrice.toLocaleString()}</strong> will be debited from your wallet and credited to <strong>{cleanPhone}</strong>.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 h-11 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleExecutePurchase}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Confirm &amp; Vend Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Receipt Modal */}
      {currentReceipt && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setCurrentReceipt(null)}
        >
          <div 
            className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-5 animate-in slide-in-from-bottom-6 duration-300 text-center my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle size={32} weight="fill" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                Transaction Successful
              </span>
              <h3 className="text-xl font-black text-foreground">Data Bundle Delivered</h3>
              <p className="text-xs text-muted-foreground">Your data subscription is active on the recipient SIM.</p>
            </div>

            <div className="bg-secondary/40 border border-border rounded-2xl p-4 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan:</span>
                <span className="font-bold text-foreground">{currentReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-mono font-bold text-foreground">{currentReceipt.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-black text-foreground">₦{currentReceipt.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-[10px] text-muted-foreground">{currentReceipt.reference}</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setCurrentReceipt(null)}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
            >
              Done
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
