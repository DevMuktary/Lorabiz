"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, Sparkle, X, Info } from "@phosphor-icons/react";

const CAC_CATEGORIES = [
  {
    title: "New Incorporation",
    description: "Start a fresh registration for a Business Name, Company (LLC), or NGO.",
    logo: "/cac.png",
    href: "/dashboard/cac/new-incorporation",
    active: true,
  },
  {
    title: "Post Incorporation",
    description: "File annual returns, change directors, upgrade business name to LLC, and more.",
    logo: "/cac.png",
    active: false,
  }
];

export default function CacHubPage() {
  const [alertInfo, setAlertInfo] = useState<{title: string, message: string} | null>(null);

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
        setAlertInfo({ title: serviceTitle, message: "Added to the waitlist! We will notify you once it launches." });
      } else if (res.status === 409) {
        setAlertInfo({ title: serviceTitle, message: "You are already on the waitlist!" });
      } else {
        setAlertInfo({ title: "Oops!", message: "Something went wrong." });
      }
    } catch {
      setAlertInfo({ title: "Oops!", message: "Network error." });
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-foreground">
          Corporate Affairs Commission (CAC)
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Choose whether you are starting a new business registration or managing an existing incorporated entity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {CAC_CATEGORIES.map((category) => {
          
          const CardTopContent = (
            <>
              {!category.active && (
                <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary text-muted-foreground">
                  <Sparkle weight="fill" className="h-3 w-3" />
                  Waitlist
                </span>
              )}

              <div className={`h-16 w-16 mb-5 rounded-xl bg-secondary flex items-center justify-center p-3 shadow-inner ${!category.active ? 'grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all' : ''}`}>
                <Image 
                  src={category.logo} 
                  alt={category.title} 
                  width={60} 
                  height={60} 
                  className="object-contain w-full h-full"
                />
              </div>

              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors text-left">
                {category.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 flex-1 text-left">
                {category.description}
              </p>
            </>
          );

          if (category.active) {
            return (
              <Link 
                href={category.href!} 
                key={category.title}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-card border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5"
              >
                {CardTopContent}
                <div className="mt-auto pt-4">
                  <div className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-primary-foreground font-bold text-sm rounded-xl group-hover:opacity-90 transition-opacity">
                    Open Services <ArrowRight weight="bold" className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          } else {
            return (
              <div 
                key={category.title}
                onClick={() => setAlertInfo({ title: category.title, message: "Post Incorporation services are launching soon!" })}
                className="relative group flex flex-col p-6 rounded-2xl border transition-all duration-300 bg-card/40 border-border/60 hover:border-border hover:bg-card cursor-pointer"
              >
                {CardTopContent}
                <div className="mt-auto pt-4">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWaitlist(category.title);
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
