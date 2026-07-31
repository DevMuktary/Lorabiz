import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
      {/* Dynamic Gradient Orbs (Anchor Style) */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#c7365f]/20 rounded-full blur-[120px] pointer-events-none animate-pulse duration-1000" />
      <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c7365f]/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-[#e8447a] bg-[#c7365f]/10 border border-[#c7365f]/30 rounded-full backdrop-blur-sm shadow-[0_0_15px_rgba(199,54,95,0.15)]">
              <span className="w-1.5 h-1.5 bg-[#e8447a] rounded-full animate-ping" />
              Trusted by 5,000+ Nigerian Businesses
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
              Register Your{" "}
              <span className="bg-gradient-to-r from-[#c7365f] via-[#e8447a] to-[#f06292] bg-clip-text text-transparent">
                Business
              </span>{" "}
              in Minutes, Not Weeks
            </h1>

            <p className="text-lg text-white/60 max-w-xl leading-relaxed">
              LoraBiz is your all-in-one platform for CAC registrations, SCUML compliance,
              Tax ID generation, NIN verification, and essential digital services —{" "}
              <span className="text-white/90 font-medium">fast, easy, and reliable.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-2xl hover:shadow-[0_0_30px_rgba(199,54,95,0.4)] transition-all duration-300 hover:-translate-y-1 group"
              >
                Start Registration
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#services"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/80 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/30 transition-all duration-300"
              >
                Explore Services
              </a>
            </div>

            {/* Stats Mini Row */}
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-2xl font-bold text-white">5,000+</p>
                <p className="text-xs text-white/40 mt-0.5">Businesses Registered</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-white/40 mt-0.5">Success Rate</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-2xl font-bold text-white">24hrs</p>
                <p className="text-xs text-white/40 mt-0.5">Avg. Processing</p>
              </div>
            </div>
          </div>

          {/* Right — Hero Image with Glowing Backdrop */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#c7365f]/30 to-indigo-600/30 rounded-3xl blur-2xl animate-pulse" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0f1e]/50 backdrop-blur-sm">
              <Image
                src="/hero-illustration.jpg"
                alt="LoraBiz Platform"
                width={800}
                height={450}
                className="w-full h-auto opacity-90 hover:opacity-100 transition-opacity duration-500"
                priority
              />
            </div>
            
            {/* Floating Card Accent */}
            <div className="absolute -bottom-6 -left-6 bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl hidden lg:flex items-center gap-3 hover:-translate-y-2 transition-transform duration-300 cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">CAC Approved</p>
                <p className="text-xs text-white/50">Registration complete</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
