"use client";

import { useState, useEffect } from "react";
import { Wallet, PlusCircle, Headset, CheckCircle, WarningCircle, CaretDown, Spinner, Archive } from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "2348000000000"; // Fallback if env is missing

  // Fetch Wallet Balance and Funding History
  const fetchWalletData = async () => {
    try {
      // 1. Fetch Balance
      const balanceRes = await fetch("/api/user/wallet");
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance(balanceData.wallet.balance);
      }

      // 2. Fetch Transactions (Server-side filtering via query params!)
      const txRes = await fetch("/api/user/transactions?type=CREDIT&status=SUCCESS");
      const txData = await txRes.json();
      if (txData.success) {
        setFundingHistory(txData.transactions);
      }
    } catch (err) {
      console.error("Failed to load wallet data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleFundSuccess = (amount: number) => {
    setSuccessMessage(`Successfully funded ₦${amount.toLocaleString()}!`);
    fetchWalletData(); // Refresh the balance and history
    
    // Clear the success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto">
      
      {/* SUCCESS TOAST */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4">
          <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" weight="fill" />
          <div>
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Payment Successful</h4>
            <p className="text-sm text-emerald-600 dark:text-emerald-500/80 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* HEADER & BALANCE CARD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Balance Display */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -right-10 -top-10 h-40 w-40 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 right-20 h-32 w-32 bg-primary/20 rounded-full blur-xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/70 mb-2">
              <Wallet className="h-5 w-5" weight="duotone" />
              <span className="text-sm font-bold uppercase tracking-widest">Available Balance</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl font-black mb-8 tracking-tight">
              {balance !== null ? `₦${balance.toLocaleString()}` : "₦---"}
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => setIsFundModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
              >
                <PlusCircle className="h-5 w-5" weight="bold" />
                Fund Wallet
              </button>
            </div>
          </div>
        </div>

        {/* Support Card */}
        <div className="bg-amber-500/5 border-2 border-amber-500/20 rounded-3xl p-6 flex flex-col justify-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <WarningCircle className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h3 className="font-black text-lg text-foreground">Payment Issue?</h3>
            <p className="text-sm font-medium text-muted-foreground mt-1 leading-relaxed">
              If your wallet wasn't credited after a successful deduction, contact our support team immediately.
            </p>
          </div>
          <a 
            href={`https://wa.me/${supportNumber.replace(/\+/g, '')}?text=Hello LoraBiz Support, I have an issue with my recent wallet funding.`}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors mt-auto shadow-md shadow-[#25D366]/20 cursor-pointer"
          >
            <Headset className="h-5 w-5" weight="fill" />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* FUNDING HISTORY */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-foreground flex items-center gap-2 px-1">
          Funding History <CaretDown className="h-4 w-4 text-muted-foreground" weight="bold" />
        </h3>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 text-center">
              <Spinner className="animate-spin h-8 w-8 text-primary mx-auto" />
              <p className="text-sm font-bold text-muted-foreground mt-3">Loading history...</p>
            </div>
          ) : fundingHistory.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" weight="duotone" />
              <p className="font-bold text-base">No funding records found</p>
              <p className="text-sm font-medium mt-1">Your successful deposits will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Amount Funded</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {fundingHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs font-medium text-muted-foreground">{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base">
                          +₦{Number(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-muted-foreground font-mono bg-secondary/50 px-2 py-1 rounded-md border border-border">
                          {tx.reference}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                          <CheckCircle weight="fill" className="h-3 w-3" />
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FundWalletModal 
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        onSuccess={handleFundSuccess}
        onFailure={(msg) => alert(msg)}
      />

    </div>
  );
}
