"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Wifi, 
  Search, 
  Check, 
  X, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight, 
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface DataPlan {
  id: string;
  planId: number;
  network: string;
  category: string;
  name: string;
  price: number | string;
  costPrice?: number | string | null;
  validity?: string | null;
  capacity?: string | null;
  isActive: boolean;
}

export default function MobileDataPlansManager() {
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingPrices, setEditingPrices] = useState<Record<number, number | string>>({});
  const [savingPlanId, setSavingPlanId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/settings/data-plans", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.plans) {
        setPlans(data.plans);
        const prices: Record<number, number | string> = {};
        data.plans.forEach((p: DataPlan) => {
          prices[p.planId] = p.price;
        });
        setEditingPrices(prices);
      }
    } catch (err) {
      console.error("Failed to fetch admin data plans:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle single plan active/inactive
  const handleToggleActive = async (plan: DataPlan) => {
    const newStatus = !plan.isActive;
    try {
      const res = await fetch("/api/mds/settings/data-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_ACTIVE",
          planId: plan.planId,
          isActive: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) =>
          prev.map((p) => (p.planId === plan.planId ? { ...p, isActive: newStatus } : p))
        );
        showToast(`${plan.name} is now ${newStatus ? "ACTIVE (Visible)" : "INACTIVE (Hidden)"}.`);
      }
    } catch (err) {
      console.error("Failed to toggle plan status:", err);
    }
  };

  // Update single plan selling price
  const handleSavePrice = async (plan: DataPlan) => {
    const newPrice = Number(editingPrices[plan.planId]);
    if (isNaN(newPrice) || newPrice <= 0) return;

    setSavingPlanId(plan.planId);
    try {
      const res = await fetch("/api/mds/settings/data-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_PRICE",
          planId: plan.planId,
          price: newPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) =>
          prev.map((p) => (p.planId === plan.planId ? { ...p, price: newPrice } : p))
        );
        showToast(`Updated price for ${plan.name} to ₦${newPrice.toLocaleString()}`);
      }
    } catch (err) {
      console.error("Failed to save plan price:", err);
    } finally {
      setSavingPlanId(null);
    }
  };

  // Bulk toggle by network
  const handleBulkToggleNetwork = async (network: string, isActive: boolean) => {
    try {
      const res = await fetch("/api/mds/settings/data-plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BULK_TOGGLE_NETWORK",
          network,
          isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) =>
          prev.map((p) => (p.network === network ? { ...p, isActive } : p))
        );
        showToast(`All ${network} plans set to ${isActive ? "ACTIVE" : "INACTIVE"}.`);
      }
    } catch (err) {
      console.error("Failed to bulk toggle network:", err);
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesNet = selectedNetwork === "ALL" || p.network === selectedNetwork;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.planId.toString().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.capacity && p.capacity.toLowerCase().includes(q));

      return matchesNet && matchesQuery;
    });
  }, [plans, selectedNetwork, searchQuery]);

  const networkCounts = useMemo(() => {
    return {
      ALL: plans.length,
      MTN: plans.filter((p) => p.network === "MTN").length,
      AIRTEL: plans.filter((p) => p.network === "AIRTEL").length,
      GLO: plans.filter((p) => p.network === "GLO").length,
      "9MOBILE": plans.filter((p) => p.network === "9MOBILE").length,
    };
  }, [plans]);

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white border border-zinc-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-2">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Network Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Network Selector */}
        <div className="flex flex-wrap gap-2">
          {(["ALL", "MTN", "AIRTEL", "GLO", "9MOBILE"] as const).map((net) => {
            const count = networkCounts[net] || 0;
            const isSelected = selectedNetwork === net;
            return (
              <button
                key={net}
                type="button"
                onClick={() => setSelectedNetwork(net)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <span>{net}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search plan or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Quick Bulk Actions */}
      {selectedNetwork !== "ALL" && (
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">
            Bulk Operations for {selectedNetwork}:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleBulkToggleNetwork(selectedNetwork, true)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Enable All {selectedNetwork}
            </button>
            <button
              type="button"
              onClick={() => handleBulkToggleNetwork(selectedNetwork, false)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg cursor-pointer"
            >
              Disable All {selectedNetwork}
            </button>
          </div>
        </div>
      )}

      {/* Plans Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <RefreshCw className="animate-spin text-indigo-500" size={24} />
        </div>
      ) : filteredPlans.length === 0 ? (
        <div className="py-12 text-center border border-zinc-200 dark:border-zinc-800 border-dashed rounded-2xl p-6">
          <p className="text-xs text-zinc-500">No data plans match your filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-500 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-3 px-4">Plan ID</th>
                  <th className="py-3 px-4">Plan Details</th>
                  <th className="py-3 px-4">Network &amp; Category</th>
                  <th className="py-3 px-4">Base Cost</th>
                  <th className="py-3 px-4">Selling Price (₦)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredPlans.map((plan) => {
                  const currentPrice = editingPrices[plan.planId] ?? plan.price;
                  const isModified = Number(currentPrice) !== Number(plan.price);
                  const baseCost = Number(plan.costPrice || plan.price);
                  const margin = Number(currentPrice) - baseCost;

                  return (
                    <tr key={plan.planId} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                      {/* ID */}
                      <td className="py-3 px-4 font-mono font-bold text-zinc-500">
                        #{plan.planId}
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">{plan.name}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {plan.capacity} • {plan.validity}
                        </span>
                      </td>

                      {/* Network & Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 mr-1.5">
                          {plan.network}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {plan.category}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 font-mono text-zinc-500">
                        ₦{baseCost.toLocaleString()}
                      </td>

                      {/* Selling Price Edit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={currentPrice}
                            onChange={(e) =>
                              setEditingPrices({ ...editingPrices, [plan.planId]: e.target.value })
                            }
                            className="w-24 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          {isModified && (
                            <button
                              type="button"
                              onClick={() => handleSavePrice(plan)}
                              disabled={savingPlanId === plan.planId}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-[11px] cursor-pointer"
                            >
                              {savingPlanId === plan.planId ? "..." : "Save"}
                            </button>
                          )}
                        </div>
                        {margin > 0 && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                            +₦{margin.toLocaleString()} margin
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(plan)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${
                            plan.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/20"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/20"
                          }`}
                          title="Click to toggle visibility"
                        >
                          {plan.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                          <span>{plan.isActive ? "Online" : "Hidden"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
