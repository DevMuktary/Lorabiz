"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  ChartPieSlice, Folders, UsersThree, ShieldCheck, 
  Wallet, GearSix, Scroll, List, X, SignOut, 
  Bell, MagnifyingGlass, CaretRight, CheckCircle
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
      title: "Core Operations",
      items: [
        { name: "Executive Command", href: "/quadrox-lorabiz-team/mds/dashboard", icon: ChartPieSlice },
        { name: "Global Filings Queue", href: "/quadrox-lorabiz-team/mds/dashboard/filings", icon: Folders, badge: "Live" },
        { name: "Client & Wallet Ledger", href: "/quadrox-lorabiz-team/mds/dashboard/users", icon: UsersThree },
        { name: "Financial Settlements", href: "/quadrox-lorabiz-team/mds/dashboard/ledger", icon: Wallet },
      ]
    },
    {
      title: "Governance & System",
      items: [
        { name: "Staff & Clearance", href: "/quadrox-lorabiz-team/mds/dashboard/staff", icon: ShieldCheck },
        { name: "Service Gateways", href: "/quadrox-lorabiz-team/mds/dashboard/services", icon: GearSix },
        { name: "Cryptographic Audit Log", href: "/quadrox-lorabiz-team/mds/dashboard/audit", icon: Scroll },
      ]
    }
  ];

  const NavLinks = () => (
    <div className="space-y-8">
      {navigationGroups.map((group, idx) => (
        <div key={idx}>
          <p className="px-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-2">
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
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon 
                      weight={isActive ? "fill" : "regular"} 
                      className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"}`} 
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
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
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col lg:flex-row selection:bg-teal-500 selection:text-black">
      
      {/* MOBILE TOP NAVIGATION BAR */}
      <header className="lg:hidden sticky top-0 z-40 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800/80 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white focus:outline-none"
            aria-label="Open Navigation"
          >
            <List className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-slate-200">MD Command</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-teal-400 bg-teal-950/50 border border-teal-800/60 px-2 py-1 rounded-md">
            2FA Active
          </span>
        </div>
      </header>

      {/* MOBILE OVERLAY DRAWER */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#0c121e] border-r border-slate-800/80 p-6 flex flex-col justify-between z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
                <Image src="/logo.png" alt="Logo" width={120} height={35} className="brightness-200 object-contain h-7 w-auto" />
                <button 
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <NavLinks />
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-auto">
              <div className="flex items-center justify-between">
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-[11px] font-mono text-slate-500 truncate">{user.email}</p>
                </div>
                <button 
                  onClick={() => signOut({ callbackUrl: "/quadrox-lorabiz-team/mds/login" })}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Sign Out"
                >
                  <SignOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-[#0c121e] border-r border-slate-800/80 p-6 flex-col justify-between shrink-0 h-screen sticky top-0">
        <div>
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
            <Image src="/logo.png" alt="LoraBiz Logo" width={140} height={40} className="brightness-200 object-contain h-8 w-auto" />
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20 tracking-wider">
              MD Level
            </span>
          </div>

          <div className="mb-6 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">System Gateways</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-bold">100% Secure</span>
          </div>

          <NavLinks />
        </div>

        <div className="pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{user.firstName} {user.lastName}</p>
              <p className="text-[10px] font-mono text-slate-500 truncate">{user.email}</p>
            </div>
            <button 
              onClick={() => signOut({ callbackUrl: "/quadrox-lorabiz-team/mds/login" })}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition shrink-0"
              title="Sign Out"
            >
              <SignOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE SHELL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* DESKTOP TOP BAR */}
        <header className="hidden lg:flex h-16 border-b border-slate-800/80 px-8 items-center justify-between bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span>Quadrox Platform</span>
            <CaretRight className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-slate-200 capitalize">{pathname.split("/").pop() || "Overview"}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search Reg ID, User Email, TIN..." 
                className="pl-9 pr-4 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 w-64 transition"
              />
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-1.5 text-xs text-teal-400 font-mono bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-lg">
              <CheckCircle weight="fill" className="h-3.5 w-3.5" />
              <span>MFA Clearance Active</span>
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>

    </div>
  );
}
