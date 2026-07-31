import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AgencyPartners from "@/components/landing/AgencyPartners";
import ServicesSection from "@/components/landing/ServicesSection";
import DashboardPreview from "@/components/landing/DashboardPreview";
import HowItWorks from "@/components/landing/HowItWorks";
import TelecomPartners from "@/components/landing/TelecomPartners";
import Testimonials from "@/components/landing/Testimonials";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    // Changed the root wrapper to support Light/Dark mode seamlessly
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
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
