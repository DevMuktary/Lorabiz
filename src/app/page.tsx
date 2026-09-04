import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AgencyPartners from "@/components/landing/AgencyPartners";
import ServicesSection from "@/components/landing/ServicesSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import TelecomPartners from "@/components/landing/TelecomPartners";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Lorabiz | Fast Business Registrations, CAC, SCUML & Compliance in Nigeria",
  description:
    "Nigeria's smart platform for corporate compliance. Register your Business Name or LLC with CAC in 2 hours, obtain SCUML certificates, generate instant Tax IDs, and manage statutory filings.",
  alternates: {
    canonical: "https://lorabiz.com",
  },
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-[#0a0f1e] text-zinc-900 dark:text-white overflow-hidden transition-colors duration-300">
      <Navbar />
      <main>
        <HeroSection />
        <AgencyPartners />
        <ServicesSection />
        <DashboardPreview />
        <HowItWorks />
        <TelecomPartners />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
