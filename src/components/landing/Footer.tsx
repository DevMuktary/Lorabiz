"use client";

import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0a0f1e] text-white pt-24 pb-12 border-t border-white/5 relative overflow-hidden">
      
      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#c7365f]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-12 relative z-10">
        
        {/* ───── INTEGRATED CTA (TOP) ───── */}
        <div className="flex flex-col items-center text-center max-w-[420px] mx-auto mb-24">
          <h2 
            className="text-[32px] font-medium text-white mb-4 tracking-tight"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            Start building with LoraBiz
          </h2>
          <p 
            className="text-[16px] text-white/60 mb-8 leading-relaxed"
            style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
          >
            Get the complete infrastructure needed to register, verify, and manage your business operations seamlessly.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] hover:shadow-[0_0_20px_rgba(199,54,95,0.4)] transition-all duration-300 font-medium text-[15px]"
          >
            Get started
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* ───── LINKS GRID ───── */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16 mb-20">
          
          {/* Column 1: Services */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[15px] font-semibold text-white tracking-wide">Services</h3>
            <div className="flex flex-col gap-4">
              <Link href="/services/cac" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">CAC Registration</Link>
              <Link href="/services/scuml" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">SCUML Certificate</Link>
              <Link href="/services/tax-id" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Tax ID (TIN)</Link>
              <Link href="/services/nin" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">NIN Verification</Link>
              <Link href="/services/utilities" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Utility Vending</Link>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[15px] font-semibold text-white tracking-wide">Company</h3>
            <div className="flex flex-col gap-4">
              <Link href="/about" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">About us</Link>
              <Link href="/careers" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Careers</Link>
              <Link href="/contact" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Contact us</Link>
            </div>
          </div>

          {/* Column 3: Resources */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[15px] font-semibold text-white tracking-wide">Resources</h3>
            <div className="flex flex-col gap-4">
              <Link href="/blog" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Blog</Link>
              <Link href="/guides" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Guides</Link>
              <Link href="/faq" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">FAQs</Link>
              <Link href="/help" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Help Center</Link>
            </div>
          </div>

          {/* Column 4: Legal */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[15px] font-semibold text-white tracking-wide">Legal</h3>
            <div className="flex flex-col gap-4">
              <Link href="/privacy" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Terms of Use</Link>
              <Link href="/compliance" className="text-[15px] text-[#7a7a7a] hover:text-white transition-colors">Compliance</Link>
            </div>
          </div>

          {/* Column 5: Address */}
          <div className="flex flex-col gap-8 col-span-2 md:col-span-4 lg:col-span-1 lg:pl-10 lg:border-l border-white/10">
            <div>
              <h3 className="text-[15px] font-semibold text-white mb-2">Nigeria</h3>
              <p className="text-[15px] text-[#7a7a7a] leading-relaxed">
                Ibadan, Oyo State,<br />
                Nigeria.
              </p>
            </div>
            
            {/* Newsletter Subscription */}
            <div className="mt-4">
              <h3 className="text-[14px] font-medium text-white mb-3">Stay in touch, get useful updates promptly.</h3>
              <form className="flex w-full relative">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-4 pr-24 text-[14px] text-white placeholder-white/40 focus:outline-none focus:border-[#c7365f] transition-colors"
                  required
                />
                <button 
                  type="submit" 
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-white text-[#0a0f1e] text-[13px] font-semibold rounded-md hover:bg-gray-200 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* ───── BOTTOM BAR ───── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pt-10 border-t border-white/10 gap-8">
          
          {/* Logo & Disclaimer */}
          <div className="max-w-[500px]">
            <Link href="/" className="flex items-center gap-2 mb-4 group inline-flex">
              <Image src="/logo.png" alt="LoraBiz Logo" width={32} height={32} className="rounded-md transition-transform duration-300 group-hover:scale-110" />
              <span className="text-xl font-bold tracking-tight text-white">
                Lora<span className="text-[#c7365f]">Biz</span>
              </span>
            </Link>
            <p className="text-[13px] text-white/40 leading-relaxed">
              LoraBiz is a technology company, not a government agency. We facilitate business registrations and utility payments through integrated API partners and regulatory bodies.
            </p>
          </div>

          {/* Social Links & Email */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 lg:gap-12">
            <div>
              <h3 className="text-[13px] font-medium text-white/40 mb-1 uppercase tracking-wider">Email</h3>
              <a href="mailto:hello@lorabiz.com" className="text-[15px] text-white hover:text-[#c7365f] transition-colors font-medium">
                hello@lorabiz.com
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              {/* X / Twitter */}
              <a href="https://x.com/use_lorabiz" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 5.918H5.078z"/></svg>
              </a>
              {/* Instagram */}
              <a href="https://instagram.com/use_lorabiz" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.46 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" /></svg>
              </a>
              {/* LinkedIn */}
              <a href="https://linkedin.com/company/use_lorabiz" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              {/* Facebook */}
              <a href="https://facebook.com/use_lorabiz" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-[#c7365f] hover:text-white transition-all duration-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>
              </a>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
