"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Key,
  Terminal,
  BookOpen,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Code2,
  Server,
  ArrowUpRight,
  Eye,
  X,
  Radio,
  CheckCircle2,
} from "lucide-react";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  type: "SANDBOX" | "LIVE";
  rateLimit: number;
  ipWhitelist: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

interface RequestLogItem {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  environment: "SANDBOX" | "LIVE";
  amountCharged: number;
  isRefunded: boolean;
  reference: string;
  ipAddress: string | null;
  requestBody: any;
  responseBody: any;
  errorMessage: string | null;
  createdAt: string;
}

export default function DeveloperPortalPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [logs, setLogs] = useState<RequestLogItem[]>([]);
  const [sandboxBalance, setSandboxBalance] = useState<number>(1000000);
  const [liveBalance, setLiveBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<"ALL" | "SANDBOX" | "LIVE">("ALL");

  // Create Key Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"SANDBOX" | "LIVE">("SANDBOX");
  const [newKeyIp, setNewKeyIp] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Newly Created Key Reveal Modal State
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Inspector Modal State
  const [selectedLog, setSelectedLog] = useState<RequestLogItem | null>(null);

  // Reset Sandbox Balance State
  const [isResettingSandbox, setIsResettingSandbox] = useState(false);

  // Load Data
  const fetchData = async () => {
    try {
      const [keysRes, logsRes] = await Promise.all([
        fetch("/api/developer/keys").then((res) => res.json()),
        fetch(`/api/developer/logs?environment=${logFilter === "ALL" ? "" : logFilter}`).then((res) =>
          res.json()
        ),
      ]);

      if (keysRes.status && keysRes.keys) {
        setKeys(keysRes.keys);
      }
      if (logsRes.status) {
        setLogs(logsRes.logs || []);
        if (logsRes.wallets) {
          setSandboxBalance(logsRes.wallets.sandboxBalance);
          setLiveBalance(logsRes.wallets.liveBalance);
        }
      }
    } catch (e) {
      console.error("Failed to load developer portal data", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [logFilter]);

  // Handle Generate Key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newKeyName.trim(),
          type: newKeyType,
          ipWhitelist: newKeyIp ? newKeyIp.split(",").map((s) => s.trim()) : [],
        }),
      });
      const data = await res.json();
      if (data.status && data.rawKey) {
        setRevealedKey(data.rawKey);
        setIsCreateModalOpen(false);
        setNewKeyName("");
        setNewKeyIp("");
        fetchData();
      } else {
        alert(data.error || "Failed to generate API key");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle Revoke Key
  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action is permanent.")) return;

    try {
      const res = await fetch(`/api/developer/keys?keyId=${keyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status) {
        fetchData();
      } else {
        alert(data.error || "Failed to revoke key");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle Reset Sandbox Balance
  const handleResetSandbox = async () => {
    setIsResettingSandbox(true);
    try {
      const res = await fetch("/api/developer/sandbox-wallet/reset", {
        method: "POST",
      });
      const data = await res.json();
      if (data.status) {
        setSandboxBalance(data.balance);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsResettingSandbox(false);
    }
  };

  return (
    <div className="space-y-8 p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Page Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#1e1427] to-slate-900 border border-white/10 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#c7365f]/15 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#c7365f]/20 text-[#e8447a] border border-[#c7365f]/30">
              <Terminal className="w-3.5 h-3.5" />
              B2B Developer Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Developer APIs & Verification Gateway
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Integrate Nigerian identity lookups (NIN, Phone, vNIN), BVN verifications, CAC, Tax ID, and KYC biometrics with instant response times, sandbox isolation, and automated refunds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard/developer/docs"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 backdrop-blur-md transition-all shadow-md hover:scale-[1.02]"
            >
              <BookOpen className="w-4 h-4 text-[#e8447a]" />
              Scalar Interactive Docs
              <ArrowUpRight className="w-4 h-4 opacity-70" />
            </Link>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-[#c7365f] to-[#e8447a] text-white shadow-lg shadow-[#c7365f]/30 hover:opacity-95 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Generate API Key
            </button>
          </div>
        </div>
      </div>

      {/* Dual Wallet Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sandbox Wallet Card */}
        <div className="rounded-2xl bg-slate-900/80 dark:bg-[#111827]/80 border border-amber-500/20 p-6 backdrop-blur-md relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">Sandbox Test Wallet</h3>
                <p className="text-xs text-slate-400">Dedicated testing funds (Zero real charges)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              100% ISOLATED
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                ₦{Number(sandboxBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Deducted exclusively by <code className="text-amber-300">lora_test_...</code> keys</p>
            </div>
            <button
              onClick={handleResetSandbox}
              disabled={isResettingSandbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResettingSandbox ? "animate-spin" : ""}`} />
              Reset to ₦1,000,000
            </button>
          </div>
        </div>

        {/* Live Wallet Card */}
        <div className="rounded-2xl bg-slate-900/80 dark:bg-[#111827]/80 border border-[#c7365f]/30 p-6 backdrop-blur-md relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#c7365f]/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#c7365f]/15 border border-[#c7365f]/30 text-[#e8447a]">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#e8447a]">Live Production Wallet</h3>
                <p className="text-xs text-slate-400">Main Account Balance</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              LIVE GATEWAY
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                ₦{Number(liveBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-slate-400 mt-1">Deducted exclusively by <code className="text-[#e8447a]">lora_live_...</code> keys</p>
            </div>
            <Link
              href="/dashboard/wallet"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#c7365f] to-[#e8447a] text-white shadow-md hover:opacity-90 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Fund Wallet
            </Link>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rounded-2xl bg-slate-900/80 dark:bg-[#111827]/80 border border-white/10 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-slate-300">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Active API Keys</h2>
              <p className="text-xs text-slate-400">Manage Sandbox and Live credentials for your applications</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Key
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
              <Key className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No API Keys Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Generate your first Sandbox API key to begin testing identity lookups without spending real funds.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#c7365f] text-white shadow-md hover:bg-[#c7365f]/90"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate Sandbox Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Environment</th>
                  <th className="px-6 py-3.5">Key Prefix</th>
                  <th className="px-6 py-3.5">Rate Limit</th>
                  <th className="px-6 py-3.5">Last Used</th>
                  <th className="px-6 py-3.5">Created</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{k.name}</td>
                    <td className="px-6 py-4">
                      {k.type === "SANDBOX" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          SANDBOX
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{k.keyPrefix}</td>
                    <td className="px-6 py-4 text-slate-400">{k.rateLimit} req/min</td>
                    <td className="px-6 py-4 text-slate-400">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Revoke Key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Sandbox cURL Example */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-black border border-white/10 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-4 h-4 text-[#e8447a]" />
            <h3 className="text-sm font-bold text-white">NIN Verification Sandbox Quickstart</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">POST /api/v1/nin-verification/nin</span>
        </div>

        <div className="relative rounded-xl bg-black/80 border border-white/10 p-4 font-mono text-xs text-slate-300 overflow-x-auto">
          <pre>{`curl -X POST https://api.lorabiz.com/api/v1/nin-verification/nin \\
  -H "Authorization: Bearer ${keys.find((k) => k.type === "SANDBOX")?.keyPrefix || "lora_test_your_key_here"}" \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" \\
  -d '{
    "nin": "11111111111"
  }'`}</pre>
        </div>
      </div>

      {/* Request Logs & Telemetry */}
      <div className="rounded-2xl bg-slate-900/80 dark:bg-[#111827]/80 border border-white/10 overflow-hidden shadow-xl backdrop-blur-md space-y-4">
        <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5 text-slate-300">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Request Telemetry & Logs</h2>
              <p className="text-xs text-slate-400">Live API requests, latency metrics, and payload inspector</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {(["ALL", "SANDBOX", "LIVE"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  logFilter === filter
                    ? "bg-[#c7365f] text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No API request logs recorded yet. Run your first query from Scalar Docs or cURL to see live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-slate-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="px-6 py-3.5">Endpoint</th>
                  <th className="px-6 py-3.5">Environment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Latency</th>
                  <th className="px-6 py-3.5">Cost Charged</th>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                        {log.method}
                      </span>
                      {log.endpoint}
                    </td>
                    <td className="px-6 py-4">
                      {log.environment === "SANDBOX" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          SANDBOX
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.statusCode >= 200 && log.statusCode < 300 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {log.statusCode} OK
                        </span>
                      ) : log.statusCode === 404 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          404 NOT FOUND
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {log.statusCode} ERROR
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono">{log.latencyMs} ms</td>
                    <td className="px-6 py-4">
                      {log.isRefunded ? (
                        <span className="text-amber-400 font-bold">₦0 (Auto-Refunded)</span>
                      ) : (
                        <span className="text-slate-300">₦{Number(log.amountCharged).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE API KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#c7365f]/20 text-[#e8447a]">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">Generate API Key</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staging Server or Production App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#c7365f]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Environment</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewKeyType("SANDBOX")}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      newKeyType === "SANDBOX"
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                        : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span>Sandbox Mode</span>
                    <span className="text-[10px] font-normal opacity-80">lora_test_... (Free ₦1M)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyType("LIVE")}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      newKeyType === "LIVE"
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                        : "bg-black/40 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span>Live Mode</span>
                    <span className="text-[10px] font-normal opacity-80">lora_live_... (Real funds)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  IP Whitelist <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.1, 10.0.0.1 (comma separated)"
                  value={newKeyIp}
                  onChange={(e) => setNewKeyIp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-[#c7365f]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#c7365f] to-[#e8447a] text-white shadow-lg disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Create Secret Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVEAL SECRET KEY MODAL */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Save Your API Secret Key</h3>
                <p className="text-xs text-amber-300 font-semibold">Copy this key now. It will never be shown again!</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/90 border border-white/15 space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">API Secret Key</div>
              <div className="flex items-center justify-between gap-2 font-mono text-xs text-emerald-400 break-all bg-white/5 p-2.5 rounded-lg border border-white/10">
                <span>{revealedKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(revealedKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="p-2 rounded-md bg-[#c7365f] text-white hover:opacity-90 shrink-0"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setRevealedKey(null)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15"
              >
                I Have Safely Saved It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG PAYLOAD INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-white">{selectedLog.endpoint}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-slate-300">
                    {selectedLog.method}
                  </span>
                </div>
                <p className="text-xs text-slate-400">Reference: {selectedLog.reference}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Request Body</label>
                <pre className="p-3.5 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto">
                  {JSON.stringify(selectedLog.requestBody, null, 2) || "(No body)"}
                </pre>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Response Body</label>
                <pre className="p-3.5 rounded-xl bg-black/80 border border-white/10 text-xs font-mono text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedLog.responseBody, null, 2) || "(No response body)"}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
