"use client";

import { useEffect, useState } from "react";
import { Wrench, ArrowLeft, WarningCircle, Spinner, Info } from "@phosphor-icons/react";
import Link from "next/link";

interface ServiceGuardProps {
  serviceKey: "bnEnabled" | "llcEnabled" | "ninEnabled";
  serviceName: string;
  children: React.ReactNode;
  returnLink?: string;
  returnText?: string;
  showGoodNews?: boolean;
}

export default function ServiceGuard({ 
  serviceKey, 
  serviceName, 
  children,
  returnLink = "/dashboard/cac/new-incorporation",
  returnText = "Return to Applications",
  showGoodNews = true
}: ServiceGuardProps) {
  const [status, setStatus] = useState<{
    loading: boolean;
    enabled: boolean;
    reason: string;
  }>({
    loading: true,
    enabled: true,
    reason: "Service is down for maintenance.",
  });

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const res = await fetch("/api/settings/global", { cache: "no-store" });
        const data = await res.json();
        
        if (data.success && data.settings) {
          const reasonKey = serviceKey.replace("Enabled", "Reason"); 

          setStatus({
            loading: false,
            enabled: data.settings[serviceKey], 
            reason: data.settings[reasonKey] || "This service is currently unavailable.",
          });
        } else {
          setStatus(prev => ({ ...prev, loading: false })); 
        }
      } catch (err) {
        setStatus(prev => ({ ...prev, loading: false })); 
      }
    };

    checkServiceStatus();
  }, [serviceKey]);

  if (status.loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
        <div className="flex items-center gap-3 animate-pulse">
          <Spinner className="animate-spin h-8 w-8 text-primary" weight="bold" />
          <span className="text-2xl font-black tracking-tight text-foreground">LoraBiz</span>
        </div>
      </div>
    );
  }

  if (status.enabled) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-500 max-w-lg mx-auto text-center px-4">
      <div className="h-24 w-24 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-6 relative">
        <Wrench className="h-12 w-12" weight="duotone" />
        <div className="absolute top-0 right-0 h-8 w-8 bg-background rounded-full flex items-center justify-center">
          <WarningCircle className="h-6 w-6 text-amber-500" weight="fill" />
        </div>
      </div>
      
      <h1 className="text-3xl font-black text-foreground mb-3 tracking-tight">
        {serviceName} Unavailable
      </h1>
      
      <p className="text-base font-medium text-muted-foreground mb-8 leading-relaxed">
        {status.reason}
      </p>

      {showGoodNews && (
        <div className="bg-secondary/50 border border-border p-4 rounded-2xl mb-8 w-full text-left flex items-start gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" weight="fill" />
          <div>
            <p className="text-sm font-bold text-foreground">Good News!</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              If you already have a drafted application, query, or pending payment for this service, you can still access and complete it from your Dashboard.
            </p>
          </div>
        </div>
      )}

      <Link 
        href={returnLink}
        className="h-12 px-6 bg-foreground text-background hover:opacity-90 font-bold rounded-xl flex items-center gap-2 transition-opacity"
      >
        <ArrowLeft className="h-5 w-5" weight="bold" />
        {returnText}
      </Link>
    </div>
  );
}
