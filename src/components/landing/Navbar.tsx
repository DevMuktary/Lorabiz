"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const navItems = {
    services: [
      { name: "CAC Registration", href: "/services/cac" },
      { name: "SCUML Certificate", href: "/services/scuml" },
      { name: "Tax ID (TIN)", href: "/services/tax-id" },
      { name: "NIN Verification", href: "/services/nin" },
      { name: "Airtime & Data", href: "/services/utilities" },
    ],
    resources: [
      { name: "Guides", href: "/guides" },
      { name: "Blog", href: "/blog" },
      { name: "FAQ", href: "/faq" },
    ],
    company: [
      { name: "Contact Us", href: "/contact" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Acceptable Use", href: "/acceptable-use" },
    ],
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0a0f1e]/80 border-b border-black/5 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group z-50">
          <Image
            src="/logo.png"
            alt="LoraBiz Logo"
            width={40}
            height={40}
            className="rounded-lg transition-transform duration-300 group-hover:scale-110"
          />
          <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Lora<span className="text-[#c7365f]">Biz</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {/* Services Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 py-2 text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white transition-colors duration-200">
              Services
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 w-56 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-2">
                {navItems.services.map((item) => (
                  <Link key={item.name} href={item.href} className="block px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Creators (Inactive Placeholder) */}
          <div className="flex items-center gap-1.5 py-2 text-zinc-400 dark:text-white/30 cursor-default">
            Creators
            <span className="text-[9px] uppercase tracking-wider font-bold bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">
              Soon
            </span>
          </div>

          {/* Resources Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 py-2 text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white transition-colors duration-200">
              Resources
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 w-48 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-2">
                {navItems.resources.map((item) => (
                  <Link key={item.name} href={item.href} className="block px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Company Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 py-2 text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white transition-colors duration-200">
              Company
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 w-48 pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-xl shadow-xl overflow-hidden p-2">
                {navItems.company.map((item) => (
                  <Link key={item.name} href={item.href} className="block px-4 py-2.5 text-sm text-zinc-600 hover:text-zinc-900 dark:text-white/70 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg transition-colors">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Buttons (Sign Up on left, Sign In on right) */}
        <div className="hidden lg:flex items-center gap-4 z-50">
          <Link
            href="/auth/register"
            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-full hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>

        {/* Custom Animated Hamburger Menu */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden relative w-12 h-12 flex flex-col justify-center items-center z-50"
          aria-label="Toggle menu"
        >
          <span 
            className={`absolute block w-7 h-[2px] bg-zinc-900 dark:bg-white transition-all duration-400 ease-in-out ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-2.5'}`} 
          />
          <span 
            className={`absolute block w-7 h-[2px] bg-zinc-900 dark:bg-white transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'}`} 
          />
          <span 
            className={`absolute block w-7 h-[2px] bg-zinc-900 dark:bg-white transition-all duration-400 ease-in-out ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-2.5'}`} 
          />
        </button>
      </div>

      {/* Mobile Menu Slider */}
      <div 
        className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-[#0a0f1e] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl ${
          isMobileMenuOpen ? "max-h-[1200px] opacity-100 border-b border-black/5 dark:border-white/5" : "max-h-0 opacity-0 border-transparent"
        }`}
      >
        {/* Inner container stretches full height to push buttons down */}
        <div className="flex flex-col min-h-[calc(100vh-80px)]">
          
          <div className="flex-none px-6 py-4 space-y-2">
            {/* Mobile Services Accordion */}
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <button 
                onClick={() => toggleDropdown("services")}
                className="flex items-center justify-between w-full py-4 text-lg font-semibold text-zinc-900 dark:text-white transition-colors hover:text-[#c7365f] dark:hover:text-[#e8447a]"
              >
                Services
                <svg className={`w-5 h-5 transition-transform duration-400 ease-in-out ${openDropdown === "services" ? "rotate-180 text-[#c7365f] dark:text-[#e8447a]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-400 ease-in-out ${openDropdown === "services" ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden flex flex-col gap-2 pl-4 border-l-2 border-black/10 dark:border-white/10 ml-2">
                  {navItems.services.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-base text-zinc-600 dark:text-white/60 hover:text-[#c7365f] dark:hover:text-[#e8447a] transition-colors">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Creators Placeholder */}
            <div className="border-b border-black/5 dark:border-white/5 py-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-zinc-400 dark:text-white/30 cursor-default">
                Creators
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold bg-black/5 dark:bg-white/10 text-zinc-500 dark:text-white/40 px-3 py-1 rounded-full">
                Coming Soon
              </span>
            </div>

            {/* Mobile Resources Accordion */}
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <button 
                onClick={() => toggleDropdown("resources")}
                className="flex items-center justify-between w-full py-4 text-lg font-semibold text-zinc-900 dark:text-white transition-colors hover:text-[#c7365f] dark:hover:text-[#e8447a]"
              >
                Resources
                <svg className={`w-5 h-5 transition-transform duration-400 ease-in-out ${openDropdown === "resources" ? "rotate-180 text-[#c7365f] dark:text-[#e8447a]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-400 ease-in-out ${openDropdown === "resources" ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden flex flex-col gap-2 pl-4 border-l-2 border-black/10 dark:border-white/10 ml-2">
                  {navItems.resources.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-base text-zinc-600 dark:text-white/60 hover:text-[#c7365f] dark:hover:text-[#e8447a] transition-colors">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Company Accordion */}
            <div className="pb-2">
              <button 
                onClick={() => toggleDropdown("company")}
                className="flex items-center justify-between w-full py-4 text-lg font-semibold text-zinc-900 dark:text-white transition-colors hover:text-[#c7365f] dark:hover:text-[#e8447a]"
              >
                Company
                <svg className={`w-5 h-5 transition-transform duration-400 ease-in-out ${openDropdown === "company" ? "rotate-180 text-[#c7365f] dark:text-[#e8447a]" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-400 ease-in-out ${openDropdown === "company" ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden flex flex-col gap-2 pl-4 border-l-2 border-black/10 dark:border-white/10 ml-2">
                  {navItems.company.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2.5 text-base text-zinc-600 dark:text-white/60 hover:text-[#c7365f] dark:hover:text-[#e8447a] transition-colors">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Spacer to push buttons to the very bottom edge */}
          <div className="flex-grow" />

          {/* Mobile Action Buttons (Sign Up on Left, Sign In on Right) */}
          <div className="p-6 bg-zinc-50 dark:bg-white/[0.02] border-t border-black/5 dark:border-white/5 flex gap-4 pb-12">
            <Link
              href="/auth/register"
              className="flex-1 flex items-center justify-center py-4 text-base font-bold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-xl hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="flex-1 flex items-center justify-center py-4 text-base font-semibold text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
