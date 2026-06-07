import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { 
  Storefront, 
  Buildings, 
  HandHeart, 
  ArrowRight, 
  CheckCircle,
  CaretLeft,
  Clock,
  Wallet,
  Info,
  CaretDown
} from "@phosphor-icons/react/dist/ssr";

const REGISTRATION_TYPES = [
  {
    id: "business-name",
    dbKey: "BUSINESS_NAME",
    title: "Business Name",
    description: "The fastest and most affordable way to register a small business. Register as a sole proprietor or as a partnership.",
    estimatedTime: "30 Mins - 1 Hour",
    idealFor: ["Freelancers & Artisans", "Sole Proprietors", "Partnerships"],
    icon: Storefront,
    href: "/dashboard/register/business-name",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-slate-200 hover:border-blue-300",
    badge: null,
  },
  {
    id: "llc",
    dbKey: "LLC",
    title: "Limited Liability (LTD)",
    description: "A separate legal entity from its owners. Protects personal assets, allows you to issue shares, and bid for contracts.",
    estimatedTime: "24 - 72 Working Hours",
    idealFor: ["Startups & Tech Agencies", "Businesses seeking investors", "Contract Bidding"],
    icon: Buildings,
    href: "/dashboard/register/llc",
    color: "text-[#ff3f7a]",
    bg: "bg-[#ff3f7a]/10",
    border: "border-[#ff3f7a]/30 hover:border-[#ff3f7a]/60 ring-1 ring-[#ff3f7a]/5 shadow-sm",
    badge: "Most Popular",
  },
  {
    id: "ngo",
    dbKey: "NGO",
    title: "Incorporated Trustees",
    description: "Strictly for non-profit organizations. Registers a board of trustees to manage assets, operations, and charitable goals.",
    estimatedTime: "Name Approval: < 1 Week",
    secondaryTime: "Final Approval: 30+ Days",
    idealFor: ["Churches & Mosques", "Foundations & Charities", "Clubs & Associations"],
    icon: HandHeart,
    href: "/dashboard/register/ngo",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-slate-200 hover:border-emerald-300",
    badge: "Mandatory 28-Day Pub.",
  }
];

export default async function NewRegistrationPage() {
  const pricingData = await prisma.servicePricing.findMany();
  
  const priceMap = pricingData.reduce((acc, item) => {
    acc[item.serviceKey] = Number(item.price);
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pb-12 antialiased animate-in fade-in duration-500">
      
      {/* COMPACT HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors w-fit"
        >
          <CaretLeft className="h-4 w-4" weight="bold" />
          Back to Dashboard
        </Link>
        
        <div className="text-left md:text-right">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            What would you like to register?
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Select the entity type below. We've simplified the legal jargon.
          </p>
        </div>
      </div>

      {/* Subtle Mobile Scroll Prompt (Takes almost no space) */}
      <div className="md:hidden flex justify-center mb-6 text-slate-300 animate-bounce">
        <CaretDown className="h-5 w-5" weight="bold" />
      </div>

      {/* Registration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {REGISTRATION_TYPES.map((type) => {
          const livePrice = priceMap[type.dbKey];
          const formattedPrice = livePrice ? `₦${livePrice.toLocaleString()}` : "Pricing via Admin";

          return (
            <Link 
              key={type.id} 
              href={type.href}
              className={`
                relative flex flex-col h-full bg-white p-6 sm:p-8 rounded-3xl border transition-all duration-300 
                hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2
                group ${type.border}
              `}
            >
              {type.badge && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center z-10">
                  <span className={`text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md ${type.id === 'ngo' ? 'bg-slate-800' : 'bg-[#ff3f7a] shadow-[#ff3f7a]/20'}`}>
                    {type.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className={`h-14 w-14 rounded-2xl ${type.bg} ${type.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  <type.icon className="h-7 w-7" weight="fill" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                  {type.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed min-h-[60px] font-medium">
                  {type.description}
                </p>
              </div>

              <div className="flex flex-col gap-2 py-4 mb-2 border-y border-slate-100">
                 <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Wallet className="h-4 w-4 text-slate-400" weight="fill" />
                    {formattedPrice}
                 </div>
                 
                 <div className="flex items-start gap-2 text-xs font-bold text-slate-600">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" weight="fill" />
                    <div className="flex flex-col">
                      <span>{type.estimatedTime}</span>
                      {type.secondaryTime && (
                        <span 
                          className="text-slate-400 font-medium mt-0.5 flex items-center gap-1"
                          title="Requires a 28-day public newspaper publication before final approval."
                        >
                           {type.secondaryTime}
                           <Info className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                 </div>
              </div>

              <div className="mt-auto pt-4 flex-1 flex flex-col">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Perfect for:
                </p>
                <ul className="space-y-3 mb-6 flex-1">
                  {type.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-slate-700 font-bold">
                      <CheckCircle className={`h-5 w-5 shrink-0 ${type.color}`} weight="fill" />
                      <span className="leading-snug pt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className={`
                  w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all
                  ${type.id === 'llc' 
                    ? 'bg-[#ff3f7a] text-white shadow-lg shadow-[#ff3f7a]/25 group-hover:bg-[#e02b62] group-hover:shadow-[#ff3f7a]/40' 
                    : 'bg-slate-900 text-white shadow-md group-hover:bg-slate-800'
                  }
                `}>
                  Start Application
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" weight="bold" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
