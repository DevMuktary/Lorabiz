"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Receipt, CornerUpLeft, AlertCircle, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
  if (status === 'SUCCESS') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400"><CheckCircle2 size={12} className="mr-1.5" /> Success</span>;
  if (status === 'PENDING') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"><Clock size={12} className="mr-1.5" /> Pending</span>;
  if (status === 'FAILED') return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400"><XCircle size={12} className="mr-1.5" /> Failed</span>;
  return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">{status}</span>;
}

export default function TransactionDrawer({ tx, onClose, formatCurrency, onRefundSuccess }: { tx: any, onClose: () => void, formatCurrency: (v: number) => string, onRefundSuccess: () => void }) {
  const [isRefunding, setIsRefunding] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundAmount, setRefundAmount] = useState<number | string>("");
  const [refundReason, setRefundReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (tx) {
      setShowRefundForm(false);
      setRefundAmount(tx.amount);
      setRefundReason("");
      setError("");
    }
  }, [tx]);

  if (!tx) return null;

  const handleProcessRefund = async () => {
    if (!refundAmount || Number(refundAmount) <= 0 || Number(refundAmount) > tx.amount) {
      setError(`Amount must be between 1 and ${tx.amount}`);
      return;
    }
    if (!refundReason.trim() || refundReason.length < 5) {
      setError("Provide a detailed reason for the audit log.");
      return;
    }

    setIsRefunding(true);
    setError("");

    try {
      const res = await fetch("/api/mds/financials/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId: tx.id, refundAmount: Number(refundAmount), reason: refundReason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process refund");
      onRefundSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsRefunding(false);
    }
  };

  const isRefundable = tx.type === "DEBIT" && tx.status === "SUCCESS";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100"><Receipt size={20} className="mr-2 text-indigo-500" /> Transaction Details</h3>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="space-y-6 flex-1">
          <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl text-center border border-zinc-200 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500 uppercase mb-2">{tx.type}</p>
            <p className={`text-4xl font-bold tabular-nums ${tx.type === 'CREDIT' || tx.type === 'REFUND' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
              {tx.type === 'CREDIT' || tx.type === 'REFUND' ? '+' : '-'}{formatCurrency(tx.amount)}
            </p>
            <div className="mt-4 flex justify-center"><StatusBadge status={tx.status} /></div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between"><span className="text-sm text-zinc-500">Reference</span><span className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-2 rounded">{tx.reference}</span></div>
            <div className="flex justify-between"><span className="text-sm text-zinc-500">Date</span><span className="text-sm font-medium">{format(new Date(tx.date), 'MMM do, yyyy • h:mm a')}</span></div>
            <div className="flex flex-col gap-1"><span className="text-sm text-zinc-500">Description</span><span className="text-sm font-medium">{tx.description}</span></div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          {/* Refund Zone */}
          {isRefundable && !showRefundForm && (
            <button onClick={() => setShowRefundForm(true)} className="w-full flex items-center justify-center py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-medium rounded-lg text-sm">
              <CornerUpLeft size={16} className="mr-2" /> Issue Refund
            </button>
          )}

          {isRefundable && showRefundForm && (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-4">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400 flex items-center"><AlertCircle size={16} className="mr-1.5" /> Process Refund to Wallet</h4>
              <div className="space-y-3">
                <input type="number" max={tx.amount} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} placeholder="Amount" className="w-full bg-white dark:bg-zinc-900 border border-amber-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
                <input type="text" placeholder="Reason (Required)" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} className="w-full bg-white dark:bg-zinc-900 border border-amber-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500" />
              </div>
              {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => setShowRefundForm(false)} className="flex-1 py-2 border border-zinc-200 rounded-md text-sm">Cancel</button>
                <button onClick={handleProcessRefund} disabled={isRefunding} className="flex-1 py-2 bg-amber-600 text-white rounded-md flex justify-center items-center text-sm font-medium">
                  {isRefunding ? <RefreshCw size={16} className="animate-spin" /> : "Confirm Refund"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
