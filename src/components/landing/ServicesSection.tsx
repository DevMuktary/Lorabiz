"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesSection() {
  // Punchy, Anchor-style naming and pure SVG icons
  const services = [
    {
      title: "Incorporation",
      desc: "Register your Business Name, Limited Company, LLP, or NGO seamlessly with the CAC.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4M9 11h.01M15 11h.01M9 15h.01M15 15h.01" />
        </svg>
      ),
      color: "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white",
      href: "/auth/register"
    },
    {
      title: "Compliance",
      desc: "Get your Special Control Unit against Money Laundering (SCUML) certificate quickly and efficiently.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      ),
      color: "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white",
      href: "/auth/register"
    },
    {
      title: "Taxation",
      desc: "Generate your Tax Identification Number (TIN) swiftly. Essential for every registered business.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      color: "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white",
      href: "/auth/register"
    },
    {
      title: "Identity",
      desc: "Generate NIN slips and verify identities with ease. Instant, secure, and government-compliant.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
        </svg>
      ),
      color: "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white",
      href: "/auth/register"
    },
    {
      title: "Utilities",
      desc: "Buy airtime and data bundles for MTN, Airtel, Glo, and 9mobile directly from your dashboard.",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
      color: "bg-zinc-100 text-zinc-900 dark:bg-white/10 dark:text-white",
      href: "/auth/register"
    },
  ];

  return (
    <section id="services" className="py-24 md:py-32 overflow-hidden bg-[#fafafa] dark:bg-[#0a0f1e] transition-colors duration-300">
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
            className="font-normal tracking-tight text-zinc-900 dark:text-white"
            style={{ 
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: '1.1', 
              fontFamily: 'system-ui, -apple-system, sans-serif' 
            }}
          >
            Everything you need to <br className="hidden md:block"/>
            operate smoothly.
          </h2>
          <p className="mt-6 text-lg text-zinc-500 dark:text-white/50 leading-relaxed" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
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
              // Massive cards matching the Anchor scale. w-[85vw] on mobile ensures 1.5 cards are visible.
              className="shrink-0 w-[85vw] sm:w-[380px] lg:w-[420px] min-h-[440px] snap-start flex flex-col group cursor-pointer"
            >
              <Link href={service.href} className="flex flex-col h-full bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 sm:p-10 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:hover:shadow-none dark:hover:bg-white/[0.04] transition-all duration-500">
                
                {/* Clean, Vector Icon Wrapper */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-10 transition-transform duration-500 group-hover:scale-110 ${service.color}`}>
                  {service.icon}
                </div>

                <h3 className="text-3xl font-semibold mb-4 text-zinc-900 dark:text-white tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                  {service.title}
                </h3>
                
                <p className="text-[17px] text-[#767676] dark:text-white/50 leading-relaxed mb-10 flex-grow" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
                  {service.desc}
                </p>

                {/* Animated Bottom Link */}
                <div className="mt-auto flex items-center text-[17px] font-medium text-zinc-900 dark:text-white">
                  Explore {service.title}
                  <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
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
