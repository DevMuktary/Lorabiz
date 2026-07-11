"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, PlusCircle, Headset, CheckCircle, 
  CaretDown, Spinner, Archive, ArrowsClockwise, WhatsappLogo,
  MagnifyingGlass, Funnel
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

export default function WalletPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [fundingHistory, setFundingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals & Status
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "2348000000000";

  // Fetch Wallet Balance and Funding History
  const fetchWalletData = async () => {
    try {
      const balanceRes = await fetch("/api/user/wallet");
      const balanceData = await balanceRes.json();
      if (balanceData.success) {
        setBalance(balanceData.wallet.balance);
      }

      const txRes = await fetch("/api/user/transactions?type=CREDIT&status=SUCCESS");
      const txData = await txRes.json();
      if (txData.success) {
        setFundingHistory(txData.transactions);
      }
      return balanceData.wallet.balance;
    } catch (err) {
      console.error("Failed to load wallet data", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Filter Logic
  const filteredHistory = fundingHistory.filter((tx) => {
    const matchesSearch = tx.reference.toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    const txDate = new Date(tx.createdAt).getTime();

    if (startDate) {
      matchesDate = matchesDate && txDate >= new Date(startDate).getTime();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && txDate <= end.getTime();
    }

    return matchesSearch && matchesDate;
  });

  // SMART WEBHOOK POLLING
  const handleFundSuccess = async (amount: number) => {
    setVerifyingPayment(true);
    const startingBalance = balance || 0;
    let attempts = 0;

    const pollInterval = setInterval(async () => {
      attempts++;
      try {
        const balanceRes = await fetch("/api/user/wallet");
        const balanceData = await balanceRes.json();
        
        if (balanceData.success && balanceData.wallet.balance > startingBalance) {
          clearInterval(pollInterval);
          
          setBalance(balanceData.wallet.balance);
          const txRes = await fetch("/api/user/transactions?type=CREDIT&status=SUCCESS");
          const txData = await txRes.json();
          if (txData.success) setFundingHistory(txData.transactions);

          setVerifyingPayment(false);
          setSuccessMessage(`Successfully funded ₦${amount.toLocaleString()}!`);
          setTimeout(() => setSuccessMessage(null), 5000);
        } else if (attempts >= 15) { 
          clearInterval(pollInterval);
          setVerifyingPayment(false);
          setSuccessMessage(`Payment received. Balance will update shortly.`);
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      } catch (err) {
        // Ignore fetch errors during polling
      }
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 max-w-5xl mx-auto font-sans">
      
      {/* STATUS TOASTS */}
      {verifyingPayment && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
          <ArrowsClockwise className="h-5 w-5 text-amber-500 animate-spin shrink-0" weight="bold" />
          <div>
            <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">Verifying Payment...</h4>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-500/80 mt-0.5">Please wait while we confirm with the gateway.</p>
          </div>
        </div>
      )}

      {successMessage && !verifyingPayment && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 shadow-sm">
          <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0" weight="fill" />
          <div>
            <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Transaction Complete</h4>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-500/80 mt-0.5">{successMessage}</p>
          </div>
        </div>
      )}

      {/* BEAUTIFUL HERO BALANCE CARD */}
      <div className="relative overflow-hidden rounded-[2rem] bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-8 sm:p-10 shadow-2xl">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-zinc-400 mb-3">
              <Wallet className="h-5 w-5" weight="duotone" />
              <span className="text-xs font-black uppercase tracking-widest">Available Balance</span>
            </div>
            
            {loading ? (
              <div className="h-14 w-48 bg-zinc-800 animate-pulse rounded-xl mt-2 mb-2"></div>
            ) : (
              <h2 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-2">
                ₦{balance?.toLocaleString() || "0"}
              </h2>
            )}
            <p className="text-sm font-medium text-zinc-500">Funds are secured and ready for services.</p>
          </div>

          <button 
            onClick={() => setIsFundModalOpen(true)}
            disabled={loading || verifyingPayment}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xl shadow-primary/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <PlusCircle className="h-6 w-6" weight="fill" />
            Fund Wallet
          </button>
        </div>
      </div>

      {/* SLEEK SUPPORT BANNER */}
      <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left w-full sm:w-auto">
          <div className="hidden sm:flex h-14 w-14 rounded-full bg-emerald-200 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 items-center justify-center shrink-0">
            <Headset className="h-7 w-7" weight="fill" />
          </div>
          <div>
            <h3 className="font-black text-lg text-emerald-950 dark:text-emerald-50">Having payment issues?</h3>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-200/80 mt-0.5 leading-relaxed">
              If your wallet wasn't credited automatically, reach out to our dedicated support line.
            </p>
          </div>
        </div>
        <a 
          href={`https://wa.me/${supportNumber.replace(/\+/g, '')}?text=Hello LoraBiz Support, I have an issue with my recent wallet funding.`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#25D366]/20 cursor-pointer shrink-0"
        >
          <WhatsappLogo className="h-6 w-6" weight="fill" />
          Contact Support
        </a>
      </div>

      {/* FUNDING HISTORY */}
      <div className="space-y-4 pt-4">
        <h3 className="text-lg font-black text-foreground flex items-center gap-2 px-2">
          Funding History <CaretDown className="h-4 w-4 text-muted-foreground" weight="bold" />
        </h3>

        {/* FILTER TOOLBAR */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 shadow-sm">
          <div className="relative flex-1">
            <MagnifyingGlass className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference..." 
              className="pl-11 h-12 bg-secondary/50 border-border rounded-xl font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Funnel className="h-5 w-5 text-muted-foreground hidden sm:block" weight="bold" />
            <Input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-12 bg-secondary/50 border-border rounded-xl font-medium w-full sm:w-auto"
            />
            <span className="text-muted-foreground font-bold">-</span>
            <Input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-12 bg-secondary/50 border-border rounded-xl font-medium w-full sm:w-auto"
            />
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <Spinner className="animate-spin h-8 w-8 text-primary mx-auto" />
              <p className="text-sm font-bold text-muted-foreground mt-4">Loading your records...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-20" weight="duotone" />
              <p className="font-bold text-base text-foreground">No funding records found</p>
              <p className="text-sm font-medium mt-1">Adjust your filters or make a deposit.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                <thead>
                  <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                    <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider">Amount Funded</th>
                    <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-base bg-emerald-500/10 px-2 py-1 rounded-lg">
                          +₦{Number(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-muted-foreground font-mono bg-secondary px-2.5 py-1.5 rounded-lg border border-border">
                          {tx.reference}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                          <CheckCircle weight="fill" className="h-3.5 w-3.5" />
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
