"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  ChartPieSlice, Folders, UsersThree, ShieldCheck, 
  Wallet, GearSix, Scroll, List, X, SignOut, 
  MagnifyingGlass, CaretRight
} from "@phosphor-icons/react";

interface MdsShellProps {
  children: React.ReactNode;
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export default function MdsDashboardShell({ children, user }: MdsShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigationGroups = [
    {
      title: "Executive Management",
      items: [
        { name: "Overview Dashboard", href: "/quadrox-lorabiz-team/mds/dashboard", icon: ChartPieSlice },
        { name: "All Applications & Filings", href: "/quadrox-lorabiz-team/mds/dashboard/filings", icon: Folders, badge: "Active" },
        { name: "Client Directory & Wallets", href: "/quadrox-lorabiz-team/mds/dashboard/users", icon: UsersThree },
        { name: "Financial Ledger", href: "/quadrox-lorabiz-team/mds/dashboard/ledger", icon: Wallet },
      ]
    },
    {
      title: "System & Governance",
      items: [
        { name: "Staff Processing Team", href: "/quadrox-lorabiz-team/mds/dashboard/staff", icon: ShieldCheck },
        { name: "Service Settings", href: "/quadrox-lorabiz-team/mds/dashboard/services", icon: GearSix },
        { name: "Activity Ledger", href: "/quadrox-lorabiz-team/mds/dashboard/audit", icon: Scroll },
      ]
    }
  ];

  const NavLinks = () => (
    <div className="space-y-6">
      {navigationGroups.map((group, idx) => (
        <div key={idx}>
          <p className="px-3 text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">
            {group.title}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-900 text-white font-semibold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      weight={isActive ? "fill" : "regular"} 
                      className={`h-5 w-5 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900"}`} 
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col lg:flex-row font-sans">
      
      {/* MOBILE TOP BAR */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 focus:outline-none"
          >
            <List className="h-5 w-5" />
          </button>
          <Image src="/logo.png" alt="LoraBiz Logo" width={110} height={32} className="object-contain h-7 w-auto" />
        </div>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
          Executive Clearance
        </span>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-white border-r border-slate-200 p-6 flex flex-col justify-between z-10 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
                <Image src="/logo.png" alt="Logo" width={130} height={36} className="object-contain h-8 w-auto" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks />
            </div>

            <div className="pt-6 border-t border-slate-100 mt-auto">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: "/quadrox-lorabiz-team/mds/login" })}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Sign Out"
                >
                  <SignOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white border-r border-slate-200 p-6 flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm">
        <div>
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <Image src="/logo.png" alt="LoraBiz Logo" width={140} height={40} className="object-contain h-8 w-auto" />
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
              MD
            </span>
          </div>

          <NavLinks />
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="truncate pr-2">
              <p className="text-sm font-semibold text-slate-900 truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/quadrox-lorabiz-team/mds/login" })}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
              title="Sign Out"
            >
              <SignOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* DESKTOP TOP HEADER */}
        <header className="hidden lg:flex h-16 border-b border-slate-200 px-8 items-center justify-between bg-white sticky top-0 z-30">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>LoraBiz Command</span>
            <CaretRight className="h-4 w-4 text-slate-400" />
            <span className="text-slate-900 font-semibold capitalize">{pathname.split("/").pop() || "Overview"}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search registration, customer name..." 
                className="pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white w-72 transition"
              />
            </div>
            <div className="h-5 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Verified Session</span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
