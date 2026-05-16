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

// Categorized Navigation Architecture
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

  // Helper to find current page name for header
  const getCurrentPageName = () => {
    for (const group of NAVIGATION) {
      const found = group.links.find(link => link.href === pathname);
      if (found) return found.name;
    }
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans selection:bg-[#ff3f7a] selection:text-white">
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl lg:shadow-none
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-gray-100 shrink-0">
          <Image 
            src="/logo.png" 
            alt="Lumebiz" 
            width={140} 
            height={40} 
            className="h-8 w-auto object-contain" 
            priority
          />
          <button 
            className="lg:hidden text-gray-500 hover:text-[#ff3f7a] transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-6 w-6" weight="bold" />
          </button>
        </div>

        {/* Navigation Links - Scrollable Area */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {NAVIGATION.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
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
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        }
                      `}
                    >
                      <Icon 
                        weight={isActive ? "fill" : "regular"} 
                        className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-[#ff3f7a]" : "text-gray-400 group-hover:text-gray-600"}`} 
                      />
                      <span className="text-[15px]">{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button 
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
          >
            <SignOut className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-transform group-hover:-translate-x-1" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-6 lg:px-10 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <List className="h-6 w-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 hidden sm:block">
              {getCurrentPageName()}
            </h2>
          </div>

          <div className="flex items-center gap-5">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-500 hover:text-[#ff3f7a] transition-colors rounded-full hover:bg-[#ff3f7a]/10">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-[#ff3f7a] rounded-full border-2 border-white"></span>
            </button>

            {/* Simple User Avatar Placeholder */}
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#ff3f7a] to-[#ff7b9f] flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity">
              JD
            </div>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT SCROLLS HERE */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
