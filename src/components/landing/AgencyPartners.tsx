import Image from "next/image";

export default function AgencyPartners() {
  const logos = [
    { src: "/cac.png", alt: "Corporate Affairs Commission", w: 72, h: 72 },
    { src: "/nimc.png", alt: "National Identity Management Commission", w: 100, h: 50 },
    { src: "/scuml.png", alt: "SCUML — EFCC", w: 60, h: 60 },
    { src: "/smedan.png", alt: "SMEDAN", w: 120, h: 40 },
    { src: "/nrs.png", alt: "NRS", w: 80, h: 40 },
    { src: "/ipo.png", alt: "Intellectual Property Office", w: 56, h: 56 },
  ];

  return (
    <section id="partners" className="py-16 border-y border-white/5 bg-[#0d1221]/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold text-white/30 uppercase tracking-[0.2em] mb-10">
          Working with Nigeria&apos;s leading regulatory agencies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {logos.map((logo) => (
            <div key={logo.alt} className="opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.w}
                height={logo.h}
                className="object-contain brightness-0 invert hover:brightness-100 hover:invert-0 transition-all duration-500"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
