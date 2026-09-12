"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Clock, AlertCircle, ShieldCheck } from "lucide-react";

interface RequestInspectDrawerProps {
  logId: string | null;
  onClose: () => void;
}

export const RequestInspectDrawer: React.FC<RequestInspectDrawerProps> = ({
  logId,
  onClose,
}) => {
  const [logDetails, setLogDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"response" | "request" | "headers">("response");
  const [copiedTab, setCopiedTab] = useState(false);

  useEffect(() => {
    if (!logId) {
      setLogDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/developer/logs/${logId}`);
        const data = await res.json();
        if (data.success) {
          setLogDetails(data.data);
        }
      } catch (err) {
        console.error("Failed to load log detail:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [logId]);

  if (!logId) return null;

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    if (code >= 400 && code < 500) return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  };

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(true);
    setTimeout(() => setCopiedTab(false), 2000);
  };

  const renderCurrentTabContent = () => {
    if (!logDetails) return null;
    let dataToDisplay: any = null;

    if (activeTab === "response") {
      dataToDisplay = logDetails.responseBody || { message: "No response body recorded." };
    } else if (activeTab === "request") {
      dataToDisplay = logDetails.requestBody || { message: "No request body provided." };
    } else {
      dataToDisplay = logDetails.requestHeaders || { message: "No custom headers recorded." };
    }

    const jsonString = JSON.stringify(dataToDisplay, null, 2);

    return (
      <div className="relative mt-3">
        <button
          onClick={() => copyContent(jsonString)}
          className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted/80 transition-colors"
        >
          {copiedTab ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          <span>{copiedTab ? "Copied" : "Copy"}</span>
        </button>
        <pre className="max-h-[420px] overflow-auto rounded-xl border border-border bg-muted/40 p-4 font-mono text-[11px] text-foreground leading-relaxed">
          {jsonString}
        </pre>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative h-full w-full max-w-xl border-l border-border bg-card p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {logDetails?.method || "POST"}
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {logDetails?.endpoint || "API Endpoint"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-xs text-muted-foreground">
            Loading request payload...
          </div>
        ) : logDetails ? (
          <div className="mt-5 space-y-5">
            {/* Meta Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">HTTP Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${getStatusColor(logDetails.statusCode)}`}>
                    {logDetails.statusCode}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Latency</span>
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{logDetails.latencyMs}ms</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Amount Debited</span>
                <div className="mt-1 text-xs font-bold text-foreground">
                  ₦{Number(logDetails.amountCharged || 0).toLocaleString()}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground">Environment</span>
                <div className="mt-1 text-xs font-bold text-foreground">
                  {logDetails.environment}
                </div>
              </div>

              <div className="col-span-2 sm:col-span-4 rounded-xl border border-border bg-muted/20 p-2.5 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-muted-foreground">Recorded At:</span>
                <span className="font-mono font-medium text-foreground">
                  {new Date(logDetails.createdAt).toLocaleString("en-GB", {
                    timeZone: "Africa/Lagos",
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            {/* Error Message if Present */}
            {logDetails.errorMessage && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-semibold text-red-700 dark:text-red-300">Failure Reason:</span>
                    <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">
                      {logDetails.errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Client Reference */}
            {logDetails.clientReference && (
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-[11px] font-medium text-muted-foreground">Client Order Reference: </span>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                  {logDetails.clientReference}
                </code>
              </div>
            )}

            {/* Tabs for JSON payloads */}
            <div>
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("response")}
                  className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
                    activeTab === "response"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Response Body
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("request")}
                  className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
                    activeTab === "request"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Request Body
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("headers")}
                  className={`border-b-2 px-4 py-2 text-xs font-semibold transition-colors ${
                    activeTab === "headers"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Headers
                </button>
              </div>

              {renderCurrentTabContent()}
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-xs text-red-500">Log not found.</div>
        )}
      </div>
    </div>
  );
};
