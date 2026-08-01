"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function UtilitiesPage() {
  const [activeTab, setActiveTab] = useState(0);

  const utilityCategories = [
    {
      id: "data-bundles",
      title: "Data Bundles",
      subtitle: "Cheap SME & Direct Data",
      desc: "Stay connected without breaking the bank. We offer highly discounted SME data, corporate gifting, and direct data plans across all major networks in Nigeria.",
      bestFor: ["SME Data", "Corporate Data", "Gifting", "Unlimited Plans"],
      delivery: "Instant Automation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80C33.4315 80 20 66.5685 20 50Z" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
          <path d="M50 35V65M35 50H65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      ),
      color: "bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/20 dark:text-[#FCE7F3]"
    },
    {
      id: "airtime",
      title: "Airtime Top-Up",
      subtitle: "Virtual Top Up (VTU)",
      desc: "Recharge your phone instantly with our automated VTU system. No scratch cards, no hidden charges. Buy airtime for yourself, staff, or clients directly from your wallet.",
      bestFor: ["Personal Recharge", "Bulk Airtime", "Staff Allowances"],
      delivery: "Instant Automation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="30" y="15" width="40" height="70" rx="8" fill="currentColor" fillOpacity="0.2" />
          <path d="M45 25H55M45 75H55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="4" />
        </svg>
      ),
      color: "bg-[#E0F4FE] text-[#0369A1] dark:bg-[#0369A1]/20 dark:text-[#E0F4FE]"
    },
    {
      id: "electricity",
      title: "Electricity Bills",
      subtitle: "Prepaid & Postpaid",
      desc: "Never stay in the dark. Generate your meter tokens instantly for all major DisCos in Nigeria (IBEDC, IKEDC, EKEDC, AEDC, etc.) 24/7.",
      bestFor: ["Prepaid Meters", "Postpaid Bills", "Office Utilities"],
      delivery: "Instant Token Generation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <path d="M55 15L30 55H50L45 85L70 45H50L55 15Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" />
        </svg>
      ),
      color: "bg-[#FEF3C7] text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#FEF3C7]"
    },
    {
      id: "cable-tv",
      title: "Cable TV",
      subtitle: "DSTV, GOTV, Startimes",
      desc: "Renew your Cable TV subscriptions instantly. Our system connects directly to the providers to clear error codes and restore viewing immediately.",
      bestFor: ["DSTV", "GOTV", "Showmax", "Startimes"],
      delivery: "Instant Activation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="15" y="25" width="70" height="50" rx="6" fill="currentColor" fillOpacity="0.2" />
          <path d="M30 25L50 10L70 25" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="50" r="12" stroke="currentColor" strokeWidth="4" />
        </svg>
      ),
      color: "bg-[#DCFCE7] text-[#047857] dark:bg-[#047857]/20 dark:text-[#DCFCE7]"
    }
  ];

  const benefits = [
    {
      title: "Cheaper Data Rates",
      desc: "We offer some of the cheapest SME data bundles in the market. Cut down your business operating costs significantly.",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "100% Automated",
      desc: "No waiting for human confirmation. Once you fund your wallet, your airtime, data, or meter tokens are delivered instantly via API.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z"
    },
    {
      title: "Integrated Wallet",
      desc: "Fund your wallet once and use it to buy data, airtime, pay bills, and even register your CAC businesses—all from one balance.",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    },
    {
      title: "All Networks Supported",
      desc: "Whether you need MTN SME data, Airtel corporate gifting, Glo, or 9mobile, our system covers all major telecom providers seamlessly.",
      icon: "M8.04 4.04C8.54 3.392 9.23 3 10 3h4c.77 0 1.46.392 1.96 1.04m-7.92 15.92A2.989 2.989 0 0010 21h4c.77 0 1.46-.392 1.96-1.04M3 12h18M5 8h14M5 16h14"
    }
  ];

  const networks = [
    { src: "/mtn.png", alt: "MTN" },
    { src: "/airtel.png", alt: "Airtel" },
    { src: "/glo.png", alt: "Glo" },
    { src: "/9mobile.png", alt: "9mobile" },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-20">
        
        {/* ───── HERO SECTION ───── */}
        <section className="relative pt-20 pb-16 px-6 overflow-hidden">
          {/* BRAND PINK/RED GLOW */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c7365f]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-[55%] z-10">
              {/* BRAND PINK/RED BADGE */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6">
                Utility Vending
              </div>
              <h1 
                className="font-normal tracking-tight text-[#1a1a1a] dark:text-white mb-6"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '1.05', fontFamily: 'system-ui, sans-serif' }}
              >
                Cheap data & <br />
                instant airtime.
              </h1>
              <p className="text-[18px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed max-w-lg" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                Keep your business online with highly discounted SME data plans and instant virtual top-ups. Manage all your utility bills securely from a single, unified wallet.
              </p>
              {/* BRAND PINK/RED BUTTON */}
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] hover:scale-105 transition-all duration-300 font-medium text-[16px] shadow-lg shadow-[#c7365f]/30"
              >
                Fund Wallet & Buy Now
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            <div className="w-full lg:w-[45%] relative flex flex-col items-center justify-center lg:pl-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c7365f]/5 to-transparent rounded-[40px] transform rotate-3" />
              
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative z-10 w-full max-w-md">
                
                <div className="h-16 w-16 bg-white rounded-xl p-2 mb-8 flex items-center justify-center border border-black/5 shadow-sm">
                  <Image 
                    src="/airtime.png" 
                    alt="Airtime & Data" 
                    width={48} 
                    height={48} 
                    className="object-contain" 
                  />
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 text-[#1a1a1a] dark:text-white tracking-tight">
                  All Networks Supported
                </h3>
                
                <p className="text-[16px] text-[#767676] dark:text-white/60 mb-6 leading-relaxed">
                  We support instant vending across every major telecom provider in Nigeria with zero downtime.
                </p>

                {/* NETWORK LOGOS GRID */}
                <div className="flex items-center gap-3">
                  {networks.map((network, i) => (
                    <div key={i} className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center border border-black/5 dark:border-white/5 p-2">
                       <Image src={network.src} alt={network.alt} width={40} height={40} className="object-contain" />
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ───── WHY UTILITIES MATTER ───── */}
        <section className="py-24 bg-[#fafafa] dark:bg-[#111827]/50 border-y border-black/5 dark:border-white/5">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-4 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Why use LoraBiz for Utilities?
              </h2>
              <p className="text-lg text-[#767676] dark:text-white/60 max-w-2xl mx-auto">
                We bridge the gap between compliance and operations. Once your business is registered, keep it running smoothly with our discounted utility tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, i) => (
                <div key={i} className="bg-white dark:bg-[#111827] p-8 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-xl transition-shadow duration-300">
                  <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-zinc-900 dark:text-white mb-6">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={benefit.icon} />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#1a1a1a] dark:text-white">{benefit.title}</h3>
                  <p className="text-[15px] leading-relaxed text-[#767676] dark:text-white/60" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                    {benefit.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───── INTERACTIVE UTILITY TABS ───── */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            <div className="w-full lg:w-1/3 flex flex-col">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-8 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Available Services.
              </h2>
              <p className="text-[16px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                From keeping your servers online with electricity to keeping your team connected with data, explore our utility offerings.
              </p>

              <div className="flex flex-col gap-2">
                {utilityCategories.map((category, index) => {
                  const isActive = activeTab === index;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(index)}
                      className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                        isActive 
                        ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827] shadow-lg" 
                        : "bg-transparent text-[#767676] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="font-medium text-[17px]">{category.title}</span>
                      <svg 
                        className={`w-5 h-5 transition-transform duration-300 ${isActive ? "opacity-100 translate-x-1" : "opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0"}`} 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-2/3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="bg-white dark:bg-[#111827] rounded-[32px] border border-black/5 dark:border-white/5 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[400px] h-auto"
                >
                  <div className={`w-full md:w-2/5 h-48 md:h-auto flex items-center justify-center p-10 ${utilityCategories[activeTab].color}`}>
                    <div className="w-full max-w-[160px] transform transition-transform duration-700 hover:scale-110">
                      {utilityCategories[activeTab].icon}
                    </div>
                  </div>

                  <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-2">
                      <span className="text-sm font-bold tracking-widest uppercase text-[#c7365f] dark:text-[#e8447a] opacity-80">
                        {utilityCategories[activeTab].subtitle}
                      </span>
                    </div>
                    <h3 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-4">
                      {utilityCategories[activeTab].title}
                    </h3>
                    <p className="text-[16px] text-[#767676] dark:text-white/60 mb-8 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                      {utilityCategories[activeTab].desc}
                    </p>

                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-3">Best Suited For:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {utilityCategories[activeTab].bestFor.map((item, idx) => (
                          <li key={idx} className="bg-black/5 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-full text-[13px] font-medium">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/10 flex items-center gap-3">
                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[14px] font-medium text-zinc-600 dark:text-zinc-400">
                        Delivery: <strong className="text-zinc-900 dark:text-white">{utilityCategories[activeTab].delivery}</strong>
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
