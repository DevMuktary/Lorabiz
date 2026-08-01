"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function TelecomPartners() {
  const networks = [
    { src: "/mtn.png", alt: "MTN Nigeria" },
    { src: "/airtel.png", alt: "Airtel Nigeria" },
    { src: "/glo.png", alt: "Globacom (Glo)" },
    { src: "/9mobile.png", alt: "9mobile" },
  ];

  // We duplicate the array multiple times so the infinite scroll loops seamlessly without a gap
  const duplicatedNetworks = [...networks, ...networks, ...networks, ...networks, ...networks];

  return (
    // REDUCED PADDING: Changed from massive py-24 to a sleek py-8 to chunk the space between sections
    <section id="networks" className="py-8 bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 border-b border-black/5 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <p className="text-center text-xs font-semibold text-[#767676] dark:text-white/50 uppercase tracking-[0.2em]">
          Supported networks for instant airtime and data
        </p>
      </div>

      <div className="relative w-full flex overflow-hidden">
        
        {/* ───── TV EDGE FADES ───── */}
        {/* These gradients make the logos smoothly fade out before they hit the edge of the screen */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent dark:from-[#0a0f1e] z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent dark:from-[#0a0f1e] z-10 pointer-events-none" />

        {/* ───── FULL COLOR INFINITE SLIDER ───── */}
        <motion.div
          className="flex items-center gap-16 sm:gap-24 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 35, // Smooth scrolling speed
          }}
        >
          {duplicatedNetworks.map((logo, i) => (
            <div 
              key={i} 
              className="relative w-[90px] h-[45px] sm:w-[120px] sm:h-[60px] shrink-0 transition-transform duration-300 hover:scale-110 cursor-pointer"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className="object-contain" // Absolutely no grayscale or opacity filters! Pure true color.
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
