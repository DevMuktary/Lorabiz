import React from "react";
import { prisma } from "@/lib/prisma";
import ClientDirectory from "./ClientDirectory";

export const dynamic = "force-dynamic";

export default async function ManageUsersPage() {
  // 1. Fetch all users excluding MDs/Staff, explicitly excluding password hashes
  const usersRaw = await prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { createdAt: "desc" },
    // Ensure we select everything BUT the password hash to maintain security
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      twoFactorEnabled: true,
      createdAt: true,
      // Add walletBalance and isSuspended here if they exist in your Prisma schema
      // walletBalance: true,
      // isSuspended: true, 
    },
  });

  // 2. Map data to ensure safe defaults for the UI
  const users = usersRaw.map((u) => ({
    ...u,
    walletBalance: (u as any).walletBalance || 0, // Fallback if wallet feature is still pending
    isSuspended: (u as any).isSuspended || false, // Fallback if suspension feature is pending
  }));

  // 3. Calculate Executive Metrics
  const totalUsers = users.length;
  const totalLiquidity = users.reduce((sum, user) => sum + (user.walletBalance || 0), 0);
  const suspendedCount = users.filter((u) => u.isSuspended).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Client Directory & Wallets
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Search registered clients, inspect full dossier details, and manually manage financial wallet ledgers.
        </p>
      </div>

      {/* Interactive Client Component */}
      <ClientDirectory 
        users={users} 
        metrics={{ totalUsers, totalLiquidity, suspendedCount }} 
      />

    </div>
  );
}
