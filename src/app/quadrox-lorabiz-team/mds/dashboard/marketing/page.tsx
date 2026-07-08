"use client";

import { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { 
  Ticket, Tag, Activity, Plus, RefreshCw, X, Copy, Check, Percent, DollarSign, Eye, Users, Trash2
} from 'lucide-react';

export default function MarketingDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [promos, setPromos] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, totalUses: 0 });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any | null>(null);

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/marketing');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setPromos(result.promos || []);
      setMetrics(result.metrics || { total: 0, active: 0, totalUses: 0 });
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
      const res = await fetch('/api/mds/marketing/action', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "TOGGLE_STATUS", id, code, isActive: !currentStatus })
      });
      if (res.ok) fetchPromos();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const deletePromo = async (id: string, code: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete the code ${code}? This cannot be undone.`)) return;
    
    try {
      const res = await fetch('/api/mds/marketing/action', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "DELETE", id, code })
      });
      if (res.ok) {
        fetchPromos();
      } else {
        alert("Failed to delete promo code.");
      }
    } catch (err) {
      alert("An error occurred while deleting.");
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Marketing & Campaigns</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Generate codes, set global limits, and track redemptions.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPromos} className="flex items-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
            <Plus size={16} className="mr-2" /> New Promo Code
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard title="Total Codes Created" value={metrics.total} icon={<Ticket size={20} className="text-indigo-500" />} isLoading={isLoading} />
        <MetricCard title="Currently Active" value={metrics.active} icon={<Activity size={20} className="text-emerald-500" />} isLoading={isLoading} />
        <MetricCard title="Global Redemptions" value={metrics.totalUses} icon={<Tag size={20} className="text-amber-500" />} isLoading={isLoading} highlight />
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Promo Code</th>
                <th className="px-6 py-4 font-medium">Discount Rules</th>
                <th className="px-6 py-4 font-medium text-center">Global Usage</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500"><RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />Loading campaigns...</td></tr>
              ) : promos.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No promo codes created yet.</td></tr>
              ) : (
                promos.map((p: any) => {
                  const isExpired = p.expiresAt && isPast(new Date(p.expiresAt));
                  const isMaxedOut = p.usageLimit && p.timesUsed >= p.usageLimit;
                  const isTrulyActive = p.isActive && !isExpired && !isMaxedOut;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="font-mono font-bold text-lg text-zinc-900 dark:text-zinc-100 tracking-wider">{p.code}</span>
                          <CopyBtn text={p.code} />
                        </div>
                        {p.expiresAt && <span className="block text-xs text-zinc-500 mt-1">Exp: {format(new Date(p.expiresAt), 'MMM do, yyyy')}</span>}
                      </td>
                      <td className="px-6 py-4">
                        {p.discountPct ? (
                          <span className="inline-flex items-center font-bold text-indigo-600 dark:text-indigo-400"><Percent size={14} className="mr-1"/> {p.discountPct}% OFF</span>
                        ) : (
                          <span className="inline-flex items-center font-bold text-emerald-600 dark:text-emerald-400"><DollarSign size={14} className="mr-1"/> ₦{Number(p.fixedAmount).toLocaleString()} OFF</span>
                        )}
                        <span className="block text-xs text-zinc-500 mt-1">Limit: {p.perUserLimit} per user</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{p.timesUsed} {p.usageLimit ? `/ ${p.usageLimit}` : 'total'}</span>
                          {isMaxedOut && <span className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">Global Limit Reached</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isTrulyActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                          {isTrulyActive ? 'Active' : (isExpired ? 'Expired' : 'Inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button 
                          onClick={() => setSelectedPromo(p)}
                          className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-md transition-colors"
                          title="View Redeemers"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => toggleStatus(p.id, p.code, p.isActive)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-md border transition-colors ${
                            p.isActive ? 'border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-500/30 dark:hover:bg-amber-500/10' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:hover:bg-emerald-500/10'
                          }`}
                        >
                          {p.isActive ? 'Turn Off' : 'Turn On'}
                        </button>
                        <button 
                          onClick={() => deletePromo(p.id, p.code)}
                          className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-md transition-colors"
                          title="Delete Code"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreatePromoDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={() => { setIsDrawerOpen(false); fetchPromos(); }}
      />
      
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
    <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        {icon}
      </div>
      {isLoading ? <div className="w-16 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mt-2"></div> : <h3 className={`text-2xl font-bold tabular-nums tracking-tight ${highlight ? 'text-amber-600' : 'text-zinc-900 dark:text-white'}`}>{value}</h3>}
    </div>
  );
}

function CreatePromoDrawer({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ code: "", type: "PERCENTAGE", value: "", usageLimit: "", perUserLimit: "1", expiresAt: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/mds/marketing/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "CREATE", ...formData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setFormData({ code: "", type: "PERCENTAGE", value: "", usageLimit: "", perUserLimit: "1", expiresAt: "" });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center text-zinc-900 dark:text-zinc-100">
            <Plus size={20} className="mr-2 text-indigo-500" /> New Promo Code
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Promo Code Name</label>
              <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})} placeholder="e.g. WELCOME50" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm font-mono tracking-wider focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-100 dark:border-zinc-800 py-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Discount Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₦)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Value</label>
                <input required type="number" min="1" max={formData.type === 'PERCENTAGE' ? "100" : undefined} value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder={formData.type === 'PERCENTAGE' ? "e.g. 20" : "e.g. 5000"} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Per-User Limit</label>
                <input required type="number" min="1" value={formData.perUserLimit} onChange={e => setFormData({...formData, perUserLimit: e.target.value})} placeholder="e.g. 1" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                <p className="text-[10px] text-zinc-400 mt-1">Times 1 user can apply this.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-500 mb-1 block">Global Limit <span className="font-normal lowercase">(Optional)</span></label>
                <input type="number" min="1" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} placeholder="Total for all users" className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
                <p className="text-[10px] text-zinc-400 mt-1">Max total uses globally.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 flex items-center">Expiry Date & Time <span className="text-[10px] text-zinc-400 font-normal ml-2">(Optional)</span></label>
              <input type="datetime-local" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md"><p className="text-xs text-red-600 font-bold">{error}</p></div>}

            <div className="pt-6 mt-auto">
              <button disabled={isProcessing} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex justify-center items-center text-sm font-bold transition-colors disabled:opacity-50">
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Generate Campaign Code"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// INSPECTION DRAWER TO SEE USERS
// ----------------------------------------------------------------------

function PromoInspectionDrawer({ promo, onClose }: { promo: any, onClose: () => void }) {
  if (!promo) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold flex items-center text-zinc-900 dark:text-zinc-100">
              <Users size={20} className="mr-2 text-indigo-500" /> Redemption Ledger
            </h3>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
          </div>
          <p className="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-200 tracking-wider">{promo.code}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <h4 className="text-xs font-bold uppercase text-zinc-500 mb-4">Users who redeemed this code</h4>
          
          <div className="space-y-3">
            {!promo.usages || promo.usages.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No one has used this code yet.</p>
            ) : (
              promo.usages.map((usage: any) => (
                <div key={usage.id} className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{usage.user.firstName} {usage.user.lastName}</p>
                    <p className="text-xs text-zinc-500">{usage.user.email}</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 text-right">
                    {format(new Date(usage.usedAt), 'MMM d, yyyy')}<br/>
                    {format(new Date(usage.usedAt), 'h:mm a')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
