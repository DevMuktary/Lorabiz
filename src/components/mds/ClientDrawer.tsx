"use client";

import { useState } from 'react';
import { format } from 'date-fns';
import { X, User, ShieldAlert, Wallet, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

export default function ClientDrawer({ client, onClose, onUpdateSuccess }: { client: any, onClose: () => void, onUpdateSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState("BIO"); // BIO, LEDGER, ORDERS, ACTIONS
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Action State
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  if (!client) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const handleAction = async (actionType: string, payload: any) => {
    setIsProcessing(true);
    setError("");
    try {
      const res = await fetch("/api/mds/clients/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, actionType, ...payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAdjustAmount(""); setAdjustReason(""); setSuspendReason("");
      onUpdateSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isSuspended = client.isSuspended;
  const balance = Number(client.wallet?.balance || 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-zinc-900/60 transition-opacity animate-in fade-in duration-200" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center text-zinc-900 dark:text-zinc-100">
              <User size={20} className="mr-2 text-indigo-500" /> Client Dossier
            </h3>
            <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="pr-2">
              <h4 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight break-all sm:break-normal">{client.firstName} {client.lastName}</h4>
              <p className="text-sm text-zinc-500 mt-1">{client.email} • {client.phone}</p>
            </div>
            <div className="sm:text-right">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${isSuspended ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {isSuspended ? 'Suspended' : 'Active'}
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-white mt-1">{formatCurrency(balance)}</p>
            </div>
          </div>

          {/* Pill Tabs - Wraps on mobile so nothing hides! */}
          <div className="flex flex-wrap gap-2 mt-6">
            <TabBtn label="Bio" active={activeTab === "BIO"} onClick={() => setActiveTab("BIO")} />
            <TabBtn label="Financials" active={activeTab === "LEDGER"} onClick={() => setActiveTab("LEDGER")} />
            <TabBtn label="Order History" active={activeTab === "ORDERS"} onClick={() => setActiveTab("ORDERS")} />
            <TabBtn label="MD Actions" active={activeTab === "ACTIONS"} onClick={() => setActiveTab("ACTIONS")} danger />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950/50">
          
          {/* TAB 1: BIO */}
          {activeTab === "BIO" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Profile Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-4 text-sm">
                  <Detail label="Joined Date" value={format(new Date(client.createdAt), 'MMM do, yyyy')} />
                  <Detail label="Gender" value={client.gender} />
                  <Detail label="Location" value={`${client.city || client.lga}, ${client.state}`} />
                  <Detail label="Address" value={client.street} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEDGER */}
          {activeTab === "LEDGER" && (
            <div className="space-y-4 animate-in fade-in">
              {client.transactions?.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-10">No transactions recorded.</p>
              ) : (
                client.transactions?.map((tx: any) => (
                  // Uses flex-col on mobile, flex-row on desktop to stop overlapping
                  <div key={tx.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shadow-sm">
                    <div className="flex items-start sm:items-center">
                      <div className={`p-2 rounded-lg mr-3 mt-1 sm:mt-0 shrink-0 ${tx.type === 'CREDIT' || tx.type === 'REFUND' || tx.type === 'ADJUSTMENT' ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'}`}>
                        {tx.type === 'CREDIT' || tx.type === 'REFUND' || tx.type === 'ADJUSTMENT' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2">{tx.description}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{format(new Date(tx.createdAt), 'MMM d, h:mm a')} • <span className="font-mono">{tx.reference}</span></p>
                      </div>
                    </div>
                    <div className="sm:text-right self-start sm:self-auto w-full sm:w-auto flex justify-between sm:block border-t sm:border-0 border-zinc-100 dark:border-zinc-800 pt-2 sm:pt-0 mt-2 sm:mt-0">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 sm:block">{tx.status}</span>
                      <p className={`font-bold tabular-nums ${tx.type === 'CREDIT' || tx.type === 'REFUND' || tx.type === 'ADJUSTMENT' ? 'text-emerald-600' : 'text-zinc-900 dark:text-white'}`}>
                        {tx.type === 'CREDIT' || tx.type === 'REFUND' || tx.type === 'ADJUSTMENT' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === "ORDERS" && (
            <div className="space-y-4 animate-in fade-in">
              <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">CAC Applications</h4>
              {[...client.registrations, ...client.llcRegistrations].length === 0 ? (
                <p className="text-sm text-zinc-500 italic pb-4">No CAC orders found.</p>
              ) : (
                [...client.registrations, ...client.llcRegistrations].map((reg: any) => (
                  <div key={reg.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{reg.proposedName}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{reg.trackingId || 'Draft'}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded self-start sm:self-auto">{reg.status}</span>
                  </div>
                ))
              )}

              <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-wider mt-6">NIN Slips Generated</h4>
              {client.ninRequests?.length === 0 ? (
                <p className="text-sm text-zinc-500 italic">No NIN requests found.</p>
              ) : (
                client.ninRequests?.map((nin: any) => (
                  <div key={nin.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 shadow-sm">
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{nin.slipType.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{nin.ninMasked}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded self-start sm:self-auto">{nin.status}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: ACTIONS (MD ONLY) */}
          {activeTab === "ACTIONS" && (
            <div className="space-y-8 animate-in fade-in">
              
              {/* Wallet Adjustment */}
              <div className="bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm">
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-400 mb-1 flex items-center"><Wallet size={16} className="mr-2"/> Manual Wallet Adjustment</h4>
                <p className="text-xs text-zinc-500 mb-4">Directly add or remove funds from this client's wallet. This bypasses Paystack entirely.</p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-medium">₦</span>
                    <input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="Amount" className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <input type="text" value={adjustReason} onChange={e => setAdjustReason(e.target.value)} placeholder="Reason for adjustment (Required for Audit Log)" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm focus:ring-2 focus:ring-indigo-500" />
                  
                  {/* Buttons stack cleanly on mobile */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button onClick={() => handleAction("CREDIT_WALLET", { amount: adjustAmount, reason: adjustReason })} disabled={isProcessing} className="w-full sm:flex-1 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors">Credit Wallet (+)</button>
                    <button onClick={() => handleAction("DEBIT_WALLET", { amount: adjustAmount, reason: adjustReason })} disabled={isProcessing} className="w-full sm:flex-1 py-2.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors">Debit Wallet (-)</button>
                  </div>
                </div>
              </div>

              {/* Suspension */}
              <div className="bg-red-50 dark:bg-red-500/5 p-4 sm:p-5 rounded-xl border-2 border-dashed border-red-200 dark:border-red-500/30">
                <h4 className="text-sm font-bold text-red-900 dark:text-red-400 mb-1 flex items-center"><ShieldAlert size={16} className="mr-2"/> Account Sanctions</h4>
                <p className="text-xs text-red-700/70 dark:text-red-400/70 mb-4">Suspending an account instantly terminates their session and locks them out of the portal.</p>
                
                <input type="text" value={suspendReason} onChange={e => setSuspendReason(e.target.value)} placeholder="Reason for action (Required)" className="w-full px-3 py-2 mb-3 bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-md text-sm focus:ring-2 focus:ring-red-500" />
                
                {isSuspended ? (
                  <button onClick={() => handleAction("UNSUSPEND", { reason: suspendReason })} disabled={isProcessing} className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-lg text-sm transition-colors">Restore Account Access</button>
                ) : (
                  <button onClick={() => handleAction("SUSPEND", { reason: suspendReason })} disabled={isProcessing} className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm transition-colors">Suspend Account</button>
                )}
              </div>
              
              {error && <p className="text-xs text-red-600 font-bold text-center bg-red-50 dark:bg-red-500/10 py-2 rounded border border-red-200 dark:border-red-500/30">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helpers
function TabBtn({ label, active, onClick, danger }: any) {
  // New Pill-style tabs for better mobile wrapping
  return (
    <button 
      onClick={onClick} 
      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
        active 
          ? (danger ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400') 
          : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
      }`}
    >
      {label}
    </button>
  );
}

function Detail({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider mb-0.5">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value || "—"}</span>
    </div>
  );
}
