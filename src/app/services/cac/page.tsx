"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function CACRegistrationPage() {
  const [activeTab, setActiveTab] = useState(0);

  const entityTypes = [
    {
      id: "business-name",
      title: "Business Name",
      subtitle: "Sole Proprietorship",
      desc: "The simplest and fastest way to register your business. You and your business are the same legal entity, making tax and management straightforward.",
      bestFor: ["Freelancers", "Solo Consultants", "Small Retail Shops", "Artisans"],
      timeline: "1 - 2 Working  Hrs",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <circle cx="50" cy="40" r="20" fill="currentColor" fillOpacity="0.2" />
          <path d="M20 90C20 70 35 65 50 65C65 65 80 70 80 90" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </svg>
      ),
      color: "bg-[#E0F4FE] text-[#0369A1] dark:bg-[#0369A1]/20 dark:text-[#E0F4FE]"
    },
    {
      id: "llc",
      title: "Limited Company",
      subtitle: "LLC / LTD",
      desc: "A completely separate legal entity from its owners. It offers limited liability protection, meaning your personal assets are completely secure.",
      bestFor: ["Startups", "Tech Companies", "Agencies", "Businesses seeking investment"],
      timeline: "3 - 7 Business Days",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="25" y="30" width="50" height="60" rx="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M40 50H60M40 70H60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M15 90H85" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
          <polygon points="50,10 20,30 80,30" fill="currentColor" fillOpacity="0.4" />
        </svg>
      ),
      color: "bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/20 dark:text-[#FCE7F3]"
    },
    {
      id: "ngo",
      title: "NGO / Foundation",
      subtitle: "Incorporated Trustees",
      desc: "Designed specifically for non-profits, charities, religious bodies, and social clubs. It is governed by an appointed board of trustees.",
      bestFor: ["Churches & Mosques", "Charity Organizations", "Alumni Associations", "Clubs"],
      timeline: "2 - 4 Weeks (Subject to Newspaper Pub.)",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
          <path d="M35 55C40 65 60 65 65 55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="50" r="10" fill="currentColor" fillOpacity="0.3" />
        </svg>
      ),
      color: "bg-[#DCFCE7] text-[#047857] dark:bg-[#047857]/20 dark:text-[#DCFCE7]"
    }
  ];

  const benefits = [
    {
      title: "Corporate Bank Account",
      desc: "Registration is the only way to open a business bank account, allowing you to separate personal and business finances.",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    },
    {
      title: "Access to Loans & Grants",
      desc: "Investors, banks, and government grant programs require a CAC certificate before they will fund your business.",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Brand Trust",
      desc: "Customers are far more likely to trust and pay a registered entity than an unregistered individual.",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Legal Protection",
      desc: "Protect your personal assets and secure the exclusive right to use your business name across Nigeria.",
      icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    }
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-20">
        
        {/* ───── HERO SECTION ───── */}
        <section className="relative pt-20 pb-16 px-6 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c7365f]/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-[55%] z-10">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-black/5 dark:bg-white/10 mb-6">
                Corporate Affairs Commission
              </div>
              <h1 
                className="font-normal tracking-tight text-[#1a1a1a] dark:text-white mb-6"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '1.05', fontFamily: 'system-ui, sans-serif' }}
              >
                Legitimize your <br />
                business instantly.
              </h1>
              <p className="text-[18px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed max-w-lg" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                Skip the endless paperwork and long queues. LoraBiz completely automates your CAC registration so you can get your official certificate and start operating globally.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] hover:scale-105 transition-all duration-300 font-medium text-[16px] shadow-lg shadow-[#c7365f]/30"
              >
                Register My Business
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Value Proposition Card & CAC Logo */}
            <div className="w-full lg:w-[45%] relative flex flex-col items-center justify-center lg:pl-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c7365f]/5 to-transparent rounded-[40px] transform rotate-3" />
              
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative z-10 w-full max-w-md">
                
                {/* Official CAC Logo Container */}
                <div className="h-16 w-36 bg-white rounded-xl p-3 mb-8 flex items-center justify-center border border-black/5 shadow-sm">
                  <Image 
                    src="/cac.png" 
                    alt="Corporate Affairs Commission" 
                    width={120} 
                    height={40} 
                    className="object-contain" 
                  />
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 text-[#1a1a1a] dark:text-white tracking-tight">
                  Stop overpaying agents.
                </h3>
                
                <p className="text-[16px] text-[#767676] dark:text-white/60 leading-relaxed">
                  Traditional agents charge outrageous fees and take weeks to deliver. Our platform is connected directly to the CAC to get your business registered faster and at a fraction of the cost.
                </p>
                
                {/* Clean, Non-AI looking Pricing Highlight */}
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#c7365f]/10 dark:bg-[#c7365f]/20 flex flex-shrink-0 items-center justify-center text-[#c7365f]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold tracking-wide text-[#1a1a1a] dark:text-white leading-tight">Save up to 60%</p>
                    <p className="text-[13.5px] text-[#767676] dark:text-white/50 mt-0.5">on traditional registration fees.</p>
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
                Why is CAC Registration important?
              </h2>
              <p className="text-lg text-[#767676] dark:text-white/60">It is more than just a certificate. It is the key to unlocking your business potential.</p>
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

        {/* ───── INTERACTIVE ENTITY TABS ───── */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            {/* Left Column: The Tab Menu */}
            <div className="w-full lg:w-1/3 flex flex-col">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-8 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Choose the right structure.
              </h2>
              <p className="text-[16px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Select the legal entity that best fits your business goals. Not sure? Click through the options to see what matches your needs.
              </p>

              <div className="flex flex-col gap-2">
                {entityTypes.map((entity, index) => {
                  const isActive = activeTab === index;
                  return (
                    <button
                      key={entity.id}
                      onClick={() => setActiveTab(index)}
                      className={`text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-center justify-between group ${
                        isActive 
                        ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827] shadow-lg" 
                        : "bg-transparent text-[#767676] dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="font-medium text-[17px]">{entity.title}</span>
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
                  <div className={`w-full md:w-2/5 h-48 md:h-auto flex items-center justify-center p-10 ${entityTypes[activeTab].color}`}>
                    <div className="w-full max-w-[160px] transform transition-transform duration-700 hover:scale-110">
                      {entityTypes[activeTab].icon}
                    </div>
                  </div>

                  {/* Text Details Side */}
                  <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-2">
                      <span className="text-sm font-bold tracking-widest uppercase text-[#c7365f] opacity-80">
                        {entityTypes[activeTab].subtitle}
                      </span>
                    </div>
                    <h3 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-4">
                      {entityTypes[activeTab].title}
                    </h3>
                    <p className="text-[16px] text-[#767676] dark:text-white/60 mb-8 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                      {entityTypes[activeTab].desc}
                    </p>

                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-3">Best Suited For:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {entityTypes[activeTab].bestFor.map((item, idx) => (
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
                        Average timeframe: <strong className="text-zinc-900 dark:text-white">{entityTypes[activeTab].timeline}</strong>
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
