"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { 
  ArrowRight, 
  ArrowUpRight,
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
  Lightning, 
  Users, 
  Wallet, 
  Receipt,
  FileText,
  ShieldCheck,
  Funnel
} from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

type ServiceCategory = "ALL" | "LIVE" | "INCORPORATION" | "TAX_IDENTITY" | "UTILITIES" | "ROADMAP";

interface ServiceItem {
  title: string;
  description: string;
  logo: string;
  href?: string;
  active: boolean;
  category: "INCORPORATION" | "TAX_IDENTITY" | "UTILITIES" | "REGULATORY";
  turnaround?: string;
}

const SERVICES: ServiceItem[] = [
  {
    title: "CAC Registration",
    description: "Register Business Names, LLCs, NGOs, and handle corporate filings.",
    logo: "/cac.png",
    href: "/dashboard/cac",
    active: true,
    category: "INCORPORATION",
    turnaround: "3–5 Working Days",
  },
  {
    title: "SCUML Certificate",
    description: "Special Control Unit Against Money Laundering compliance & certificate.",
    logo: "/scuml.png",
    href: "/dashboard/scuml",
    active: true,
    category: "INCORPORATION",
    turnaround: "5–7 Working Days",
  },
  {
    title: "NIMC Services",
    description: "Instant National Identification Number (NIN) slip verification & download.",
    logo: "/nimc.png",
    href: "/dashboard/tools/nin-slip",
    active: true,
    category: "TAX_IDENTITY",
    turnaround: "Instant Download",
  },
  {
    title: "TAX ID (TIN)",
    description: "Official Joint Tax Board / FIRS Tax Identification Number processing.",
    logo: "/nrs.png",
    href: "/dashboard/tax-id",
    active: true,
    category: "TAX_IDENTITY",
    turnaround: "24–48 Hours",
  },
  {
    title: "Airtime & Data",
    description: "Instant airtime and data recharges directly from your wallet balance.",
    logo: "/airtime.png",
    href: "/dashboard/airtime",
    active: true,
    category: "UTILITIES",
    turnaround: "Instant Delivery",
  },
  {
    title: "Trademark (IPO)",
    description: "Protect your intellectual property, logos, and brand identity in Nigeria.",
    logo: "/ipo.png",
    active: false,
    category: "INCORPORATION",
  },
  {
    title: "Nigerian Copyright Commission",
    description: "Register and safeguard creative works, software, and literary assets.",
    logo: "/ncc.jpg",
    active: false,
    category: "INCORPORATION",
  },
  {
    title: "Smart Legal Documents",
    description: "Generate compliant board resolutions, terms of service, and NDAs.",
    logo: "/file.svg",
    active: false,
    category: "TAX_IDENTITY",
  },
  {
    title: "Build Online Presence",
    description: "Custom domain, professional business email, website, and Google Profile.",
    logo: "/globe.svg",
    active: false,
    category: "UTILITIES",
  },
  {
    title: "NAFDAC Registration",
    description: "Register and certify your food, drug, and cosmetic products with NAFDAC.",
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
    description: "Ensure your products meet Standards Organisation of Nigeria standards.",
    logo: "/son.jpg",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "NEPC Export License",
    description: "Fast-track registration with Nigerian Export Promotion Council.",
    logo: "/nepc.jpg",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "Bureau of Public Procurement (BPP)",
    description: "National Database of Contractors, Consultants and Service Providers.",
    logo: "/bpp.png",
    active: false,
    category: "REGULATORY",
  },
  {
    title: "Expert Tax Consultation",
    description: "Connect with certified tax professionals for FIRS compliance & TCC.",
    logo: "/nrs.png",
    active: false,
    category: "TAX_IDENTITY",
  },
  {
    title: "SMEDAN Registration",
    description: "Small and Medium Enterprises Development Agency official certification.",
    logo: "/smedan.png",
    active: false,
    category: "INCORPORATION",
  },
];

interface OngoingApplication {
  id: string;
  trackingId?: string;
  proposedName?: string;
  status: string;
  _appType: string;
  updatedAt: string;
}

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

  // Filter tab state
  const [selectedTab, setSelectedTab] = useState<ServiceCategory>("LIVE");

  // Dismissible Partner Program Banner
  const [showPartnerBanner, setShowPartnerBanner] = useState<boolean>(true);

  // Ongoing applications
  const [ongoingApplications, setOngoingApplications] = useState<OngoingApplication[]>([]);
  const [isLoadingOngoing, setIsLoadingOngoing] = useState(false);

  useEffect(() => {
    // Check partner banner dismissal in localStorage
    if (typeof window !== "undefined") {
      const isDismissed = localStorage.getItem("lorabiz_hide_partner_banner_v2");
      if (isDismissed === "true") {
        setShowPartnerBanner(false);
      }
    }
  }, []);

  const handleDismissPartnerBanner = () => {
    setShowPartnerBanner(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("lorabiz_hide_partner_banner_v2", "true");
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

  const fetchDashboardData = () => {
    setIsLoadingOngoing(true);
    fetch('/api/dashboard?limit=5')
      .then(res => res.json())
      .then(data => {
        if (data?.tableData && Array.isArray(data.tableData)) {
          // Filter applications that are pending or in progress
          const activeOnly = data.tableData.filter(
            (item: OngoingApplication) => item.status === "PENDING" || item.status === "QUERIED" || item.status === "UNSUBMITTED"
          );
          setOngoingApplications(activeOnly);
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsLoadingOngoing(false);
      });
  };

  useEffect(() => {
    fetchBalance();
    fetchDashboardData();
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
              message: "Your wallet balance has been updated successfully."
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
            title: "Processing Update",
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
          message: "Balance will update momentarily upon gateway confirmation."
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
          message: "You've been added to the waitlist. We will notify you once this service launches." 
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
          message: "Unable to process request right now. Please try again." 
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

  // Filter services by active tab
  const filteredServices = useMemo(() => {
    switch (selectedTab) {
      case "LIVE":
        return SERVICES.filter(s => s.active);
      case "INCORPORATION":
        return SERVICES.filter(s => s.category === "INCORPORATION");
      case "TAX_IDENTITY":
        return SERVICES.filter(s => s.category === "TAX_IDENTITY");
      case "UTILITIES":
        return SERVICES.filter(s => s.category === "UTILITIES" || s.category === "REGULATORY");
      case "ROADMAP":
        return SERVICES.filter(s => !s.active);
      case "ALL":
      default:
        return SERVICES;
    }
  }, [selectedTab]);

  const liveCount = SERVICES.filter(s => s.active).length;
  const roadmapCount = SERVICES.filter(s => !s.active).length;

  return (
    <div className="space-y-7 relative pb-8">

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HEADER & WALLET COMMAND HUB                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Welcome Greeting & Summary */}
        <div className="lg:col-span-7 flex flex-col justify-between p-6 rounded-2xl bg-card border border-border/80 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Verified Client Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xl leading-relaxed">
              Manage company incorporations, tax compliance, NIN identity processing, and wallet operations in one secure workspace.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="mt-5 pt-4 border-t border-border/60 flex flex-wrap items-center gap-2 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
              Quick Actions:
            </span>
            <Link
              href="/dashboard/cac"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <FileText className="h-3.5 w-3.5" />
              CAC Registration
            </Link>
            <Link
              href="/dashboard/scuml"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              SCUML Filing
            </Link>
            <Link
              href="/dashboard/tools/nin-slip"
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <Lightning className="h-3.5 w-3.5" />
              NIN Slips
            </Link>
          </div>
        </div>

        {/* Modern Balance & Financial Hub */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Wallet className="h-4 w-4" weight="bold" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Wallet Balance
              </span>
            </div>

            <button 
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
              title={isBalanceHidden ? "Show Balance" : "Hide Balance"}
              aria-label="Toggle balance visibility"
            >
              {isBalanceHidden ? <EyeSlash className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="my-4">
            <div className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              {isLoadingBalance ? (
                <Spinner className="animate-spin h-6 w-6 text-muted-foreground" weight="bold" />
              ) : isBalanceHidden ? (
                <span className="tracking-widest">••••••••</span>
              ) : (
                <>
                  <span className="text-xl font-bold text-muted-foreground">₦</span>
                  {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Available for instant checkout on all active compliance services.
            </p>
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-xs hover:shadow-md hover:shadow-primary/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" />
              Fund Wallet
            </button>

            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 bg-secondary text-foreground rounded-xl font-bold text-xs hover:bg-secondary/80 border border-border transition-colors"
              title="View transaction history"
            >
              <Receipt className="h-3.5 w-3.5" />
              Ledger
            </Link>

            <Link
              href="/dashboard/pricing"
              className="inline-flex items-center justify-center gap-1 px-3.5 py-2.5 bg-secondary text-foreground rounded-xl font-bold text-xs hover:bg-secondary/80 border border-border transition-colors"
              title="View pricing rate sheet"
            >
              <Tag className="h-3.5 w-3.5" />
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
      </div>

      {/* ========================================================================= */}
      {/* 2. DISMISSIBLE PARTNER PROGRAM PROMOTION BANNER                            */}
      {/* ========================================================================= */}
      {showPartnerBanner && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-slate-900 text-white p-5 sm:p-6 border border-indigo-500/30 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-7">
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-5 w-5 text-indigo-300" weight="bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                    Partner Program
                  </span>
                </div>
                <h3 className="font-bold text-base sm:text-lg text-white mt-1">
                  Earn Cash Commissions with LoraBiz
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                  Earn commissions on every business registration and compliance service completed by your referred clients. Set up your payout bank details to get your unique partner link.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto justify-end">
              <Link
                href="/dashboard/referrals"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow transition-colors"
              >
                Access Partner Hub
                <ArrowRight className="h-3.5 w-3.5" weight="bold" />
              </Link>
            </div>
          </div>

          <button
            onClick={handleDismissPartnerBanner}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            aria-label="Dismiss banner"
            title="Dismiss banner"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ONGOING / ACTIVE APPLICATIONS TRACKER (IF PRESENT)                     */}
      {/* ========================================================================= */}
      {ongoingApplications.length > 0 && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" weight="bold" />
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                In-Progress Filings ({ongoingApplications.length})
              </h2>
            </div>
            <Link 
              href="/dashboard/cac" 
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              View all filings <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ongoingApplications.map((app) => (
              <div 
                key={app.id}
                className="p-3.5 rounded-xl bg-secondary/50 border border-border hover:border-primary/40 transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-card border border-border text-muted-foreground">
                      {app.trackingId || app._appType}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.status === "PENDING" 
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : app.status === "QUERIED"
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground truncate">
                    {app.proposedName || "Corporate Registration"}
                  </h4>
                </div>

                <Link
                  href="/dashboard/cac"
                  className="inline-flex items-center justify-center gap-1 w-full py-1.5 text-xs font-bold text-primary bg-card hover:bg-primary hover:text-primary-foreground border border-border rounded-lg transition-colors"
                >
                  Continue Application <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SERVICE HUB WITH CATEGORY FILTER TABS                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              Corporate & Compliance Services
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select a service below to initiate registration, compliance filing, or identity verification.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedTab("LIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTab === "LIVE" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Active & Live ({liveCount})
            </button>
            <button
              onClick={() => setSelectedTab("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTab === "ALL" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              All Services ({SERVICES.length})
            </button>
            <button
              onClick={() => setSelectedTab("INCORPORATION")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTab === "INCORPORATION" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Corporate
            </button>
            <button
              onClick={() => setSelectedTab("TAX_IDENTITY")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTab === "TAX_IDENTITY" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Tax & Identity
            </button>
            <button
              onClick={() => setSelectedTab("ROADMAP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedTab === "ROADMAP" 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Upcoming ({roadmapCount})
            </button>
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredServices.map((service) => {
            const CardHeader = (
              <>
                <div className="flex items-center justify-between mb-3.5">
                  <div className={`h-11 w-11 rounded-xl bg-secondary/80 flex items-center justify-center p-2 border border-border shadow-inner ${
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
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
                      <Sparkle className="h-3 w-3" weight="fill" />
                      Waitlist
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors text-left leading-snug">
                  {service.title}
                </h3>
                
                <p className="text-xs text-muted-foreground mb-3 flex-1 text-left leading-relaxed">
                  {service.description}
                </p>

                {service.turnaround && (
                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-3 bg-secondary/50 px-2.5 py-1 rounded-lg border border-border/60 w-fit">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>{service.turnaround}</span>
                  </div>
                )}
              </>
            );

            if (service.active) {
              return (
                <Link 
                  href={service.href!} 
                  key={service.title}
                  className="relative group flex flex-col p-5 rounded-2xl border transition-all duration-200 bg-card border-border hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
                >
                  {CardHeader}
                  <div className="mt-auto pt-2">
                    <div className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary/10 text-primary font-bold text-xs rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <span>Access Service</span>
                      <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                    </div>
                  </div>
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
                  className="relative group flex flex-col p-5 rounded-2xl border transition-all duration-200 bg-card/40 border-border/70 hover:border-border hover:bg-card cursor-pointer"
                >
                  {CardHeader}
                  <div className="mt-auto pt-2">
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
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PROFESSIONAL EMOJI-FREE ALERT TOAST                                    */}
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

