import Link from "next/link";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Settings, 
  ShieldAlert, 
  LogOut,
  Bell
} from "lucide-react";

export default function MdsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-800">
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
            Quadrox MDS
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <NavItem href="/quadrox-lorabiz-team/mds/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" active />
          <NavItem href="/quadrox-lorabiz-team/mds/dashboard/financials" icon={<Wallet size={20} />} label="Financials" />
          <NavItem href="/quadrox-lorabiz-team/mds/dashboard/staff" icon={<Users size={20} />} label="Staff Operations" />
          <NavItem href="/quadrox-lorabiz-team/mds/dashboard/settings" icon={<Settings size={20} />} label="Service Control" />
          <NavItem href="/quadrox-lorabiz-team/mds/dashboard/audit" icon={<ShieldAlert size={20} />} label="Audit Logs" />
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors">
            <LogOut size={20} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 lg:px-10 z-10">
          <h1 className="text-xl font-semibold">Executive Summary</h1>
          <div className="flex items-center space-x-4">
            <button className="p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-white dark:border-zinc-900"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-medium text-white shadow-sm">
              MD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active 
          ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </Link>
  );
}
