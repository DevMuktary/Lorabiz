"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { DeveloperConsoleHeader } from "@/components/features/developer/DeveloperConsoleHeader";
import { DeveloperMetricCards } from "@/components/features/developer/DeveloperMetricCards";
import { ApiKeyManager, ApiKeyItem } from "@/components/features/developer/ApiKeyManager";
import { WebhookConfigCard } from "@/components/features/developer/WebhookConfigCard";
import { RequestStreamTable } from "@/components/features/developer/RequestStreamTable";
import { LiveActivationModal } from "@/components/features/developer/LiveActivationModal";

export default function DeveloperDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [environment, setEnvironment] = useState<"LIVE" | "TEST">("TEST");
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

  // Authentication gate
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/dashboard/developer");
    }
  }, [status, router]);

  // Load Overview Stats
  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch("/api/developer/overview");
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.activeMode) {
          setEnvironment(data.data.activeMode);
        }
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

  // Handle Environment Toggle with PostgreSQL persistence
  const handleToggleEnvironment = async (newEnv: "LIVE" | "TEST") => {
    if (newEnv === "LIVE" && developerProfile?.status !== "APPROVED") {
      setIsLiveActivationOpen(true);
      return;
    }

    setEnvironment(newEnv);

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
    if (status === "authenticated") {
      loadKeys();
    }
  }, [status, environment, loadKeys]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-xs text-muted-foreground animate-pulse">Loading Developer Hub...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* 1. Header with Switch Toggle & Hub Links */}
      <DeveloperConsoleHeader
        environment={environment}
        onToggleEnvironment={handleToggleEnvironment}
        liveApprovalStatus={developerProfile?.status}
      />

      {/* 2. Real-Time Metric Stat Cards (Balance, Total Spent, Calls Today) */}
      <DeveloperMetricCards
        environment={environment}
        walletBalance={stats.walletBalance}
        sandboxBalance={stats.sandboxBalance}
        totalSpent={environment === "LIVE" ? stats.totalSpentLive : stats.totalSpentTest}
        totalCallsToday={stats.totalCallsToday}
        successfulCallsToday={stats.successfulCallsToday}
        failedCallsToday={stats.failedCallsToday}
        successRate={stats.successRate}
      />

      {/* 3. API Keys Management Section */}
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
      <WebhookConfigCard />

      {/* 5. Real-Time HTTP Request Stream Logs Table (API Debugger) */}
      <RequestStreamTable environment={environment} />

      {/* 6. Live Mode 1-Minute Compliance Modal */}
      <LiveActivationModal
        isOpen={isLiveActivationOpen}
        onClose={() => setIsLiveActivationOpen(false)}
        onSuccess={() => {
          loadProfile();
          loadOverview();
        }}
        currentProfile={developerProfile}
      />
    </div>
  );
}
