"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position for the horizontal compression effect
  const { scrollY } = useScroll();

  // Instead of flying away, they "compress" inwards horizontally as you scroll.
  // The outer ones move in by 70px, the inner ones move in by 35px.
  const compressLeftFast = useTransform(scrollY, [0, 300], [0, 70]);
  const compressLeftSlow = useTransform(scrollY, [0, 300], [0, 35]);
  const centerStays = useTransform(scrollY, [0, 300], [0, 0]);
  const compressRightSlow = useTransform(scrollY, [0, 300], [0, -35]);
  const compressRightFast = useTransform(scrollY, [0, 300], [0, -70]);

  // Initial X positions are spread out, Z-index is layered so they overlap beautifully
  const floatingTags = [
    { label: "CAC Registration", color: "bg-[#111827] text-white dark:bg-white dark:text-[#111827]", xOffset: compressLeftFast, initialX: -180, y: 10, rotate: -6, delay: 0.1, z: 10 },
    { label: "Tax ID (TIN)", color: "bg-amber-100 text-amber-800", xOffset: compressLeftSlow, initialX: -90, y: 45, rotate: 4, delay: 0.3, z: 20 },
    { label: "SCUML", color: "bg-blue-100 text-blue-800", xOffset: centerStays, initialX: 0, y: -5, rotate: -2, delay: 0.2, z: 30 },
    { label: "NIN Verification", color: "bg-[#c7365f] text-white", xOffset: compressRightSlow, initialX: 90, y: 40, rotate: 5, delay: 0.4, z: 20 },
    { label: "Utility Vending", color: "bg-emerald-100 text-emerald-800", xOffset: compressRightFast, initialX: 180, y: 15, rotate: -5, delay: 0.5, z: 10 },
  ];

  return (
    <div ref={containerRef} className="relative w-full flex flex-col items-center bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300">
      
      {/* ───── HERO TOP SECTION ───── */}
      <section className="relative pt-40 pb-4 px-6 w-full flex flex-col items-center z-10">
        
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c7365f]/5 dark:bg-[#c7365f]/15 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.5) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-[0.03]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

        <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center z-10 w-full">
          
          {/* Animated Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-normal tracking-tight bg-gradient-to-r from-[#c7365f] to-[#e8447a] bg-clip-text text-transparent dark:bg-none dark:text-white"
            style={{ fontSize: 'clamp(40px, 6vw, 64px)', lineHeight: '1.05', fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            The easiest way to register
            <br className="hidden sm:block" /> and manage your business.
          </motion.h1>

          {/* Animated Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 font-normal text-[#767676] dark:text-white/60 max-w-2xl mx-auto"
            style={{ fontSize: '16px', lineHeight: '22px', fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            LoraBiz provides the complete infrastructure needed for businesses to register, comply, launch, and manage essential utilities all in one place.
          </motion.p>

          {/* Animated Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 mb-2 relative z-50"
          >
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center font-medium text-white bg-[#111827] dark:bg-gradient-to-r dark:from-[#c7365f] dark:to-[#e8447a] rounded-full hover:scale-105 shadow-xl dark:shadow-[0_0_30px_rgba(199,54,95,0.4)] transition-all duration-300"
              style={{ fontSize: '18px', lineHeight: '22px', padding: '16px 36px', fontFamily: '"DM Sans", system-ui, sans-serif' }}
            >
              Get started
            </Link>
          </motion.div>

          {/* ───── THE LANDING ZONE FOR PILLS ───── */}
          <div className="relative w-full h-[140px] flex justify-center mt-2">
            {floatingTags.map((tag, i) => (
              <motion.div
                key={i}
                initial={{ y: -600, opacity: 0, x: tag.initialX, rotate: 0 }}
                animate={{ y: tag.y, opacity: 1, rotate: tag.rotate }}
                transition={{ type: "spring", damping: 14, stiffness: 70, delay: tag.delay, duration: 1.5 }}
                // xOffset now compresses them inward. Removed the opacity fade-out.
                style={{ x: tag.xOffset, zIndex: tag.z }}
                className={`absolute px-5 py-2.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-md whitespace-nowrap border border-black/5 dark:border-white/10 ${tag.color}`}
              >
                {tag.label}
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ───── SCROLL REVEAL TEXT SECTION ───── */}
      <section className="relative w-full max-w-7xl mx-auto px-6 pt-8 pb-24 z-20 flex items-center">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          // ONCE: TRUE ensures the text locks into place permanently and won't bounce again
          viewport={{ once: true, margin: "-50px" }} 
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h2 
            className="font-normal tracking-tight text-[#23322D] dark:text-[#E5E7EB]"
            style={{ 
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: '1.18', 
              fontFamily: 'system-ui, -apple-system, sans-serif' 
            }}
          >
            A fully integrated suite of business services - all the tools you need to launch your product.
          </h2>
        </motion.div>
      </section>

    </div>
  );
}