"use client";

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import LedgerTable from '@/components/mds/LedgerTable';
import TransactionDrawer from '@/components/mds/TransactionDrawer';

export default function FinancialAnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [dateRange, setDateRange] = useState("30"); // 7, 30, 90, all
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const fetchFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/mds/financials?days=${dateRange}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error loading financials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]); // Refetch automatically when dropdown changes

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const metrics = data?.metrics || { totalRevenue: 0, cacRevenue: 0, ninRevenue: 0, totalLiabilities: 0 };
  const chartData = data?.chartData || [];
  const ledger = data?.ledger || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Financial Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Revenue breakdowns and master transaction ledger.</p>
        </div>
        <select 
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm font-medium rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">This Quarter</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard title="Total Revenue" value={formatCurrency(metrics.totalRevenue)} isLoading={isLoading} highlight="text-indigo-600 dark:text-indigo-400" />
        <KpiCard title="CAC Services" value={formatCurrency(metrics.cacRevenue)} isLoading={isLoading} />
        <KpiCard title="NIN Services" value={formatCurrency(metrics.ninRevenue)} isLoading={isLoading} />
        <KpiCard title="Client Liabilities (Deposits)" value={formatCurrency(metrics.totalLiabilities)} isLoading={isLoading} highlight="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Analytics Chart */}
      <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-6">Revenue by Service (Trend)</h2>
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

      {/* Isolated Components */}
      <LedgerTable 
        ledger={ledger} 
        isLoading={isLoading} 
        formatCurrency={formatCurrency} 
        onSelectTx={(tx) => setSelectedTx(tx)} 
      />

      <TransactionDrawer 
        tx={selectedTx} 
        onClose={() => setSelectedTx(null)} 
        formatCurrency={formatCurrency}
        onRefundSuccess={() => {
          setSelectedTx(null);
          fetchFinancialData();
        }}
      />
    </div>
  );
}

function KpiCard({ title, value, isLoading, highlight = "text-zinc-900 dark:text-white" }: { title: string, value: string, isLoading: boolean, highlight?: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{title}</p>
      {isLoading ? (
        <div className="w-32 h-8 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"></div>
      ) : (
        <h3 className={`text-2xl font-bold tabular-nums ${highlight}`}>{value}</h3>
      )}
    </div>
  );
}
