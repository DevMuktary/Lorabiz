"use client";

import React, { useState } from "react";
import { 
  MagnifyingGlass, Funnel, X, Wallet, ShieldCheck, 
  Prohibit, CheckCircle, Receipt, ArrowDown, ArrowUp, User
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

type ClientUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone?: string | null;
  role: string;
  walletBalance?: number;
  isSuspended?: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  [key: string]: any; // Catch-all for other registration details
};

interface ClientDirectoryProps {
  users: ClientUser[];
  metrics: {
    totalUsers: number;
    totalLiquidity: number;
    suspendedCount: number;
  };
}

export default function ClientDirectory({ users, metrics }: ClientDirectoryProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<ClientUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filtering Logic
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) || 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "ACTIVE") return matchesSearch && !user.isSuspended;
    if (filter === "SUSPENDED") return matchesSearch && user.isSuspended;
    return matchesSearch;
  });

  const openDrawer = (user: ClientUser) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedUser(null), 300); // Wait for slide-out animation
  };

  return (
    <div className="space-y-8">
      
      {/* TOP METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clients</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{metrics.totalUsers.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Wallet Liquidity</p>
          <p className="text-3xl font-bold text-emerald-600 mt-2">₦{(metrics.totalLiquidity || 0).toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspended Accounts</p>
          <p className="text-3xl font-bold text-rose-600 mt-2">{metrics.suspendedCount.toLocaleString()}</p>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-96">
          <MagnifyingGlass className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Funnel className="h-4 w-4 text-slate-400" />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto py-2.5 pl-3 pr-8 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-slate-400 focus:bg-white transition appearance-none"
          >
            <option value="ALL">All Accounts</option>
            <option value="ACTIVE">Active Only</option>
            <option value="SUSPENDED">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-6 py-4">Client Details</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4">Wallet Balance</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    No clients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">
                        ₦{(user.walletBalance || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.isSuspended ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <Prohibit className="h-3.5 w-3.5" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="h-3.5 w-3.5" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline" 
                        onClick={() => openDrawer(user)}
                        className="h-9 px-4 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLIDE-OUT DRAWER OVERLAY */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={closeDrawer} 
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Client Dossier</h2>
                <p className="text-sm text-slate-500 mt-1">Manage profile, wallet, and access.</p>
              </div>
              <button onClick={closeDrawer} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Profile Details (Shows everything except password) */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-900">
                  <User className="h-4 w-4 text-slate-400" /> Full Registration Details
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 grid grid-cols-2 gap-y-4 gap-x-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">First Name</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.firstName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Last Name</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.lastName || "N/A"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
                    <p className="text-sm font-medium text-slate-900">{selectedUser.phone || "Not Provided"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Security</p>
                    <p className="text-sm font-medium text-slate-900">
                      {selectedUser.twoFactorEnabled ? "2FA Enrolled" : "Password Only"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Wallet Management */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-900">
                  <Wallet className="h-4 w-4 text-slate-400" /> Wallet Management
                </div>
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <p className="text-sm font-medium text-slate-600">Current Balance</p>
                    <p className="text-xl font-bold text-emerald-600">₦{(selectedUser.walletBalance || 0).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 h-10">
                      <ArrowDown className="h-4 w-4 text-emerald-400" /> Credit Funds
                    </Button>
                    <Button variant="outline" className="flex-1 border-slate-300 text-slate-700 flex items-center justify-center gap-2 h-10">
                      <ArrowUp className="h-4 w-4 text-rose-500" /> Debit Funds
                    </Button>
                  </div>
                </div>
              </section>

              {/* Account Governance */}
              <section>
                <div className="flex items-center gap-2 mb-4 text-sm font-bold text-rose-600">
                  <ShieldCheck className="h-4 w-4 text-rose-500" /> Account Governance
                </div>
                <div className="bg-rose-50 rounded-xl border border-rose-200 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-rose-900">
                        {selectedUser.isSuspended ? "Reactivate Account" : "Suspend Account"}
                      </p>
                      <p className="text-xs text-rose-700 mt-1 max-w-[200px]">
                        {selectedUser.isSuspended 
                          ? "Restore their access to the portal and services." 
                          : "Immediately block login access and freeze filings."}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className={`h-9 font-semibold ${
                        selectedUser.isSuspended 
                          ? "border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                          : "border-rose-200 text-rose-700 hover:bg-rose-100"
                      }`}
                    >
                      {selectedUser.isSuspended ? "Activate User" : "Suspend User"}
                    </Button>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
