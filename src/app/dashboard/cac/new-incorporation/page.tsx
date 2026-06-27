"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Plus, 
  Spinner, 
  FileText, 
  Hourglass, 
  WarningCircle, 
  CheckCircle,
  ArrowLeft
} from "@phosphor-icons/react";
import RegistrationsTable from "@/components/dashboard/RegistrationsTable";

export default function RegistrationsHubPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Safe defaults if API hasn't loaded yet
  const stats = dashboardData?.stats || { unsubmitted: 0, pending: 0, queried: 0, approved: 0 };

  return (
    <div className="space-y-10">
      
      {/* 1. HEADER & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="flex flex-col gap-5">
          <Link 
            href="/dashboard/cac"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Back to CAC Hub
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-black text-foreground">New Registrations</h1>
            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
              Track your ongoing applications, respond to queries, or start a new registration.
            </p>
          </div>
        </div>

        <Link 
          href="/dashboard/cac/new-incorporation/new"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-primary-foreground rounded-full font-bold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 shrink-0"
        >
          <Plus weight="bold" className="h-4 w-4" />
          Start New Registration
        </Link>
      </div>

      {/* 2. METRICS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Unsubmitted */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Drafts</p>
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <FileText weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.unsubmitted}
          </p>
        </div>

        {/* Pending */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Pending</p>
            <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Hourglass weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.pending}
          </p>
        </div>

        {/* Queried */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Queried</p>
            <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
              <WarningCircle weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.queried}
          </p>
        </div>

        {/* Approved */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Approved</p>
            <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle weight="duotone" className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">
            {isLoading ? <Spinner className="animate-spin h-6 w-6 text-muted-foreground" /> : stats.approved}
          </p>
        </div>
      </div>

      {/* 3. HISTORY TABLE */}
      <div className="pt-4 border-t border-border">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Spinner className="animate-spin h-8 w-8 mb-4 text-primary" weight="bold" />
            <p className="text-sm font-medium">Loading your applications...</p>
          </div>
        ) : dashboardData?.tableData ? (
          <RegistrationsTable 
            data={dashboardData.tableData} 
            currentPage={dashboardData.currentPage}
            totalPages={dashboardData.totalPages}
            onRefresh={fetchDashboardData} 
          />
        ) : (
          <div className="py-20 text-center text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
            No registrations found. Click "Start New Registration" to begin.
          </div>
        )}
      </div>

    </div>
  );
}
