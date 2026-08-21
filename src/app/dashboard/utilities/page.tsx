"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  DeviceMobile, 
  WifiHigh, 
  Lightning, 
  Television, 
  ShieldCheck, 
  ArrowRight, 
  Sparkle, 
  Clock, 
  CheckCircle,
  Bell
} from "@phosphor-icons/react";

interface UtilityServiceCard {
  title: string;
  category: string;
  description: string;
  turnaround: string;
  href?: string;
  active: boolean;
  tag: "Active" | "Waitlist" | "Coming Soon";
  icon: any;
  color: string;
  bgLight: string;
}

const UTILITY_SERVICES: UtilityServiceCard[] = [
  {
    title: "Airtime Recharge",
    category: "VTU Telecom Services",
    description: "Instant airtime top-up across MTN, Airtel, Glo, and 9mobile with transaction security.",
    turnaround: "Instant Credit",
    href: "/dashboard/utilities/airtime",
    active: true,
    tag: "Active",
    icon: DeviceMobile,
    color: "text-emerald-600 dark:text-emerald-400",
    bgLight: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    title: "Mobile Data",
    category: "High-Speed Internet Bundles",
    description: "Cheap SME, Direct Gifting, Corporate, and Awoof data plans for MTN, Airtel, and Glo.",
    turnaround: "Instant Delivery",
    href: "/dashboard/utilities/mobile-data",
    active: true,
    tag: "Active",
    icon: WifiHigh,
    color: "text-sky-600 dark:text-sky-400",
    bgLight: "bg-sky-500/10 border-sky-500/20",
  },
  {
    title: "Electricity Bills",
    category: "Utility Power Tokens",
    description: "Pay prepaid and postpaid electricity bills across IKEDC, EKEDC, AEDC, IBEDC, and more.",
    turnaround: "Coming Soon",
    active: false,
    tag: "Waitlist",
    icon: Lightning,
    color: "text-amber-600 dark:text-amber-400",
    bgLight: "bg-amber-500/10 border-amber-500/20",
  },
  {
    title: "Cable TV Subscription",
    category: "Entertainment Subscriptions",
    description: "Instant decoder renew and package upgrades for DSTV, GOTV, and StarTimes.",
    turnaround: "Coming Soon",
    active: false,
    tag: "Waitlist",
    icon: Television,
    color: "text-purple-600 dark:text-purple-400",
    bgLight: "bg-purple-500/10 border-purple-500/20",
  },
];

export default function UtilitiesHubPage() {
  const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);

  const handleJoinWaitlist = (serviceTitle: string) => {
    setAlertInfo({
      title: "Waitlist Confirmed!",
      message: `You've joined the waitlist for ${serviceTitle}. We will notify you as soon as it goes live.`,
    });
    setTimeout(() => setAlertInfo(null), 4000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 font-sans select-none relative pb-20 animate-in fade-in duration-300">
      
      {/* Success Notification Alert */}
      {alertInfo && (
        <div className="fixed top-6 right-6 z-50 max-w-md bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-200">
          <CheckCircle size={22} weight="fill" className="shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-sm mb-0.5">{alertInfo.title}</h4>
            <p className="text-white/90">{alertInfo.message}</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white p-6 sm:p-10 border border-zinc-800 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck weight="bold" size={14} />
            <span>Instant Telecom &amp; Utility Portal</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Utilities &amp; Telecom Services
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Recharge airtime, buy affordable data bundles, and manage your everyday utility vending directly with real-time wallet debiting.
          </p>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {UTILITY_SERVICES.map((service) => {
          const IconComponent = service.icon;

          if (service.active && service.href) {
            return (
              <Link
                key={service.title}
                href={service.href}
                className="group relative bg-card border border-border hover:border-emerald-500/50 rounded-3xl p-6 sm:p-7 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${service.bgLight} ${service.color} flex items-center justify-center shrink-0 border`}>
                      <IconComponent size={26} weight="duotone" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {service.tag}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {service.category}
                    </span>
                    <h3 className="text-lg font-black text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkle size={14} weight="fill" />
                    {service.turnaround}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                    <span>Access Portal</span>
                    <ArrowRight size={14} weight="bold" className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          }

          return (
            <div
              key={service.title}
              className="relative bg-card/60 border border-border/80 rounded-3xl p-6 sm:p-7 flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${service.bgLight} ${service.color} flex items-center justify-center shrink-0 border`}>
                    <IconComponent size={26} weight="duotone" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {service.tag}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {service.category}
                  </span>
                  <h3 className="text-lg font-black text-foreground">
                    {service.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/60 text-xs font-bold">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock size={14} weight="bold" />
                  {service.turnaround}
                </span>
                <button
                  type="button"
                  onClick={() => handleJoinWaitlist(service.title)}
                  className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                >
                  <Bell size={14} weight="bold" />
                  <span>Notify Me</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
