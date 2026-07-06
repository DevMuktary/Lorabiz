"use client";
import { useState, useEffect } from 'react';
import { FinancialCharts } from './components/FinancialCharts';
import { FinancialLedger } from './components/FinancialLedger';
import { KpiCard } from './components/KpiCard';

export default function FinancialAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mds/financials').then(res => res.json()).then(d => { setData(d); setIsLoading(false); });
  }, []);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Financial Analytics</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <KpiCard title="Total Revenue (30d)" value={formatCurrency(data?.metrics.totalRevenue)} isLoading={isLoading} />
        <KpiCard title="CAC Revenue" value={formatCurrency(data?.metrics.cacRevenue)} isLoading={isLoading} />
        <KpiCard title="NIN Revenue" value={formatCurrency(data?.metrics.ninRevenue)} isLoading={isLoading} />
        <KpiCard title="Total Liabilities" value={formatCurrency(data?.metrics.totalLiability)} isLoading={isLoading} highlight="text-amber-600" />
      </div>

      <FinancialCharts data={data?.chartData} isLoading={isLoading} />
      <FinancialLedger ledger={data?.ledger} isLoading={isLoading} onRefresh={() => { /* re-fetch logic */ }} />
    </div>
  );
}
