"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/features/notifications/NotificationBell";
import { SupportWidgetBootstrapper } from "@/components/SupportWidgetBootstrapper"; 
import { WelcomeBanner } from "@/components/WelcomeBanner"; 
import { 
  SquaresFour, Buildings, ShieldCheck, Copyright, 
  Handshake, IdentificationCard, DeviceMobile, Wallet, 
  UserCircle, SignOut, List, X, Info, Receipt, Cards, Tag, Users,
  FileText, Globe, Flask, Shield, Certificate, AirplaneTilt, Suitcase, Calculator,
  ClockCounterClockwise
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
      { name: "Partner Program", href: "/dashboard/referrals", icon: Users },
      { name: "Pricing", href: "/dashboard/pricing", icon: Tag },
    ]
  },
  {
    category: "Available Services",
    links: [
      { name: "CAC Services", href: "/dashboard/cac", icon: Buildings },
      { name: "SCUML", href: "/dashboard/scuml", icon: ShieldCheck },
      { name: "NIN Services", href: "/dashboard/nin", icon: IdentificationCard },
      { name: "Airtime", href: "/dashboard/airtime", icon: DeviceMobile },
      { name: "Tax ID (TIN)", href: "/dashboard/tax-id", icon: Cards },
    ]
  },
  {
    category: "Upcoming Services",
    links: [
      { name: "CAC Post Incorporation", href: "#", icon: Buildings, isComingSoon: true },
      { name: "Trademark (IPO)", href: "#", icon: Copyright, isComingSoon: true },
      { name: "Nigerian Copyright Commission (NCC)", href: "#", icon: Copyright, isComingSoon: true },
      { name: "Smart Legal Documents", href: "#", icon: FileText, isComingSoon: true },
      { name: "Build Online Presence", href: "#", icon: Globe, isComingSoon: true },
      { name: "NAFDAC Registration", href: "#", icon: Flask, isComingSoon: true },
      { name: "PENCOM Compliance", href: "#", icon: Shield, isComingSoon: true },
      { name: "SON Certification", href: "#", icon: Certificate, isComingSoon: true },
      { name: "NEPC Export License", href: "#", icon: AirplaneTilt, isComingSoon: true },
      { name: "Bureau of Public Procurement (BPP)", href: "#", icon: Suitcase, isComingSoon: true },
      { name: "Expert Tax Consultation", href: "#", icon: Calculator, isComingSoon: true },
      { name: "SMEDAN", href: "#", icon: Handshake, isComingSoon: true },
    ]
  },
  {
    category: "Management",
    links: [
      { name: "Activity History", href: "/dashboard/activity", icon: ClockCounterClockwise },
      { name: "Profile Settings", href: "/dashboard/settings", icon: UserCircle },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Safe fallback to prevent Railway build crashes
  const { data: session } = useSession() || {};
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false); 
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
    if (pathname.includes("/dashboard/nin")) return "NIN Services";
    if (pathname.includes("/dashboard/transactions")) return "Transactions";
    if (pathname.includes("/dashboard/scuml")) return "SCUML";
    if (pathname.includes("/dashboard/airtime")) return "Airtime";
    if (pathname.includes("/dashboard/referrals")) return "Partner Program";
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
    <div className="min-h-screen w-full bg-background text-foreground font-sans flex selection:bg-primary selection:text-primary-foreground relative">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/80 z-[99990] lg:hidden backdrop-blur-sm transition-opacity cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:sticky top-0 inset-y-0 left-0 z-[99995] w-[260px] h-screen bg-card border-r border-border 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none shrink-0
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        ${isDesktopSidebarCollapsed ? "lg:hidden" : "lg:translate-x-0 lg:flex"}
      `}>
        <div className="h-[70px] flex items-center justify-between px-5 border-b border-border shrink-0">
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

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5 custom-scrollbar pb-10">
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
                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? "bg-primary/10 text-primary shadow-sm" 
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} 
                      />
                      <span className="text-[13px] font-bold flex-1">{link.name}</span>
                      
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
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        <header className="relative z-40 h-[70px] bg-background border-b border-border flex items-center justify-between px-5 lg:px-8 shrink-0 shadow-sm">
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

            <h2 className="text-lg font-black text-foreground hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/pricing"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-[13px] font-bold"
            >
              <Tag weight="bold" className="h-4 w-4" />
              Pricing
            </Link>

            <ThemeToggle />
            <NotificationBell />

            {/* NEW: PROFILE DROPDOWN WRAPPER */}
            <div className="relative ml-1">
              <div 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="h-9 w-9 rounded-full overflow-hidden bg-gradient-to-tr from-primary to-[#ff7b9f] flex items-center justify-center text-primary-foreground text-[12px] font-black shadow-md cursor-pointer hover:opacity-90 transition-opacity select-none border border-primary/20 shrink-0"
              >
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={session.user.image} 
                    alt="Profile" 
                    className="h-full w-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = initials;
                    }}
                  />
                ) : (
                  initials
                )}
              </div>

              {/* PROFILE DROPDOWN MENU */}
              {isProfileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-[45]" 
                    onClick={() => setIsProfileDropdownOpen(false)} 
                  />
                  
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-[50] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-border bg-secondary/30">
                      <p className="text-[13px] font-black text-foreground truncate">
                        {session?.user?.name || "Lorabiz User"}
                      </p>
                      <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
                        {session?.user?.email}
                      </p>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      <Link 
                        href="/dashboard/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold text-foreground hover:bg-secondary transition-colors"
                      >
                        <UserCircle className="h-4 w-4 text-muted-foreground" weight="bold" />
                        Profile Settings
                      </Link>
                      
                      <button 
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/auth/login", redirect: true })}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group cursor-pointer"
                      >
                        <SignOut className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-destructive transition-transform group-hover:-translate-x-1" weight="bold" />
                        Log Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 bg-secondary/10 p-5 lg:p-8 pb-24 relative">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in duration-300">
            <WelcomeBanner /> 
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

      <SupportWidgetBootstrapper />
    </div>
  );
}
