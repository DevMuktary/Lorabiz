"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesSection() {
  const services = [
    {
      title: "Incorporation",
      desc: "Register your Business Name, Limited Company, LLP, or NGO seamlessly with the CAC.",
      // Soft Sage Green
      bgClass: "bg-[#F0F4EC] dark:bg-[#131F18]", 
      titleClass: "text-[#1D2B23] dark:text-[#E1ECE5]",
      descClass: "text-[#586C60] dark:text-[#8EAA9A]",
      // Massive Abstract Documents Graphic
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
      title: "Compliance",
      desc: "Get your Special Control Unit against Money Laundering (SCUML) certificate quickly and efficiently.",
      // Soft Peach/Orange (Matches your image closely)
      bgClass: "bg-[#F8F0E5] dark:bg-[#2A1E14]",
      titleClass: "text-[#3B2613] dark:text-[#F3E2D1]",
      descClass: "text-[#8A6A4E] dark:text-[#C5A58A]",
      // Massive Abstract Shield/Check Graphic
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
      title: "Taxation",
      desc: "Generate your Tax Identification Number (TIN) swiftly. Essential for every registered business.",
      // Soft Blue
      bgClass: "bg-[#EBF2F6] dark:bg-[#121A21]",
      titleClass: "text-[#182936] dark:text-[#DBEAF5]",
      descClass: "text-[#54738B] dark:text-[#8AA5BA]",
      // Massive Abstract Chart Graphic
      graphic: (
        <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M100 180C144.183 180 180 144.183 180 100H100V20C55.8172 20 20 55.8172 20 100C20 144.183 55.8172 180 100 180Z" fill="#1C5B8B" fillOpacity="0.1" />
          <path d="M190 80C185 45 155 15 120 10V80H190Z" fill="#1C5B8B" fillOpacity="0.2" />
        </svg>
      ),
      href: "/auth/register"
    },
    {
      title: "Identity",
      desc: "Generate NIN slips and verify identities with ease. Instant, secure, and government-compliant.",
      // Soft Pink/Rose
      bgClass: "bg-[#F6EBF0] dark:bg-[#29131C]",
      titleClass: "text-[#3B1524] dark:text-[#F3D1DF]",
      descClass: "text-[#934E6C] dark:text-[#CF89A7]",
      // Massive Abstract ID/Fingerprint Graphic
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
      title: "Utilities",
      desc: "Buy airtime and data bundles for MTN, Airtel, Glo, and 9mobile directly from your dashboard.",
      // Soft Violet
      bgClass: "bg-[#EFEBF6] dark:bg-[#161221]",
      titleClass: "text-[#231A36] dark:text-[#DFD1F3]",
      descClass: "text-[#625484] dark:text-[#A191C6]",
      // Massive Abstract Signal/Waves Graphic
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

        {/* The Anchor-Style Horizontal Scroll Container */}
        <div className="mt-16 flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 -mx-6 px-6 lg:-mx-12 lg:px-12 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              // Adjusted height and padding to fit the new top-heavy layout
              className="shrink-0 w-[85vw] sm:w-[380px] lg:w-[420px] h-[460px] lg:h-[500px] snap-start"
            >
              <Link href={service.href} className={`block relative w-full h-full rounded-[32px] p-8 lg:p-10 overflow-hidden group transition-transform duration-500 hover:-translate-y-2 ${service.bgClass}`}>
                
                {/* Text Content at the Top */}
                <div className="relative z-10 max-w-[85%]">
                  <h3 className={`text-3xl font-medium mb-4 tracking-tight ${service.titleClass}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                    {service.title}
                  </h3>
                  
                  <p className={`text-[17px] leading-relaxed ${service.descClass}`} style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                    {service.desc}
                  </p>
                </div>

                {/* Massive Graphic bleeding off the Bottom Right */}
                <div className="absolute -bottom-8 -right-8 w-[260px] h-[280px] lg:w-[320px] lg:h-[340px] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-3 pointer-events-none">
                  {service.graphic}
                </div>

              </Link>
            </motion.div>
          ))}
          
          {/* Spacer to allow full scroll on the right edge */}
          <div className="shrink-0 w-6 lg:w-12" />
        </div>

      </div>
    </section>
  );
}
