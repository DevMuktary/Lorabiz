"use client";

import { useState, useEffect } from 'react';
import { 
  Settings, Save, RefreshCw, AlertTriangle, Fingerprint, Building2, ShieldCheck
} from 'lucide-react';

export default function SettingsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [allServices, setAllServices] = useState<any[]>([]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/settings/pricing');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      
      // We grab ONLY the global ServicePricing table (which contains CAC, SCUML, Tax ID, and the working uppercase NINs)
      // We completely ignore the useless ghost ninPricing table
      setAllServices(result.cacPricing || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Visually group the Global Services for a cleaner dashboard based on their serviceKey
  const cacGroup = allServices.filter(s => !s.serviceKey.includes("SCUML") && !s.serviceKey.includes("TAX_ID") && !s.serviceKey.startsWith("NIN"));
  const complianceGroup = allServices.filter(s => s.serviceKey.includes("SCUML") || s.serviceKey.includes("TAX_ID"));
  const ipeGroup = allServices.filter(s => s.serviceKey.includes("IPE"));
  const ninGroup = allServices.filter(s => s.serviceKey.startsWith("NIN") && !s.serviceKey.includes("IPE"));

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <Settings className="mr-2 text-indigo-500" /> System Settings & Pricing
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage global service availability, kill switches, and dynamic pricing.</p>
        </div>
        <button 
          onClick={fetchSettings} 
          className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm w-full sm:w-auto"
        >
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
          Force Full Sync
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={32} /></div>
      ) : (
        <div className="space-y-12">
          
          {/* CAC SECTION */}
          {cacGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4">
                <Building2 size={20} className="text-indigo-500 mr-2" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Corporate Affairs Commission</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {cacGroup.map(service => (
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
                {complianceGroup.map(service => (
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
                {ipeGroup.map(service => (
                  <ServiceConfigCard key={service.id} service={service} />
                ))}
              </div>
            </section>
          )}

          {/* NIN SECTION (Now using the working uppercase global services!) */}
          {ninGroup.length > 0 && (
            <section>
              <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
                <Fingerprint size={20} className="text-blue-500 mr-2" />
                <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Identity Services (NIN Slips API)</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {ninGroup.map(service => (
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
  // Current edited state
  const [current, setCurrent] = useState({
    isActive: service.isActive,
    price: service.price || 0,
    maintenanceMsg: service.maintenanceMsg || ""
  });

  // Database snapshot state (used to check if changes were made)
  const [savedState, setSavedState] = useState({
    isActive: service.isActive,
    price: service.price || 0,
    maintenanceMsg: service.maintenanceMsg || ""
  });

  const [isSaving, setIsSaving] = useState(false);

  // Determine if the current inputs differ from what is "saved"
  const isChanged = 
    current.isActive !== savedState.isActive || 
    Number(current.price) !== Number(savedState.price) || 
    current.maintenanceMsg !== savedState.maintenanceMsg;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/mds/settings/pricing/action', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "CAC", // Backend looks for "CAC" to update the global ServicePricing table
          id: service.id,
          title: service.title,
          price: current.price,
          isActive: current.isActive,
          maintenanceMsg: current.maintenanceMsg
        })
      });
      
      if (!res.ok) throw new Error("Failed to save");
      
      // Update the local saved state so the button resets to "Up to Date" instantly
      setSavedState({ ...current });

    } catch (err) {
      alert("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border-2 transition-colors shadow-sm overflow-hidden ${
      !current.isActive ? 'border-red-200 dark:border-red-500/30' : 'border-transparent dark:border-zinc-800'
    }`}>
      
      {/* Header */}
      <div className={`px-4 sm:px-5 py-3 sm:py-4 border-b flex justify-between items-start ${
        !current.isActive ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'
      }`}>
        <div className="pr-4">
          <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 leading-tight">{service.title}</h3>
          <p className="text-[10px] sm:text-xs font-mono text-zinc-500 mt-1 uppercase tracking-wider">{service.serviceKey}</p>
        </div>
        
        {/* Toggle Switch */}
        <button 
          onClick={() => setCurrent({ ...current, isActive: !current.isActive })}
          className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            current.isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            current.isActive ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 space-y-5">
        
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

        {/* Maintenance Message (Now perfectly visible for NIN too!) */}
        <div className={`transition-all ${!current.isActive ? 'opacity-100' : 'opacity-60'}`}>
          <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 flex items-center">
            <AlertTriangle size={14} className="mr-1.5" /> Downtime Notice
          </label>
          <textarea 
            rows={4}
            value={current.maintenanceMsg}
            onChange={(e) => setCurrent({ ...current, maintenanceMsg: e.target.value })}
            placeholder="Explain to users why this service is currently unavailable..."
            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
          />
          {!current.isActive && <p className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 font-bold mt-1.5">This message is currently visible to clients.</p>}
        </div>

      </div>

      {/* Footer / Save Action */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <button 
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          className={`w-full py-3 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
            isChanged 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <><Save size={18} className="mr-2" /> {isChanged ? 'Save Changes' : 'Up to Date'}</>
          )}
        </button>
      </div>

    </div>
  );
}
