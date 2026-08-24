"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, Wallet, ClockCounterClockwise, CheckCircle, 
  Spinner, Gear, Bank, X, Check, XCircle, Copy, MagnifyingGlass,
  ArrowRight, ShieldCheck, UserCheck, CurrencyNgn
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"PAYOUTS" | "ENROLLED" | "REFERRERS" | "PAIRS" | "SETTINGS">("PAYOUTS");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Updated Ledger Settings State
  const [settingsForm, setSettingsForm] = useState({ 
    REFERRAL_ACTIVE: true,
    REFERRAL_DISCOUNT_PCT: 5,
    REFERRAL_MIN_WITHDRAWAL: 2000,
    REF_REWARD_CAC_BIZ: 1000,
    REF_REWARD_CAC_LLC: 1500,
    REF_REWARD_SCUML: 500,
    REF_REWARD_TAX_ID: 200,
    REF_REWARD_NIN: 50,
    REF_REWARD_NIN_VAL: 250,
    REF_REWARD_NIN_MOD: 250,
    REF_REWARD_NIN_PERSONALIZATION: 250,
    REF_REWARD_NIN_IPE: 250,
    REF_REWARD_BVN_SLIP: 50,
    REF_REWARD_BVN_RETRIEVAL: 250,
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/mds/referrals");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setSettingsForm(json.settings);
      }
    } catch (e) {
      showToast("Failed to load partner program data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (actionType: string, payload: any) => {
    setActionLoading(payload.withdrawalId || "settings");
    try {
      let finalPayload = { actionType, ...payload };
      if (actionType === "UPDATE_SETTINGS") {
        finalPayload = {
          actionType,
          settings: {
            ...payload,
            REFERRAL_ACTIVE: payload.REFERRAL_ACTIVE ? 'true' : 'false'
          }
        };
      }

      const res = await fetch("/api/mds/referrals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalPayload)
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message || "Action successful", "success");
        await fetchData(); 
      } else {
        showToast(result.error || "Action failed.", "error");
      }
    } catch (e) {
      showToast("Network error.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredEnrolled = useMemo(() => {
    if (!data?.enrolledUsers) return [];
    if (!searchQuery.trim()) return data.enrolledUsers;
    const q = searchQuery.toLowerCase().trim();
    return data.enrolledUsers.filter((u: any) => 
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.referralCode?.toLowerCase().includes(q) ||
      u.bankDetails?.bankName?.toLowerCase().includes(q) ||
      u.bankDetails?.accountNo?.includes(q)
    );
  }, [data?.enrolledUsers, searchQuery]);

  const filteredReferrers = useMemo(() => {
    if (!data?.topReferrers) return [];
    if (!searchQuery.trim()) return data.topReferrers;
    const q = searchQuery.toLowerCase().trim();
    return data.topReferrers.filter((u: any) => 
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.code?.toLowerCase().includes(q)
    );
  }, [data?.topReferrers, searchQuery]);

  const filteredPairs = useMemo(() => {
    if (!data?.referralPairs) return [];
    if (!searchQuery.trim()) return data.referralPairs;
    const q = searchQuery.toLowerCase().trim();
    return data.referralPairs.filter((p: any) => 
      p.referrerName?.toLowerCase().includes(q) ||
      p.referrerEmail?.toLowerCase().includes(q) ||
      p.referrerCode?.toLowerCase().includes(q) ||
      p.refereeName?.toLowerCase().includes(q) ||
      p.refereeEmail?.toLowerCase().includes(q)
    );
  }, [data?.referralPairs, searchQuery]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 animate-spin text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {toast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-3 p-4 pr-12 rounded-xl shadow-2xl border ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
              : "bg-red-50 text-red-800 border-red-200"
          }`}>
            {toast.type === "success" ? <CheckCircle className="h-6 w-6" weight="fill" /> : <XCircle className="h-6 w-6" weight="fill" />}
            <p className="text-sm font-medium">{toast.message}</p>
            <button onClick={() => setToast(null)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" weight="bold" />
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Partner Program (Referrals)</h1>
        <p className="text-muted-foreground mt-1">Manage partner enrollments, track referral connections, review payout requests, and adjust commission rates.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><UserCheck className="h-5 w-5 text-[#ff3f7a]" /> <span className="font-medium text-sm">Enrolled Partners</span></div>
          <p className="text-3xl font-bold text-foreground">{data?.stats?.totalEnrolled || 0}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><Users className="h-5 w-5 text-blue-500" /> <span className="font-medium text-sm">Total Referees Linked</span></div>
          <p className="text-3xl font-bold text-foreground">{data?.stats?.totalInvited || 0}</p>
        </div>
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><ClockCounterClockwise className="h-5 w-5 text-amber-500" /> <span className="font-medium text-sm">Pending Payouts</span></div>
          <p className="text-3xl font-bold text-foreground">₦{(data?.stats?.totalPending || 0).toLocaleString()}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2"><CheckCircle className="h-5 w-5" /> <span className="font-semibold text-sm">Total Paid Out</span></div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₦{(data?.stats?.totalPaid || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar & Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-2">
        <div className="flex overflow-x-auto custom-scrollbar">
          <button onClick={() => setActiveTab("PAYOUTS")} className={`px-4 py-3 whitespace-nowrap text-sm font-semibold transition-colors ${activeTab === "PAYOUTS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Pending Payouts ({data?.pendingWithdrawals?.length || 0})</button>
          <button onClick={() => setActiveTab("ENROLLED")} className={`px-4 py-3 whitespace-nowrap text-sm font-semibold transition-colors ${activeTab === "ENROLLED" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Enrolled Partners ({data?.enrolledUsers?.length || 0})</button>
          <button onClick={() => setActiveTab("PAIRS")} className={`px-4 py-3 whitespace-nowrap text-sm font-semibold transition-colors ${activeTab === "PAIRS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Referral Connections ({data?.referralPairs?.length || 0})</button>
          <button onClick={() => setActiveTab("REFERRERS")} className={`px-4 py-3 whitespace-nowrap text-sm font-semibold transition-colors ${activeTab === "REFERRERS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Top Referrers</button>
          <button onClick={() => setActiveTab("SETTINGS")} className={`px-4 py-3 whitespace-nowrap text-sm font-semibold transition-colors ${activeTab === "SETTINGS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Settings</button>
        </div>

        {activeTab !== "SETTINGS" && (
          <div className="relative min-w-[240px]">
            <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search partner, code, referee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm bg-secondary/40 border-border"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* PAYOUTS TAB */}
      {activeTab === "PAYOUTS" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Partner</th>
                  <th className="px-6 py-4">Bank Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Requested Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.pendingWithdrawals?.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No pending payout requests.</td></tr>
                ) : (
                  data?.pendingWithdrawals?.map((w: any) => (
                    <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{w.user.firstName} {w.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{w.user.email}</p>
                        <p className="text-xs text-muted-foreground">{w.user.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{w.bankName}</p>
                        <div className="flex items-center gap-1 font-mono text-muted-foreground text-xs mt-0.5">
                          <span>{w.accountNo}</span>
                          <button onClick={() => copyToClipboard(w.accountNo, w.id + "-acc")} className="hover:text-foreground">
                            {copiedCode === w.id + "-acc" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <p className="text-xs uppercase text-muted-foreground font-semibold mt-0.5">{w.accountName}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-lg text-emerald-600">
                        ₦{Number(w.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                        {new Date(w.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            onClick={() => handleAction("REJECT_PAYOUT", { withdrawalId: w.id })}
                            disabled={actionLoading === w.id}
                            variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/10 cursor-pointer"
                          >
                            <X className="h-4 w-4 mr-1" weight="bold" />
                            Reject
                          </Button>
                          <Button 
                            onClick={() => {
                              if(confirm(`Have you actually transferred ₦${Number(w.amount).toLocaleString()} to ${w.accountName} (${w.bankName} - ${w.accountNo})?`)) {
                                handleAction("APPROVE_PAYOUT", { withdrawalId: w.id });
                              }
                            }}
                            disabled={actionLoading === w.id}
                            size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                          >
                            {actionLoading === w.id ? <Spinner className="animate-spin h-4 w-4" /> : <Check className="h-4 w-4 mr-1" weight="bold" />}
                            Mark Paid
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENROLLED PARTNERS TAB */}
      {activeTab === "ENROLLED" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Partner Details</th>
                  <th className="px-6 py-4">Referral Code</th>
                  <th className="px-6 py-4">Bank Payout Info</th>
                  <th className="px-6 py-4 text-center">Referees</th>
                  <th className="px-6 py-4 text-center">Total Earned</th>
                  <th className="px-6 py-4 text-right">Unpaid Balance</th>
                  <th className="px-6 py-4 text-right">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEnrolled.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No enrolled partners match your filter.</td></tr>
                ) : (
                  filteredEnrolled.map((user: any) => (
                    <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary/80 border border-border font-mono text-xs font-bold text-foreground">
                          <span>{user.referralCode || "N/A"}</span>
                          {user.referralCode && (
                            <button onClick={() => copyToClipboard(user.referralCode, user.id + "-ref")} className="text-muted-foreground hover:text-foreground cursor-pointer">
                              {copiedCode === user.id + "-ref" ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {user.bankDetails ? (
                          <div>
                            <p className="font-bold text-foreground">{user.bankDetails.bankName}</p>
                            <p className="font-mono text-muted-foreground">{user.bankDetails.accountNo}</p>
                            <p className="text-[11px] text-muted-foreground uppercase">{user.bankDetails.accountName}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">No bank setup yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">
                        {user.totalReferred}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        ₦{Number(user.totalEarned).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-foreground">
                        ₦{Number(user.referralBalance).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap text-right">
                        {new Date(user.joinedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REFERRAL CONNECTIONS (PAIRS) TAB */}
      {activeTab === "PAIRS" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Referrer (Partner)</th>
                  <th className="px-6 py-4">Referral Code Used</th>
                  <th className="px-6 py-4">Referee (Invited User)</th>
                  <th className="px-6 py-4 text-center">Commissions Earned</th>
                  <th className="px-6 py-4 text-right">Date Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPairs.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No referral links found.</td></tr>
                ) : (
                  filteredPairs.map((pair: any) => (
                    <tr key={pair.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{pair.referrerName}</p>
                        <p className="text-xs text-muted-foreground">{pair.referrerEmail}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-xs text-muted-foreground">
                        {pair.referrerCode}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{pair.refereeName}</p>
                        <p className="text-xs text-muted-foreground">{pair.refereeEmail}</p>
                        <p className="text-xs text-muted-foreground">{pair.refereePhone}</p>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        ₦{Number(pair.commissionsEarned).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap text-right">
                        {new Date(pair.joinedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TOP REFERRERS TAB */}
      {activeTab === "REFERRERS" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Partner</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-center">Total Signups</th>
                  <th className="px-6 py-4 text-center">Total Earned All-Time</th>
                  <th className="px-6 py-4 text-right">Current Unpaid Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReferrers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No referral data yet.</td></tr>
                ) : (
                  filteredReferrers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-muted-foreground text-xs">{user.code || "N/A"}</td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">{user.totalReferred}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">₦{Number(user.totalEarned).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-foreground">
                        ₦{Number(user.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "SETTINGS" && (
        <div className="max-w-4xl bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          
          <div className="p-6 border-b border-border flex justify-between items-center bg-secondary/20">
            <div>
              <h2 className="text-lg font-black text-foreground flex items-center gap-2"><Gear className="text-[#ff3f7a]" size={20} /> Master Kill Switch</h2>
              <p className="text-sm text-muted-foreground mt-1">Turn off the entire referral program instantly.</p>
            </div>
            <button 
              onClick={() => setSettingsForm({ ...settingsForm, REFERRAL_ACTIVE: !settingsForm.REFERRAL_ACTIVE })}
              className={`shrink-0 relative inline-flex h-8 w-14 items-center rounded-full transition-colors cursor-pointer ${
                settingsForm.REFERRAL_ACTIVE ? 'bg-[#ff3f7a]' : 'bg-muted-foreground/30'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settingsForm.REFERRAL_ACTIVE ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAction("UPDATE_SETTINGS", settingsForm);
            }}
          >
            <div className="p-6 space-y-8">
              {/* Global Rules */}
              <div>
                <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Global Rules</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Referee Welcome Discount (%)</Label>
                    <Input 
                      type="number" 
                      value={settingsForm.REFERRAL_DISCOUNT_PCT}
                      onChange={e => setSettingsForm({...settingsForm, REFERRAL_DISCOUNT_PCT: Number(e.target.value)})}
                      className="bg-background"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Min. Withdrawal Limit (₦)</Label>
                    <Input 
                      type="number" 
                      value={settingsForm.REFERRAL_MIN_WITHDRAWAL}
                      onChange={e => setSettingsForm({...settingsForm, REFERRAL_MIN_WITHDRAWAL: Number(e.target.value)})}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Commission Rates: CAC & Compliance */}
              <div>
                <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">CAC &amp; Compliance Commissions (₦)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">CAC Business Name</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_CAC_BIZ} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_CAC_BIZ: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">CAC LLC</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_CAC_LLC} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_CAC_LLC: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">SCUML Certificate</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_SCUML} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_SCUML: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">Tax ID (TIN)</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_TAX_ID} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_TAX_ID: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Commission Rates: NIMC Identity Services */}
              <div>
                <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">NIMC Identity Services Commissions (₦)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">NIN Verification Slips</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_NIN} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_NIN: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">NIN Validation (No Record / VNIN)</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_NIN_VAL} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_NIN_VAL: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">NIN Modification (Name / Phone / etc.)</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_NIN_MOD} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_NIN_MOD: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">NIN Personalization (Tracking ID)</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_NIN_PERSONALIZATION} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_NIN_PERSONALIZATION: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">NIN IPE Clearance</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_NIN_IPE} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_NIN_IPE: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Commission Rates: BVN Banking Services */}
              <div>
                <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">BVN Banking Services Commissions (₦)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">BVN Verification Slips</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_BVN_SLIP} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_BVN_SLIP: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground mb-1.5 block">BVN Number Retrieval</Label>
                    <Input type="number" value={settingsForm.REF_REWARD_BVN_RETRIEVAL} onChange={e => setSettingsForm({...settingsForm, REF_REWARD_BVN_RETRIEVAL: Number(e.target.value)})} className="bg-background font-bold text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border bg-secondary/20 flex justify-end">
              <Button 
                type="submit" 
                disabled={actionLoading === "settings"}
                className="bg-[#ff3f7a] hover:bg-[#e02b62] text-white font-bold cursor-pointer"
              >
                {actionLoading === "settings" ? <Spinner className="animate-spin mr-2 h-4 w-4" /> : null} 
                Save Partner Program Settings
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
