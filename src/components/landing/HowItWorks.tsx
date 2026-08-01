"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

export default function HowItWorks() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -360, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 360, behavior: 'smooth' });
    }
  };

  const steps = [
    {
      tag: "Step 1 • Onboarding",
      title: "Create your account.",
      list: ["Sign up with basic details", "Verify your email address", "Log into your dashboard"],
      bgClass: "bg-[#0A1128]",
      textClass: "text-white",
      tagClass: "bg-white/10 text-white",
      listIconClass: "text-[#0BE49B]",
      graphic: (
        <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <circle cx="200" cy="100" r="80" stroke="#0BE49B" strokeWidth="2" strokeDasharray="6 6" />
          <rect x="160" y="60" width="80" height="80" rx="16" fill="#ffffff" fillOpacity="0.05" />
          <path d="M200 80C208.284 80 215 86.7157 215 95C215 103.284 208.284 110 200 110C191.716 110 185 103.284 185 95C185 86.7157 191.716 80 200 80Z" fill="#0BE49B" fillOpacity="0.2" />
        </svg>
      )
    },
    {
      tag: "Step 2 • Wallet",
      title: "Fund your balance.",
      list: ["Fund via payment gateway", "Top up your wallet", "Ready for transactions"],
      bgClass: "bg-[#E6F3EE] dark:bg-[#132A22]",
      textClass: "text-[#12221C] dark:text-[#E6F3EE]",
      tagClass: "bg-[#12221C]/10 dark:bg-[#E6F3EE]/10 text-[#12221C] dark:text-[#E6F3EE]",
      listIconClass: "text-[#045137] dark:text-[#0BE49B]",
      graphic: (
        <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <rect x="130" y="50" width="140" height="100" rx="20" fill="#045137" fillOpacity="0.1" />
          <rect x="150" y="80" width="100" height="20" rx="10" fill="#045137" fillOpacity="0.2" />
          <circle cx="170" cy="120" r="10" fill="#045137" fillOpacity="0.3" />
        </svg>
      )
    },
    {
      tag: "Step 3 • Selection",
      title: "Choose your service.",
      list: ["CAC Registration", "SCUML & Tax ID (TIN)", "NIN & Utilities"],
      bgClass: "bg-[#FDF3E7] dark:bg-[#2B1B10]",
      textClass: "text-[#3B2613] dark:text-[#FDF3E7]",
      tagClass: "bg-[#3B2613]/10 dark:bg-[#FDF3E7]/10 text-[#3B2613] dark:text-[#FDF3E7]",
      listIconClass: "text-[#D05F0D]",
      graphic: (
        <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <rect x="100" y="80" width="60" height="60" rx="16" fill="#D05F0D" fillOpacity="0.1" />
          <rect x="170" y="80" width="60" height="60" rx="16" fill="#D05F0D" fillOpacity="0.2" />
          <rect x="240" y="80" width="60" height="60" rx="16" fill="#D05F0D" fillOpacity="0.1" />
          <circle cx="200" cy="110" r="12" fill="#D05F0D" />
        </svg>
      )
    },
    {
      tag: "Step 4 • Delivery",
      title: "Get instant results.",
      list: ["Track application status", "Download official files", "Continuous management"],
      bgClass: "bg-gradient-to-br from-[#c7365f] to-[#e8447a]",
      textClass: "text-white",
      tagClass: "bg-white/20 text-white",
      listIconClass: "text-white",
      graphic: (
        <svg viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <path d="M200 40L230 100L290 110L245 150L255 210L200 180L145 210L155 150L110 110L170 100L200 40Z" fill="#ffffff" fillOpacity="0.15" />
          <path d="M200 70L220 110L260 115L230 145L240 185L200 165L160 185L170 145L140 115L180 110L200 70Z" fill="#ffffff" fillOpacity="0.3" />
        </svg>
      )
    },
  ];

  return (
    // REDUCED TOP PADDING: Changed py-24 to pt-8 pb-24 md:pt-12 md:pb-32
    <section className="pt-8 pb-24 md:pt-12 md:pb-32 bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 relative border-t border-black/5 dark:border-white/5">
      
      {/* ───── TOP HEADER & NAVIGATION ───── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-8">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl"
        >
          <h2 
            className="font-normal text-[#1a1a1a] dark:text-white tracking-tight"
            style={{ fontSize: 'clamp(40px, 5vw, 56px)', lineHeight: '1.1', fontFamily: 'system-ui, sans-serif' }}
          >
            From idea to registered <br className="hidden lg:block"/>
            business in four steps.
          </h2>
        </motion.div>

        {/* Custom Arrow Controls for Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={scrollLeft}
            className="w-14 h-14 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center text-zinc-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all duration-300"
            aria-label="Previous step"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={scrollRight}
            className="w-14 h-14 rounded-full border border-black/10 dark:border-white/20 flex items-center justify-center text-zinc-600 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-all duration-300"
            aria-label="Next step"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>

      {/* ───── HORIZONTAL SLIDING CARDS (EXACT PIXEL WIDTHS) ───── */}
      <div 
        ref={scrollContainerRef}
        className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-pl-6 lg:scroll-pl-12 gap-6 px-6 lg:px-12 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            // STRICT WIDTH: 280px on mobile guarantees the next card is visible.
            className={`relative flex-shrink-0 w-[280px] md:w-[320px] lg:w-[340px] h-[460px] rounded-[32px] overflow-hidden snap-start flex flex-col ${step.bgClass}`}
          >
            {/* Top Text Content */}
            <div className="w-full p-6 sm:p-8 flex-grow z-10">
              <div className="mb-6">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[12px] font-bold tracking-widest uppercase ${step.tagClass}`}>
                  {step.tag}
                </span>
              </div>

              <h3 
                className={`font-medium tracking-tight mb-8 ${step.textClass}`}
                style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: '1.1', fontFamily: 'system-ui, sans-serif' }}
              >
                {step.title}
              </h3>

              <ul className="space-y-4">
                {step.list.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${step.listIconClass}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={`text-[15px] font-medium opacity-90 ${step.textClass}`} style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bottom Graphic */}
            <div className="relative w-full h-[160px] mt-auto pointer-events-none flex items-end justify-center">
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-0" />
              <div className="relative z-10 w-full h-full transform transition-transform duration-700 hover:scale-105">
                {step.graphic}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Spacer for final snap */}
        <div className="shrink-0 w-6 lg:w-12" />
      </div>

    </section>
  );
}
