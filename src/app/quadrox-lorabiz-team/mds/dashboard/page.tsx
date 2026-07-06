import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Users, Briefcase, ShieldAlert, ArrowUpRight, 
  Lightning, CheckCircle, WarningCircle, Clock
} from "@phosphor-icons/react/dist/ssr";

export const dynamic = "force-dynamic";

export default async function MdsDashboardOverviewPage() {
  const [
    totalUsers,
    totalStaff,
    recentSecurityLogs,
    recentStaffActions,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "STAFF" } }),
    prisma.securityAuditLog.findMany({
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
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/80 to-[#0c121e] p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Live Telemetry
            </span>
            <span className="text-xs text-slate-400 font-mono">UTC+1 (Lagos Ops)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Executive Command Deck</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
            Real-time regulatory processing throughput, financial ledger settlements, and cryptographic access logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold transition shadow-lg shadow-teal-500/10"
          >
            <Lightning weight="fill" className="h-4 w-4" />
            <span>Fund Wallet / Manage User</span>
          </Link>
        </div>
      </div>

      {/* METRICS DECK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Clients</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-teal-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {totalUsers.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400 font-medium">
              <span>Verified Accounts active</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Compliance Personnel</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-teal-400">
              <Briefcase className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {totalStaff.toLocaleString()}
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-medium">
              <span>Cleared operational officers</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gateway Firewall</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400">
              <CheckCircle weight="fill" className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">
              Airtight Protection
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400 font-medium">
              <span>Zero brute-force breakthroughs</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 shadow-sm flex flex-col justify-between hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Upstream Pipelines</span>
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-teal-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Normal Latency
            </span>
            <div className="flex items-center gap-1 mt-1 text-[11px] text-teal-400 font-medium">
              <span>CAC & NIMC APIs responding</span>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK COMMAND LAUNCHPAD */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Rapid Operational Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="group p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/50 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white group-hover:text-teal-400 transition">Adjust Client Ledger</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition" />
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Credit user wallets, inspect payment hashes, or freeze accounts pending compliance verification.
              </p>
            </div>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/staff"
            className="group p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/50 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white group-hover:text-teal-400 transition">Personnel Governance</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition" />
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Issue staff credentials, assign queue clearances, or immediately terminate compromised accounts.
              </p>
            </div>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/services"
            className="group p-5 rounded-2xl bg-[#0c121e] border border-slate-800/80 hover:border-teal-500/50 hover:bg-slate-900/50 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white group-hover:text-teal-400 transition">Service Circuit Breakers</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500 group-hover:text-teal-400 transition" />
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Immediately suspend user application submissions if third-party government portals experience outages.
              </p>
            </div>
          </Link>

        </div>
      </div>

      {/* LIVE AUDIT TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security Access Feed */}
        <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Live Authentication Audit</h3>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/audit" className="text-xs text-teal-400 hover:underline font-medium">
                Full Log
              </Link>
            </div>

            {recentSecurityLogs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No telemetry records present.</div>
            ) : (
              <div className="space-y-2.5">
                {recentSecurityLogs.map((log) => {
                  const isFail = log.event.includes("FAILED") || log.event.includes("LOCKOUT");
                  return (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isFail ? "bg-rose-500" : "bg-emerald-400"}`} />
                          <p className="text-xs font-bold text-white truncate font-mono">{log.email}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {log.event} &bull; <span className="font-mono text-slate-500">{log.ipAddress}</span>
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Staff Operations Feed */}
        <div className="bg-[#0c121e] border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4.5 w-4.5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Officer Operations Ledger</h3>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/staff" className="text-xs text-teal-400 hover:underline font-medium">
                Manage Staff
              </Link>
            </div>

            {recentStaffActions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">No staff processing actions logged yet.</div>
            ) : (
              <div className="space-y-2.5">
                {recentStaffActions.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/60 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                      <p className="text-[11px] text-teal-400 font-medium mt-0.5 truncate">
                        {log.action} {log.targetId ? `(ID: ${log.targetId})` : ""}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
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
