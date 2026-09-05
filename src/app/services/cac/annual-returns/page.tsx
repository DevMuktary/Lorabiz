"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function AnnualReturnsLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const steps = [
    {
      step: "01",
      title: "Enter Entity Details",
      desc: "Provide your registered Business Name or Company (LLC) name and registration number (BN / RC Number).",
    },
    {
      step: "02",
      title: "Upload Verification Document",
      desc: "Upload either your CAC Registration Certificate OR your Status Report / Extract. Only one document is required.",
    },
    {
      step: "03",
      title: "Accredited Filing & Delivery",
      desc: "Our accredited compliance desk files directly with the CAC and delivers your official filing acknowledgement letters.",
    },
  ];

  const benefits = [
    {
      title: "Maintain Active Status",
      desc: "Prevent CAC from tagging your registered entity as INACTIVE on the public registry portal.",
      icon: (
        <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      title: "Prevent Penalty Accumulation",
      desc: "Stop ongoing statutory default penalties that accumulate each day a mandatory filing remains overdue.",
      icon: (
        <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
      ),
    },
    {
      title: "Protect Bank Accounts",
      desc: "Nigerian commercial banks mandate up-to-date annual returns status before renewing corporate bank accounts.",
      icon: (
        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75" />
        </svg>
      ),
    },
    {
      title: "Download Official Receipts",
      desc: "Track every year of filing and download official CAC acknowledgement receipts with verifiable QR codes.",
      icon: (
        <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
  ];

  const faqs = [
    {
      question: "When are CAC Annual Returns due in Nigeria?",
      answer: "Business Names are required to file by June 30th each calendar year, starting the year after registration. Limited Liability Companies (LLCs) must file within 42 days following their Annual General Meeting, or at least once per calendar year.",
    },
    {
      question: "What happens if a company fails to file CAC Annual Returns?",
      answer: "Under the Companies and Allied Matters Act (CAMA 2020), default entities accumulate penalty charges. In addition, the CAC marks defaulting entities as INACTIVE on the public registry, which leads to commercial bank account freezes and prevents obtaining Tax Clearance Certificates (TCC) or government contracts.",
    },
    {
      question: "What documents do I need to upload?",
      answer: "You only need to upload ONE document: either your official CAC Registration Certificate OR your CAC Status Report / Extract. Uploading either document is sufficient to verify your business and process your filing.",
    },
    {
      question: "Can I file for multiple overdue years at once?",
      answer: "Yes! The LoraBiz filing module allows you to select any range of past unfiled return years (e.g. 2021 to 2025). Our compliance desk handles the consolidated filings and obtains official acknowledgement slips for each year.",
    },
    {
      question: "How long does the filing process take?",
      answer: "Once submitted on your dashboard, our accredited compliance desk processes the filing within 24 to 48 business hours. You can track progress in real time on your dashboard and download official acknowledgement letters immediately upon completion.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white transition-colors duration-300 w-full max-w-[100vw] overflow-x-clip">
      <Navbar />

      <main className="pt-32 pb-24 px-4 sm:px-6 w-full max-w-full overflow-x-clip">
        {/* Glow ambient background safely contained */}
        <div className="absolute top-0 left-0 right-0 h-[350px] overflow-hidden pointer-events-none">
          <div className="w-[400px] sm:w-[600px] h-[300px] mx-auto bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto relative z-10">
          
          {/* HEADER BADGE */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 mb-6"
            >
              <Image src="/cac.png" alt="CAC Logo" width={18} height={18} className="object-contain" />
              CAC Statutory Compliance Desk
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="text-3xl sm:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-5 max-w-3xl mx-auto leading-tight"
            >
              File Your CAC Annual Returns Online in Nigeria
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-2xl mx-auto mb-8"
            >
              Keep your Business Name or Limited Liability Company (LLC) active on the CAC public portal, clear overdue penalty backlogs, and retrieve official filing acknowledgement letters.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                href="/dashboard/cac/post-incorporation/annual-returns"
                className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all text-center text-sm"
              >
                File Annual Returns Now
              </Link>
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-8 py-4 bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors text-center text-sm border border-zinc-200 dark:border-zinc-700"
              >
                Create Free Account
              </Link>
            </motion.div>
          </div>

          {/* WARNING ALERT CALLOUT */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-16 text-amber-900 dark:text-amber-200 text-sm flex items-start gap-3.5">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="font-bold mb-1">CAMA 2020 Statutory Notice</p>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                The Corporate Affairs Commission actively tags non-compliant registered companies and business names as <strong>INACTIVE</strong>. Unfiled annual returns prevent directors from opening or maintaining corporate bank accounts and applying for SCUML or Tax Clearance Certificates.
              </p>
            </div>
          </div>

          {/* 3-STEP PROCESS */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">How It Works</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Complete statutory returns filing in 3 simple steps without visiting any physical CAC office.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {steps.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 relative"
                >
                  <span className="text-3xl font-black text-emerald-600/30 dark:text-emerald-500/20 mb-3 block font-mono">
                    {item.step}
                  </span>
                  <h3 className="font-bold text-base mb-2 text-zinc-900 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BENEFITS GRID */}
          <div className="mb-20">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Why File Through LoraBiz?</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">End-to-end statutory compliance with verified accreditation.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex items-start gap-4"
                >
                  <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">{b.title}</h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ SECTION */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Frequently Asked Questions</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Everything you need to know about statutory CAC annual returns filing.</p>
            </div>

            <div className="space-y-3 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 font-bold text-sm text-zinc-900 dark:text-white hover:text-emerald-600 transition-colors cursor-pointer"
                    >
                      <span>{faq.question}</span>
                      <span className="text-xs text-zinc-400">{isOpen ? "−" : "+"}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM CTA BANNER */}
          <div className="rounded-3xl bg-gradient-to-r from-emerald-900 to-zinc-900 text-white p-8 sm:p-12 text-center relative overflow-hidden border border-emerald-500/20">
            <h2 className="text-2xl sm:text-4xl font-black mb-3 tracking-tight">
              Ready to clear your CAC annual returns?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl mx-auto mb-6">
              Submit your filing online in minutes. Our accredited agents handle document verification, portal filing, and delivery of official receipts.
            </p>
            <Link
              href="/dashboard/cac/post-incorporation/annual-returns"
              className="inline-block px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-lg"
            >
              Get Started Now
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
