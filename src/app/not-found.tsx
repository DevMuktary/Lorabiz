import Link from "next/link";
import Image from "next/image";
import { House, Globe, PhoneCall } from "@phosphor-icons/react/dist/ssr";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = {
  title: "404 - Page Not Found | LoraBiz",
  description: "The page you are looking for does not exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary selection:text-primary-foreground">
      {/* Top Minimal Navigation Bar */}
      <header className="h-16 sm:h-20 border-b border-border/60 px-4 sm:px-8 flex items-center justify-between bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9">
            <Image
              src="/logo.png"
              alt="LoraBiz Logo"
              fill
              sizes="36px"
              priority
              className="object-contain transition-transform group-hover:scale-105"
            />
          </div>
          <span className="font-black text-lg sm:text-xl tracking-tight text-foreground">
            Lora<span className="text-primary">Biz</span>
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Link
            href="/contact"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary"
          >
            <PhoneCall size={15} weight="bold" />
            <span>Support</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main 404 Visual Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-4xl mx-auto w-full text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* 3D 404 Illustration Frame */}
        <div className="relative w-full max-w-lg sm:max-w-xl aspect-[16/11] sm:aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl border border-pink-200/60 dark:border-pink-900/30 bg-card mb-6 sm:mb-8 group">
          <Image
            src="/404.jpg"
            alt="404 Page Not Found Illustration"
            fill
            sizes="(max-width: 768px) 100vw, 640px"
            priority
            className="object-contain p-2 sm:p-4 transition-transform duration-500 group-hover:scale-[1.02]"
          />
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Text Details */}
        <div className="space-y-2 max-w-md mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Lost Your Way?
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            The page you are looking for might have been removed, renamed, or is temporarily unavailable.
          </p>
        </div>

        {/* 2 Focused Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md">
          {/* Button 1: Back to Dashboard */}
          <Link
            href="/dashboard"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <House size={18} weight="bold" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Button 2: Back to Home (Main Website) */}
          <Link
            href="/"
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Globe size={18} weight="bold" />
            <span>Back to Home</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 sm:px-8 border-t border-border/50 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} LoraBiz by QUADROX TECHNOLOGIES. All rights reserved.</p>
      </footer>
    </div>
  );
}
