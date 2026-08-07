"use client";

import { useState, useEffect } from "react";
import { 
  Users, Wallet, ClockCounterClockwise, CheckCircle, 
  Spinner, Gear, Bank, X, Check, XCircle
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"PAYOUTS" | "REFERRERS" | "SETTINGS">("PAYOUTS");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Settings state
  const [settingsForm, setSettingsForm] = useState({ rewardAmount: 1000, spendThreshold: 5000 });

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch("/api/mds/referrals");
      const json = await res.json();
      if (json.success) {
        setData(json);
        setSettingsForm({
          rewardAmount: json.settings.rewardAmount,
          spendThreshold: json.settings.spendThreshold
        });
      }
    } catch (e) {
      showToast("Failed to load data.", "error");
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
      const res = await fetch("/api/mds/referrals/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType, ...payload })
      });
      const result = await res.json();

      if (result.success) {
        showToast(result.message, "success");
        await fetchData(); // Refresh data
      } else {
        showToast(result.error || "Action failed.", "error");
      }
    } catch (e) {
      showToast("Network error.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Spinner className="h-8 w-8 animate-spin text-[#ff3f7a]" weight="bold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-24 right-4 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className={`flex items-center gap-3 p-4 pr-12 rounded-xl shadow-2xl border ${
            toast.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" 
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
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
        <p className="text-muted-foreground mt-1">Manage payouts, track top referrers, and configure reward settings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-muted-foreground mb-2"><ClockCounterClockwise className="h-5 w-5" /> <span className="font-medium text-sm">Pending Payouts</span></div>
          <p className="text-3xl font-bold text-foreground">₦{(data?.stats.totalPending || 0).toLocaleString()}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2"><CheckCircle className="h-5 w-5" /> <span className="font-semibold text-sm">Total Paid Out</span></div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₦{(data?.stats.totalPaid || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button onClick={() => setActiveTab("PAYOUTS")} className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "PAYOUTS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Pending Payouts ({data?.pendingWithdrawals.length || 0})</button>
        <button onClick={() => setActiveTab("REFERRERS")} className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "REFERRERS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Top Referrers</button>
        <button onClick={() => setActiveTab("SETTINGS")} className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === "SETTINGS" ? "text-[#ff3f7a] border-b-2 border-[#ff3f7a]" : "text-muted-foreground hover:text-foreground"}`}>Settings</button>
      </div>

      {/* PAYOUTS TAB */}
      {activeTab === "PAYOUTS" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Bank Details</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.pendingWithdrawals.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No pending payout requests.</td></tr>
                ) : (
                  data?.pendingWithdrawals.map((w: any) => (
                    <tr key={w.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{w.user.firstName} {w.user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{w.user.email}</p>
                        <p className="text-xs text-muted-foreground">{w.user.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-foreground">{w.bankName}</p>
                        <p className="font-mono text-muted-foreground">{w.accountNo}</p>
                        <p className="text-xs uppercase text-muted-foreground mt-0.5">{w.accountName}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-lg text-emerald-600 dark:text-emerald-400">
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
                            variant="outline" size="sm" className="border-destructive/20 text-destructive hover:bg-destructive/10"
                          >
                            <X className="h-4 w-4" weight="bold" />
                          </Button>
                          <Button 
                            onClick={() => {
                              if(confirm(`Have you actually transferred ₦${Number(w.amount).toLocaleString()} to ${w.accountName}?`)) {
                                handleAction("APPROVE_PAYOUT", { withdrawalId: w.id });
                              }
                            }}
                            disabled={actionLoading === w.id}
                            size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white"
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

      {/* REFERRERS TAB */}
      {activeTab === "REFERRERS" && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-center">Total Signups</th>
                  <th className="px-6 py-4 text-center">Earned (Passed Threshold)</th>
                  <th className="px-6 py-4 text-right">Current Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.topReferrers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No referral data yet.</td></tr>
                ) : (
                  data?.topReferrers.map((user: any) => (
                    <tr key={user.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-muted-foreground">{user.code || "N/A"}</td>
                      <td className="px-6 py-4 text-center font-bold text-foreground">{user.totalReferred}</td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">{user.earnedCount}</td>
                      <td className="px-6 py-4 text-right font-bold text-lg text-emerald-600 dark:text-emerald-400">
                        ₦{user.balance.toLocaleString()}
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
        <div className="max-w-xl bg-card border border-border rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Gear className="h-5 w-5 text-muted-foreground" /> Global Referral Settings
          </h3>
          <p className="text-sm text-muted-foreground mb-6">These settings apply to all future signups and calculations instantly.</p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleAction("UPDATE_SETTINGS", settingsForm);
            }} 
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label className="font-bold">Referral Reward Amount (₦)</Label>
              <p className="text-xs text-muted-foreground mb-2">How much cash a referrer earns for one successful invite.</p>
              <Input 
                type="number" 
                value={settingsForm.rewardAmount} 
                onChange={e => setSettingsForm({...settingsForm, rewardAmount: Number(e.target.value)})} 
                className="h-12 bg-secondary/40 font-bold"
              />
            </div>
            
            <div className="space-y-2 border-t border-border pt-4">
              <Label className="font-bold">Spend Threshold (₦)</Label>
              <p className="text-xs text-muted-foreground mb-2">How much a referred user must spend on LoraBiz before the referrer actually gets paid the reward.</p>
              <Input 
                type="number" 
                value={settingsForm.spendThreshold} 
                onChange={e => setSettingsForm({...settingsForm, spendThreshold: Number(e.target.value)})} 
                className="h-12 bg-secondary/40 font-bold"
              />
            </div>

            <Button 
              type="submit" 
              disabled={actionLoading === "settings"}
              className="w-full h-12 bg-foreground text-background hover:bg-foreground/90 font-bold"
            >
              {actionLoading === "settings" ? <Spinner className="animate-spin h-5 w-5" /> : "Save Configuration"}
            </Button>
          </form>
        </div>
      )}

    </div>
  );
}
