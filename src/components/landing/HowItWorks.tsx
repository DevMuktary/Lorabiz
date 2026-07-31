"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

export default function HowItWorks() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -window.innerWidth * 0.75, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: window.innerWidth * 0.75, behavior: 'smooth' });
    }
  };

  const steps = [
    {
      tag: "Step 1 • Onboarding",
      title: "Sign up & verify identity.",
      list: ["Create secure profile", "BVN / NIN Verification", "Instant dashboard access"],
      // Deep Space Blue
      bgClass: "bg-[#0A1128]",
      textClass: "text-white",
      tagClass: "bg-white/10 text-white",
      listIconClass: "text-[#0BE49B]",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <circle cx="200" cy="200" r="120" stroke="#0BE49B" strokeWidth="2" strokeDasharray="8 8" />
          <rect x="150" y="140" width="100" height="120" rx="20" fill="#ffffff" fillOpacity="0.05" />
          <path d="M200 170C211.046 170 220 178.954 220 190C220 201.046 211.046 210 200 210C188.954 210 180 201.046 180 190C180 178.954 188.954 170 200 170Z" fill="#0BE49B" fillOpacity="0.2" />
          <path d="M165 240C165 220.67 180.67 205 200 205C219.33 205 235 220.67 235 240" stroke="#0BE49B" strokeWidth="8" strokeLinecap="round" />
        </svg>
      )
    },
    {
      tag: "Step 2 • Selection",
      title: "Choose your exact service.",
      list: ["CAC Registration", "SCUML & Tax ID (TIN)", "Utility Vending"],
      // Mint/Ocean Green
      bgClass: "bg-[#E6F3EE]",
      textClass: "text-[#12221C]",
      tagClass: "bg-[#12221C]/10 text-[#12221C]",
      listIconClass: "text-[#045137]",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <rect x="100" y="100" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.1" />
          <rect x="210" y="100" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.2" />
          <rect x="100" y="210" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.15" />
          <rect x="210" y="210" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.05" />
          <circle cx="255" cy="145" r="15" fill="#045137" />
        </svg>
      )
    },
    {
      tag: "Step 3 • Processing",
      title: "Track status in real-time.",
      list: ["Live progress updates", "Secure wallet payments", "Document uploads"],
      // Soft Peach/Orange
      bgClass: "bg-[#FDF3E7]",
      textClass: "text-[#3B2613]",
      tagClass: "bg-[#3B2613]/10 text-[#3B2613]",
      listIconClass: "text-[#D05F0D]",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <rect x="80" y="180" width="240" height="40" rx="20" fill="#D05F0D" fillOpacity="0.1" />
          <rect x="80" y="180" width="160" height="40" rx="20" fill="#D05F0D" fillOpacity="0.3" />
          <circle cx="240" cy="200" r="12" fill="#D05F0D" />
          <path d="M120 150L150 120L180 150" stroke="#D05F0D" strokeOpacity="0.5" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      tag: "Step 4 • Completion",
      title: "Download & start running.",
      list: ["Official Certificates", "Active Digital Wallet", "Continuous Support"],
      // Brand Pink/Red Gradient
      bgClass: "bg-gradient-to-br from-[#c7365f] to-[#e8447a]",
      textClass: "text-white",
      tagClass: "bg-white/20 text-white",
      listIconClass: "text-white",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <path d="M200 100L225 160L290 165L240 210L255 275L200 240L145 275L160 210L110 165L175 160L200 100Z" fill="#ffffff" fillOpacity="0.2" />
          <path d="M200 120L215 165L265 170L225 200L235 250L200 225L165 250L175 200L135 170L185 165L200 120Z" fill="#ffffff" fillOpacity="0.4" />
        </svg>
      )
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 relative">
      
      {/* ───── TOP HEADER & NAVIGATION ───── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        
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

        {/* Custom Arrow Controls (Hides on mobile, where users naturally swipe) */}
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

      {/* ───── HORIZONTAL SLIDING CARDS ───── */}
      <div 
        ref={scrollContainerRef}
        className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-pl-6 lg:scroll-pl-12 gap-6 lg:gap-10 px-6 lg:px-12 pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            // Full width on mobile, massive 85% width on desktop
            className={`relative flex-shrink-0 w-[90vw] lg:w-[85vw] max-w-[1200px] h-[500px] lg:h-[560px] rounded-[32px] lg:rounded-[48px] overflow-hidden snap-start ${step.bgClass}`}
          >
            <div className="absolute inset-0 flex flex-col-reverse lg:flex-row w-full h-full">
              
              {/* Left Side: Content */}
              <div className="w-full lg:w-[55%] h-full flex flex-col justify-center p-8 sm:p-12 lg:p-20 z-10">
                
                {/* Step Tag */}
                <div className="mb-6 lg:mb-10">
                  <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase ${step.tagClass}`}>
                    {step.tag}
                  </span>
                </div>

                {/* Massive Step Title */}
                <h3 
                  className={`font-medium tracking-tight mb-8 lg:mb-12 ${step.textClass}`}
                  style={{ fontSize: 'clamp(36px, 5vw, 64px)', lineHeight: '1.05', fontFamily: 'system-ui, sans-serif' }}
                >
                  {step.title.split('<br/>').map((line, idx) => (
                    <span key={idx}>
                      {line}
                      {idx === 0 && <br className="hidden sm:block" />}
                    </span>
                  ))}
                </h3>

                {/* Checklist Features */}
                <ul className="space-y-4 lg:space-y-5">
                  {step.list.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      <svg className={`w-6 h-6 flex-shrink-0 ${step.listIconClass}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-[16px] lg:text-[20px] font-medium opacity-90 ${step.textClass}`} style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

              </div>

              {/* Right Side: Graphic Illustration */}
              <div className="w-full lg:w-[45%] h-[40%] lg:h-full relative flex items-center justify-center p-8 lg:p-0">
                {/* Subtle gradient overlay to blend the graphic */}
                <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/20 lg:from-black/10 to-transparent z-0 pointer-events-none" />
                
                <div className="relative z-10 w-[200px] lg:w-[400px] h-[200px] lg:h-[400px] transform transition-transform duration-700 hover:scale-105 hover:rotate-3">
                  {step.graphic}
                </div>
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
