"use client";

import { motion } from "framer-motion";
import { useRef } from "react";

export default function HowItWorks() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -window.innerWidth * 0.75, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: window.innerWidth * 0.75, behavior: 'smooth' });
    }
  };

  const steps = [
    {
      tag: "Step 1 • Onboarding",
      title: "Sign up & verify identity.",
      list: ["Create secure profile", "BVN / NIN Verification", "Instant dashboard access"],
      // Deep Space Blue
      bgClass: "bg-[#0A1128]",
      textClass: "text-white",
      tagClass: "bg-white/10 text-white",
      listIconClass: "text-[#0BE49B]",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <circle cx="200" cy="200" r="120" stroke="#0BE49B" strokeWidth="2" strokeDasharray="8 8" />
          <rect x="150" y="140" width="100" height="120" rx="20" fill="#ffffff" fillOpacity="0.05" />
          <path d="M200 170C211.046 170 220 178.954 220 190C220 201.046 211.046 210 200 210C188.954 210 180 201.046 180 190C180 178.954 188.954 170 200 170Z" fill="#0BE49B" fillOpacity="0.2" />
          <path d="M165 240C165 220.67 180.67 205 200 205C219.33 205 235 220.67 235 240" stroke="#0BE49B" strokeWidth="8" strokeLinecap="round" />
        </svg>
      )
    },
    {
      tag: "Step 2 • Selection",
      title: "Choose your exact service.",
      list: ["CAC Registration", "SCUML & Tax ID (TIN)", "Utility Vending"],
      // Mint/Ocean Green
      bgClass: "bg-[#E6F3EE]",
      textClass: "text-[#12221C]",
      tagClass: "bg-[#12221C]/10 text-[#12221C]",
      listIconClass: "text-[#045137]",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <rect x="100" y="100" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.1" />
          <rect x="210" y="100" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.2" />
          <rect x="100" y="210" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.15" />
          <rect x="210" y="210" width="90" height="90" rx="24" fill="#045137" fillOpacity="0.05" />
          <circle cx="255" cy="145" r="15" fill="#045137" />
        </svg>
      )
    },
    {
      tag: "Step 3 • Processing",
      title: "Track status in real-time.",
      list: ["Live progress updates", "Secure wallet payments", "Document uploads"],
      // Soft Peach/Orange
      bgClass: "bg-[#FDF3E7]",
      textClass: "text-[#3B2613]",
      tagClass: "bg-[#3B2613]/10 text-[#3B2613]",
      listIconClass: "text-[#D05F0D]",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <rect x="80" y="180" width="240" height="40" rx="20" fill="#D05F0D" fillOpacity="0.1" />
          <rect x="80" y="180" width="160" height="40" rx="20" fill="#D05F0D" fillOpacity="0.3" />
          <circle cx="240" cy="200" r="12" fill="#D05F0D" />
          <path d="M120 150L150 120L180 150" stroke="#D05F0D" strokeOpacity="0.5" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      tag: "Step 4 • Completion",
      title: "Download & start running.",
      list: ["Official Certificates", "Active Digital Wallet", "Continuous Support"],
      // Brand Pink/Red Gradient
      bgClass: "bg-gradient-to-br from-[#c7365f] to-[#e8447a]",
      textClass: "text-white",
      tagClass: "bg-white/20 text-white",
      listIconClass: "text-white",
      graphic: (
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full opacity-90">
          <path d="M200 100L225 160L290 165L240 210L255 275L200 240L145 275L160 210L110 165L175 160L200 100Z" fill="#ffffff" fillOpacity="0.2" />
          <path d="M200 120L215 165L265 170L225 200L235 250L200 225L165 250L175 200L135 170L185 165L200 120Z" fill="#ffffff" fillOpacity="0.4" />
        </svg>
      )
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-white dark:bg-[#0a0f1e] overflow-hidden transition-colors duration-300 relative">
      
      {/* ───── TOP HEADER & NAVIGATION ───── */}
      <div className="
