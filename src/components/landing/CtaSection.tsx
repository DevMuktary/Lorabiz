import Image from "next/image";
import Link from "next/link";

export default function CtaSection() {
  return (
    <section className="py-24 md:py-32 px-6 relative border-t border-white/5 bg-[#0a0f1e] overflow-hidden">
      {/* Intense Background Mesh */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#c7365f]/15 via-transparent to-indigo-600/15 pointer-events-none mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#c7365f]/20 rounded-[100%] blur-[120px] pointer-events-none" />
      
      <div className="max-w-3xl mx-auto text-center relative z-10">
        <div className="inline-flex mb-8 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
          <Image
            src="/logo.png"
            alt="LoraBiz"
            width={64}
            height={64}
            className="rounded-xl"
          />
        </div>
        
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
          Ready to Register{" "}
          <span className="bg-gradient-to-r from-[#c7365f] via-[#e8447a] to-[#f06292] bg-clip-text text-transparent drop-shadow-lg">
            Your Business?
          </span>
        </h2>
        
        <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
          Join thousands of Nigerian entrepreneurs who trust LoraBiz for fast, reliable, and affordable business services.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-10 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-2xl shadow-[0_0_30px_rgba(199,54,95,0.4)] hover:shadow-[0_0_50px_rgba(199,54,95,0.6)] transition-all duration-300 hover:scale-[1.03] group"
          >
            Create Free Account
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-10 py-4 text-base font-medium text-white/70 border border-white/15 rounded-2xl hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300"
          >
            Sign In
          </Link>
        </div>
      </div>
    </section>
  );
}
