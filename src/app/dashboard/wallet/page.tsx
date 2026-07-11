"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Wallet, PlusCircle, WhatsappLogo, CheckCircle, 
  CaretDown, Spinner, Archive, CircleNotch 
} from "@phosphor-icons/react";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Polling & Webhook States
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "2348000000000"; 

  const fetchBalance = async () => {
    try {
      const res = await fetch("/api/user/wallet");
      const data = await res.json();
      if (data.success) setBalance(data.wallet.balance);
      return data.wallet?.balance;
    } catch (err) {
      console.error("Failed to load balance", err);
      return null;
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/user/transactions?type=CREDIT&status=SUCCESS");
      const data = await res.json();
      if (data.success) setFundingHistory(data.transactions);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  // Initial Load
  useEffect(() => {
    Promise.all([fetchBalance(), fetchHistory()]).then(() => {
      setLoadingInitial(false);
    });

    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  // Webhook Polling Engine
  const startBalancePolling = (oldBalance: number, amountAdded: number) => {
    setIsVerifying(true);
    let attempts = 0;
    const maxAttempts = 15; // 30 seconds total (15 * 2s)

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      const currentBalance = await fetchBalance();

      // If the webhook updated the DB, the balance will be higher than before!
      if (currentBalance !== null && currentBalance > oldBalance) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        
        // Refresh the table silently
        fetchHistory();
        
        setIsVerifying(false);
        setSuccessMessage(`₦${amountAdded.toLocaleString()} successfully added to your wallet!`);
        
        setTimeout(() => setSuccessMessage(null), 6000);
      } else if (attempts >= maxAttempts) {
        // Timeout: Webhook is delayed or failed
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setIsVerifying(false);
        setSuccessMessage("Payment received, but there's a slight delay in updating your balance. Please check back in a few minutes.");
        setTimeout(() => setSuccessMessage(null), 8000);
      }
    }, 2000);
  };

  const handleFundSuccess = (amount: number) => {
    setIsFundModalOpen(false);
    // Start silently polling for the webhook to finish its job
    startBalancePolling(balance || 0, amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto">
      
      {/* SUCCESS TOAST */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" weight="fill" />
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{successMessage}</p>
        </div>
      )}

      {/* VERIFYING OVERLAY */}
      {isVerifying && (
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in">
          <CircleNotch className="h-6 w-6 text-blue-500 shrink-0 animate-spin" weight="bold" />
          <div>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-400">Verifying Payment...</p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">Please wait while we securely confirm your transaction with the bank.</p>
          </div>
        </div>
      )}

      {/* UNIFIED WALLET DASHBOARD CARD */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8 relative overflow-hidden">
        
        {/* Left: Balance Info */}
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-5 w-5" weight="duotone" />
            <span className="text-sm font-black uppercase tracking-widest">Available Balance</span>
          </div>
          
          <div className="h-12 flex items-center">
            {loadingInitial ? (
              <div className="h-10 w-48 bg-secondary rounded-lg animate-pulse"></div>
            ) : (
              <h2 className="text-4xl sm:text-5xl font-black text-foreground tracking-tight">
                ₦{balance?.toLocaleString() || "0"}
              </h2>
            )}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsFundModalOpen(true)}
            disabled={isVerifying || loadingInitial}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="h-5 w-5" weight="bold" />
            Fund Wallet
          </button>

          <a 
            href={`https://wa.me/${supportNumber.replace(/\+/g, '')}?text=Hello LoraBiz Support, I need assistance with my wallet.`}
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <WhatsappLogo className="h-5 w-5" weight="fill" />
            Support
          </a>
        </div>
      </div>

      {/* FUNDING HISTORY */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 px-1">
          Recent Deposits <CaretDown className="h-4 w-4" weight="bold" />
        </h3>

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {loadingInitial ? (
            <div className="py-20 text-center">
              <Spinner className="animate-spin h-8 w-8 text-primary mx-auto" />
              <p className="text-sm font-bold text-muted-foreground mt-3">Loading history...</p>
            </div>
          ) : fundingHistory.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" weight="duotone" />
              <p className="font-bold text-base text-foreground">No deposits yet</p>
              <p className="text-sm mt-1">Your successful wallet fundings will appear here.</p>
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
