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
  IdentificationCard,
  UserCircle,
  FileText,
  Briefcase,
  Scales,
  FilePdf,
  ArrowSquareOut
} from "@phosphor-icons/react/dist/ssr";
import { CAMA_ARTICLES_DEFAULT } from "@/lib/cama-articles";

// --- HELPERS ---
const FALLBACK_CAMA_ARTICLES = [
  "The Company is a private company and accordingly, the right to transfer shares is restricted.",
  "The number of members of the Company is limited to 50.",
  "Any invitation to the public to subscribe for any shares or debentures of the Company is prohibited.",
  "The Directors may exercise all the powers of the Company to borrow money.",
  "The business of the Company shall be managed by the Directors who may pay all expenses incurred in promoting and registering the Company."
];

const formatRoles = (roles: string[]) => {
  if (!roles || roles.length === 0) return "OFFICER";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return `${roles.slice(0, -1).join(', ')} & ${roles[roles.length - 1]}`;
};

const getUploadLabel = (key: string) => {
  if (key === 'witnessSignatureUrl') return 'Witness Signature';
  if (key === 'declarantSignatureUrl') return 'Declarant Signature';
  if (key === 'reasonRestrictionUrl') return 'Address Restriction Reason';
  if (key === 'otherDocumentsUrl') return 'Additional Document';
  if (key === 'ninUrl') return 'NIN Document';
  if (key === 'passportUrl') return 'Passport Photograph';
  if (key === 'signatureUrl') return 'Signature';
  if (key === 'idDocumentUrl') return 'ID Document';
  return 'Uploaded Document';
};

const formatFlatAddress = (obj: any) => {
  if (!obj) return null;
  if (typeof obj === 'string') return obj; 
  if (obj.address && obj.address.state) {
    const parts = [obj.address.houseNo || obj.address.buildingNo, obj.address.street, obj.address.city, obj.address.lga, obj.address.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  }
  const parts = [obj.houseNo || obj.buildingNo, obj.street, obj.city, obj.lga, obj.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
};

// Extremely resilient JSON parser to handle Prisma JSON fields
const parseJson = (val: any, fallback: any) => {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

const SummaryItem = ({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) => (
  <div className={`flex flex-col p-3 rounded-xl border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-secondary/50 border-border'}`}>
    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
    <span className={`font-bold text-sm break-words ${highlight ? 'text-primary' : 'text-foreground'}`}>{value || "-"}</span>
  </div>
);

// --- FETCHING LOGIC ---
async function getRegistrationData(id: string) {
  let type = "BUSINESS_NAME";
  
  let reg: any = await prisma.businessRegistration.findUnique({ 
    where: { id },
    include: { proprietors: true } 
  });
  
  if (!reg) {
    reg = await prisma.llcRegistration.findUnique({ 
      where: { id },
      include: { officers: true }
    });
    type = "LLC";
  }
  
  if (!reg) return null;
  return { ...reg, _appType: type };
}

export default async function ViewRegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbReg = await getRegistrationData(id);

  if (!dbReg) notFound();

  const isLLC = dbReg._appType === "LLC";
  const MainIcon = isLLC ? Buildings : Storefront;
  
  const reg = {
    ...dbReg,
    ...(parseJson(dbReg.data, {})),
    ...(parseJson(dbReg.formData, {}))
  };

  // --- AGGRESSIVE DATA EXTRACTION ---
  
  // LLC Data
  const officers = parseJson(reg.officers || reg.personnel, []);
  
  // FIXED: Explicitly parse shareCapital first to extract nested arrays
  const shareCapitalData = parseJson(reg.shareCapital, {});
  const totalCapital = reg.totalShareCapital || shareCapitalData.totalIssuedCapital || 0;
  const rawShares = parseJson(reg.shareClasses, null) || shareCapitalData.shareClasses;
  const shareClassesArray = Array.isArray(rawShares) ? rawShares : (rawShares?.shareClasses || []);

  const memoObjects = parseJson(reg.memorandumObjects, []);
  const customArticles = parseJson(reg.customArticles, []);
  const declarant = parseJson(reg.declarantDetails || reg.declarant, {});
  const witness = parseJson(reg.witnessDetails || reg.witness, {});

  // Business Name Data
  const proprietors = parseJson(reg.proprietors || reg.personnel, []);
  const companyInfo = parseJson(reg.companyInfo, {});
  const draft = parseJson(reg.draft, {});

  // Normalized Display Variables
  const proposedName1 = reg.proposedName1 || reg.proposedName || draft.proposedName || companyInfo.proposedName1;
  const proposedName2 = reg.proposedName2 || reg.altName1 || draft.altName1;
  const proposedName3 = reg.proposedName3 || reg.altName2 || draft.altName2;
  const email = reg.email || reg.companyEmail || companyInfo.email;
  
  const natureOfBusiness = reg.natureOfBusiness || reg.principalActivity || draft.specificNature;
  const businessDesc = reg.businessDesc || reg.description || draft.specificNature || companyInfo.specificNature;
  const commencementDate = reg.commencementDate || companyInfo.commencementDate;
  
  const address = formatFlatAddress(reg.address || reg.registeredAddress || companyInfo.address || companyInfo);
  const headOffice = formatFlatAddress(reg.headOfficeAddress);

  const activeArticles = reg.useDefaultArticles 
    ? (CAMA_ARTICLES_DEFAULT && CAMA_ARTICLES_DEFAULT.length > 0 ? CAMA_ARTICLES_DEFAULT : FALLBACK_CAMA_ARTICLES) 
    : customArticles;

  const llcUploads = isLLC ? {
    ...(reg.witnessSignatureUrl && { 'witnessSignatureUrl': reg.witnessSignatureUrl }),
    ...(reg.declarantSignatureUrl && { 'declarantSignatureUrl': reg.declarantSignatureUrl }),
    ...(reg.reasonRestrictionUrl && { 'reasonRestrictionUrl': reg.reasonRestrictionUrl }),
    ...(reg.otherDocumentsUrl && { 'otherDocumentsUrl': reg.otherDocumentsUrl }),
  } : {};

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
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
                {proposedName1 || "Unnamed Application"}
              </h1>
            </div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              REF: {reg.id.split('-')[0]} • {isLLC ? 'Company (LLC)' : 'Business Name'}
            </p>
          </div>
        </div>

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

      <div className="space-y-8">
        
        {/* ================= SECTION 1: ENTITY INFORMATION ================= */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <h2 className="bg-secondary/50 border-b border-border px-6 py-4 text-sm font-black text-foreground flex items-center gap-2">
            <IdentificationCard className="h-5 w-5 text-primary" weight="duotone" /> Entity Information
          </h2>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryItem label="Proposed Name 1" value={proposedName1} highlight />
            <SummaryItem label="Alternative Name 1" value={proposedName2} />
            <SummaryItem label="Alternative Name 2" value={proposedName3} />
            
            <SummaryItem label="Contact Email" value={email} />
            
            {!isLLC && (
              <>
                <SummaryItem label="Commencement Date" value={commencementDate} />
                <SummaryItem label="Nature of Business" value={natureOfBusiness} />
                <SummaryItem label="Category" value={reg.category} />
                <SummaryItem label="Entity Type" value={reg.entityType} />
                <div className="md:col-span-2 lg:col-span-3"><SummaryItem label="Registered Address" value={address} /></div>
              </>
            )}

            {isLLC && (
              <>
                <SummaryItem label="Principal Activity" value={natureOfBusiness} />
                <SummaryItem label="Specific Activity" value={reg.specificActivity} />
                <SummaryItem label="Company Type" value={reg.companyType || shareCapitalData.companyType} />
                <div className="md:col-span-2 lg:col-span-3 mt-2"><SummaryItem label="Business Description" value={businessDesc} /></div>
                <div className="md:col-span-2 lg:col-span-3"><SummaryItem label="Registered Address" value={address} /></div>
                <div className="md:col-span-2 lg:col-span-3"><SummaryItem label="Head Office Address" value={headOffice || "Same as Registered Address"} /></div>
              </>
            )}
          </div>
        </div>

        {/* ================= SECTION 2: LLC SPECIFIC (CAPITAL & ARTICLES) ================= */}
        {isLLC && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <h2 className="bg-secondary/50 border-b border-border px-6 py-4 text-sm font-black text-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" weight="duotone" /> Capital, Objects & Articles
            </h2>
            <div className="p-6 space-y-6">
              
              <div>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Total Issued Capital & Share Classes</p>
                <div className="p-4 bg-secondary/50 border border-border rounded-xl">
                  <p className="text-2xl font-black text-foreground mb-4">₦{Number(totalCapital).toLocaleString()}</p>
                  
                  {shareClassesArray.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {shareClassesArray.map((cls: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-background border border-border px-4 py-3 rounded-lg shadow-sm">
                          <span className="font-bold text-foreground">{cls.type || cls.class || 'ORDINARY'}</span>
                          <span className="font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">{Number(cls.units || 0).toLocaleString()} Units</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">No share classes defined.</span>
                  )}
                </div>
              </div>

              <div>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Objects of Memorandum</p>
                 <div className="p-5 bg-secondary/50 border border-border rounded-xl">
                    <ul className="list-disc pl-4 space-y-2 text-sm font-bold text-foreground">
                      {memoObjects.length > 0 ? (
                        memoObjects.map((obj: string, i: number) => <li key={i}>{obj}</li>)
                      ) : (
                        <li className="text-muted-foreground italic list-none -ml-4">Using default objects / Not provided</li>
                      )}
                    </ul>
                 </div>
              </div>

              <div>
                 <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Articles of Association</p>
                 <div className="p-5 bg-secondary/50 border border-border rounded-xl">
                    {reg.useDefaultArticles && (
                      <div className="mb-4 bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20 flex items-center gap-2">
                        <CheckCircle weight="fill" className="text-emerald-500" /> 
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Standard CAMA Articles Adopted</span>
                      </div>
                    )}
                    <ul className="list-decimal pl-4 space-y-3 text-sm font-medium text-foreground">
                      {activeArticles.length > 0 ? (
                        activeArticles.map((article: any, i: number) => (
                          <li key={i} className="pl-1">
                            {typeof article === 'string' ? article : article.text || article.content || article.article}
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground italic list-none -ml-4">No articles provided</li>
                      )}
                    </ul>
                 </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= SECTION 3: PERSONNEL (OFFICERS / PROPRIETORS) ================= */}
        <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
          <h2 className="bg-secondary/50 border-b border-border px-6 py-4 text-sm font-black text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" weight="duotone" /> 
              {isLLC ? "Company Officers" : "Proprietors"}
            </div>
            <span className="text-[10px] bg-foreground text-background px-2.5 py-1 rounded-md">
              {(isLLC ? officers : proprietors).length} Total
            </span>
          </h2>
          
          <div className="p-6 space-y-6">
            {(isLLC ? officers : proprietors).map((person: any, idx: number) => {
              const isPsc = person.roles?.includes("PSC");
              const pCode = person.phoneCode || "+234";

              const personDocs = isLLC ? {
                ...(person.idDocumentUrl && { 'idDocumentUrl': person.idDocumentUrl }),
                ...(person.signatureUrl && { 'signatureUrl': person.signatureUrl }),
              } : {
                ...(person.ninUrl && { 'ninUrl': person.ninUrl }),
                ...(person.passportUrl && { 'passportUrl': person.passportUrl }),
                ...(person.signatureUrl && { 'signatureUrl': person.signatureUrl }),
              };

              return (
                <div key={idx} className="border border-border rounded-2xl overflow-hidden">
                  <div className="bg-secondary/50 border-b border-border px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-black text-foreground">
                      {idx + 1}. {person.firstName} {person.surname} {person.otherName || ''}
                    </h4>
                    {isLLC && (
                      <div className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest bg-primary/10 text-primary self-start sm:self-auto">
                        {formatRoles(person.roles)}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-background">
                    <SummaryItem label="First Name" value={person.firstName} />
                    <SummaryItem label="Surname" value={person.surname} />
                    <SummaryItem label="Email" value={person.email} />
                    <SummaryItem label="Phone" value={`${pCode} ${person.phone}`} />
                    <SummaryItem label="Date of Birth" value={person.dob} />
                    <SummaryItem label="Gender" value={person.gender} />
                    
                    {isLLC && (
                      <>
                        <SummaryItem label="Nationality" value={person.nationality} />
                        <SummaryItem label="Occupation" value={person.occupation} />
                        <SummaryItem label="ID Type" value={person.idType || "N/A"} />
                        <SummaryItem label="ID Number" value={person.idNumber || person.nin || "N/A"} />
                      </>
                    )}

                    <div className="md:col-span-2 lg:col-span-3 mt-2">
                      <SummaryItem 
                        label="Residential Address" 
                        value={isLLC ? formatFlatAddress(parseJson(person.residentialAddress, {})) : [person.streetNo, person.city, person.lga, person.state].filter(Boolean).join(", ")} 
                      />
                    </div>
                    
                    <div className="md:col-span-2 lg:col-span-3 mt-2">
                      <SummaryItem 
                        label="Service Address" 
                        value={isLLC ? formatFlatAddress(parseJson(person.serviceAddress, {})) : person.serviceAddress} 
                      />
                    </div>

                    {isLLC && person.roles?.includes("SHAREHOLDER") && (
                       <div className="md:col-span-2 lg:col-span-3">
                         <SummaryItem highlight label="Shares Allotted" value={person.sharesAllotted ? `${Number(person.sharesAllotted).toLocaleString()} Units` : 'See Breakdown'} />
                       </div>
                    )}

                    {isLLC && isPsc && person.pscDetails && (
                      <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                        <div className="sm:col-span-2 border-b border-amber-500/20 pb-2 mb-2">
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">PSC Declarations</p>
                        </div>
                        <SummaryItem label="Politically Exposed Person?" value={parseJson(person.pscDetails, {}).isPep} />
                        <SummaryItem label="Has Affiliations?" value={parseJson(person.pscDetails, {}).hasAffiliation} />
                        <SummaryItem label="Direct Shares Held" value={parseJson(person.pscDetails, {}).holdsSharesDirect} />
                        <SummaryItem label="Direct Voting Rights" value={parseJson(person.pscDetails, {}).holdsVotingDirect} />
                      </div>
                    )}

                    {Object.keys(personDocs).length > 0 && (
                       <div className="md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-border">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Uploaded Documents</p>
                          <div className="flex flex-wrap gap-4">
                            {Object.entries(personDocs).map(([docKey, url]) => (
                              url ? (
                                <a key={docKey} href={url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-primary/10 hover:text-primary transition-colors border border-border rounded-lg text-sm font-bold text-foreground group">
                                  <FilePdf className="h-4 w-4 text-muted-foreground group-hover:text-primary" weight="fill" />
                                  <span className="capitalize">{getUploadLabel(docKey)}</span>
                                  <ArrowSquareOut className="h-3 w-3 opacity-50" />
                                </a>
                              ) : null
                            ))}
                          </div>
                       </div>
                    )}

                  </div>
                </div>
              );
            })}
            
            {(isLLC ? officers : proprietors).length === 0 && (
              <p className="text-sm font-bold text-muted-foreground italic p-6 text-center border-2 border-dashed border-border rounded-xl">No personnel added.</p>
            )}
          </div>
        </div>

        {/* ================= SECTION 4: LLC STATUTORY (DECLARANT / WITNESS) ================= */}
        {isLLC && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <h2 className="bg-secondary/50 border-b border-border px-6 py-4 text-sm font-black text-foreground flex items-center gap-2">
              <Scales className="h-5 w-5 text-primary" weight="duotone" /> Statutory Details
            </h2>
            <div className="p-6 space-y-8">
              
              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2">Witness to Articles</h3>
                {witness.firstName ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SummaryItem label="Name" value={`${witness.firstName} ${witness.surname}`} />
                    <SummaryItem label="Phone" value={witness.phone} />
                    <SummaryItem label="Email" value={witness.email} />
                    <SummaryItem label="Occupation" value={witness.occupation} />
                    <div className="md:col-span-2"><SummaryItem label="Address" value={formatFlatAddress(witness)} /></div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-border">Using Default Articles (No Witness Required)</p>
                )}
              </div>

              <div>
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2">Deponent / Declarant</h3>
                {declarant.firstName ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <SummaryItem label="Name" value={`${declarant.firstName} ${declarant.surname}`} />
                    <SummaryItem label="Accreditation Number" value={declarant.accreditationNumber || 'N/A'} />
                    <div className="md:col-span-2 lg:col-span-3"><SummaryItem label="Address" value={formatFlatAddress(declarant.residentialAddress) || formatFlatAddress(declarant)} /></div>
                  </div>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground bg-secondary/50 p-4 rounded-xl border border-border">Not Provided</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ================= SECTION 5: LLC UPLOADS ================= */}
        {isLLC && (
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <h2 className="bg-secondary/50 border-b border-border px-6 py-4 text-sm font-black text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" weight="duotone" /> Uploaded Documents
            </h2>
            <div className="p-6">
              {Object.keys(llcUploads).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(llcUploads).map(([key, url]) => (
                    <a 
                      key={key} 
                      href={url as string} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex flex-col p-4 rounded-xl border border-border bg-background shadow-sm hover:border-primary transition-colors group"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <CheckCircle weight="fill" className="text-emerald-500 h-6 w-6 shrink-0" />
                        <span className="text-xs font-black text-foreground leading-snug">{getUploadLabel(key)}</span>
                      </div>
                      <div className="mt-auto w-full text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 py-2.5 rounded-lg text-center flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Document <ArrowSquareOut weight="bold" />
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center gap-2 text-amber-600 bg-amber-500/10 p-6 rounded-xl text-sm border border-amber-500/20 font-bold">
                  <WarningCircle weight="fill" className="h-6 w-6" />
                  No documents have been uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
