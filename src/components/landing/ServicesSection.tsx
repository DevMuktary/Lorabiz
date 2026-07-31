export default function ServicesSection() {
  const services = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      title: "CAC Registration",
      desc: "Business Name, Limited Company, LLP, NGO & more — registered seamlessly.",
      color: "from-emerald-400/10 to-emerald-600/10 hover:from-emerald-400/20 hover:to-emerald-600/20",
      border: "border-emerald-500/10 hover:border-emerald-500/30",
      iconBg: "bg-emerald-500/20 text-emerald-400",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      title: "SCUML Registration",
      desc: "Get your Special Control Unit against Money Laundering certificate quickly.",
      color: "from-blue-400/10 to-blue-600/10 hover:from-blue-400/20 hover:to-blue-600/20",
      border: "border-blue-500/10 hover:border-blue-500/30",
      iconBg: "bg-blue-500/20 text-blue-400",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
        </svg>
      ),
      title: "Tax ID (TIN)",
      desc: "Generate your Tax Identification Number swiftly for compliance.",
      color: "from-amber-400/10 to-amber-600/10 hover:from-amber-400/20 hover:to-amber-600/20",
      border: "border-amber-500/10 hover:border-amber-500/30",
      iconBg: "bg-amber-500/20 text-amber-400",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
        </svg>
      ),
      title: "NIN Verification",
      desc: "Generate slips and verify identities. Instant, secure, and government-compliant.",
      color: "from-violet-400/10 to-violet-600/10 hover:from-violet-400/20 hover:to-violet-600/20",
      border: "border-violet-500/10 hover:border-violet-500/30",
      iconBg: "bg-violet-500/20 text-violet-400",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
        </svg>
      ),
      title: "Airtime & Data",
      desc: "Buy airtime and data bundles for all networks directly from your wallet.",
      color: "from-rose-400/10 to-rose-600/10 hover:from-rose-400/20 hover:to-rose-600/20",
      border: "border-rose-500/10 hover:border-rose-500/30",
      iconBg: "bg-rose-500/20 text-rose-400",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
        </svg>
      ),
      title: "Integrated Wallet",
      desc: "Fund your account and track all transactions securely in one place.",
      color: "from-cyan-400/10 to-cyan-600/10 hover:from-cyan-400/20 hover:to-cyan-600/20",
      border: "border-cyan-500/10 hover:border-cyan-500/30",
      iconBg: "bg-cyan-500/20 text-cyan-400",
    },
  ];

  return (
    <section id="services" className="py-24 md:py-32 px-6 relative bg-[#0a0f1e]">
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#c7365f]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">Our Services</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Everything Your Business Needs
          </h2>
          <p className="mt-4 text-white/50 max-w-2xl mx-auto">
            From incorporation to compliance, we handle the heavy lifting so you can focus on growing your business.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <div
              key={i}
              className={`group relative rounded-2xl border ${service.border} bg-gradient-to-br ${service.color} bg-[#0d1221]/50 backdrop-blur-md p-8 hover:-translate-y-1 transition-all duration-300 overflow-hidden`}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-inner ${service.iconBg}`}>
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">{service.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{service.desc}</p>
              
              <div className="absolute bottom-6 right-6 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
