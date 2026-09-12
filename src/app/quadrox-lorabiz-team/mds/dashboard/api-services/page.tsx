"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Server,
  Zap,
  Power,
  Edit3,
  Check,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sliders,
  ShieldCheck,
  CreditCard,
  Layers,
  Sparkles,
  ArrowRight
} from "lucide-react";

interface ApiServiceItem {
  serviceKey: string;
  title: string;
  category: "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES";
  categoryLabel: string;
  description: string;
  price: number;
  isActive: boolean;
  maintenanceMsg: string | null;
  updatedAt: string | null;
}

export default function AdminApiServicesPage() {
  const [services, setServices] = useState<ApiServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "NIN_VERIFICATION" | "PHONE_VERIFICATION" | "NIN_VALIDATION" | "NIMC_SPECIAL_SERVICES">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveSuccessKey, setSaveSuccessKey] = useState<string | null>(null);

  // Edit State Map (serviceKey -> { price, isActive, maintenanceMsg })
  const [editState, setEditState] = useState<Record<string, { price: number; isActive: boolean; maintenanceMsg: string }>>({});

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mds/api-services");
      const data = await res.json();
      if (data.success && data.services) {
        setServices(data.services);

        const initialEdits: Record<string, { price: number; isActive: boolean; maintenanceMsg: string }> = {};
        data.services.forEach((s: ApiServiceItem) => {
          initialEdits[s.serviceKey] = {
            price: s.price,
            isActive: s.isActive,
            maintenanceMsg: s.maintenanceMsg || "",
          };
        });
        setEditState(initialEdits);
      }
    } catch (err) {
      console.error("Failed to load API services:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handlePriceChange = (key: string, value: string) => {
    const num = parseFloat(value);
    setEditState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        price: isNaN(num) ? 0 : num,
      },
    }));
  };

  const handleToggleActive = (key: string) => {
    setEditState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isActive: !prev[key]?.isActive,
      },
    }));
  };

  const handleMaintenanceMsgChange = (key: string, msg: string) => {
    setEditState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        maintenanceMsg: msg,
      },
    }));
  };

  const handleSaveService = async (key: string) => {
    const currentEdit = editState[key];
    if (!currentEdit) return;

    setSavingKey(key);
    try {
      const res = await fetch("/api/mds/api-services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceKey: key,
          price: currentEdit.price,
          isActive: currentEdit.isActive,
          maintenanceMsg: currentEdit.maintenanceMsg || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setServices((prev) =>
          prev.map((s) => (s.serviceKey === key ? { ...s, ...data.service } : s))
        );
        setSaveSuccessKey(key);
        setTimeout(() => setSaveSuccessKey(null), 2500);
      } else {
        alert(data.error || "Failed to update service.");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesTab = activeTab === "ALL" || s.category === activeTab;
      const matchesSearch =
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.serviceKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [services, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const total = services.length;
    const online = services.filter((s) => s.isActive).length;
    const maintenance = total - online;
    return { total, online, maintenance };
  }, [services]);

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">
            <Sliders size={14} /> Developer Platform Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            API Services & Pricing Control
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
            Configure live developer pricing, operational downtime kill-switches, and custom maintenance outage notices exclusively for API services.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchServices}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Managed Endpoints</span>
            <Server size={18} className="text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{stats.total}</div>
          <p className="text-[11px] text-zinc-400">Identity verification & validation services</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live & Operational</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{stats.online}</div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">Accepting API traffic normally</p>
        </div>

        <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Under Maintenance</span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-300">{stats.maintenance}</div>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">Returning 503 maintenance response</p>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "ALL"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            All Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab("NIN_VERIFICATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "NIN_VERIFICATION"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            NIN Verification (by NIN)
          </button>
          <button
            onClick={() => setActiveTab("PHONE_VERIFICATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "PHONE_VERIFICATION"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            NIN Verification (by Phone)
          </button>
          <button
            onClick={() => setActiveTab("NIN_VALIDATION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "NIN_VALIDATION"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            NIN Validation Pipeline
          </button>
          <button
            onClick={() => setActiveTab("NIMC_SPECIAL_SERVICES")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === "NIMC_SPECIAL_SERVICES"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            NIMC Special Operations
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search API service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
          />
        </div>
      </div>

      {/* SERVICES LIST TABLE / CARDS */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw size={28} className="animate-spin text-indigo-500 mx-auto" />
            <p className="text-xs font-semibold text-zinc-400">Loading API service control matrix...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            <p className="text-xs font-bold text-zinc-500">No API services match your search or filter.</p>
          </div>
        ) : (
          filteredServices.map((svc) => {
            const currentEdit = editState[svc.serviceKey] || {
              price: svc.price,
              isActive: svc.isActive,
              maintenanceMsg: svc.maintenanceMsg || "",
            };

            const isSaving = savingKey === svc.serviceKey;
            const isSuccess = saveSuccessKey === svc.serviceKey;
            const hasChanged =
              currentEdit.price !== svc.price ||
              currentEdit.isActive !== svc.isActive ||
              (currentEdit.maintenanceMsg || "") !== (svc.maintenanceMsg || "");

            return (
              <div
                key={svc.serviceKey}
                className="p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all hover:border-zinc-300 dark:hover:border-zinc-700 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* SERVICE INFO */}
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded">
                        {svc.serviceKey}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        {svc.categoryLabel}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {svc.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {svc.description}
                    </p>
                  </div>

                  {/* CONTROLS: PRICE & KILL SWITCH */}
                  <div className="flex flex-wrap items-center gap-4 lg:justify-end">
                    {/* Price Input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Developer Fee (NGN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400">
                          ₦
                        </span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={currentEdit.price}
                          onChange={(e) => handlePriceChange(svc.serviceKey, e.target.value)}
                          className="w-32 pl-7 pr-3 py-2 text-sm font-black bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Kill Switch Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                        Service Uptime
                      </label>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(svc.serviceKey)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          currentEdit.isActive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        <Power size={13} className={currentEdit.isActive ? "text-emerald-500" : "text-rose-500"} />
                        <span>{currentEdit.isActive ? "ONLINE" : "MAINTENANCE"}</span>
                      </button>
                    </div>

                    {/* Save Button */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-transparent block select-none">
                        Action
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSaveService(svc.serviceKey)}
                        disabled={isSaving || !hasChanged}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                          isSuccess
                            ? "bg-emerald-600 text-white"
                            : hasChanged
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed border border-zinc-200 dark:border-zinc-700/50"
                        }`}
                      >
                        {isSaving ? (
                          <RefreshCw size={13} className="animate-spin" />
                        ) : isSuccess ? (
                          <Check size={13} />
                        ) : (
                          <Edit3 size={13} />
                        )}
                        <span>{isSaving ? "Saving..." : isSuccess ? "Saved!" : "Save"}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* DOWNTIME / MAINTENANCE MESSAGE (Visible when turned off or if custom message exists) */}
                {!currentEdit.isActive && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3.5 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={14} />
                      <span>Downtime Response Message (Returned to Developers via HTTP 503)</span>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Identity verification is temporarily undergoing maintenance. Please retry shortly."
                      value={currentEdit.maintenanceMsg}
                      onChange={(e) => handleMaintenanceMsgChange(svc.serviceKey, e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
