import Link from "next/link";
import { Storefront, Buildings, HandHeart, CalendarCheck, PencilLine } from "@phosphor-icons/react/dist/ssr";

const CAC_SERVICES = [
  { name: "Register Business Name", href: "/dashboard/register/business-name", icon: Storefront, type: "Pre-Incorporation" },
  { name: "Register Company (LLC)", href: "/dashboard/register/llc", icon: Buildings, type: "Pre-Incorporation" },
  { name: "Register NGO / IT", href: "/dashboard/register/ngo", icon: HandHeart, type: "Pre-Incorporation" },
  { name: "File Annual Returns", href: "/dashboard/post-inc/annual-returns", icon: CalendarCheck, type: "Post-Incorporation" },
  { name: "Make Changes", href: "/dashboard/post-inc/changes", icon: PencilLine, type: "Post-Incorporation" },
];

export default function CacHubPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Corporate Affairs Commission (CAC)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl text-sm leading-relaxed">
          Select the specific CAC service you wish to process today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAC_SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <Link 
              key={service.name}
              href={service.href}
              className="flex items-center gap-4 p-5 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl hover:border-primary hover:shadow-lg transition-all group"
            >
              <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <Icon weight="duotone" className="h-6 w-6 text-slate-600 dark:text-slate-400 group-hover:text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-0.5 tracking-wider">{service.type}</p>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
