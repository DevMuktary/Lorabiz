import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Users, Buildings, Wallet, ArrowUpRight, 
  TrendUp, ShieldCheck, Clock, FileText, CheckCircle2
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboardPage() {
  // Fetch high-level business intelligence cleanly from PostgreSQL
  const [
    totalClients,
    activeStaff,
    recentLogins,
    recentActions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.securityAuditLog.findMany({
      where: { event: "LOGIN_SUCCESS" },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.staffActionLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
            <span className="text-xs text-slate-500 font-medium">Executive Suite</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Executive Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Monitor enterprise registration volume, review client wallet liquidity, and oversee staff compliance workflows.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Wallet weight="bold" className="h-4 w-4 text-slate-700" />
            <span>Fund & Manage Wallets</span>
          </Link>
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/filings"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-white text-xs font-semibold transition"
          >
            <span>Review Filings</span>
            <ArrowUpRight weight="bold" className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* CORE BUSINESS KPI DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Client Base</span>
            <div className="p-2.5 rounded-xl bg-slate-800/50 text-slate-300">
              <Users weight="bold" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {totalClients.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <TrendUp weight="bold" className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400 font-medium">Registered business owners</span>
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Personnel</span>
            <div className="p-2.5 rounded-xl bg-slate-800/50 text-slate-300">
              <Buildings weight="bold" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">
                {activeStaff.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 weight="fill" className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400 font-medium">Cleared compliance officers</span>
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Security Perimeter</span>
            <div className="p-2.5 rounded-xl bg-slate-800/50 text-emerald-400">
              <ShieldCheck weight="bold" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400 tracking-tight">
                Protected
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Multi-factor access enforced</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 transition duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">CAC Processing</span>
            <div className="p-2.5 rounded-xl bg-slate-800/50 text-slate-300">
              <Clock weight="bold" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white tracking-tight">
                Optimal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Government portal connected</span>
            </p>
          </div>
        </div>

      </div>

      {/* EXECUTIVE OPERATIONAL LAUNCHPAD */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-tight text-white">Management Actions</h2>
          <span className="text-xs text-slate-500 font-medium">Quick organizational shortcuts</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-600 hover:bg-slate-900/80 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-white group-hover:bg-white group-hover:text-slate-950 transition">
                  <Wallet weight="bold" className="h-5 w-5" />
                </div>
                <ArrowUpRight weight="bold" className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Client Directory & Wallets</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Review customer accounts, credit organizational wallet balances, and issue direct billing refunds.
              </p>
            </div>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/staff"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-600 hover:bg-slate-900/80 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-white group-hover:bg-white group-hover:text-slate-950 transition">
                  <Users weight="bold" className="h-5 w-5" />
                </div>
                <ArrowUpRight weight="bold" className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Staff Governance</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Onboard new processing officers, assign compliance queues, or update administrative access privileges.
              </p>
            </div>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/filings"
            className="group p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-slate-600 hover:bg-slate-900/80 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-800/60 text-white group-hover:bg-white group-hover:text-slate-950 transition">
                  <FileText weight="bold" className="h-5 w-5" />
                </div>
                <ArrowUpRight weight="bold" className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">Global Filings Master</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Inspect every active Business Name, LLC, TIN, and Trademark application currently inside your staff processing queue.
              </p>
            </div>
          </Link>

        </div>
      </div>

      {/* RECENT OPERATIONAL ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Executive Access Log */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Recent Executive & Staff Logins</h3>
                <p className="text-xs text-slate-500 mt-0.5">Verified session authorizations across your team</p>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/audit" className="text-xs font-semibold text-slate-300 hover:text-white transition">
                View All
              </Link>
            </div>

            {recentLogins.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">No recent team logins recorded.</div>
            ) : (
              <div className="space-y-3">
                {recentLogins.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{log.email}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate capitalize">
                          {log.role?.toLowerCase() || "team member"} &bull; Verified via 2FA
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Work Output */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Recent Processing Activity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live work actions submitted by compliance officers</p>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/staff" className="text-xs font-semibold text-slate-300 hover:text-white transition">
                Staff Productivity
              </Link>
            </div>

            {recentActions.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500">No staff processing actions recorded today.</div>
            ) : (
              <div className="space-y-3">
                {recentActions.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {log.action.replace(/_/g, " ")} {log.targetId ? `(#${log.targetId.slice(-6)})` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
