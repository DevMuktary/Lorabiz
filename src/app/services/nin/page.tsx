"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image"; // <-- Added Image import
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function NINVerificationPage() {
  const [activeTab, setActiveTab] = useState(0);

  const slipTypes = [
    {
      id: "regular-slip",
      title: "Regular Slip",
      subtitle: "Detailed Demographic Format",
      desc: "Contains comprehensive information including your name, address, photo, tracking ID, and gender. This is the primary format heavily recommended and accepted by the CAC for Business Name registrations.",
      bestFor: ["CAC Business Names", "Comprehensive KYC", "Internal Records"],
      delivery: "Instant Generation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="20" y="35" width="60" height="30" rx="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M30 50H70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
        </svg>
      ),
      color: "bg-[#FEF3C7] text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#FEF3C7]"
    },
    {
      id: "standard-slip",
      title: "Standard Slip",
      subtitle: "Standard KYC Format",
      desc: "A widely accepted format by both the Corporate Affairs Commission and commercial banks. It serves as a reliable, official alternative to the premium slip for everyday business setups and account openings.",
      bestFor: ["CAC Registrations", "Bank Accounts", "Telecom KYC"],
      delivery: "Instant Generation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="25" y="15" width="50" height="70" rx="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M35 30H65M35 45H65M35 60H55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="75" r="4" fill="currentColor" />
        </svg>
      ),
      color: "bg-[#E0F4FE] text-[#0369A1] dark:bg-[#0369A1]/20 dark:text-[#E0F4FE]"
    },
    {
      id: "premium-slip",
      title: "Premium Slip",
      subtitle: "Colored Card Format",
      desc: "The fully colored, premium card-like format. It is universally accepted across all major Nigerian institutions, government agencies, and corporate banks for advanced KYC checks and official verifications.",
      bestFor: ["Corporate Bank Accounts", "International Verification", "Official Registrations"],
      delivery: "Instant Generation",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="15" y="25" width="70" height="50" rx="6" fill="currentColor" fillOpacity="0.2" />
          <rect x="25" y="35" width="20" height="25" rx="4" fill="currentColor" fillOpacity="0.4" />
          <path d="M55 40H75M55 50H70M55 60H65" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      ),
      color: "bg-[#DCFCE7] text-[#047857] dark:bg-[#047857]/20 dark:text-[#DCFCE7]"
    }
  ];

  const benefits = [
    {
      title: "CAC Registrations",
      desc: "The Corporate Affairs Commission strictly requires a valid NIN for all directors, proprietors, and trustees before any business can be registered.",
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    },
    {
      title: "Banking & Finance",
      desc: "Banks mandate a verifiable NIN slip to open personal or corporate accounts, upgrade account tiers, or resolve account restrictions.",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    },
    {
      title: "Instant Access",
      desc: "Skip the long queues at NIMC centers. Simply enter your Phone Number or NIN on our platform to generate your official slip instantly.",
      icon: "M13 10V3L4 14h7v7l9-11h-7z"
    },
    {
      title: "Secure Verification",
      desc: "Generated securely via direct API infrastructure. Ideal for reliable identity confirmation required by employers or agencies.",
      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    }
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
                Identity Verification
              </div>
              <h1 
                className="font-normal tracking-tight text-[#1a1a1a] dark:text-white mb-6"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '1.05', fontFamily: 'system-ui, sans-serif' }}
              >
                Generate your NIN <br />
                Slip instantly.
              </h1>
              <p className="text-[18px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed max-w-lg" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                We integrated this feature directly into LoraBiz because it is a strict requirement for CAC applications and bank setups. Simply enter your Phone Number or NIN to generate your slip.
              </p>
              {/* BRAND PINK/RED BUTTON */}
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] hover:scale-105 transition-all duration-300 font-medium text-[16px] shadow-lg shadow-[#c7365f]/30"
              >
                Generate My NIN Slip
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Warning / Usage Card */}
            <div className="w-full lg:w-[45%] relative flex flex-col items-center justify-center lg:pl-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c7365f]/5 to-transparent rounded-[40px] transform rotate-3" />
              
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative z-10 w-full max-w-md">
                
                {/* OFFICIAL NIMC LOGO */}
                <div className="h-20 w-auto inline-flex bg-white rounded-xl p-3 mb-8 items-center justify-center border border-black/5 shadow-sm">
                  <Image 
                    src="/nimc.png" 
                    alt="National Identity Management Commission" 
                    width={100} 
                    height={64} 
                    className="object-contain" 
                  />
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 text-[#1a1a1a] dark:text-white tracking-tight">
                  Accepted everywhere.
                </h3>
                
                <p className="text-[16px] text-[#767676] dark:text-white/60 leading-relaxed">
                  The slips generated on our platform are formatted specifically to meet the documentation requirements of commercial banks, the CAC, and government agencies. 
                </p>
                
                {/* Legal Use Reminder */}
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex flex-shrink-0 items-center justify-center text-amber-600">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold tracking-wide text-[#1a1a1a] dark:text-white leading-tight mb-1">For Official Use Only</p>
                    <p className="text-[13px] text-[#767676] dark:text-white/50 leading-snug">To ensure platform integrity, slip generation must be for legal purposes. Logs are maintained in accordance with our terms of service.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* ───── WHY REGISTRATION MATTERS ───── */}
        <section className="py-24 bg-[#fafafa] dark:bg-[#111827]/50 border-y border-black/5 dark:border-white/5">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-4 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Why do you need this slip?
              </h2>
              <p className="text-lg text-[#767676] dark:text-white/60 max-w-2xl mx-auto">
                Without a physical or digital copy of your NIN slip, advancing in business setups and financial services is nearly impossible.
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

        {/* ───── INTERACTIVE SLIP TABS ───── */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            {/* Left Column: The Tab Menu */}
            <div className="w-full lg:w-1/3 flex flex-col">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-8 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Available Slip Formats.
              </h2>
              <p className="text-[16px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Different institutions require different formats of your NIN. We provide three tailored layouts so you always have exactly what they ask for.
              </p>

              <div className="flex flex-col gap-2">
                {slipTypes.map((slip, index) => {
                  const isActive = activeTab === index;
                  return (
                    <button
                      key={slip.id}
                      onClick={() => setActiveTab(index)}
                      className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                        isActive 
                        ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827] shadow-lg" 
                        : "bg-transparent text-[#767676] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="font-medium text-[17px]">{slip.title}</span>
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

            {/* Right Column: The Motion Content */}
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
                  {/* Visual Graphic Side */}
                  <div className={`w-full md:w-2/5 h-48 md:h-auto flex items-center justify-center p-10 ${slipTypes[activeTab].color}`}>
                    <div className="w-full max-w-[160px] transform transition-transform duration-700 hover:scale-110">
                      {slipTypes[activeTab].icon}
                    </div>
                  </div>

                  {/* Text Details Side */}
                  <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-2">
                      <span className="text-sm font-bold tracking-widest uppercase text-[#c7365f] dark:text-[#e8447a] opacity-80">
                        {slipTypes[activeTab].subtitle}
                      </span>
                    </div>
                    <h3 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-4">
                      {slipTypes[activeTab].title}
                    </h3>
                    <p className="text-[16px] text-[#767676] dark:text-white/60 mb-8 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                      {slipTypes[activeTab].desc}
                    </p>

                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-3">Accepted For:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {slipTypes[activeTab].bestFor.map((item, idx) => (
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
                        Availability: <strong className="text-zinc-900 dark:text-white">{slipTypes[activeTab].delivery}</strong>
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
