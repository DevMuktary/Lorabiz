import Link from "next/link";
import { 
  Storefront, 
  Buildings, 
  HandHeart, 
  ArrowRight, 
  CheckCircle 
} from "@phosphor-icons/react/dist/ssr";

const REGISTRATION_TYPES = [
  {
    id: "business-name",
    title: "Business Name",
    description: "The fastest and most affordable way to register a small business. You can register as a sole proprietor or as a partnership with multiple proprietors.",
    idealFor: [
      "Freelancers & Artisans",
      "Sole Proprietors",
      "Partnerships",
    ],
    icon: Storefront,
    href: "/dashboard/register/business-name",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "hover:border-blue-300 focus:ring-blue-500",
    badge: null,
  },
  {
    id: "llc",
    title: "Limited Liability Company (LTD)",
    description: "A separate legal entity from its owners. It protects your personal assets and allows you to issue shares, bid for major contracts, or secure corporate loans.",
    idealFor: [
      "Startups & Tech Agencies",
      "Businesses seeking investors",
      "Companies bidding for contracts",
    ],
    icon: Buildings,
    href: "/dashboard/register/llc",
    color: "text-[#ff3f7a]",
    bg: "bg-[#ff3f7a]/10",
    border: "hover:border-[#ff3f7a]/50 focus:ring-[#ff3f7a] border-[#ff3f7a]/20 shadow-sm",
    badge: "Most Popular",
  },
  {
    id: "ngo",
    title: "Incorporated Trustees (NGO)",
    description: "Strictly for non-profit organizations. This registers a board of trustees to manage the organization's assets, operations, and charitable goals.",
    idealFor: [
      "Churches & Mosques",
      "Foundations & Charities",
      "Clubs & Associations",
    ],
    icon: HandHeart,
    href: "/dashboard/register/ngo",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "hover:border-emerald-300 focus:ring-emerald-500",
    badge: null,
  }
];

export default function NewRegistrationPage() {
  return (
    <div className="max-w-6xl mx-auto pb-12 antialiased">
      
      {/* PAGE HEADER */}
      <div className="text-center max-w-2xl mx-auto mb-14">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          What would you like to register?
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed font-medium">
          Select the type of entity that best fits your needs. Don't worry if you aren't a legal expert, we've made it simple to understand.
        </p>
      </div>

      {/* SELECTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {REGISTRATION_TYPES.map((type) => (
          <Link 
            key={type.id} 
            href={type.href}
            className={`
              relative flex flex-col h-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 
              transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2
              group ${type.border}
            `}
          >
            {/* BADGE */}
            {type.badge && (
              <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                <span className="bg-[#ff3f7a] text-white text-[11px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md">
                  {type.badge}
                </span>
              </div>
            )}

            {/* ICON & TITLE */}
            <div className="mb-6">
              <div className={`h-16 w-16 rounded-2xl ${type.bg} ${type.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <type.icon className="h-8 w-8" weight="fill" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-3">
                {type.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed min-h-[85px] font-medium">
                {type.description}
              </p>
            </div>

            {/* IDEAL FOR LIST */}
            <div className="mt-auto pt-6 border-t border-slate-100 flex-1 flex flex-col">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                Perfect for:
              </p>
              <ul className="space-y-3.5 mb-10 flex-1">
                {type.idealFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-slate-700 font-semibold">
                    <CheckCircle className={`h-5 w-5 shrink-0 ${type.color}`} weight="fill" />
                    <span className="leading-snug pt-0.5">{item}</span>
                  </li>
                ))}
              </ul>

              {/* ACTION BUTTON */}
              <div className={`
                w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all
                ${type.id === 'llc' 
                  ? 'bg-[#ff3f7a] text-white shadow-lg shadow-[#ff3f7a]/25 group-hover:bg-[#e02b62] group-hover:shadow-[#ff3f7a]/40' 
                  : 'bg-slate-50 text-slate-900 group-hover:bg-slate-100'
                }
              `}>
                Start Application
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" weight="bold" />
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
