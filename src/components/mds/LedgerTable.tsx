"use client";

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Search, Filter, RefreshCw, Eye, Download, CheckCircle2, Clock, XCircle } from 'lucide-react';

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={12} className="mr-1.5" /> Success</span>;
  if (status === 'PENDING') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"><Clock size={12} className="mr-1.5" /> Pending</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400"><XCircle size={12} className="mr-1.5" /> Failed</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">{status}</span>;
}

export default function LedgerTable({ ledger, isLoading, formatCurrency, onSelectTx }: { ledger: any[], isLoading: boolean, formatCurrency: (v: number) => string, onSelectTx: (tx: any) => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filteredLedger = useMemo(() => {
    if (!ledger) return [];
    return ledger.filter((tx: any) => {
      const matchesSearch = tx.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || tx.reference.toLowerCase().includes(searchTerm.toLowerCase()) || tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "ALL" || tx.type === filterType;
      const matchesStatus = filterStatus === "ALL" || tx.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [ledger, searchTerm, filterType, filterStatus]);

  const exportToCSV = () => {
    if (!filteredLedger.length) return;
    const exportData = filteredLedger.map((tx: any) => ({
      Date: format(new Date(tx.date), 'yyyy-MM-dd HH:mm'),
      Reference: tx.reference,
      Client: tx.clientName,
      Description: tx.description,
      Type: tx.type,
      Amount: tx.amount,
      Status: tx.status
    }));
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ledger_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row gap-4 justify-between bg-zinc-50 dark:bg-zinc-900/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input type="text" placeholder="Search reference, client, description..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div className="flex items-center gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 cursor-pointer">
            <option value="ALL">All Types</option>
            <option value="DEBIT">Debits (Revenue)</option>
            <option value="CREDIT">Credits (Funding)</option>
            <option value="REFUND">Refunds</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-sm rounded-lg px-3 py-2 cursor-pointer">
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
          <button onClick={exportToCSV} disabled={!filteredLedger.length} className="hidden sm:flex items-center px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm rounded-lg hover:bg-zinc-800 disabled:opacity-50">
            <Download size={16} className="mr-2" /> Export
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium text-right">Amount</th>
              <th className="px-6 py-4 font-medium text-center">Status</th>
              <th className="px-6 py-4 font-medium text-center">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500"><RefreshCw className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />Loading ledger...</td></tr>
            ) : filteredLedger.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No transactions found.</td></tr>
            ) : (
              filteredLedger.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-[300px]">{tx.description}</p>
                    <p className="text-xs text-zinc-500 mt-1">{format(new Date(tx.date), 'MMM d, yyyy • h:mm a')}</p>
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
                  <td className="px-6 py-4 text-center"><StatusBadge status={tx.status} /></td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => onSelectTx(tx)} className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 rounded-md transition-colors"><Eye size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
