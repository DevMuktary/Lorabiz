"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, PlusCircle, Headset, CheckCircle, 
  CaretDown, Spinner, Archive, ArrowsClockwise, WhatsappLogo,
  MagnifyingGlass, Funnel, CaretLeft, CaretRight, ArrowDownLeft
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import FundWalletModal from "@/components/features/wallet/FundWalletModal";

const ITEMS_PER_PAGE = 10;

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

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

  // Pagination Logic
  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentData = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto font-sans">
      
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

      {/* FUNDING HISTORY SECTION */}
      <div className="space-y-5 pt-2">
        <h3 className="text-xl font-black text-foreground flex items-center gap-2 px-1">
          Funding History <CaretDown className="h-5 w-5 text-muted-foreground" weight="bold" />
        </h3>

        {/* FILTER TOOLBAR */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-5 shadow-sm">
          
          {/* Search Input */}
          <div className="relative flex-1 flex flex-col justify-end">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Search Reference</label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" weight="bold" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by reference..." 
                className="pl-11 h-12 bg-secondary/50 border-border rounded-xl font-medium focus:ring-primary/50"
              />
            </div>
          </div>

          {/* Date Range Selectors */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
            <div className="w-full sm:w-auto flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">Start Date</label>
              <div className="flex items-center gap-2">
                <Funnel className="h-5 w-5 text-muted-foreground hidden sm:block shrink-0" weight="bold" />
                <Input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12 bg-secondary/50 border-border rounded-xl font-medium w-full sm:w-[160px] focus:ring-primary/50"
                />
              </div>
            </div>
            
            <span className="hidden sm:flex text-muted-foreground font-bold h-12 items-center">-</span>
            
            <div className="w-full sm:w-auto flex flex-col mt-2 sm:mt-0">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1.5 ml-1">End Date</label>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-12 bg-secondary/50 border-border rounded-xl font-medium w-full sm:w-[160px] focus:ring-primary/50"
              />
            </div>
          </div>
        </div>

        {/* RESPONSIVE DATA CONTAINER */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="py-24 text-center">
              <Spinner className="animate-spin h-10 w-10 text-primary mx-auto mb-4" />
              <p className="text-sm font-bold text-muted-foreground">Loading your records...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground">
              <Archive className="h-14 w-14 mx-auto mb-4 opacity-20" weight="duotone" />
              <p className="font-black text-lg text-foreground">No funding records found</p>
              <p className="text-sm font-medium mt-1">Adjust your filters or make a deposit.</p>
            </div>
          ) : (
            <>
              {/* 📱 MOBILE VIEW (Card Layout) */}
              <div className="block md:hidden divide-y divide-border/50">
                {currentData.map((tx) => (
                  <div key={tx.id} className="p-5 hover:bg-secondary/30 transition-colors">
                    <div className="flex justify-between items-start mb-4 gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 mt-0.5 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
                          <ArrowDownLeft weight="bold" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground text-sm line-clamp-2 leading-snug mb-1">Wallet Funding</p>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-sm shrink-0 text-emerald-600 dark:text-emerald-400">
                        +₦{Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pl-[52px]">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border/50 truncate max-w-[150px]">
                        {tx.reference}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                        <CheckCircle weight="fill" className="h-3 w-3" />
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 💻 DESKTOP VIEW (Table Layout) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-secondary/50 text-muted-foreground border-b border-border">
                      <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider">Date & Time</th>
                      <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider">Amount Funded</th>
                      <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider">Reference</th>
                      <th className="px-6 py-5 font-bold text-xs uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {currentData.map((tx) => (
                      <tr key={tx.id} className="hover:bg-secondary/30 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-base bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            +₦{Number(tx.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-muted-foreground font-mono bg-secondary px-2.5 py-1.5 rounded-lg border border-border/50">
                            {tx.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600">
                            <CheckCircle weight="fill" className="h-3.5 w-3.5" />
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* PAGINATION FOOTER */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 border-t border-border bg-secondary/10 gap-4">
                  <span className="text-sm text-muted-foreground font-medium">
                    Showing <span className="font-bold text-foreground">{startIndex + 1}</span> to <span className="font-bold text-foreground">{Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)}</span> of <span className="font-bold text-foreground">{filteredHistory.length}</span> entries
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1.5 px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CaretLeft weight="bold" className="h-4 w-4" /> Prev
                    </button>
                    
                    <div className="hidden sm:flex items-center justify-center min-w-[40px] text-sm font-black">
                      {currentPage} / {totalPages}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1.5 px-4 py-2 bg-background border border-border rounded-xl text-sm font-bold text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <CaretRight weight="bold" className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
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
