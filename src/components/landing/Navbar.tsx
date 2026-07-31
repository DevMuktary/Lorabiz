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
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-[#0a0f1e]/80 border-b border-black/5 dark:border-white/5 transition-colors duration-300">
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

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-4 z-50">
          <Link
            href="/auth/login"
            className="px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-full hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 -mr-2 text-zinc-600 dark:text-white/70 hover:text-zinc-900 dark:hover:text-white z-50 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div 
        className={`lg:hidden absolute top-full left-0 w-full bg-white dark:bg-[#0a0f1e] border-b border-black/5 dark:border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-[80vh] opacity-100 border-opacity-100" : "max-h-0 opacity-0 border-opacity-0"
        }`}
      >
        <div className="flex flex-col px-6 py-6 space-y-2 overflow-y-auto max-h-[calc(80vh-100px)]">
          
          {/* Mobile Services Accordion */}
          <div className="border-b border-black/5 dark:border-white/5 pb-2">
            <button 
              onClick={() => toggleDropdown("services")}
              className="flex items-center justify-between w-full py-3 text-base font-semibold text-zinc-900 dark:text-white"
            >
              Services
              <svg className={`w-4 h-4 transition-transform duration-300 ${openDropdown === "services" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${openDropdown === "services" ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden flex flex-col gap-2 pl-4 border-l border-black/10 dark:border-white/10 ml-2">
                {navItems.services.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm text-zinc-600 dark:text-white/60 hover:text-[#c7365f] dark:hover:text-[#e8447a] transition-colors">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Resources Accordion */}
          <div className="border-b border-black/5 dark:border-white/5 pb-2">
            <button 
              onClick={() => toggleDropdown("resources")}
              className="flex items-center justify-between w-full py-3 text-base font-semibold text-zinc-900 dark:text-white"
            >
              Resources
              <svg className={`w-4 h-4 transition-transform duration-300 ${openDropdown === "resources" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${openDropdown === "resources" ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden flex flex-col gap-2 pl-4 border-l border-black/10 dark:border-white/10 ml-2">
                {navItems.resources.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm text-zinc-600 dark:text-white/60 hover:text-[#c7365f] dark:hover:text-[#e8447a] transition-colors">
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
              className="flex items-center justify-between w-full py-3 text-base font-semibold text-zinc-900 dark:text-white"
            >
              Company
              <svg className={`w-4 h-4 transition-transform duration-300 ${openDropdown === "company" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`grid transition-all duration-300 ease-in-out ${openDropdown === "company" ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden flex flex-col gap-2 pl-4 border-l border-black/10 dark:border-white/10 ml-2">
                {navItems.company.map((item) => (
                  <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="py-2 text-sm text-zinc-600 dark:text-white/60 hover:text-[#c7365f] dark:hover:text-[#e8447a] transition-colors">
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Action Buttons */}
        <div className="p-6 bg-zinc-50 dark:bg-[#111827]/50 border-t border-black/5 dark:border-white/5 flex gap-4">
          <Link
            href="/auth/login"
            className="flex-1 flex justify-center py-3.5 text-sm font-semibold text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white border border-black/10 dark:border-white/10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="flex-1 flex justify-center py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-xl hover:shadow-[0_0_15px_rgba(199,54,95,0.4)] transition-all"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
}
