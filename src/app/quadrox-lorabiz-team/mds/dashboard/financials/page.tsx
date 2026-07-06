"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Download, Search, Filter, RefreshCw, CheckCircle2, XCircle, Clock, Eye, X, Receipt 
} from 'lucide-react';
import { format } from 'date-fns';
import Papa from 'papaparse';

export default function FinancialAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Table Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Drawer State
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/mds/financials');
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading financials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoized filtering logic for high performance
  const filteredLedger = useMemo(() => {
    if (!data?.ledger) return [];
    return data.ledger.filter((tx: any) => {
      const matchesSearch = 
        tx.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "ALL" || tx.type === filterType;
      const matchesStatus = filterStatus === "ALL" || tx.status === filterStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [data, searchTerm, filterType, filterStatus]);

  const exportToCSV = () => {
    if (!filteredLedger.length) return;
    
    const exportData = filteredLedger.map((tx: any) => ({
      Date: format(new Date(tx.date), 'yyyy-MM-dd HH:mm'),
      Reference: tx.reference,
      Client: tx.clientName,
      Email: tx.clientEmail,
      Description: tx.description,
      Type: tx.type,
      Amount: tx.amount,
      'Balance Before': tx.balanceBefore,
      'Balance After': tx.balanceAfter,
      Status: tx.status
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `quadrox_financials_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const metrics = data?.metrics || { totalRevenue: 0, cacRevenue: 0, ninRevenue: 0 };
  const chartData = data?.chartData || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Financial Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Revenue breakdowns and master transaction ledger.</p>
        </div>
        <button 
          onClick={exportToCSV}
          disabled={isLoading || !filteredLedger.length}
          className="flex items-center justify-center px-4 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Download size={16} className="mr-2" />
          Export Ledger
        </button>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <KpiCard title="Total Revenue (30d)" value={formatCurrency(metrics.totalRevenue)} isLoading={isLoading} highlight="text-indigo-600 dark:text-indigo-400" />
        <KpiCard title="CAC Services Revenue" value={formatCurrency(metrics.cacRevenue)} isLoading={isLoading} />
        <KpiCard title="NIN Services Revenue" value={formatCurrency(metrics.ninRevenue)} isLoading={isLoading} />
      </div>

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Revenue by Service (7 Days)</h2>
        {isLoading ? (
          <div className="w-full h-[300px] bg-zinc-100 dark:bg-zinc-800/50 animate-pulse rounded-lg"></div>
        ) : (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} tickFormatter={(value) => `₦${value / 1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: '#f4f4f5', opacity: 0.5 }}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e4e4e7', borderRadius: '8px', color: '#18181b', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="CAC" name="CAC Services" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="NIN" name="NIN Services" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Master Ledger Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Filters */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-4 justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search reference, client name, or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-zinc-500 hidden sm:block" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="DEBIT">Debits (Revenue)</option>
                <option value="CREDIT">Credits (Funding)</option>
                <option value="REFUND">Refunds</option>
              </select>
            </div>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Client</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    <RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No transactions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-[300px]">{tx.description}</p>
                      <div className="flex items-center text-xs text-zinc-500 mt-1">
                        {format(new Date(tx.date), 'MMM d, yyyy • h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{tx.clientName}</p>
                      <p className="text-xs text-zinc-500">{tx.clientEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`font-semibold tabular-nums ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                        {tx.type === 'CREDIT' || tx.type === 'REFUND' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] font-medium text-zinc-500 uppercase mt-0.5">{tx.type}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedTx(tx)}
                        className="p-2 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-500 flex justify-between items-center">
          <span>Showing {filteredLedger.length} transaction(s).</span>
        </div>
      </div>

      {/* Transaction Detail Drawer */}
      <TransactionDrawer 
        tx={selectedTx} 
        onClose={() => setSelectedTx(null)} 
        formatCurrency={formatCurrency} 
      />

    </div>
  );
}

// ----------------------------------------------------------------------
// SUB-COMPONENTS
// ----------------------------------------------------------------------

function KpiCard({ title, value, isLoading, highlight = "text-zinc-900 dark:text-white" }: { title: string, value: string, isLoading: boolean, highlight?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{title}</p>
      {isLoading ? (
        <div className="w-32 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
      ) : (
        <h3 className={`text-2xl sm:text-3xl font-bold tabular-nums ${highlight}`}>{value}</h3>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'SUCCESS':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 size={12} className="mr-1.5" /> Success
        </span>
      );
    case 'PENDING':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <Clock size={12} className="mr-1.5" /> Pending
        </span>
      );
    case 'FAILED':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400">
          <XCircle size={12} className="mr-1.5" /> Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
          {status}
        </span>
      );
  }
}

function TransactionDrawer({ tx, onClose, formatCurrency }: { tx: any, onClose: () => void, formatCurrency: (v: number) => string }) {
  if (!tx) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" 
        onClick={onClose}
      ></div>
      
      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
        
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
            <Receipt size={20} className="mr-2 text-indigo-500" />
            Transaction Details
          </h3>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6 flex-1">
          {/* Amount Header */}
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500 uppercase mb-2">{tx.type}</p>
            <p className={`text-4xl font-bold tabular-nums ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
              {tx.type === 'CREDIT' || tx.type === 'REFUND' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
            <div className="mt-4 flex justify-center">
              <StatusBadge status={tx.status} />
            </div>
          </div>

          {/* Details List */}
          <div className="space-y-4">
            <DetailRow label="Reference ID" value={<span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">{tx.reference}</span>} />
            <DetailRow label="Date & Time" value={format(new Date(tx.date), 'MMMM do, yyyy • h:mm a')} />
            <DetailRow label="Description" value={tx.description} />
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Client Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Client Information</h4>
            <DetailRow label="Name" value={tx.clientName} />
            <DetailRow label="Email" value={tx.clientEmail} />
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Wallet Balances */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Wallet Impact</h4>
            <DetailRow label="Balance Before" value={formatCurrency(tx.balanceBefore)} />
            <DetailRow label="Balance After" value={formatCurrency(tx.balanceAfter)} />
          </div>

        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
      <span className="text-sm font-medium text-zinc-500 sm:w-1/3">{label}</span>
      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 sm:w-2/3 sm:text-right break-words">{value}</span>
    </div>
  );
}
