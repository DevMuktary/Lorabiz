"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function FAQPage() {
  // FIXED: Set to null so all accordions remain closed on page load
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "How long does CAC Registration take?",
      answer: "Business Names take about 1-2 working hours, Limited Liability Companies (LLCs) take 3-7 business days, and NGOs/Incorporated Trustees take 1-2 months due to newspaper publication requirements."
    },
    {
      question: "What is SCUML and do I need it?",
      answer: "SCUML stands for Special Control Unit against Money Laundering, managed by the EFCC. You need it if you operate a Designated Non-Financial Business or Profession (e.g., NGOs, Real Estate, Law Firms, Jewelers) before you can open a corporate bank account."
    },
    {
      question: "How fast can I get my Tax ID (TIN)?",
      answer: "Once requested through our platform, we connect directly with the Nigeria Revenue Service (NRS) API to generate your official Corporate or Individual TIN within 30 minutes to 1 working hour."
    },
    {
      question: "What are the different types of NIN Slips?",
      answer: "We offer three types: Regular (contains full demographic details, required by CAC), Standard (for basic banking/telecom KYC), and Premium (fully colored card format for advanced verification)."
    },
    {
      question: "How do I fund my wallet to buy Data or Airtime?",
      answer: "You can fund your LoraBiz wallet instantly via bank transfer or card payment through our secure payment gateway. Once funded, you can purchase cheap SME data, airtime, and pay electricity bills automatically."
    },
    {
      question: "Are there any hidden fees?",
      answer: "No! LoraBiz prides itself on transparent pricing. The fees displayed on your dashboard during checkout are the final prices you pay. By cutting out middle-man agents, we save you up to 60% on traditional registration fees."
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6 overflow-hidden">
        
        {/* BRAND GLOW EFFECT */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#c7365f]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-3xl mx-auto relative z-10">
          
          {/* HEADER SECTION */}
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-bold tracking-widest uppercase bg-[#c7365f]/10 text-[#c7365f] mb-6"
            >
              Help Center
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight text-[#1a1a1a] dark:text-white"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Frequently Asked Questions
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-[#767676] dark:text-white/60"
              style={{ fontFamily: '"DM Sans", sans-serif' }}
            >
              Everything you need to know about LoraBiz and our automated services.
            </motion.p>
          </div>

          {/* ACCORDION LIST */}
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  key={index} 
                  className={`bg-white dark:bg-[#111827] border ${isOpen ? 'border-[#c7365f]/50 shadow-md' : 'border-black/5 dark:border-white/5 shadow-sm'} rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-6 flex items-center justify-between text-left focus:outline-none group"
                  >
                    <span className={`font-medium text-[17px] transition-colors duration-300 ${isOpen ? 'text-[#c7365f] dark:text-[#e8447a]' : 'text-[#1a1a1a] dark:text-white group-hover:text-[#c7365f]'}`}>
                      {faq.question}
                    </span>
                    <motion.div 
                      animate={{ rotate: isOpen ? 45 : 0 }} 
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className={`flex-shrink-0 ml-4 flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-300 ${isOpen ? 'bg-[#c7365f]/10 text-[#c7365f]' : 'bg-black/5 dark:bg-white/5 text-zinc-500 group-hover:bg-[#c7365f]/10 group-hover:text-[#c7365f]'}`}
                    >
                      {/* Using a clean Plus/Cross icon instead of a caret */}
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div 
                          className="px-6 pb-6 pt-0 text-[16px] text-[#767676] dark:text-white/60 leading-relaxed"
                          style={{ fontFamily: '"DM Sans", sans-serif' }}
                        >
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* POLISHED CONTACT CTA BOX */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 p-10 bg-white dark:bg-[#111827] rounded-[32px] border border-black/5 dark:border-white/5 shadow-xl text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#c7365f]/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-[#c7365f]/10 rounded-full flex items-center justify-center text-[#c7365f] mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-[#1a1a1a] dark:text-white tracking-tight">Still have questions?</h3>
              <p className="text-[16px] text-[#767676] dark:text-white/60 mb-8 max-w-md mx-auto" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                Can't find the answer you're looking for? Our dedicated support team is always ready to assist you.
              </p>
              <Link 
                href="/contact" 
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c7365f] hover:bg-[#e8447a] text-white font-medium rounded-full transition-all duration-300 shadow-lg shadow-[#c7365f]/30 hover:scale-105"
              >
                Chat with Support
              </Link>
            </div>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
