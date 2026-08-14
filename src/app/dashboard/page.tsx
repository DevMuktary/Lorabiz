"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect } from "react";
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
  Users, 
  Wallet,
  Receipt,
  Buildings,
  ShieldCheck,
  IdentificationCard,
  DeviceMobile,
  Cards,
  ArrowUpRight,
  Handshake,
  Check
} from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

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
    description: "Incorporate Business Names, Private Limited Companies (LLC), and NGOs with official certificates.",
    logo: "/cac.png",
    href: "/dashboard/cac",
    turnaround: "3–5 Working Days",
    actionText: "Start Registration",
    active: true,
  },
  {
    title: "SCUML Compliance Certificate",
    category: "EFCC / Regulatory",
    description: "Special Control Unit Against Money Laundering compliance certificate for corporate bank accounts.",
    logo: "/scuml.png",
    href: "/dashboard/scuml",
    turnaround: "5–7 Working Days",
    actionText: "File SCUML Application",
    active: true,
  },
  {
    title: "NIMC Identity (NIN Slips)",
    category: "National Identity Management",
    description: "Instant NIN verification, Premium NIN slips, and standard PDF slip downloads.",
    logo: "/nimc.png",
    href: "/dashboard/tools/nin-slip",
    turnaround: "Instant Download",
    actionText: "Generate NIN Slip",
    active: true,
  },
  {
    title: "Tax Identification Number (TIN)",
    category: "Joint Tax Board / FIRS",
    description: "Official corporate and individual Tax ID processing for tax clearance and banking.",
    logo: "/nrs.png",
    href: "/dashboard/tax-id",
    turnaround: "24–48 Hours",
    actionText: "Process Tax ID",
    active: true,
  },
  {
    title: "Airtime & Utility Top-up",
    category: "Instant VTU Services",
    description: "Direct mobile airtime and data recharges across all Nigerian telecom networks.",
    logo: "/airtime.png",
    href: "/dashboard/airtime",
    turnaround: "Instant Delivery",
    actionText: "Recharge Airtime",
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
    title: "Expert Tax & TCC Consultation",
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
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Partner Announcement Pop-up Modal
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenModal = localStorage.getItem("lorabiz_partner_modal_seen_v1");
      if (!hasSeenModal) {
        // Show announcement modal on first visit
        const timer = setTimeout(() => {
          setIsPartnerModalOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleClosePartnerModal = () => {
    setIsPartnerModalOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("lorabiz_partner_modal_seen_v1", "true");
    }
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
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
    <div className="space-y-8 pb-12">

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE WELCOME & GATEWAY STATUS                                     */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {getTimeGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access CAC registrations, SCUML compliance, and identity services in Nigeria.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-card border border-border px-3.5 py-1.5 rounded-full shadow-sm text-xs font-semibold text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>All Portals Operational</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FINANCIAL COMMAND & ACTION BENTO GRID                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Wallet Financial Hub */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet className="h-5 w-5" weight="bold" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Available Wallet Balance
              </span>
            </div>

            <button 
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors cursor-pointer"
              title={isBalanceHidden ? "Show Balance" : "Hide Balance"}
              aria-label="Toggle balance visibility"
            >
              {isBalanceHidden ? <EyeSlash className="h-4 w-4" weight="bold" /> : <Eye className="h-4 w-4" weight="bold" />}
            </button>
          </div>

          <div className="my-3">
            <div className="text-3xl sm:text-4xl font-black text-foreground tracking-tight flex items-center gap-2">
              {isLoadingBalance ? (
                <Spinner className="animate-spin h-7 w-7 text-muted-foreground" weight="bold" />
              ) : isBalanceHidden ? (
                <span className="tracking-widest text-2xl font-mono text-muted-foreground">••••••••</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-muted-foreground">₦</span>
                  {Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ready for instant 1-click checkout across all active compliance portals.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border/80">
            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-xs hover:shadow-lg hover:shadow-primary/25 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus weight="bold" className="h-4 w-4" />
              Fund Wallet
            </button>

            <Link
              href="/dashboard/transactions"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-secondary text-foreground rounded-2xl font-bold text-xs hover:bg-secondary/80 border border-border transition-colors"
            >
              <Receipt className="h-4 w-4" />
              <span>Ledger</span>
            </Link>

            <Link
              href="/dashboard/pricing"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-secondary text-foreground rounded-2xl font-bold text-xs hover:bg-secondary/80 border border-border transition-colors"
            >
              <Tag className="h-4 w-4" />
              <span>Rates</span>
            </Link>
          </div>
        </div>

        {/* Partner Program & Shortcuts Hub */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          
          {/* Partner Program Teaser Card */}
          <Link
            href="/dashboard/referrals"
            className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 text-white border border-indigo-500/30 shadow-sm hover:border-indigo-400/60 transition-all group flex flex-col justify-between"
          >
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <Users className="h-5 w-5" weight="bold" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 group-hover:text-white transition-colors">
                Partner Hub <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-base font-bold text-white tracking-tight">
                Earn Cash with the Partner Program
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Refer business owners and earn commissions directly to your Nigerian bank account.
              </p>
            </div>
          </Link>

          {/* Quick Action Dock */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex items-center justify-between gap-2">
            <Link
              href="/dashboard/cac"
              className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors group"
              title="CAC Registration"
            >
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-1">
                <Buildings className="h-4 w-4" weight="bold" />
              </div>
              <span className="text-[11px] font-bold">CAC</span>
            </Link>

            <Link
              href="/dashboard/scuml"
              className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors group"
              title="SCUML Compliance"
            >
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-1">
                <ShieldCheck className="h-4 w-4" weight="bold" />
              </div>
              <span className="text-[11px] font-bold">SCUML</span>
            </Link>

            <Link
              href="/dashboard/tools/nin-slip"
              className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors group"
              title="NIN Services"
            >
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-1">
                <IdentificationCard className="h-4 w-4" weight="bold" />
              </div>
              <span className="text-[11px] font-bold">NIN</span>
            </Link>

            <Link
              href="/dashboard/airtime"
              className="flex-1 flex flex-col items-center justify-center p-2.5 rounded-2xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors group"
              title="Airtime Recharge"
            >
              <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-1">
                <DeviceMobile className="h-4 w-4" weight="bold" />
              </div>
              <span className="text-[11px] font-bold">Airtime</span>
            </Link>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CORE SHOWCASE: LIVE COMPLIANCE SERVICES (ACTIVE & INSTANT)             */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <span>Active Compliance Services</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                5 Live
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified corporate filings, tax registrations, and identity lookups with official turnaround guarantees.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LIVE_SERVICES.map((service) => (
            <Link
              key={service.title}
              href={service.href!}
              className="group p-6 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-13 w-13 rounded-2xl bg-secondary/80 border border-border/80 p-2.5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                    <Image 
                      src={service.logo} 
                      alt={service.title} 
                      width={52} 
                      height={52} 
                      className="object-contain w-full h-full"
                    />
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Instant Gateway
                  </span>
                </div>

                <div className="mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {service.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mt-0.5 group-hover:text-primary transition-colors leading-snug">
                    {service.title}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                  {service.description}
                </p>
              </div>

              <div>
                {service.turnaround && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-secondary/60 border border-border/70 px-3 py-1.5 rounded-xl w-fit mb-4">
                    <Clock className="h-3.5 w-3.5 text-primary" weight="bold" />
                    <span>Turnaround: {service.turnaround}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-bold text-xs rounded-2xl shadow-sm group-hover:shadow-md group-hover:shadow-primary/20 transition-all">
                  <span>{service.actionText}</span>
                  <ArrowRight weight="bold" className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ECOSYSTEM & ROADMAP (UPCOMING SERVICES)                                 */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-border pb-3">
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>Upcoming Regulatory Services</span>
            <span className="text-xs font-semibold text-muted-foreground">({UPCOMING_SERVICES.length} in development)</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Join the waitlist to receive early access and launch discounts when these services go live.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {UPCOMING_SERVICES.map((service) => (
            <div
              key={service.title}
              onClick={() => handleWaitlist(service.title)}
              className="p-5 rounded-2xl bg-card/50 border border-border/70 hover:border-border hover:bg-card transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl bg-secondary border border-border p-2 flex items-center justify-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                    <Image 
                      src={service.logo} 
                      alt={service.title} 
                      width={44} 
                      height={44} 
                      className="object-contain w-full h-full"
                    />
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                    <Sparkle weight="fill" className="h-3 w-3" />
                    Waitlist
                  </span>
                </div>

                <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  {service.category}
                </span>
                <h4 className="text-sm font-bold text-foreground mt-0.5 mb-1.5 leading-snug">
                  {service.title}
                </h4>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                  {service.description}
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWaitlist(service.title);
                }}
                className="flex items-center justify-center gap-1.5 w-full py-2 bg-secondary text-foreground font-bold text-xs rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
              >
                <span>Notify Me on Launch</span>
                <ArrowRight weight="bold" className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. PARTNER PROGRAM ANNOUNCEMENT POP-UP MODAL                              */}
      {/* ========================================================================= */}
      {isPartnerModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[99990] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="fixed inset-0" 
            onClick={handleClosePartnerModal} 
          />

          <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white rounded-3xl border border-indigo-500/40 shadow-2xl p-6 sm:p-8 z-10 animate-in zoom-in-95 duration-200">
            <button
              onClick={handleClosePartnerModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" weight="bold" />
            </button>

            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 mb-4">
              <Handshake className="h-6 w-6" weight="bold" />
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
              New Partner Program
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-white mt-2 tracking-tight">
              Earn Cash Commissions on Every Corporate Filing
            </h3>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Introduce business owners and entrepreneurs to LoraBiz. Whenever they register a CAC Business Name, LLC, or SCUML certificate, you earn instant commissions directly to your Nigerian bank account.
            </p>

            <div className="mt-5 space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Check className="h-3 w-3" weight="bold" />
                </div>
                <span>Set up your payout bank details in 60 seconds</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Check className="h-3 w-3" weight="bold" />
                </div>
                <span>Get your unique referral link to share</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-5 w-5 rounded-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <Check className="h-3 w-3" weight="bold" />
                </div>
                <span>Automated payouts directly to your bank</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
              <Link
                href="/dashboard/referrals"
                onClick={handleClosePartnerModal}
                className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-2xl shadow-lg transition-colors"
              >
                <span>Set Up Partner Account & Link</span>
                <ArrowRight className="h-4 w-4" weight="bold" />
              </Link>
              
              <button
                onClick={handleClosePartnerModal}
                className="w-full sm:w-auto px-5 py-3 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. STATUS ALERT TOAST                                                     */}
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

      {/* Live Support Script */}
      <Script 
        src="https://support.lorabiz.com/lorabiz-chat.js" 
        strategy="afterInteractive" 
      />
    </div>
  );
}
