"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ShieldCheck, 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  CheckCircle,
  FileText,
  Buildings,
  Users,
  MapPin,
  Certificate,
  Sparkle
} from "@phosphor-icons/react";

interface PostIncorpService {
  id: string;
  title: string;
  category: string;
  description: string;
  turnaround: string;
  href?: string;
  active: boolean;
  tag?: string;
  icon: any;
}

const POST_INCORP_SERVICES: PostIncorpService[] = [
  {
    id: "annual-returns",
    title: "Annual Returns Filing",
    category: "Statutory Compliance",
    description: "File mandatory annual returns for your Business Name or Limited Liability Company (LLC) to keep your CAC status active and avoid heavy regulatory penalties.",
    turnaround: "24 – 72 Hours",
    href: "/dashboard/cac/post-incorporation/annual-returns",
    active: true,
    tag: "Active",
    icon: FileText,
  },
  {
    id: "change-directors",
    title: "Change of Directors / Proprietors",
    category: "Corporate Restructuring",
    description: "Appoint new directors, resign existing board members, or update proprietor details on CAC record.",
    turnaround: "Coming Soon",
    active: false,
    tag: "Waitlist",
    icon: Users,
  },
  {
    id: "change-address",
    title: "Change of Registered Address",
    category: "Entity Details Update",
    description: "Update official principal place of business and registered office address with the Corporate Affairs Commission.",
    turnaround: "Coming Soon",
    active: false,
    tag: "Waitlist",
    icon: MapPin,
  },
  {
    id: "ctc-status",
    title: "Certified True Copy (CTC) & Status Report",
    category: "Official Documents",
    description: "Obtain certified copies of certificate, memorandum, articles of association, or fresh CAC Status Report.",
    turnaround: "Coming Soon",
    active: false,
    tag: "Waitlist",
    icon: Certificate,
  },
];

export default function CacPostIncorporationHubPage() {
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; type?: "success" | "info" | "warning" } | null>(null);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertInfo]);

  const handleWaitlist = async (serviceTitle: string) => {
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service: `CAC Post-Incorporation: ${serviceTitle}` }),
      });
      if (res.ok) {
        setAlertInfo({ 
          type: "success",
          title: serviceTitle, 
          message: "You've been added to the waitlist! We will notify you once this filing service launches." 
        });
      } else if (res.status === 409) {
        setAlertInfo({ 
          type: "info",
          title: serviceTitle, 
          message: "You are already registered on the waitlist for this service!" 
        });
      } else {
        setAlertInfo({ 
          type: "warning",
          title: "Notice", 
          message: "Unable to join waitlist at this time. Please try again." 
        });
      }
    } catch {
      setAlertInfo({ 
        type: "warning",
        title: "Network Error", 
        message: "Please check your connection and try again." 
      });
    }
  };

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-200 font-sans">
      
      {/* Alert Notification Popup */}
      {alertInfo && (
        <div className={`fixed top-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-200 text-white ${
          alertInfo.type === "success" ? "bg-emerald-600" :
          alertInfo.type === "info" ? "bg-indigo-600" : "bg-amber-600"
        }`}>
          <CheckCircle size={22} weight="fill" className="shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm mb-0.5">{alertInfo.title}</h4>
            <p className="text-white/90">{alertInfo.message}</p>
          </div>
        </div>
      )}

      {/* Header Navigation */}
      <div className="flex flex-col gap-3">
        <Link 
          href="/dashboard/cac"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to CAC Services
        </Link>
        
        <div className="flex items-center gap-3.5 border-b border-border pb-4">
          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center p-1.5 border border-border shrink-0 shadow-sm">
            <Image 
              src="/cac.png" 
              width={40} 
              height={40} 
              alt="CAC Logo" 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              Corporate Affairs Commission • Post-Incorporation
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Post-Incorporation Compliance
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Maintain regulatory compliance, file statutory annual returns, and update company records.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
        {POST_INCORP_SERVICES.map((service) => {
          const IconComponent = service.icon;

          if (service.active && service.href) {
            return (
              <Link 
                href={service.href} 
                key={service.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-600/5 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/20 p-2 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shadow-inner">
                      <IconComponent size={24} weight="duotone" />
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {service.tag || "Active"}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {service.category}
                  </span>

                  <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mt-0.5 mb-1.5">
                    {service.title}
                  </h2>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                  {service.turnaround && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-secondary/50 border border-border/60 px-2.5 py-1 rounded-lg">
                      <Clock weight="bold" className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}

                  <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm group-hover:shadow transition-all ml-auto">
                    <span>File Now</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          } else {
            return (
              <div 
                key={service.id}
                onClick={() => handleWaitlist(service.title)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card/60 border border-border/70 hover:border-border hover:bg-card transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-border p-2 flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200 transition-colors">
                      <IconComponent size={24} weight="duotone" />
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <Sparkle weight="fill" className="h-2.5 w-2.5" />
                      {service.tag || "Waitlist"}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {service.category}
                  </span>

                  <h2 className="text-base sm:text-lg font-bold text-foreground mt-0.5 mb-1.5">
                    {service.title}
                  </h2>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                  {service.turnaround && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-secondary/30 px-2.5 py-1 rounded-lg">
                      <Clock weight="bold" className="h-3 w-3" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}

                  <button 
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors ml-auto cursor-pointer"
                  >
                    <span>Join Waitlist</span>
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>

    </div>
  );
}
