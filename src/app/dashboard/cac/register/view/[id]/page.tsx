import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { 
  ArrowLeft, 
  Storefront, 
  Buildings, 
  CheckCircle, 
  Clock, 
  WarningCircle, 
  MapPin, 
  IdentificationCard 
} from "@phosphor-icons/react/dist/ssr";

// Try Business Names first, then LLCs
async function getRegistrationData(id: string) {
  let type = "BUSINESS_NAME";
  let reg: any = await prisma.businessRegistration.findUnique({ where: { id } });
  
  if (!reg) {
    reg = await prisma.llcRegistration.findUnique({ where: { id } });
    type = "LLC";
  }
  
  if (!reg) return null;
  return { ...reg, _appType: type };
}

// FIXED: In Next.js 15+, params is a Promise and must be awaited!
export default async function ViewRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  // Await the params before trying to extract the ID
  const { id } = await params;
  
  const reg = await getRegistrationData(id);

  if (!reg) notFound();

  const isLLC = reg._appType === "LLC";
  const MainIcon = isLLC ? Buildings : Storefront;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-border pb-6">
        <div className="space-y-4">
          <Link 
            href="/dashboard/cac/new-incorporation"
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors w-fit bg-secondary/50 hover:bg-secondary px-3 py-1.5 rounded-lg"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            Back to Registrations
          </Link>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <MainIcon weight="duotone" className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-black text-foreground">
                {reg.proposedName1 || reg.proposedName || "Unnamed Application"}
              </h1>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              REF: {reg.id.split('-')[0]} • {isLLC ? 'Company (LLC)' : 'Business Name'}
            </p>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 font-black text-sm uppercase tracking-wider
          ${reg.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}
          ${reg.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : ''}
          ${reg.status === 'QUERIED' ? 'bg-red-500/10 text-red-600 border-red-500/20' : ''}
          ${reg.status === 'UNSUBMITTED' ? 'bg-secondary text-muted-foreground border-border' : ''}
        `}>
          {reg.status === 'APPROVED' && <CheckCircle weight="fill" className="h-5 w-5" />}
          {reg.status === 'PENDING' && <Clock weight="fill" className="h-5 w-5" />}
          {reg.status === 'QUERIED' && <WarningCircle weight="fill" className="h-5 w-5" />}
          {reg.status}
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Basic Details */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <IdentificationCard className="h-5 w-5 text-primary" weight="duotone" /> 
              Entity Information
            </h2>
            
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Proposed Name 1</p>
                  <p className="font-semibold text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                    {reg.proposedName1 || reg.proposedName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Proposed Name 2</p>
                  <p className="font-semibold text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                    {reg.proposedName2 || "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nature of Business</p>
                <p className="font-semibold text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                  {reg.natureOfBusiness || reg.businessDesc || "N/A"}
                </p>
              </div>

              {isLLC && reg.shareCapital && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Share Capital</p>
                  <p className="font-semibold text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                    ₦{Number(reg.shareCapital).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" weight="duotone" /> 
              Registered Address
            </h2>
            <div className="bg-secondary/50 p-4 rounded-xl border border-border">
              <p className="font-semibold text-foreground leading-relaxed">
                {reg.address || "No address provided."}
                {reg.city && `, ${reg.city}`}
                {reg.state && `, ${reg.state}`}
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Personnel */}
        <div className="space-y-6">
          
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
             <h2 className="text-lg font-black text-foreground mb-4">
              {isLLC ? "Directors & Shareholders" : "Proprietors"}
             </h2>
             
             {reg.personnel || reg.proprietors || reg.directors ? (
               <div className="space-y-3">
                 {Array.isArray(reg.personnel || reg.proprietors || reg.directors) ? 
                   (reg.personnel || reg.proprietors || reg.directors).map((person: any, i: number) => (
                     <div key={i} className="p-3 bg-secondary/50 rounded-xl border border-border">
                       <p className="font-bold text-foreground text-sm">{person.name || person.firstName + " " + person.lastName}</p>
                       <p className="text-xs text-muted-foreground mt-0.5">{person.email || person.phone}</p>
                     </div>
                   ))
                   : 
                   <div className="text-sm text-muted-foreground italic">Personnel data stored securely.</div>
                 }
               </div>
             ) : (
               <div className="p-4 bg-secondary/50 rounded-xl border border-border text-center">
                 <p className="text-sm font-semibold text-muted-foreground">No personnel added yet.</p>
               </div>
             )}
          </div>

        </div>

      </div>
    </div>
  );
}
