"use client";

import { motion } from "framer-motion";

export default function DashboardPreview() {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-zinc-900 dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      title: "Complete solution",
      desc: "Our fully integrated platform gives you the flexibility to manage all your corporate registrations in one place.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-zinc-900 dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "Automated workflows",
      desc: "Meet all your compliance needs with our fast, intelligent, and highly automated processing systems.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-zinc-900 dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      title: "Real-time tracking",
      desc: "We’re all about transparency. Track every application instantly from submission to final certificate delivery.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-zinc-900 dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Smooth compliance",
      desc: "We take on the complex agency relationships so you can focus entirely on growing your business.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-zinc-900 dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      title: "Build & launch faster",
      desc: "Use our simple dashboard, integrated wallet, and AI category tools to get your business registered in days.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-full h-full text-zinc-900 dark:text-white">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: "Scalable and secure",
      desc: "Our secure platform scales with you and is trusted by thousands of startups and established corporations.",
    },
  ];

  return (
    <section className="bg-white dark:bg-[#0a0f1e] transition-colors duration-300 overflow-hidden">
      {/* Container matching the exact Anchor CSS:
        max-width: 1440px; padding-top: 98px; padding-right: 10%; display: flex; justify-content: space-between; column-gap: 50px; row-gap: 50px;
      */}
      <div className="w-full max-w-[1440px] mx-auto px-6 lg:pl-12 xl:pl-[8%] lg:pr-[10%] pt-[60px] lg:pt-[98px] pb-24 flex flex-col lg:flex-row justify-between gap-[50px]">
        
        {/* ───── LEFT SIDE: HEADER ───── */}
        {/* CSS Match: flex-grow: 1; flex-basis: 0%; max-width: 535px; (700px on 1920 screens) */}
        <div className="flex-1 lg:max-w-[535px] xl:max-w-[600px]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-32"
          >
            <h2 
              className="font-normal text-[#1a1a1a] dark:text-white"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)', // 48px exactly like the CSS
                lineHeight: '1.1875',               // 1.1875 exactly like the CSS
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              Register and run <br className="hidden md:block"/>
              compliant businesses faster.
            </h2>
          </motion.div>
        </div>

        {/* ───── RIGHT SIDE: FEATURES GRID ───── */}
        {/* CSS Match: width: 48%; max-width: 700px; */}
        <div className="w-full lg:w-[48%] lg:max-w-[700px]">
          {/* CSS Match: display: grid; grid-template-columns: 1fr 1fr; column-gap: 100px; row-gap: 40px; */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 lg:gap-x-[100px] gap-y-10 lg:gap-y-[40px]">
            
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                {/* CSS Match: width: 32px; height: 32px; */}
                <div className="w-[32px] h-[32px]">
                  {feature.icon}
                </div>

                {/* CSS Match: max-width: 284px; color: #1a1a1a; margin-top: 24px; margin-bottom: 12px; font-size: 28px; line-height: 1; */}
                <h3 
                  className="max-w-[284px] mt-[24px] mb-[12px] text-[#1a1a1a] dark:text-white font-medium"
                  style={{
                    fontSize: 'clamp(22px, 2.5vw, 28px)', 
                    lineHeight: '1',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  {feature.title}
                </h3>

                {/* CSS Match: color: #767676; font-size: 16px; line-height: 1.4375; */}
                <p 
                  className="text-[#767676] dark:text-white/60"
                  style={{
                    fontSize: 'clamp(14px, 1.5vw, 16px)',
                    lineHeight: '1.4375',
                    fontFamily: '"DM Sans", system-ui, sans-serif'
                  }}
                >
                  {feature.desc}
                </p>
              </motion.div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}
