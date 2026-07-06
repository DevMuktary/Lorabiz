import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import React from "react";

export default async function MdsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/quadrox-lorabiz-team/mds/login");
  }

  // Enforce strict MFA completion
  if ((session.user as any).mfaVerified === false) {
    redirect("/quadrox-lorabiz-team/verify-2fa?callbackUrl=/quadrox-lorabiz-team/mds/dashboard");
  }

  // Verify ADMIN role directly from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true, firstName: true, lastName: true, email: true },
  });

  if (!user || user.role !== "ADMIN") {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-black">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="h-3 w-3 rounded-full bg-teal-400 animate-pulse shadow-sm shadow-teal-400" />
            <h2 className="font-bold tracking-wider uppercase text-xs text-slate-400">
              Managing Director
            </h2>
          </div>

          <nav className="space-y-1.5 text-sm font-medium">
            <a
              href="/quadrox-lorabiz-team/mds/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              📊 System Overview
            </a>
            <a
              href="/quadrox-lorabiz-team/mds/dashboard/filings"
              className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              <span>📁 All Filings Queue</span>
              <span className="bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold">
                Live
              </span>
            </a>
            <a
              href="/quadrox-lorabiz-team/mds/dashboard/users"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              👥 Clients & Wallets
            </a>
            <a
              href="/quadrox-lorabiz-team/mds/dashboard/staff"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              🛡️ Staff Personnel
            </a>
            <a
              href="/quadrox-lorabiz-team/mds/dashboard/ledger"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              💳 Financial Ledger
            </a>
            <a
              href="/quadrox-lorabiz-team/mds/dashboard/services"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              ⚙️ Service Toggles
            </a>
            <a
              href="/quadrox-lorabiz-team/mds/dashboard/audit"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              📜 Security Audit Feed
            </a>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Executive Officer:</p>
          <p className="truncate font-medium text-white mt-0.5">{user.firstName} {user.lastName}</p>
          <p className="truncate text-slate-500 text-[11px] mb-2">{user.email}</p>
          <span className="inline-block bg-teal-950 text-teal-400 border border-teal-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
            Tier: Executive MD
          </span>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
