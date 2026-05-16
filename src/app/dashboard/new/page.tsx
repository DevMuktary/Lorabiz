import Link from "next/link";
import { 
  Storefront, 
  Buildings, 
  HandHeart, 
  ArrowRight, 
  CheckCircle 
} from "@phosphor-icons/react/dist/ssr"; // Use SSR imports for Server Components

const REGISTRATION_TYPES = [
  {
    id: "business-name",
    title: "Business Name",
    description: "The simplest, fastest, and most affordable way to register a small business. You and your business are treated as the same entity.",
    idealFor: [
      "Freelancers & Artisans",
      "Small shop owners",
      "Sole proprietors",
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
    description: "A separate legal entity from its owners. It protects your personal assets and allows you to issue shares or secure corporate loans.",
    idealFor: [
      "Startups & Agencies",
      "Businesses seeking investors",
      "Partnerships with multiple owners",
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
    description: "Strictly for non-profit organizations. This registers a board of trustees to manage the organization's assets and operations.",
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
    <div className="max-w-5xl mx-auto pb-12">
      
      {/* PAGE HEADER */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
          What would you like to register?
        </h1>
        <p className="text-lg text-gray-500">
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
              relative flex flex-col h-full bg-white p-8 rounded-3xl border border-gray-200 
              transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2
              group ${type.border}
            `}
          >
            {/* BADGE */}
            {type.badge && (
              <div className="absolute -top-3.5 inset-x-0 flex justify-center">
                <span className="bg-[#ff3f7a] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md">
                  {type.badge}
                </span>
              </div>
            )}

            {/* ICON & TITLE */}
            <div className="mb-6">
              <div className={`h-16 w-16 rounded-2xl ${type.bg} ${type.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <type.icon className="h-8 w-8" weight="fill" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
                {type.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed min-h-[80px]">
                {type.description}
              </p>
            </div>

            {/* IDEAL FOR LIST */}
            <div className="mt-auto pt-6 border-t border-gray-100 flex-1 flex flex-col">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                Perfect for:
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {type.idealFor.map((item, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-sm text-gray-700 font-medium">
                    <CheckCircle className={`h-5 w-5 shrink-0 ${type.color}`} weight="fill" />
                    <span className="leading-tight">{item}</span>
                  </li>
                ))}
              </ul>

              {/* ACTION BUTTON */}
              <div className={`
                w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${type.id === 'llc' 
                  ? 'bg-[#ff3f7a] text-white shadow-lg shadow-[#ff3f7a]/20 group-hover:bg-[#e02b62]' 
                  : 'bg-gray-50 text-gray-900 group-hover:bg-gray-100'
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
