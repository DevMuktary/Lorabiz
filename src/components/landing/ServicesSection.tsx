"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function ServicesSection() {
  // We are using Emojis as our "3D assets". They render beautifully and require zero loading time.
  const services = [
    {
      icon: "🏢",
      title: "CAC Registration",
      desc: "Business Name, Limited Company, LLP, NGO & more — registered seamlessly with the Corporate Affairs Commission.",
      color: "from-emerald-400/20 to-teal-500/20",
      href: "/auth/register"
    },
    {
      icon: "📜",
      title: "SCUML Certificate",
      desc: "Get your Special Control Unit against Money Laundering certificate quickly and efficiently.",
      color: "from-blue-400/20 to-indigo-500/20",
      href: "/auth/register"
    },
    {
      icon: "💳",
      title: "Tax ID (TIN)",
      desc: "Generate your Tax Identification Number swiftly. Essential for every registered business.",
      color: "from-amber-400/20 to-orange-500/20",
      href: "/auth/register"
    },
    {
      icon: "🛡️",
      title: "NIN Verification",
      desc: "Generate NIN slips and verify identities with ease. Instant, secure, and government-compliant.",
      color: "from-rose-400/20 to-pink-500/20",
      href: "/auth/register"
    },
    {
      icon: "📲",
      title: "Airtime & Data",
      desc: "Buy airtime and data bundles for MTN, Airtel, Glo, and 9mobile directly from your wallet.",
      color: "from-cyan-400/20 to-blue-500/20",
      href: "/auth/register"
    },
    {
      icon: "💼",
      title: "Integrated Wallet",
      desc: "Fund your account, pay for services, and track all transactions through our secure built-in system.",
      color: "from-violet-400/20 to-purple-500/20",
      href: "/auth/register"
    },
  ];

  return (
    <section id="services" className="py-24 md:py-32 overflow-hidden bg-zinc-50 dark:bg-[#0a0f1e] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Section (Fades in as you scroll) */}
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
            <span className="text-[#c7365f] dark:text-[#e8447a]">operate smoothly.</span>
          </h2>
          <p className="mt-6 text-base text-zinc-500 dark:text-white/50 leading-relaxed" style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}>
            From incorporation to financial compliance and everyday utility management, we handle the heavy lifting so you can focus entirely on growing your business.
          </p>
        </motion.div>

        {/* The Horizontal Scroll Container 
          - flex & overflow-x-auto creates the horizontal row.
          - snap-x snap-mandatory forces cards to snap into place.
          - scrollbar-width:none hides the ugly scrollbar.
          - -mx-6 px-6 allows the cards to scroll edge-to-edge on mobile while keeping alignment.
        */}
        <div className="mt-16 flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 -mx-6 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {services.map((service, i) => (
            <motion.div
              key={i}
              // Each card swipes in from the right when it enters the viewport
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              // Stagger the animation so they pop in one after another
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              // w-[85vw] ensures that 1.5 cards show on mobile screens
              className="shrink-0 w-[85vw] sm:w-[380px] snap-start flex flex-col group"
            >
              <Link href={service.href} className="flex flex-col h-full bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                
                {/* Subtle gradient glow inside the card on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/[0.02] to-transparent dark:from-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* 3D-Style Icon Container */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-8 shadow-inner border border-white/20 dark:border-white/10`}>
                  <span className="text-3xl drop-shadow-md">{service.icon}</span>
                </div>

                <h3 className="text-2xl font-semibold mb-3 text-zinc-900 dark:text-white tracking-tight">
                  {service.title}
                </h3>
                
                <p className="text-sm text-zinc-500 dark:text-white/50 leading-relaxed mb-8 flex-grow">
                  {service.desc}
                </p>

                {/* Animated "Arrow" at the bottom */}
                <div className="mt-auto flex items-center text-sm font-semibold text-[#c7365f] dark:text-[#e8447a]">
                  Explore service
                  <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
          
          {/* Spacer to allow the last card to scroll fully into view and leave padding on the right */}
          <div className="shrink-0 w-6 sm:w-12" />
        </div>

      </div>
    </section>
  );
}
