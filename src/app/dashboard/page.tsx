"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkle, X, Info, Plus, Spinner } from "@phosphor-icons/react";
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
  {
    title: "TAX ID",
    description: "Easily process and manage your Tax Identification Number (TIN).",
    logo: "/nrs.png",
    active: false,
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();
  
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
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
      
      if (params.get("funded") === "true") {
        setAlertInfo({
          title: "Payment Successful 🎉",
          message: "Your wallet has been funded successfully! Balance is updating..."
        });
        setTimeout(fetchBalance, 1500);
        
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } 
      else if (params.get("cancelled") === "true" || params.get("trxref")) {
        const status = params.get("status");
        if (status === "cancelled" || status === "failed") {
          setAlertInfo({
            title: "Payment Cancelled ⚠️",
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
    <div className="space-y-5 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-xl font-black text-foreground flex items-center gap-2">
            Welcome, {firstName} <span className="text-2xl animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-muted-foreground max-w-xl text-[13px] leading-relaxed">
            Select a service below to get started and manage your business operations.
          </p>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0 bg-card p-1.5 pl-4 sm:pl-5 pr-1.5 rounded-full border border-border shadow-sm md:ml-auto">
          <div className="flex flex-col text-left md:text-right">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
              Wallet Balance
            </span>
            <span className="font-bold text-[15px] text-foreground leading-none flex items-center h-[18px]">
              {isLoadingBalance 
                ? <Spinner className="animate-spin h-3.5 w-3.5 text-muted-foreground" weight="bold" />
                : `₦${Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}`
              }
            </span>
          </div>

          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full font-bold text-[11px] uppercase tracking-wide hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus weight="bold" className="h-3 w-3" />
            Fund Wallet
          </button>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"> 
        {SERVICES.map((service) => {
          const CardTopContent = (
            <>
              {!service.active && (
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-secondary text-muted-foreground">
                  <Sparkle weight="fill" className="h-2.5 w-2.5" />
                  Waitlist
                </span>
              )}

              <div className={`h-10 w-10 mb-3.5 rounded-lg bg-secondary flex items-center justify-center p-2 shadow-inner ${!service.active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}>
                <Image 
                  src={service.logo} 
                  alt={service.title} 
                  width={40} 
                  height={40} 
                  className="object-contain w-full h-full"
                />
              </div>

              <h3 className="text-[15px] font-bold text-foreground mb-1 group-hover:text-primary transition-colors text-left leading-tight">
                {service.title}
              </h3>
              
              <p className="text-[12px] text-muted-foreground mb-3 flex-1 text-left leading-relaxed">
                {service.description}
              </p>
            </>
          );

          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="relative group flex flex-col p-4 md:p-5 rounded-2xl border transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                {CardTopContent}
                <div className="mt-auto pt-2">
                  <div className="flex items-center justify-center gap-1.5 w-full py-2 bg-primary/10 text-primary font-bold text-[12px] rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    Access Service <ArrowRight weight="bold" className="h-3.5 w-3.5" />
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
                className="relative group flex flex-col p-4 md:p-5 rounded-2xl border transition-all duration-300 bg-card/40 border-border/60 hover:border-border hover:bg-card cursor-pointer"
              >
                {CardTopContent}
                <div className="mt-auto pt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(service.title);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-secondary text-foreground font-bold text-[12px] rounded-lg border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                  >
                    Join Waitlist <ArrowRight weight="bold" className="h-3.5 w-3.5" />
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
