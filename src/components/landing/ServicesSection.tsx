"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesSection() {
  const services = [
    {
      tag: "CAC Registration",
      title: "Incorporation",
      desc: "Register your Business Name, Limited Company, LLP, or NGO seamlessly with the CAC.",
      bgClass: "bg-[#F0F4EC] dark:bg-[#131F18]", 
      titleClass: "text-[#1D2B23] dark:text-[#E1ECE5]",
      descClass: "text-[#586C60] dark:text-[#8EAA9A]",
      graphic: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="60" y="40" width="120" height="140" rx="24" fill="#045137" fillOpacity="0.08" transform="rotate(15 120 110)" />
          <rect x="30" y="60" width="120" height="140" rx="24" fill="#045137" fillOpacity="0.15" />
          <circle cx="90" cy="130" r="30" fill="#045137" fillOpacity="0.2" />
        </svg>
      ),
      href: "/auth/register"
    },
    {
      tag: "SCUML",
      title: "Compliance",
      desc: "Get your Special Control Unit against Money Laundering certificate quickly and efficiently.",
      bgClass: "bg-[#F8F0E5] dark:bg-[#2A1E14]",
      titleClass: "text-[#3B2613] dark:text-[#F3E2D1]",
      descClass: "text-[#8A6A4E] dark:text-[#C5A58A]",
      graphic: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M100 20L170 50V100C170 145 140 185 100 200C60 185 30 145 30 100V50L100 20Z" fill="#B35B1E" fillOpacity="0.1" />
          <circle cx="100" cy="110" r="40" fill="#B35B1E" fillOpacity="0.15" />
          <path d="M80 110L95 125L130 90" stroke="#B35B1E" strokeOpacity="0.3" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
      href: "/auth/register"
    },
    {
      tag: "Tax ID (TIN)",
      title: "Taxation",
      desc: "Generate your Tax Identification Number (TIN) swiftly. Essential for every registered business.",
      bgClass: "bg-[#EBF2F6] dark:bg-[#121A21]",
      titleClass: "text-[#182936] dark:text-[#DBEAF5]",
      descClass: "text-[#54738B] dark:text-[#8AA5BA]",
      graphic: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M100 180C144.183 180 180 144.183 180 100H100V20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180Z" fill="#1C5B8B" fillOpacity="0.1" />
          <path d="M190 80C185 45 155 15 120 10V80H190Z" fill="#1C5B8B" fillOpacity="0.2" />
        </svg>
      ),
      href: "/auth/register"
    },
    {
      tag: "NIN Verification",
      title: "Identity",
      desc: "Generate NIN slips and verify identities with ease. Instant, secure, and government-compliant.",
      bgClass: "bg-[#F6EBF0] dark:bg-[#29131C]",
      titleClass: "text-[#3B1524] dark:text-[#F3D1DF]",
      descClass: "text-[#934E6C] dark:text-[#CF89A7]",
      graphic: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect x="40" y="30" width="120" height="150" rx="30" fill="#A8285B" fillOpacity="0.08" />
          <circle cx="100" cy="80" r="25" fill="#A8285B" fillOpacity="0.15" />
          <rect x="70" y="130" width="60" height="12" rx="6" fill="#A8285B" fillOpacity="0.2" />
          <rect x="80" y="150" width="40" height="12" rx="6" fill="#A8285B" fillOpacity="0.15" />
        </svg>
      ),
      href: "/auth/register"
    },
    {
      tag: "Utility Vending",
      title: "Utilities",
      desc: "Buy airtime and data bundles for MTN, Airtel, Glo, and 9mobile directly from your dashboard.",
      bgClass: "bg-[#EFEBF6] dark:bg-[#161221]",
      titleClass: "text-[#231A36] dark:text-[#DFD1F3]",
      descClass: "text-[#625484] dark:text-[#A191C6]",
      graphic: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="100" cy="180" r="140" stroke="#4C2E9A" strokeOpacity="0.05" strokeWidth="24" />
          <circle cx="100" cy="180" r="100" stroke="#4C2E9A" strokeOpacity="0.1" strokeWidth="24" />
          <circle cx="100" cy="180" r="60" stroke="#4C2E9A" strokeOpacity="0.15" strokeWidth="24" />
          <circle cx="100" cy="180" r="20" fill="#4C2E9A" fillOpacity="0.2" />
        </svg>
      ),
      href: "/auth/register"
    },
  ];

  return (
    <section id="services" className="py-24 md:py-32 overflow-hidden bg-white dark:bg-[#0a0f1e] transition-colors duration-300">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl"
        >
          <h2 
            className="font-normal tracking-tight text-[#23322D] dark:text-white"
            style={{ 
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: '1.18', 
              fontFamily: 'system-ui, -apple-system, sans-serif' 
            }}
          >
            Everything you need to <br className="hidden md:block"/>
            operate smoothly.
          </h2>
          <p className="mt-6 text-lg text-[#767676] dark:text-white/60 leading-relaxed" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            From incorporation to financial compliance and everyday utility management, we handle the heavy lifting so you can focus entirely on growing your business.
          </p>
        </motion.div>

        {/* Horizontal Scroll Container */}
        <div className="mt-12 flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 -mx-6 px-6 lg:-mx-12 lg:px-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              // Reduced size: w-[340px] lg:w-[380px] h-[400px] lg:h-[440px]
              className="shrink-0 w-[85vw] sm:w-[340px] lg:w-[380px] h-[400px] lg:h-[440px] snap-start"
            >
              <Link href={service.href} className={`block relative w-full h-full rounded-[32px] p-8 overflow-hidden group transition-transform duration-500 hover:-translate-y-2 ${service.bgClass}`}>
                
                {/* Text Content at the Top */}
                <div className="relative z-10 max-w-[90%] flex flex-col h-full">
                  
                  {/* The Anchor-style Pill Tag */}
                  <div className="mb-5">
                    <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-wide bg-black/5 dark:bg-white/10 ${service.titleClass}`}>
                      {service.tag}
                    </span>
                  </div>

                  <h3 className={`text-3xl font-medium mb-3 tracking-tight ${service.titleClass}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {service.title}
                  </h3>
                  
                  <p className={`text-[16px] leading-relaxed ${service.descClass}`} style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                    {service.desc}
                  </p>

                  {/* Arrow Link pushed to the bottom of the text container */}
                  <div className={`mt-auto pt-8 flex items-center text-[15px] font-semibold ${service.titleClass}`}>
                    Explore {service.title}
                    <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>

                {/* Massive Graphic bleeding off the Bottom Right (Adjusted for smaller card) */}
                <div className="absolute -bottom-6 -right-6 w-[240px] h-[260px] lg:w-[260px] lg:h-[280px] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3 pointer-events-none">
                  {service.graphic}
                </div>

              </Link>
            </motion.div>
          ))}
          
          <div className="shrink-0 w-6 lg:w-12" />
        </div>

      </div>
    </section>
  );
}
