"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
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
    title: "NIMC Services",
    description: "Generate and print verified NIN slips directly from the dashboard.",
    logo: "/nimc.png",
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
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  // Fetch Wallet Balance
  useEffect(() => {
    fetch('/api/user/wallet')
      .then(res => res.json())
      .then(data => {
        if (data && data.balance !== undefined) {
          setBalance(data.balance);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-dismiss the alert after 4 seconds
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
        setAlertInfo({ 
          title: serviceTitle, 
          message: "You've been added to the waitlist! We will notify you once it launches." 
        });
      } else if (res.status === 409) {
        setAlertInfo({ 
          title: serviceTitle, 
          message: "You are already on the waitlist! We will notify you once it goes live." 
        });
      } else {
        setAlertInfo({ title: "Oops!", message: "Something went wrong. Please try again." });
      }
    } catch (error) {
      setAlertInfo({ title: "Oops!", message: "Network error. Please try again." });
    }
  };

  return (
    <div className="space-y-8 relative">
      
      {/* HEADER WITH WALLET DISPLAY & FUND BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Welcome to Lorabiz
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
            Select a service below to get started. From company registration to daily business utilities, manage all your operations in one secure place.
          </p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-card p-2 pr-2.5 rounded-full border border-slate-200 dark:border-border shadow-sm">
          {/* Balance Display */}
          <div className="flex flex-col text-right pl-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Wallet Balance</span>
            <span className="font-bold text-slate-900 dark:text-white leading-tight">
              {balance !== null ? `₦${Number(balance).toLocaleString(undefined, {minimumFractionDigits: 2})}` : "₦---"}
            </span>
          </div>

          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full font-bold text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus weight="bold" className="h-3.5 w-3.5" />
            Fund
          </button>

          <FundWalletModal 
            isOpen={isWalletModalOpen} 
            onClose={() => setIsWalletModalOpen(false)} 
            onSuccessOptimistic={() => { /* Add optimistic update logic if needed */ }} 
          />
        </div>
      </div>

      {/* SERVICE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          
          const CardContent = (
            <>
              {!service.active && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <Sparkle weight="fill" className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                  Waitlist
                </span>
              )}

              {/* ONLY the image container gets grayscale, NOT the whole card */}
              <div className={`h-16 w-16 mb-6 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center p-3 shadow-inner ${!service.active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}>
                <Image 
                  src={service.logo} 
                  alt={service.title} 
                  width={60} 
                  height={60} 
                  className="object-contain w-full h-full"
                />
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors text-left">
                {service.title}
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 flex-1 text-left">
                {service.description}
              </p>

              <div className={`
                flex items-center gap-2 text-sm font-bold transition-colors mt-auto
                ${service.active ? "text-primary" : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"}
              `}>
                {service.active ? "Access Service" : "Join Waitlist"}
                <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </>
          );

          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-white dark:bg-card border-slate-200 dark:border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10"
              >
                {CardContent}
              </Link>
            );
          } else {
            return (
              <button 
                key={service.title}
                onClick={() => handleWaitlist(service.title)}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-slate-50/50 dark:bg-card/30 border-slate-200 dark:border-border/50 hover:border-slate-300 dark:hover:border-border hover:bg-white dark:hover:bg-card cursor-pointer"
              >
                {CardContent}
              </button>
            );
          }
        })}
      </div>

      {/* SLEEK FLOATING ALERT */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{alertInfo.title}</h4>
            <p className="text-xs opacity-90 mt-1 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="ml-2 p-1.5 hover:bg-white/20 dark:hover:bg-slate-900/10 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
