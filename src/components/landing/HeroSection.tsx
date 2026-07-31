"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  // These are the "pills" that will fall from the top of the screen
  const floatingTags = [
    { label: "CAC Registration", color: "bg-[#0a0f1e] text-white dark:bg-white dark:text-black", rotate: -6, x: -150, y: 40, delay: 0.1 },
    { label: "Tax ID (TIN)", color: "bg-amber-100 text-amber-800", rotate: 4, x: -250, y: 120, delay: 0.3 },
    { label: "SCUML", color: "bg-blue-100 text-blue-800", rotate: -3, x: 200, y: 60, delay: 0.2 },
    { label: "NIN Verification", color: "bg-[#c7365f] text-white", rotate: 8, x: 280, y: 140, delay: 0.4 },
    { label: "Utility Vending", color: "bg-emerald-100 text-emerald-800", rotate: -8, x: 50, y: 160, delay: 0.5 },
  ];

  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 min-h-screen">
      
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c7365f]/5 dark:bg-[#c7365f]/15 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center flex flex-col items-center z-10 mt-8 w-full">
        
        {/* Animated Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-normal tracking-tight bg-gradient-to-r from-[#c7365f] to-[#e8447a] bg-clip-text text-transparent dark:bg-none dark:text-white"
          style={{
            fontSize: 'clamp(40px, 6vw, 64px)', // Responsive scaling
            lineHeight: '1.05',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          The easiest way to register
          <br className="hidden sm:block" /> and manage your business.
        </motion.h1>

        {/* Animated Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 font-normal text-[#767676] dark:text-white/60 max-w-2xl mx-auto"
          style={{
            fontSize: '16px',
            lineHeight: '22px', // Matched to your specs
            fontFamily: '"DM Sans", system-ui, -apple-system, sans-serif'
          }}
        >
          LoraBiz provides the complete infrastructure needed for businesses to register, comply, launch, and manage essential utilities all in one place.
        </motion.p>

        {/* Animated Button */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 mb-20 relative z-20"
        >
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center font-medium text-white bg-[#111827] dark:bg-gradient-to-r dark:from-[#c7365f] dark:to-[#e8447a] rounded-full hover:scale-105 shadow-xl dark:shadow-[0_0_30px_rgba(199,54,95,0.4)] transition-all duration-300"
            style={{
              fontSize: '18px',
              lineHeight: '22px',
              padding: '16px 36px',
              fontFamily: '"DM Sans", system-ui, sans-serif'
            }}
          >
            Get started
          </Link>
        </motion.div>

        {/* The Falling "Anchor-Style" Pills */}
        <div className="absolute top-1/2 left-1/2 w-full h-full pointer-events-none -translate-x-1/2 -translate-y-1/2 hidden md:block">
          {floatingTags.map((tag, i) => (
            <motion.div
              key={i}
              initial={{ y: -500, opacity: 0, rotate: 0, x: tag.x }}
              animate={{ y: tag.y, opacity: 1, rotate: tag.rotate }}
              transition={{ 
                type: "spring", 
                damping: 12, 
                stiffness: 60, 
                delay: tag.delay,
                duration: 1.5
              }}
              className={`absolute left-1/2 px-6 py-3 rounded-full text-sm font-bold shadow-xl backdrop-blur-md ${tag.color}`}
            >
              {tag.label}
            </motion.div>
          ))}
        </div>

        {/* Dashboard Image Preview with Scroll Fade */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-5xl mx-auto mt-10 group perspective-1000 z-10"
        >
          <div className="absolute -inset-4 bg-gradient-to-b from-[#c7365f]/5 to-transparent dark:from-[#c7365f]/20 rounded-3xl blur-2xl transition-all duration-500" />
          
          <div className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl bg-white/50 dark:bg-[#0a0f1e]/50 backdrop-blur-sm transform transition-transform duration-700 ease-out group-hover:-translate-y-2">
            <Image
              src="/dashboard-preview.jpg"
              alt="LoraBiz Platform"
              width={1000}
              height={562}
              className="w-full h-auto opacity-95 group-hover:opacity-100 transition-opacity duration-500"
              priority
            />
          </div>
        </motion.div>
        
      </div>
    </section>
  );
}