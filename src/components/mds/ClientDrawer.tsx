"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  X, 
  User, 
  ShieldAlert, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Mail,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink
} from 'lucide-react';

export default function ClientDrawer({ client, onClose, onUpdateSuccess }: { client: any, onClose: () => void, onUpdateSuccess: () => void }) {
  const [activeTab, setActiveTab] = useState("BIO"); // BIO, LEDGER, ORDERS, ACTIONS
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Full Transactions State
  const [transactions, setTransactions] = useState<any[]>(client?.transactions || []);
  const [isLoadingTx, setIsLoadingTx] = useState(false);
  const [txSearch, setTxSearch] = useState("");

  // Action State
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [suspendReason, setSuspendReason] = useState("");

  useEffect(() => {
    if (client) {
      setTransactions(client.transactions || []);
    }
  }, [client]);

  const fetchFullTransactions = async () => {
    if (!client?.id) return;
    setIsLoadingTx(true);
    try {
      const res = await fetch(`/api/mds/clients/${client.id}/transactions`);
      if (!res.ok) throw new Error("Failed to fetch full transactions");
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err: any) {
      console.error("Error loading full transactions:", err);
    } finally {
      setIsLoadingTx(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LEDGER" && client?.id) {
      fetchFullTransactions();
    }
  }, [activeTab, client?.id]);

  if (!client) return null;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

  const filteredTransactions = transactions.filter((tx: any) => {
    if (!txSearch.trim()) return true;
    const q = txSearch.toLowerCase();
    return (
      (tx.description && tx.description.toLowerCase().includes(q)) ||
      (tx.reference && tx.reference.toLowerCase().includes(q)) ||
      (tx.serviceCategory && tx.serviceCategory.toLowerCase().includes(q)) ||
      String(tx.amount).includes(q)
    );
  });

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
            <div className="flex items-center gap-2">
              <Link
                href={`/quadrox-lorabiz-team/mds/dashboard/campaigns/new?targetEmail=${encodeURIComponent(client.email)}&targetName=${encodeURIComponent(`${client.firstName} ${client.lastName}`)}&template=LEGAL_DEMAND`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-lg text-xs font-bold transition-colors"
                title="Send Legal Demand / Direct Email"
              >
                <Mail size={14} />
                <span>Send Legal Notice</span>
              </Link>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><X size={18} /></button>
            </div>
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
            <TabBtn label={`Financials (${transactions.length})`} active={activeTab === "LEDGER"} onClick={() => setActiveTab("LEDGER")} />
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
                  <Detail label="Location" value={`${client.city || client.lga || ''}, ${client.state || ''}`} />
                  <Detail label="Address" value={client.street} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEDGER (Expanded Financial History) */}
          {activeTab === "LEDGER" && (
            <div className="space-y-4 animate-in fade-in">
              {/* Financial Search & Quick Stats */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="relative w-full sm:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                  <input
                    type="text"
                    placeholder="Search ledger by reference, airtime, funding, amount..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  onClick={fetchFullTransactions}
                  disabled={isLoadingTx}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-50 transition-colors shrink-0"
                >
                  <RefreshCw size={13} className={isLoadingTx ? "animate-spin" : ""} />
                  <span>Sync ({transactions.length})</span>
                </button>
              </div>

              {isLoadingTx ? (
                <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
                  <RefreshCw className="animate-spin mx-auto text-indigo-500" size={20} />
                  <p>Loading complete financial audit trail...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <p className="text-center text-sm text-zinc-500 py-10">No transactions matching filter.</p>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((tx: any) => {
                    const isCredit = tx.type === 'CREDIT' || tx.type === 'REFUND' || tx.type === 'ADJUSTMENT';
                    return (
                      <div key={tx.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shadow-xs hover:border-zinc-300 transition-colors">
                        <div className="flex items-start sm:items-center flex-1 min-w-0">
                          <div className={`p-2 rounded-lg mr-3 mt-0.5 sm:mt-0 shrink-0 ${isCredit ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                            {isCredit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{tx.description}</p>
                              {tx.serviceCategory && (
                                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                  {tx.serviceCategory}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 flex-wrap">
                              <span>{format(new Date(tx.createdAt), 'MMM d, yyyy • h:mm:ss a')}</span>
                              <span>•</span>
                              <span className="font-mono text-[10px] bg-zinc-100 dark:bg-zinc-800/60 px-1 py-0.5 rounded select-all">{tx.reference}</span>
                            </div>
                            {(tx.balanceBefore !== undefined && tx.balanceAfter !== undefined) && (
                              <p className="text-[10px] text-zinc-400 mt-1 font-mono">
                                Balance: {formatCurrency(Number(tx.balanceBefore))} → {formatCurrency(Number(tx.balanceAfter))}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0 border-t sm:border-0 border-zinc-100 dark:border-zinc-800 pt-2 sm:pt-0 flex items-center justify-between sm:block">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block sm:mb-1 ${tx.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : tx.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                            {tx.status}
                          </span>
                          <p className={`font-bold tabular-nums text-sm ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
                            {isCredit ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
