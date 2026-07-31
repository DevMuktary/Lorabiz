import Image from "next/image";
import Link from "next/link";

export default function DashboardPreview() {
  return (
    <section className="py-24 md:py-32 px-6 relative bg-gradient-to-b from-[#0a0f1e] to-[#0d1221] border-y border-white/5">
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left: Image Box */}
          <div className="relative order-2 lg:order-1 group">
            <div className="absolute -inset-6 bg-gradient-to-r from-[#c7365f]/15 to-indigo-600/15 rounded-3xl blur-2xl group-hover:from-[#c7365f]/25 group-hover:to-indigo-600/25 transition-all duration-500" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#111827]">
              <Image
                src="/dashboard-preview.jpg"
                alt="LoraBiz Dashboard"
                width={800}
                height={450}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div>
              <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">Powerful Dashboard</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight text-white">
                Manage Everything From{" "}
                <span className="bg-gradient-to-r from-[#c7365f] to-[#e8447a] bg-clip-text text-transparent">
                  One Place
                </span>
              </h2>
            </div>
            
            <p className="text-white/60 text-lg leading-relaxed">
              Track your registration status, manage your wallet balance, view transaction history,
              and handle queries — all from an intuitive, real-time dashboard designed for clarity.
            </p>
            
            <ul className="space-y-5">
              {[
                "Real-time application tracking & status updates",
                "Built-in wallet with instant funding via Paystack",
                "AI-powered category assistant for CAC registrations",
                "Download receipts, certificates & compliance documents",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#c7365f] to-[#e8447a] flex items-center justify-center shadow-[0_0_10px_rgba(199,54,95,0.3)]">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium text-white/80">{item}</span>
                </li>
              ))}
            </ul>
            
            <div className="pt-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
              >
                Access Dashboard
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
