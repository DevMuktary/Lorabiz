// src/app/dashboard/wallet/page.tsx
"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, PlusCircle, Headset, CheckCircle, 
  CaretDown, Spinner, Archive, ArrowsClockwise, WhatsappLogo,
  MagnifyingGlass, Funnel, CaretLeft, CaretRight, ArrowDownLeft,
  X, WarningCircle, Info, ArrowUpRight
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
  const [alertInfo, setAlertInfo] = useState<{
    type?: "success" | "warning" | "info" | "loading";
    title: string;
    message: string;
  } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE || "12299494839";

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
      return balanceData.wallet?.balance;
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

  // Automatic verification on redirect from Paystack
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isFunded = params.get("funded");
      const reference = params.get("reference");

      if (isFunded === "true" && reference) {
        setAlertInfo({
          type: "loading",
          title: "Verifying Payment",
          message: "Confirming transaction with the banking gateway..."
        });

        fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAlertInfo({
              type: "success",
              title: "Payment Confirmed",
              message: "Your wallet has been credited successfully."
            });
            fetchWalletData();
          } else {
            setAlertInfo({
              type: "warning",
              title: "Payment Incomplete",
              message: "Transaction could not be verified. No funds debited."
            });
          }
        })
        .catch(() => {
          setAlertInfo({
            type: "info",
            title: "Processing Payment",
            message: "Your payment is being confirmed. Balance will update shortly."
          });
        })
        .finally(() => {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        });
      } else if (isFunded === "true" && !reference) {
        setAlertInfo({
          type: "info",
          title: "Updating Balance",
          message: "Refreshing your wallet balance..."
        });
        setTimeout(fetchWalletData, 3000);
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      } else if (params.get("cancelled") === "true") {
        setAlertInfo({
          type: "warning",
          title: "Payment Cancelled",
          message: "You cancelled the funding process."
        });
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
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
          setAlertInfo({
            type: "success",
            title: "Funding Successful",
            message: `Successfully credited ₦${amount.toLocaleString()} to your wallet!`
          });
        } else if (attempts >= 15) { 
          clearInterval(pollInterval);
          setVerifyingPayment(false);
          setAlertInfo({
            type: "info",
            title: "Payment Received",
            message: "Your payment was submitted and your balance will update momentarily."
          });
        }
      } catch {
        // Continue polling
      }
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12 max-w-6xl mx-auto">
      
      {/* STATUS TOAST NOTIFICATION */}
      {alertInfo && (
        <div className="fixed bottom-6 right-6 bg-card text-foreground px-4 py-3.5 rounded-2xl shadow-2xl z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm border border-border">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-secondary">
            {alertInfo.type === "success" && <CheckCircle className="h-5 w-5 text-emerald-500" weight="fill" />}
            {alertInfo.type === "warning" && <WarningCircle className="h-5 w-5 text-amber-500" weight="fill" />}
            {alertInfo.type === "loading" && <Spinner className="h-5 w-5 text-primary animate-spin" weight="bold" />}
            {(!alertInfo.type || alertInfo.type === "info") && <Info className="h-5 w-5 text-blue-500" weight="fill" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs leading-tight truncate">{alertInfo.title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{alertInfo.message}</p>
          </div>
          <button 
            onClick={() => setAlertInfo(null)} 
            className="p-1 hover:bg-secondary rounded-lg transition-colors cursor-pointer shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Close notification"
          >
            <X weight="bold" className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* EXECUTIVE BALANCE CARD */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-6 sm:p-8 md:p-10 shadow-lg">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Wallet className="h-5 w-5 text-primary" weight="duotone" />
              <span className="text-xs font-black uppercase tracking-widest">Available Wallet Balance</span>
            </div>
            
            {loading ? (
              <div className="h-12 w-48 bg-secondary animate-pulse rounded-xl mt-2 mb-2"></div>
            ) : (
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight mb-2">
                ₦{balance !== null ? balance.toLocaleString() : "0"}
              </h2>
            )}
            <p className="text-xs sm:text-sm font-medium text-muted-foreground">
              Funds are instantly available for all registration, clearance, and verification orders.
            </p>
          </div>

          <button 
            onClick={() => setIsFundModalOpen(true)}
            disabled={loading || verifyingPayment}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            <PlusCircle className="h-5 w-5" weight="fill" />
            <span>Fund Wallet</span>
          </button>
        </div>
      </div>

      {/* SUPPORT BANNER */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4 text-center sm:text-left w-full sm:w-auto">
          <div className="hidden sm:flex h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 items-center justify-center shrink-0">
            <Headset className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Need payment or funding assistance?</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              If your bank debited your account but your wallet is taking time to credit, message our priority support channel.
            </p>
          </div>
        </div>
        <a 
          href={`https://wa.me/${supportNumber.replace(/\+/g, '')}?text=Hello LoraBiz Support, I have an inquiry regarding wallet funding.`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#25D366]/20 cursor-pointer shrink-0"
        >
          <WhatsappLogo className="h-5 w-5" weight="fill" />
          <span>Contact WhatsApp Support</span>
        </a>
      </div>

      {/* FUNDING HISTORY SECTION */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            Funding History
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {filteredHistory.length} successful deposits
          </span>
        </div>

        {/* FILTER TOOLBAR */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 shadow-sm">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 block ml-1">Search Reference</label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" weight="bold" />
              <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction reference..." 
                className="pl-10 h-11 bg-background border-border rounded-xl font-medium focus:ring-primary/50 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Date Range Selectors */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 sm:gap-4">
            <div className="w-full sm:w-auto flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 block ml-1">Start Date</label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 bg-background border-border rounded-xl font-medium w-full sm:w-[150px] focus:ring-primary/50 text-xs"
              />
            </div>
            
            <span className="hidden sm:flex text-muted-foreground font-bold h-11 items-center">-</span>
            
            <div className="w-full sm:w-auto flex flex-col">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1 block ml-1">End Date</label>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 bg-background border-border rounded-xl font-medium w-full sm:w-[150px] focus:ring-primary/50 text-xs"
              />
            </div>
          </div>
        </div>

        {/* DATA CONTAINER */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">
              <Spinner className="animate-spin h-8 w-8 text-primary mx-auto mb-3" weight="bold" />
              <p className="text-xs font-bold">Loading your funding records...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" weight="duotone" />
              <p className="font-bold text-base text-foreground">No funding records found</p>
              <p className="text-xs mt-1">Make a deposit to see your transaction history.</p>
            </div>
          ) : (
            <>
              {/* MOBILE VIEW */}
              <div className="block md:hidden divide-y divide-border">
                {currentData.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500">
                          <ArrowDownLeft weight="bold" className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-xs">Wallet Funding</p>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <span className="font-black text-xs text-emerald-600 dark:text-emerald-400">
                        +₦{Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pl-11">
                      <span className="text-[10px] font-bold text-muted-foreground font-mono bg-secondary px-2 py-1 rounded-lg border border-border truncate max-w-[140px]">
                        {tx.reference}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle weight="fill" className="h-3 w-3" />
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-secondary/40 text-muted-foreground border-b border-border text-[11px] font-black uppercase tracking-wider">
                      <th className="px-6 py-4">Date & Time</th>
                      <th className="px-6 py-4">Amount Funded</th>
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {currentData.map((tx) => (
                      <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">{new Date(tx.createdAt).toLocaleDateString()}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            +₦{Number(tx.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary px-2.5 py-1 rounded-lg border border-border">
                            {tx.reference}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
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
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-border bg-secondary/10 gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Showing <span className="font-bold text-foreground">{startIndex + 1}</span> to <span className="font-bold text-foreground">{Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)}</span> of <span className="font-bold text-foreground">{filteredHistory.length}</span> entries
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-xl font-bold text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <CaretLeft weight="bold" className="h-3.5 w-3.5" /> Prev
                    </button>
                    
                    <div className="hidden sm:flex items-center justify-center min-w-[36px] font-black">
                      {currentPage} / {totalPages}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1.5 bg-background border border-border rounded-xl font-bold text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next <CaretRight weight="bold" className="h-3.5 w-3.5" />
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
        onFailure={(msg) => {
          setAlertInfo({
            type: "warning",
            title: "Funding Notice",
            message: msg
          });
        }}
      />

    </div>
  );
}
