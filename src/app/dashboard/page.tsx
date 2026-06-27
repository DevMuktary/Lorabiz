"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, Sparkle, X, Info, Plus } from "@phosphor-icons/react";
import FundWalletModal from "@/components/dashboard/FundWalletModal";

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
  
  // Extract just the first name for the greeting
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  // Balance state
  const [balance, setBalance] = useState<string>("0.00");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);

  // Fetch Wallet Balance (FIXED PARSING LOGIC)
  useEffect(() => {
    fetch('/api/user/wallet')
      .then(res => res.json())
      .then(data => {
        // The API returns the balance nested inside a wallet object
        if (data?.wallet?.balance !== undefined) {
          setBalance(data.wallet.balance);
        } else if (data?.balance !== undefined) {
          setBalance(data.balance); // Fallback just in case
        }
      })
      .catch(console.error)
      .finally(() => {
        setIsLoadingBalance(false);
      });
  }, []);

  // Auto-dismiss the alert
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
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            Welcome, {firstName} <span className="text-3xl animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Select a service below to get started and manage your business operations.
          </p>
        </div>
        
        {/* WALLET DISPLAY - Fixed spacing and text */}
        <div className="flex items-center gap-8 shrink-0 bg-card p-2 pl-6 pr-2.5 rounded-full border border-border shadow-sm">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-tight">
              Wallet Balance
            </span>
            <span className="font-bold text-foreground leading-tight">
              {isLoadingBalance 
                ? "Loading..." 
                : `₦${Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}`
              }
            </span>
          </div>

          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" />
            Fund Wallet
          </button>

          <FundWalletModal 
            isOpen={isWalletModalOpen} 
            onClose={() => setIsWalletModalOpen(false)} 
            onSuccessOptimistic={() => {}} 
          />
        </div>
      </div>

      {/* SERVICE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          
          // Shared Top Content for both Active and Inactive Cards
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

          // RENDER ACTIVE SERVICES
          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                {CardTopContent}
                
                {/* Styled Button inside the link wrapper */}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl group-hover:opacity-90 transition-opacity">
                    Access Service <ArrowRight weight="bold" className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          } 
          
          // RENDER INACTIVE (WAITLIST) SERVICES
          else {
            return (
              <div 
                key={service.title}
                // Clicking the card anywhere shows the launching soon alert
                onClick={() => setAlertInfo({ title: service.title, message: "This service is launching soon!" })}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-card/40 border-border/60 hover:border-border hover:bg-card cursor-pointer"
              >
                {CardTopContent}
                
                {/* Explicit Button to Join Waitlist */}
                <div className="mt-auto pt-4">
                  <button 
                    // e.stopPropagation() prevents the card's onClick from firing when the button is clicked
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

      {/* FLOATING ALERT */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-5 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm border border-border">
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
