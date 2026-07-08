"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Bell,
  Menu,
  X,
  Layers,
  UserSquare2,
  TicketPercent
} from "lucide-react";

export default function MdsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    // Uses NextAuth to sign out and redirect to the specific MDS login page
    await signOut({ callbackUrl: "/quadrox-lorabiz-team/mds/login" });
  };

  const navGroups = [
    {
      title: "Dashboard",
      links: [
        { href: "/quadrox-lorabiz-team/mds/dashboard", icon: <LayoutDashboard size={20} />, label: "Overview" },
        { href: "/quadrox-lorabiz-team/mds/dashboard/financials", icon: <Wallet size={20} />, label: "Financial Analytics" },
      ]
    },
    {
      title: "Management",
      links: [
        { href: "/quadrox-lorabiz-team/mds/dashboard/orders", icon: <Layers size={20} />, label: "Order Pipeline" },
        { href: "/quadrox-lorabiz-team/mds/dashboard/clients", icon: <UserSquare2 size={20} />, label: "Clients Directory" },
        { href: "/quadrox-lorabiz-team/mds/dashboard/staff", icon: <Users size={20} />, label: "Staff Operations" },
      ]
    },
    {
      title: "System & Tools",
      links: [
        { href: "/quadrox-lorabiz-team/mds/dashboard/marketing", icon: <TicketPercent size={20} />, label: "Promo Campaigns" },
        { href: "/quadrox-lorabiz-team/mds/dashboard/settings", icon: <Settings size={20} />, label: "Service Control" },
        { href: "/quadrox-lorabiz-team/mds/dashboard/audit", icon: <ShieldAlert size={20} />, label: "Audit Logs" },
      ]
    }
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
          Quadrox MDS
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 mb-3">
              {group.title}
            </p>
            <nav className="space-y-1">
              {group.links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link 
                    key={link.href}
                    href={link.href} 
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                      isActive 
                        ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
                    }`}
                  >
                    <span className={`mr-3 transition-colors ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}`}>
                      {link.icon}
                    </span>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Secure Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex transition-colors duration-300">
      
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 hidden md:flex flex-col z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Sliding Drawer */}
          <aside className="relative w-72 max-w-[80%] bg-white dark:bg-zinc-900 flex flex-col h-full animate-in slide-in-from-left duration-300 shadow-2xl border-r border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0 z-10 sticky top-0">
          <div className="flex items-center">
            {/* Hamburger Menu (Mobile Only) */}
            <button 
              className="md:hidden p-2 -ml-2 mr-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <h1 className="text-lg sm:text-xl font-semibold truncate hidden sm:block">
              Executive Dashboard
            </h1>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors relative hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
            </button>
            
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Director</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">System Admin</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium text-white shadow-md ring-2 ring-white dark:ring-zinc-900 cursor-pointer hover:bg-indigo-700 transition-colors">
                MD
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 scrollbar-hide">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
