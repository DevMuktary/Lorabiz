"use client";

import Image from "next/image";
import Link from "next/link";
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
    title: "NIMC Services",
    description: "Generate and print verified NIN slips directly from the dashboard.",
    logo: "/nimc.png",
    active: false,
  },
  {
    title: "SCUML Certificate",
    description: "Special Control Unit Against Money Laundering registration & compliance.",
    logo: "/scuml.png",
    active: false,
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
    title: "Utility & Airtime",
    description: "Seamlessly pay for data, airtime, and utility bills.",
    logo: "/airtime.png",
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
    <div className="space-y-8 relative">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            Welcome, {firstName} <span className="text-3xl animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Select a service below to get started and manage your business operations.
          </p>
        </div>
        
        <div className="flex items-center justify-between w-full sm:w-auto gap-4 shrink-0 bg-card p-2 pl-5 sm:pl-6 pr-2.5 rounded-full border border-border shadow-sm sm:ml-auto">
          <div className="flex flex-col text-left sm:text-right">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">
              Wallet Balance
            </span>
            <span className="font-bold text-foreground leading-tight flex items-center h-[20px]">
              {isLoadingBalance 
                ? <Spinner className="animate-spin h-3.5 w-3.5 text-muted-foreground mt-0.5" weight="bold" />
                : `₦${Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}`
              }
            </span>
          </div>

          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-5 sm:px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" />
            Fund Wallet
          </button>

          <FundWalletModal 
            isOpen={isWalletModalOpen} 
            onClose={() => setIsWalletModalOpen(false)} 
            onSuccess={(amount) => {
              // 1. Optimistically update the UI balance
              setBalance((prev) => (Number(prev) + amount).toString());
              
              // 2. Show the Success Notification!
              setAlertInfo({ 
                title: "Payment Successful 🎉", 
                message: `Your wallet was successfully funded with ₦${amount.toLocaleString()}.` 
              });

              // 3. Fetch from DB silently to ensure perfect sync
              setTimeout(fetchBalance, 3000); 
            }}
            onFailure={(message) => {
              // 1. Show the Failure Notification
              setAlertInfo({ 
                title: "Payment Failed", 
                message: message 
              });
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          
          const CardTopContent = (
            <>
              {!service.active && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground">
                  <Sparkle weight="fill" className="h-3 w-3" />
                  Waitlist
                </span>
              )}

              <div className={`h-14 w-14 mb-5 rounded-xl bg-secondary flex items-center justify-center p-2.5 shadow-inner ${!service.active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}>
                <Image 
                  src={service.logo} 
                  alt={service.title} 
                  width={60} 
                  height={60} 
                  className="object-contain w-full h-full"
                />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors text-left">
                {service.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 flex-1 text-left">
                {service.description}
              </p>
            </>
          );

          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                {CardTopContent}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl group-hover:opacity-90 transition-opacity">
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
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-card/40 border-border/60 hover:border-border hover:bg-card cursor-pointer"
              >
                {CardTopContent}
                <div className="mt-auto pt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(service.title);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-secondary text-foreground font-bold text-sm rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
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

    </div>
  );
}
