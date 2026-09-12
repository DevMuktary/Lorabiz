"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { SpinnerGap } from "@phosphor-icons/react";
import { Clock, CheckCircle2, AlertCircle, X } from "lucide-react";
import { DeveloperConsoleHeader } from "@/components/features/developer/DeveloperConsoleHeader";
import { DeveloperMetricCards } from "@/components/features/developer/DeveloperMetricCards";
import { ApiKeyManager, ApiKeyItem } from "@/components/features/developer/ApiKeyManager";
import { WebhookConfigCard } from "@/components/features/developer/WebhookConfigCard";
import { RequestStreamTable } from "@/components/features/developer/RequestStreamTable";
import { LiveActivationModal } from "@/components/features/developer/LiveActivationModal";

export default function DeveloperDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Read saved mode immediately from localStorage/cookie to eliminate initial TEST flash
  const [environment, setEnvironment] = useState<"LIVE" | "TEST">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lorabiz_dev_mode");
        if (saved === "LIVE" || saved === "TEST") return saved;
        const match = document.cookie.match(/lorabiz_dev_mode=(LIVE|TEST)/);
        if (match && (match[1] === "LIVE" || match[1] === "TEST")) return match[1] as "LIVE" | "TEST";
      } catch {}
    }
    return "TEST";
  });

  // Mode is ready if already cached in browser, or will wait for first overview fetch
  const [isModeReady, setIsModeReady] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lorabiz_dev_mode");
        if (saved === "LIVE" || saved === "TEST") return true;
      } catch {}
    }
    return false;
  });

  const [stats, setStats] = useState({
    walletBalance: 0,
    sandboxBalance: 1000000,
    totalSpentLive: 0,
    totalSpentTest: 0,
    totalCallsToday: 0,
    successfulCallsToday: 0,
    failedCallsToday: 0,
    successRate: null as number | null,
    liveKeysCount: 0,
    testKeysCount: 0,
  });

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isKeysLoading, setIsKeysLoading] = useState(true);

  const [developerProfile, setDeveloperProfile] = useState<any | null>(null);
  const [isLiveActivationOpen, setIsLiveActivationOpen] = useState(false);

  // Floating side toast state
  const [toastNotification, setToastNotification] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Authentication gate
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/dashboard/developer");
    }
  }, [status, router]);

  // Load Overview Stats
  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/developer/overview", { cache: "no-store" });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.activeMode) {
          setEnvironment(data.data.activeMode);
          try {
            localStorage.setItem("lorabiz_dev_mode", data.data.activeMode);
            document.cookie = `lorabiz_dev_mode=${data.data.activeMode}; path=/; max-age=31536000; SameSite=Lax`;
          } catch {}
        }
        setIsModeReady(true);
        setStats({
          walletBalance: data.data.walletBalance,
          sandboxBalance: data.data.sandboxBalance,
          totalSpentLive: data.data.totalSpentLive || 0,
          totalSpentTest: data.data.totalSpentTest || 0,
          totalCallsToday: data.data.totalCallsToday,
          successfulCallsToday: data.data.successfulCallsToday || 0,
          failedCallsToday: data.data.failedCallsToday || 0,
          successRate: data.data.successRate, // null when no calls
          liveKeysCount: data.data.liveKeysCount,
          testKeysCount: data.data.testKeysCount,
        });
        setDeveloperProfile(data.data.developerProfile);
      }
    } catch (err) {
      console.error("Failed to load developer overview:", err);
    }
  }, []);

  // Real-time Live SSE Sync with fallback heartbeat polling
  useEffect(() => {
    if (status !== "authenticated") return;

    let eventSource: EventSource | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    try {
      eventSource = new EventSource("/api/developer/stream");
      eventSource.addEventListener("sync", (e) => {
        try {
          const syncData = JSON.parse(e.data);
          setStats((prev) => ({
            ...prev,
            walletBalance: syncData.walletBalance ?? prev.walletBalance,
            sandboxBalance: syncData.sandboxBalance ?? prev.sandboxBalance,
            totalSpentLive: syncData.totalSpentLive ?? prev.totalSpentLive,
            totalSpentTest: syncData.totalSpentTest ?? prev.totalSpentTest,
            totalCallsToday: syncData.totalCallsToday ?? prev.totalCallsToday,
            successfulCallsToday: syncData.successfulCallsToday ?? prev.successfulCallsToday,
            failedCallsToday: syncData.failedCallsToday ?? prev.failedCallsToday,
            successRate: syncData.successRate ?? prev.successRate,
          }));

          if (syncData.developerProfileStatus) {
            setDeveloperProfile((prev: any) => {
              if (prev && prev.status !== syncData.developerProfileStatus) {
                return { ...prev, status: syncData.developerProfileStatus };
              }
              return prev;
            });
          }
        } catch {}
      });
    } catch {
      // EventSource fallback handles it
    }

    // High-resilience fallback polling (every 3.5s while tab is visible)
    pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        loadOverview();
      }
    }, 3500);

    return () => {
      if (eventSource) eventSource.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [status, loadOverview]);

  // Handle Environment Toggle with PostgreSQL persistence
  const handleToggleEnvironment = async (newEnv: "LIVE" | "TEST") => {
    if (newEnv === "LIVE" && developerProfile?.status !== "APPROVED") {
      setIsLiveActivationOpen(true);
      return;
    }

    setEnvironment(newEnv);
    try {
      localStorage.setItem("lorabiz_dev_mode", newEnv);
      document.cookie = `lorabiz_dev_mode=${newEnv}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}

    // Persist preference to PostgreSQL
    try {
      await fetch("/api/developer/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newEnv }),
      });
    } catch (err) {
      console.warn("Failed to persist developer mode preference:", err);
    }
  };

  // Load Keys for active environment
  const loadKeys = useCallback(async () => {
    setIsKeysLoading(true);
    try {
      const res = await fetch(`/api/developer/keys?environment=${environment}`);
      const data = await res.json();
      if (data.success) {
        setKeys(data.data || []);
      }
    } catch (err) {
      console.error("Failed to load keys:", err);
    } finally {
      setIsKeysLoading(false);
    }
  }, [environment]);

  // Load Profile
  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/developer/profile");
      const data = await res.json();
      if (data.success) {
        setDeveloperProfile(data.data);
      }
    } catch (err) {
      console.error("Failed to load developer profile:", err);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadOverview();
      loadProfile();
    }
  }, [status, loadOverview, loadProfile]);

  useEffect(() => {
    if (status === "authenticated" && isModeReady) {
      loadKeys();
    }
  }, [status, environment, isModeReady, loadKeys]);

  if (status === "loading" || (!isModeReady && status === "authenticated")) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <SpinnerGap weight="bold" className="h-9 w-9 animate-spin text-primary" />
        <p className="text-xs font-semibold text-muted-foreground animate-pulse">
          Loading Developer Hub...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Floating Side Slide-In Notification Toast */}
      {toastNotification && (
        <div
          className={`fixed top-6 right-6 z-[999999] max-w-sm w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-6 duration-300 flex items-start gap-3 text-left ${
            toastNotification.type === "error"
              ? "bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/30 text-rose-100 shadow-rose-950/40"
              : "bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
              toastNotification.type === "error"
                ? "bg-rose-500/20 text-rose-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}
          >
            {toastNotification.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider mb-0.5">
              {toastNotification.title}
            </h4>
            <p className="text-xs leading-relaxed opacity-90">{toastNotification.message}</p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 1. Header with Switch Toggle & Hub Links */}
      <DeveloperConsoleHeader
        environment={environment}
        onToggleEnvironment={handleToggleEnvironment}
        liveApprovalStatus={developerProfile?.status}
      />

      {/* Pending Compliance Review Banner */}
      {developerProfile?.status === "PENDING_APPROVAL" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-amber-500 animate-pulse shrink-0" />
            <span>
              <strong>Live Mode Under Review:</strong> Your application for &quot;{developerProfile.businessName}&quot; is currently being verified by our compliance team. Live keys will unlock immediately once approved.
            </span>
          </div>
          <button
            onClick={() => setIsLiveActivationOpen(true)}
            className="self-start sm:self-auto rounded-lg bg-amber-500/20 px-3 py-1.5 font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            View Details
          </button>
        </div>
      )}

      {/* 2. Standalone Rounded Metric Stat Cards (Balance, Total Spent, Calls Today) */}
      <DeveloperMetricCards
        environment={environment}
        walletBalance={stats.walletBalance}
        sandboxBalance={stats.sandboxBalance}
        totalSpent={environment === "LIVE" ? stats.totalSpentLive : stats.totalSpentTest}
        totalCallsToday={stats.totalCallsToday}
        successfulCallsToday={stats.successfulCallsToday}
        failedCallsToday={stats.failedCallsToday}
        successRate={stats.successRate}
        onResetSandboxSuccess={loadOverview}
      />

      {/* 3. API Keys Management Section (Full-Width Stretched) */}
      <ApiKeyManager
        environment={environment}
        keys={keys}
        isLoading={isKeysLoading}
        onRefreshKeys={() => {
          loadKeys();
          loadOverview();
        }}
        onRequestLiveAccess={() => setIsLiveActivationOpen(true)}
        liveApprovalStatus={developerProfile?.status}
      />

      {/* 4. Webhook Configuration Section */}
      <WebhookConfigCard environment={environment} />

      {/* 5. Real-Time API Request History (Payloads Sent & Responses Returned) */}
      <RequestStreamTable environment={environment} />

      {/* 6. Live Mode Compliance Modal */}
      <LiveActivationModal
        isOpen={isLiveActivationOpen}
        onClose={() => setIsLiveActivationOpen(false)}
        onSuccess={(toastData) => {
          loadProfile();
          loadOverview();
          if (toastData) {
            setToastNotification(toastData);
          }
        }}
        currentProfile={developerProfile}
      />
    </div>
  );
}
