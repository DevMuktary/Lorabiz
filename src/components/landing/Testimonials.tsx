export default function Testimonials() {
  const testimonials = [
    {
      quote: "I registered my business name through LoraBiz in less than 48 hours. The process was so seamless compared to doing it manually. Highly recommend!",
      name: "Amina K.",
      role: "Fashion Entrepreneur, Lagos",
    },
    {
      quote: "The AI category assistant saved me hours of research. It suggested the exact CAC categories for my tech consulting firm. Brilliant tool!",
      name: "Chinedu O.",
      role: "IT Consultant, Abuja",
    },
    {
      quote: "From CAC to SCUML to Tax ID — I got everything done on one platform. The wallet system makes payments so easy. LoraBiz is a game changer.",
      name: "Fatima B.",
      role: "Restaurant Owner, Kano",
    },
  ];

  return (
    <section id="testimonials" className="py-24 md:py-32 px-6 relative bg-[#0a0f1e]">
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#c7365f]/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">Testimonials</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Loved by Business Owners
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-8 hover:border-white/15 hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <svg key={j} className="w-4 h-4 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-8 group-hover:text-white/90 transition-colors">
                &ldquo;{t.quote}&rdquo;
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c7365f] to-[#e8447a] flex items-center justify-center text-sm font-bold text-white shadow-lg">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
