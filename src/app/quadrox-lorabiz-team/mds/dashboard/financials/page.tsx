"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import LedgerTable from '@/components/mds/LedgerTable';
import TransactionDrawer from '@/components/mds/TransactionDrawer';
import { Wallet, ArrowDownRight, ArrowUpRight, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = ['#14b8a6', '#6366f1', '#f43f5e', '#f59e0b', '#8b5cf6', '#0ea5e9', '#10b981', '#ec4899']; 

export default function FinancialAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState("30"); 
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mds/financials?days=${dateRange}&page=${page}&limit=20`);
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading financials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Refetch when dateRange OR page changes
  useEffect(() => {
    fetchFinancialData();
  }, [dateRange, page]);

  // Reset to page 1 if they change the date filter
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
    setPage(1);
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const metrics = data?.metrics || { totalRevenue: 0, totalLiabilities: 0 };
  const revenueBreakdown = data?.revenueBreakdown || [];
  const chartData = data?.chartData || [];
  const ledger = data?.ledger || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 };

  // Dynamically extract service keys for the chart (excluding 'name' which is the Date)
  const chartKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(k => k !== 'name') : [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 font-sans">
      
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dynamic revenue breakdowns and master transaction ledger.</p>
        </div>
        <select 
          value={dateRange}
          onChange={handleDateRangeChange}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-sm outline-none transition-all"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">This Quarter</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Dynamic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard title="Gross Service Revenue" value={formatCurrency(metrics.totalRevenue)} isLoading={isLoading} highlight="text-teal-600 dark:text-teal-400" icon={<Wallet size={16} />} positive={true} />
        <KpiCard title="Client Wallet Liabilities" value={formatCurrency(metrics.totalLiabilities)} isLoading={isLoading} highlight="text-rose-600 dark:text-rose-400" icon={<Activity size={16} />} positive={false} />
        
        {/* Dynamically render cards for whatever services exist */}
        {!isLoading && revenueBreakdown.map((item: any, idx: number) => (
          <KpiCard 
            key={item.name} 
            title={`${item.name} Yield`} 
            value={formatCurrency(item.amount)} 
            isLoading={isLoading} 
          />
        ))}
        {isLoading && (
          <><SkeletonCard /><SkeletonCard /></>
        )}
      </div>

      {/* Dynamic Analytics Chart */}
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Revenue by Service Segment (7-Day Trend)</h2>
        {isLoading ? (
          <div className="w-full h-[300px] bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl"></div>
        ) : chartData.length > 0 && chartKeys.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#64748b" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} tickFormatter={(value) => `₦${value / 1000}k`} />
                <RechartsTooltip 
                  cursor={{ fill: '#64748b', opacity: 0.1 }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                  formatter={(value: any) => formatCurrency(Number(value))}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontWeight: 500, color: '#64748b' }} />
                
                {/* Dynamically build Bars based on available service streams */}
                {chartKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} name={`${key} Services`} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center text-slate-500">No active service revenue in the last 7 days.</div>
        )}
      </div>

      {/* Paginated Ledger Section */}
      <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-2xl overflow-hidden flex flex-col">
        <LedgerTable 
          ledger={ledger} 
          isLoading={isLoading} 
          formatCurrency={formatCurrency} 
          onSelectTx={(tx) => setSelectedTx(tx)} 
        />
        
        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Showing Page <span className="text-slate-900 dark:text-white font-bold">{pagination.currentPage}</span> of {pagination.totalPages} <span className="hidden sm:inline">({pagination.totalItems} total records)</span>
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                disabled={page === pagination.totalPages} 
                onClick={() => setPage(page + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <TransactionDrawer 
        tx={selectedTx} 
        onClose={() => setSelectedTx(null)} 
        formatCurrency={formatCurrency}
        onRefundSuccess={() => {
          setSelectedTx(null);
          fetchFinancialData(); // Refresh current page
        }}
      />
    </div>
  );
}

function KpiCard({ title, value, isLoading, highlight = "text-slate-900 dark:text-white", icon, positive }: { title: string, value: string, isLoading: boolean, highlight?: string, icon?: React.ReactNode, positive?: boolean }) {
  return (
    <div className="group bg-white dark:bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg hover:border-teal-500/30 hover:shadow-md dark:hover:shadow-teal-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default">
      <div className="flex justify-between items-start mb-6">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors tracking-wide">{title}</p>
        {icon && <span className="text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-md border border-slate-100 dark:border-transparent">{icon}</span>}
      </div>
      <div>
        {isLoading ? (
          <div className="w-32 h-8 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse"></div>
        ) : (
          <>
            <h3 className={`text-2xl sm:text-3xl font-black mb-3 tabular-nums tracking-tighter ${highlight}`}>{value}</h3>
            {icon && positive !== undefined && (
               <div className={`flex items-center text-[10px] font-bold uppercase tracking-widest tabular-nums ${positive ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
                 {positive ? <ArrowUpRight size={14} className="mr-1.5" /> : <ArrowDownRight size={14} className="mr-1.5" />}
                 Trend Active
               </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-lg flex flex-col justify-between h-[140px]">
      <div className="w-28 h-4 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse"></div>
      <div className="w-36 h-10 bg-slate-200 dark:bg-slate-800/80 rounded animate-pulse mt-4"></div>
    </div>
  );
}
