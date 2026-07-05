"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/features/notifications/NotificationBell";
import { 
  SquaresFour, Briefcase, Buildings, ShieldCheck, Copyright, 
  Handshake, IdentificationCard, DeviceMobile, CreditCard, 
  UserCircle, SignOut, List, X, Info 
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
      { name: "My Applications", href: "/dashboard/applications", icon: Briefcase },
    ]
  },
  {
    category: "Available Services",
    links: [
      { name: "CAC Registration", href: "/dashboard/cac", icon: Buildings },
      { name: "NIN Services", href: "/dashboard/tools/nin-slip", icon: IdentificationCard }, // Unlocked!
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
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  const [sidebarAlert, setSidebarAlert] = useState<{title: string, message: string} | null>(null);

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
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground transition-colors duration-300 relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-[99990] lg:hidden backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[99995] w-[260px] bg-card border-r border-border 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        ${isDesktopSidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-border shrink-0">
          <Image 
            src="/logo.png" 
            alt="Lorabiz" 
            width={120} 
            height={32} 
            className="h-7 w-auto object-contain dark:brightness-200 dark:contrast-100" 
            priority
          />
          <button 
            className="lg:hidden text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" weight="bold" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 custom-scrollbar">
          {NAVIGATION.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <h3 className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
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
                        flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 group
                        ${isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-[18px] w-[18px] transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} 
                      />
                      <span className="text-[13px] font-bold">{link.name}</span>
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
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group cursor-pointer"
          >
            <SignOut className="h-[18px] w-[18px] text-muted-foreground group-hover:text-destructive transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </aside>

      <div className={`
        flex flex-col min-h-screen transition-[padding] duration-300 ease-in-out
        ${isDesktopSidebarCollapsed ? "lg:pl-0" : "lg:pl-[260px]"}
      `}>
        
        <header className={`
          sticky top-0 z-10 h-20 bg-background/80 backdrop-blur-md shadow-sm border-b border-border 
          flex items-center justify-between px-6 lg:px-8 shrink-0 
          transition-transform duration-300 ease-in-out
          ${showHeader ? "translate-y-0" : "-translate-y-full"}
        `}>
          <div className="flex items-center gap-3">
            <button 
              className="lg:hidden p-2 -ml-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>
            
            <button 
              className="hidden lg:block p-2 -ml-2 text-muted-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer"
              onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            >
              <List className="h-5 w-5" weight="bold" />
            </button>

            <h2 className="text-lg font-black text-foreground hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Integrated Notification Bell */}
            <NotificationBell />

            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-[#ff7b9f] flex items-center justify-center text-primary-foreground text-xs font-black shadow-md cursor-pointer hover:opacity-90 transition-opacity">
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

      {sidebarAlert && (
        <div className="fixed bottom-6 right-6 bg-foreground text-background px-5 py-4 rounded-2xl shadow-2xl z-[99999] flex items-center gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm border border-border">
          <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
            <Info weight="fill" className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-bold text-sm leading-tight">{sidebarAlert.title}</h4>
            <p className="text-xs opacity-90 mt-1 leading-snug">{sidebarAlert.message}</p>
          </div>
          <button 
            onClick={() => setSidebarAlert(null)} 
            className="ml-2 p-1.5 hover:bg-background/20 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      )}

    </div>
  );
}
