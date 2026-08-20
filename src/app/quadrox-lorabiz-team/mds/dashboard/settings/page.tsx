"use client";

import { useState, useEffect } from "react";
import { 
  Settings, Save, RefreshCw, AlertTriangle, Fingerprint, Building2, ShieldCheck,
  Server, Cpu, CheckCircle2, SlidersHorizontal, ArrowRight
} from "lucide-react";

export default function SettingsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [providers, setProviders] = useState<{
    ipeProvider: string;
    personalizationProvider: string;
    ninSlipProvider: string;
    ninPhoneSearchActive: boolean;
  }>({
    ipeProvider: "DATAVERIFY",
    personalizationProvider: "DATAVERIFY",
    ninSlipProvider: "AUTO",
    ninPhoneSearchActive: true,
  });
  const [isSavingProviders, setIsSavingProviders] = useState(false);
  const [providerSavedSuccess, setProviderSavedSuccess] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const [pricingRes, providersRes] = await Promise.all([
        fetch("/api/mds/settings/pricing"),
        fetch("/api/mds/settings/providers"),
      ]);

      if (pricingRes.ok) {
        const result = await pricingRes.json();
        setAllServices(result.cacPricing || []);
      }

      if (providersRes.ok) {
        const pResult = await providersRes.json();
        setProviders({
          ipeProvider: pResult.ipeProvider || "DATAVERIFY",
          personalizationProvider: pResult.personalizationProvider || "DATAVERIFY",
          ninSlipProvider: pResult.ninSlipProvider || "AUTO",
          ninPhoneSearchActive: pResult.ninPhoneSearchActive !== undefined ? pResult.ninPhoneSearchActive : true,
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveProviders = async () => {
    setIsSavingProviders(true);
    setProviderSavedSuccess(false);
    setProviderError(null);
    try {
      const res = await fetch("/api/mds/settings/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providers),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update providers");
      }
      setProviderSavedSuccess(true);
      setTimeout(() => setProviderSavedSuccess(false), 3500);
    } catch (err: any) {
      setProviderError(err.message || "Failed to save provider routing settings.");
      setTimeout(() => setProviderError(null), 5000);
    } finally {
      setIsSavingProviders(false);
    }
  };

  // Visually group the Global Services
  const cacGroup = allServices.filter(
    (s) =>
      !s.serviceKey.includes("SCUML") &&
      !s.serviceKey.includes("TAX_ID") &&
      !s.serviceKey.startsWith("NIN") &&
      !s.serviceKey.startsWith("BVN")
  );
  const bvnGroup = allServices.filter((s) => s.serviceKey.startsWith("BVN"));
  const complianceGroup = allServices.filter(
    (s) => s.serviceKey.includes("SCUML") || s.serviceKey.includes("TAX_ID")
  );
  const ipeGroup = allServices.filter((s) => s.serviceKey.includes("IPE"));
  const personalizationGroup = allServices.filter((s) => s.serviceKey.includes("PERSONALIZATION"));
  const ninValidationGroup = allServices.filter((s) => s.serviceKey.includes("NIN_VALIDATION"));
  const ninNumberSlipsGroup = allServices.filter(
    (s) =>
      s.serviceKey.startsWith("NIN_") &&
      !s.serviceKey.includes("PHONE") &&
      !s.serviceKey.includes("IPE") &&
      !s.serviceKey.includes("PERSONALIZATION") &&
      !s.serviceKey.includes("VALIDATION") &&
      !s.serviceKey.startsWith("NIN_MOD_")
  );
  const ninPhoneSlipsGroup = allServices.filter(
    (s) => s.serviceKey.startsWith("NIN_PHONE_")
  );
  const ninModificationGroup = allServices.filter(
    (s) => s.serviceKey.startsWith("NIN_MOD_")
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <Settings className="mr-2 text-indigo-500" /> System Settings & Pricing
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage identity API gateways, provider routing switches, and live service pricing.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm w-full sm:w-auto"
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Force Full Sync
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="animate-spin text-indigo-500" size={32} />
        </div>
      ) : (
        <div className="space-y-12">
          {/* =============================================================== */}
          {/* IDENTITY GATEWAY PROVIDER ROUTING CONTROLLER (NEW)               */}
          {/* =============================================================== */}
          <section className="bg-gradient-to-br from-indigo-900 via-zinc-900 to-black text-white p-6 sm:p-8 rounded-3xl border border-indigo-500/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <SlidersHorizontal size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      Identity Gateway Provider Routing
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Switch upstream fulfillment between automated APIs (DataVerify, AgentHub) and Lorabiz Manual Staff Operations.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleSaveProviders}
                  disabled={isSavingProviders}
                  className={`flex items-center justify-center px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
                    providerSavedSuccess
                      ? "bg-emerald-600 text-white shadow-emerald-900/50"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/50 active:scale-95"
                  }`}
                >
                  {isSavingProviders ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : providerSavedSuccess ? (
                    <>
                      <CheckCircle2 size={16} className="mr-2" /> Provider Settings Saved!
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" /> Save Routing Configuration
                    </>
                  )}
                </button>
              </div>

              {/* Provider Error Banner */}
              {providerError && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                    <span>{providerError}</span>
                  </div>
                  <button
                    onClick={() => setProviderError(null)}
                    className="text-rose-400 hover:text-white text-xs font-bold px-2 py-1 rounded"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* IPE Clearance Routing Card */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-full border border-teal-500/20">
                        NIMC IPE Clearance
                      </span>
                      <span className="text-xs text-zinc-400">Active: <strong className="text-white">{providers.ipeProvider}</strong></span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                      Choose which identity engine processes incoming In-Processing Error clearance tickets.
                    </p>

                    <div className="space-y-2.5">
                      {/* Option 1: DataVerify */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ipeProvider === "DATAVERIFY"
                            ? "bg-indigo-600/15 border-indigo-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ipeProvider"
                            value="DATAVERIFY"
                            checked={providers.ipeProvider === "DATAVERIFY"}
                            onChange={(e) => setProviders({ ...providers, ipeProvider: e.target.value })}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              DataVerify API
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">AUTOMATED</span>
                            </div>
                            <div className="text-xs text-zinc-400">dataverify.com.ng identity verification engine</div>
                          </div>
                        </div>
                        <Server size={18} className={providers.ipeProvider === "DATAVERIFY" ? "text-indigo-400" : "text-zinc-600"} />
                      </label>

                      {/* Option 2: AgentHub */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ipeProvider === "AGENTHUB"
                            ? "bg-teal-600/15 border-teal-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ipeProvider"
                            value="AGENTHUB"
                            checked={providers.ipeProvider === "AGENTHUB"}
                            onChange={(e) => setProviders({ ...providers, ipeProvider: e.target.value })}
                            className="text-teal-500 focus:ring-teal-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              AgentHub API
                              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">SECONDARY</span>
                            </div>
                            <div className="text-xs text-zinc-400">agenthub.com.ng automated fallback provider</div>
                          </div>
                        </div>
                        <Cpu size={18} className={providers.ipeProvider === "AGENTHUB" ? "text-teal-400" : "text-zinc-600"} />
                      </label>

                      {/* Option 3: Manual Staff Operations */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ipeProvider === "MANUAL"
                            ? "bg-amber-600/15 border-amber-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ipeProvider"
                            value="MANUAL"
                            checked={providers.ipeProvider === "MANUAL"}
                            onChange={(e) => setProviders({ ...providers, ipeProvider: e.target.value })}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Manual Staff Queue
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">MANUAL</span>
                            </div>
                            <div className="text-xs text-zinc-400">Tickets route to MDS Operator Queue for manual clearance</div>
                          </div>
                        </div>
                        <ShieldCheck size={18} className={providers.ipeProvider === "MANUAL" ? "text-amber-400" : "text-zinc-600"} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* NIN Personalization Routing Card */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        NIN Personalization
                      </span>
                      <span className="text-xs text-zinc-400">Active: <strong className="text-white">{providers.personalizationProvider}</strong></span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                      Control whether enrollment personalization routes to DataVerify or to your manual desk.
                    </p>

                    <div className="space-y-2.5">
                      {/* Option 1: DataVerify */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.personalizationProvider === "DATAVERIFY"
                            ? "bg-indigo-600/15 border-indigo-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="personalizationProvider"
                            value="DATAVERIFY"
                            checked={providers.personalizationProvider === "DATAVERIFY"}
                            onChange={(e) => setProviders({ ...providers, personalizationProvider: e.target.value })}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              DataVerify API
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">AUTOMATED</span>
                            </div>
                            <div className="text-xs text-zinc-400">Direct API sync + PDF slip retrieval</div>
                          </div>
                        </div>
                        <Server size={18} className={providers.personalizationProvider === "DATAVERIFY" ? "text-indigo-400" : "text-zinc-600"} />
                      </label>

                      {/* Option 2: Manual Staff Operations */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.personalizationProvider === "MANUAL"
                            ? "bg-amber-600/15 border-amber-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="personalizationProvider"
                            value="MANUAL"
                            checked={providers.personalizationProvider === "MANUAL"}
                            onChange={(e) => setProviders({ ...providers, personalizationProvider: e.target.value })}
                            className="text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Manual Staff Queue
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">MANUAL</span>
                            </div>
                            <div className="text-xs text-zinc-400">Tickets route to MDS Operator Queue for manual fulfillment</div>
                          </div>
                        </div>
                        <ShieldCheck size={18} className={providers.personalizationProvider === "MANUAL" ? "text-amber-400" : "text-zinc-600"} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* NIN Slips & Verification Provider Routing Card (NEW) */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                        NIN Verification Slips Gateway
                      </span>
                      <span className="text-xs text-zinc-400">Active: <strong className="text-white">{providers.ninSlipProvider}</strong></span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                      Control automatic failover between DataVerify and backup SlipAPI, or force a specific provider.
                    </p>

                    <div className="space-y-2.5">
                      {/* Option 1: Auto Failover */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ninSlipProvider === "AUTO"
                            ? "bg-purple-600/15 border-purple-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ninSlipProvider"
                            value="AUTO"
                            checked={providers.ninSlipProvider === "AUTO"}
                            onChange={(e) => setProviders({ ...providers, ninSlipProvider: e.target.value })}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Auto-Failover (Smart Router)
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-mono">RECOMMENDED</span>
                            </div>
                            <div className="text-xs text-zinc-400">DataVerify Primary &rarr; Auto failover to SlipAPI on outage</div>
                          </div>
                        </div>
                        <Cpu size={18} className={providers.ninSlipProvider === "AUTO" ? "text-purple-400" : "text-zinc-600"} />
                      </label>

                      {/* Option 2: Force DataVerify */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ninSlipProvider === "DATAVERIFY"
                            ? "bg-indigo-600/15 border-indigo-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ninSlipProvider"
                            value="DATAVERIFY"
                            checked={providers.ninSlipProvider === "DATAVERIFY"}
                            onChange={(e) => setProviders({ ...providers, ninSlipProvider: e.target.value })}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Force DataVerify Only
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono">PRIMARY</span>
                            </div>
                            <div className="text-xs text-zinc-400">Direct DataVerify (Basic, VNIN, Regular, Standard, Premium)</div>
                          </div>
                        </div>
                        <Server size={18} className={providers.ninSlipProvider === "DATAVERIFY" ? "text-indigo-400" : "text-zinc-600"} />
                      </label>

                      {/* Option 3: Force SlipAPI */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ninSlipProvider === "SLIPAPI"
                            ? "bg-teal-600/15 border-teal-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ninSlipProvider"
                            value="SLIPAPI"
                            checked={providers.ninSlipProvider === "SLIPAPI"}
                            onChange={(e) => setProviders({ ...providers, ninSlipProvider: e.target.value })}
                            className="text-teal-500 focus:ring-teal-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Force SlipAPI Only
                              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-mono">BACKUP</span>
                            </div>
                            <div className="text-xs text-zinc-400">Direct SlipAPI.com (Standard & Premium slips)</div>
                          </div>
                        </div>
                        <ShieldCheck size={18} className={providers.ninSlipProvider === "SLIPAPI" ? "text-teal-400" : "text-zinc-600"} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* NIN Phone Search Master Switch Card (NEW) */}
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                        Phone Number Search Switch
                      </span>
                      <span className="text-xs text-zinc-400">
                        Status: <strong className={providers.ninPhoneSearchActive ? "text-emerald-400" : "text-rose-400"}>{providers.ninPhoneSearchActive ? "ACTIVE" : "OFFLINE"}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                      Enable or disable user verification using SIM-linked Phone Numbers across the platform.
                    </p>

                    <div className="space-y-2.5">
                      {/* Active Toggle */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          providers.ninPhoneSearchActive
                            ? "bg-emerald-600/15 border-emerald-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ninPhoneSearchActive"
                            checked={providers.ninPhoneSearchActive === true}
                            onChange={() => setProviders({ ...providers, ninPhoneSearchActive: true })}
                            className="text-emerald-500 focus:ring-emerald-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Phone Search Enabled
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">ONLINE</span>
                            </div>
                            <div className="text-xs text-zinc-400">Users can generate slips via registered phone number</div>
                          </div>
                        </div>
                        <CheckCircle2 size={18} className={providers.ninPhoneSearchActive ? "text-emerald-400" : "text-zinc-600"} />
                      </label>

                      {/* Disabled Toggle */}
                      <label
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                          !providers.ninPhoneSearchActive
                            ? "bg-rose-600/15 border-rose-500 text-white"
                            : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="ninPhoneSearchActive"
                            checked={providers.ninPhoneSearchActive === false}
                            onChange={() => setProviders({ ...providers, ninPhoneSearchActive: false })}
                            className="text-rose-500 focus:ring-rose-500"
                          />
                          <div>
                            <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                              Disable Phone Search (Maintenance)
                              <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-mono">OFFLINE</span>
                            </div>
                            <div className="text-xs text-zinc-400">Phone search shows maintenance banner & guides to NIN lookup</div>
                          </div>
                        </div>
                        <AlertTriangle size={18} className={!providers.ninPhoneSearchActive ? "text-rose-400" : "text-zinc-600"} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CAC SECTION */}
          {cacGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <Building2 size={20} className="text-indigo-500 mr-2" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Corporate Affairs Commission</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {cacGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIBSS BVN SECTION */}
          {bvnGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <ShieldCheck size={20} className="text-emerald-500 mr-2" />
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">NIBSS BVN Services</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Pricing and status configuration for Standard Verification, Premium Slip, and BVN Number Retrieval.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {bvnGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* SCUML & TAX ID SECTION */}
          {complianceGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <ShieldCheck size={20} className="text-emerald-500 mr-2" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Compliance & Tax ID</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {complianceGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIMC IPE CLEARANCE SECTION */}
          {ipeGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-teal-500 mr-2" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">NIMC IPE Clearance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ipeGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIN PERSONALIZATION SECTION */}
          {personalizationGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-emerald-500 mr-2" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">NIN Personalization</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {personalizationGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIN VALIDATION SECTION (SEPARATE) */}
          {ninValidationGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-purple-500 mr-2" />
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">NIN Record Validation</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Pricing and status configuration for record validation, VNIN validation, and modification syncing.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ninValidationGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIN NUMBER SLIPS SECTION (SEPARATE) */}
          {ninNumberSlipsGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-blue-500 mr-2" />
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">NIN Number Slips (Query by 11-digit NIN)</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Pricing and active toggles for slips generated via direct 11-digit NIN (Basic, VNIN, Regular, Standard, Premium).</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ninNumberSlipsGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIN PHONE QUERY SLIPS SECTION (SEPARATE) */}
          {ninPhoneSlipsGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-sky-500 mr-2" />
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Phone Number Slips (Query by Registered Phone)</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Independent pricing and active toggles for slips generated via registered SIM phone numbers (Regular, Standard, Premium).</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ninPhoneSlipsGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIN MODIFICATION SECTION */}
          {ninModificationGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-amber-500 mr-2" />
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">NIN Modification Services</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Pricing and status configuration for Change of Name, Change of Phone Number, and Change of Address.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ninModificationGroup.map((service) => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: Service Config Card (Handles Local State Saving)
// ----------------------------------------------------------------------

function ServiceConfigCard({ service }: { service: any }) {
  const [current, setCurrent] = useState({
    isActive: service.isActive,
    price: service.price || 0,
    maintenanceMsg: service.maintenanceMsg || "",
  });

  const [savedState, setSavedState] = useState({
    isActive: service.isActive,
    price: service.price || 0,
    maintenanceMsg: service.maintenanceMsg || "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isChanged =
    current.isActive !== savedState.isActive ||
    Number(current.price) !== Number(savedState.price) ||
    current.maintenanceMsg !== savedState.maintenanceMsg;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const res = await fetch("/api/mds/settings/pricing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "CAC",
          id: service.id,
          title: service.title,
          price: current.price,
          isActive: current.isActive,
          maintenanceMsg: current.maintenanceMsg,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSavedState({ ...current });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Error saving settings. Please try again.");
      setTimeout(() => setSaveError(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-colors shadow-sm ${
        !current.isActive ? "border-red-200 dark:border-red-500/30" : "border-transparent dark:border-zinc-800"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 sm:px-5 py-3 sm:py-4 border-b flex justify-between items-start rounded-t-2xl ${
          !current.isActive
            ? "bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20"
            : "bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800"
        }`}
      >
        <div className="pr-4">
          <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-tight">
            {service.title}
          </h3>
          <p className="text-[10px] sm:text-xs font-mono text-zinc-500 mt-1 uppercase tracking-wider">
            {service.serviceKey}
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => setCurrent({ ...current, isActive: !current.isActive })}
          className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            current.isActive ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              current.isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 space-y-4">
        {/* Save feedback banner */}
        {saveSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 size={14} />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
            <AlertTriangle size={14} />
            <span>{saveError}</span>
          </div>
        )}

        {/* Price Input */}
        <div>
          <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 block">Client Cost (₦)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-zinc-400">₦</span>
            <input
              type="number"
              value={current.price}
              onChange={(e) => setCurrent({ ...current, price: e.target.value })}
              className="w-full pl-8 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-black focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Maintenance Message */}
        <div className={`transition-all ${!current.isActive ? "opacity-100" : "opacity-60"}`}>
          <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 flex items-center">
            <AlertTriangle size={14} className="mr-1.5" /> Downtime Notice
          </label>
          <textarea
            rows={3}
            value={current.maintenanceMsg}
            onChange={(e) => setCurrent({ ...current, maintenanceMsg: e.target.value })}
            placeholder="Explain to users why this service is currently unavailable..."
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
          />
          {!current.isActive && (
            <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-bold mt-1.5">
              This message is currently visible to clients.
            </p>
          )}
        </div>
      </div>

      {/* Footer / Save Action */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-b-2xl">
        <button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          className={`w-full py-3 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
            isChanged
              ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer active:scale-95"
              : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
          }`}
        >
          {isSaving ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <>
              <Save size={18} className="mr-2" /> {isChanged ? "Save Changes" : "Up to Date"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
