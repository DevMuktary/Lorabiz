"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  ArrowRight, Sparkle, X, Info, ArrowLeft, 
  IdentificationCard, ShieldCheck, CheckCircle2, Clock 
} from "lucide-react";

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
    description: "Instant official identity slip generation (Regular, Standard Biometric, and Premium Card layouts) with direct NIMC verification.",
    turnaround: "Instant Download",
    logo: "/nimc.png",
    href: "/dashboard/nin/slips",
    active: true,
    tag: "Active",
  },
  {
    title: "IPE Clearance",
    category: "Identity Exception Resolution",
    description: "Fast-track resolution and status clearance for Initial Processing Exceptions (IPE) on National Identity records.",
    turnaround: "24–48 Hours",
    logo: "/nimc.png",
    active: false,
    tag: "In Pipeline",
  },
  {
    title: "NIN Personalization",
    category: "Demographics & Modifications",
    description: "Update, correct, and personalize demographic parameters, date of birth adjustments, and linked phone records.",
    turnaround: "24–72 Hours",
    logo: "/nimc.png",
    active: false,
    tag: "Coming Soon",
  },
  {
    title: "NIN Validation",
    category: "Database & Institutional Validation",
    description: "Comprehensive validation and status confirmation of National Identity profiles for immigration, banking, and CAC filings.",
    turnaround: "1–2 Hours",
    logo: "/nimc.png",
    active: false,
    tag: "Coming Soon",
  },
];

export default function NinHubPage() {
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string; type?: "success" | "info" | "warning" } | null>(null);

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4500);
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
    <div className="space-y-8 relative pb-16 animate-in fade-in duration-300">
      
      {/* Header Navigation */}
      <div className="flex flex-col gap-4">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3.5 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Service Hub
        </Link>
        
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center p-3 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nimc.png" 
              width={52} 
              height={52} 
              alt="NIMC Logo" 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
              <ShieldCheck className="h-3 w-3" />
              National Identity Management Commission
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              NIN Identity Services
            </h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">
              Verify identity slips, resolve exceptions, and manage NIMC database records.
            </p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {NIN_SERVICES.map((service) => {
          if (service.active) {
            return (
              <Link 
                href={service.href!} 
                key={service.title}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-card border-2 border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-secondary/80 border border-border p-2.5 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                      <Image 
                        src={service.logo} 
                        alt={service.title} 
                        width={48} 
                        height={48} 
                        className="object-contain w-full h-full"
                      />
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {service.tag || "Active"}
                    </span>
                  </div>

                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {service.category}
                  </span>

                  <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mt-1 mb-2">
                    {service.title}
                  </h2>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/70 space-y-3">
                  {service.turnaround && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary/60 border border-border/70 px-3 py-1.5 rounded-xl w-fit">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>{service.turnaround}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl shadow-md group-hover:shadow-lg transition-all">
                    <span>Open Service</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          } else {
            return (
              <div 
                key={service.title}
                onClick={() => handleWaitlist(service.title)}
                className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-3xl bg-card/50 border-2 border-border/70 hover:border-border hover:bg-card transition-all duration-300 cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-secondary border border-border p-2.5 flex items-center justify-center grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                      <Image 
                        src={service.logo} 
                        alt={service.title} 
                        width={48} 
                        height={48} 
                        className="object-contain w-full h-full"
                      />
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground border border-border">
                      <Sparkle className="h-3 w-3" />
                      {service.tag || "Waitlist"}
                    </span>
                  </div>

                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                    {service.category}
                  </span>

                  <h2 className="text-xl font-bold text-foreground mt-1 mb-2">
                    {service.title}
                  </h2>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-border/70 space-y-3">
                  {service.turnaround && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-secondary/60 border border-border/70 px-3 py-1.5 rounded-xl w-fit">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Expected TAT: {service.turnaround}</span>
                    </div>
                  )}

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(service.title);
                    }}
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-secondary text-foreground font-bold text-sm rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
                  >
                    <span>Join Waitlist</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* Alert Notification Toast */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-card text-foreground px-5 py-4 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm border border-border">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {alertInfo.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Info className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm leading-tight truncate">{alertInfo.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
