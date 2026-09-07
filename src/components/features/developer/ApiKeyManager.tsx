"use client";

import React, { useState } from "react";
import { Key, Plus, Copy, Check, ShieldAlert, AlertTriangle, XCircle, Trash2 } from "lucide-react";

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  type: "LIVE" | "TEST";
  status: "ACTIVE" | "REVOKED";
  ipWhitelist: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface ApiKeyManagerProps {
  environment: "LIVE" | "TEST";
  keys: ApiKeyItem[];
  isLoading: boolean;
  onRefreshKeys: () => void;
  onRequestLiveAccess: () => void;
  liveApprovalStatus?: string | null;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  environment,
  keys,
  isLoading,
  onRefreshKeys,
  onRequestLiveAccess,
  liveApprovalStatus,
}) => {
  const isLive = environment === "LIVE";
  const isLiveApproved = liveApprovalStatus === "APPROVED";

  // Create Key Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Key Reveal Modal state
  const [revealedKey, setRevealedKey] = useState<{ name: string; rawKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Copied prefix helper
  const [copiedPrefixId, setCopiedPrefixId] = useState<string | null>(null);

  // Custom In-App Revoke Modal state (replaces browser window.confirm)
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const handleOpenCreateModal = () => {
    if (isLive && !isLiveApproved) {
      onRequestLiveAccess();
      return;
    }
    setKeyName(isLive ? "Production Key" : "Local Development Key");
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyName.trim(),
          type: environment,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setCreateError(data.message || "Failed to generate API key.");
        return;
      }

      setIsCreateModalOpen(false);
      setRevealedKey({
        name: data.data.name,
        rawKey: data.data.rawKey,
      });
      onRefreshKeys();
    } catch (err: any) {
      setCreateError(err.message || "An unexpected error occurred.");
    } finally {
      setIsCreating(false);
    }
  };

  const confirmRevokeKey = async () => {
    if (!keyToRevoke) return;

    setIsRevoking(true);
    setRevokeError(null);

    try {
      const res = await fetch(`/api/developer/keys/${keyToRevoke.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setKeyToRevoke(null);
        onRefreshKeys();
      } else {
        setRevokeError(data.message || "Failed to revoke key.");
      }
    } catch (err: any) {
      setRevokeError("Error revoking key: " + err.message);
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = (text: string, isFullKey = false, id?: string) => {
    navigator.clipboard.writeText(text);
    if (isFullKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } else if (id) {
      setCopiedPrefixId(id);
      setTimeout(() => setCopiedPrefixId(null), 2000);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isLive ? "Live API Keys" : "Sandbox Test Keys"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLive
              ? "Use `lora_live_...` keys to execute live identity queries. Debits your real wallet."
              : "Use `lora_test_...` keys for safe testing. Debits your virtual ₦1,000,000 sandbox credit."}
          </p>
        </div>

        <div>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New Key</span>
          </button>
        </div>
      </div>

      {/* Keys Table */}
      <div className="w-full overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading API keys...</div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Key className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">No active {environment.toLowerCase()} keys</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Click &quot;Generate New Key&quot; above to create your first {isLive ? "production" : "test"} secret key.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5 font-medium">Name</th>
                <th className="px-6 py-3.5 font-medium">Token Prefix</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Created</th>
                <th className="px-6 py-3.5 font-medium">Last Used</th>
                <th className="px-6 py-3.5 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {keys.map((k) => (
                <tr key={k.id} className="transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4 font-semibold text-foreground">{k.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground">
                        {k.keyPrefix}
                      </code>
                      <button
                        onClick={() => copyToClipboard(k.keyPrefix, false, k.id)}
                        title="Copy Prefix"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copiedPrefixId === k.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                        k.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground line-through"
                      }`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(k.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {k.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          setKeyToRevoke(k);
                          setRevokeError(null);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">
              Generate {isLive ? "Live" : "Test"} Secret Key
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Give your secret key a descriptive name so you can track where it is deployed.
            </p>

            <form onSubmit={handleCreateKey} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Key Label / Name
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Mobile App"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {createError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isCreating ? "Generating..." : "Create Secret Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM IN-APP CONFIRMATION MODAL FOR KEY REVOCATION (NO BROWSER WINDOW.CONFIRM) */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-500">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-foreground">Revoke API Key</h3>
            </div>

            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to revoke the key <strong>&quot;{keyToRevoke.name}&quot;</strong> (<code>{keyToRevoke.keyPrefix}</code>)?
            </p>

            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Any live applications or servers using this key will immediately lose access and receive HTTP 401 Unauthorized errors. This action cannot be undone.
            </div>

            {revokeError && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
                {revokeError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setKeyToRevoke(null)}
                disabled={isRevoking}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Keep Key
              </button>
              <button
                type="button"
                onClick={confirmRevokeKey}
                disabled={isRevoking}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>{isRevoking ? "Revoking..." : "Revoke Key"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVEAL KEY MODAL (SHOWN ONCE UPON CREATION) */}
      {revealedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-emerald-500">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-lg font-bold text-foreground">Save Your Secret Key</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Key: <span className="font-semibold text-foreground">{revealedKey.name}</span>
            </p>

            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <strong>Important:</strong> Store this key securely now. For your security, you will never be able to view this raw key again once this dialog is closed.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-foreground mb-1">
                Raw Secret Key
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={revealedKey.rawKey}
                  className="w-full rounded-xl border border-border bg-muted/60 px-3.5 py-3 pr-24 font-mono text-xs text-foreground focus:outline-none select-all"
                />
                <button
                  onClick={() => copyToClipboard(revealedKey.rawKey, true)}
                  className="absolute right-2 top-1.5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                  {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setRevealedKey(null)}
                className="rounded-xl bg-foreground px-5 py-2.5 text-xs font-semibold text-background hover:bg-foreground/90 transition-colors"
              >
                I have stored this key safely
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
