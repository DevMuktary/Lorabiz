// src/app/dashboard/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkle, X, Info, Plus, Spinner, Eye, EyeSlash, Tag } from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

const SERVICES = [
  {
    title: "CAC Registration",
    description: "Register Business Names, LLCs, NGOs, and handle post-incorporation.",
    logo: "/cac.png",
    href: "/dashboard/cac",
    active: true,
  },
  {
    title: "SCUML Certificate",
    description: "Special Control Unit Against Money Laundering registration & compliance.",
    logo: "/scuml.png",
    href: "/dashboard/scuml",
    active: true,
  },
  {
    title: "NIMC Services",
    description: "Generate and print NIN slips directly from the dashboard.",
    logo: "/nimc.png",
    href: "/dashboard/tools/nin-slip",
    active: true,
  },
  {
    title: "TAX ID",
    description: "Easily process your Tax Identification Number (TIN).",
    logo: "/nrs.png",
    href: "/dashboard/tax-id",
    active: true,
  },
  {
    title: "Airtime",
    description: "Seamlessly purchase airtime directly from your wallet.",
    logo: "/airtime.png",
    href: "/dashboard/airtime",
    active: true,
  },
  {
    title: "Trademark (IPO)",
    description: "Protect your intellectual property, logos, and brand identity.",
    logo: "/ipo.png",
    active: false,
  },
  {
    title: "SMEDAN",
    description: "Get your business certified with the Small and Medium Enterprises agency.",
    logo: "/smedan.png",
    active: false,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      
      const status = params.get("status");
      const isFunded = params.get("funded") === "true";
      const isCancelled = params.get("cancelled") === "true";

      // THE FIX: Check for cancellation OR failure BEFORE checking for success!
      if (status === "cancelled" || status === "failed" || isCancelled) {
        setAlertInfo({
          title: "Payment Cancelled ⚠️",
          message: "You cancelled the payment transaction. No funds were debited."
        });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } 
      // If it wasn't cancelled or failed, THEN check if it was successfully funded
      else if (isFunded) {
        setAlertInfo({
          title: "Payment Successful 🎉",
          message: "Your wallet has been funded successfully! Balance is updating..."
        });
        setTimeout(fetchBalance, 1500);
        
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000);
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
        setAlertInfo({ title: serviceTitle, message: "You've been added to the waitlist! We will notify you once it launches." });
      } else if (res.status === 409) {
        setAlertInfo({ title: serviceTitle, message: "You are already on the waitlist! We will notify you once it goes live." });
      } else {
        setAlertInfo({ title: "Oops!", message: "Something went wrong. Please try again." });
      }
    } catch {
      setAlertInfo({ title: "Oops!", message: "Network error. Please try again." });
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between gap-6">
        
        {/* Left Side: Welcome Text */}
        <div className="flex flex-col gap-1.5 mt-2">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            Welcome, {firstName} <span className="text-3xl animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Select a service below to get started.
          </p>
        </div>
        
        {/* Right Side: Wallet & Pricing Link */}
        <div className="flex flex-col items-start md:items-end gap-3 w-full md:w-auto shrink-0">
          
          <div className="flex items-center justify-between w-full md:w-auto gap-4 bg-card p-2 pl-5 sm:pl-6 pr-2.5 rounded-full border border-border shadow-sm">
            <div className="flex flex-col text-left md:text-right">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">
                Wallet Balance
              </span>
              <div className="flex items-center gap-2 h-[20px]">
                <span className="font-bold text-foreground leading-tight flex items-center">
                  {isLoadingBalance 
                    ? <Spinner className="animate-spin h-3.5 w-3.5 text-muted-foreground mt-0.5" weight="bold" />
                    : isBalanceHidden
                      ? "****"
                      : `₦${Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                  }
                </span>
                <button 
                  onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title={isBalanceHidden ? "Show Balance" : "Hide Balance"}
                >
                  {isBalanceHidden ? <EyeSlash weight="bold" className="h-4 w-4" /> : <Eye weight="bold" className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setIsWalletModalOpen(true)}
              className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <Plus weight="bold" className="h-3.5 w-3.5" />
              Fund Wallet
            </button>
          </div>

          {/* Pricing Link - Now distinctly styled as a clickable pill button */}
          <Link 
            href="/dashboard/pricing"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-3.5 py-1.5 rounded-full hover:bg-primary hover:text-primary-foreground transition-all active:scale-95 md:mr-4 shadow-sm group"
          >
            <Tag weight="bold" className="h-3.5 w-3.5" />
            Pricing
            <ArrowRight weight="bold" className="h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          
          <FundWalletModal 
            isOpen={isWalletModalOpen} 
            onClose={() => setIsWalletModalOpen(false)} 
            onSuccess={(amount) => {
              setBalance((prev) => (Number(prev) + amount).toString());
              setAlertInfo({ 
                title: "Payment Successful 🎉", 
                message: `Your wallet was successfully funded with ₦${amount.toLocaleString()}.` 
              });
              setTimeout(fetchBalance, 3000); 
            }}
            onFailure={(message) => {
              setAlertInfo({ 
                title: "Payment Failed", 
                message: message 
              });
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {SERVICES.map((service) => {
          const CardTopContent = (
            <>
              {!service.active && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground">
                  <Sparkle weight="fill" className="h-3 w-3" />
                  Waitlist
                </span>
              )}

              <div className={`h-12 w-12 mb-4 rounded-xl bg-secondary flex items-center justify-center p-2.5 shadow-inner ${!service.active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}>
                <Image 
                  src={service.logo} 
                  alt={service.title} 
                  width={60} 
                  height={60} 
                  className="object-contain w-full h-full"
                />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors text-left leading-tight">
                {service.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 flex-1 text-left leading-relaxed">
                {service.description}
              </p>
            </>
          );

          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="relative group flex flex-col p-5 rounded-2xl border transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                {CardTopContent}
                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/10 text-primary font-bold text-sm rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Access Service <ArrowRight weight="bold" className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          } 
          else {
            return (
              <div 
                key={service.title}
                onClick={() => setAlertInfo({ title: service.title, message: "This service is launching soon!" })}
                className="relative group flex flex-col p-5 rounded-2xl border transition-all duration-300 bg-card/40 border-border/60 hover:border-border hover:bg-card cursor-pointer"
              >
                {CardTopContent}
                <div className="mt-auto pt-3">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(service.title);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-secondary text-foreground font-bold text-sm rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                  >
                    Join Waitlist <ArrowRight weight="bold" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>

      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-5 py-4 rounded-2xl shadow-2xl z-[99999] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm border border-border">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{alertInfo.title}</h4>
            <p className="text-xs opacity-90 mt-1 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="ml-2 p-1.5 hover:bg-background/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

      <Script 
        src="https://support.lorabiz.com/lorabiz-chat.js" 
        strategy="afterInteractive" 
      />
    </div>
  );
}
