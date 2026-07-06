import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Users, Buildings, Wallet, ArrowUpRight, 
  TrendUp, ShieldCheck, Clock, FileText, CheckCircle,
  Pulse, CaretRight
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function ExecutiveDashboardPage() {
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
    <div className="relative space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-16">
      
      {/* AMBIENT SURFACE BACKLIGHTING */}
      <div className="absolute top-0 left-1/4 -z-10 w-96 h-96 bg-teal-500/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-40 right-10 -z-10 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* EXECUTIVE HERO DECK */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium tracking-wide text-zinc-300 uppercase">
              Corporate Governance & Operations
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
            Executive Command Suite
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl font-light leading-relaxed">
            Real-time regulatory processing oversight, client ledger liquidity, and cryptographic security verification across LoraBiz.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0">
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="group relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-zinc-950 text-xs font-semibold tracking-wide transition-all duration-200 hover:bg-zinc-100 active:scale-[0.98] shadow-lg shadow-white/5"
          >
            <Wallet weight="bold" className="h-4 w-4 text-zinc-800 group-hover:text-black transition-colors" />
            <span>Manage Client Ledgers</span>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/filings"
            className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-white text-xs font-medium tracking-wide transition-all duration-200 active:scale-[0.98]"
          >
            <span>Filings Queue</span>
            <CaretRight weight="bold" className="h-3.5 w-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* STRATEGIC KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI Card 1: Client Base */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 border border-white/[0.08] shadow-2xl shadow-black/40 flex flex-col justify-between group hover:border-white/[0.15] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Total Client Base</span>
            <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.05] text-zinc-300 group-hover:text-white transition-colors">
              <Users weight="regular" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-8">
            <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tighter block">
              {totalClients.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <TrendUp weight="bold" className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-light text-zinc-300">Registered business owners</span>
            </div>
          </div>
        </div>

        {/* KPI Card 2: Personnel */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 border border-white/[0.08] shadow-2xl shadow-black/40 flex flex-col justify-between group hover:border-white/[0.15] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Compliance Personnel</span>
            <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.05] text-zinc-300 group-hover:text-white transition-colors">
              <Buildings weight="regular" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-8">
            <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tighter block">
              {activeStaff.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <CheckCircle weight="fill" className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-light text-zinc-300">Active operational clearance</span>
            </div>
          </div>
        </div>

        {/* KPI Card 3: Security Perimeter */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 border border-white/[0.08] shadow-2xl shadow-black/40 flex flex-col justify-between group hover:border-white/[0.15] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">Access Perimeter</span>
            <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.05] text-emerald-400 group-hover:text-emerald-300 transition-colors">
              <ShieldCheck weight="regular" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-8">
            <span className="text-2xl sm:text-3xl font-semibold text-emerald-400 tracking-tight block">
              100% Locked
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <span className="font-light text-zinc-300">2FA verification mandatory</span>
            </div>
          </div>
        </div>

        {/* KPI Card 4: Processing Throughput */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 border border-white/[0.08] shadow-2xl shadow-black/40 flex flex-col justify-between group hover:border-white/[0.15] transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-400">CAC Pipelines</span>
            <div className="p-2 rounded-lg bg-white/[0.05] border border-white/[0.05] text-zinc-300 group-hover:text-white transition-colors">
              <Pulse weight="regular" className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="mt-8">
            <span className="text-2xl sm:text-3xl font-semibold text-white tracking-tight block">
              Operational
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
              <Clock weight="bold" className="h-3.5 w-3.5 text-teal-400 shrink-0" />
              <span className="font-light text-zinc-300">Real-time government sync</span>
            </div>
          </div>
        </div>

      </div>

      {/* STRATEGIC SHORTCUTS DECK */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-medium tracking-tight text-white uppercase tracking-widest">
            Executive Control Actions
          </h2>
          <span className="text-xs text-zinc-500 font-light">Rapid organizational management</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Action 1 */}
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white group-hover:scale-105 transition-transform duration-300">
                  <Wallet weight="regular" className="h-5 w-5" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <ArrowUpRight weight="bold" className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight">Client Directory & Wallets</h3>
              <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                Inspect organizational profiles, adjust wallet ledgers, credit customer accounts, and process financial adjustments.
              </p>
            </div>
          </Link>

          {/* Action 2 */}
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/staff"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white group-hover:scale-105 transition-transform duration-300">
                  <Users weight="regular" className="h-5 w-5" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <ArrowUpRight weight="bold" className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight">Staff Governance</h3>
              <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                Onboard processing officers, delegate operational queues, update security clearances, and manage personnel tier access.
              </p>
            </div>
          </Link>

          {/* Action 3 */}
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/filings"
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent p-6 border border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.05] transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white group-hover:scale-105 transition-transform duration-300">
                  <FileText weight="regular" className="h-5 w-5" />
                </div>
                <div className="h-8 w-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
                  <ArrowUpRight weight="bold" className="h-4 w-4 text-zinc-400 group-hover:text-black transition-colors" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-white tracking-tight">Global Filings Master</h3>
              <p className="text-xs text-zinc-400 mt-2 font-light leading-relaxed">
                Oversee enterprise incorporation throughput, track pending CAC queries, and verify compliance turnaround times.
              </p>
            </div>
          </Link>

        </div>
      </div>

      {/* LIVE AUDIT AND PRODUCTIVITY LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
        
        {/* Access Authorization Feed */}
        <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.07] p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Recent Session Authorizations</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">Verified executive and staff logins</p>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/audit" className="text-xs font-medium text-zinc-300 hover:text-white transition-colors">
                View Ledger &rarr;
              </Link>
            </div>

            {recentLogins.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-light">No recent login sessions logged.</div>
            ) : (
              <div className="space-y-2.5">
                {recentLogins.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow-sm shadow-emerald-400/50" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-white truncate">{log.email}</p>
                        <p className="text-[11px] text-zinc-400 font-light mt-0.5 truncate capitalize">
                          {log.role?.toLowerCase() || "team member"} &bull; Two-Factor Verified
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Staff Operations Feed */}
        <div className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.07] p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-5 mb-5 border-b border-white/[0.06]">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight">Personnel Productivity Feed</h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">Live work output submitted by compliance officers</p>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/staff" className="text-xs font-medium text-zinc-300 hover:text-white transition-colors">
                Staff Governance &rarr;
              </Link>
            </div>

            {recentActions.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-light">No operational actions recorded today.</div>
            ) : (
              <div className="space-y-2.5">
                {recentActions.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-light mt-0.5 truncate">
                        {log.action.replace(/_/g, " ")} {log.targetId ? `(#${log.targetId.slice(-6)})` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 shrink-0">
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
