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
  ArrowsClockwise,
  Spinner,
  ShieldCheck,
  ListDashes,
  Wallet,
  CaretLeft,
  CaretRight,
  Receipt,
  DownloadSimple,
  ShareNetwork
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
  status: string;
  date: Date;
}

const NETWORKS = [
  { id: "MTN", name: "MTN", logo: "/mtn.png", color: "border-yellow-400 bg-yellow-400/10 shadow-amber-500/20" },
  { id: "AIRTEL", name: "Airtel", logo: "/airtel.png", color: "border-red-500 bg-red-500/10 shadow-rose-500/20" },
  { id: "GLO", name: "Glo", logo: "/glo.png", color: "border-green-500 bg-green-500/10 shadow-emerald-500/20" },
  { id: "9MOBILE", name: "9mobile", logo: "/9mobile.png", color: "border-emerald-700 bg-emerald-700/10 shadow-emerald-700/20" },
];

const CATEGORY_NAMES: Record<string, string> = {
  ALL: "All Types",
  SME: "SME Data",
  DATA_SHARE: "Data Share",
  GIFTING: "Direct Gifting",
  CORPORATE: "Corporate CG",
  AWOOF: "Awoof / Specials",
  LITE: "SME Lite",
  COUPON: "Data Coupon",
  CLOUD: "Cloud Bundles",
};

const LOGO_MAP: Record<string, string> = {
  MTN: "/mtn.png",
  AIRTEL: "/airtel.png",
  GLO: "/glo.png",
  "9MOBILE": "/9mobile.png",
};

export default function MobileDataPage() {
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [groupedPlans, setGroupedPlans] = useState<Record<string, DataPlan[]>>({});
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [history, setHistory] = useState<DataTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form & Filter States
  const [selectedNetwork, setSelectedNetwork] = useState<string>("MTN");
  const [selectedValidityFilter, setSelectedValidityFilter] = useState<string>("ALL"); // "ALL" | "DAILY" | "WEEKLY" | "MONTHLY"
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [phone, setPhone] = useState("");
  
  // Slide-in side toast state
  const [toastNotification, setToastNotification] = useState<{ type: "success" | "error"; title: string; message: string } | null>(null);

  // Process & Modal States
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<DataTransaction | null>(null);

  // History Pagination State
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 5;

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

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
          // Strictly isolate MOBILE DATA transactions that are completed & delivered
          const dataTxs = tData.transactions
            .filter((tx: any) => {
              const desc = (tx.description || "").toLowerCase();
              const isAirtime = desc.includes("airtime") || tx.serviceCategory === "AIRTIME";
              const isData = tx.serviceCategory === "MOBILE_DATA" || desc.includes("mobile data") || desc.includes("data bundle");
              return isData && !isAirtime && tx.type === "DEBIT" && tx.status === "SUCCESS";
            })
            .map((tx: any) => {
              const desc = tx.description || "";
              const match = desc.match(/Mobile Data (?:- )?(.+) \((\d+)\)/i);
              const phoneMatch = desc.match(/(\d{11})/);

              let net = "MTN";
              const upperDesc = desc.toUpperCase();
              if (upperDesc.includes("AIRTEL")) net = "AIRTEL";
              else if (upperDesc.includes("GLO")) net = "GLO";
              else if (upperDesc.includes("9MOBILE") || upperDesc.includes("ETISALAT")) net = "9MOBILE";
              else if (upperDesc.includes("MTN")) net = "MTN";

              return {
                reference: tx.reference,
                planName: match ? match[1].trim() : (desc.replace(/Mobile Data - /i, "") || "Data Bundle"),
                phone: phoneMatch ? phoneMatch[1] : (match ? match[2] : "Unknown"),
                amount: Number(tx.amount),
                network: net,
                status: "SUCCESS",
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

  // Filter plans based on selected network
  const availablePlansForNetwork = useMemo(() => {
    return (groupedPlans[selectedNetwork] || []).filter((p) => p.isActive);
  }, [groupedPlans, selectedNetwork]);

  // Helper to categorize plan validity into DAILY, WEEKLY, MONTHLY
  const getValidityBucket = (validity?: string | null): "DAILY" | "WEEKLY" | "MONTHLY" => {
    if (!validity) return "MONTHLY";
    const v = validity.toLowerCase();
    if (v.includes("1 day") || v.includes("2 day") || v.includes("3 day") || v.includes("5 day") || v.includes("1day") || v.includes("2day") || v.includes("3day")) {
      return "DAILY";
    }
    if (v.includes("7 day") || v.includes("14 day") || v.includes("7day") || v.includes("14day") || v.includes("week")) {
      return "WEEKLY";
    }
    return "MONTHLY"; // 30 Days, 60 Days, 90 Days, 365 Days, 1 Year, etc.
  };

  // Available categories for current network
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    availablePlansForNetwork.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return ["ALL", ...Array.from(cats)];
  }, [availablePlansForNetwork]);

  // Filter plans by both Validity Tab ("All", "Daily", "Weekly", "Monthly") and Category Pill
  const displayedPlans = useMemo(() => {
    return availablePlansForNetwork.filter((p) => {
      // Validity Filter
      if (selectedValidityFilter !== "ALL") {
        const bucket = getValidityBucket(p.validity);
        if (bucket !== selectedValidityFilter) return false;
      }
      // Category Filter
      if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [availablePlansForNetwork, selectedValidityFilter, selectedCategory]);

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
    setToastNotification(null);

    if (!selectedPlan) {
      setToastNotification({
        type: "error",
        title: "No Plan Selected",
        message: "Please choose a data bundle before proceeding."
      });
      return;
    }
    if (!isPhoneValid) {
      setToastNotification({
        type: "error",
        title: "Invalid Phone Number",
        message: "Please enter a valid 11-digit phone number (e.g. 08012345678)."
      });
      return;
    }
    
    setShowConfirmModal(true);
  };

  const handleExecutePurchase = async () => {
    if (!selectedPlan) return;
    setShowConfirmModal(false);
    setIsProcessing(true);
    setToastNotification(null);

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
          status: "SUCCESS",
          date: new Date(),
        };

        setWalletBalance(data.newBalance);
        setHistory((prev) => [newTx, ...prev]);
        setCurrentReceipt(newTx);
        setToastNotification({
          type: "success",
          title: "Data Bundle Delivered!",
          message: `${selectedPlan.name} successfully delivered to ${cleanPhone}.`
        });
      } else {
        if (data.newBalance !== undefined) {
          setWalletBalance(data.newBalance);
        }
        setToastNotification({
          type: "error",
          title: "Data Vending Failed",
          message: data.message || "Failed to complete data vending. Your wallet has been refunded."
        });
        fetchData();
      }
    } catch (err: any) {
      setToastNotification({
        type: "error",
        title: "Connection Error",
        message: err.message || "Network timeout. Your wallet was refunded. Please try again."
      });
      fetchData();
    } finally {
      setIsProcessing(false);
    }
  };

  // Pagination for History
  const totalHistoryPages = Math.ceil(history.length / historyItemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyItemsPerPage;
    return history.slice(start, start + historyItemsPerPage);
  }, [history, historyPage]);

  // Share receipt
  const handleShare = async () => {
    if (!currentReceipt) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LoraBiz Data Receipt',
          text: `Data Purchase Successful ✅\nPlan: ${currentReceipt.planName}\nNetwork: ${currentReceipt.network}\nPhone: ${currentReceipt.phone}\nAmount: ₦${currentReceipt.amount.toLocaleString()}\nRef: ${currentReceipt.reference}\nDate: ${currentReceipt.date.toLocaleString()}`,
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      alert("Sharing is not supported on this device/browser.");
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

      {/* Floating Side Slide-In Notification Toast */}
      {toastNotification && (
        <div className={`fixed top-6 right-6 z-[999999] max-w-sm w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-6 duration-300 flex items-start gap-3 text-left ${
          toastNotification.type === "error"
            ? "bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/30 text-rose-100 shadow-rose-950/40"
            : "bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40"
        }`}>
          <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
            toastNotification.type === "error" ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>
            <WarningCircle size={20} weight="fill" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">{toastNotification.title}</h4>
            <p className="text-xs leading-relaxed opacity-90">{toastNotification.message}</p>
          </div>
          <button 
            onClick={() => setToastNotification(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1"
          >
            ✕
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

      {/* Main Grid: Form + History (Balanced layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form & Plan Selector */}
        <div className="lg:col-span-6 space-y-6">
          
          <form onSubmit={handleOpenConfirm} className="bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-sm space-y-6">
            
            {/* 1. SELECT NETWORK (9mobile active) */}
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
                  return (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => {
                        setSelectedNetwork(net.id);
                        setSelectedCategory("ALL");
                        setSelectedValidityFilter("ALL");
                        if (toastNotification) setToastNotification(null);
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

            {/* 2. DURATION / VALIDITY TABS (All, Daily, Weekly, Monthly) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span>2. Select Plan Duration</span>
              </label>
              
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-secondary/40 rounded-2xl border border-border">
                {[
                  { id: "ALL", label: "All Plans" },
                  { id: "DAILY", label: "Daily" },
                  { id: "WEEKLY", label: "Weekly" },
                  { id: "MONTHLY", label: "Monthly" },
                ].map((tab) => {
                  const isActive = selectedValidityFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setSelectedValidityFilter(tab.id);
                        if (toastNotification) setToastNotification(null);
                      }}
                      className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer text-center ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. OPTIONAL CATEGORY SUB-FILTERS (SME, Gifting, Corporate, Awoof...) */}
            {availableCategories.length > 2 && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Filter by Bundle Type
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
                          if (toastNotification) setToastNotification(null);
                        }}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
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

            {/* 4. SELECT DATA PLAN BUNDLE (Natural page flow, no inner scroll trap) */}
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
                <div className="p-8 text-center border border-border border-dashed rounded-2xl bg-secondary/20 space-y-1">
                  <p className="text-sm font-bold text-foreground">Service Currently Unavailable</p>
                  <p className="text-xs text-muted-foreground">
                    {availablePlansForNetwork.length === 0
                      ? `${selectedNetwork} data bundles are currently undergoing scheduled maintenance or unavailable.`
                      : "No active plans found for this filter. Try selecting 'All Plans'."}
                  </p>
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
                          if (toastNotification) setToastNotification(null);
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

            {/* 5. RECIPIENT PHONE NUMBER */}
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
                  if (toastNotification) setToastNotification(null);
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

        {/* Right Column: Table-Like History (Matching Airtime History Table) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border bg-secondary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ListDashes size={18} weight="bold" />
                </div>
                <h3 className="font-black text-lg text-foreground">Recent Data Purchases</h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{history.length} delivered</span>
            </div>

            {history.length === 0 ? (
              <div className="p-10 flex flex-col items-center justify-center text-center">
                <Receipt size={48} className="text-muted-foreground/30 mb-4" weight="duotone" />
                <h4 className="text-lg font-black text-foreground">No Transactions Yet</h4>
                <p className="text-sm text-muted-foreground font-medium mt-1">Your recent delivered data purchases will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-secondary/10 border-b border-border text-xs uppercase tracking-widest text-muted-foreground font-bold">
                      <th className="p-4 pl-6">Network</th>
                      <th className="p-4">Data Plan</th>
                      <th className="p-4">Number</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Date & Time</th>
                      <th className="p-4 pr-6 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedHistory.map((tx) => (
                      <tr key={tx.reference} className="hover:bg-secondary/10 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 bg-background rounded-full border border-border flex items-center justify-center p-1 shrink-0 shadow-xs">
                              <Image src={LOGO_MAP[tx.network] || "/mtn.png"} alt={tx.network} width={22} height={22} className="object-contain" />
                            </div>
                            <span className="font-bold text-sm text-foreground">{tx.network}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-bold text-foreground max-w-[140px] truncate" title={tx.planName}>
                          {tx.planName}
                        </td>
                        <td className="p-4 text-sm font-mono text-foreground">{tx.phone}</td>
                        <td className="p-4 text-sm font-black text-emerald-600 dark:text-emerald-400">
                          ₦{tx.amount.toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-foreground">{tx.date.toLocaleDateString()}</span>
                            <span className="text-xs text-muted-foreground font-medium">{tx.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => setCurrentReceipt(tx)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground hover:bg-emerald-500/15 hover:text-emerald-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            <Receipt size={14} weight="bold" /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalHistoryPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between bg-secondary/10">
                <p className="text-xs font-bold text-muted-foreground">
                  Page {historyPage} of {totalHistoryPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className="h-8 px-2 rounded-lg cursor-pointer"
                  >
                    <CaretLeft weight="bold" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                    className="h-8 px-2 rounded-lg cursor-pointer"
                  >
                    <CaretRight weight="bold" />
                  </Button>
                </div>
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
              Data subscriptions are credited to the recipient SIM within seconds. Check data balance using standard operator USSD codes (*323# on MTN/Airtel, *310# on Glo, *323# on 9mobile).
            </p>
          </div>

        </div>

      </div>

      {/* MODAL 1: Confirmation Modal */}
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

      {/* MODAL 2: Receipt Modal (Always shows genuine delivered receipt for history items) */}
      {currentReceipt && (
        <>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              #printable-data-receipt, #printable-data-receipt * { visibility: visible; }
              #printable-data-receipt { position: fixed; left: 0; top: 0; width: 100%; border: none; box-shadow: none; z-index: 999999; }
              .no-print { display: none !important; }
            }
          `}} />

          <div 
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/98 dark:bg-background/98 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200"
            onClick={() => setCurrentReceipt(null)}
          >
            <div 
              id="printable-data-receipt"
              className="bg-card text-card-foreground border border-border p-1 rounded-3xl shadow-2xl max-w-sm w-full mx-auto animate-in zoom-in-95 duration-300 my-auto text-left relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-secondary/20 p-6 rounded-[22px] border border-dashed border-border flex flex-col items-center">
                <div className="h-16 w-16 bg-emerald-500/15 rounded-full flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle size={44} weight="fill" className="drop-shadow-md" />
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">
                  Transaction Successful
                </span>
                <h3 className="font-black text-2xl text-foreground mb-1 text-center">Data Bundle Delivered</h3>
                <p className="text-muted-foreground text-xs font-medium mb-5 text-center">Your data subscription is active on the SIM.</p>

                <div className="w-full bg-background rounded-2xl p-5 shadow-sm space-y-3.5 relative border border-border">
                  {/* Decorative receipt cuts */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-secondary/20 rounded-full border-r border-border" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-secondary/20 rounded-full border-l border-border" />

                  <div className="flex justify-between items-center pb-3.5 border-b border-dashed border-border">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Amount Paid</span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">₦{currentReceipt.amount.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Plan Name</span>
                    <span className="text-xs font-bold text-foreground text-right">{currentReceipt.planName}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Network</span>
                    <div className="flex items-center gap-1.5">
                      <Image src={LOGO_MAP[currentReceipt.network] || "/mtn.png"} alt={currentReceipt.network} width={18} height={18} className="object-contain" />
                      <span className="text-xs font-bold text-foreground">{currentReceipt.network}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Recipient Phone</span>
                    <span className="text-sm font-mono font-bold text-foreground">{currentReceipt.phone}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Date &amp; Time</span>
                    <span className="text-xs font-bold text-foreground">
                      {currentReceipt.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-border/60">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Reference</span>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded">{currentReceipt.reference}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 w-full mt-5 no-print">
                  <Button 
                    onClick={() => window.print()} 
                    variant="outline" 
                    className="w-full font-bold border-border shadow-sm flex gap-2 cursor-pointer h-10 text-xs"
                  >
                    <DownloadSimple weight="bold" size={16} /> Save / Print
                  </Button>
                  <Button 
                    onClick={handleShare} 
                    variant="outline" 
                    className="w-full font-bold border-border shadow-sm flex gap-2 cursor-pointer h-10 text-xs"
                  >
                    <ShareNetwork weight="bold" size={16} /> Share
                  </Button>
                </div>

                <Button
                  type="button"
                  onClick={() => setCurrentReceipt(null)}
                  className="w-full mt-3 font-black h-11 rounded-xl flex gap-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer no-print text-xs shadow-md shadow-emerald-600/20"
                >
                  Buy Data Again
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
