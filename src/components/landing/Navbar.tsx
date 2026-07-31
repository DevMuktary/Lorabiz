import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0f1e]/70 border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.png"
            alt="LoraBiz Logo"
            width={40}
            height={40}
            className="rounded-lg transition-transform duration-300 group-hover:scale-110"
          />
          <span className="text-xl font-bold tracking-tight">
            Lora<span className="text-[#c7365f]">Biz</span>
          </span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
          <a href="#services" className="hover:text-white transition-colors duration-200">Services</a>
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">How It Works</a>
          <a href="#partners" className="hover:text-white transition-colors duration-200">Partners</a>
          <a href="#testimonials" className="hover:text-white transition-colors duration-200">Testimonials</a>
        </div>
        
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="hidden sm:inline-flex px-5 py-2 text-sm font-medium text-white/80 hover:text-white rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-300"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-full hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all duration-300 hover:scale-105"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
