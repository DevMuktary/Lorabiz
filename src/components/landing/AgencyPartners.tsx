"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function AgencyPartners() {
  const logos = [
    { src: "/cac.png", alt: "Corporate Affairs Commission" },
    { src: "/nimc.png", alt: "National Identity Management Commission" },
    { src: "/scuml.png", alt: "SCUML — EFCC" },
    { src: "/smedan.png", alt: "SMEDAN" },
    { src: "/nrs.png", alt: "NRS" },
    { src: "/ipo.png", alt: "Intellectual Property Office" },
  ];

  // We duplicate the array multiple times so the infinite scroll loops seamlessly
  const duplicatedLogos = [...logos, ...logos, ...logos, ...logos];

  return (
    <section id="partners" className="py-12 bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-6 mb-10">
        <p className="text-center text-xs font-semibold text-[#767676] dark:text-white/50 uppercase tracking-[0.2em]">
          Facilitating compliance across regulatory bodies
        </p>
      </div>

      <div className="relative w-full flex overflow-hidden">
        
        {/* ───── TV EDGE FADES ───── */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-[#0a0f1e] z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-[#0a0f1e] z-10 pointer-events-none" />

        {/* ───── INFINITE SLIDER ───── */}
        <motion.div
          className="flex items-center gap-16 sm:gap-24 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            delay: 2.5, // Holds the logos completely still for 2.5 seconds on load!
            repeat: Infinity,
            ease: "linear",
            duration: 40,
          }}
        >
          {duplicatedLogos.map((logo, i) => (
            <div 
              key={i} 
              // Significantly increased dimensions (w-[140px] and h-[50px] on mobile, larger on desktop)
              // Increased baseline opacity so they don't vanish in Dark Mode
              className="relative w-[140px] h-[50px] sm:w-[180px] sm:h-[65px] shrink-0 opacity-60 dark:opacity-80 grayscale hover:grayscale-0 hover:opacity-100 dark:hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                // Inverts to pure white in dark mode, but the higher opacity wrapper keeps it visible
                className="object-contain dark:brightness-0 dark:invert dark:hover:brightness-100 dark:hover:invert-0 transition-all duration-300"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
