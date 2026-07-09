"use client";

import { useState, useEffect } from 'react';
import { 
  Settings, Power, PowerOff, Save, RefreshCw, AlertTriangle, Fingerprint, Building2, Layers
} from 'lucide-react';

export default function SettingsDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [cacServices, setCacServices] = useState<any[]>([]);
  const [ninServices, setNinServices] = useState<any[]>([]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/settings/pricing');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setCacServices(result.cacPricing || []);
      setNinServices(result.ninPricing || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
            <Settings className="mr-2 text-indigo-500" /> System Settings & Pricing
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage global service availability, kill switches, and dynamic pricing.</p>
        </div>
        <button onClick={fetchSettings} className="flex items-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors">
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Sync Configuration
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><RefreshCw className="animate-spin text-indigo-500" size={32} /></div>
      ) : (
        <div className="space-y-10">
          
          {/* CAC SECTION */}
          <section>
            <div className="flex items-center mb-4">
              <Building2 size={18} className="text-zinc-400 mr-2" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Corporate Affairs Commission (CAC)</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {cacServices.map(service => (
                <ServiceConfigCard 
                  key={service.id} 
                  service={service} 
                  category="CAC" 
                  onSaved={fetchSettings} 
                />
              ))}
            </div>
          </section>

          {/* NIN SECTION */}
          <section>
            <div className="flex items-center mb-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
              <Fingerprint size={18} className="text-zinc-400 mr-2" />
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Identity Services (NIN API)</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {ninServices.map(service => (
                <ServiceConfigCard 
                  key={service.id} 
                  service={service} 
                  category="NIN" 
                  onSaved={fetchSettings} 
                />
              ))}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENT: Service Config Card
// ----------------------------------------------------------------------

function ServiceConfigCard({ service, category, onSaved }: { service: any, category: "CAC" | "NIN", onSaved: () => void }) {
  const [isActive, setIsActive] = useState(service.isActive);
  const [price, setPrice] = useState(service.price || 0);
  const [maintenanceMsg, setMaintenanceMsg] = useState(service.maintenanceMsg || "");
  const [isSaving, setIsSaving] = useState(false);

  const title = category === "CAC" ? service.title : service.displayName;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/mds/settings/pricing/action', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          id: service.id,
          title,
          price,
          isActive,
          maintenanceMsg: category === "CAC" ? maintenanceMsg : undefined
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      onSaved();
    } catch (err) {
      alert("Error saving settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const isChanged = 
    isActive !== service.isActive || 
    Number(price) !== Number(service.price) || 
    (category === "CAC" && maintenanceMsg !== (service.maintenanceMsg || ""));

  return (
    <div className={`flex flex-col bg-white dark:bg-zinc-900 rounded-xl border-2 transition-colors shadow-sm overflow-hidden ${
      !isActive ? 'border-red-200 dark:border-red-500/30' : 'border-transparent dark:border-zinc-800'
    }`}>
      
      {/* Header */}
      <div className={`px-5 py-4 border-b flex justify-between items-start ${
        !isActive ? 'bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20' : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-100 dark:border-zinc-800'
      }`}>
        <div className="pr-4">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{title}</h3>
          <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase tracking-wider">{category === "CAC" ? service.serviceKey : service.slipType}</p>
        </div>
        
        {/* Toggle Switch */}
        <button 
          onClick={() => setIsActive(!isActive)}
          className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 space-y-4">
        
        {/* Price Input */}
        <div>
          <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 block">Client Cost (₦)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-zinc-400">₦</span>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Maintenance Message (Only for CAC, and highlight if inactive) */}
        {category === "CAC" && (
          <div className={`transition-all ${!isActive ? 'opacity-100' : 'opacity-60'}`}>
            <label className="text-xs font-bold uppercase text-zinc-500 mb-1.5 flex items-center">
              <AlertTriangle size={12} className="mr-1" /> Downtime Notice
            </label>
            <textarea 
              rows={2}
              value={maintenanceMsg}
              onChange={(e) => setMaintenanceMsg(e.target.value)}
              placeholder="Message to display when service is OFF..."
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
            {!isActive && <p className="text-[10px] text-red-500 font-bold mt-1">This message is currently visible to clients.</p>}
          </div>
        )}

      </div>

      {/* Footer / Save Action */}
      <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
        <button 
          onClick={handleSave}
          disabled={!isChanged || isSaving}
          className={`w-full py-2.5 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
            isChanged 
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <><Save size={16} className="mr-2" /> {isChanged ? 'Save Changes' : 'Up to Date'}</>
          )}
        </button>
      </div>

    </div>
  );
}
