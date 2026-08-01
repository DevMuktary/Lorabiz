"use client";

import { motion } from "framer-motion";

export default function Testimonials() {
  const testimonials = [
    {
      quote: "LoraBiz turned a nightmare process into a breeze. We got our CAC registration and Tax ID sorted in days instead of weeks. Highly recommended!",
      name: "Oluwaseun Adebayo",
      role: "Founder, TechNova Solutions",
      avatarGradient: "from-blue-400 to-indigo-500",
      initials: "OA"
    },
    {
      quote: "The compliance dashboard is a lifesaver. Tracking our SCUML certificate status in real-time gave us so much peace of mind.",
      name: "Chioma Nwosu",
      role: "Director, Apex Logistics",
      avatarGradient: "from-emerald-400 to-teal-500",
      initials: "CN"
    },
    {
      quote: "I love the integrated wallet. I fund it once and use it to buy airtime, data, and pay for all my business verifications from one spot.",
      name: "Ibrahim Hassan",
      role: "CEO, Hassan Retail Group",
      avatarGradient: "from-amber-400 to-orange-500",
      initials: "IH"
    },
    {
      quote: "As a startup, we couldn't afford legal mistakes. LoraBiz guided us through the entire incorporation and TIN generation flawlessly.",
      name: "Grace Okafor",
      role: "Co-founder, Bloom Creative",
      avatarGradient: "from-[#c7365f] to-[#e8447a]",
      initials: "GO"
    },
    {
      quote: "Verifying NINs for our staff used to be tedious. Now, we run it instantly through LoraBiz. The automated workflow is just brilliant.",
      name: "Emmanuel Uche",
      role: "HR Manager, BuildCorp",
      avatarGradient: "from-violet-400 to-purple-500",
      initials: "EU"
    },
  ];

  // Duplicating the array twice to ensure a seamless infinite scroll loop
  const duplicatedTestimonials = [...testimonials, ...testimonials, ...testimonials];

  return (
    // REDUCED TOP PADDING: pt-12 to pull it up tightly to the Telecom partners section
    <section id="testimonials" className="pt-12 pb-24 md:pt-16 md:pb-32 bg-[#fafafa] dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 relative border-b border-black/5 dark:border-white/5">
      
      {/* ───── HEADER ───── */}
      <div className="max-w-7xl mx-auto px-6 mb-12 md:mb-16 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-black/5 dark:bg-white/10 text-zinc-900 dark:text-white mb-6"
        >
          Customer Stories
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-normal text-[#1a1a1a] dark:text-white tracking-tight max-w-2xl"
          style={{ fontSize: 'clamp(32px, 4vw, 48px)', lineHeight: '1.15', fontFamily: 'system-ui, sans-serif' }}
        >
          Trusted by thousands of <br className="hidden md:block"/>
          growing businesses.
        </motion.h2>
      </div>

      {/* ───── AUTO-SLIDING CAROUSEL ───── */}
      <div className="relative w-full flex overflow-hidden">
        
        {/* TV Edge Fades for smooth entry/exit */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-[#fafafa] to-transparent dark:from-[#0a0f1e] z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-[#fafafa] to-transparent dark:from-[#0a0f1e] z-10 pointer-events-none" />

        <motion.div
          className="flex items-stretch gap-6 sm:gap-8 w-max px-6"
          // Slides from 0 to -33.33% because we duplicated the array 3 times
          animate={{ x: ["0%", "-33.333%"] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 45, // Increase to slow down, decrease to speed up
          }}
        >
          {duplicatedTestimonials.map((testimonial, i) => (
            <div 
              key={i} 
              className="relative w-[320px] sm:w-[380px] lg:w-[420px] flex-shrink-0 bg-white dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-3xl p-8 shadow-sm flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Giant decorative quote mark behind the text */}
              <div className="absolute top-6 left-6 text-black/[0.03] dark:text-white/[0.03] font-serif text-8xl leading-none pointer-events-none z-0">
                &ldquo;
              </div>

              {/* Five Stars */}
              <div className="flex gap-1 mb-6 relative z-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-5 h-5 text-[#FFBD2E]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p 
                className="text-[16px] sm:text-[17px] text-[#1a1a1a] dark:text-white/80 leading-relaxed mb-8 relative z-10 flex-grow"
                style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
              >
                "{testimonial.quote}"
              </p>

              {/* Author Profile */}
              <div className="flex items-center gap-4 relative z-10 border-t border-black/5 dark:border-white/10 pt-6">
                
                {/* Generated SVG Avatar */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.avatarGradient} flex items-center justify-center shadow-inner border border-white/20`}>
                  <span className="text-white font-bold text-sm tracking-wider">
                    {testimonial.initials}
                  </span>
                </div>

                {/* Author Info */}
                <div>
                  <h4 className="font-semibold text-zinc-900 dark:text-white text-[15px]">
                    {testimonial.name}
                  </h4>
                  <p className="text-[13px] text-zinc-500 dark:text-white/50 mt-0.5">
                    {testimonial.role}
                  </p>
                </div>
              </div>

            </div>
          ))}
        </motion.div>
      </div>
      
    </section>
  );
}
