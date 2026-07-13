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
  CaretDown,
  Sparkle,
  Wrench
} from "@phosphor-icons/react/dist/ssr";

// FORCE NEXT.JS TO NEVER CACHE THIS PAGE (Always fetch live toggles)
export const dynamic = "force-dynamic";
export const revalidate = 0;

const REGISTRATION_TYPES = [
  {
    id: "business-name",
    dbKey: "BUSINESS_NAME",
    title: "Business Name",
    description: "The fastest and most affordable way to register a small business. Register as a sole proprietor or as a partnership.",
    estimatedTime: "30 Mins - 1 Hour",
    idealFor: ["Freelancers & Artisans", "Sole Proprietors", "Partnerships"],
    icon: Storefront,
    href: "/dashboard/cac/register/business-name",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    border: "border-border hover:border-blue-300 dark:hover:border-blue-700/50",
    badge: null,
    active: true,
  },
  {
    id: "llc",
    dbKey: "LLC",
    title: "Limited Liability (LTD)",
    description: "A separate legal entity from its owners. Protects personal assets, allows you to issue shares, and bid for contracts.",
    estimatedTime: "24 - 72 Working Hours",
    idealFor: ["Startups & Tech Agencies", "Businesses seeking investors", "Contract Bidding"],
    icon: Buildings,
    href: "/dashboard/cac/register/llc",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30 hover:border-primary/60 ring-1 ring-primary/5 shadow-sm",
    badge: "Most Popular",
    active: true,
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
    href: "#",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    border: "border-border",
    badge: "Mandatory 28-Day Pub.",
    active: false, // Hardcoded false for "Coming Soon"
  }
];

export default async function NewRegistrationPage() {
  // Fetch pricing directly from MDS ServicePricing (NO globalSettings)
  const pricingData = await prisma.servicePricing.findMany();
  
  const priceMap = pricingData.reduce((acc, item) => {
    acc[item.serviceKey] = {
      price: Number(item.price),
      isActive: item.isActive,
      maintenanceMsg: item.maintenanceMsg
    };
    return acc;
  }, {} as Record<string, { price: number; isActive: boolean; maintenanceMsg: string | null }>);

  return (
    <div className="max-w-7xl mx-auto pb-12 antialiased animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-2">
        <Link 
          href="/dashboard/cac/new-incorporation" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg"
        >
          <CaretLeft className="h-4 w-4" weight="bold" />
          Back to Registrations
        </Link>
        
        <div className="text-left md:text-right">
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            What would you like to register?
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Select the entity type below. We've simplified the legal jargon.
          </p>
        </div>
      </div>

      <div className="md:hidden flex justify-center mb-6 text-muted-foreground animate-bounce">
        <CaretDown className="h-5 w-5" weight="bold" />
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {REGISTRATION_TYPES.map((type) => {
          const serviceInfo = priceMap[type.dbKey];
          const livePrice = serviceInfo?.price;
          const formattedPrice = livePrice ? `₦${livePrice.toLocaleString()}` : "Pricing via Admin";

          // Calculate Interaction States
          let isClickable = true;
          let overlayType: 'coming-soon' | 'maintenance' | null = null;
          let overlayMessage = "";

          if (!type.active) {
            // Priority 1: Hardcoded "Coming Soon" (Incorporated Trustees)
            isClickable = false;
            overlayType = 'coming-soon';
            overlayMessage = "Coming Soon";
          } else if (serviceInfo && serviceInfo.isActive === false) {
            // Priority 2: Admin toggled it off in MDS
            isClickable = false;
            overlayType = 'maintenance';
            overlayMessage = serviceInfo.maintenanceMsg || "Temporarily Unavailable";
          }

          const cardClasses = `
            relative flex flex-col h-full bg-card p-6 sm:p-8 rounded-3xl border transition-all duration-300 
            ${isClickable ? 'hover:-translate-y-1.5 hover:shadow-xl active:scale-[0.98]' : 'grayscale opacity-75 cursor-not-allowed'}
            group ${type.border}
          `;

          const CardInnerContent = (
            <>
              {/* MAINTENANCE / COMING SOON OVERLAY */}
              {overlayType && (
                 <div className="absolute inset-0 bg-background/20 backdrop-blur-[2px] z-20 rounded-3xl flex items-center justify-center p-4 text-center">
                    <span className="bg-secondary text-foreground font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-full border border-border shadow-xl flex items-center gap-2 max-w-[90%]">
                      {overlayType === 'coming-soon' ? (
                        <Sparkle weight="fill" className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <Wrench weight="fill" className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className="truncate">{overlayMessage}</span>
                    </span>
                 </div>
              )}

              {type.badge && isClickable && (
                <div className="absolute -top-3.5 inset-x-0 flex justify-center z-10">
                  <span className={`text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md ${type.id === 'ngo' ? 'bg-slate-800' : 'bg-primary shadow-primary/20'}`}>
                    {type.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className={`h-14 w-14 rounded-2xl ${type.bg} ${type.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                  <type.icon className="h-7 w-7" weight="fill" />
                </div>
                <h2 className="text-xl font-black text-foreground tracking-tight mb-2">
                  {type.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed min-h-[60px] font-medium">
                  {type.description}
                </p>
              </div>

              <div className="flex flex-col gap-2 py-4 mb-2 border-y border-border">
                 <div className="flex items-center gap-2 text-sm font-black text-foreground">
                    <Wallet className="h-4 w-4 text-muted-foreground" weight="fill" />
                    {formattedPrice}
                 </div>
                 
                 <div className="flex items-start gap-2 text-xs font-bold text-muted-foreground">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" weight="fill" />
                    <div className="flex flex-col">
                      <span>{type.estimatedTime}</span>
                      {type.secondaryTime && (
                        <span 
                          className="text-muted-foreground/70 font-medium mt-0.5 flex items-center gap-1"
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
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Perfect for:
                </p>
                <ul className="space-y-3 mb-6 flex-1">
                  {type.idealFor.map((item, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm text-foreground font-bold">
                      <CheckCircle className={`h-5 w-5 shrink-0 ${type.color}`} weight="fill" />
                      <span className="leading-snug pt-0.5">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className={`
                  w-full py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all
                  ${!isClickable ? 'bg-secondary text-muted-foreground' : 
                    type.id === 'llc' 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 group-hover:opacity-90' 
                    : 'bg-foreground text-background shadow-md group-hover:opacity-90'
                  }
                `}>
                  {isClickable ? "Start Application" : (overlayType === 'coming-soon' ? "Coming Soon" : "Temporarily Disabled")}
                  {isClickable && <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" weight="bold" />}
                </div>
              </div>
            </>
          );

          if (isClickable) {
            return (
              <Link key={type.id} href={type.href} className={cardClasses}>
                {CardInnerContent}
              </Link>
            );
          } else {
            return (
              <div key={type.id} className={cardClasses}>
                {CardInnerContent}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
