import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center justify-center overflow-hidden transition-colors duration-300">
      
      {/* Background Glow Effects (Subtle and Centered) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#045137]/10 dark:bg-[#c7365f]/15 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      
      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      <div
        className="absolute inset-0 opacity-0 dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-4xl mx-auto text-center flex flex-col items-center z-10">
        
        {/* Main Headline */}
        <h1 
          className="font-normal tracking-tight text-[#064806] dark:text-white"
          style={{
            fontSize: '56px',
            lineHeight: '52.58px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' // Emulating 'Teg'
          }}
        >
          The easiest way to register
          <br className="hidden sm:block" /> and manage your business.
        </h1>

        {/* Subheadline */}
        <p 
          className="mt-6 font-normal text-[#7a7a7a] dark:text-white/60 max-w-2xl mx-auto"
          style={{
            fontSize: '14px',
            lineHeight: '18px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          LoraBiz provides the complete infrastructure needed for businesses to register, comply, launch, and manage essential utilities all in one place.
        </p>

        {/* Single Centered CTA Button */}
        <div className="mt-10 mb-20">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center font-medium text-[#f1f9f6] bg-[#045137] dark:bg-gradient-to-r dark:from-[#c7365f] dark:to-[#e8447a] rounded-full hover:scale-105 hover:shadow-[0_10px_40px_rgba(4,81,55,0.3)] dark:hover:shadow-[0_0_30px_rgba(199,54,95,0.4)] transition-all duration-300"
            style={{
              fontSize: '18px',
              lineHeight: '22px',
              padding: '16px 36px',
              fontFamily: '"DM Sans", system-ui, sans-serif'
            }}
          >
            Get started
          </Link>
        </div>

        {/* Dashboard Image Preview */}
        <div className="relative w-full max-w-5xl mx-auto mt-4 group perspective-1000">
          <div className="absolute -inset-4 bg-gradient-to-b from-[#045137]/10 to-transparent dark:from-[#c7365f]/20 rounded-3xl blur-2xl transition-all duration-500" />
          
          <div className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-2xl bg-white/50 dark:bg-[#0a0f1e]/50 backdrop-blur-sm transform transition-transform duration-700 ease-out hover:-translate-y-2">
            <Image
              src="/dashboard-preview.jpg"
              alt="LoraBiz Platform"
              width={1000}
              height={562}
              className="w-full h-auto opacity-95 group-hover:opacity-100 transition-opacity duration-500"
              priority
            />
          </div>
        </div>
        
      </div>
    </section>
  );
}
