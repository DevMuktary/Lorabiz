"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Key,
  Terminal,
  BookOpen,
  Copy,
  CheckCircle,
  PlusCircle,
  Trash,
  ArrowsClockwise,
  Wallet,
  ShieldCheck,
  Eye,
  X,
  ArrowUpRight,
  FloppyDisk,
  Check,
  WarningCircle,
  Globe,
} from "@phosphor-icons/react";

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

interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  isActive: boolean;
}

export default function DeveloperPortalPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [logs, setLogs] = useState<RequestLogItem[]>([]);
  const [webhook, setWebhook] = useState<WebhookItem | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [sandboxBalance, setSandboxBalance] = useState<number>(1000000);
  const [liveBalance, setLiveBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState<"ALL" | "SANDBOX" | "LIVE">("ALL");

  // Create Key Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<"SANDBOX" | "LIVE">("SANDBOX");
  const [newKeyIp, setNewKeyIp] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Newly Created / Rotated Key Reveal Modal State
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [revealTitle, setRevealTitle] = useState("Save Your Secret API Key");
  const [copiedKey, setCopiedKey] = useState(false);

  // Rotating Key Loading State
  const [rotatingKeyId, setRotatingKeyId] = useState<string | null>(null);

  // Inspector Modal State
  const [selectedLog, setSelectedLog] = useState<RequestLogItem | null>(null);

  // Reset Sandbox Balance State
  const [isResettingSandbox, setIsResettingSandbox] = useState(false);

  // Load Data
  const fetchData = async () => {
    try {
      const [keysRes, logsRes, webhookRes] = await Promise.all([
        fetch("/api/developer/keys").then((res) => res.json()),
        fetch(`/api/developer/logs?environment=${logFilter === "ALL" ? "" : logFilter}`).then((res) =>
          res.json()
        ),
        fetch("/api/developer/webhooks").then((res) => res.json()),
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
      if (webhookRes.status && webhookRes.webhook) {
        setWebhook(webhookRes.webhook);
        setWebhookUrl(webhookRes.webhook.url || "");
      }
    } catch (e) {
      console.error("Failed to load developer portal data", e);
    } finally {
      setLoading(false);
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
        setRevealTitle("Save Your New API Key");
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

  // Handle Rotate Key
  const handleRotateKey = async (keyId: string, keyName: string) => {
    if (
      !confirm(
        `Are you sure you want to rotate "${keyName}"? The current key will be immediately invalidated and a security alert email will be sent.`
      )
    ) {
      return;
    }

    setRotatingKeyId(keyId);
    try {
      const res = await fetch("/api/developer/keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.status && data.rawKey) {
        setRevealTitle("Save Your Rotated API Key");
        setRevealedKey(data.rawKey);
        fetchData();
      } else {
        alert(data.error || "Failed to rotate API key");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setRotatingKeyId(null);
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

  // Handle Save Webhook
  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWebhook(true);
    try {
      const res = await fetch("/api/developer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.status && data.webhook) {
        setWebhook(data.webhook);
        alert("Webhook URL updated successfully.");
      } else {
        alert(data.message || data.error || "Failed to update webhook");
      }
    } catch (err: any) {
      alert(err.message || "Network error");
    } finally {
      setIsSavingWebhook(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Developer API</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your API credentials, sandbox testing funds, webhooks, and live request telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/developer/docs"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card hover:bg-secondary text-foreground transition-colors shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-primary" weight="bold" />
            API Documentation
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" weight="bold" />
            Generate API Key
          </button>
        </div>
      </div>

      {/* Dual Wallets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Live Wallet Card */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Wallet className="w-5 h-5" weight="duotone" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Production Wallet
                </h3>
                <p className="text-xs text-muted-foreground">Deducted for live key requests</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Live Gateway
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2">
            <div>
              <div className="text-2xl font-bold text-foreground">
                ₦{Number(liveBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keys: <code className="text-xs font-mono text-primary font-semibold">lora_live_...</code>
              </p>
            </div>
            <Link
              href="/dashboard/wallet"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Fund Wallet
            </Link>
          </div>
        </div>

        {/* Sandbox Wallet Card */}
        <div className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-5 h-5" weight="duotone" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Sandbox Test Wallet
                </h3>
                <p className="text-xs text-muted-foreground">Dedicated simulated test funds</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Isolated Test Mode
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-2">
            <div>
              <div className="text-2xl font-bold text-foreground">
                ₦{Number(sandboxBalance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Keys: <code className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">lora_test_...</code>
              </p>
            </div>
            <button
              onClick={handleResetSandbox}
              disabled={isResettingSandbox}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
            >
              <ArrowsClockwise className={`w-3.5 h-3.5 ${isResettingSandbox ? "animate-spin" : ""}`} weight="bold" />
              Reset Balance
            </button>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-primary" weight="bold" />
            <h2 className="text-sm font-bold text-foreground">API Credentials</h2>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <PlusCircle className="w-3.5 h-3.5" weight="bold" />
            New Secret Key
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Key className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">No API Keys Generated</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a Sandbox API key to begin integrating identity and verification services into your system.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" weight="bold" />
              Generate Sandbox Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Environment</th>
                  <th className="px-5 py-3">Key Prefix</th>
                  <th className="px-5 py-3">Rate Limit</th>
                  <th className="px-5 py-3">Last Used</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground">{k.name}</td>
                    <td className="px-5 py-3.5">
                      {k.type === "SANDBOX" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          SANDBOX
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{k.keyPrefix}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{k.rateLimit} req/min</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleRotateKey(k.id, k.name)}
                        disabled={rotatingKeyId === k.id}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                        title="Rotate Secret Key"
                      >
                        <ArrowsClockwise
                          className={`w-3.5 h-3.5 ${rotatingKeyId === k.id ? "animate-spin" : ""}`}
                          weight="bold"
                        />
                        Rotate
                      </button>
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-rose-500 hover:text-rose-600"
                        title="Revoke Key"
                      >
                        <Trash className="w-3.5 h-3.5" weight="bold" />
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

      {/* Webhook Configuration Card */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-primary" weight="bold" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Webhook Endpoint</h3>
              <p className="text-xs text-muted-foreground">
                Receive real-time event notifications for async verification requests and status updates.
              </p>
            </div>
          </div>
          {webhook?.isActive && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          )}
        </div>

        <form onSubmit={handleSaveWebhook} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Webhook URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://yourdomain.com/api/lorabiz-webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                disabled={isSavingWebhook}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <FloppyDisk className="w-3.5 h-3.5" weight="bold" />
                {isSavingWebhook ? "Saving..." : "Save Webhook"}
              </button>
            </div>
          </div>

          {webhook?.secret && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-muted-foreground">Webhook Signing Secret</label>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-secondary/50 border border-border font-mono text-xs text-foreground">
                <span className="truncate">{webhook.secret}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhook.secret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground shrink-0"
                  title="Copy Signing Secret"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Request Logs & Telemetry */}
      <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-primary" weight="bold" />
            <div>
              <h2 className="text-sm font-bold text-foreground">Request Telemetry & Logs</h2>
              <p className="text-xs text-muted-foreground">Inspect live API payload transactions</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-lg">
            {(["ALL", "SANDBOX", "LIVE"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  logFilter === filter
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground">
            No API request logs recorded yet. Send your first query from Scalar Docs or cURL to see live telemetry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-3">Endpoint</th>
                  <th className="px-5 py-3">Environment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Latency</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-foreground">
                      <span className="mr-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground">
                        {log.method}
                      </span>
                      {log.endpoint}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.environment === "SANDBOX" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          SANDBOX
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          LIVE
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.statusCode >= 200 && log.statusCode < 300 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {log.statusCode} OK
                        </span>
                      ) : log.statusCode === 404 ? (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          404 NOT FOUND
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {log.statusCode} ERROR
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{log.latencyMs} ms</td>
                    <td className="px-5 py-3.5">
                      {log.isRefunded ? (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">₦0 (Refunded)</span>
                      ) : (
                        <span className="text-foreground font-medium">₦{Number(log.amountCharged).toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" weight="bold" />
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" weight="bold" />
                <h3 className="text-base font-bold text-foreground">Generate API Key</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Key Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staging Server or Backend App"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Environment</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewKeyType("SANDBOX")}
                    className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors ${
                      newKeyType === "SANDBOX"
                        ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Sandbox Mode</span>
                    <span className="text-[10px] font-normal opacity-70">Free Test ₦1M Funds</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewKeyType("LIVE")}
                    className={`px-3.5 py-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-0.5 transition-colors ${
                      newKeyType === "LIVE"
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-background border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Live Mode</span>
                    <span className="text-[10px] font-normal opacity-70">Production Wallet</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  IP Whitelist <span className="font-normal text-muted-foreground">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.1, 10.0.0.1 (comma separated)"
                  value={newKeyIp}
                  onChange={(e) => setNewKeyIp(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-foreground text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Secret Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVEAL SECRET KEY MODAL */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Key className="w-6 h-6" weight="duotone" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{revealTitle}</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Copy your key now. For your security, this key will never be shown again!
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-secondary/50 border border-border space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Secret API Key
              </div>
              <div className="flex items-center justify-between gap-2 font-mono text-xs text-foreground break-all bg-background p-2.5 rounded border border-border">
                <span>{revealedKey}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(revealedKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setRevealedKey(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                I Have Safely Copied It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG PAYLOAD INSPECTOR MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{selectedLog.endpoint}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground">
                    {selectedLog.method}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Reference: {selectedLog.reference}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Request Body
                </label>
                <pre className="p-3 rounded-lg bg-secondary/60 border border-border text-xs font-mono text-foreground overflow-x-auto">
                  {JSON.stringify(selectedLog.requestBody, null, 2) || "(No body)"}
                </pre>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Response Body
                </label>
                <pre className="p-3 rounded-lg bg-secondary/60 border border-border text-xs font-mono text-foreground overflow-x-auto">
                  {JSON.stringify(selectedLog.responseBody, null, 2) || "(No response body)"}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-border bg-secondary hover:bg-secondary/80 text-foreground"
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
