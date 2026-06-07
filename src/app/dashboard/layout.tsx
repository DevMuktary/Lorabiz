"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  SquaresFour, Briefcase, Storefront, Buildings, HandHeart, IdentificationCard,
  CalendarCheck, ArrowCircleUp, PencilLine, Archive, CreditCard, UserCircle,
  SignOut, Bell, List, X 
} from "@phosphor-icons/react";

const NAVIGATION = [
  {
    category: "Main",
    links: [
      { name: "Overview", href: "/dashboard", icon: SquaresFour },
      { name: "My Businesses", href: "/dashboard/businesses", icon: Briefcase },
    ]
  },
  {
    category: "Pre-Incorporation",
    links: [
      { name: "Register Business Name", href: "/dashboard/register/business-name", icon: Storefront },
      { name: "Register Company (LLC)", href: "/dashboard/register/llc", icon: Buildings },
      { name: "Register NGO / IT", href: "/dashboard/register/ngo", icon: HandHeart },
      { name: "Generate NIN Slip", href: "/dashboard/nin-slip", icon: IdentificationCard },
    ]
  },
  {
    category: "Post-Incorporation",
    links: [
      { name: "File Annual Returns", href: "/dashboard/post-inc/annual-returns", icon: CalendarCheck },
      { name: "Upgrade BN to LLC", href: "/dashboard/post-inc/upgrade", icon: ArrowCircleUp },
      { name: "Make Changes", href: "/dashboard/post-inc/changes", icon: PencilLine },
      { name: "Document Retrieval", href: "/dashboard/post-inc/documents", icon: Archive },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getCurrentPageName = () => {
    for (const group of NAVIGATION) {
      const found = group.links.find(link => link.href === pathname);
      if (found) return found.name;
    }
    return "Dashboard";
  };

  return (
    // Removed fixed heights. The page now controls its own natural height.
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#ff3f7a] selection:text-white">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR - Now fixed permanently to the left side */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="h-20 flex items-center justify-between px-8 border-b border-slate-100 shrink-0">
          <Image 
            src="/logo.png" 
            alt="Lumebiz" 
            width={140} 
            height={40} 
            className="h-8 w-auto object-contain" 
            priority
          />
          <button 
            className="lg:hidden text-slate-500 hover:text-[#ff3f7a] transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" weight="bold" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {NAVIGATION.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                  const Icon = link.icon;
                  
                  return (
                    <Link 
                      key={link.name} 
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 group
                        ${isActive 
                          ? "bg-[#ff3f7a]/10 text-[#ff3f7a]" 
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-[#ff3f7a]" : "text-slate-400 group-hover:text-slate-600"}`} 
                      />
                      <span className="text-[15px]">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <SignOut className="h-5 w-5 text-slate-400 group-hover:text-red-500 transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA - Native Window Scrolling! */}
      {/* Note the lg:pl-72 here. This pushes the content past the fixed sidebar on desktop. */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        
        {/* TOP HEADER - Sticky to the top of the native window */}
        <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            <button className="relative p-2 text-slate-500 hover:text-[#ff3f7a] transition-colors rounded-full hover:bg-[#ff3f7a]/10">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-[#ff3f7a] rounded-full border-2 border-white"></span>
            </button>

            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#ff3f7a] to-[#ff7b9f] flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity">
              JD
            </div>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT - No overflow restrictions! Safari will scroll naturally. */}
        <main className="flex-1 p-4 sm:p-6 lg:p-10 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
