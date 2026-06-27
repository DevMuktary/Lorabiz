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
  const [comingSoonAlert, setComingSoonAlert] = useState<string | null>(null);
  
  // State to control the Fund Wallet Modal
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Auto-dismiss the alert after 3 seconds
  useEffect(() => {
    if (comingSoonAlert) {
      const timer = setTimeout(() => setComingSoonAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [comingSoonAlert]);

  return (
    <div className="space-y-8 relative">
      
      {/* HEADER WITH FUND WALLET BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            Welcome to Lumebiz
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
            Select a service below to get started. From company registration to daily business utilities, manage all your operations in one secure place.
          </p>
        </div>
        
        {/* Fund Wallet Trigger Button & Modal */}
        <div className="shrink-0">
          <button 
            onClick={() => setIsWalletModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus weight="bold" className="h-4 w-4" />
            Fund Wallet
          </button>

          <FundWalletModal 
            isOpen={isWalletModalOpen} 
            onClose={() => setIsWalletModalOpen(false)} 
            onSuccessOptimistic={() => {
              // This acts as a callback when the funding is successful.
              // We pass an empty function here to satisfy TypeScript.
            }} 
          />
        </div>
      </div>

      {/* SERVICE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => {
          
          const CardContent = (
            <>
              {!service.active && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Sparkle weight="fill" className="h-3 w-3" />
                  Coming Soon
                </span>
              )}

              <div className="h-16 w-16 mb-6 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center p-3 shadow-inner">
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
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1 text-left">
                {service.description}
              </p>

              <div className={`
                flex items-center gap-2 text-sm font-bold transition-colors mt-auto
                ${service.active ? "text-primary" : "text-slate-400 dark:text-slate-500"}
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
                onClick={() => setComingSoonAlert(service.title)}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-slate-50 dark:bg-card/50 border-slate-100 dark:border-border/50 hover:border-slate-300 dark:hover:border-border grayscale hover:grayscale-0 cursor-pointer"
              >
                {CardContent}
              </button>
            );
          }
        })}
      </div>

      {/* SLEEK FLOATING ALERT FOR "COMING SOON" */}
      {comingSoonAlert && (
        <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm">{comingSoonAlert}</h4>
            <p className="text-xs opacity-80 mt-0.5">This service is launching very soon!</p>
          </div>
          <button 
            onClick={() => setComingSoonAlert(null)} 
            className="ml-2 p-1.5 hover:bg-white/20 dark:hover:bg-slate-900/10 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
