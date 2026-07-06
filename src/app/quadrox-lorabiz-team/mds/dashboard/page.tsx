import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Users, Buildings, Wallet, ArrowUpRight, 
  TrendUp, ShieldCheck, Clock, FileText, CheckCircle
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
    <div className="space-y-8">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor client registrations, fund wallets, and manage processing staff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition shadow-sm"
          >
            <Wallet weight="bold" className="h-4 w-4" />
            <span>Fund / Manage Wallets</span>
          </Link>
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/filings"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition shadow-sm"
          >
            <span>Review Applications</span>
            <ArrowUpRight weight="bold" className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Client Accounts</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Users weight="bold" className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-3xl font-bold text-slate-900 block">
              {totalClients.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
              <TrendUp weight="bold" className="h-4 w-4" />
              <span>Registered business owners</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Processing Personnel</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Buildings weight="bold" className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-3xl font-bold text-slate-900 block">
              {activeStaff.toLocaleString()}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-600">
              <CheckCircle weight="fill" className="h-4 w-4 text-emerald-600" />
              <span>Active compliance officers</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Portal Security</span>
            <div className="p-2 rounded-xl bg-slate-100 text-emerald-600">
              <ShieldCheck weight="bold" className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-2xl font-bold text-slate-900 block">
              2FA Active
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
              <span>All staff accounts protected</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CAC Sync Status</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Clock weight="bold" className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6">
            <span className="text-2xl font-bold text-slate-900 block">
              Operational
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-emerald-600">
              <span>Ready for new submissions</span>
            </div>
          </div>
        </div>

      </div>

      {/* SHORTCUT CARDS */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Quick Operations</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/users"
            className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-900 text-white">
                  <Wallet weight="bold" className="h-5 w-5" />
                </div>
                <ArrowUpRight weight="bold" className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Clients & Wallet Funding</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Look up customer profiles, manually credit wallet balances, check payment hashes, and issue billing adjustments.
              </p>
            </div>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/staff"
            className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-900 text-white">
                  <Users weight="bold" className="h-5 w-5" />
                </div>
                <ArrowUpRight weight="bold" className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Staff Team Manager</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Create login credentials for new processing staff, assign compliance duties, or revoke portal access immediately.
              </p>
            </div>
          </Link>

          <Link
            href="/quadrox-lorabiz-team/mds/dashboard/filings"
            className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-slate-900 text-white">
                  <FileText weight="bold" className="h-5 w-5" />
                </div>
                <ArrowUpRight weight="bold" className="h-5 w-5 text-slate-400 group-hover:text-slate-900 transition" />
              </div>
              <h3 className="text-base font-bold text-slate-900">All Filings Queue</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Inspect all pending Business Names, Companies (LLCs), and Trademark registrations submitted by users.
              </p>
            </div>
          </Link>

        </div>
      </div>

      {/* ACTIVITY & LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Team Logins</h3>
                <p className="text-xs text-slate-500 mt-0.5">Successful 2FA sessions</p>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/audit" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                View All &rarr;
              </Link>
            </div>

            {recentLogins.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No recent login sessions recorded.</div>
            ) : (
              <div className="space-y-3">
                {recentLogins.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{log.email}</p>
                        <p className="text-xs text-slate-500 mt-0.5 capitalize">
                          {log.role?.toLowerCase() || "team member"} &bull; Verified via 2FA
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-slate-400 shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Staff Work</h3>
                <p className="text-xs text-slate-500 mt-0.5">Actions logged by compliance officers</p>
              </div>
              <Link href="/quadrox-lorabiz-team/mds/dashboard/staff" className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                Staff Activity &rarr;
              </Link>
            </div>

            {recentActions.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No staff processing actions recorded today.</div>
            ) : (
              <div className="space-y-3">
                {recentActions.map((log) => (
                  <div key={log.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {log.user.firstName} {log.user.lastName}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">
                        {log.action.replace(/_/g, " ")} {log.targetId ? `(#${log.targetId.slice(-6)})` : ""}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-400 shrink-0">
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
