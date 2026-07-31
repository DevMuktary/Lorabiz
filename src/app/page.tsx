import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#0a0f1e] text-white overflow-hidden">
      {/* ───── Navigation ───── */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0a0f1e]/70 border-b border-white/5">
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
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden sm:inline-flex px-5 py-2 text-sm font-medium text-white/80 hover:text-white rounded-full border border-white/10 hover:border-white/25 transition-all duration-300"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-full hover:shadow-lg hover:shadow-[#c7365f]/30 transition-all duration-300 hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero Section ───── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6">
        {/* Gradient orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-[#c7365f]/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#c7365f]/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-[#e8447a] bg-[#c7365f]/10 border border-[#c7365f]/20 rounded-full backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-[#e8447a] rounded-full animate-pulse" />
                Trusted by 5,000+ Nigerian Businesses
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
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
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-2xl hover:shadow-2xl hover:shadow-[#c7365f]/30 transition-all duration-300 hover:scale-[1.03] group"
                >
                  Start Registration
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white/80 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all duration-300"
                >
                  Explore Services
                </a>
              </div>

              {/* Stats mini row */}
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

            {/* Right — Hero image */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#c7365f]/20 to-indigo-600/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-[#c7365f]/10">
                <Image
                  src="/hero-illustration.jpg"
                  alt="LoraBiz Platform — Modern Business Registration Dashboard"
                  width={800}
                  height={450}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Floating card accent */}
              <div className="absolute -bottom-6 -left-6 bg-[#111827]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl hidden lg:flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
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

      {/* ───── Partner Logos Marquee ───── */}
      <section id="partners" className="py-16 border-y border-white/5 bg-[#0d1221]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-[0.2em] mb-10">
            Working with Nigeria&apos;s leading regulatory agencies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-60 hover:opacity-80 transition-opacity duration-500">
            {[
              { src: "/cac.png", alt: "Corporate Affairs Commission", w: 72, h: 72 },
              { src: "/nimc.png", alt: "National Identity Management Commission", w: 100, h: 50 },
              { src: "/scuml.png", alt: "SCUML — EFCC", w: 60, h: 60 },
              { src: "/smedan.png", alt: "SMEDAN", w: 120, h: 40 },
              { src: "/nrs.png", alt: "NRS", w: 80, h: 40 },
              { src: "/ipo.png", alt: "Intellectual Property Office", w: 56, h: 56 },
            ].map((logo) => (
              <Image
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="object-contain brightness-0 invert"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Services Section ───── */}
      <section id="services" className="py-24 md:py-32 px-6 relative">
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#c7365f]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">Our Services</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything Your Business Needs
            </h2>
            <p className="mt-4 text-white/50 max-w-2xl mx-auto">
              From incorporation to compliance, we handle the heavy lifting so you can focus on growing your business.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                ),
                title: "CAC Registration",
                desc: "Business Name, Limited Company, LLP, NGO & more — registered with the Corporate Affairs Commission seamlessly.",
                color: "from-emerald-400/20 to-emerald-600/20",
                border: "border-emerald-500/20",
                iconBg: "bg-emerald-500/20 text-emerald-400",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                ),
                title: "SCUML Registration",
                desc: "Get your Special Control Unit against Money Laundering certificate quickly and efficiently through our platform.",
                color: "from-blue-400/20 to-blue-600/20",
                border: "border-blue-500/20",
                iconBg: "bg-blue-500/20 text-blue-400",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                  </svg>
                ),
                title: "Tax ID (TIN)",
                desc: "Generate your Tax Identification Number swiftly. Essential for every registered business in Nigeria.",
                color: "from-amber-400/20 to-amber-600/20",
                border: "border-amber-500/20",
                iconBg: "bg-amber-500/20 text-amber-400",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                  </svg>
                ),
                title: "NIN Verification",
                desc: "Generate NIN slips and verify identities with ease. Instant, secure, and government-compliant.",
                color: "from-violet-400/20 to-violet-600/20",
                border: "border-violet-500/20",
                iconBg: "bg-violet-500/20 text-violet-400",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                ),
                title: "Airtime & Data",
                desc: "Buy airtime and data bundles for MTN, Airtel, Glo, and 9mobile directly from your wallet at the best rates.",
                color: "from-rose-400/20 to-rose-600/20",
                border: "border-rose-500/20",
                iconBg: "bg-rose-500/20 text-rose-400",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
                  </svg>
                ),
                title: "Integrated Wallet",
                desc: "Fund your account, pay for services, and track all transactions through our secure built-in wallet system.",
                color: "from-cyan-400/20 to-cyan-600/20",
                border: "border-cyan-500/20",
                iconBg: "bg-cyan-500/20 text-cyan-400",
              },
            ].map((service, i) => (
              <div
                key={i}
                className={`group relative rounded-2xl border ${service.border} bg-gradient-to-br ${service.color} backdrop-blur-sm p-6 hover:scale-[1.03] hover:shadow-xl transition-all duration-300`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${service.iconBg}`}>
                  {service.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{service.desc}</p>
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Dashboard Preview Section ───── */}
      <section className="py-24 md:py-32 px-6 relative bg-gradient-to-b from-[#0a0f1e] to-[#0d1221]">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Image */}
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-6 bg-gradient-to-r from-[#c7365f]/15 to-indigo-600/15 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/dashboard-preview.jpg"
                  alt="LoraBiz Dashboard — Manage registrations, wallet, and transactions"
                  width={800}
                  height={450}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em]">Powerful Dashboard</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                Manage Everything From{" "}
                <span className="bg-gradient-to-r from-[#c7365f] to-[#e8447a] bg-clip-text text-transparent">
                  One Place
                </span>
              </h2>
              <p className="text-white/50 leading-relaxed">
                Track your registration status, manage your wallet balance, view transaction history,
                and handle queries — all from an intuitive, real-time dashboard designed for clarity.
              </p>
              <ul className="space-y-4 pt-2">
                {[
                  "Real-time application tracking & status updates",
                  "Built-in wallet with instant funding via Paystack",
                  "AI-powered category assistant for CAC registrations",
                  "Download receipts, certificates & documents",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 mt-0.5 rounded-full bg-[#c7365f]/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#e8447a]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-4">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-xl hover:shadow-lg hover:shadow-[#c7365f]/25 transition-all duration-300 group"
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

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Three Simple Steps
            </h2>
            <p className="mt-4 text-white/50 max-w-xl mx-auto">
              Get your business registered and compliant in minutes with our streamlined process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Sign up with your phone number and verify via OTP. Your secure dashboard is ready in seconds.",
                gradient: "from-[#c7365f] to-[#e8447a]",
              },
              {
                step: "02",
                title: "Choose Your Service",
                desc: "Select from CAC registration, SCUML, Tax ID, NIN verification, or utility services. Our AI assistant guides you.",
                gradient: "from-indigo-500 to-violet-500",
              },
              {
                step: "03",
                title: "Submit & Track",
                desc: "Pay securely via wallet or Paystack, submit your documents, and track real-time status from your dashboard.",
                gradient: "from-emerald-500 to-teal-500",
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                {/* Connector line (hidden on mobile) */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-gradient-to-r from-white/10 to-white/5" />
                )}
                <div className="text-center space-y-4">
                  <div className={`inline-flex w-20 h-20 rounded-2xl bg-gradient-to-br ${item.gradient} items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Telecom Partners ───── */}
      <section className="py-16 px-6 bg-[#0d1221] border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-[0.2em] mb-10">
            Supported Network Providers
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-20">
            {[
              { src: "/mtn.png", alt: "MTN Nigeria", w: 60, h: 60 },
              { src: "/airtel.png", alt: "Airtel Nigeria", w: 60, h: 60 },
              { src: "/glo.png", alt: "Globacom", w: 60, h: 60 },
              { src: "/9mobile.png", alt: "9mobile", w: 60, h: 60 },
            ].map((logo) => (
              <Image
                key={logo.alt}
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="py-24 md:py-32 px-6 relative">
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#c7365f]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-[#e8447a] uppercase tracking-[0.2em] mb-3">Testimonials</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Loved by Business Owners
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
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
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c7365f] to-[#e8447a] flex items-center justify-center text-sm font-bold text-white">
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

      {/* ───── CTA Section ───── */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#c7365f]/10 via-transparent to-indigo-600/10 pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex mb-6">
            <Image
              src="/logo.png"
              alt="LoraBiz"
              width={64}
              height={64}
              className="rounded-xl"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
            Ready to Register{" "}
            <span className="bg-gradient-to-r from-[#c7365f] to-[#e8447a] bg-clip-text text-transparent">
              Your Business?
            </span>
          </h2>
          <p className="text-white/50 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of Nigerian entrepreneurs who trust LoraBiz for fast, reliable, and affordable business services.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-10 py-4 text-base font-semibold text-white bg-gradient-to-r from-[#c7365f] to-[#e8447a] rounded-2xl hover:shadow-2xl hover:shadow-[#c7365f]/30 transition-all duration-300 hover:scale-[1.03] group"
            >
              Create Free Account
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-10 py-4 text-base font-medium text-white/70 border border-white/10 rounded-2xl hover:bg-white/5 hover:border-white/20 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t border-white/5 bg-[#080c17] py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image src="/logo.png" alt="LoraBiz" width={36} height={36} className="rounded-lg" />
                <span className="text-lg font-bold">Lora<span className="text-[#c7365f]">Biz</span></span>
              </Link>
              <p className="text-sm text-white/40 leading-relaxed mb-4">
                Statutory compliance and utility services. Built by Quadrox Technologies Limited.
              </p>
              <p className="text-xs text-white/25">Simple. Affordable. Reliable.</p>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-4">Services</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><Link href="/auth/register" className="hover:text-white/70 transition-colors">CAC Registration</Link></li>
                <li><Link href="/auth/register" className="hover:text-white/70 transition-colors">SCUML Certificate</Link></li>
                <li><Link href="/auth/register" className="hover:text-white/70 transition-colors">Tax ID (TIN)</Link></li>
                <li><Link href="/auth/register" className="hover:text-white/70 transition-colors">NIN Verification</Link></li>
                <li><Link href="/auth/register" className="hover:text-white/70 transition-colors">Airtime &amp; Data</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li><Link href="/terms" className="hover:text-white/70 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/acceptable-use" className="hover:text-white/70 transition-colors">Acceptable Use</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white/80 mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-white/40">
                <li>
                  <a href="https://lorabiz.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">
                    lorabiz.com
                  </a>
                </li>
                <li className="text-white/30">Quadrox Technologies Limited</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/25">
              &copy; {new Date().getFullYear()} LoraBiz by Quadrox Technologies Limited. All rights reserved.
            </p>
            <div className="flex items-center gap-1 opacity-60">
              <Image src="/logo.png" alt="LoraBiz" width={20} height={20} className="rounded" />
              <span className="text-xs text-white/30 font-medium">LoraBiz</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
