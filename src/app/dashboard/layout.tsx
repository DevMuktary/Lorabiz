"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  SquaresFour, Briefcase, Buildings, ShieldCheck, Copyright, 
  Handshake, IdentificationCard, DeviceMobile, CreditCard, 
  UserCircle, SignOut, Bell, List, X 
} from "@phosphor-icons/react";

const NAVIGATION = [
  {
    category: "Main",
    links: [
      { name: "Service Hub", href: "/dashboard", icon: SquaresFour },
      { name: "My Applications", href: "/dashboard/applications", icon: Briefcase },
    ]
  },
  {
    category: "Available Services",
    links: [
      { name: "CAC Registration", href: "/dashboard/cac", icon: Buildings },
    ]
  },
  {
    category: "Upcoming Services",
    links: [
      { name: "SCUML", href: "/dashboard/coming-soon?service=SCUML", icon: ShieldCheck },
      { name: "Trademark (IPO)", href: "/dashboard/coming-soon?service=Trademark", icon: Copyright },
      { name: "SMEDAN", href: "/dashboard/coming-soon?service=SMEDAN", icon: Handshake },
      { name: "NIN Services", href: "/dashboard/coming-soon?service=NIMC", icon: IdentificationCard },
      { name: "Utility & Airtime", href: "/dashboard/coming-soon?service=Utilities", icon: DeviceMobile },
    ]
  },
  {
    category: "Management",
    links: [
      { name: "Wallet & Billing", href: "/dashboard/wallet", icon: CreditCard },
      { name: "Profile Settings", href: "/dashboard/settings", icon: UserCircle },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const getCurrentPageName = () => {
    // Check main nav links
    for (const group of NAVIGATION) {
      const found = group.links.find(link => link.href === pathname);
      if (found) return found.name;
    }
    // Fallbacks for sub-routes
    if (pathname.includes("/dashboard/cac")) return "CAC Services";
    if (pathname.includes("/dashboard/coming-soon")) return "Coming Soon";
    return "Dashboard";
  };

  const getUserInitials = () => {
    if (session?.user?.name) {
      const names = session.user.name.split(" ");
      if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
      return session.user.name.substring(0, 2).toUpperCase();
    }
    return null;
  };

  const initials = getUserInitials();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background font-sans selection:bg-primary selection:text-white transition-colors duration-300">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-[99990] lg:hidden backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[99995] w-[260px] bg-white dark:bg-card border-r border-slate-200 dark:border-border 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        ${isDesktopSidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-border shrink-0">
          <Image 
            src="/logo.png" 
            alt="Lumebiz" 
            width={120} 
            height={32} 
            className="h-7 w-auto object-contain dark:brightness-200 dark:contrast-100" 
            priority
          />
          <button 
            className="lg:hidden text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar">
          {NAVIGATION.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                {group.category}
              </h3>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  // If it's the exact overview page, strictly match. Otherwise match sub-paths.
                  const isActive = link.href === "/dashboard" 
                    ? pathname === "/dashboard" 
                    : pathname.startsWith(link.href.split('?')[0]); 
                  
                  const Icon = link.icon;
                  
                  return (
                    <Link 
                      key={link.name} 
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group
                        ${isActive 
                          ? "bg-primary/10 text-primary dark:bg-primary/20" 
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-[18px] w-[18px] transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`} 
                      />
                      <span className="text-[13px] font-bold">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-border shrink-0">
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-500 transition-all duration-200 group cursor-pointer"
          >
            <SignOut className="h-[18px] w-[18px] text-slate-400 dark:text-slate-500 group-hover:text-red-500 transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </aside>

      <div className={`
        flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out
        ${isDesktopSidebarCollapsed ? "lg:pl-0" : "lg:pl-[260px]"}
      `}>
        
        <header className={`
          sticky top-0 z-10 h-20 bg-white/80 dark:bg-card/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-border 
          flex items-center justify-between px-6 lg:px-8 shrink-0 
          transition-transform duration-300 ease-in-out
          ${showHeader ? "translate-y-0" : "-translate-y-full"}
        `}>
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>
            
            <button 
              className="hidden lg:block p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>

            <h2 className="text-lg font-black text-slate-800 dark:text-white hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-primary transition-colors rounded-full hover:bg-primary/10 cursor-pointer">
              <Bell className="h-5 w-5" weight="bold" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-primary rounded-full border-2 border-white dark:border-card"></span>
            </button>

            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-[#ff7b9f] flex items-center justify-center text-white text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition-opacity">
              {initials ? (
                initials
              ) : (
                <UserCircle weight="fill" className="h-5 w-5 text-white/90" />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
