import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#080c17] py-16 px-6 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-16">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6 group">
              <Image src="/logo.png" alt="LoraBiz" width={36} height={36} className="rounded-lg transition-transform group-hover:scale-105" />
              <span className="text-xl font-bold text-white">Lora<span className="text-[#c7365f]">Biz</span></span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-4">
              Statutory compliance and utility services. Built by Quadrox Technologies Limited.
            </p>
            <p className="text-xs font-semibold text-[#e8447a] tracking-widest uppercase">Simple. Affordable. Reliable.</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Services</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/auth/register" className="hover:text-[#e8447a] transition-colors">CAC Registration</Link></li>
              <li><Link href="/auth/register" className="hover:text-[#e8447a] transition-colors">SCUML Certificate</Link></li>
              <li><Link href="/auth/register" className="hover:text-[#e8447a] transition-colors">Tax ID (TIN)</Link></li>
              <li><Link href="/auth/register" className="hover:text-[#e8447a] transition-colors">NIN Verification</Link></li>
              <li><Link href="/auth/register" className="hover:text-[#e8447a] transition-colors">Airtime &amp; Data</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Company</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-4 text-sm text-white/50">
              <li>
                <a href="https://lorabiz.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#e8447a] transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 0 1 9-9" />
                  </svg>
                  lorabiz.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
                </svg>
                Quadrox Technologies Limited
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} LoraBiz. All rights reserved.
          </p>
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <Image src="/logo.png" alt="LoraBiz" width={20} height={20} className="rounded" />
            <span className="text-xs font-bold text-white">Lora<span className="text-[#c7365f]">Biz</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
