import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles } from "@phosphor-icons/react/dist/ssr";

const SERVICES = [
  {
    title: "CAC Registration",
    description: "Register Business Names, LLCs, NGOs, and handle post-incorporation.",
    logo: "/cac.png",
    href: "/dashboard/cac",
    active: true,
  },
  {
    title: "SCUML Certificate",
    description: "Special Control Unit Against Money Laundering registration & compliance.",
    logo: "/scuml.png",
    href: "/dashboard/coming-soon?service=SCUML",
    active: false,
  },
  {
    title: "Trademark (IPO)",
    description: "Protect your intellectual property, logos, and brand identity.",
    logo: "/ipo.png",
    href: "/dashboard/coming-soon?service=Trademark",
    active: false,
  },
  {
    title: "SMEDAN",
    description: "Get your business certified with the Small and Medium Enterprises agency.",
    logo: "/smedan.png",
    href: "/dashboard/coming-soon?service=SMEDAN",
    active: false,
  },
  {
    title: "NIMC Services",
    description: "Generate and print verified NIN slips directly from the dashboard.",
    logo: "/nimc.png",
    href: "/dashboard/coming-soon?service=NIMC",
    active: false,
  },
  {
    title: "Utility & Airtime",
    description: "Seamlessly pay for data, airtime, and utility bills.",
    logo: "/airtime.png",
    href: "/dashboard/coming-soon?service=Utilities",
    active: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Welcome to Lumebiz
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
          Select a service below to get started. From company registration to daily business utilities, manage all your operations in one secure place.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SERVICES.map((service) => (
          <Link 
            href={service.href} 
            key={service.title}
            className={`
              relative group flex flex-col p-6 rounded-2xl border transition-all duration-300
              ${service.active 
                ? "bg-white dark:bg-card border-slate-200 dark:border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10" 
                : "bg-slate-50 dark:bg-card/50 border-slate-100 dark:border-border/50 hover:border-slate-300 dark:hover:border-border grayscale hover:grayscale-0"
              }
            `}
          >
            {!service.active && (
              <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                <Sparkles weight="fill" className="h-3 w-3" />
                Coming Soon
              </span>
            )}

            <div className="h-16 w-16 mb-6 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center p-3 shadow-inner">
              <Image 
                src={service.logo} 
                alt={service.title} 
                width={60} 
                height={60} 
                className="object-contain w-full h-full"
              />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
              {service.title}
            </h3>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">
              {service.description}
            </p>

            <div className={`
              flex items-center gap-2 text-sm font-bold transition-colors mt-auto
              ${service.active ? "text-primary" : "text-slate-400 dark:text-slate-500"}
            `}>
              {service.active ? "Access Service" : "Join Waitlist"}
              <ArrowRight weight="bold" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
