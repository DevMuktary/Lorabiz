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
  Coins
} from "@phosphor-icons/react";

export default function VouchersVaultPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PASSES" | "DISCOUNTS" | "USED">("ALL");
  const [vouchersData, setVouchersData] = useState<any>({
    active: [],
    redeemed: [],
    expired: [],
    summary: { totalActive: 0, ninSlip: 0, ninValidation: 0, ninPersonalization: 0, cacVouchers: 0 },
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
      console.error("Failed to load vouchers:", err);
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
  const summary = vouchersData.summary || { totalActive: 0, ninSlip: 0, ninValidation: 0, ninPersonalization: 0, cacVouchers: 0 };

  const filteredItems = 
    activeTab === "ALL" 
      ? activeItems 
      : activeTab === "PASSES" 
      ? activeItems.filter((i: any) => i.rewardType === "NIN_SLIP" || i.rewardType === "NIN_VALIDATION" || i.rewardType === "NIN_PERSONALIZATION")
      : activeTab === "DISCOUNTS"
      ? activeItems.filter((i: any) => i.rewardType === "CAC_VOUCHER" || i.rewardType === "SCUML_VOUCHER")
      : redeemedItems;

  const getServiceLink = (type: string) => {
    switch (type) {
      case "NIN_SLIP":
        return "/dashboard/nin";
      case "NIN_VALIDATION":
        return "/dashboard/nin/validation";
      case "NIN_PERSONALIZATION":
        return "/dashboard/nin/personalization";
      case "CAC_VOUCHER":
        return "/dashboard/cac/business-name";
      case "SCUML_VOUCHER":
        return "/dashboard/scuml";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
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
            <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Ticket weight="fill" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                My Vouchers & Reward Passes
                <span className="text-[10px] uppercase font-black tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  {summary.totalActive} Active
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Your free service passes and discount codes unlocked from Lucky Spins and Promotions.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/dashboard/rewards"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all group shrink-0"
        >
          <Gift weight="fill" className="h-4 w-4" />
          <span>Go to Lucky Spin Wheel</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <ShieldCheck weight="bold" className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Free NIN Slips</span>
            <span className="text-lg font-black text-foreground font-mono">{summary.ninSlip} Passes</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center shrink-0">
            <CheckCircle weight="bold" className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Free Validations</span>
            <span className="text-lg font-black text-foreground font-mono">{summary.ninValidation} Passes</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Sparkle weight="bold" className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Personalization</span>
            <span className="text-lg font-black text-foreground font-mono">{summary.ninPersonalization} Passes</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
            <Tag weight="bold" className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">CAC Vouchers</span>
            <span className="text-lg font-black text-foreground font-mono">{summary.cacVouchers} Available</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "ALL"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          All Active ({activeItems.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PASSES")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "PASSES"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          Free Service Passes ({summary.ninSlip + summary.ninValidation + summary.ninPersonalization})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("DISCOUNTS")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "DISCOUNTS"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          Discount Vouchers ({summary.cacVouchers})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("USED")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "USED"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
        >
          Used & History ({redeemedItems.length})
        </button>
      </div>

      {/* Vouchers Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner weight="bold" className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-xs text-muted-foreground mt-2 font-medium">Loading your vouchers vault...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-3xl space-y-4 max-w-lg mx-auto">
          <div className="h-16 w-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center mx-auto">
            <Ticket weight="duotone" className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">No Vouchers Found</h3>
            <p className="text-xs text-muted-foreground">
              {activeTab === "USED"
                ? "You haven't redeemed any vouchers yet."
                : "Fund your wallet with ₦20,000 or more to unlock instant Lucky Spins and earn free passes!"}
            </p>
          </div>
          {activeTab !== "USED" && (
            <Link
              href="/dashboard/rewards"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              <Gift weight="fill" className="h-4 w-4" />
              Spin to Win Vouchers
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((voucher: any) => {
            const isRedeemed = voucher.status === "REDEEMED";
            const serviceLink = getServiceLink(voucher.rewardType);

            return (
              <div
                key={voucher.id}
                className={`relative rounded-3xl border transition-all p-6 flex flex-col justify-between overflow-hidden group ${
                  isRedeemed
                    ? "bg-secondary/40 border-border opacity-70"
                    : "bg-card border-border hover:border-primary/50 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Decorative Ticket Perforations on sides */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border border-border" />

                <div className="space-y-4">
                  {/* Card Header Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        isRedeemed
                          ? "bg-muted text-muted-foreground border-border"
                          : voucher.rewardType === "NIN_SLIP"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          : voucher.rewardType === "NIN_VALIDATION"
                          ? "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20"
                          : voucher.rewardType === "NIN_PERSONALIZATION"
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                          : "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20"
                      }`}
                    >
                      {isRedeemed ? "REDEEMED" : voucher.rewardType.replace("_", " ")}
                    </span>

                    {voucher.expiresAt && !isRedeemed && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                        <Clock weight="bold" className="h-3 w-3" />
                        Expires {new Date(voucher.expiresAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <h3 className="text-base font-black text-foreground">{voucher.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {voucher.description}
                    </p>
                  </div>

                  {/* Voucher Code Box (If applicable) */}
                  {voucher.voucherCode && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary border border-border">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block">Promo Code</span>
                        <span className="font-mono font-black text-sm text-foreground tracking-wider">
                          {voucher.voucherCode}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(voucher.voucherCode)}
                        className="p-2 rounded-xl bg-background border border-border hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-muted-foreground"
                        title="Copy Code"
                      >
                        {copiedCode === voucher.voucherCode ? (
                          <Check weight="bold" className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy weight="bold" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Action */}
                <div className="pt-6 border-t border-dashed border-border mt-4">
                  {isRedeemed ? (
                    <div className="text-center text-xs font-bold text-muted-foreground flex items-center justify-center gap-1.5">
                      <CheckCircle weight="fill" className="h-4 w-4 text-emerald-500" />
                      <span>Redeemed on {new Date(voucher.redeemedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}</span>
                    </div>
                  ) : (
                    <Link
                      href={serviceLink}
                      className="w-full py-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold border border-border hover:border-primary flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>Use Pass in Service</span>
                      <ArrowRight weight="bold" className="h-3.5 w-3.5" />
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
