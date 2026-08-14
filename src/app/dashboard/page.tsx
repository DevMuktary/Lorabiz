"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect, useMemo } from "react";
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
  Users
} from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

type FilterTab = "ALL" | "LIVE" | "CORPORATE" | "IDENTITY" | "WAITLIST";

interface ServiceItem {
  title: string;
  description: string;
  logo: string;
  href?: string;
  active: boolean;
  category: "CORPORATE" | "IDENTITY" | "UTILITY" | "REGULATORY";
  turnaround?: string;
}

const SERVICES: ServiceItem[] = [
  {
    title: "CAC Registration",
    description: "Register Business Names, LLCs, Incorporated Trustees, and handle filings.",
    logo: "/cac.png",
    href: "/dashboard/cac",
    active: true,
    category: "CORPORATE",
    turnaround: "3–5 Working Days",
  },
  {
    title: "SCUML Certificate",
    description: "Special Control Unit Against Money Laundering compliance & certificate.",
    logo: "/scuml.png",
    href: "/dashboard/scuml",
    active: true,
    category: "CORPORATE",
    turnaround: "5–7 Working Days",
  },
  {
    title: "NIMC Services",
    description: "National Identity Number (NIN) slip verification and instant PDF download.",
    logo: "/nimc.png",
    href: "/dashboard/tools/nin-slip",
    active: true,
    category: "IDENTITY",
    turnaround: "Instant Download",
  },
  {
    title: "Tax ID (TIN)",
    description: "Official JTB / FIRS Tax Identification Number processing & verification.",
    logo: "/nrs.png",
    href: "/dashboard/tax-id",
    active: true,
    category: "IDENTITY",
    turnaround: "24–48 Hours",
  },
  {
    title: "Airtime & Utilities",
    description: "Instant mobile airtime and bill payment directly from your wallet.",
    logo: "/airtime.png",
    href: "/dashboard/airtime",
    active: true,
    category: "UTILITY",
    turnaround: "Instant Delivery",
  },
  {
    title: "Trademark (IPO)",
    description: "Protect your intellectual property, logos, and brand identity in Nigeria.",
    logo: "/ipo.png",
    active: false,
    category: "CORPORATE",
  },
  {
    title: "Copyright Commission",
    description: "Safeguard creative works, software, music, and literary assets.",
    logo: "/ncc.jpg",
    active: false,
    category: "CORPORATE",
  },
  {
    title: "Smart Legal Documents",
    description: "Generate compliant board resolutions, NDAs, and business agreements.",
    logo: "/file.svg",
    active: false,
    category: "IDENTITY",
  },
  {
    title: "Build Online Presence",
    description: "Custom domain, professional business email, website, and Google profile.",
    logo: "/globe.svg",
    active: false,
    category: "UTILITY",
  },
  {
    title: "NAFDAC Registration",
    description: "Register and certify food, drug, and cosmetic products with NAFDAC.",
    logo: "/nafdac.png",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "PENCOM Compliance",
    description: "Process Pension Clearance Certificates for federal contract eligibility.",
    logo: "/pencom.jpg",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "SON Certification",
    description: "Ensure products meet Standard Organisation of Nigeria requirements.",
    logo: "/son.jpg",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "NEPC Export License",
    description: "Fast-track registration with the Nigerian Export Promotion Council.",
    logo: "/nepc.jpg",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "Bureau of Public Procurement",
    description: "Get certified for Federal Government contracts and procurement tenders.",
    logo: "/bpp.png",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "Expert Tax Consultation",
    description: "Connect with certified tax professionals for FIRS compliance and TCC.",
    logo: "/nrs.png",
    active: false,
    category: "IDENTITY",
  },
  {
    title: "SMEDAN Registration",
    description: "Official MSME certification with Small and Medium Enterprises agency.",
    logo: "/smedan.png",
    active: false,
    category: "CORPORATE",
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
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Active filter tab
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Top banner dismissal state
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("lorabiz_partner_banner_v3");
      setIsBannerDismissed(dismissed === "true");
    }
  }, []);

  const handleDismissBanner = () => {
    setIsBannerDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("lorabiz_partner_banner_v3", "true");
    }
  };

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
  // ROBUST REDIRECT VERIFICATION
  // =========================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isFunded = params.get("funded");
      const reference = params.get("reference");
      
      if (isFunded === "true" && reference) {
        setAlertInfo({
          type: "loading",
          title: "Verifying Payment",
          message: "Confirming transaction status with the bank..."
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

  const filteredServices = useMemo(() => {
    switch (activeTab) {
      case "LIVE":
        return SERVICES.filter(s => s.active);
      case "CORPORATE":
        return SERVICES.filter(s => s.category === "CORPORATE");
      case "IDENTITY":
        return SERVICES.filter(s => s.category === "IDENTITY" || s.category === "UTILITY");
      case "WAITLIST":
        return SERVICES.filter(s => !s.active);
      case "ALL":
      default:
        return SERVICES;
    }
  }, [activeTab]);

  const liveCount = SERVICES.filter(s => s.active).length;

  return (
    <div className="space-y-6">

      {/* ========================================================================= */}
      {/* 1. TOP-OF-PAGE DISMISSIBLE PARTNER PROGRAM PROMOTION BANNER               */}
      {/* ========================================================================= */}
      {!isBannerDismissed && (
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 border border-indigo-500/30 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-8">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-indigo-300" weight="bold" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                  Earn with the LoraBiz Partner Program
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                  Refer clients and earn instant cash commissions on every corporate filing. Set up your payout bank account to start.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/referrals"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              <span>View Partner Hub</span>
              <ArrowRight className="h-3.5 w-3.5" weight="bold" />
            </Link>
          </div>

          <button
            onClick={handleDismissBanner}
            className="absolute top-3.5 right-3.5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. BALANCED HEADER & FINANCIAL COMMAND BAR                                */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-5 sm:p-6 rounded-2xl border border-border shadow-sm">
        
        {/* Left: Clean Welcome Text */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Select a service below to initiate registration or compliance filing.
          </p>
        </div>

        {/* Right: Modern Wallet & Pricing Bar */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-3 bg-secondary/70 border border-border px-4 py-2.5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">
                Wallet Balance
              </span>
              <div className="flex items-center gap-1.5 h-5 mt-0.5">
                <span className="font-extrabold text-foreground text-sm leading-tight flex items-center">
                  {isLoadingBalance ? (
                    <Spinner className="animate-spin h-3.5 w-3.5 text-muted-foreground" weight="bold" />
                  ) : isBalanceHidden ? (
                    "••••••••"
                  ) : (
                    `₦${Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </span>
                <button 
                  onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer ml-1"
                  title={isBalanceHidden ? "Show Balance" : "Hide Balance"}
                  aria-label="Toggle balance visibility"
                >
                  {isBalanceHidden ? <EyeSlash weight="bold" className="h-3.5 w-3.5" /> : <Eye weight="bold" className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="inline-flex items-center gap-1 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:shadow-md hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer ml-1"
            >
              <Plus weight="bold" className="h-3 w-3" />
              Fund
            </button>
          </div>

          <Link 
            href="/dashboard/pricing"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground bg-secondary/50 border border-border px-3.5 py-3 rounded-2xl transition-colors"
            title="View service pricing"
          >
            <Tag weight="bold" className="h-3.5 w-3.5" />
            Pricing
          </Link>
        </div>

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
      </div>

      {/* ========================================================================= */}
      {/* 3. SERVICE CATEGORY FILTER TABS                                           */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 border-b border-border/80 pb-3 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "ALL" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            All Services ({SERVICES.length})
          </button>
          <button
            onClick={() => setActiveTab("LIVE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "LIVE" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            Live & Active ({liveCount})
          </button>
          <button
            onClick={() => setActiveTab("CORPORATE")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "CORPORATE" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            Corporate & CAC
          </button>
          <button
            onClick={() => setActiveTab("IDENTITY")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "IDENTITY" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            Identity & Tax
          </button>
          <button
            onClick={() => setActiveTab("WAITLIST")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "WAITLIST" 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
          >
            Coming Soon
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REDESIGNED SERVICE CARDS GRID                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredServices.map((service) => {
          const CardContent = (
            <div className="flex flex-col h-full">
              
              {/* Card Top: Logo & Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`h-12 w-12 rounded-2xl bg-secondary/80 border border-border p-2.5 flex items-center justify-center shadow-inner ${
                  !service.active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''
                }`}>
                  <Image 
                    src={service.logo} 
                    alt={service.title} 
                    width={48} 
                    height={48} 
                    className="object-contain w-full h-full"
                  />
                </div>

                {service.active ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                    <Sparkle weight="fill" className="h-3 w-3" />
                    Waitlist
                  </span>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="text-base font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors text-left leading-snug">
                {service.title}
              </h3>
              
              <p className="text-xs text-muted-foreground mb-4 text-left leading-relaxed line-clamp-3">
                {service.description}
              </p>

              {/* Turnaround Badge (if active) */}
              {service.turnaround && (
                <div className="mt-auto mb-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-secondary/40 border border-border px-2.5 py-1 rounded-lg w-fit">
                  <Clock className="h-3 w-3 text-primary" weight="bold" />
                  <span>{service.turnaround}</span>
                </div>
              )}

              {/* Bottom Action Button */}
              <div className="mt-auto pt-2">
                {service.active ? (
                  <div className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary/10 text-primary font-bold text-xs rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <span>Access Service</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(service.title);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-secondary text-foreground font-bold text-xs rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                  >
                    <span>Join Waitlist</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

            </div>
          );

          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="relative group p-5 rounded-2xl border transition-all duration-200 bg-card border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 flex flex-col justify-between"
              >
                {CardContent}
              </Link>
            );
          } else {
            return (
              <div 
                key={service.title}
                onClick={() => setAlertInfo({ 
                  type: "info",
                  title: service.title, 
                  message: "This service is currently in development and will launch shortly." 
                })}
                className="relative group p-5 rounded-2xl border transition-all duration-200 bg-card/50 border-border/70 hover:border-border hover:bg-card cursor-pointer flex flex-col justify-between"
              >
                {CardContent}
              </div>
            );
          }
        })}
      </div>

      {/* ========================================================================= */}
      {/* 5. PROFESSIONAL CLEAN ALERT TOAST                                         */}
      {/* ========================================================================= */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-card text-foreground px-4 py-3.5 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3.5 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm border border-border">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
            {alertInfo.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-500" weight="fill" />}
            {alertInfo.type === "warning" && <WarningCircle className="h-5 w-5 text-amber-500" weight="fill" />}
            {alertInfo.type === "loading" && <Spinner className="h-5 w-5 text-primary animate-spin" weight="bold" />}
            {(!alertInfo.type || alertInfo.type === "info") && <Info className="h-5 w-5 text-blue-500" weight="fill" />}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-xs leading-tight">{alertInfo.title}</h4>
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

      {/* Live Support Script */}
      <Script 
        src="https://support.lorabiz.com/lorabiz-chat.js" 
        strategy="afterInteractive" 
      />
    </div>
  );
}
