"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function SCUMLRegistrationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const scumlFaqs = [
    {
      question: "Who is required by law to get a SCUML certificate in Nigeria?",
      answer: "Under Nigerian Anti-Money Laundering regulations, all Designated Non-Financial Businesses and Professions (DNFBPs) must obtain SCUML certification. This includes Real Estate developers and agents, NGOs and Foundations, Law Firms, Accounting and Audit firms, Car Dealers, Jewelers, Hospitality businesses, and Construction companies.",
    },
    {
      question: "Can I open a corporate bank account without SCUML?",
      answer: "No. The Central Bank of Nigeria (CBN) strictly prohibits commercial banks from opening or operating corporate bank accounts for designated businesses without an official SCUML certificate issued by the EFCC.",
    },
    {
      question: "What documents are needed for SCUML registration?",
      answer: "You will need your CAC Registration Certificate, CAC Status Report, Tax Identification Number (TIN), Constitution/Bylaws (for NGOs), and valid IDs of directors or trustees.",
    },
    {
      question: "How long does SCUML processing take on Lorabiz?",
      answer: "Our compliance desk reviews and submits your documentation directly into the EFCC SCUML processing pipeline, typically completing compliance certification within 2 to 5 business days.",
    },
  ];

  const scumlCategories = [
    {
      id: "real-estate",
      title: "Real Estate & Construction",
      subtitle: "High-Value Transactions",
      desc: "Property developers, estate agents, and construction firms handle massive funds. SCUML is legally required to prove your operations are free from illicit financial flows.",
      bestFor: ["Estate Surveyors", "Property Developers", "Construction Companies", "Real Estate Agents"],
      timeline: "2 - 5 Business Days",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <path d="M20 80V40L50 15L80 40V80H20Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M50 15L20 40M50 15L80 40M20 80H80M40 80V60H60V80" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: "bg-[#E0F4FE] text-[#0369A1] dark:bg-[#0369A1]/20 dark:text-[#E0F4FE]"
    },
    {
      id: "ngos",
      title: "NGOs & Non-Profits",
      subtitle: "Incorporated Trustees",
      desc: "All charities, religious bodies, and social clubs must obtain a SCUML certificate to open a bank account and receive local or international donations securely.",
      bestFor: ["Churches & Mosques", "Charity Organizations", "Foundations", "Social Clubs"],
      timeline: "2 - 5 Business Days",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="6" strokeDasharray="10 10" />
          <path d="M35 55C40 65 60 65 65 55" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="50" r="10" fill="currentColor" fillOpacity="0.3" />
        </svg>
      ),
      color: "bg-[#DCFCE7] text-[#047857] dark:bg-[#047857]/20 dark:text-[#DCFCE7]"
    },
    {
      id: "professionals",
      title: "Professional Services",
      subtitle: "Advisory & Legal",
      desc: "Firms that offer financial or legal advice—including managing client assets or organizing company formations—fall strictly under EFCC anti-money laundering radar.",
      bestFor: ["Law Firms", "Accounting Firms", "Tax Consultants", "Audit Firms"],
      timeline: "2 - 5 Business Days",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <rect x="25" y="30" width="50" height="40" rx="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M25 30H75V70H25V30Z" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path d="M35 20H65V30H35V20Z" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </svg>
      ),
      color: "bg-[#FCE7F3] text-[#BE185D] dark:bg-[#BE185D]/20 dark:text-[#FCE7F3]"
    },
    {
      id: "luxury",
      title: "Dealers in Luxury Goods",
      subtitle: "High-Net-Worth Retail",
      desc: "Businesses selling high-value items often deal with large cash transactions. SCUML protects your business from being unknowingly used for money laundering.",
      bestFor: ["Jewelers", "Auto/Car Dealers", "Precious Metals/Stones", "Supermarkets"],
      timeline: "2 - 5 Business Days",
      icon: (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full opacity-80">
          <polygon points="50,20 80,45 65,85 35,85 20,45" fill="currentColor" fillOpacity="0.2" />
          <polygon points="50,20 80,45 65,85 35,85 20,45" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 45H80M50 20V85M35 85L50 45L65 85" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      color: "bg-[#FEF3C7] text-[#B45309] dark:bg-[#B45309]/20 dark:text-[#FEF3C7]"
    }
  ];

  const benefits = [
    {
      title: "Bank Account Activation",
      desc: "Nigerian banks will refuse to open or may freeze existing corporate accounts for DNFBPs until a valid SCUML certificate is provided.",
      icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    },
    {
      title: "EFCC Compliance",
      desc: "SCUML operates under the Economic and Financial Crimes Commission (EFCC). Certification keeps your business legally compliant and free from fines.",
      icon: "M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
    },
    {
      title: "International Trust",
      desc: "Foreign investors, grant providers, and international partners require AML (Anti-Money Laundering) compliance before doing business.",
      icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a8.966 8.966 0 01-5.965-2.258M12 21a8.966 8.966 0 005.965-2.258M12 3c-1.258 0-2.276.49-2.965 1.258M12 3c1.258 0 2.276.49 2.965 1.258M3 12h18"
    },
    {
      title: "Business Tenders",
      desc: "You cannot bid for large government contracts or major corporate tenders if your industry requires SCUML and you don't have it.",
      icon: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    }
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300 overflow-x-clip">
      <Navbar />

      <main className="pt-24 pb-20">
        
        <section className="relative pt-20 pb-16 px-6">
          {/* PINK/RED BRAND GLOW (safely contained to eliminate horizontal scrollbar/overflow) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c7365f]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
          </div>
          
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="w-full lg:w-[55%] z-10">
              {/* BRAND PINK/RED BADGE */}
              <div className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6">
                EFCC AML Compliance
              </div>
              <h1 
                className="font-normal tracking-tight text-[#1a1a1a] dark:text-white mb-6"
                style={{ fontSize: 'clamp(34px, 4.5vw, 54px)', lineHeight: '1.1', fontFamily: 'system-ui, sans-serif' }}
              >
                SCUML Certificate Registration <br />
                <span className="font-semibold text-[#c7365f]">Online in Nigeria</span>
              </h1>
              <p className="text-[17px] text-[#767676] dark:text-white/70 mb-8 leading-relaxed max-w-lg" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                Fast-track your EFCC Special Control Unit Against Money Laundering (SCUML) certificate. Mandatory for Real Estate, NGOs, Law Firms, Consulting, and opening corporate bank accounts in Nigeria.
              </p>
              {/* BRAND PINK/RED BUTTON */}
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] hover:scale-105 transition-all duration-300 font-medium text-[16px] shadow-lg shadow-[#c7365f]/30"
              >
                Start SCUML Application
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            <div className="w-full lg:w-[45%] relative flex flex-col items-center justify-center lg:pl-10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#c7365f]/5 to-transparent rounded-[40px] transform rotate-3" />
              
              <div className="bg-white dark:bg-[#111827] border border-black/5 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-2xl relative z-10 w-full max-w-md">
                
                {/* EFCC LOGO CONTAINER */}
                <div className="h-20 w-20 bg-white rounded-xl p-2 mb-8 flex items-center justify-center border border-black/5 shadow-sm">
                  <Image 
                    src="/scuml.png" 
                    alt="Economic and Financial Crimes Commission" 
                    width={64} 
                    height={64} 
                    className="object-contain" 
                  />
                </div>
                
                <h3 className="text-2xl font-semibold mb-4 text-[#1a1a1a] dark:text-white tracking-tight">
                  Skip the agency bottlenecks.
                </h3>
                
                <p className="text-[16px] text-[#767676] dark:text-white/60 leading-relaxed">
                  Traditional SCUML processing can take months of frustrating back-and-forth. Our system simplifies the documentation process, ensuring your application is 100% accurate before submission.
                </p>
                
                {/* BRAND PINK/RED INFO BOX */}
                <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/10 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-[#c7365f]/10 dark:bg-[#c7365f]/20 flex flex-shrink-0 items-center justify-center text-[#c7365f]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-bold tracking-wide text-[#1a1a1a] dark:text-white leading-tight">Fast-tracked processing</p>
                    <p className="text-[13.5px] text-[#767676] dark:text-white/50 mt-0.5">Track your status entirely online.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>

        <section className="py-24 bg-[#fafafa] dark:bg-[#111827]/50 border-y border-black/5 dark:border-white/5">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-4 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Why do you need SCUML?
              </h2>
              <p className="text-lg text-[#767676] dark:text-white/60 max-w-2xl mx-auto">
                Anti-Money Laundering laws are getting stricter. Without SCUML, your business operations can be halted entirely by the authorities.
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

        <section className="py-24 px-6">
          <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            <div className="w-full lg:w-1/3 flex flex-col">
              <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-8 text-[#1a1a1a] dark:text-white" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Who needs SCUML?
              </h2>
              <p className="text-[16px] text-[#767676] dark:text-white/60 mb-10 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Not every business needs this certificate. The EFCC strictly mandates it for DNFBPs (Designated Non-Financial Businesses and Professions). Check if you fall into these categories.
              </p>

              <div className="flex flex-col gap-2">
                {scumlCategories.map((category, index) => {
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
                  <div className={`w-full md:w-2/5 h-48 md:h-auto flex items-center justify-center p-10 ${scumlCategories[activeTab].color}`}>
                    <div className="w-full max-w-[160px] transform transition-transform duration-700 hover:scale-110">
                      {scumlCategories[activeTab].icon}
                    </div>
                  </div>

                  <div className="w-full md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
                    <div className="mb-2">
                      <span className="text-sm font-bold tracking-widest uppercase text-[#c7365f] dark:text-[#e8447a] opacity-80">
                        {scumlCategories[activeTab].subtitle}
                      </span>
                    </div>
                    <h3 className="text-3xl font-semibold text-[#1a1a1a] dark:text-white mb-4">
                      {scumlCategories[activeTab].title}
                    </h3>
                    <p className="text-[16px] text-[#767676] dark:text-white/60 mb-8 leading-relaxed" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                      {scumlCategories[activeTab].desc}
                    </p>

                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-[#1a1a1a] dark:text-white mb-3">Target Sectors:</h4>
                      <ul className="flex flex-wrap gap-2">
                        {scumlCategories[activeTab].bestFor.map((item, idx) => (
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
                        Average timeframe: <strong className="text-zinc-900 dark:text-white">{scumlCategories[activeTab].timeline}</strong>
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>

        {/* ───── ON-PAGE FAQ SECTION FOR DISCOVERY SEARCH ───── */}
        <section className="py-16 px-4 sm:px-6 bg-zinc-50 dark:bg-[#0c1222] border-t border-black/5 dark:border-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c7365f] mb-2 block">
                Common Questions
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
                Frequently Asked Questions About SCUML Registration
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Key compliance details regarding the EFCC Special Control Unit Against Money Laundering.
              </p>
            </div>

            <div className="space-y-3">
              {scumlFaqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 dark:text-white hover:text-[#c7365f] transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <span className="text-sm font-mono text-zinc-400">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
