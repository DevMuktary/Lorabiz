"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users, Wallet, ClockCounterClockwise, CheckCircle, 
  Copy, Bank, ShieldCheck, Spinner, Info, Money, Check, PencilSimple
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ReferralsPage() {
  const { data: session } = useSession();
  
  const [loadingInit, setLoadingInit] = useState(true);
  const [stats, setStats] = useState<any>(null);
  
  // Bank Setup State
  const [banks, setBanks] = useState<any[]>([]);
  const [setupData, setSetupData] = useState({ bankCode: "", accountNumber: "", acceptTerms: false });
  const [settingUp, setSettingUp] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupSuccess, setSetupSuccess] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);

  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSuccess, setWithdrawSuccess] = useState("");

  // Copy State
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchBanks();
    fetchStats();
  }, []);

  // Fetch the live list of Nigerian banks directly from Paystack
  const fetchBanks = async () => {
    try {
      const res = await fetch("https://api.paystack.co/bank?country=nigeria");
      const data = await res.json();
      if (data.status) {
        // Sort banks alphabetically for better UX
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
          setSetupData(prev => ({ ...prev, acceptTerms: true })); // Pre-check if already enrolled
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
    setSetupError("");
    setSetupSuccess("");
    
    if (!setupData.bankCode || !setupData.accountNumber || !setupData.acceptTerms) {
      setSetupError("Please fill all fields and accept the terms.");
      return;
    }
    
    setSettingUp(true);
    const selectedBank = banks.find(b => b.code === setupData.bankCode);
    
    try {
      const res = await fetch("/api/user/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCode: setupData.bankCode,
          bankName: selectedBank?.name,
          accountNumber: setupData.accountNumber,
          acceptTerms: setupData.acceptTerms
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setSetupSuccess(data.message);
        setIsEditingBank(false);
        await fetchStats(); 
      } else {
        setSetupError(data.message);
      }
    } catch (e) {
      setSetupError("Network error. Please try again.");
    } finally {
      setSettingUp(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");
    
    const amountNum = Number(withdrawAmount);
    if (isNaN(amountNum) || amountNum < 2000) {
      setWithdrawError("Minimum withdrawal amount is ₦2,000.");
      return;
    }
    
    if (amountNum > stats.referralBalance) {
      setWithdrawError("You do not have enough funds in your referral balance.");
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
        setWithdrawSuccess(data.message);
        setWithdrawAmount("");
        await fetchStats();
      } else {
        setWithdrawError(data.message);
      }
    } catch (e) {
      setWithdrawError("Network error. Please check your connection.");
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

  if (loadingInit) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 animate-spin text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  const needsSetup = !stats?.bankDetails || isEditingBank;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Partner Program</h1>
        <p className="text-muted-foreground mt-1">Earn real cash by inviting businesses to LoraBiz.</p>
      </div>

      {needsSetup ? (
        <div className="max-w-2xl bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center shrink-0">
              <Money className="h-6 w-6" weight="fill" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {isEditingBank ? "Update Payout Bank" : "Activate Your Partner Link"}
              </h2>
              <p className="text-muted-foreground text-sm">
                Where should we send your cash rewards?
              </p>
            </div>
          </div>
          
          <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 p-4 rounded-xl mb-8 text-sm flex gap-3 leading-relaxed">
            <Info className="h-5 w-5 shrink-0 mt-0.5" weight="fill" />
            <p><strong>Strict Verification:</strong> The bank account name must strictly match the name you registered with on LoraBiz. We use Paystack to verify this instantly to prevent fraud.</p>
          </div>

          <form onSubmit={handleSetupBank} className="space-y-6">
            {setupError && (
              <div className="p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-lg border border-destructive/20 flex items-center gap-2">
                <Info weight="bold" className="h-5 w-5 shrink-0" />
                <span>{setupError}</span>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="bankCode">Select Bank</Label>
              <div className="relative">
                <Bank className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                <select 
                  id="bankCode" 
                  value={setupData.bankCode} 
                  onChange={(e) => setSetupData({...setupData, bankCode: e.target.value})} 
                  required 
                  className="flex h-12 w-full rounded-md border border-border bg-secondary/40 pl-11 pr-3 text-[16px] text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff3f7a] dark:bg-[#121212]"
                >
                  <option value="" disabled>Select your bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>{bank.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number (NUBAN)</Label>
              <Input 
                id="accountNumber" 
                type="text" 
                maxLength={10} 
                value={setupData.accountNumber} 
                onChange={(e) => setSetupData({...setupData, accountNumber: e.target.value.replace(/\D/g, "")})} 
                required 
                placeholder="0000000000" 
                className="h-12 text-[16px] bg-secondary/40 border-border text-foreground focus-visible:ring-[#ff3f7a]" 
              />
            </div>

            {!stats?.bankDetails && (
              <label className="flex items-start gap-3 p-4 border border-border bg-secondary/30 rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors select-none">
                <input 
                  type="checkbox" 
                  checked={setupData.acceptTerms} 
                  onChange={(e) => setSetupData({...setupData, acceptTerms: e.target.checked})} 
                  className="mt-0.5 h-5 w-5 accent-[#ff3f7a] rounded border-border cursor-pointer shrink-0" 
                />
                <span className="text-sm text-muted-foreground leading-relaxed">
                  I agree to the LoraBiz Partner Program Terms. I understand that rewards are only earned when my referrals complete successful paid services.
                </span>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              {isEditingBank && (
                <Button type="button" variant="outline" onClick={() => setIsEditingBank(false)} className="h-12 px-6 border-border">Cancel</Button>
              )}
              <Button type="submit" disabled={settingUp || !setupData.bankCode || setupData.accountNumber.length !== 10 || !setupData.acceptTerms} className="flex-1 h-12 font-semibold bg-[#ff3f7a] hover:bg-[#e02b62] text-white">
                {settingUp ? <Spinner className="animate-spin h-5 w-5" /> : "Verify & Save Details"}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* Dashboard View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><Users className="h-5 w-5" /> <span className="font-medium text-sm">Total Signups</span></div>
              <p className="text-3xl font-bold text-foreground">{stats?.totalSignups || 0}</p>
            </div>
            
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><ClockCounterClockwise className="h-5 w-5" /> <span className="font-medium text-sm">Pending Activity</span></div>
              <p className="text-3xl font-bold text-foreground">{stats?.pendingReferrals || 0}</p>
            </div>

            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><CheckCircle className="h-5 w-5" /> <span className="font-medium text-sm">Earned Referrals</span></div>
              <p className="text-3xl font-bold text-foreground">{stats?.earnedReferrals || 0}</p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="h-24 w-24 text-emerald-500" weight="fill" /></div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2 relative z-10"><Wallet className="h-5 w-5" /> <span className="font-semibold text-sm">Available Balance</span></div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10">₦{(stats?.referralBalance || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Share Link Card */}
            <div className="bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2"><Users className="h-5 w-5 text-[#ff3f7a]" weight="fill" /> Your Referral Link</h3>
                <p className="text-sm text-muted-foreground mb-6">Share this link. When businesses sign up and spend money on compliance services, you get paid.</p>
                
                <div className="flex items-center gap-2 p-1.5 bg-secondary/50 border border-border rounded-lg mb-4">
                  <div className="flex-1 truncate px-3 text-sm font-mono text-foreground font-medium select-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/auth/register?ref=${stats?.referralCode}` : `.../auth/register?ref=${stats?.referralCode}`}
                  </div>
                  <Button onClick={copyToClipboard} variant={copied ? "default" : "secondary"} className={`shrink-0 h-10 px-4 transition-all ${copied ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}`}>
                    {copied ? <Check className="h-4 w-4 mr-2" weight="bold" /> : <Copy className="h-4 w-4 mr-2" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
                
                <div className="text-sm border-t border-border pt-4 mt-6">
                  <p className="text-muted-foreground flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[#ff3f7a]"></span> Your Manual Code: <strong className="text-foreground">{stats?.referralCode}</strong></p>
                </div>
              </div>
            </div>

            {/* Withdrawal Card */}
            <div className="bg-card border border-border p-6 md:p-8 rounded-2xl shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-1"><Bank className="h-5 w-5 text-blue-500" weight="fill" /> Payout Settings</h3>
                  <p className="text-sm text-muted-foreground">Withdraw your earnings directly to your bank.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditingBank(true)} className="text-xs h-8 text-muted-foreground hover:text-foreground">
                  <PencilSimple className="h-3.5 w-3.5 mr-1" /> Edit Bank
                </Button>
              </div>

              <div className="bg-secondary/40 border border-border p-4 rounded-xl mb-6">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Verified Destination</p>
                <p className="font-bold text-foreground">{stats?.bankDetails?.bankName}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{stats?.bankDetails?.accountNo} • {stats?.bankDetails?.accountName}</p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-4">
                {withdrawError && <div className="p-3 bg-destructive/10 text-destructive text-sm font-medium rounded-lg text-center">{withdrawError}</div>}
                {withdrawSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium rounded-lg text-center flex justify-center items-center gap-2"><CheckCircle weight="fill" className="h-5 w-5" /> {withdrawSuccess}</div>}
                
                <div className="relative">
                  <span className="absolute left-4 top-3.5 font-bold text-muted-foreground">₦</span>
                  <Input 
                    type="text" 
                    value={withdrawAmount} 
                    onChange={(e) => setWithdrawAmount(e.target.value.replace(/\D/g, ""))} 
                    placeholder="Amount to withdraw" 
                    className="pl-9 h-12 font-bold text-lg bg-background border-border"
                  />
                </div>
                
                <Button type="submit" disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) < 2000} className="w-full h-12 font-semibold bg-foreground text-background hover:bg-foreground/90">
                  {withdrawing ? <Spinner className="animate-spin h-5 w-5" /> : "Request Cashout"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">Minimum withdrawal: ₦2,000</p>
              </form>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
