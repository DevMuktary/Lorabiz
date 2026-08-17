"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Users, Wallet, CheckCircle, 
  Copy, Bank, Spinner, Info, Money, Check, PencilSimple, 
  ArrowLeft, CaretDown, MagnifyingGlass, X, Coins, EnvelopeSimple, ChartLineUp,
  Gift, ShieldWarning // <-- Added new icons for the onboarding view
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReferralsPage() {
  const { data: session } = useSession();
  
  const [loadingInit, setLoadingInit] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"rates" | "referees" | "history">("rates");
  
  // Bank Setup State
  const [banks, setBanks] = useState<any[]>([]);
  const [setupData, setSetupData] = useState({ bankCode: "", bankName: "", accountNumber: "", acceptTerms: false });
  const [settingUp, setSettingUp] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Searchable Dropdown State
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Copy State
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    fetchBanks();
    fetchStats();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBankDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch("https://api.paystack.co/bank?country=nigeria");
      const data = await res.json();
      if (data.status) {
        const sortedBanks = data.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
        setBanks(sortedBanks);
      }
    } catch (error) {
      console.error("Failed to fetch banks from Paystack");
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/referral");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        if (json.data.bankDetails) {
          setSetupData(prev => ({ ...prev, acceptTerms: true })); 
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInit(false);
    }
  };

  const handleSetupBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData.bankCode || !setupData.accountNumber || !setupData.acceptTerms) {
      showToast("Please fill all fields and accept the terms.", "error");
      return;
    }
    setSettingUp(true);
    try {
      const res = await fetch("/api/user/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupData)
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setIsEditingBank(false);
        await fetchStats(); 
      } else {
        showToast(data.message, "error");
      }
    } catch (e) {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSettingUp(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(withdrawAmount);
    const minLimit = stats?.minWithdrawal || 2000;
    if (isNaN(amountNum) || amountNum < minLimit) {
      showToast(`Minimum withdrawal amount is ₦${minLimit.toLocaleString()}.`, "error");
      return;
    }
    if (amountNum > stats.referralBalance) {
      showToast("You do not have enough funds in your referral balance.", "error");
      return;
    }
    setWithdrawing(true);
    try {
      const res = await fetch("/api/user/referral/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNum })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setWithdrawAmount("");
        await fetchStats();
      } else {
        showToast(data.message, "error");
      }
    } catch (e) {
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setWithdrawing(false);
    }
  };

  const copyToClipboard = () => {
    if (!stats?.referralCode) return;
    const url = `${window.location.origin}/auth/register?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredBanks = banks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  if (loadingInit) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 animate-spin text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  const needsSetup = !stats?.bankDetails || isEditingBank;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      {toast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-3 p-4 pr-12 rounded-xl shadow-2xl border ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.type === "success" ? <CheckCircle className="h-6 w-6 shrink-0" weight="fill" /> : <Info className="h-6 w-6 shrink-0" weight="fill" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </div>
      )}

      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Partner Program</h1>
        <p className="text-muted-foreground mt-1">Invite businesses and earn cash directly to your bank account.</p>
      </div>

      {needsSetup ? (
        <div className="space-y-8">
          
          {/* NEW: Onboarding Benefits & Rules (Hidden if just editing an existing bank) */}
          {!isEditingBank && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* The Benefits */}
              <div className="bg-[#ff3f7a]/5 border border-[#ff3f7a]/20 p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-full flex items-center justify-center shrink-0">
                    <Gift className="h-5 w-5" weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Why Join the Program?</h2>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#ff3f7a] shrink-0 mt-0.5" weight="fill" />
                    <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Earn Unlimited Cash:</strong> Get fixed cash rewards directly added to your balance every time a business you invite successfully completes a compliance service.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#ff3f7a] shrink-0 mt-0.5" weight="fill" />
                    <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Help Your Network:</strong> Anyone who registers using your unique partner link instantly receives a 5% discount on their first major service.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#ff3f7a] shrink-0 mt-0.5" weight="fill" />
                    <p className="text-sm text-muted-foreground leading-relaxed"><strong className="text-foreground">Direct Withdrawals:</strong> Request cash payouts directly to your verified local Nigerian bank account once you hit the minimum balance.</p>
                  </li>
                </ul>
              </div>

              {/* The Rules */}
              <div className="bg-secondary/20 border border-border p-6 sm:p-8 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center shrink-0">
                    <ShieldWarning className="h-5 w-5" weight="fill" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Program Rules & Terms</h2>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed">Commissions are ONLY credited when the referred user's service application is fully processed and <strong className="text-foreground">approved</strong> by the LoraBiz team.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed">Self-referrals or creating fake accounts to manipulate the discount system is strictly prohibited.</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                    <p className="text-sm text-muted-foreground leading-relaxed">LoraBiz reserves the right to suspend accounts, withhold payouts, or permanently disable the program at any time if fraud, abuse, or violation of terms is suspected.</p>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Existing Bank Setup Form */}
          <div className="max-w-2xl bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
                <Money className="h-6 w-6" weight="fill" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {isEditingBank ? "Update Payout Bank" : "Activate Your Partner Link"}
                </h2>
                <p className="text-muted-foreground text-sm">Where should we send your cash rewards?</p>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-8 text-sm flex gap-3 leading-relaxed">
              <Info className="h-5 w-5 shrink-0 mt-0.5" weight="fill" />
              <p><strong>Notice:</strong> The bank account name must match with the name you registered with on LoraBiz.</p>
            </div>

            <form onSubmit={handleSetupBank} className="space-y-6">
              <div className="space-y-2 relative" ref={dropdownRef}>
                <Label htmlFor="bankSearch">Select Bank</Label>
                <div 
                  className="relative flex items-center h-12 w-full rounded-md border border-border bg-secondary/40 px-3 cursor-pointer text-[16px] text-foreground hover:border-[#ff3f7a]/50 transition-colors"
                  onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                >
                  <Bank className="h-5 w-5 text-muted-foreground mr-2 shrink-0" />
                  <span className={`flex-1 truncate ${!setupData.bankName && "text-muted-foreground"}`}>{setupData.bankName || "Select your bank"}</span>
                  <CaretDown className={`h-4 w-4 text-muted-foreground transition-transform ${isBankDropdownOpen ? "rotate-180" : ""}`} />
                </div>
                {isBankDropdownOpen && (
                  <div className="absolute top-[76px] left-0 w-full z-50 bg-popover border border-border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 border-b border-border bg-muted/30">
                      <div className="relative">
                        <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input autoFocus placeholder="Search for a bank..." value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} className="h-9 pl-9 bg-background border-border text-sm" />
                      </div>
                    </div>
                    <ul className="max-h-[250px] overflow-y-auto p-1">
                      {filteredBanks.length === 0 ? (
                        <li className="p-3 text-sm text-center text-muted-foreground">No banks found</li>
                      ) : (
                        filteredBanks.map((bank) => (
                          <li 
                            key={bank.code} 
                            className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg cursor-pointer transition-colors flex items-center justify-between"
                            onClick={() => {
                              setSetupData(prev => ({ ...prev, bankCode: bank.code, bankName: bank.name }));
                              setIsBankDropdownOpen(false);
                              setBankSearch("");
                            }}
                          >
                            <span className="font-medium text-foreground">{bank.name}</span>
                            {setupData.bankCode === bank.code && <Check className="h-4 w-4 text-[#ff3f7a]" weight="bold" />}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number (NUBAN)</Label>
                <Input id="accountNumber" type="text" maxLength={10} value={setupData.accountNumber} onChange={(e) => setSetupData({...setupData, accountNumber: e.target.value.replace(/\D/g, "")})} required placeholder="0000000000" className="h-12 bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a]" />
              </div>

              {!stats?.bankDetails && (
                <label className="flex items-start gap-3 p-4 border border-border bg-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors select-none">
                  <input type="checkbox" checked={setupData.acceptTerms} onChange={(e) => setSetupData({...setupData, acceptTerms: e.target.checked})} className="mt-0.5 h-5 w-5 accent-[#ff3f7a] rounded border-border cursor-pointer shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">I have read and agree to the LoraBiz Partner Program Rules & Terms outlined above.</span>
                </label>
              )}

              <div className="flex gap-3 pt-2">
                {isEditingBank && <Button type="button" variant="outline" onClick={() => setIsEditingBank(false)} className="h-12 px-6 border-border">Cancel</Button>}
                <Button type="submit" disabled={settingUp || !setupData.bankCode || setupData.accountNumber.length !== 10 || !setupData.acceptTerms} className="flex-1 h-12 font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white">
                  {settingUp ? <Spinner className="animate-spin h-5 w-5" /> : "Verify & Save Details"}
                </Button>
              </div>
            </form>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><Users className="h-5 w-5" /> <span className="font-medium text-sm">Total Invited</span></div>
              <p className="text-3xl font-bold text-foreground">{stats?.totalSignups || 0}</p>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><ChartLineUp className="h-5 w-5" /> <span className="font-medium text-sm">Total Earned All-Time</span></div>
              <p className="text-3xl font-bold text-foreground">₦{(stats?.totalEarnedAllTime || 0).toLocaleString()}</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="h-24 w-24 text-emerald-500" weight="fill" /></div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2 relative z-10"><Wallet className="h-5 w-5" /> <span className="font-semibold text-sm">Available Balance</span></div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">₦{(stats?.referralBalance || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Share & Cashout Column */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Share Link Card */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-[#ff3f7a]" weight="fill" /> Your Partner Link</h3>
                <p className="text-sm text-muted-foreground mb-4">Share this link. You earn cash every time they complete a paid service.</p>
                
                <div className="flex flex-col gap-2 p-1.5 bg-secondary/50 border border-border rounded-lg mb-4">
                  <div className="truncate px-3 pt-2 text-sm font-mono text-foreground font-medium select-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/auth/register?ref=${stats?.referralCode}` : `.../?ref=${stats?.referralCode}`}
                  </div>
                  <Button onClick={copyToClipboard} variant={copied ? "default" : "secondary"} className={`w-full transition-all ${copied ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}>
                    {copied ? <Check className="h-4 w-4 mr-2" weight="bold" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>
              </div>

              {/* Withdrawal Card */}
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Bank className="h-5 w-5 text-blue-500" weight="fill" /> Payout</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingBank(true)} className="text-xs h-8 text-muted-foreground px-2">
                    <PencilSimple className="h-3.5 w-3.5 mr-1" /> Edit Bank
                  </Button>
                </div>

                <div className="bg-secondary/40 border border-border p-3 rounded-xl mb-4 text-sm">
                  <p className="font-bold text-foreground">{stats?.bankDetails?.bankName}</p>
                  <p className="text-muted-foreground font-mono mt-0.5">{stats?.bankDetails?.accountNo} • {stats?.bankDetails?.accountName}</p>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div className="relative">
                    <span className="absolute left-4 top-3 font-bold text-muted-foreground">₦</span>
                    <Input 
                      type="text" 
                      value={withdrawAmount} 
                      onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))} 
                      placeholder="Amount" 
                      className="pl-9 h-11 font-bold bg-background border-border"
                    />
                  </div>
                  <Button type="submit" disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < (stats?.minWithdrawal || 2000)} className="w-full h-11 font-semibold bg-foreground text-background hover:bg-foreground/90">
                    {withdrawing ? <Spinner className="animate-spin h-5 w-5" /> : "Request Cashout"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Min withdrawal: ₦{(stats?.minWithdrawal || 2000).toLocaleString()}</p>
                </form>
              </div>
            </div>

            {/* Transparency & History Area */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              
              {/* Tab Navigation */}
              <div className="flex border-b border-border bg-secondary/20 px-4 pt-4 gap-6 overflow-x-auto custom-scrollbar">
                <button 
                  onClick={() => setActiveTab("rates")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "rates" ? "border-[#ff3f7a] text-[#ff3f7a]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  How You Earn
                </button>
                <button 
                  onClick={() => setActiveTab("referees")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "referees" ? "border-[#ff3f7a] text-[#ff3f7a]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  My Referees ({stats?.refereesList?.length || 0})
                </button>
                <button 
                  onClick={() => setActiveTab("history")}
                  className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "history" ? "border-[#ff3f7a] text-[#ff3f7a]" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  Earnings History
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 flex-1 bg-card">
                
                {/* 1. Rates Tab */}
                {activeTab === "rates" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <p className="text-sm text-muted-foreground mb-4">You earn cash directly to your balance every time your invited users complete one of the following services. There is no limit.</p>
                    <div className="rounded-xl border border-border overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/40 text-muted-foreground border-b border-border">
                          <tr>
                            <th className="font-semibold p-3 pl-4">Service Type</th>
                            <th className="font-semibold p-3 pr-4 text-right">Your Reward</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          <tr className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 pl-4 text-foreground font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div>CAC Business Name</td>
                            <td className="p-3 pr-4 font-bold text-emerald-600 text-right">₦{(stats?.rewardRates?.cacBiz || 0).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 pl-4 text-foreground font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div>CAC LLC Registration</td>
                            <td className="p-3 pr-4 font-bold text-emerald-600 text-right">₦{(stats?.rewardRates?.cacLlc || 0).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 pl-4 text-foreground font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div>SCUML Certificate</td>
                            <td className="p-3 pr-4 font-bold text-emerald-600 text-right">₦{(stats?.rewardRates?.scuml || 0).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 pl-4 text-foreground font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Tax ID (TIN)</td>
                            <td className="p-3 pr-4 font-bold text-emerald-600 text-right">₦{(stats?.rewardRates?.taxId || 0).toLocaleString()}</td>
                          </tr>
                          <tr className="hover:bg-secondary/20 transition-colors">
                            <td className="p-3 pl-4 text-foreground font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>NIN Slip Generation</td>
                            <td className="p-3 pr-4 font-bold text-emerald-600 text-right">₦{(stats?.rewardRates?.nin || 0).toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. Referees Tab */}
                {activeTab === "referees" && (
                  <div className="animate-in fade-in duration-300">
                    {stats?.refereesList?.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-foreground font-medium">You haven't invited anyone yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Copy your link and start sharing!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {stats?.refereesList?.map((referee: any) => (
                          <div key={referee.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border bg-secondary/10 rounded-xl gap-4">
                            <div>
                              <p className="font-bold text-foreground text-sm">{referee.name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><EnvelopeSimple /> {referee.email}</p>
                                <span className="w-1 h-1 rounded-full bg-border"></span>
                                <p className="text-xs text-muted-foreground">Joined {format(new Date(referee.joinedAt), "MMM d, yyyy")}</p>
                              </div>
                            </div>
                            <div className="bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 self-start sm:self-auto shadow-sm">
                              Earned: ₦{(referee.totalEarned || 0).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. History Ledger Tab */}
                {activeTab === "history" && (
                  <div className="animate-in fade-in duration-300">
                    {stats?.earningsHistory?.length === 0 ? (
                      <div className="text-center py-12">
                        <Coins className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-foreground font-medium">No earnings yet.</p>
                        <p className="text-sm text-muted-foreground mt-1">Remind your referees to complete their registrations.</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-secondary/40 text-muted-foreground border-b border-border sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                              <th className="font-semibold p-3 pl-4">Service</th>
                              <th className="font-semibold p-3">From</th>
                              <th className="font-semibold p-3">Date</th>
                              <th className="font-semibold p-3 pr-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {stats?.earningsHistory?.map((item: any) => (
                              <tr key={item.id} className="hover:bg-secondary/20 transition-colors">
                                <td className="p-3 pl-4 font-medium text-foreground">
                                  {item.serviceType === "CAC_BIZ" ? "CAC Business" 
                                  : item.serviceType === "CAC_LLC" ? "CAC LLC"
                                  : item.serviceType.replace("_", " ")}
                                </td>
                                <td className="p-3 text-muted-foreground">{item.refereeName}</td>
                                <td className="p-3 text-muted-foreground whitespace-nowrap">{format(new Date(item.date), "MMM d, yyyy")}</td>
                                <td className="p-3 pr-4 font-bold text-emerald-600 text-right">+₦{item.amount.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
