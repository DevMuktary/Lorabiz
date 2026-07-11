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
  Handshake, IdentificationCard, DeviceMobile, Wallet, 
  UserCircle, SignOut, List, X, Info, Receipt
} from "@phosphor-icons/react";

type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
  isComingSoon?: boolean;
  showSoonBadge?: boolean;
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
      { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
      { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
    ]
  },
  {
    category: "Available Services",
    links: [
      { name: "CAC Services", href: "/dashboard/cac", icon: Buildings },
      { name: "NIN Services", href: "/dashboard/tools/nin-slip", icon: IdentificationCard },
    ]
  },
  {
    category: "Upcoming Services",
    links: [
      { name: "SCUML", href: "#", icon: ShieldCheck, isComingSoon: true },
      { name: "Trademark (IPO)", href: "#", icon: Copyright, isComingSoon: true },
      { name: "SMEDAN", href: "#", icon: Handshake, isComingSoon: true },
      { name: "Utility & Airtime", href: "#", icon: DeviceMobile, isComingSoon: true, showSoonBadge: true },
    ]
  },
  {
    category: "Management",
    links: [
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

  const getUserInitials = () => {
    if (session?.user?.name && session.user.name.trim() !== "") {
      const names = session.user.name.trim().split(/\s+/);
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    if (session?.user?.email) {
      return session.user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const initials = getUserInitials();

  return (
    <div className="min-h-screen w-full bg-secondary/10 text-foreground font-sans flex selection:bg-primary selection:text-primary-foreground">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-[99990] lg:hidden backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:sticky top-0 inset-y-0 left-0 z-[99995] w-[280px] h-screen bg-card border-r border-border 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        ${isDesktopSidebarCollapsed ? "lg:hidden" : "lg:translate-x-0 lg:flex"}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Image 
            src="/logo.png" 
            alt="Lorabiz" 
            width={130} 
            height={36} 
            className="h-7 w-auto object-contain dark:brightness-200 dark:contrast-100" 
            priority
          />
          <button 
            className="lg:hidden text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" weight="bold" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-7 custom-scrollbar">
          {NAVIGATION.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="px-4 text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                {group.category}
              </h3>
              <div className="space-y-1">
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
                        flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group
                        ${isActive 
                          ? "bg-primary/10 text-primary shadow-sm" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} 
                      />
                      <span className="text-[14px] font-bold flex-1">{link.name}</span>
                      
                      {link.showSoonBadge && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-[#ff3f7a]/10 px-2 py-0.5 text-[9px] font-black text-[#ff3f7a] uppercase tracking-widest animate-pulse border border-[#ff3f7a]/20 shrink-0">
                          Soon
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <button 
            type="button"
            onClick={() => {
              // Clears session cache & forces immediate hard redirect to login
              signOut({ callbackUrl: "/auth/login", redirect: true });
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group cursor-pointer"
          >
            <SignOut className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-destructive transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* HEADER - Kept Sticky */}
        <header className="sticky top-0 z-40 h-20 bg-background/95 backdrop-blur-md border-b border-border flex items-center justify-between px-5 lg:px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="h-6 w-6" weight="bold" />
            </button>
            
            <button 
              className="hidden lg:block p-2 -ml-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            >
              <List className="h-6 w-6" weight="bold" />
            </button>

            <h2 className="text-xl font-black text-foreground hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <NotificationBell />

            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-[#ff7b9f] flex items-center justify-center text-primary-foreground text-[13px] font-black shadow-md cursor-pointer hover:opacity-90 transition-opacity select-none border border-primary/20">
              {initials}
            </div>
          </div>
        </header>

        {/* MAIN BODY - No fixed height, allows natural scrolling */}
        <main className="flex-1 p-5 lg:p-8 pb-24">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
            {children}
          </div>
        </main>

      </div>

      {sidebarAlert && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-5 py-4 rounded-xl shadow-2xl z-[99999] flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-xs border border-border">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-[15px] leading-tight">{sidebarAlert.title}</h4>
            <p className="text-[13px] opacity-90 mt-0.5 leading-snug">{sidebarAlert.message}</p>
          </div>
          <button 
            onClick={() => setSidebarAlert(null)} 
            className="ml-auto p-1.5 hover:bg-background/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
