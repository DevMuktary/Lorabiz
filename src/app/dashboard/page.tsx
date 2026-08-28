"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { 
  ArrowRight, 
  Sparkle, 
  X, 
  Info, 
  Plus, 
  Spinner, 
  Eye, 
  EyeSlash, 
  Tag, 
  CheckCircle, 
  WarningCircle, 
  Clock, 
  Wallet,
  Receipt,
  Handshake,
  Check,
  ShareNetwork,
  Bank,
  Crown,
  CaretRight,
  Gavel
} from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";
import LoyaltyPerksModal from "@/components/dashboard/LoyaltyPerksModal";
import { useLoyalty } from "@/lib/useLoyalty";

interface ServiceItem {
  title: string;
  category: string;
  description: string;
  logo: string;
  href?: string;
  turnaround?: string;
  actionText?: string;
  active: boolean;
}

const LIVE_SERVICES: ServiceItem[] = [
  {
    title: "CAC Company Registration",
    category: "Corporate Affairs Commission",
    description: "Register Business Names, Private Limited Companies (LLC), and Incorporated Trustees.",
    logo: "/cac.png",
    href: "/dashboard/cac",
    turnaround: "30 Mins (BN) • 24–72 Hrs (LLC)",
    actionText: "Start Registration",
    active: true,
  },
  {
    title: "SCUML Certificate",
    category: "Special Control Unit (EFCC)",
    description: "Anti-money laundering compliance certificate for corporate bank accounts and DNFBPs.",
    logo: "/scuml.png",
    href: "/dashboard/scuml",
    turnaround: "24–72 Hours",
    actionText: "Apply for SCUML",
    active: true,
  },
  {
    title: "NIN Identity Services",
    category: "National Identity Management",
    description: "Instant NIN verification, record modification, slip printing, IPE clearance, and validation.",
    logo: "/nimc.png",
    href: "/dashboard/nin",
    turnaround: "Instant – 24 Hours",
    actionText: "Explore NIN Services",
    active: true,
  },
  {
    title: "BVN Services",
    category: "Bank Verification (NIBSS)",
    description: "BVN slips, BVN retrieval, and BVN modification.",
    logo: "/nibss.png",
    href: "/dashboard/bvn",
    turnaround: "Instant Delivery",
    actionText: "Explore BVN Services",
    active: true,
  },
  {
    title: "Tax ID (TIN)",
    category: "Joint Tax Board / FIRS",
    description: "Official corporate and personal Tax Identification Number processing and verification.",
    logo: "/nrs.png",
    href: "/dashboard/tax-id",
    turnaround: "30 Mins – 1 Hour",
    actionText: "Process Tax ID",
    active: true,
  },
  {
    title: "Utilities & Data",
    category: "VTU Telecom Gateway",
    description: "Instant airtime top-up, cheap mobile data bundles, and bill payments from your wallet balance.",
    logo: "/airtime.png",
    href: "/dashboard/utilities",
    turnaround: "Instant Delivery",
    actionText: "Access Utilities",
    active: true,
  },
  {
    title: "Court Affidavit",
    category: "High Court Registry",
    description: "Official sworn and sealed court affidavits for CAC, change of name, age declaration, and loss of items.",
    logo: "/court.png",
    href: "/dashboard/affidavit",
    turnaround: "2–5 Hours",
    actionText: "Request Affidavit",
    active: true,
  },
];

const UPCOMING_SERVICES: ServiceItem[] = [
  {
    title: "Trademark & Brand (IPO)",
    category: "Intellectual Property",
    description: "Protect brand names, logos, and proprietary trademarks with the Ministry of Industry, Trade & Investment.",
    logo: "/ipo.png",
    active: false,
  },
  {
    title: "Copyright Commission (NCC)",
    category: "Copyright Protection",
    description: "Safeguard software source code, creative publications, audio-visuals, and artistic assets.",
    logo: "/ncc.jpg",
    active: false,
  },
  {
    title: "Smart Legal Documents",
    category: "Legal & Contracts",
    description: "Generate legally compliant NDAs, board resolutions, terms of service, and partnership deeds.",
    logo: "/file.svg",
    active: false,
  },
  {
    title: "Build Online Presence",
    category: "Digital Identity",
    description: "Custom domain, professional business email accounts, website creation, and Google Business Profile.",
    logo: "/globe.svg",
    active: false,
  },
  {
    title: "NAFDAC Certification",
    category: "Food & Drug Administration",
    description: "Product registration and certification for food, cosmetics, packaged water, and medical items.",
    logo: "/nafdac.png",
    active: false,
  },
  {
    title: "PENCOM Compliance",
    category: "National Pension Commission",
    description: "Process Pension Clearance Certificates required for federal contractor and procurement eligibility.",
    logo: "/pencom.jpg",
    active: false,
  },
  {
    title: "SON Quality Certification",
    category: "Standards Organisation",
    description: "Ensure products meet mandatory industrial standards and obtain MANCAP certifications.",
    logo: "/son.jpg",
    active: false,
  },
  {
    title: "NEPC Export License",
    category: "Export Promotion Council",
    description: "Fast-track registration and obtain official export clearance for international commerce.",
    logo: "/nepc.jpg",
    active: false,
  },
  {
    title: "Bureau of Public Procurement (BPP)",
    category: "Federal Tenders",
    description: "Register on the National Database of Contractors to bid for Federal Government contracts.",
    logo: "/bpp.png",
    active: false,
  },
  {
    title: "Expert Tax Consultation",
    category: "FIRS Tax Advisory",
    description: "One-on-one sessions with chartered accountants for Tax Clearance Certificate filings and auditing.",
    logo: "/nrs.png",
    active: false,
  },
  {
    title: "SMEDAN Certification",
    category: "MSME Development",
    description: "Official registration with the Small and Medium Enterprises Development Agency of Nigeria.",
    logo: "/smedan.png",
    active: false,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [alertInfo, setAlertInfo] = useState<{
    type?: "success" | "warning" | "info" | "loading";
    title: string;
    message: string;
  } | null>(null);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isPerksModalOpen, setIsPerksModalOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [timeGreeting, setTimeGreeting] = useState<string>("Good day");

  const { profile: loyaltyProfile } = useLoyalty();

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeGreeting("Good morning");
    } else if (hour < 17) {
      setTimeGreeting("Good afternoon");
    } else {
      setTimeGreeting("Good evening");
    }
  }, []);

  // Partner Announcement Modal shows on refresh UNLESS user is returning from a payment
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hasPaymentParam = params.has("funded") || params.has("reference") || params.has("trxref") || params.has("cancelled") || params.has("status");
      if (hasPaymentParam) return false;
    }
    return true;
  });

  // Lock body scroll when modal is active
  useEffect(() => {
    if (isPartnerModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPartnerModalOpen]);

  const fetchBalance = () => {
    fetch('/api/user/wallet')
      .then(res => res.json())
      .then(data => {
        if (data?.wallet?.balance !== undefined) {
          setBalance(data.wallet.balance);
        } else if (data?.balance !== undefined) {
          setBalance(data.balance); 
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsLoadingBalance(false);
      });
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  // =========================================================================
  // ROBUST REDIRECT VERIFICATION (SUPPRESSES ANNOUNCEMENT MODAL ON PAYMENT RETURN)
  // =========================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isFunded = params.get("funded");
      const reference = params.get("reference");
      const hasPaymentParam = params.has("funded") || params.has("reference") || params.has("trxref") || params.has("cancelled") || params.has("status");
      
      if (hasPaymentParam) {
        setIsPartnerModalOpen(false);
      }

      if (isFunded === "true" && reference) {
        setAlertInfo({
          type: "loading",
          title: "Verifying Payment",
          message: "Confirming transaction status with the banking network..."
        });

        fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAlertInfo({
              type: "success",
              title: "Payment Confirmed",
              message: "Your wallet has been funded successfully."
            });
            fetchBalance();
          } else {
            setAlertInfo({
              type: "warning",
              title: "Payment Incomplete",
              message: "Transaction cancelled or failed. No funds were debited."
            });
          }
        })
        .catch(() => {
          setAlertInfo({
            type: "info",
            title: "Processing Payment",
            message: "Your payment is being confirmed. Balance will update shortly."
          });
        })
        .finally(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        });
      } 
      else if (isFunded === "true" && !reference) {
        setAlertInfo({
          type: "info",
          title: "Processing Payment",
          message: "Balance will update momentarily upon confirmation."
        });
        setTimeout(fetchBalance, 3000);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
      else if (params.get("cancelled") === "true" || params.get("trxref")) {
        const status = params.get("status");
        if (status === "cancelled" || status === "failed") {
          setAlertInfo({
            type: "warning",
            title: "Payment Cancelled",
            message: "You cancelled the payment transaction. No funds were debited."
          });
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

  const handleWaitlist = async (serviceTitle: string) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceTitle })
      });
      if (res.ok) {
        setAlertInfo({ 
          type: "success",
          title: serviceTitle, 
          message: "Added to waitlist. We will notify you once this service goes live." 
        });
      } else if (res.status === 409) {
        setAlertInfo({ 
          type: "info",
          title: serviceTitle, 
          message: "You are already registered on the waitlist for this service." 
        });
      } else {
        setAlertInfo({ 
          type: "warning",
          title: "Notice", 
          message: "Unable to process request. Please try again." 
        });
      }
    } catch {
      setAlertInfo({ 
        type: "warning",
        title: "Connection Error", 
        message: "Network error encountered. Please check your connection." 
      });
    }
  };

  return (
    <div className={`space-y-6 pb-12 pt-1 sm:pt-2 transition-opacity duration-300 ${mounted && isPartnerModalOpen ? "opacity-0 pointer-events-none select-none max-h-[80vh] overflow-hidden" : "opacity-100"}`}>

      {/* ========================================================================= */}
      {/* 1. COMPACT CENTER-SCREEN PARTNER ANNOUNCEMENT POPUP (FULL-VIEWPORT BACKDROP) */}
      {/* ========================================================================= */}
      {mounted && isPartnerModalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 min-h-screen w-screen bg-background z-[999999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 min-h-screen w-screen bg-background" 
            onClick={() => setIsPartnerModalOpen(false)} 
          />

          <div className="relative w-full max-w-md bg-card text-card-foreground rounded-3xl border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
            {/* Top Accent Strip */}
            <div className="h-1.5 bg-gradient-to-r from-primary via-indigo-500 to-primary" />

            <div className="p-5 sm:p-6">
              {/* Header with High-Visibility Close Button */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Handshake className="h-5 w-5" weight="bold" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Partner Announcement
                    </span>
                    <h3 className="text-lg font-black text-foreground tracking-tight leading-tight">
                      Earn With LoraBiz
                    </h3>
                  </div>
                </div>

                {/* Highly Prominent Close Button */}
                <button
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center justify-center transition-all cursor-pointer shadow-sm hover:scale-105"
                  aria-label="Close announcement"
                  title="Close and go to dashboard"
                >
                  <X className="h-4 w-4" weight="bold" />
                </button>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Refer business owners and entrepreneurs to LoraBiz. Whenever they purchase <strong className="text-foreground font-semibold">any service</strong> (CAC, SCUML, NIN, Tax ID, and more — excluding airtime), you earn instant cash commissions paid to your Nigerian bank account.
              </p>

              {/* 2 Compact Value Points */}
              <div className="my-4 space-y-2 bg-secondary/50 p-3 rounded-xl border border-border text-[11px]">
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Bank className="h-2.5 w-2.5" weight="bold" />
                  </div>
                  <span className="font-semibold text-foreground">Instant cash payouts straight to your bank</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-4 w-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShareNetwork className="h-2.5 w-2.5" weight="bold" />
                  </div>
                  <span className="font-semibold text-foreground">Personalized referral links to share anywhere</span>
                </div>
              </div>

              {/* Action Buttons: Crystal Clear & High Contrast */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <Link
                  href="/dashboard/referrals"
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <span>Go to Partner Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                </Link>
                
                <button
                  onClick={() => setIsPartnerModalOpen(false)}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Skip & Open Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE HEADER WITH SIDE 3D ARTWORK & PINK CIRCLE                   */}
      {/* ========================================================================= */}
      <div className="relative flex items-start justify-between pb-6 sm:pb-8 overflow-visible">
        {/* Left: Greetings & Subtitle */}
        <div className="space-y-1.5 max-w-lg z-10 pt-1">
          <p className="text-sm sm:text-base font-semibold text-muted-foreground tracking-normal">
            {timeGreeting},
          </p>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-2">
            <span>{firstName.toUpperCase()}</span>
            <span className="inline-block hover:rotate-12 transition-transform cursor-default">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pt-0.5 font-medium max-w-md">
            Explore available services and manage your transactions below.
          </p>
        </div>

        {/* Right: Soft Pink Circle & 3D Wallet */}
        <div className="relative shrink-0 flex items-center justify-center select-none pointer-events-none pr-1 sm:pr-4">
          {/* Soft pink circle backdrop */}
          <div className="w-48 h-48 sm:w-60 sm:h-60 lg:w-68 lg:h-68 rounded-full bg-pink-100/80 dark:bg-pink-900/25 flex items-center justify-center relative translate-y-3 sm:translate-y-4">
            {/* 3D Wallet Illustration resting on the 1/4 line */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 lg:w-40 lg:h-40 translate-y-1 sm:translate-y-2">
              <Image
                src="/wallet.png"
                alt="Wallet Illustration"
                width={170}
                height={170}
                priority
                className="object-contain w-full h-full drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. DUAL-CARD HERO: COMPACT WALLET & VIP LEVEL + QUICK ACTIONS DOCK         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch -mt-10 sm:-mt-12 lg:-mt-14 relative z-10">
        
        {/* Left: Professional Compact Wallet Deck */}
        <div className="lg:col-span-6 p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
          
          {/* Top Row: Wallet Label + Active Level Pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-pink-100 dark:bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-pink-200/50 dark:border-primary/20">
                <Wallet className="h-4 w-4" weight="bold" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Wallet Balance
              </span>
              <button
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
                aria-label={isBalanceHidden ? "Show Balance" : "Hide Balance"}
              >
                {isBalanceHidden ? <EyeSlash className="h-4 w-4" weight="bold" /> : <Eye className="h-4 w-4" weight="bold" />}
              </button>
            </div>

            {/* Level Pill with 'Account Level' label */}
            {loyaltyProfile?.currentTier && (
              <div className="flex flex-col items-end shrink-0">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                  Account Level
                </span>
                <button
                  type="button"
                  onClick={() => setIsPerksModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-secondary hover:bg-secondary/80 border border-border transition-colors cursor-pointer text-foreground shadow-xs"
                  title="Click to view Level Perks and Discounts"
                >
                  <span>{loyaltyProfile.currentTier.badge.split(" ")[0]}</span>
                  <span>{loyaltyProfile.currentTier.name}</span>
                  {loyaltyProfile.currentTier.discountPct > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      • {loyaltyProfile.currentTier.discountPct}% OFF
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-[10px]">• Starter</span>
                  )}
                  <CaretRight size={10} weight="bold" className="text-muted-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Center: Prominent Balance + Progress Hint */}
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-baseline gap-1">
              {isLoadingBalance ? (
                <Spinner className="animate-spin h-6 w-6 text-muted-foreground" weight="bold" />
              ) : isBalanceHidden ? (
                <span className="tracking-widest text-xl font-mono text-muted-foreground">••••••••</span>
              ) : (
                <>
                  <span className="text-lg sm:text-xl font-bold text-muted-foreground">₦</span>
                  {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </>
              )}
            </div>

            {/* 1-Line Next Level Progress Hint */}
            {loyaltyProfile?.nextTier ? (
              <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1 flex-wrap font-medium">
                <span>Spend <strong className="text-foreground font-bold">₦{loyaltyProfile.remainingSpendToNextTier.toLocaleString()}</strong> more for <strong>{loyaltyProfile.nextTier.name}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">({loyaltyProfile.nextTier.discountPct}% OFF)</span>
              </p>
            ) : loyaltyProfile ? (
              <p className="text-[11px] text-sky-500 dark:text-sky-400 font-bold mt-1">
                💎 Max Platinum VIP Active (6% OFF on all services)
              </p>
            ) : null}
          </div>

          {/* Bottom Row: Quick Action Buttons */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-border/70">
            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:shadow-md hover:shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" />
              <span>Fund Wallet</span>
            </button>

            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-secondary text-foreground rounded-xl font-bold text-xs hover:bg-secondary/80 border border-border transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              <span>History</span>
            </Link>

            <Link
              href="/dashboard/pricing"
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-secondary text-foreground rounded-xl font-bold text-xs hover:bg-secondary/80 border border-border transition-colors"
            >
              <Tag className="h-3.5 w-3.5" />
              <span>Pricing</span>
            </Link>
          </div>
        </div>

        {/* Right: Quick Actions Dock with Official Agency Logos */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </span>
          </div>

          <div className="space-y-2">
            {/* Top Row: 5 Core Government Registrations */}
            <div className="grid grid-cols-5 gap-2">
              <Link
                href="/dashboard/cac"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="CAC Registration"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform mb-1 shadow-xs">
                  <Image 
                    src="/cac.png" 
                    alt="CAC" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">CAC</span>
              </Link>

              <Link
                href="/dashboard/scuml"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="SCUML Certificate"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform mb-1 shadow-xs">
                  <Image 
                    src="/scuml.png" 
                    alt="SCUML" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">SCUML</span>
              </Link>

              <Link
                href="/dashboard/tax-id"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="Tax ID (TIN)"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform mb-1 shadow-xs">
                  <Image 
                    src="/nrs.png" 
                    alt="Tax ID" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">Tax ID</span>
              </Link>

              <Link
                href="/dashboard/nin"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="NIN Services"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform mb-1 shadow-xs">
                  <Image 
                    src="/nimc.png" 
                    alt="NIMC" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">NIN</span>
              </Link>

              <Link
                href="/dashboard/bvn"
                className="flex flex-col items-center justify-center p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="BVN Services"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform mb-1 shadow-xs">
                  <Image 
                    src="/nibss.png" 
                    alt="BVN" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <span className="text-[10px] font-bold truncate w-full text-center">BVN</span>
              </Link>
            </div>

            {/* Bottom Row: 2 Services (Affidavit & Utilities) */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/affidavit"
                className="flex items-center gap-2.5 p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="Court Affidavit"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                  <Image 
                    src="/court.png" 
                    alt="Court Affidavit" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[11px] font-black block truncate">Court Affidavit</span>
                  <span className="text-[9px] font-bold text-muted-foreground block truncate">Sworn &amp; Sealed Legal</span>
                </div>
              </Link>

              <Link
                href="/dashboard/utilities"
                className="flex items-center gap-2.5 p-2 rounded-2xl bg-secondary/40 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground transition-all group shadow-sm"
                title="Utilities & Telecom"
              >
                <div className="h-9 w-9 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 shadow-xs">
                  <Image 
                    src="/airtime.png" 
                    alt="Utilities" 
                    width={28} 
                    height={28} 
                    className="object-contain" 
                  />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[11px] font-black block truncate">Utilities &amp; Data</span>
                  <span className="text-[9px] font-bold text-muted-foreground block truncate">Airtime &amp; Bills</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. ACTIVE SERVICES (EXACT TURNAROUNDS SPECIFIED BY USER)                   */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-foreground tracking-tight">
              Active Services
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {LIVE_SERVICES.length} Live
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIVE_SERVICES.map((service) => (
            <Link
              key={service.title}
              href={service.href!}
              className="group p-5 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                    <Image 
                      src={service.logo} 
                      alt={service.title} 
                      width={44} 
                      height={44} 
                      className="object-contain w-full h-full"
                    />
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  {service.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed my-2 line-clamp-2">
                  {service.description}
                </p>
              </div>

              <div className="pt-2">
                {service.turnaround && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground bg-secondary/60 border border-border/70 px-2.5 py-1 rounded-lg w-fit mb-3">
                    <Clock className="h-3 w-3 text-primary" weight="bold" />
                    <span>{service.turnaround}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm group-hover:shadow-md transition-all">
                  <span>{service.actionText}</span>
                  <ArrowRight weight="bold" className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. UPCOMING SERVICES                                                      */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <h2 className="text-base font-bold text-foreground tracking-tight">
            Upcoming Services
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {UPCOMING_SERVICES.map((service) => (
            <div
              key={service.title}
              onClick={() => handleWaitlist(service.title)}
              className="p-4 rounded-2xl bg-card/50 border border-border/70 hover:border-border hover:bg-card transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="h-9 w-9 rounded-lg bg-white dark:bg-white border border-slate-200/80 dark:border-white/20 p-1 flex items-center justify-center grayscale opacity-75 group-hover:grayscale-0 group-hover:opacity-100 transition-all shrink-0 shadow-xs">
                    <Image 
                      src={service.logo} 
                      alt={service.title} 
                      width={36} 
                      height={36} 
                      className="object-contain w-full h-full"
                    />
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                    <Sparkle weight="fill" className="h-2.5 w-2.5" />
                    Waitlist
                  </span>
                </div>

                <h4 className="text-xs font-bold text-foreground mb-1 leading-snug">
                  {service.title}
                </h4>

                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                  {service.description}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWaitlist(service.title);
                }}
                className="flex items-center justify-center gap-1 w-full py-1.5 bg-secondary text-foreground font-bold text-[11px] rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
              >
                <span>Join Waitlist</span>
                <ArrowRight weight="bold" className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. STATUS ALERT TOAST                                                     */}
      {/* ========================================================================= */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-card text-foreground px-4 py-3 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm border border-border">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-secondary">
            {alertInfo.type === "success" && <CheckCircle className="h-4 w-4 text-emerald-500" weight="fill" />}
            {alertInfo.type === "warning" && <WarningCircle className="h-4 w-4 text-amber-500" weight="fill" />}
            {alertInfo.type === "loading" && <Spinner className="h-4 w-4 text-primary animate-spin" weight="bold" />}
            {(!alertInfo.type || alertInfo.type === "info") && <Info className="h-4 w-4 text-blue-500" weight="fill" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs leading-tight truncate">{alertInfo.title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="p-1 hover:bg-secondary rounded-lg transition-colors cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close notification"
          >
            <X weight="bold" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Wallet Modal */}
      <FundWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
        onSuccess={(amount) => {
          setBalance((prev) => (Number(prev) + amount).toString());
          setAlertInfo({ 
            type: "success",
            title: "Funding Successful", 
            message: `Your wallet was credited with ₦${amount.toLocaleString()}.` 
          });
          setTimeout(fetchBalance, 3000); 
        }}
        onFailure={(message) => {
          setAlertInfo({ 
            type: "warning",
            title: "Funding Failed", 
            message: message 
          });
        }}
      />

      {/* Loyalty Perks Modal */}
      <LoyaltyPerksModal
        isOpen={isPerksModalOpen}
        onClose={() => setIsPerksModalOpen(false)}
        currentTierLevel={loyaltyProfile?.currentTier?.level}
        allTimeSpend={loyaltyProfile?.allTimeSpend}
      />
    </div>
  );
}
