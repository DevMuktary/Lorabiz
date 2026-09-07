"use client";

import React, { useState, useEffect } from "react";
import { Webhook, Send, Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";

export const WebhookConfigCard: React.FC = () => {
  const [url, setUrl] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test Ping state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    statusCode?: number;
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    fetchWebhookConfig();
  }, []);

  const fetchWebhookConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/developer/webhook");
      const data = await res.json();
      if (data.success && data.data) {
        setUrl(data.data.url || "");
        setSecretKey(data.data.secretKey || "");
        setIsActive(data.data.isActive ?? true);
      }
    } catch (err) {
      console.error("Failed to load webhook config:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const cleanUrl = normalizeUrl(url);
    setUrl(cleanUrl);

    try {
      const res = await fetch("/api/developer/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, isActive }),
      });

      const data = await res.json();
      if (!data.success) {
        setSaveError(data.message || "Failed to save webhook.");
        return;
      }

      setSaveSuccess(true);
      setSecretKey(data.data.secretKey);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/developer/webhook/test", {
        method: "POST",
      });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message,
        statusCode: data.statusCode,
        latencyMs: data.latencyMs,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Failed to fire test ping: " + err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 pb-4">
        <Webhook className="h-5 w-5 text-primary" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Webhook Notifications</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Receive automated real-time status updates for asynchronous tasks (IPE clearance, verification status, and batch jobs).
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-muted-foreground">Loading webhook settings...</div>
      ) : (
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">
              Webhook URL (Payload Destination)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => {
                  if (url) {
                    setUrl(normalizeUrl(url));
                  }
                }}
                placeholder="https://api.yourcompany.com/webhooks/lorabiz"
                className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Endpoint"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              All events will be sent via HTTP POST with header <code className="rounded bg-muted px-1">X-Lorabiz-Signature</code>.
            </p>
          </div>

          {secretKey && (
            <div>
              <label className="block text-xs font-medium text-foreground mb-1">
                HMAC Signing Secret
              </label>
              <div className="relative flex items-center">
                <input
                  type={showSecret ? "text" : "password"}
                  readOnly
                  value={secretKey}
                  className="w-full rounded-xl border border-border bg-muted/60 px-3.5 py-2 pr-20 font-mono text-xs text-foreground focus:outline-none select-all"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    title={showSecret ? "Hide" : "Show"}
                  >
                    {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={copySecret}
                    className="rounded p-1 text-muted-foreground hover:text-foreground"
                    title="Copy Secret"
                  >
                    {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {saveError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
              {saveError}
            </div>
          )}

          {/* Test Ping Button & Result */}
          {url && (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-foreground">Test Connectivity</p>
                  <p className="text-[11px] text-muted-foreground">
                    Send a test payload to your server to verify your signature verification handler.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting || !url}
                  className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition-colors disabled:opacity-50 sm:self-auto"
                >
                  {isTesting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>{isTesting ? "Sending Ping..." : "Send Test Ping"}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-3 rounded-lg border p-2.5 text-xs ${
                    testResult.success
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300"
                  }`}
                >
                  <p className="font-semibold">{testResult.message}</p>
                  {testResult.latencyMs && (
                    <p className="mt-0.5 text-[11px] opacity-80">
                      Response time: {testResult.latencyMs}ms | HTTP Status: {testResult.statusCode}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
};
