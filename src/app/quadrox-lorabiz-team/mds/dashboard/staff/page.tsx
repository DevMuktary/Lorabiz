"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Users, ShieldAlert, RefreshCw, Activity, UserPlus, X, Lock, CheckCircle2, XCircle
} from 'lucide-react';

export default function StaffManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [staff, setStaff] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState("DIRECTORY"); // DIRECTORY, LOGS
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchStaffData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/staff');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setStaff(result.staff || []);
      setLogs(result.logs || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const toggleSuspend = async (staffId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'restore' : 'suspend'} this staff member?`)) return;
    try {
      const res = await fetch('/api/mds/staff/action', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "TOGGLE_SUSPEND", staffId, isSuspended: !currentStatus })
      });
      if (res.ok) fetchStaffData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Staff Operations</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Manage processing team access and monitor system audit logs.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStaffData} className="flex items-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => setIsDrawerOpen(true)} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
            <UserPlus size={16} className="mr-2" /> Add Staff
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 scrollbar-hide px-2 pt-2">
          <TabButton label="Staff Directory" icon={<Users size={16} />} active={activeTab === "DIRECTORY"} onClick={() => setActiveTab("DIRECTORY")} />
          <TabButton label="System Audit Logs" icon={<Activity size={16} />} active={activeTab === "LOGS"} onClick={() => setActiveTab("LOGS")} />
        </div>

        {/* ==================== DIRECTORY TAB ==================== */}
        {activeTab === "DIRECTORY" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Staff Member</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium text-center">Actions Performed</th>
                  <th className="px-6 py-4 font-medium text-center">Access Status</th>
                  <th className="px-6 py-4 font-medium text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500"><RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />Loading directory...</td></tr>
                ) : staff.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No staff accounts found.</td></tr>
                ) : (
                  staff.map((s: any) => (
                    <tr key={s.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${s.isSuspended ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                      <td className="px-6 py-4">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{s.firstName} {s.lastName}</p>
                        <p className="text-xs text-zinc-500">Joined {format(new Date(s.createdAt), 'MMM yyyy')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-zinc-900 dark:text-zinc-100">{s.email}</p>
                        <p className="text-xs text-zinc-500">{s.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                          {s._count.staffActionLogs}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {s.isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleSuspend(s.id, s.isSuspended)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-md border transition-colors ${
                            s.isSuspended 
                              ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400' 
                              : 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400'
                          }`}
                        >
                          {s.isSuspended ? 'Restore Access' : 'Revoke Access'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ==================== AUDIT LOGS TAB ==================== */}
        {activeTab === "LOGS" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">Action Type</th>
                  <th className="px-6 py-4 font-medium">Target / Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {isLoading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500"><RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />Loading logs...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No logs recorded yet.</td></tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-zinc-500">
                        {format(new Date(log.createdAt), 'MMM do, yyyy • h:mm a')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.user.firstName} {log.user.lastName}</span>
                        <span className="ml-2 text-[10px] uppercase font-bold text-zinc-400">{log.user.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-sm">Ref: {log.targetId}</p>
                        <p className="text-xs text-zinc-500 truncate max-w-sm" title={log.details}>{log.details}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE STAFF DRAWER */}
      <CreateStaffDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        onSuccess={() => {
          setIsDrawerOpen(false);
          fetchStaffData();
        }}
      />
    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function TabButton({ label, icon, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
        active 
          ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" 
          : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
      }`}
    >
      <span className="mr-2">{icon}</span> {label}
    </button>
  );
}

function CreateStaffDrawer({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/mds/staff/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "CREATE", ...formData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setFormData({ firstName: "", lastName: "", email: "", phone: "", password: "" });
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
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center text-zinc-900 dark:text-zinc-100">
            <UserPlus size={20} className="mr-2 text-indigo-500" /> Provision New Staff
          </h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">First Name</label>
                <input required type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Last Name</label>
                <input required type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Email Address (Login ID)</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block">Phone Number</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="pt-2">
              <label className="text-xs font-bold uppercase text-zinc-500 mb-1 block flex items-center"><Lock size={12} className="mr-1"/> Initial Password</label>
              <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Provide a temporary password..." className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 font-mono" />
              <p className="text-[10px] text-amber-600 dark:text-amber-500 mt-1">Make sure to securely share this temporary password with the new staff member.</p>
            </div>

            {error && <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-md"><p className="text-xs text-red-600 font-bold">{error}</p></div>}

            <div className="pt-6 mt-auto">
              <button disabled={isProcessing} type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex justify-center items-center text-sm font-bold transition-colors disabled:opacity-50">
                {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : "Provision Account"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
