import Image from "next/image";

export default function TelecomPartners() {
  const logos = [
    { src: "/mtn.png", alt: "MTN Nigeria", w: 60, h: 60 },
    { src: "/airtel.png", alt: "Airtel Nigeria", w: 60, h: 60 },
    { src: "/glo.png", alt: "Globacom", w: 60, h: 60 },
    { src: "/9mobile.png", alt: "9mobile", w: 60, h: 60 },
  ];

  return (
    <section className="py-16 px-6 bg-[#0d1221]/50 backdrop-blur-sm border-y border-white/5">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-[0.2em] mb-10">
          Supported Network Providers
        </p>
        <div className="flex items-center justify-center gap-10 md:gap-20">
          {logos.map((logo) => (
            <div key={logo.alt} className="opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
