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
import TierAvatar from "@/components/ui/TierAvatar";
import { useLoyalty } from "@/lib/useLoyalty";
import LoyaltyPerksModal from "@/components/dashboard/LoyaltyPerksModal";
import {
  SquaresFour, Buildings, ShieldCheck, Copyright,
  Handshake, IdentificationCard, IdentificationBadge, DeviceMobile, Wallet,
  UserCircle, SignOut, List, X, Info, Receipt, Cards, Tag, Users,
  FileText, Globe, Flask, Shield, Certificate, AirplaneTilt, Suitcase, Calculator,
  ClockCounterClockwise, Code, CaretDown, CaretRight, Crown, Sparkle, Gavel
} from "@phosphor-icons/react";

type SubLink = {
  name: string;
  href: string;
};

type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
  isComingSoon?: boolean;
  showSoonBadge?: boolean;
  subLinks?: SubLink[];
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
      {
        name: "NIN Services",
        href: "/dashboard/nin",
        icon: IdentificationCard,
        subLinks: [
          { name: "Slip Generation", href: "/dashboard/nin/slips" },
          { name: "NIN Validation", href: "/dashboard/nin/validation" },
          { name: "NIN Modification", href: "/dashboard/nin/modification" },
          { name: "Personalization", href: "/dashboard/nin/personalization" },
          { name: "IPE Clearance", href: "/dashboard/nin/ipe" },
        ]
      },
      {
        name: "BVN Services",
        href: "/dashboard/bvn",
        icon: IdentificationBadge,
        subLinks: [
          { name: "BVN Slip", href: "/dashboard/bvn/slip" },
          { name: "BVN Retrieval", href: "/dashboard/bvn/retrieval" },
        ]
      },
      {
        name: "Utilities",
        href: "/dashboard/utilities",
        icon: DeviceMobile,
        subLinks: [
          { name: "Airtime Top-Up", href: "/dashboard/utilities/airtime" },
          { name: "Mobile Data", href: "/dashboard/utilities/mobile-data" },
        ]
      },
      {
        name: "Court Affidavit",
        href: "/dashboard/affidavit",
        icon: Gavel,
        subLinks: [
          { name: "New Affidavit", href: "/dashboard/affidavit" },
          { name: "My Affidavits", href: "/dashboard/affidavit/history" },
        ]
      },
      { name: "Tax ID (TIN)", href: "/dashboard/tax-id", icon: Cards },
    ]
  },
  {
    category: "Developer",
    links: [
      { name: "Developer API", href: "#", icon: Code, isComingSoon: true, showSoonBadge: true },
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
  const [isPerksModalOpen, setIsPerksModalOpen] = useState(false);
  const [sidebarAlert, setSidebarAlert] = useState<{ title: string, message: string } | null>(null);
  
  const { profile: loyaltyProfile } = useLoyalty();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    "/dashboard/nin": true,
    "/dashboard/bvn": true,
    "/dashboard/utilities": true,
  });

  // Auto-expand active category based on current pathname
  useEffect(() => {
    if (pathname.startsWith("/dashboard/nin")) {
      setOpenSubmenus(prev => ({ ...prev, "/dashboard/nin": true }));
    } else if (pathname.startsWith("/dashboard/bvn")) {
      setOpenSubmenus(prev => ({ ...prev, "/dashboard/bvn": true }));
    } else if (pathname.startsWith("/dashboard/utilities")) {
      setOpenSubmenus(prev => ({ ...prev, "/dashboard/utilities": true }));
    }
  }, [pathname]);

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
    if (pathname.includes("/dashboard/utilities")) return "Utilities";
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

  // Prevent background scroll bleed when mobile sidebar drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-sans flex selection:bg-primary selection:text-primary-foreground relative">


      {/* Invisible tap-to-close layer (no color, no box — just catches taps outside the sidebar) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[99990] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:sticky top-0 bottom-0 left-0 z-[99995] w-[270px] h-full lg:h-screen bg-card border-r border-border 
        transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none shrink-0
        ${isMobileMenuOpen ? "translate-x-0 visible pointer-events-auto" : "-translate-x-full invisible pointer-events-none lg:visible lg:pointer-events-auto lg:translate-x-0"}
        ${isDesktopSidebarCollapsed ? "lg:hidden" : "lg:flex"}
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
                  const hasSubLinks = Boolean(link.subLinks && link.subLinks.length > 0);
                  const isSubmenuOpen = Boolean(openSubmenus[link.href]);

                  return (
                    <div key={link.name} className="space-y-0.5">
                      <div className="flex items-center">
                        <Link
                          href={link.href}
                          onClick={(e) => {
                            if (link.isComingSoon) {
                              e.preventDefault();
                              handleSidebarWaitlist(link.name);
                            } else {
                              if (hasSubLinks && !isSubmenuOpen) {
                                setOpenSubmenus(prev => ({ ...prev, [link.href]: true }));
                              }
                              setIsMobileMenuOpen(false);
                            }
                          }}
                          className={`
                            flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
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

                        {hasSubLinks && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenSubmenus(prev => ({ ...prev, [link.href]: !isSubmenuOpen }));
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer ml-0.5"
                            title={isSubmenuOpen ? "Collapse sub-menu" : "Expand sub-menu"}
                          >
                            {isSubmenuOpen ? (
                              <CaretDown size={13} weight="bold" />
                            ) : (
                              <CaretRight size={13} weight="bold" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Collapsible Sub-menu */}
                      {hasSubLinks && isSubmenuOpen && (
                        <div className="pl-5 ml-4 border-l border-border/80 space-y-0.5 my-1 animate-in slide-in-from-top-1 duration-150">
                          {link.subLinks!.map((sub) => {
                            const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + "/");
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`
                                  flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                                  ${isSubActive
                                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                                  }
                                `}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSubActive ? "bg-primary-foreground" : "bg-muted-foreground/40"}`} />
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        <header className="relative z-40 h-[70px] bg-card border-b border-border flex items-center justify-between px-5 lg:px-8 shrink-0">
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

            {/* PROFILE DROPDOWN WRAPPER WITH TIER RIBBON */}
            <div className="relative ml-1">
              <TierAvatar
                image={session?.user?.image}
                initials={initials}
                tierLevel={loyaltyProfile?.currentTier?.level || "TIER_1"}
                size="md"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              />

              {/* PROFILE DROPDOWN MENU */}
              {isProfileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[45]"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  />

                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl z-[50] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3.5 border-b border-border bg-secondary/30 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-black text-foreground truncate">
                          {session?.user?.name || "Lorabiz User"}
                        </p>
                        {loyaltyProfile?.currentTier && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                            {loyaltyProfile.currentTier.name}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground truncate">
                        {session?.user?.email}
                      </p>

                      {/* Tier Ribbon / Discount Status Strip */}
                      {loyaltyProfile?.currentTier && (
                        <div 
                          onClick={() => {
                            setIsProfileDropdownOpen(false);
                            setIsPerksModalOpen(true);
                          }}
                          className="mt-2 flex items-center justify-between p-2 rounded-xl bg-background/80 border border-border/80 text-[11px] cursor-pointer hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-foreground">
                            <span>{loyaltyProfile.currentTier.badge.split(" ")[0]}</span>
                            <span>{loyaltyProfile.currentTier.name} Status</span>
                          </div>
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[10px]">
                            {loyaltyProfile.currentTier.discountPct > 0 ? `${loyaltyProfile.currentTier.discountPct}% OFF` : "Starter"} ➔
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          setIsPerksModalOpen(true);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold text-foreground hover:bg-secondary transition-colors cursor-pointer text-left"
                      >
                        <Crown className="h-4 w-4 text-[#ff3f7a]" weight="fill" />
                        <span>Account Levels &amp; Discounts</span>
                      </button>

                      <Link
                        href="/dashboard/settings"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold text-foreground hover:bg-secondary transition-colors"
                      >
                        <UserCircle className="h-4 w-4 text-muted-foreground" weight="bold" />
                        <span>Profile Settings</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/auth/login", redirect: true })}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-bold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group cursor-pointer text-left"
                      >
                        <SignOut className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-destructive transition-transform group-hover:-translate-x-1" weight="bold" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        <main className="flex-1 bg-background p-4 sm:p-6 lg:p-8 relative">
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

      {/* Global Perks Modal */}
      <LoyaltyPerksModal
        isOpen={isPerksModalOpen}
        onClose={() => setIsPerksModalOpen(false)}
        currentTierLevel={loyaltyProfile?.currentTier?.level}
        allTimeSpend={loyaltyProfile?.allTimeSpend}
      />

      <SupportWidgetBootstrapper />
    </div>
  );
}
