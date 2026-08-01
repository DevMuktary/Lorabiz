"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  // Upgraded Navigation Structure: Bolder Icons & Subtitles for a Premium SaaS Look
  const navItems = {
    services: [
      { 
        name: "CAC Registration", 
        desc: "Business Names, LLCs & NGOs",
        href: "/services/cac", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg> 
      },
      { 
        name: "SCUML Certificate", 
        desc: "EFCC Anti-Money Laundering",
        href: "/services/scuml", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> 
      },
      { 
        name: "Tax ID (TIN)", 
        desc: "Corporate & Individual TINs",
        href: "/services/tax-id", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> 
      },
      { 
        name: "NIN Verification", 
        desc: "Generate your official slips",
        href: "/services/nin", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg> 
      },
      { 
        name: "Airtime & Data", 
        desc: "Discounted SME Utility Vending",
        href: "/services/utilities", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" /></svg> 
      },
    ],
    resources: [
      { 
        name: "Guides", 
        desc: "Step-by-step tutorials",
        href: "/guides", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> 
      },
      { 
        name: "Blog", 
        desc: "Latest news and updates",
        href: "/blog", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" /></svg> 
      },
      { 
        name: "FAQ", 
        desc: "Frequently asked questions",
        href: "/faq", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg> 
      },
    ],
    company: [
      { 
        name: "Contact Us", 
        desc: "Get in touch with support",
        href: "/contact", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg> 
      },
      { 
        name: "Terms of Service", 
        desc: "Our user agreement",
        href: "/terms", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> 
      },
      { 
        name: "Privacy Policy", 
        desc: "How we protect your data",
        href: "/privacy", 
        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg> 
      },
    ],
  };

  return (
    <nav className={`absolute top-0 left-0 right-0 z-50 transition-colors duration-300 ${isMobileMenuOpen ? "bg-white dark:bg-[#0a0f1e]" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between relative z-[60]">
        
        {/* Logo (Always Visible) */}
        <Link href="/" className="flex items-center gap-3 group relative z-[60]">
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
        <div className="hidden lg:flex items-center gap-8 text-[15px] font-semibold">
          
          {/* Services Desktop Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 py-2 text-zinc-700 hover:text-[#c7365f] dark:text-white/80 dark:hover:text-[#e8447a] transition-colors duration-200">
              Services
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 w-[320px] pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden p-3 flex flex-col gap-1">
                {navItems.services.map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group/link">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-white/50 group-hover/link:bg-[#c7365f]/10 group-hover/link:text-[#c7365f] transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-zinc-900 dark:text-white group-hover/link:text-[#c7365f] transition-colors">{item.name}</span>
                      <span className="text-[13px] text-zinc-500 dark:text-white/50 font-normal mt-0.5">{item.desc}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Creators (Disabled) */}
          <div className="flex items-center gap-1.5 py-2 text-zinc-400 dark:text-white/30 cursor-not-allowed opacity-50">
            Creators
          </div>

          {/* Resources Desktop Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 py-2 text-zinc-700 hover:text-[#c7365f] dark:text-white/80 dark:hover:text-[#e8447a] transition-colors duration-200">
              Resources
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 w-[280px] pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden p-3 flex flex-col gap-1">
                {navItems.resources.map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group/link">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-white/50 group-hover/link:bg-[#c7365f]/10 group-hover/link:text-[#c7365f] transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-zinc-900 dark:text-white group-hover/link:text-[#c7365f] transition-colors">{item.name}</span>
                      <span className="text-[13px] text-zinc-500 dark:text-white/50 font-normal mt-0.5">{item.desc}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Company Desktop Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 py-2 text-zinc-700 hover:text-[#c7365f] dark:text-white/80 dark:hover:text-[#e8447a] transition-colors duration-200">
              Company
              <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className="absolute top-full left-0 w-[280px] pt-4 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300">
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] overflow-hidden p-3 flex flex-col gap-1">
                {navItems.company.map((item) => (
                  <Link key={item.name} href={item.href} className="flex items-center gap-4 px-3 py-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-all group/link">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-white/50 group-hover/link:bg-[#c7365f]/10 group-hover/link:text-[#c7365f] transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[15px] font-bold text-zinc-900 dark:text-white group-hover/link:text-[#c7365f] transition-colors">{item.name}</span>
                      <span className="text-[13px] text-zinc-500 dark:text-white/50 font-normal mt-0.5">{item.desc}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden lg:flex items-center gap-4 z-[60]">
          <Link
            href="/auth/register"
            className="px-6 py-2.5 text-[15px] font-bold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-full hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Sign Up
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-2.5 text-[15px] font-bold text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden relative w-12 h-12 flex flex-col justify-center items-center z-[70] bg-zinc-50 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors"
          aria-label="Toggle menu"
        >
          <span className={`absolute block w-6 h-[2px] bg-zinc-900 dark:bg-white transition-all duration-400 ease-in-out ${isMobileMenuOpen ? 'rotate-45' : '-translate-y-2'}`} />
          <span className={`absolute block w-6 h-[2px] bg-zinc-900 dark:bg-white transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'}`} />
          <span className={`absolute block w-6 h-[2px] bg-zinc-900 dark:bg-white transition-all duration-400 ease-in-out ${isMobileMenuOpen ? '-rotate-45' : 'translate-y-2'}`} />
        </button>
      </div>

      {/* ───── Mobile Menu Slider ───── */}
      <div 
        className={`lg:hidden absolute top-0 left-0 w-full min-h-[100dvh] bg-white dark:bg-[#0a0f1e] z-[50] pt-24 overflow-y-auto transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col min-h-[calc(100dvh-96px)] px-6">
          
          <div className="flex-none space-y-4">
            
            {/* Mobile Services */}
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <button 
                onClick={() => toggleDropdown("services")}
                className="flex items-center justify-between w-full py-4 text-2xl font-semibold text-zinc-900 dark:text-white transition-colors"
              >
                Services
                <svg className={`w-6 h-6 text-zinc-400 transition-transform duration-400 ease-in-out ${openDropdown === "services" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-400 ease-in-out ${openDropdown === "services" ? "grid-rows-[1fr] opacity-100 mb-6 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden flex flex-col gap-3">
                  {navItems.services.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-2xl hover:border-[#c7365f]/50 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-[#c7365f] transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-zinc-900 dark:text-white">{item.name}</span>
                        <span className="text-[13px] text-zinc-500 dark:text-white/50">{item.desc}</span>
                      </div>
                      <svg className="w-5 h-5 ml-auto text-zinc-300 dark:text-white/20 group-hover:text-[#c7365f] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Creators Disabled */}
            <div className="border-b border-black/5 dark:border-white/5 py-4 flex items-center justify-start gap-2">
              <span className="text-2xl font-semibold text-zinc-300 dark:text-white/20 cursor-not-allowed">
                Creators
              </span>
            </div>

            {/* Mobile Resources */}
            <div className="border-b border-black/5 dark:border-white/5 pb-2">
              <button 
                onClick={() => toggleDropdown("resources")}
                className="flex items-center justify-between w-full py-4 text-2xl font-semibold text-zinc-900 dark:text-white transition-colors"
              >
                Resources
                <svg className={`w-6 h-6 text-zinc-400 transition-transform duration-400 ease-in-out ${openDropdown === "resources" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-400 ease-in-out ${openDropdown === "resources" ? "grid-rows-[1fr] opacity-100 mb-6 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden flex flex-col gap-3">
                  {navItems.resources.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-2xl hover:border-[#c7365f]/50 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-[#c7365f] transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-zinc-900 dark:text-white">{item.name}</span>
                        <span className="text-[13px] text-zinc-500 dark:text-white/50">{item.desc}</span>
                      </div>
                      <svg className="w-5 h-5 ml-auto text-zinc-300 dark:text-white/20 group-hover:text-[#c7365f] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Company */}
            <div className="pb-2">
              <button 
                onClick={() => toggleDropdown("company")}
                className="flex items-center justify-between w-full py-4 text-2xl font-semibold text-zinc-900 dark:text-white transition-colors"
              >
                Company
                <svg className={`w-6 h-6 text-zinc-400 transition-transform duration-400 ease-in-out ${openDropdown === "company" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`grid transition-all duration-400 ease-in-out ${openDropdown === "company" ? "grid-rows-[1fr] opacity-100 mb-6 mt-2" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden flex flex-col gap-3">
                  {navItems.company.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 p-3 bg-zinc-50 dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-2xl hover:border-[#c7365f]/50 transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center text-zinc-600 dark:text-white/60 group-hover:text-[#c7365f] transition-colors">
                        {item.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[16px] font-bold text-zinc-900 dark:text-white">{item.name}</span>
                        <span className="text-[13px] text-zinc-500 dark:text-white/50">{item.desc}</span>
                      </div>
                      <svg className="w-5 h-5 ml-auto text-zinc-300 dark:text-white/20 group-hover:text-[#c7365f] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow" />

          {/* Mobile Action Buttons */}
          <div className="flex gap-4 pb-12 pt-8">
            <Link
              href="/auth/register"
              className="flex-1 flex items-center justify-center py-4 text-[16px] font-bold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-xl hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all"
            >
              Sign Up
            </Link>
            <Link
              href="/auth/login"
              className="flex-1 flex items-center justify-center py-4 text-[16px] font-bold text-zinc-700 hover:text-zinc-900 dark:text-white/80 dark:hover:text-white border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-white/5 transition-colors"
            >
              Sign In
            </Link>
          </div>
          
        </div>
      </div>
    </nav>
  );
}
