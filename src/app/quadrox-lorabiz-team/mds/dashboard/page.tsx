import React from "react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MdsDashboardOverviewPage() {
  // Fetch real-time metrics directly from PostgreSQL
  const [
    totalUsers,
    totalStaff,
    recentSecurityLogs,
    recentStaffActions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.securityAuditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffActionLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Overview</h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time platform metrics, security telemetry, and operational shortcuts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-black text-xs font-semibold transition"
          >
            + Fund / Manage User
          </a>
          <a
            href="/quadrox-lorabiz-team/mds/dashboard/services"
            className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            Toggle Services
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Clients</p>
          <p className="text-3xl font-bold text-white mt-3">{totalUsers.toLocaleString()}</p>
          <span className="text-[11px] text-teal-400 mt-2 font-medium">Registered user accounts</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Staff</p>
          <p className="text-3xl font-bold text-white mt-3">{totalStaff.toLocaleString()}</p>
          <span className="text-[11px] text-teal-400 mt-2 font-medium">Compliance processing officers</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">System Security</p>
          <p className="text-2xl font-bold text-emerald-400 mt-3">All Gates Active</p>
          <span className="text-[11px] text-slate-400 mt-2 font-medium">Rate limiters & MFA enforced</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Processing Engine</p>
          <p className="text-2xl font-bold text-white mt-3">Operational</p>
          <span className="text-[11px] text-teal-400 mt-2 font-medium">CAC, TIN, SCUML pipelines</span>
        </div>
      </div>

      {/* Quick Shortcuts Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Executive Controls</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 transition block"
          >
            <h4 className="font-semibold text-white text-sm">Credit / Debit Wallets</h4>
            <p className="text-xs text-slate-400 mt-1">Manually adjust customer ledger balances or issue refunds.</p>
          </a>

          <a
            href="/quadrox-lorabiz-team/mds/dashboard/staff"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 transition block"
          >
            <h4 className="font-semibold text-white text-sm">Onboard / Dismiss Staff</h4>
            <p className="text-xs text-slate-400 mt-1">Create officer accounts or revoke access permissions.</p>
          </a>

          <a
            href="/quadrox-lorabiz-team/mds/dashboard/services"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/50 transition block"
          >
            <h4 className="font-semibold text-white text-sm">Disable Upstream Services</h4>
            <p className="text-xs text-slate-400 mt-1">Turn off CAC or NIN modules during upstream API downtime.</p>
          </a>
        </div>
      </div>

      {/* Live Audit Feeds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Recent Security Logs */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Recent Security Audit Feed</h3>
            <a href="/quadrox-lorabiz-team/mds/dashboard/audit" className="text-xs text-teal-400 hover:underline">View All</a>
          </div>
          {recentSecurityLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No security events logged yet.</p>
          ) : (
            <div className="space-y-3">
              {recentSecurityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-white block">{log.email}</span>
                    <span className="text-slate-400 text-[11px]">{log.event} &bull; {log.ipAddress}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Staff Actions */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-semibold text-white">Recent Officer Actions</h3>
            <a href="/quadrox-lorabiz-team/mds/dashboard/staff" className="text-xs text-teal-400 hover:underline">View Staff Audit</a>
          </div>
          {recentStaffActions.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">No operational staff actions logged yet.</p>
          ) : (
            <div className="space-y-3">
              {recentStaffActions.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <div>
                    <span className="font-semibold text-white block">
                      {log.user.firstName} {log.user.lastName} ({log.user.email})
                    </span>
                    <span className="text-teal-400 text-[11px]">{log.action}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
