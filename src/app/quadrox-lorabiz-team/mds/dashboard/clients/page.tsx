"use client";

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Search, RefreshCw, Eye, Users, UserPlus, Wallet, Activity } from 'lucide-react';
import ClientDrawer from '@/components/mds/ClientDrawer';

export default function ClientDirectoryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mds/clients');
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const clients = data?.clients || [];
  const metrics = data?.metrics || { total: 0, newSignups: 0, totalLiabilities: 0, active: 0 };

  const filteredClients = useMemo(() => {
    return clients.filter((c: any) => {
      const searchStr = `${c.firstName} ${c.lastName} ${c.email} ${c.phone}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    });
  }, [clients, searchTerm]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Client Directory</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Master database for CRM, financial auditing, and account security.</p>
        </div>
        <button onClick={fetchClients} className="flex items-center justify-center px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors">
          <RefreshCw size={16} className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Registered" value={metrics.total} icon={<Users size={20} className="text-indigo-500" />} isLoading={isLoading} />
        <MetricCard title="New (Last 30 Days)" value={`+${metrics.newSignups}`} icon={<UserPlus size={20} className="text-emerald-500" />} isLoading={isLoading} />
        <MetricCard title="Active Transactors" value={metrics.active} icon={<Activity size={20} className="text-blue-500" />} isLoading={isLoading} />
        <MetricCard title="Total Wallet Liabilities" value={formatCurrency(metrics.totalLiabilities)} icon={<Wallet size={20} className="text-amber-500" />} isLoading={isLoading} highlight />
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Client Info</th>
                <th className="px-6 py-4 font-medium">Joined Date</th>
                <th className="px-6 py-4 font-medium text-right">Wallet Balance</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500"><RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />Loading directory...</td></tr>
              ) : filteredClients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No clients found.</td></tr>
              ) : (
                filteredClients.map((client: any) => (
                  <tr key={client.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${client.isSuspended ? 'bg-red-50/50 dark:bg-red-500/5' : ''}`}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{client.firstName} {client.lastName}</p>
                      <p className="text-xs text-zinc-500">{client.email} • {client.phone}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {format(new Date(client.createdAt), 'MMM do, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {formatCurrency(Number(client.wallet?.balance || 0))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${client.isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {client.isSuspended ? 'Suspended' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => setSelectedClient(client)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-md transition-colors">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Drawer */}
      <ClientDrawer 
        client={selectedClient} 
        onClose={() => setSelectedClient(null)} 
        onUpdateSuccess={() => {
          setSelectedClient(null);
          fetchClients(); // Refresh data to show updated wallet/suspension status
        }} 
      />
    </div>
  );
}

function MetricCard({ title, value, icon, isLoading, highlight }: any) {
  return (
    <div className={`p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm`}>
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-zinc-500">{title}</p>
        {icon}
      </div>
      {isLoading ? (
        <div className="w-16 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse mt-2"></div>
      ) : (
        <h3 className={`text-2xl font-bold tabular-nums tracking-tight ${highlight ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-900 dark:text-white'}`}>{value}</h3>
      )}
    </div>
  );
}
