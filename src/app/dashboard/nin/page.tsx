"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, Sparkle, X, Info, ArrowLeft, 
  ShieldCheck, CheckCircle, Clock 
} from "@phosphor-icons/react";

interface NinServiceCard {
  title: string;
  category: string;
  description: string;
  turnaround?: string;
  logo: string;
  href?: string;
  active: boolean;
  tag?: string;
}

const NIN_SERVICES: NinServiceCard[] = [
  {
    title: "NIN Verification (Slips)",
    category: "Identity Verification & Print",
    description: "Generate and download official NIMC identity slips (Regular, Standard, and Premium Card layouts) with instant database lookup.",
    turnaround: "Instant Download",
    logo: "/nimc.png",
    href: "/dashboard/nin/slips",
    active: true,
    tag: "Active",
  },
  {
    title: "IPE Clearance",
    category: "In-Processing Error",
    description: "Clear In-Processing Errors on your NIN",
    turnaround: "~24 Hours",
    logo: "/nimc.png",
    href: "/dashboard/nin/ipe",
    active: true,
    tag: "Active",
  },
  {
    title: "NIN Validation",
    category: "Record Validation & Updates",
    description: "Validate your NIN record to reflect recent modifications (e.g. name or biometric update) or resolve records showing 'No Record' or VNIN sync issues.",
    turnaround: "24–48 Hours",
    logo: "/nimc.png",
    href: "/dashboard/nin/validation",
    active: true,
    tag: "Active",
  },
  {
    title: "NIN Personalization",
    category: "Enrollment Personalization",
    description: "Submit your enrollment tracking ID for personalization (and maybe retrieve your verified identity slip).",
    turnaround: "1–24 Hours",
    logo: "/nimc.png",
    href: "/dashboard/nin/personalization",
    active: true,
    tag: "Active",
  },
];

export default function NinHubPage() {
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
        body: JSON.stringify({ service: serviceTitle }),
      });
      if (res.ok) {
        setAlertInfo({ 
          type: "success",
          title: serviceTitle, 
          message: "You've been added to the waitlist! We will notify you once this service launches." 
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
    <div className="space-y-6 relative pb-12 animate-in fade-in duration-200">
      
      {/* Header Navigation */}
      <div className="flex flex-col gap-3">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <ArrowLeft weight="bold" className="h-4 w-4" />
          Back to Service Hub
        </Link>
        
        <div className="flex items-center gap-3.5 border-b border-border pb-4">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nimc.png" 
              width={40} 
              height={40} 
              alt="NIMC Logo" 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
              <ShieldCheck weight="bold" className="h-3 w-3" />
              National Identity Management Commission
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              NIN Identity Services
            </h1>
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Verify identity slips, resolve In-Processing Errors, and validate NIMC records.
            </p>
          </div>
        </div>
      </div>

      {/* Compact Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
        {NIN_SERVICES.map((service) => {
          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-secondary/80 border border-border p-2 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Image 
                        src={service.logo} 
                        alt={service.title} 
                        width={36} 
                        height={36} 
                        className="object-contain w-full h-full"
                      />
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {service.tag || "Active"}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {service.category}
                  </span>

                  <h2 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors mt-0.5 mb-1.5">
                    {service.title}
                  </h2>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    {service.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2 mt-auto">
                  {service.turnaround && (
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-secondary/50 border border-border/60 px-2.5 py-1 rounded-lg">
                      <Clock weight="bold" className="h-3 w-3 text-primary" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}

                  <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm group-hover:shadow transition-all ml-auto">
                    <span>Open</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          } else {
            return (
              <div 
                key={service.title}
                onClick={() => handleWaitlist(service.title)}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-card/60 border border-border/70 hover:border-border hover:bg-card transition-all duration-200 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-secondary border border-border p-2 flex items-center justify-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <Image 
                        src={service.logo} 
                        alt={service.title} 
                        width={36} 
                        height={36} 
                        className="object-contain w-full h-full"
                      />
                    </div>

                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
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
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground bg-secondary/50 border border-border/60 px-2.5 py-1 rounded-lg">
                      <Clock weight="bold" className="h-3 w-3 text-muted-foreground" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(service.title);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-secondary text-foreground font-bold text-xs rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer ml-auto"
                  >
                    <span>Waitlist</span>
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Alert Notification Toast */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-card text-foreground px-4 py-3 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm border border-border">
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {alertInfo.type === "success" ? (
              <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500" />
            ) : (
              <Info weight="bold" className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs leading-tight truncate">{alertInfo.title}</h4>
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

    </div>
  );
}
