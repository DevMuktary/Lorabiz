"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300">
      <Navbar />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 tracking-tight">Frequently Asked Questions</h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">Everything you need to know about LoraBiz and our services.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div key={index} className="bg-zinc-50 dark:bg-[#111827] border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                  >
                    <span className="font-semibold text-lg">{faq.question}</span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="text-[#c7365f]">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
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
                        <div className="px-6 pb-6 pt-0 text-zinc-600 dark:text-zinc-400 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-16 p-8 bg-[#c7365f]/5 dark:bg-[#c7365f]/10 rounded-3xl border border-[#c7365f]/10 text-center">
            <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">Our support team is always ready to help you out.</p>
            <Link href="/contact" className="inline-block px-6 py-3 bg-[#c7365f] text-white font-medium rounded-lg hover:bg-[#e8447a] transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
