"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Gift, 
  Coins, 
  Ticket, 
  Sliders, 
  Check, 
  WarningCircle, 
  Spinner, 
  ToggleLeft, 
  ToggleRight,
  Plus,
  FloppyDisk,
  UserPlus,
  Clock,
  CheckCircle,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { WheelSlice, DEFAULT_WHEEL_SLICES } from "@/lib/rewards";

export default function MdsRewardsAdminPage() {
  const [data, setData] = useState<any>({
    settings: { isCampaignActive: true, minDeposit: 20000, slices: DEFAULT_WHEEL_SLICES },
    stats: { totalSpinsUsed: 0, totalTokensAvailable: 0, totalCreditsIssued: 0 },
    auditLogs: [],
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form states
  const [minDepositInput, setMinDepositInput] = useState<number>(20000);
  const [slicesState, setSlicesState] = useState<WheelSlice[]>(DEFAULT_WHEEL_SLICES);

  // Manual Grant Modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState<boolean>(false);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [tokenCountToGrant, setTokenCountToGrant] = useState<number>(1);
  const [grantReason, setGrantReason] = useState<string>("");
  const [isGranting, setIsGranting] = useState<boolean>(false);

  // Audit Search Filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchMdsRewards();
  }, []);

  const fetchMdsRewards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/mds/rewards");
      const resData = await res.json();
      if (resData.success) {
        setData(resData);
        setMinDepositInput(resData.settings.minDeposit || 20000);
        setSlicesState(resData.settings.slices || DEFAULT_WHEEL_SLICES);
      }
    } catch (err) {
      console.error("Failed to load MDS rewards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleToggleCampaign = async () => {
    try {
      setIsSaving(true);
      const newStatus = !data.settings.isCampaignActive;
      const res = await fetch("/api/mds/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE_CAMPAIGN",
          payload: { isActive: newStatus },
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setData((prev: any) => ({
          ...prev,
          settings: { ...prev.settings, isCampaignActive: newStatus },
        }));
        showFeedback("success", resData.message);
      } else {
        showFeedback("error", resData.message || "Failed to toggle campaign");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveThreshold = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/mds/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_THRESHOLD",
          payload: { minDeposit: minDepositInput },
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        setData((prev: any) => ({
          ...prev,
          settings: { ...prev.settings, minDeposit: minDepositInput },
        }));
        showFeedback("success", resData.message);
      } else {
        showFeedback("error", resData.message || "Failed to save threshold");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSliceWeightChange = (index: number, newWeight: number) => {
    const updated = [...slicesState];
    updated[index] = { ...updated[index], weight: Math.max(0, newWeight) };
    setSlicesState(updated);
  };

  const handleSaveSlices = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/mds/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_SLICES",
          payload: { slices: slicesState },
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        showFeedback("success", resData.message);
      } else {
        showFeedback("error", resData.message || "Failed to save slices");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGrantManualToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;

    try {
      setIsGranting(true);
      const res = await fetch("/api/mds/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GRANT_MANUAL_SPIN",
          payload: {
            targetUserId: targetUserId.trim(),
            count: tokenCountToGrant,
            reason: grantReason,
          },
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        showFeedback("success", resData.message);
        setIsGrantModalOpen(false);
        setTargetUserId("");
        setGrantReason("");
        fetchMdsRewards();
      } else {
        showFeedback("error", resData.message || "Failed to grant tokens");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Network error");
    } finally {
      setIsGranting(false);
    }
  };

  const filteredLogs = (data.auditLogs || []).filter((log: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const userName = `${log.user?.firstName || ""} ${log.user?.lastName || ""}`.toLowerCase();
    const userEmail = (log.user?.email || "").toLowerCase();
    const ref = (log.sourceTxRef || "").toLowerCase();
    const prize = (log.wonPrizeLabel || "").toLowerCase();
    return userName.includes(q) || userEmail.includes(q) || ref.includes(q) || prize.includes(q);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 group"
          >
            <ArrowLeft weight="bold" className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to MDS Core Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Gift weight="fill" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                Reward Vault & Lucky Spin Suite
                <span className="text-[10px] uppercase font-black tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                  MDS Admin Control
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Control campaign killswitch, threshold settings, probability drop rates, and audit logs.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsGrantModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer shrink-0"
        >
          <UserPlus weight="bold" className="h-4 w-4" />
          <span>Grant Manual Spin Token</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
            feedbackMsg.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border border-destructive/20 text-destructive"
          }`}
        >
          {feedbackMsg.type === "success" ? <Check weight="bold" className="h-4 w-4" /> : <WarningCircle weight="bold" className="h-4 w-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campaign Status</span>
          <div className="flex items-center justify-between pt-1">
            <span
              className={`text-sm font-black px-2.5 py-1 rounded-full border ${
                data.settings.isCampaignActive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              }`}
            >
              {data.settings.isCampaignActive ? "ACTIVE" : "PAUSED"}
            </span>
            <button
              type="button"
              onClick={handleToggleCampaign}
              disabled={isSaving}
              className="text-primary hover:opacity-80 transition-opacity cursor-pointer"
              title="Toggle Campaign"
            >
              {data.settings.isCampaignActive ? (
                <ToggleRight weight="fill" className="h-8 w-8 text-emerald-500" />
              ) : (
                <ToggleLeft weight="fill" className="h-8 w-8 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min. Deposit Threshold</span>
          <div className="text-2xl font-black font-mono text-foreground pt-1">
            ₦{data.settings.minDeposit?.toLocaleString()}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Spins Claimed</span>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 pt-1">
            {data.stats?.totalSpinsUsed} Spins
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available Tokens Held</span>
          <div className="text-2xl font-black font-mono text-amber-500 pt-1">
            {data.stats?.totalTokensAvailable} Tokens
          </div>
        </div>
      </div>

      {/* Settings & Wheel Probability Slices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Campaign Threshold Settings (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Sliders weight="bold" className="h-4 w-4 text-primary" />
              Campaign Configuration
            </h2>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Minimum Deposit per Spin Token (₦)
                </label>
                <input
                  type="number"
                  value={minDepositInput}
                  onChange={(e) => setMinDepositInput(Number(e.target.value))}
                  step={1000}
                  min={1000}
                  className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground font-mono font-bold text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <span className="text-[11px] text-muted-foreground block">
                  Depositing ₦{minDepositInput.toLocaleString()} grants 1 Spin Token.
                </span>
              </div>

              <button
                type="button"
                onClick={handleSaveThreshold}
                disabled={isSaving}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <FloppyDisk weight="bold" className="h-4 w-4" />
                <span>Save Deposit Threshold</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Wheel Slices Probability Matrix (8 Cols) */}
        <div className="lg:col-span-8 bg-card border border-border rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                Wheel Slices & Drop Rate Probability
              </h2>
              <p className="text-xs text-muted-foreground">
                Set weight = 0 to make a slice a teaser (0% drop rate).
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveSlices}
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FloppyDisk weight="bold" className="h-4 w-4" />
              <span>Save Slice Matrix</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase font-black text-[10px]">
                  <th className="pb-3">Slice Label</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Value (₦)</th>
                  <th className="pb-3">Server Weight</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {slicesState.map((slice, index) => (
                  <tr key={slice.id} className="hover:bg-secondary/40">
                    <td className="py-3 font-bold text-foreground flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                      {slice.label}
                    </td>
                    <td className="py-3 font-mono text-muted-foreground text-[11px]">{slice.type}</td>
                    <td className="py-3 font-mono font-bold text-foreground">₦{slice.value?.toLocaleString()}</td>
                    <td className="py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={slice.weight}
                        onChange={(e) => handleSliceWeightChange(index, Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded-lg bg-background border border-border text-center font-mono font-bold text-xs"
                      />
                    </td>
                    <td className="py-3 text-right">
                      {slice.weight === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          TEASER (0%)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          ACTIVE ({slice.weight}%)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Spin Audit Stream Table */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Clock weight="bold" className="h-4 w-4 text-primary" />
              Live Spin Audit Ledger
            </h2>
            <p className="text-xs text-muted-foreground">Real-time stream of all user token generations and spin outcomes.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <MagnifyingGlass weight="bold" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user, ref, prize..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-background border border-input text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase font-black text-[10px]">
                <th className="pb-3">User</th>
                <th className="pb-3">Source Deposit</th>
                <th className="pb-3">Ref</th>
                <th className="pb-3">Prize Won</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    No spin events recorded matching your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-secondary/40">
                    <td className="py-3">
                      <span className="font-bold text-foreground block">
                        {log.user?.firstName} {log.user?.lastName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{log.user?.email}</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-foreground">
                      ₦{Number(log.depositAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-[10px] text-muted-foreground">{log.sourceTxRef}</td>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                      {log.wonPrizeLabel || "—"}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.status === "USED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-muted-foreground text-[10px]">
                      {log.createdAt ? new Date(log.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Grant Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus weight="bold" className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">Grant Manual Spin Tokens</h3>
                <p className="text-xs text-muted-foreground">Credit spin tokens directly to a customer account</p>
              </div>
            </div>

            <form onSubmit={handleGrantManualToken} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">User ID / Email</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. user-cuid or user@email.com"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Number of Spin Tokens</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={tokenCountToGrant}
                  onChange={(e) => setTokenCountToGrant(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-xs font-mono font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Customer appreciation"
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-input text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-secondary transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isGranting}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                >
                  {isGranting ? <Spinner weight="bold" className="h-4 w-4 animate-spin" /> : <UserPlus weight="bold" className="h-4 w-4" />}
                  <span>Grant Tokens</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
