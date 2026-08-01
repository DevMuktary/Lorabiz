"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesSection() {
  const services = [
    {
      title: "CAC Registration",
      desc: "Register your Business Name, Limited Company, LLP, or NGO effortlessly using our platform.",
      detailsBg: "bg-[#CEE9DF]", 
      detailsText: "text-[#1E1E1E]",
      innerBg: "bg-[#23322D]",
      innerText: "text-[#CEE9DF]",
      icon: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
          <rect x="40" y="20" width="120" height="110" rx="16" fill="#1E1E1E" fillOpacity="0.1" />
          <path d="M70 60H130M70 90H110" stroke="#1E1E1E" strokeOpacity="0.3" strokeWidth="12" strokeLinecap="round" />
        </svg>
      ),
      href: "/services/cac"
    },
    {
      title: "SCUML Certificate",
      desc: "Get your Special Control Unit against Money Laundering certificate quickly and efficiently.",
      detailsBg: "bg-[#433968]",
      detailsText: "text-[#CEE9DF]",
      innerBg: "bg-[#CEE9DF]",
      innerText: "text-[#433968]",
      icon: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
          <circle cx="100" cy="75" r="50" fill="#CEE9DF" fillOpacity="0.1" />
          <path d="M100 40V110M65 75H135" stroke="#CEE9DF" strokeOpacity="0.3" strokeWidth="16" strokeLinecap="round" />
        </svg>
      ),
      href: "services/scuml"
    },
    {
      title: "Tax ID (TIN)",
      desc: "Generate your Tax Identification Number swiftly. Essential for every registered business.",
      detailsBg: "bg-[#23322D]",
      detailsText: "text-[#CEE9DF]",
      innerBg: "bg-[#EEDABE]",
      innerText: "text-[#D05F0D]",
      icon: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
          <rect x="30" y="30" width="140" height="90" rx="16" fill="#CEE9DF" fillOpacity="0.1" />
          <rect x="30" y="55" width="140" height="25" fill="#CEE9DF" fillOpacity="0.2" />
        </svg>
      ),
      href: "services/tax-id"
    },
    {
      title: "NIN Verification",
      desc: "Generate NIN slips and verify identities with ease. Instant and government-compliant.",
      detailsBg: "bg-[#EEDABE]",
      detailsText: "text-[#272727]",
      innerBg: "bg-[#D05F0D]",
      innerText: "text-[#FFFFFF]",
      icon: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
          <circle cx="100" cy="65" r="30" fill="#D05F0D" fillOpacity="0.1" />
          <path d="M40 140C40 110 70 100 100 100C130 100 160 110 160 140" stroke="#D05F0D" strokeOpacity="0.2" strokeWidth="16" strokeLinecap="round" />
        </svg>
      ),
      href: "services/nin"
    },
    {
      title: "Utility Vending",
      desc: "Buy airtime, data bundles, electricity directly from your secure dashboard.",
      detailsBg: "bg-[#E0F4FE]",
      detailsText: "text-[#23322D]",
      innerBg: "bg-[#23322D]",
      innerText: "text-[#FFFFFF]",
      icon: (
        <svg viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-80">
          <path d="M50 110L80 50L120 90L160 30" stroke="#23322D" strokeOpacity="0.2" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      href: "services/utilities"
    },
  ];

  return (
    <section id="services" className="py-24 md:py-32 bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300">
      
      {/* ───── HEADER ───── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[100px] mb-12">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-[#1a1a1a] dark:text-white font-normal"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: '1.1875', fontFamily: 'system-ui, sans-serif' }}
        >
          Everything you need to <br className="hidden md:block"/>
          operate smoothly.
        </motion.h2>
      </div>

      {/* ───── HORIZONTAL SCROLL CONTAINER ───── */}
      {/* Added snap-x, snap-mandatory, and scroll padding to ensure perfect magnetic swiping */}
      <div className="w-full flex overflow-x-auto snap-x snap-mandatory scroll-pl-6 lg:scroll-pl-[100px] gap-[15px] px-6 lg:px-[100px] pb-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {services.map((service, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            // Changed mobile width to 75vw so the next card ALWAYS peeks out. Added snap-start.
            className="relative flex flex-col justify-end items-center shrink-0 w-[75vw] sm:w-[280px] lg:w-[308px] h-[360px] lg:h-[400px] group snap-start"
          >
            <Link href={service.href} className="absolute inset-0 w-full h-full flex flex-col justify-end items-center transition-transform duration-300 group-hover:-translate-y-2">
              
              {/* ───── THE DETAILS CARD (BACKGROUND) ───── */}
              <div className={`flex flex-col justify-between w-[90%] h-full rounded-[15px] overflow-hidden ${service.detailsBg}`}>
                
                <div 
                  className={`pt-[32px] lg:pt-[44px] px-[24px] lg:px-[34px] pb-[10px] text-[15px] sm:text-[17px] lg:text-[20px] font-normal leading-[1.5] ${service.detailsText}`}
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {service.desc}
                </div>

                <div className="relative w-full h-[180px] lg:h-[220px] flex items-end justify-center pb-4">
                  {service.icon}
                </div>
              </div>

              {/* ───── THE INNER FLOATING TITLE BAR ───── */}
              <div 
                className={`absolute bottom-[16px] lg:bottom-[22px] w-full flex items-center justify-between min-h-[64px] lg:min-h-[82px] rounded-[12px] px-[20px] sm:px-[24px] lg:px-[36px] py-[16px] lg:py-[21px] shadow-xl ${service.innerBg}`}
              >
                <span 
                  className={`text-[16px] sm:text-[18px] lg:text-[22px] tracking-[-0.96px] font-medium whitespace-nowrap ${service.innerText}`}
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {service.title}
                </span>

                {/* Arrow Icon */}
                <svg 
                  className={`w-[18px] lg:w-[22px] h-[18px] lg:h-[22px] transition-transform duration-300 group-hover:translate-x-1 ${service.innerText}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              
            </Link>
          </motion.div>
        ))}

        {/* Padding spacer to allow the very last card to snap fully into view */}
        <div className="shrink-0 w-6 lg:w-[50px]" />
      </div>
    </section>
  );
}
