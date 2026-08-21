// src/app/dashboard/pricing/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Tag, SpinnerGap, Info, WarningCircle, ArrowsLeftRight, 
  ArrowLeft, DeviceMobile, MagnifyingGlass, CheckCircle,
  Buildings, ShieldCheck, IdentificationCard, IdentificationBadge,
  Cards, Sparkle, WifiHigh
} from "@phosphor-icons/react";

interface PricingItemMeta {
  label: string;
  desc?: string;
  category: "CAC Services" | "Compliance & Tax" | "NIN Identity" | "BVN Services" | "Utilities";
  imageSrc?: string;
  icon?: any;
  colorClass: string;
  isAirtime?: boolean;
  isDataSummary?: boolean;
}

const PRICING_METADATA: Record<string, PricingItemMeta> = {
  // CAC SERVICES
  BUSINESS_NAME: { 
    label: "Business Name Registration", 
    desc: "Complete corporate affairs registration with BN certificate & Status Report.",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
  },
  LLC: { 
    label: "Company Registration (LLC)", 
    desc: "Standard processing for Private Limited Company up to 1M Share Capital.",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
  },
  LLC_EXTRA_MILLION: { 
    label: "Additional Share Capital", 
    desc: "Fee applied per extra 1 Million shares above standard 1M share threshold.",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
  },
  NGO: { 
    label: "Incorporated Trustees / NGO", 
    desc: "Full NGO, Church, Foundation, or Association registration.",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
  },
  NAME_SUBSTITUTION: { 
    label: "Name Substitution Fee", 
    desc: "Applied if proposed business name requires substitution during query.",
    category: "CAC Services", 
    imageSrc: "/cac.png",
    colorClass: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
  },

  // COMPLIANCE & TAX
  SCUML: { 
    label: "SCUML Certificate Registration", 
    desc: "Anti-money laundering compliance certification by EFCC / SCUML.",
    category: "Compliance & Tax", 
    imageSrc: "/scuml.png",
    colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
  },
  TAX_ID_INDIVIDUAL: { 
    label: "Individual Tax ID (TIN)", 
    desc: "Personal Tax Identification Number issuance with official Tax clearance validation.",
    category: "Compliance & Tax", 
    imageSrc: "/nrs.png",
    colorClass: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
  },
  TAX_ID_CORPORATE: { 
    label: "Corporate Tax ID (TIN)", 
    desc: "Enterprise & company Tax Identification Number issuance for corporate banking.",
    category: "Compliance & Tax", 
    imageSrc: "/nrs.png",
    colorClass: "bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400"
  },

  // NIMC SLIPS BY NIN
  NIN_BASIC: {
    label: "NIN Slip - Basic Slip",
    desc: "Clean, essential NIN verification slip layout for quick verification.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },
  NIN_VNIN: {
    label: "NIN Slip - Virtual NIN (VNIN) Slip",
    desc: "Official verification slip generated using 16-digit Virtual NIN.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },
  NIN_REGULAR: {
    label: "NIN Slip - Regular (by NIN)",
    desc: "Standard layout accepted for corporate filings and business verification.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },
  NIN_STANDARD: {
    label: "NIN Slip - Standard Biometric (by NIN)",
    desc: "High-density biometric layout with photo and verification parameters.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },
  NIN_PREMIUM: {
    label: "NIN Slip - Premium ID Card (by NIN)",
    desc: "Full-colour card design formatted for PVC plastic card printing.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },

  // NIMC SLIPS BY PHONE NUMBER
  NIN_PHONE_REGULAR: {
    label: "NIN Phone Retrieval - Regular Slip",
    desc: "Lookup and generation of regular NIN slip using registered SIM phone number.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },
  NIN_PHONE_STANDARD: {
    label: "NIN Phone Retrieval - Standard Biometric",
    desc: "Lookup and generation of biometric NIN slip using registered SIM phone number.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },
  NIN_PHONE_PREMIUM: {
    label: "NIN Phone Retrieval - Premium Card",
    desc: "Lookup and generation of PVC-ready card slip using registered SIM phone number.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400"
  },

  // NIMC VALIDATION & SYNC
  NIN_VALIDATION_NO_RECORD: {
    label: "NIN Validation - No Record Found",
    desc: "Resolves missing NIN data from the national database for banking/passport.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
  },
  NIN_VALIDATION_VNIN: {
    label: "NIN Validation - Virtual NIN (VNIN)",
    desc: "Enterprise validation and synchronization of 16-digit Virtual NINs.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
  },
  NIN_VALIDATION_MOD: {
    label: "NIN Validation - Modification Sync",
    desc: "Expedited database synchronization after an offline NIMC record change.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
  },

  // NIMC MODIFICATION
  NIN_MOD_NAME: {
    label: "NIN Modification - Change of Name",
    desc: "Correction, rearrangement, or legal update of first, middle, or surname.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400"
  },
  NIN_MOD_PHONE: {
    label: "NIN Modification - Change of Phone Number",
    desc: "Update the registered phone number linked to your NIMC record.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400"
  },
  NIN_MOD_ADDRESS: {
    label: "NIN Modification - Change of Address",
    desc: "Update official residential state, LGA, or street address on NIMC database.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400"
  },

  // ADVANCED NIMC
  NIN_PERSONALIZATION: {
    label: "NIN Personalization (Tracking ID)",
    desc: "Direct resolution and slip issuance for unreleased enrollment Tracking IDs.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
  },
  NIN_IPE_CLEARANCE: {
    label: "NIN IPE Clearance Authorization",
    desc: "Clearance of biometric & exception verification holds on NIMC portal.",
    category: "NIN Identity",
    imageSrc: "/nimc.png",
    colorClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
  },

  // BVN SERVICES
  BVN_STANDARD: {
    label: "BVN Verification & Standard Slip",
    desc: "Instant NIBSS bank verification lookup and official standard verification slip.",
    category: "BVN Services",
    imageSrc: "/nibss.png",
    colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
  },
  BVN_PREMIUM: {
    label: "BVN Premium Slip",
    desc: "High-resolution bank verification slip with verified biometric profile.",
    category: "BVN Services",
    imageSrc: "/nibss.png",
    colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
  },
  BVN_RETRIEVAL: {
    label: "BVN Number Retrieval",
    desc: "11-digit BVN retrieval by matching linked phone number, full name, and DOB.",
    category: "BVN Services",
    imageSrc: "/nibss.png",
    colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
  },

  // UTILITIES
  AIRTIME: {
    label: "Airtime Top-Up (All Networks)",
    desc: "Instant airtime recharge for MTN, Airtel, Glo, and 9mobile at exact face value.",
    category: "Utilities",
    imageSrc: "/airtime.png",
    colorClass: "bg-orange-500/10 border-orange-500/20 text-orange-600 dark:text-orange-400",
    isAirtime: true
  },
  MOBILE_DATA: {
    label: "Mobile Data Bundles (SME / Gifting / CG)",
    desc: "Over 90+ high-speed telecom bundles across MTN, Airtel, and Glo starting from ₦180 / 1GB. Accessible in your dashboard.",
    category: "Utilities",
    imageSrc: "/airtime.png",
    colorClass: "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400",
    isDataSummary: true
  }
};

const CATEGORIES = ["ALL", "CAC Services", "Compliance & Tax", "NIN Identity", "BVN Services", "Utilities"] as const;

export default function DashboardPricingPage() {
  const [pricingData, setPricingData] = useState<Record<string, number> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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

  const tableRows = useMemo(() => {
    return Object.keys(PRICING_METADATA)
      .map((key) => {
        const meta = PRICING_METADATA[key];
        const price = pricingData ? pricingData[key] || 0 : 0;
        return {
          key,
          ...meta,
          price
        };
      })
      .filter((row) => {
        const matchesCategory = selectedCategory === "ALL" || row.category === selectedCategory;
        const matchesSearch =
          row.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (row.desc && row.desc.toLowerCase().includes(searchQuery.toLowerCase())) ||
          row.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      });
  }, [pricingData, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 pt-4 animate-in fade-in duration-300 relative font-sans">
      
      {/* Back Button */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/40 hover:bg-secondary px-3 py-1.5 rounded-xl cursor-pointer"
      >
        <ArrowLeft weight="bold" className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
            <Tag weight="bold" className="h-3 w-3" />
            Official Standard Rate Card
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Service Pricing Catalog
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Transparent, real-time rates for all LoraBiz compliance, identity, corporate, and telecom services. Charged automatically from your wallet upon order placement.
          </p>
        </div>
      </div>

      {/* Info Notice Banner */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <Info weight="fill" className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed space-y-0.5">
          <p className="font-bold text-sm text-foreground">Transparent Fee Guarantee</p>
          <p>These are our standard service rates. There are no hidden fees or surcharges. Mobile data bundles can be selected dynamically directly on the Mobile Data dashboard.</p>
        </div>
      </div>

      {/* Toolbar: Category Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 bg-secondary/50 p-1 rounded-2xl border border-border overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-foreground text-background shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat === "ALL" ? "All Services" : cat}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search service or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-muted-foreground/60"
          />
        </div>

      </div>

      {/* Pricing Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
            <SpinnerGap className="h-8 w-8 animate-spin mb-3 text-primary" />
            <p className="font-bold text-xs animate-pulse">Loading live pricing catalog...</p>
          </div>
        ) : !pricingData ? (
          <div className="p-20 flex flex-col items-center justify-center text-muted-foreground text-center">
            <WarningCircle className="h-8 w-8 mb-3 opacity-50 text-destructive" />
            <p className="font-bold text-sm text-foreground">Unable to load pricing data.</p>
            <p className="text-xs mt-1">Please check your internet connection and try again.</p>
          </div>
        ) : tableRows.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground text-xs">
            No services match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-secondary/60 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Service &amp; Description</th>
                  <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px]">Category</th>
                  <th className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[11px] text-right">Standard Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {tableRows.map((row) => (
                  <tr key={row.key} className="hover:bg-secondary/30 transition-colors group">
                    
                    {/* Service Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3.5">
                        <div className="h-10 w-10 rounded-xl bg-white border border-border p-1.5 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                          {row.imageSrc ? (
                            <Image 
                              src={row.imageSrc} 
                              alt={row.label} 
                              width={28} 
                              height={28} 
                              className="object-contain w-full h-full" 
                            />
                          ) : row.icon ? (
                            <row.icon weight="fill" className="h-5 w-5 text-muted-foreground" />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {row.label}
                          </p>
                          {row.desc && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-md leading-relaxed">
                              {row.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${row.colorClass}`}>
                        {row.category}
                      </span>
                    </td>

                    {/* Fee */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-baseline gap-1 bg-background border border-border px-3.5 py-1.5 rounded-xl shadow-xs group-hover:border-emerald-500/30 transition-colors">
                        {row.isAirtime ? (
                          <span className="font-black text-foreground text-xs tracking-tight">
                            Face Value (1:1)
                          </span>
                        ) : row.isDataSummary ? (
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-xs tracking-tight">
                            From ₦180 / 1GB
                          </span>
                        ) : (
                          <>
                            <span className="text-muted-foreground font-bold text-xs">₦</span>
                            <span className="font-black text-foreground text-base tracking-tight">
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
