"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/features/notifications/NotificationBell";
import { 
  SquaresFour, Buildings, ShieldCheck, Copyright, 
  Handshake, IdentificationCard, DeviceMobile, CreditCard, 
  UserCircle, SignOut, List, X, Info, Receipt
} from "@phosphor-icons/react";

type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
  isComingSoon?: boolean;
};

type NavCategory = {
  category: string;
  links: NavLink[];
};

const NAVIGATION: NavCategory[] = [
  {
    category: "Main",
    links: [
      { name: "Service Hub", href: "/dashboard", icon: SquaresFour },
      { name: "Transactions", href: "/dashboard/transactions", icon: Receipt }, // Updated
    ]
  },
  {
    category: "Available Services",
    links: [
      { name: "CAC Registration", href: "/dashboard/cac", icon: Buildings },
      { name: "NIN Services", href: "/dashboard/tools/nin-slip", icon: IdentificationCard },
    ]
  },
  {
    category: "Upcoming Services",
    links: [
      { name: "SCUML", href: "#", icon: ShieldCheck, isComingSoon: true },
      { name: "Trademark (IPO)", href: "#", icon: Copyright, isComingSoon: true },
      { name: "SMEDAN", href: "#", icon: Handshake, isComingSoon: true },
      { name: "Utility & Airtime", href: "#", icon: DeviceMobile, isComingSoon: true },
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
  const [sidebarAlert, setSidebarAlert] = useState<{title: string, message: string} | null>(null);

  useEffect(() => {
    if (sidebarAlert) {
      const timer = setTimeout(() => setSidebarAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [sidebarAlert]);

  const handleSidebarWaitlist = async (serviceName: string) => {
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceName })
      });
      if (res.ok) {
        setSidebarAlert({ title: serviceName, message: "Added to the waitlist! We will notify you once it launches." });
      } else if (res.status === 409) {
        setSidebarAlert({ title: serviceName, message: "You are already on the waitlist!" });
      } else {
        setSidebarAlert({ title: "Oops!", message: "Something went wrong." });
      }
    } catch {
      setSidebarAlert({ title: "Oops!", message: "Network error." });
    }
  };

  const getCurrentPageName = () => {
    for (const group of NAVIGATION) {
      const found = group.links.find(link => link.href === pathname);
      if (found) return found.name;
    }
    if (pathname.includes("/dashboard/cac")) return "CAC Services";
    if (pathname.includes("/dashboard/tools/nin-slip")) return "NIN Services";
    if (pathname.includes("/dashboard/transactions")) return "Transactions";
    return "Dashboard";
  };

  // Robust Initials Extraction
  const getUserInitials = () => {
    // 1. Try name first
    if (session?.user?.name && session.user.name.trim() !== "") {
      const names = session.user.name.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    // 2. Fallback to email if name is undefined or empty
    if (session?.user?.email) {
      return session.user.email.substring(0, 2).toUpperCase();
    }
    // 3. Absolute fallback
    return "U";
  };

  const initials = getUserInitials();

  return (
    // FIX: App-like layout structure
    <div className="h-screen w-full bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground flex overflow-hidden">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-[99990] lg:hidden backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[99995] w-[260px] bg-card border-r border-border 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        ${isDesktopSidebarCollapsed ? "lg:hidden" : "lg:translate-x-0 lg:flex"}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Image 
            src="/logo.png" 
            alt="Lorabiz" 
            width={120} 
            height={32} 
            className="h-6 w-auto object-contain dark:brightness-200 dark:contrast-100" 
            priority
          />
          <button 
            className="lg:hidden text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 custom-scrollbar">
          {NAVIGATION.map((group) => (
            <div key={group.category} className="space-y-1">
              <h3 className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1.5">
                {group.category}
              </h3>
              <div className="space-y-0.5">
                {group.links.map((link) => {
                  const isActive = link.href === "/dashboard" 
                    ? pathname === "/dashboard" 
                    : pathname.startsWith(link.href.split('?')[0]) && link.href !== "#"; 
                  
                  const Icon = link.icon;
                  
                  return (
                    <Link 
                      key={link.name} 
                      href={link.href}
                      onClick={(e) => {
                        if (link.isComingSoon) {
                          e.preventDefault();
                          handleSidebarWaitlist(link.name);
                        } else {
                          setIsMobileMenuOpen(false);
                        }
                      }}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all duration-200 group
                        ${isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-4 w-4 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} 
                      />
                      <span className="text-xs font-bold">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group cursor-pointer"
          >
            <SignOut className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* HEADER */}
        <header className="sticky top-0 z-10 h-16 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-1.5 -ml-1.5 text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>
            
            <button 
              className="hidden lg:block p-1.5 -ml-1.5 text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>

            <h2 className="text-base font-black text-foreground hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <NotificationBell />

            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-[#ff7b9f] flex items-center justify-center text-primary-foreground text-[11px] font-black shadow-sm cursor-pointer hover:opacity-90 transition-opacity select-none border border-primary/20">
              {initials}
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN SECTION */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 custom-scrollbar bg-secondary/10">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
            {children}
          </div>
        </main>

      </div>

      {sidebarAlert && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-xs border border-border">
          <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{sidebarAlert.title}</h4>
            <p className="text-xs opacity-90 mt-0.5 leading-snug">{sidebarAlert.message}</p>
          </div>
          <button 
            onClick={() => setSidebarAlert(null)} 
            className="ml-auto p-1 hover:bg-background/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
