// src/app/dashboard/vouchers/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Ticket, 
  Gift, 
  Copy, 
  Check, 
  Clock, 
  ShieldCheck, 
  Sparkle, 
  Spinner,
  ArrowRight, 
  Tag,
  CheckCircle,
  Coins,
  IdentificationCard,
  Fingerprint,
  FileText,
  DeviceMobile,
  Wallet
} from "@phosphor-icons/react";

export default function MyWonRewardsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "SERVICES" | "DISCOUNTS" | "USED">("ALL");
  const [vouchersData, setVouchersData] = useState<any>({
    active: [],
    redeemed: [],
    expired: [],
    summary: { totalActive: 0, ninSlip: 0, ninValidation: 0, ninPersonalization: 0, taxIdPass: 0, cacVouchers: 0, airtimeDiscounts: 0 },
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/vouchers");
      const data = await res.json();
      if (data.success) {
        setVouchersData(data);
      }
    } catch (err) {
      console.error("Failed to load rewards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const activeItems = vouchersData.active || [];
  const redeemedItems = vouchersData.redeemed || [];
  const summary = vouchersData.summary || { totalActive: 0, ninSlip: 0, ninValidation: 0, ninPersonalization: 0, taxIdPass: 0, cacVouchers: 0, airtimeDiscounts: 0 };

  const filteredItems = 
    activeTab === "ALL" 
      ? activeItems 
      : activeTab === "SERVICES" 
      ? activeItems.filter((i: any) => i.rewardType === "NIN_SLIP" || i.rewardType === "NIN_VALIDATION" || i.rewardType === "NIN_PERSONALIZATION" || i.rewardType === "TAX_ID_PASS")
      : activeTab === "DISCOUNTS"
      ? activeItems.filter((i: any) => i.rewardType === "CAC_VOUCHER" || i.rewardType === "SCUML_VOUCHER" || i.rewardType === "AIRTIME")
      : redeemedItems;

  const getServiceDetails = (type: string) => {
    switch (type) {
      case "NIN_SLIP":
        return {
          link: "/dashboard/nin/slips/nin",
          label: "Use Free Slip Now",
          badge: "100% Free Slip",
          icon: IdentificationCard,
          color: "blue"
        };
      case "NIN_VALIDATION":
        return {
          link: "/dashboard/nin/validation",
          label: "Validate NIN Free",
          badge: "100% Free Validation",
          icon: Fingerprint,
          color: "emerald"
        };
      case "NIN_PERSONALIZATION":
        return {
          link: "/dashboard/nin/personalization",
          label: "Personalize NIN Free",
          badge: "100% Free Service",
          icon: ShieldCheck,
          color: "indigo"
        };
      case "TAX_ID_PASS":
        return {
          link: "/dashboard/tax-id",
          label: "Generate Tax ID Free",
          badge: "100% Free Tax ID",
          icon: IdentificationCard,
          color: "orange"
        };
      case "AIRTIME":
        return {
          link: "/dashboard/utilities/airtime",
          label: "Recharge Airtime (Discount)",
          badge: "Airtime Discount",
          icon: DeviceMobile,
          color: "emerald"
        };
      case "CAC_VOUCHER":
        return {
          link: "/dashboard/cac",
          label: "Apply Discount (₦1,000 OFF)",
          badge: "Discount Code",
          icon: FileText,
          color: "amber"
        };
      case "SCUML_VOUCHER":
        return {
          link: "/dashboard/scuml",
          label: "Apply SCUML Discount",
          badge: "Discount Code",
          icon: Tag,
          color: "purple"
        };
      case "WALLET_CASH":
        return {
          link: "/dashboard/wallet",
          label: "View Wallet",
          badge: "Wallet Cash",
          icon: Wallet,
          color: "amber"
        };
      default:
        return {
          link: "/dashboard",
          label: "Claim Reward",
          badge: "Free Reward",
          icon: Gift,
          color: "pink"
        };
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 group"
          >
            <ArrowLeft weight="bold" className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
              <Ticket weight="fill" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                <span>My Won Rewards</span>
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {summary.totalActive} Ready to Use
                </span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                All your free services, free slips, airtime bonuses, and discounts won from Lucky Spins and Promotions.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/rewards"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all group shrink-0"
        >
          <Gift weight="fill" className="h-4 w-4" />
          <span>Spin &amp; Win More</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Helpful Checkout Explanation Banner */}
      <div className="p-3.5 rounded-2xl bg-secondary/50 border border-border flex items-center gap-3 text-xs text-muted-foreground">
        <Sparkle weight="fill" className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong className="text-foreground font-semibold">Applied at checkout:</strong> Your free slips and discounts are automatically applied when you checkout on the service forms. Click any reward below to jump straight to the service!
        </span>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <IdentificationCard weight="bold" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted-foreground block font-medium leading-tight">Free NIN Slips</span>
            <span className="text-sm sm:text-base font-bold text-foreground block leading-normal mt-0.5">{summary.ninSlip || 0} Available</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Fingerprint weight="bold" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted-foreground block font-medium leading-tight">Free Validations</span>
            <span className="text-sm sm:text-base font-bold text-foreground block leading-normal mt-0.5">{summary.ninValidation || 0} Available</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <ShieldCheck weight="bold" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted-foreground block font-medium leading-tight">Personalization</span>
            <span className="text-sm sm:text-base font-bold text-foreground block leading-normal mt-0.5">{summary.ninPersonalization || 0} Available</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
            <IdentificationCard weight="bold" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted-foreground block font-medium leading-tight">Free Tax IDs</span>
            <span className="text-sm sm:text-base font-bold text-foreground block leading-normal mt-0.5">{summary.taxIdPass || 0} Available</span>
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-2.5 min-w-0 col-span-2 sm:col-span-1">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Tag weight="bold" className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] sm:text-xs text-muted-foreground block font-medium leading-tight">Discounts &amp; Airtime</span>
            <span className="text-sm sm:text-base font-bold text-foreground block leading-normal mt-0.5">{(summary.cacVouchers || 0) + (summary.airtimeDiscounts || 0)} Available</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "ALL"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          All Active ({activeItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SERVICES")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "SERVICES"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          Free Services ({summary.ninSlip + summary.ninValidation + summary.ninPersonalization + (summary.taxIdPass || 0)})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DISCOUNTS")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "DISCOUNTS"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          Discounts &amp; Airtime ({(summary.cacVouchers || 0) + (summary.airtimeDiscounts || 0)})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("USED")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "USED"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          Used &amp; History ({redeemedItems.length})
        </button>
      </div>

      {/* Rewards Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner weight="bold" className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground mt-2 font-medium">Loading your rewards...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-10 text-center bg-card border border-border rounded-3xl space-y-4 max-w-md mx-auto">
          <div className="h-14 w-14 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mx-auto">
            <Ticket weight="duotone" className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Rewards Here Yet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {activeTab === "USED"
                ? "You haven't used any rewards yet."
                : "Top up your wallet with ₦15,000 or more to earn Lucky Spins and win 100% Free NIN Slips, Airtime bonuses, and discounts!"}
            </p>
          </div>
          {activeTab !== "USED" && (
            <Link
              href="/dashboard/rewards"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity shadow-xs"
            >
              <Gift weight="fill" className="h-4 w-4" />
              <span>Spin &amp; Win Free Rewards</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((voucher: any) => {
            const isRedeemed = voucher.status === "REDEEMED";
            const details = getServiceDetails(voucher.rewardType);
            const IconComp = details.icon;

            return (
              <div
                key={voucher.id}
                className={`rounded-2xl sm:rounded-3xl border transition-all p-4 sm:p-5 flex flex-col justify-between shadow-xs ${
                  isRedeemed
                    ? "bg-secondary/30 border-border opacity-65"
                    : "bg-card border-border hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header Tag with Normal Clean Font */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        isRedeemed
                          ? "bg-secondary text-muted-foreground border-border"
                          : voucher.rewardType === "NIN_SLIP"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : voucher.rewardType === "NIN_VALIDATION"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : voucher.rewardType === "NIN_PERSONALIZATION"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          : voucher.rewardType === "TAX_ID_PASS"
                          ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20"
                          : voucher.rewardType === "AIRTIME"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {isRedeemed ? "Used" : details.badge}
                    </span>

                    {voucher.expiresAt && !isRedeemed && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock weight="bold" className="h-3 w-3" />
                        Expires {new Date(voucher.expiresAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      voucher.rewardType === "NIN_SLIP"
                        ? "bg-blue-500/10 text-blue-500"
                        : voucher.rewardType === "NIN_VALIDATION" || voucher.rewardType === "AIRTIME"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : voucher.rewardType === "NIN_PERSONALIZATION"
                        ? "bg-indigo-500/10 text-indigo-500"
                        : voucher.rewardType === "TAX_ID_PASS"
                        ? "bg-orange-500/10 text-orange-500"
                        : "bg-amber-500/10 text-amber-500"
                    }`}>
                      <IconComp size={20} weight="bold" />
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-foreground leading-snug">
                        {voucher.title}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {voucher.description}
                      </p>
                    </div>
                  </div>

                  {/* Promo Code Box (If applicable) */}
                  {voucher.voucherCode && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/60 border border-border">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Promo Code</span>
                        <span className="font-mono font-bold text-xs sm:text-sm text-foreground tracking-wider">
                          {voucher.voucherCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(voucher.voucherCode)}
                        className="p-1.5 rounded-lg bg-background border border-border hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-muted-foreground"
                        title="Copy Code"
                      >
                        {copiedCode === voucher.voucherCode ? (
                          <Check weight="bold" className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy weight="bold" className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Action CTA */}
                <div className="pt-3 border-t border-border mt-3">
                  {isRedeemed ? (
                    <div className="text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-1.5 py-1">
                      <CheckCircle weight="fill" className="h-4 w-4 text-emerald-500" />
                      <span>Used {voucher.redeemedAt ? `on ${new Date(voucher.redeemedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}` : ""}</span>
                    </div>
                  ) : (
                    <Link
                      href={details.link}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <span>{details.label}</span>
                      <ArrowRight weight="bold" className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
