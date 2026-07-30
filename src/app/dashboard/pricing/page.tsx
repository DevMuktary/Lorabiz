// src/app/dashboard/pricing/page.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Tag, SpinnerGap, Info, WarningCircle, ArrowsLeftRight, 
  ArrowLeft, DeviceMobile 
} from "@phosphor-icons/react";

// Mapping the API keys to readable labels, descriptions, categories, and logos
const PRICING_METADATA: Record<string, { label: string; desc?: string; category: string; imageSrc?: string; icon?: any; colorClass: string }> = {
  BUSINESS_NAME: { 
    label: "Business Name Registration", 
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-500"
  },
  LLC: { 
    label: "Company Registration (LLC)", 
    desc: "Includes standard processing for up to 1M Share Capital",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-500"
  },
  LLC_EXTRA_MILLION: { 
    label: "Additional Share Capital", 
    desc: "Fee applied per extra 1 Million shares above the standard 1M",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-500"
  },
  NAME_SUBSTITUTION: { 
    label: "Name Substitution Fee", 
    desc: "Applied if your proposed name requires substitution during query",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-500"
  },
  SCUML: { 
    label: "SCUML Certificate Registration", 
    category: "Compliance", 
    imageSrc: "/scuml.png",
    colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
  },
  TAX_ID_INDIVIDUAL: { 
    label: "Individual Tax ID (TIN)", 
    category: "Tax", 
    imageSrc: "/nrs.png",
    colorClass: "bg-purple-500/10 border-purple-500/20 text-purple-500"
  },
  TAX_ID_CORPORATE: { 
    label: "Corporate Tax ID (TIN)", 
    category: "Tax", 
    imageSrc: "/nrs.png",
    colorClass: "bg-purple-500/10 border-purple-500/20 text-purple-500"
  },
  AIRTIME: {
    label: "Airtime Top-up",
    desc: "The amount you buy is the exact amount deducted from your wallet.",
    category: "Utility",
    icon: DeviceMobile,
    colorClass: "bg-orange-500/10 border-orange-500/20 text-orange-500"
  }
};

export default function DashboardPricingPage() {
  const [pricingData, setPricingData] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/pricing");
        const data = await res.json();
        if (data.success && data.data) {
          setPricingData(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch pricing:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPricing();
  }, []);

  // Map metadata and safely merge dynamic prices or handle open prices
  const tableRows = Object.keys(PRICING_METADATA).map(key => {
    const meta = PRICING_METADATA[key];
    const isAirtime = key === "AIRTIME";
    const price = pricingData ? pricingData[key] || 0 : 0;

    return {
      key,
      ...meta,
      isAirtime,
      price
    };
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 pt-4 animate-in fade-in duration-500 relative">
      
      {/* Back Button */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-foreground">
            <Tag weight="fill" className="h-8 w-8 text-primary" />
            Service Pricing
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl leading-relaxed">
            Standard pricing for all Lorabiz services. Your wallet is charged automatically upon successful submission.
          </p>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5 flex gap-4">
        <Info weight="fill" className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
          <p className="font-bold mb-1">Pricing Notice</p>
          These are our standard service fees. There are no hidden charges.
        </div>
      </div>

      {/* Mobile Scroll Hint */}
      <div className="flex sm:hidden items-center justify-center gap-2 py-2 text-xs font-bold text-muted-foreground animate-pulse bg-secondary/50 rounded-lg">
        <ArrowsLeftRight weight="bold" className="h-4 w-4" />
        Swipe table sideways to view all details
      </div>

      {/* Unified Data Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center text-muted-foreground">
            <SpinnerGap className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p className="font-bold animate-pulse">Loading pricing data...</p>
          </div>
        ) : !pricingData ? (
          <div className="p-24 flex flex-col items-center justify-center text-muted-foreground text-center">
            <WarningCircle className="h-10 w-10 mb-4 opacity-50" />
            <p className="font-bold">Unable to load pricing data.</p>
            <p className="text-sm mt-1">Please check your internet connection or try again later.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-secondary/80 border-b border-border">
                <tr>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[11px]">Service Description</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[11px]">Category</th>
                  <th className="px-6 py-5 font-black text-muted-foreground uppercase tracking-widest text-[11px] text-right">Service Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tableRows.map((row) => (
                  <tr key={row.key} className="hover:bg-secondary/30 transition-colors group">
                    
                    {/* Service Name & Description */}
                    <td className="px-6 py-5">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center border shrink-0 overflow-hidden ${row.colorClass}`}>
                          {row.imageSrc ? (
                            <Image src={row.imageSrc} alt={row.label} width={20} height={20} className="object-contain" />
                          ) : row.icon ? (
                            <row.icon weight="fill" className="h-4 w-4" />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-[15px] group-hover:text-primary transition-colors">{row.label}</p>
                          {row.desc && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-sm whitespace-normal leading-relaxed">{row.desc}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category Badge */}
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${row.colorClass}`}>
                        {row.category}
                      </span>
                    </td>

                    {/* Live / Open Price */}
                    <td className="px-6 py-5 text-right">
                      <div className="inline-flex items-baseline gap-1 bg-background border border-border px-4 py-2 rounded-xl shadow-inner group-hover:border-primary/30 transition-colors">
                        {row.isAirtime ? (
                          <span className="font-black text-foreground text-[15px] tracking-tight">Open Price</span>
                        ) : (
                          <>
                            <span className="text-muted-foreground font-bold text-xs">₦</span>
                            <span className="font-black text-foreground text-lg tracking-tight">
                              {row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
