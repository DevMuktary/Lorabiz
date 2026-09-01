"use client";

import { useState, useEffect, useMemo } from "react";
import { format, isPast } from "date-fns";
import { 
  Ticket, Tag, Activity, Plus, RefreshCw, X, Copy, Check, Percent, DollarSign, Eye, Users, Trash2, AlertTriangle,
  Zap, Sparkles, ChevronDown, ChevronUp, CheckCircle2, Info, Edit3
} from "lucide-react";

// Catalog definition with price lookup keys
const SERVICE_GROUPS = [
  {
    category: "Corporate & Compliance Services",
    items: [
      { id: "BUSINESS_NAME", name: "CAC Business Name Registration", priceKey: "BUSINESS_NAME" },
      { id: "LLC", name: "CAC Company (LLC) Registration", priceKey: "LLC" },
      { id: "NGO", name: "CAC NGO / Incorporated Trustees", priceKey: "NGO" },
      { id: "SCUML", name: "SCUML Certificate Processing", priceKey: "SCUML" },
      { id: "TAX_ID", name: "Tax Identification Number (TIN)", priceKey: "TAX_ID" },
    ],
  },
  {
    category: "Court Sworn Affidavits",
    items: [
      { 
        id: "AFFIDAVIT", 
        name: "Court Sworn Affidavits (All 6 Types)", 
        priceKey: "AFFIDAVIT_STATE",
        isParent: true,
        subOptions: [
          { id: "AFFIDAVIT_STATE", name: "State High Court Sworn Affidavit", priceKey: "AFFIDAVIT_STATE" },
          { id: "AFFIDAVIT_FEDERAL", name: "Federal High Court Sworn Affidavit (Attested)", priceKey: "AFFIDAVIT_FEDERAL" },
          { id: "AFFIDAVIT_CHANGE_OF_NAME", name: "Affidavit of Change / Correction of Name", priceKey: "AFFIDAVIT_CHANGE_OF_NAME" },
          { id: "AFFIDAVIT_AGE_DECLARATION", name: "Affidavit of Age Declaration / DOB", priceKey: "AFFIDAVIT_AGE_DECLARATION" },
          { id: "AFFIDAVIT_CAC_CORPORATE", name: "Affidavit for CAC Corporate / Loss of Reg", priceKey: "AFFIDAVIT_CAC_CORPORATE" },
          { id: "AFFIDAVIT_LOSS_OF_ITEM", name: "Affidavit of Loss of Document / SIM", priceKey: "AFFIDAVIT_LOSS_OF_ITEM" },
          { id: "AFFIDAVIT_PROOF_OF_OWNERSHIP", name: "Affidavit of Proof of Ownership", priceKey: "AFFIDAVIT_PROOF_OF_OWNERSHIP" },
          { id: "AFFIDAVIT_GENERAL_PURPOSE", name: "General Sworn Affidavit", priceKey: "AFFIDAVIT_GENERAL_PURPOSE" },
        ]
      },
    ],
  },
  {
    category: "Identity & Verification Services (Direct)",
    items: [
      { id: "NIN_PERSONALIZATION", name: "NIN Personalization (Tracking ID)", priceKey: "NIN_PERSONALIZATION" },
      { id: "NIN_IPE_CLEARANCE", name: "NIN IPE Clearance", priceKey: "NIN_IPE_CLEARANCE" },
      { 
        id: "NIN_VALIDATION", 
        name: "NIN Validation (All 4 Categories)", 
        priceKey: "NIN_VALIDATION_VNIN",
        isParent: true,
        subOptions: [
          { id: "NIN_VALIDATION_NO_RECORD", name: "No Record Found Validation", priceKey: "NIN_VALIDATION_NO_RECORD" },
          { id: "NIN_VALIDATION_VNIN", name: "VNIN & SIM/Bank Validation", priceKey: "NIN_VALIDATION_VNIN" },
          { id: "NIN_VALIDATION_MOD", name: "Update Record / Mod Validation", priceKey: "NIN_VALIDATION_MOD" },
          { id: "NIN_VALIDATION_PHOTO_ERROR", name: "Photographic Error Validation", priceKey: "NIN_VALIDATION_PHOTO_ERROR" },
        ]
      },
      { 
        id: "NIN_MODIFICATION", 
        name: "NIN Modification (All Types)", 
        priceKey: "NIN_MOD_NAME",
        isParent: true,
        subOptions: [
          { id: "NIN_MOD_NAME", name: "NIN Change of Name", priceKey: "NIN_MOD_NAME" },
          { id: "NIN_MOD_PHONE", name: "NIN Change of Phone", priceKey: "NIN_MOD_PHONE" },
          { id: "NIN_MOD_ADDRESS", name: "NIN Change of Address", priceKey: "NIN_MOD_ADDRESS" },
          { id: "NIN_MOD_DOB", name: "NIN Change of Date of Birth", priceKey: "NIN_MOD_NAME" },
        ]
      },
      { id: "BVN_RETRIEVAL", name: "BVN Retrieval", priceKey: "BVN_RETRIEVAL" },
      { 
        id: "BVN_MODIFICATION", 
        name: "BVN Modification (All 7 Options)", 
        priceKey: "BVN_MOD_ALL",
        isParent: true,
        subOptions: [
          { id: "BVN_MOD_NAME", name: "Change of Name Only", priceKey: "BVN_MOD_NAME" },
          { id: "BVN_MOD_PHONE", name: "Change of Phone Number Only", priceKey: "BVN_MOD_PHONE" },
          { id: "BVN_MOD_DOB", name: "Change of Date of Birth (DOB) Only", priceKey: "BVN_MOD_DOB" },
          { id: "BVN_MOD_NAME_PHONE", name: "Change of Name & Phone", priceKey: "BVN_MOD_NAME_PHONE" },
          { id: "BVN_MOD_DOB_PHONE", name: "Change of DOB & Phone", priceKey: "BVN_MOD_DOB_PHONE" },
          { id: "BVN_MOD_NAME_DOB", name: "Change of Name & DOB", priceKey: "BVN_MOD_NAME_DOB" },
          { id: "BVN_MOD_ALL", name: "Change of Name, DOB & Phone (All 3)", priceKey: "BVN_MOD_ALL" },
        ]
      },
    ],
  },
];

export default function MarketingDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"AUTO" | "VOUCHER">("AUTO");
  const [promos, setPromos] = useState<any[]>([]);
  const [servicePricingMap, setServicePricingMap] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<any>({
    total: 0,
    active: 0,
    totalUses: 0,
    totalDiscountGiven: 0,
    autoAppliedTotal: 0,
    autoAppliedActive: 0,
    autoAppliedUses: 0,
    autoDiscountGiven: 0,
    voucherTotal: 0,
    voucherActive: 0,
    voucherUses: 0,
    voucherDiscountGiven: 0,
  });
  
  // Modals & Drawers State
  const [isAutoDrawerOpen, setIsAutoDrawerOpen] = useState(false);
  const [isVoucherDrawerOpen, setIsVoucherDrawerOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);
  const [editingPromo, setEditingPromo] = useState<any | null>(null);
  
  // Custom Delete State
  const [promoToDelete, setPromoToDelete] = useState<{ id: string; code: string; isAuto: boolean } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/marketing");
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setPromos(result.promos || []);
      setMetrics(result.metrics || {});
      if (result.servicePricingMap) {
        setServicePricingMap(result.servicePricingMap);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const toggleStatus = async (id: string, code: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/mds/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "TOGGLE_STATUS", id, code, isActive: !currentStatus }),
      });
      if (res.ok) fetchPromos(); 
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDeleteClick = (id: string, code: string, isAuto: boolean) => {
    setPromoToDelete({ id, code, isAuto });
  };

  const confirmDelete = async () => {
    if (!promoToDelete) return;
    setIsDeleting(true);
    
    try {
      const res = await fetch("/api/mds/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "DELETE", id: promoToDelete.id, code: promoToDelete.code }),
      });
      if (res.ok) {
        setPromoToDelete(null);
        fetchPromos(); 
      } else {
        alert("Failed to delete discount.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };

  const CopyBtn = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    return (
      <button 
        onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="ml-2 p-1 text-zinc-400 hover:text-indigo-500 transition-colors"
        title="Copy Code"
      >
        {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      </button>
    );
  };

  // Filter lists based on active tab
  const autoAppliedList = promos.filter((p) => p.isAutoApplied);
  const voucherList = promos.filter((p) => !p.isAutoApplied);
  const activeList = activeTab === "AUTO" ? autoAppliedList : voucherList;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <span>Discounts & Promo Campaigns</span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage automatic flash sale price slashes and customer coupon voucher codes.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={fetchPromos} 
            className="flex items-center px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
          
          <button 
            onClick={() => setIsAutoDrawerOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Zap size={16} className="fill-current" />
            <span>New Auto-Applied Discount</span>
          </button>

          <button 
            onClick={() => setIsVoucherDrawerOpen(true)} 
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Voucher Code</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-1">
        <button
          onClick={() => setActiveTab("AUTO")}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "AUTO"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Zap size={16} className={activeTab === "AUTO" ? "text-emerald-600 dark:text-emerald-400 fill-current" : ""} />
          <span>⚡ Auto-Applied Flash Discounts (Live Price Slashes)</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {autoAppliedList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("VOUCHER")}
          className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === "VOUCHER"
              ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 shadow-xs"
              : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <Ticket size={16} className={activeTab === "VOUCHER" ? "text-indigo-600 dark:text-indigo-400" : ""} />
          <span>🎟️ Manual Voucher Codes (Typed at Checkout)</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            {voucherList.length}
          </span>
        </button>
      </div>

      {/* Metrics Cards */}
      {activeTab === "AUTO" ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard 
            title="Auto-Applied Campaigns" 
            value={metrics.autoAppliedTotal || 0} 
            icon={<Zap size={20} className="text-emerald-500" />} 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Live Price Slashes" 
            value={metrics.autoAppliedActive || 0} 
            icon={<Activity size={20} className="text-emerald-600" />} 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Automatic Redemptions" 
            value={metrics.autoAppliedUses || 0} 
            icon={<Tag size={20} className="text-amber-500" />} 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Total Discount Subsidized" 
            value={`₦${Number(metrics.autoDiscountGiven || 0).toLocaleString()}`} 
            icon={<Sparkles size={20} className="text-indigo-500" />} 
            isLoading={isLoading} 
            highlight 
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <MetricCard 
            title="Total Voucher Codes" 
            value={metrics.voucherTotal || 0} 
            icon={<Ticket size={20} className="text-indigo-500" />} 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Active Voucher Codes" 
            value={metrics.voucherActive || 0} 
            icon={<Activity size={20} className="text-emerald-500" />} 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Customer Redemptions" 
            value={metrics.voucherUses || 0} 
            icon={<Tag size={20} className="text-amber-500" />} 
            isLoading={isLoading} 
          />
          <MetricCard 
            title="Total Discount Subsidized" 
            value={`₦${Number(metrics.voucherDiscountGiven || 0).toLocaleString()}`} 
            icon={<Sparkles size={20} className="text-indigo-500" />} 
            isLoading={isLoading} 
            highlight 
          />
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {activeTab === "AUTO" ? "Active Auto-Applied Service Discounts" : "Active Customer Voucher Codes"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {activeTab === "AUTO"
                ? "These discounts are live immediately on user service forms without requiring any promo code input."
                : "Customers must type these codes in the payment modal to claim the discount."}
            </p>
          </div>
          <button
            onClick={() => (activeTab === "AUTO" ? setIsAutoDrawerOpen(true) : setIsVoucherDrawerOpen(true))}
            className="text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            + Create New
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">{activeTab === "AUTO" ? "Discount / Campaign" : "Promo Code"}</th>
                <th className="px-6 py-4 font-medium">Discount Rate</th>
                <th className="px-6 py-4 font-medium">Eligible Services</th>
                <th className="px-6 py-4 font-medium text-center">Usage Count</th>
                <th className="px-6 py-4 font-medium text-right">Discount Given</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />
                    Loading campaigns...
                  </td>
                </tr>
              ) : activeList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-bold text-zinc-700 dark:text-zinc-300">
                        {activeTab === "AUTO" ? "No auto-applied discounts created yet." : "No promo voucher codes created yet."}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {activeTab === "AUTO"
                          ? "Click 'New Auto-Applied Discount' to launch a flash sale with direct slashed prices on services."
                          : "Click 'New Voucher Code' to create coupon codes for customers to enter at checkout."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeList.map((p: any) => {
                  const isExpired = p.expiresAt && isPast(new Date(p.expiresAt));
                  const isMaxedOut = p.usageLimit && p.timesUsed >= p.usageLimit;
                  const isTrulyActive = p.isActive && !isExpired && !isMaxedOut;

                  const campaignDiscountGiven = p.usages?.reduce(
                    (sum: number, u: any) => sum + Number(u.discountAmount || 0),
                    0
                  ) || 0;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          {p.name ? (
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {p.isAutoApplied && <Zap size={14} className="text-emerald-500 fill-current shrink-0" />}
                              <span>{p.name}</span>
                            </div>
                          ) : (
                            <div className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              {p.code}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-zinc-400 font-mono mt-0.5">
                            <span>Ref: {p.code}</span>
                            <CopyBtn text={p.code} />
                          </div>
                          {p.expiresAt && (
                            <span className="block text-[11px] text-zinc-500 mt-1">
                              Expires: {format(new Date(p.expiresAt), "MMM do, yyyy h:mm a")}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {p.discountPct ? (
                          <span className="inline-flex items-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-xs">
                            <Percent size={13} className="mr-1" /> {p.discountPct}% OFF
                          </span>
                        ) : (
                          <span className="inline-flex items-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-xs">
                            <DollarSign size={13} className="mr-1" /> ₦{Number(p.fixedAmount).toLocaleString()} OFF
                          </span>
                        )}
                        <span className="block text-[10px] text-zinc-400 mt-1">
                          Limit: {p.perUserLimit} per user
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.restrictedServices?.includes("ALL") ? (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold border border-indigo-500/20">
                              ⚡ ALL SERVICES
                            </span>
                          ) : (
                            p.restrictedServices?.map((s: string) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 rounded bg-secondary text-foreground text-[10px] font-bold border border-border"
                              >
                                {s.replace(/_/g, " ")}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {p.timesUsed} {p.usageLimit ? `/ ${p.usageLimit}` : "times"}
                          </span>
                          {isMaxedOut && (
                            <span className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">
                              Limit Reached
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {campaignDiscountGiven > 0 ? (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            ₦{campaignDiscountGiven.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-zinc-400">₦0</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            isTrulyActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/30"
                              : isExpired
                              ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                          }`}
                        >
                          {isTrulyActive ? "Active" : isExpired ? "Expired" : "Paused"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center space-x-1.5">
                        <button 
                          onClick={() => setEditingPromo(p)}
                          className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer inline-block"
                          title="Edit Promo / Discount"
                        >
                          <Edit3 size={17} />
                        </button>
                        <button 
                          onClick={() => setSelectedPromo(p)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer inline-block"
                          title="View Redeemers"
                        >
                          <Eye size={17} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(p.id, p.code, p.isActive)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                            p.isActive 
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:hover:bg-amber-500/10" 
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                          }`}
                        >
                          {p.isActive ? "Turn Off" : "Turn On"}
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(p.id, p.code, p.isAutoApplied)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer inline-block"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DRAWERS & MODALS --- */}

      {/* 1. Custom Delete Confirmation Modal */}
      {promoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={() => !isDeleting && setPromoToDelete(null)}></div>
          <div className="relative bg-white dark:bg-zinc-950 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
                <AlertTriangle size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2">
              Delete {promoToDelete.isAuto ? "Auto-Applied Discount" : "Promo Code"}?
            </h3>
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-zinc-900 dark:text-white">{promoToDelete.code}</strong>? Normal base pricing will immediately resume.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPromoToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-red-600 hover:bg-red-700 text-white transition-colors flex justify-center items-center disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <RefreshCw size={16} className="animate-spin" /> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Auto-Applied Flash Discount Drawer */}
      <CreateAutoDiscountDrawer 
        isOpen={isAutoDrawerOpen} 
        servicePricingMap={servicePricingMap}
        onClose={() => setIsAutoDrawerOpen(false)} 
        onSuccess={() => { setIsAutoDrawerOpen(false); fetchPromos(); }}
      />

      {/* 3. Manual Voucher Promo Code Drawer */}
      <CreateVoucherDrawer 
        isOpen={isVoucherDrawerOpen} 
        onClose={() => setIsVoucherDrawerOpen(false)} 
        onSuccess={() => { setIsVoucherDrawerOpen(false); fetchPromos(); }}
      />

      {/* 4. Edit Promo / Discount Drawer */}
      <EditPromoDrawer 
        isOpen={!!editingPromo} 
        promo={editingPromo}
        servicePricingMap={servicePricingMap}
        onClose={() => setEditingPromo(null)} 
        onSuccess={() => { setEditingPromo(null); fetchPromos(); }}
      />
      
      {/* 5. Inspection Drawer */}
      <PromoInspectionDrawer 
        promo={selectedPromo}
        onClose={() => setSelectedPromo(null)}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function MetricCard({ title, value, icon, isLoading, highlight }: any) {
  return (
    <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{title}</p>
        {icon}
      </div>
      {isLoading ? (
        <div className="w-16 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mt-2"></div>
      ) : (
        <h3 className={`text-2xl font-black tabular-nums tracking-tight ${highlight ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-white"}`}>
          {value}
        </h3>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. AUTO-APPLIED DISCOUNT DRAWER (WITH DYNAMIC LIVE PRICING & SIMULATOR)
// ----------------------------------------------------------------------

function CreateAutoDiscountDrawer({ 
  isOpen, 
  servicePricingMap, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  servicePricingMap: Record<string, number>; 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>(["ALL"]);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({
    BVN_MODIFICATION: false,
    NIN_VALIDATION: false,
    NIN_MODIFICATION: false,
  });
  const [perUserLimit, setPerUserLimit] = useState("5");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const numValue = Number(value) || 0;

  const toggleParentExpand = (parentId: string) => {
    setExpandedParents((prev) => ({ ...prev, [parentId]: !prev[parentId] }));
  };

  const toggleService = (sId: string) => {
    if (sId === "ALL") {
      setSelectedServices(["ALL"]);
    } else {
      const filtered = selectedServices.filter((s) => s !== "ALL");
      if (filtered.includes(sId)) {
        const next = filtered.filter((s) => s !== sId);
        setSelectedServices(next.length === 0 ? ["ALL"] : next);
      } else {
        setSelectedServices([...filtered, sId]);
      }
    }
  };

  const isAllSelected = selectedServices.includes("ALL");

  // Helper to calculate simulated discount price
  const calculateDiscount = (basePrice: number) => {
    if (numValue <= 0) return { final: basePrice, saved: 0 };
    let saved = 0;
    if (type === "PERCENTAGE") {
      saved = Math.round((basePrice * numValue) / 100);
    } else {
      saved = Math.round(numValue);
    }
    saved = Math.min(saved, basePrice);
    return {
      final: Math.max(0, basePrice - saved),
      saved,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/mds/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "CREATE",
          name: name.trim(),
          type,
          value,
          isAutoApplied: true,
          restrictedServices: selectedServices,
          perUserLimit,
          usageLimit: usageLimit || null,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setName("");
      setValue("");
      setSelectedServices(["ALL"]);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create auto-applied discount.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-emerald-500/5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
              <Zap size={12} className="fill-current" /> Auto-Applied Flash Sale
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              Create Automatic Price Slash
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full shadow-sm cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Campaign Name */}
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                Campaign Name / Title <span className="text-red-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Weekend BVN Flash Sale, 20% Off Identity Clearance" 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500" 
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Descriptive title for your reference in admin reports and ledgers.
              </p>
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Discount Type</label>
                <select 
                  value={type} 
                  onChange={(e: any) => setType(e.target.value)} 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₦)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max={type === "PERCENTAGE" ? "100" : undefined} 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  placeholder={type === "PERCENTAGE" ? "e.g. 15" : "e.g. 500"} 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
            </div>

            {/* Service Scope Selection with Live Database Pricing */}
            <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-bold uppercase text-zinc-700 dark:text-zinc-300 block">
                    Target Services & Live Pricing
                  </label>
                  <p className="text-[11px] text-zinc-400">
                    Live base prices fetched from database with dynamic slashed previews.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleService("ALL")}
                  className={`px-3 py-1 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                    isAllSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:border-emerald-400"
                  }`}
                >
                  ⚡ All Services
                </button>
              </div>

              <div className="space-y-4">
                {SERVICE_GROUPS.map((grp) => (
                  <div key={grp.category} className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                      {grp.category}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {grp.items.map((s: any) => {
                        const isChecked = isAllSelected || selectedServices.includes(s.id);
                        const basePrice = servicePricingMap[s.priceKey] || 2500;
                        const sim = calculateDiscount(basePrice);
                        const hasSub = !!s.subOptions;
                        const isExpanded = expandedParents[s.id];

                        return (
                          <div key={s.id} className="space-y-1">
                            <div
                              className={`flex items-center justify-between p-3.5 rounded-xl border text-xs transition-all ${
                                isChecked
                                  ? "bg-emerald-500/5 border-emerald-500/30 text-zinc-900 dark:text-zinc-100 font-bold"
                                  : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                              }`}
                            >
                              <label className="flex items-center gap-2.5 cursor-pointer select-none flex-1">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleService(s.id)}
                                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-zinc-300 cursor-pointer"
                                />
                                <span>{s.name}</span>
                              </label>

                              <div className="flex items-center gap-3 shrink-0">
                                {/* Price display with live simulation */}
                                <div className="text-right font-mono">
                                  {numValue > 0 && isChecked ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="line-through text-zinc-400 text-[10px]">
                                        ₦{basePrice.toLocaleString()}
                                      </span>
                                      <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs">
                                        ₦{sim.final.toLocaleString()}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-500 text-xs">
                                      ₦{basePrice.toLocaleString()}
                                    </span>
                                  )}
                                </div>

                                {hasSub && (
                                  <button
                                    type="button"
                                    onClick={() => toggleParentExpand(s.id)}
                                    className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                                    title="View breakdown options"
                                  >
                                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Collapsible Sub-Options Breakdown (e.g. for BVN Modification 7 Options) */}
                            {hasSub && isExpanded && (
                              <div className="pl-6 pr-2 py-2 space-y-1.5 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                                  Option Breakdown (All receive {numValue > 0 ? `${numValue}${type === 'PERCENTAGE' ? '%' : '₦'}` : 'configured'} discount):
                                </p>
                                {s.subOptions.map((sub: any) => {
                                  const subBase = servicePricingMap[sub.priceKey] || 3000;
                                  const subSim = calculateDiscount(subBase);
                                  return (
                                    <div key={sub.id} className="flex items-center justify-between text-[11px] py-1 border-b border-zinc-100 dark:border-zinc-800/40 last:border-0">
                                      <span className="text-zinc-600 dark:text-zinc-300 font-medium">{sub.name}</span>
                                      <div className="font-mono text-right">
                                        {numValue > 0 && isChecked ? (
                                          <div className="flex items-center gap-1.5">
                                            <span className="line-through text-zinc-400 text-[10px]">
                                              ₦{subBase.toLocaleString()}
                                            </span>
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                              ₦{subSim.final.toLocaleString()}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-zinc-500">₦{subBase.toLocaleString()}</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Limits & Expiry */}
            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Per-User Max Uses
                </label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={perUserLimit} 
                  onChange={(e) => setPerUserLimit(e.target.value)} 
                  placeholder="e.g. 5" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500" 
                />
                <p className="text-[10px] text-zinc-400 mt-1">Max times 1 user account can benefit.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">
                  Global Max Redemptions <span className="font-normal lowercase">(Optional)</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  value={usageLimit} 
                  onChange={(e) => setUsageLimit(e.target.value)} 
                  placeholder="Unlimited" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500" 
                />
                <p className="text-[10px] text-zinc-400 mt-1">Total uses across entire site.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 flex items-center">
                Expiry Date & Time <span className="text-[10px] text-zinc-400 font-normal ml-2">(Optional)</span>
              </label>
              <input 
                type="datetime-local" 
                value={expiresAt} 
                onChange={(e) => setExpiresAt(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500" 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                <p className="text-xs text-red-600 font-bold">{error}</p>
              </div>
            )}

            <div className="pt-4 mt-auto">
              <button 
                disabled={isProcessing} 
                type="submit" 
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex justify-center items-center text-sm font-black transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "🚀 Activate Auto-Applied Discount"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 2. MANUAL VOUCHER DRAWER
// ----------------------------------------------------------------------

function CreateVoucherDrawer({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>(["ALL"]);
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const toggleService = (service: string) => {
    if (service === "ALL") {
      setSelectedServices(["ALL"]);
    } else {
      const filtered = selectedServices.filter((s) => s !== "ALL");
      if (filtered.includes(service)) {
        const next = filtered.filter((s) => s !== service);
        setSelectedServices(next.length === 0 ? ["ALL"] : next);
      } else {
        setSelectedServices([...filtered, service]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/mds/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "CREATE",
          code: code.trim().toUpperCase(),
          type,
          value,
          isAutoApplied: false,
          restrictedServices: selectedServices,
          usageLimit: usageLimit || null,
          perUserLimit,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setCode("");
      setValue("");
      setSelectedServices(["ALL"]);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create promo code.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-indigo-500/5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1">
              <Ticket size={12} /> Customer Coupon Voucher
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              New Voucher Code
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full shadow-sm cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                Voucher Code <span className="text-red-500">*</span>
              </label>
              <input 
                required 
                type="text" 
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} 
                placeholder="e.g. WELCOME50, VIPCLIENT" 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider font-bold focus:ring-2 focus:ring-indigo-500" 
              />
              <p className="text-[11px] text-zinc-400 mt-1">Customers enter this code at checkout.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Discount Type</label>
                <select 
                  value={type} 
                  onChange={(e: any) => setType(e.target.value)} 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₦)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                  Value <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max={type === "PERCENTAGE" ? "100" : undefined} 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  placeholder={type === "PERCENTAGE" ? "e.g. 20" : "e.g. 5000"} 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500" 
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase text-zinc-500 block">Apply to Services</label>
                <button
                  type="button"
                  onClick={() => toggleService("ALL")}
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    selectedServices.includes("ALL")
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:border-indigo-400"
                  }`}
                >
                  ⚡ All Services
                </button>
              </div>

              <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                {SERVICE_GROUPS.map((grp) => (
                  <div key={grp.category} className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{grp.category}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grp.items.map((item) => {
                        const isSelected = selectedServices.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleService(item.id)}
                            className={`px-2.5 py-1.5 text-left text-xs font-bold rounded-xl border transition-all cursor-pointer truncate ${
                              isSelected
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-300"
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Per-User Limit</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={perUserLimit} 
                  onChange={(e) => setPerUserLimit(e.target.value)} 
                  placeholder="e.g. 1" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                />
                <p className="text-[10px] text-zinc-400 mt-1">Times 1 user can apply this.</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Global Limit</label>
                <input 
                  type="number" 
                  min="1" 
                  value={usageLimit} 
                  onChange={(e) => setUsageLimit(e.target.value)} 
                  placeholder="Unlimited" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
                />
                <p className="text-[10px] text-zinc-400 mt-1">Max total redemptions.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 flex items-center">
                Expiry Date & Time <span className="text-[10px] text-zinc-400 font-normal ml-2">(Optional)</span>
              </label>
              <input 
                type="datetime-local" 
                value={expiresAt} 
                onChange={(e) => setExpiresAt(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                <p className="text-xs text-red-600 font-bold">{error}</p>
              </div>
            )}

            <div className="pt-4 mt-auto">
              <button 
                disabled={isProcessing} 
                type="submit" 
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex justify-center items-center text-sm font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Generate Voucher Code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. EDIT PROMO CODE / AUTO-APPLIED DISCOUNT DRAWER
// ----------------------------------------------------------------------

function EditPromoDrawer({
  isOpen,
  promo,
  servicePricingMap,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  promo: any;
  servicePricingMap: Record<string, number>;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>(["ALL"]);
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (promo) {
      setName(promo.name || "");
      setCode(promo.code || "");
      setType(promo.discountPct ? "PERCENTAGE" : "FIXED");
      setValue(String(promo.discountPct || promo.fixedAmount || ""));
      setSelectedServices(promo.restrictedServices && promo.restrictedServices.length > 0 ? promo.restrictedServices : ["ALL"]);
      setPerUserLimit(String(promo.perUserLimit || 1));
      setUsageLimit(promo.usageLimit ? String(promo.usageLimit) : "");
      if (promo.expiresAt) {
        try {
          const dt = new Date(promo.expiresAt);
          const iso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
          setExpiresAt(iso);
        } catch {
          setExpiresAt("");
        }
      } else {
        setExpiresAt("");
      }
      setError("");
    }
  }, [promo]);

  if (!isOpen || !promo) return null;

  const toggleService = (sId: string) => {
    if (sId === "ALL") {
      setSelectedServices(["ALL"]);
    } else {
      const filtered = selectedServices.filter((s) => s !== "ALL");
      if (filtered.includes(sId)) {
        const next = filtered.filter((s) => s !== sId);
        setSelectedServices(next.length === 0 ? ["ALL"] : next);
      } else {
        setSelectedServices([...filtered, sId]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/mds/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "UPDATE",
          id: promo.id,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type,
          value,
          restrictedServices: selectedServices,
          perUserLimit,
          usageLimit: usageLimit || null,
          expiresAt: expiresAt || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to update discount/promo code.");
    } finally {
      setIsProcessing(false);
    }
  };

  const isAuto = promo.isAutoApplied;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className={`p-6 border-b border-zinc-200 dark:border-zinc-800 ${isAuto ? 'bg-emerald-500/5' : 'bg-indigo-500/5'} flex items-center justify-between`}>
          <div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border mb-1 ${
              isAuto 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
            }`}>
              {isAuto ? <Zap size={12} className="fill-current" /> : <Ticket size={12} />}
              <span>{isAuto ? "Edit Auto-Applied Discount" : "Edit Voucher Promo Code"}</span>
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
              Edit Campaign: {promo.code}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full shadow-sm cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title / Name */}
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                {isAuto ? "Campaign Title" : "Promo Label / Name"}
              </label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. September Special 5% Off" 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary" 
              />
            </div>

            {/* Code */}
            {!isAuto && (
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                  Promo Code <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="text" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ""))} 
                  placeholder="e.g. SEPTEMBER" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider font-bold focus:ring-2 focus:ring-primary uppercase" 
                />
              </div>
            )}

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Discount Type</label>
                <select 
                  value={type} 
                  onChange={(e: any) => setType(e.target.value)} 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₦)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  max={type === "PERCENTAGE" ? "100" : undefined} 
                  value={value} 
                  onChange={(e) => setValue(e.target.value)} 
                  placeholder={type === "PERCENTAGE" ? "e.g. 5" : "e.g. 500"} 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-primary" 
                />
              </div>
            </div>

            {/* Applicable Services */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase text-zinc-500 block">Applicable Services</label>
                <button
                  type="button"
                  onClick={() => toggleService("ALL")}
                  className={`px-2.5 py-0.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    selectedServices.includes("ALL")
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:border-primary"
                  }`}
                >
                  ⚡ All Services
                </button>
              </div>

              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {SERVICE_GROUPS.map((grp) => (
                  <div key={grp.category} className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{grp.category}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {grp.items.map((item) => {
                        const isSelected = selectedServices.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleService(item.id)}
                            className={`px-2.5 py-1.5 text-left text-xs font-bold rounded-xl border transition-all cursor-pointer truncate ${
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-primary/50"
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Limits & Expiry */}
            <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Per-User Limit</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={perUserLimit} 
                  onChange={(e) => setPerUserLimit(e.target.value)} 
                  placeholder="e.g. 5" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Global Limit (Optional)</label>
                <input 
                  type="number" 
                  min="1" 
                  value={usageLimit} 
                  onChange={(e) => setUsageLimit(e.target.value)} 
                  placeholder="Unlimited" 
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary" 
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 flex items-center">
                Expiry Date & Time <span className="text-[10px] text-zinc-400 font-normal ml-2">(Optional)</span>
              </label>
              <input 
                type="datetime-local" 
                value={expiresAt} 
                onChange={(e) => setExpiresAt(e.target.value)} 
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary" 
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                <p className="text-xs text-red-600 font-bold">{error}</p>
              </div>
            )}

            <div className="pt-4 mt-auto">
              <button 
                disabled={isProcessing} 
                type="submit" 
                className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl flex justify-center items-center text-sm font-bold transition-all shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. INSPECTION DRAWER (WITH EXACT DISCOUNT SUBSIDIZED BREAKDOWN)
// ----------------------------------------------------------------------

function PromoInspectionDrawer({ promo, onClose }: { promo: any; onClose: () => void }) {
  if (!promo) return null;

  const totalGiven = promo.usages?.reduce((sum: number, u: any) => sum + Number(u.discountAmount || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold flex items-center text-zinc-900 dark:text-zinc-100">
              <Users size={20} className="mr-2 text-indigo-500" /> Redemption Ledger
            </h3>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 rounded-full shadow-sm cursor-pointer">
              <X size={18} />
            </button>
          </div>
          <p className="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-200 tracking-wider">
            {promo.name ? `${promo.name} (${promo.code})` : promo.code}
          </p>

          {/* Subsidized Summary Banner */}
          <div className="mt-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Total Discount Subsidized:
            </span>
            <span className="text-sm font-black font-mono text-indigo-700 dark:text-indigo-300">
              ₦{totalGiven.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4">
            Customer Redemptions ({promo.usages?.length || 0})
          </h4>
          
          <div className="space-y-3">
            {!promo.usages || promo.usages.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No redemptions recorded yet.</p>
            ) : (
              promo.usages.map((usage: any) => (
                <div key={usage.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-start gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {usage.user?.firstName || "Customer"} {usage.user?.lastName || ""}
                    </p>
                    <p className="text-xs text-zinc-500">{usage.user?.email || "No email"}</p>
                    {usage.serviceKey && (
                      <span className="inline-block px-2 py-0.5 rounded bg-secondary text-foreground text-[10px] font-bold border border-border mt-1">
                        {usage.serviceKey.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-right space-y-1">
                    {Number(usage.discountAmount) > 0 && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                        Saved ₦{Number(usage.discountAmount).toLocaleString()}
                      </span>
                    )}
                    <span className="block text-[10px] font-medium text-zinc-400 font-mono">
                      {format(new Date(usage.usedAt), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
