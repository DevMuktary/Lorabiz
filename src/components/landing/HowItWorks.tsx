export default function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Create Your Account",
      desc: "Sign up with your phone number and verify via OTP. Your secure dashboard is ready in seconds.",
      gradient: "from-[#c7365f] to-[#e8447a]",
      shadow: "shadow-[#c7365f]/30",
    },
    {
      step: "02",
      title: "Choose Your Service",
      desc: "Select from CAC registration, SCUML, Tax ID, NIN verification, or utility services. Our AI assistant guides you.",
      gradient: "from-indigo-500 to-violet-500",
      shadow: "shadow-indigo-500/30",
    },
    {
      step: "03",
      title: "Submit & Track",
      desc: "Pay securely via wallet or Paystack, submit your documents, and track real-time status from your dashboard.",
      gradient: "from-emerald-500 to-teal-500",
      shadow: "shadow-emerald-500/30",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 relative bg-[#0a0f1e]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Three Simple Steps
          </h2>
          <p className="mt-4 text-white/50 max-w-xl mx-auto">
            Get your business registered and compliant in minutes with our streamlined process.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-10 left-[calc(16.66%+40px)] right-[calc(16.66%+40px)] h-[2px] bg-gradient-to-r from-[#c7365f]/20 via-indigo-500/20 to-emerald-500/20" />

          {steps.map((item, i) => (
            <div key={i} className="relative group z-10">
              <div className="text-center space-y-6">
                <div 
                  className={`mx-auto inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(0,0,0,0)] group-hover:shadow-2xl group-hover:${item.shadow} group-hover:-translate-y-2 transition-all duration-300`}
                >
                  {item.step}
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-white group-hover:text-[#e8447a] transition-colors duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
