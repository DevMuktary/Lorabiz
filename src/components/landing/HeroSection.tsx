"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position for the parting & fade animation
  const { scrollY } = useScroll();

  // Mapping scroll position (0 to 300px down) to horizontal movement
  const moveLeftFast = useTransform(scrollY, [0, 300], [0, -350]);
  const moveLeftMedium = useTransform(scrollY, [0, 300], [0, -200]);
  const moveLeftSlow = useTransform(scrollY, [0, 300], [0, -100]);
  const moveRightSlow = useTransform(scrollY, [0, 300], [0, 150]);
  const moveRightFast = useTransform(scrollY, [0, 300], [0, 300]);
  
  // Fade out the tags as they part ways
  const fadeOut = useTransform(scrollY, [0, 250], [1, 0]);

  // Adjusted the initialX and y values to spread them out beautifully and prevent ugly overlapping
  const floatingTags = [
    { label: "CAC Registration", color: "bg-[#111827] text-white dark:bg-white dark:text-[#111827]", xOffset: moveLeftFast, initialX: -150, y: 10, rotate: -6, delay: 0.1, z: 20 },
    { label: "Tax ID (TIN)", color: "bg-amber-100 text-amber-800", xOffset: moveLeftMedium, initialX: -60, y: 60, rotate: 4, delay: 0.3, z: 30 },
    { label: "SCUML", color: "bg-blue-100 text-blue-800", xOffset: moveLeftSlow, initialX: 0, y: -5, rotate: -3, delay: 0.2, z: 10 },
    { label: "NIN Verification", color: "bg-[#c7365f] text-white", xOffset: moveRightSlow, initialX: 80, y: 50, rotate: 6, delay: 0.4, z: 40 },
    { label: "Utility Vending", color: "bg-emerald-100 text-emerald-800", xOffset: moveRightFast, initialX: 160, y: 15, rotate: -6, delay: 0.5, z: 20 },
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
                // Added fadeOut to opacity, combined with the parting xOffset
                style={{ x: tag.xOffset, opacity: fadeOut, zIndex: tag.z }}
                className={`absolute px-5 py-2.5 rounded-full text-sm font-bold shadow-lg backdrop-blur-md whitespace-nowrap border border-black/5 dark:border-white/10 ${tag.color}`}
              >
                {tag.label}
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ───── SCROLL REVEAL TEXT SECTION ───── */}
      {/* Drastically reduced padding to eliminate whitespace */}
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