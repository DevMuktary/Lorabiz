"use client";

import React, { useState } from "react";
import {
  Key,
  Plus,
  Copy,
  Check,
  ShieldAlert,
  AlertTriangle,
  XCircle,
  Trash2,
  Eye,
  EyeOff,
  RotateCw,
  Lock,
  Info,
} from "lucide-react";
import { formatWATDate, formatWATDateTime } from "@/lib/developer/format-wat";

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  rawKey?: string | null;
  type: "LIVE" | "TEST";
  status: "ACTIVE" | "REVOKED";
  ipWhitelist: string[];
  lastUsedAt: string | null;
  createdAt: string;
  revokedAt?: string | null;
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

  // Key Reveal Modal state (shown after initial creation or after rolling a key)
  const [revealedKey, setRevealedKey] = useState<{ name: string; rawKey: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Copied state per row
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);

  // Revealed keys toggle map (for test keys that have decrypted rawKey)
  const [revealedRowKeys, setRevealedRowKeys] = useState<Record<string, boolean>>({});

  // Roll Key Modal state
  const [keyToRoll, setKeyToRoll] = useState<ApiKeyItem | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollError, setRollError] = useState<string | null>(null);

  // In-App Revoke Modal state
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  // In-App Delete Modal state (permanently delete revoked keys)
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const confirmRollKey = async () => {
    if (!keyToRoll) return;

    setIsRolling(true);
    setRollError(null);

    try {
      const res = await fetch(`/api/developer/keys/${keyToRoll.id}/roll`, {
        method: "POST",
      });
      const data = await res.json();

      if (!data.success) {
        setRollError(data.message || "Failed to roll API key.");
        return;
      }

      const rolledKeyName = data.data?.name || keyToRoll.name;
      const rawSecret = data.data?.rawKey;

      setKeyToRoll(null);
      onRefreshKeys();

      if (rawSecret) {
        setRevealedKey({
          name: `${rolledKeyName} (Newly Rolled)`,
          rawKey: rawSecret,
        });
      }
    } catch (err: any) {
      setRollError("Error rolling key: " + err.message);
    } finally {
      setIsRolling(false);
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

  const confirmDeleteKey = async () => {
    if (!keyToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/developer/keys/${keyToDelete.id}?permanent=true`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setKeyToDelete(null);
        onRefreshKeys();
      } else {
        setDeleteError(data.message || "Failed to permanently delete key.");
      }
    } catch (err: any) {
      setDeleteError("Error deleting key: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleRevealRowKey = (id: string) => {
    setRevealedRowKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyToClipboard = (text: string, isModalKey = false, id?: string, msg?: string) => {
    navigator.clipboard.writeText(text);
    if (isModalKey) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } else if (id) {
      setCopiedId(id);
      setCopiedMessage(msg || "Copied to clipboard!");
      setTimeout(() => {
        setCopiedId(null);
        setCopiedMessage(null);
      }, 2500);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-card shadow-sm overflow-hidden">
      {/* 1. Header */}
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

      {/* 2. COMPACT CONFIDENTIALITY & SECURITY NOTICE (Ultra-low profile, mobile optimized) */}
      {isLive ? (
        <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/[0.08] px-4 py-2 text-[11px] text-amber-900 dark:text-amber-200 sm:px-6">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="leading-tight">
            <span className="font-semibold text-amber-950 dark:text-amber-100">Confidential:</span> Never share your secret keys or expose them in client code. Live keys debit your wallet.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/[0.05] px-4 py-2 text-[11px] text-muted-foreground sm:px-6">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-primary" />
          <p className="leading-tight">
            <span className="font-semibold text-foreground">Security Notice:</span> Never share secret keys. Test keys can be copied or revealed anytime.
          </p>
        </div>
      )}

      {/* Floating feedback toast for copied key actions */}
      {copiedMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-2 text-center text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-150">
          ✓ {copiedMessage}
        </div>
      )}

      {/* 3. Keys Table */}
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
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b border-border/40 bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5 font-medium">Name</th>
                <th className="px-6 py-3.5 font-medium">Secret Key / Token</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Created (WAT)</th>
                <th className="px-6 py-3.5 font-medium">Last Used (WAT)</th>
                <th className="px-6 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {keys.map((k) => {
                const isRevealed = Boolean(revealedRowKeys[k.id]);
                const canReveal = Boolean(k.rawKey && k.type === "TEST");

                return (
                  <tr key={k.id} className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{k.name}</span>
                        {isLive && k.status === "ACTIVE" && (
                          <span
                            title="Live secret keys are write-only for your financial safety"
                            className="inline-flex items-center text-muted-foreground/80 hover:text-foreground"
                          >
                            <Lock className="h-3 w-3 text-amber-500/90" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Token Value Display */}
                        <code className="rounded-lg bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground max-w-[280px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {isRevealed && k.rawKey ? k.rawKey : k.keyPrefix}
                        </code>

                        {/* Toggle Reveal (Only available for TEST keys with decrypted vault) */}
                        {canReveal && (
                          <button
                            type="button"
                            onClick={() => toggleRevealRowKey(k.id)}
                            title={isRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                          >
                            {isRevealed ? (
                              <EyeOff className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}

                        {/* Copy Button */}
                        {k.type === "TEST" ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (k.rawKey) {
                                copyToClipboard(k.rawKey, false, k.id, "Copied Test Secret Key!");
                              } else {
                                copyToClipboard(
                                  k.keyPrefix,
                                  false,
                                  k.id,
                                  "Legacy test key — Roll key to enable 1-click copy."
                                );
                              }
                            }}
                            title={k.rawKey ? "Copy Secret Key" : "Legacy key — click Roll to copy anytime"}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                          >
                            {copiedId === k.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              copyToClipboard(
                                k.keyPrefix,
                                false,
                                k.id,
                                "Copied token reference. For security, Live raw keys are not stored. Roll key to generate a new secret."
                              );
                            }}
                            title="Live keys are write-only. Click to copy token reference or Roll Key for a new secret."
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
                          >
                            {copiedId === k.id ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )}
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

                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatWATDate(k.createdAt)}
                    </td>

                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {k.lastUsedAt ? formatWATDateTime(k.lastUsedAt) : "Never"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {k.status === "ACTIVE" ? (
                          <>
                            {/* Roll Key Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setKeyToRoll(k);
                                setRollError(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                              title="Roll / Rotate this key (invalidates old key and creates replacement)"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                              <span>Roll Key</span>
                            </button>

                            {/* Revoke Key Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setKeyToRevoke(k);
                                setRevokeError(null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Revoke key permanently"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Revoke</span>
                            </button>
                          </>
                        ) : (
                          /* Permanent Delete for Revoked Keys */
                          <button
                            type="button"
                            onClick={() => {
                              setKeyToDelete(k);
                              setDeleteError(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition-colors"
                            title="Permanently Delete Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. CREATE KEY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h3 className="text-lg font-bold text-foreground">
              Generate {isLive ? "Live" : "Test"} Secret Key
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Give your secret key a descriptive name to easily track where it is integrated.
            </p>

            {/* In-Modal Warning */}
            <div className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>
                <strong>Confidential:</strong> Never share this key or expose it in frontend apps.
              </span>
            </div>

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
                  placeholder="e.g. Backend Production Server"
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

      {/* 5. ROLL KEY MODAL (SAFELY ROTATE / REGENERATE KEY) */}
      {keyToRoll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-primary">
              <RotateCw className="h-6 w-6" />
              <h3 className="text-lg font-bold text-foreground">Roll API Key</h3>
            </div>

            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to roll <strong>&quot;{keyToRoll.name}&quot;</strong> (
              <code className="font-mono text-foreground">{keyToRoll.keyPrefix}</code>)?
            </p>

            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>How key rolling works:</span>
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground dark:text-amber-200/80">
                <li>
                  The existing key will be <strong className="text-foreground">immediately revoked</strong>.
                </li>
                <li>
                  Any servers or apps using the old key will instantly receive 401 Unauthorized errors until updated.
                </li>
                <li>
                  A brand-new active secret key will be generated and displayed to you immediately.
                </li>
              </ul>
            </div>

            {rollError && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
                {rollError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setKeyToRoll(null)}
                disabled={isRolling}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRollKey}
                disabled={isRolling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRolling ? "animate-spin" : ""}`} />
                <span>{isRolling ? "Rolling Key..." : "Confirm & Roll Key"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. REVOKE KEY MODAL */}
      {keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-500">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-foreground">Revoke API Key</h3>
            </div>

            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to revoke the key <strong>&quot;{keyToRevoke.name}&quot;</strong> (
              <code>{keyToRevoke.keyPrefix}</code>)?
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

      {/* 7. PERMANENT DELETE MODAL (FOR REVOKED KEYS) */}
      {keyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-500">
              <Trash2 className="h-6 w-6" />
              <h3 className="text-lg font-bold text-foreground">Permanently Delete Key</h3>
            </div>

            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to permanently remove <strong>&quot;{keyToDelete.name}&quot;</strong> (
              <code>{keyToDelete.keyPrefix}</code>) from your dashboard?
            </p>

            <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Safe Cleanup:</strong> This key has already been revoked. Deleting it cleans up your key list. All historical usage and billing logs associated with this key remain preserved for your audit trail.
            </div>

            {deleteError && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-600 dark:text-red-400">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setKeyToDelete(null)}
                disabled={isDeleting}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteKey}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? "Deleting..." : "Permanently Delete"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. REVEAL KEY MODAL (SHOWN ONCE UPON CREATION OR ROLLING) */}
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

            {/* STRICT WARNING IN MODAL */}
            <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="leading-tight">
                <strong>Confidential:</strong> Store in <code className="rounded bg-muted px-1 font-mono text-[11px] text-foreground">.env</code>. {isLive ? "Cannot be viewed again after closing." : "Can be copied anytime."}
              </p>
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
