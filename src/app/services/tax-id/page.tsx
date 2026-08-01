"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function TaxIdPage() {
  const [activeTab, setActiveTab] = useState(0);

  const taxCategories = [
    {
      id: "corporate-tin",
      title: "Corporate TIN (FIRS)",
      subtitle: "For LLCs & Companies",
      desc: "Mandatory for all Limited Liability Companies (LLCs). Issued directly by the Federal Inland Revenue Service (FIRS) for corporate tax filings, VAT, and company income tax.",
      bestFor: ["Limited Companies (LTD)", "Corporations", "Foreign-owned Businesses"],
      timeline: "30 Mins - 1 Hour",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="20" y="20" width="60" height="60" rx="8" fill="currentColor" fillOpacity="0.2" />
          <path d="M20 40H80M40 80V20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="60" cy="60" r="8" fill="currentColor" />
        </svg>
      ),
      color: "bg-[#E0E7FF] text-[#1D4ED8] dark:bg-[#1D4ED8]/20 dark:text-[#E0E7FF]"
    },
    {
      id: "individual-tin",
      title: "Individual / JTB TIN",
      subtitle: "For Business Names",
      desc: "Generated through the Joint Tax Board (JTB). This is required for Sole Proprietorships and Partnerships to pay personal income tax and open merchant bank accounts.",
      bestFor: ["Business Names", "Sole Proprietors", "Freelancers", "Consultants"],
      timeline: "30 Mins - 1 Hour",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <circle cx="50" cy="40" r="16" fill="currentColor" fillOpacity="0.2" />
          <path d="M25 85C25 65 35 60 50 60C65 60 75 65 75 85" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M70 30L85 45L70 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      ),
      color: "bg-[#F3E8FF] text-[#4338CA] dark:bg-[#4338CA]/20 dark:text-[#F3E8FF]"
    },
    {
      id: "ngo-tin",
      title: "NGO & Non-Profit TIN",
      subtitle: "Incorporated Trustees",
      desc: "Even though NGOs are legally tax-exempt from corporate income tax, they are strictly required by law to have a TIN to operate bank accounts and deduct PAYE for staff.",
      bestFor: ["Churches & Mosques", "Charities", "Foundations", "Associations"],
      timeline: "30 Mins - 1 Hour",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <path d="M50 20L80 40V80H20V40L50 20Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M50 20L20 40V80H80V40L50 20Z" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 50V70M40 60H60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: "bg-[#E0F2FE] text-[#0369A1] dark:bg-[#0369A1]/20 dark:text-[#E0F2FE]"
    },
    {
      id: "vat-registration",
      title: "VAT Registration",
      subtitle: "Value Added Tax",
      desc: "Once your TIN is generated, you must register for VAT to legally collect and remit the 7.5% Value Added Tax on goods and services sold in Nigeria.",
      bestFor: ["Retailers", "Service Providers", "E-commerce", "Importers"],
      timeline: "1 - 2 Business Days",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="25" y="20" width="50" height="65" rx="6" fill="currentColor" fillOpacity="0.2" />
          <rect x="25" y="20" width="50" height="65" rx="6" stroke="currentColor" strokeWidth="6" />
          <path d="M40 40H60M40 55H60M40 70H50" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      ),
      color: "bg-[#FEF3C7] text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#FEF3C7]"
    }
  ];

  const benefits = [
    {
      title: "Corporate Banking",
      desc: "It is legally impossible to open or operate a corporate bank account in Nigeria without a verified Tax Identification Number.",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    },
    {
      title: "Government Contracts",
      desc: "Bidding for government tenders, supplier contracts, or applying for federal grants requires a valid TIN and Tax Clearance Certificate.",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    },
    {
      title: "Import & Export",
      desc: "You cannot clear goods at the Nigerian ports or process international shipping documents without your company's TIN.",
      icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Avoid Penalties",
      desc: "Operating without a TIN violates the Companies Income Tax Act (CITA), leading to severe financial penalties and business closure.",
      icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    }
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-20">
        
        {/* ───── HERO SECTION ───── */}
        <section className="relative pt-20 pb-16 px-6 overflow-hidden">
          {/* BLUE/INDIGO BRAND GLOW */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
          
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-[55%] z-10">
              {/* BLUE BADGE */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-blue-600/10 text-blue-700 dark:text-blue-400 mb-6">
                Joint Tax Board / FIRS
              </div>
              <h1 
                className="font-normal tracking-tight text-[#1a1a1a] dark:text-white mb-6"
                style={{ fontSize: 'clamp(40px, 5vw, 64px)', lineHeight: '1.05', fontFamily: 'system-ui, sans-serif' }}
              >
                Generate your <br />
                Tax ID instantly.
              </h1>
              <p className="text-[18px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed max-w-lg" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                Required by law for all registered businesses. We interface directly with the Joint Tax Board (JTB) and FIRS to generate your official TIN in less than an hour.
              </p>
              {/* BLUE BUTTON */}
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-all duration-300 font-medium text-[16px] shadow-lg shadow-blue-600/30"
              >
                Generate Tax ID (TIN)
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Value Proposition Card & NRS Logo */}
            <div className="w-full lg:w-[45%] relative flex flex-col items-center justify-center lg:pl-10">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent rounded-[40px] transform rotate-3" />
              
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative z-10 w-full max-w-md">
                
                {/* NRS LOGO CONTAINER */}
                <div className="h-20 w-auto inline-flex bg-white rounded-xl p-3 mb-8 items-center justify-center border border-black/5 shadow-sm">
                  <Image 
                    src="/nrs.png" 
                    alt="Nigeria Revenue Service" 
                    width={100} 
                    height={64} 
                    className="object-contain" 
                  />
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 text-[#1a1a1a] dark:text-white tracking-tight">
                  Skip the FIRS queues.
                </h3>
                
                <p className="text-[16px] text-[#767676] dark:text-white/60 leading-relaxed">
                  Visiting tax offices manually means dealing with endless paperwork, long queues, and unexplained delays. Our automated system fetches your TIN instantly from the database.
                </p>
                
                {/* BLUE INFO BOX */}
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-blue-600/10 dark:bg-blue-600/20 flex flex-shrink-0 items-center justify-center text-blue-600 dark:text-blue-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold tracking-wide text-[#1a1a1a] dark:text-white leading-tight">Lightning fast delivery</p>
                    <p className="text-[13.5px] text-[#767676] dark:text-white/50 mt-0.5">Average delivery time: 30 mins - 1 hr.</p>
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
                Why do you need a Tax ID?
              </h2>
              <p className="text-lg text-[#767676] dark:text-white/60 max-w-2xl mx-auto">
                Your Tax Identification Number (TIN) is the financial fingerprint of your business. Without it, you are locked out of the formal economy.
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

        {/* ───── INTERACTIVE ENTITY TABS ───── */}
        <section className="py-24 px-6 overflow-hidden">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            {/* Left Column: The Tab Menu */}
            <div className="w-full lg:w-1/3 flex flex-col">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-8 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Tax profiles.
              </h2>
              <p className="text-[16px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Depending on your business structure, your TIN is generated from different regulatory databases. Select your business type below.
              </p>

              <div className="flex flex-col gap-2">
                {taxCategories.map((category, index) => {
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
                  <div className={`w-full md:w-2/5 h-48 md:h-auto flex items-center justify-center p-10 ${taxCategories[activeTab].color}`}>
                    <div className="w-full max-w-[160px] transform transition-transform duration-700 hover:scale-110">
                      {taxCategories[activeTab].icon}
                    </div>
                  </div>

                  {/* Text Details Side */}
                  <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-2">
                      <span className="text-sm font-bold tracking-widest uppercase text-blue-600 dark:text-blue-400 opacity-80">
                        {taxCategories[activeTab].subtitle}
                      </span>
                    </div>
                    <h3 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-4">
                      {taxCategories[activeTab].title}
                    </h3>
                    <p className="text-[16px] text-[#767676] dark:text-white/60 mb-8 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                      {taxCategories[activeTab].desc}
                    </p>

                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-3">Target Entities:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {taxCategories[activeTab].bestFor.map((item, idx) => (
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
                        Average timeframe: <strong className="text-zinc-900 dark:text-white">{taxCategories[activeTab].timeline}</strong>
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
