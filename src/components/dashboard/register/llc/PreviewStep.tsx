"use client";

import { useState, useEffect } from "react";
import { 
  Buildings, 
  Users, 
  Bank, 
  FilePdf,
  WarningCircle,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  MapPin,
  IdentificationCard,
  EnvelopeSimple,
  Phone,
  X,
  FileText
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Format currency for Naira
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Helper for officer roles
const formatRoles = (roles: string[]) => {
  if (!roles || roles.length === 0) return "OFFICER";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return `${roles.slice(0, -1).join(', ')} & ${roles[roles.length - 1]}`;
};

// Map upload keys to human-readable labels
const getUploadLabel = (key: string) => {
  if (key === 'witness-sig') return 'Witness Signature';
  if (key === 'deponent-sig') return 'Declarant Signature';
  if (key === 'reason-restriction') return 'Address Restriction Reason';
  if (key === 'others') return 'Additional Document';
  if (key.startsWith('id-')) return 'Means of Identification';
  if (key.startsWith('sig-')) return 'Officer Signature';
  return 'Uploaded Document';
};

// Reusable Detail Item
const DetailItem = ({ label, value, colSpan = false, highlight = false }: { label: string, value: any, colSpan?: boolean, highlight?: boolean }) => (
  <div className={`${colSpan ? "sm:col-span-2 md:col-span-3" : ""} ${highlight ? "bg-indigo-50 p-3 rounded-lg border border-indigo-100" : ""}`}>
    <span className={`block mb-1 text-[10px] font-bold uppercase tracking-widest ${highlight ? "text-indigo-600" : "text-slate-500"}`}>{label}</span>
    <span className={`text-sm ${highlight ? "font-black text-indigo-900" : "font-black text-slate-900"}`}>{value || <span className="text-slate-300 italic font-medium">Not provided</span>}</span>
  </div>
);

// Reusable Address Formatter (Updated for new state/lga/city/street structure)
const formatAddress = (addr: any) => {
  if (!addr || !addr.state) return null;
  const parts = [addr.houseNo, addr.street, addr.city, addr.lga, addr.state].filter(Boolean);
  return parts.join(', ');
};

export default function PreviewStep({ data, onComplete, onBack, isSubmitting }: any) {
  const [pricing, setPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  
  // Modal State for Documents
  const [previewDoc, setPreviewDoc] = useState<{ url: string, label: string } | null>(null);

  // ==========================================
  // EXACT PRISMA & STATE MAPPING
  // ==========================================
  
  // 1. Company Details
  const proposedName1 = data.proposedName || data.companyDetails?.proposedName || data.companyDetails?.proposedName1;
  const proposedName2 = data.altName1 || data.companyDetails?.altName1 || data.companyDetails?.proposedName2;
  const proposedName3 = data.altName2 || data.companyDetails?.altName2 || data.companyDetails?.proposedName3;
  const email = data.email || data.companyDetails?.email;
  const principalActivity = data.principalActivity || data.companyDetails?.principalActivity;
  const specificActivity = data.specificActivity || data.companyDetails?.specificActivity;
  const description = data.description || data.companyDetails?.description;
  const registeredAddress = data.registeredAddress || data.companyDetails?.registeredAddress || data.companyDetails?.address || {};
  const headOfficeAddress = data.headOfficeAddress || data.companyDetails?.headOfficeAddress || {};

  // 2. Share Capital
  const totalShares = Number(data.totalShareCapital || data.shareCapital?.totalIssuedCapital || 0);
  const companyType = data.companyType || data.shareCapital?.companyType || data.companyDetails?.companyType || 'ENTITY WITH SHARES BELOW FIVE MILLION';
  const rawShareClasses = data.shareClasses || data.shareCapital?.shareClasses;
  
  // Handle new nested shareClasses JSON structure from backend update
  const shareClassesArray = Array.isArray(rawShareClasses) ? rawShareClasses : (rawShareClasses?.shareClasses || []);

  // 3. Officers & Compliance
  const officers = data.officers || [];
  const uploads = data.uploads || {};
  const witness = data.witnessDetails || {};
  const declarant = data.declarantDetails || {};
  const memoObjects = data.memorandumObjects || [];

  const fetchPricing = async () => {
    setIsLoadingPricing(true);
    setPricingError(null);
    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'llc',
          shares: totalShares,
          companyType: companyType
        })
      });

      if (!res.ok) throw new Error("Failed to fetch pricing");
      const apiPricing = await res.json();
      setPricing(apiPricing);
    } catch (error) {
      console.error(error);
      setPricingError("Unable to load pricing details. Please try again.");
    } finally {
      setIsLoadingPricing(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalShares, companyType]);

  const handleProceedToPayment = () => {
    if (!pricing) return;
    onComplete({
      ...data,
      calculatedPricing: pricing
    });
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500 bg-slate-50/50">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-6 mb-2">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
           <ShieldCheck className="h-6 w-6" weight="fill" />
        </div>
        <div>
           <h2 className="text-xl font-black text-slate-900">Application Review</h2>
           <p className="text-sm font-medium text-slate-500 mt-1">Please review all details before proceeding to payment and submission.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Data Preview */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SECTION 1: Company Information */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
              <Buildings weight="fill" className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Company Details</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <DetailItem label="Proposed Name 1" value={proposedName1} colSpan highlight />
              <DetailItem label="Alternative Name 1" value={proposedName2} />
              <DetailItem label="Alternative Name 2" value={proposedName3} />
              <DetailItem label="Company Email" value={email} />
              
              <div className="col-span-full border-t border-slate-100 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem label="Principal Activity" value={principalActivity} />
                <DetailItem label="Specific Activity" value={specificActivity} />
                <DetailItem label="Business Description" value={description} colSpan />
              </div>

              <div className="col-span-full border-t border-slate-100 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin weight="fill" className="text-indigo-400" /> Registered Address
                  </span>
                  <p className="font-black text-slate-900 text-sm leading-relaxed">
                    {formatAddress(registeredAddress) || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin weight="fill" className="text-indigo-400" /> Head Office Address
                  </span>
                  <p className="font-black text-slate-900 text-sm leading-relaxed">
                    {formatAddress(headOfficeAddress) || <span className="italic text-slate-400">Same as Registered Address</span>}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Share Capital & Objects */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
              <Bank weight="fill" className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Capital & Objects</h3>
            </div>
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <DetailItem label="Company Type" value={companyType} />
                 <DetailItem label="Total Issued Capital" value={`₦${totalShares.toLocaleString()}`} highlight />
               </div>

               {/* Share Classes */}
               <div className="border-t border-slate-100 pt-6 mt-2">
                 <span className="text-slate-500 block mb-3 text-[10px] font-bold uppercase tracking-widest">Share Classes</span>
                 {shareClassesArray.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {shareClassesArray.map((cls: any, i: number) => (
                       <div key={i} className="flex justify-between items-center bg-indigo-50 border border-indigo-100 px-4 py-3 rounded-xl text-sm">
                         <span className="font-black text-indigo-900">{cls.type || cls.class || 'ORDINARY'}</span>
                         <div className="text-right">
                            <span className="font-bold text-indigo-700 block">{Number(cls.units || 0).toLocaleString()} Units</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">₦{Number(cls.totalValue || 0).toLocaleString()}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                    <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-4 rounded-xl text-sm border border-slate-200 italic font-medium">
                      No share classes defined.
                    </div>
                 )}
               </div>

               <div className="border-t border-slate-100 pt-6">
                 <span className="text-slate-500 block mb-3 text-[10px] font-bold uppercase tracking-widest">Objects of Memorandum</span>
                 <ul className="list-disc pl-5 space-y-2 text-sm font-black text-slate-800">
                   {memoObjects.length > 0 ? (
                     memoObjects.map((obj: string, i: number) => <li key={i}>{obj}</li>)
                   ) : (
                     <li className="text-slate-400 italic list-none ml-[-1.25rem] font-medium">Using default objects / Not provided</li>
                   )}
                 </ul>
               </div>
            </div>
          </section>

          {/* SECTION 3: Officers */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users weight="fill" className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Company Officers</h3>
              </div>
              <span className="bg-indigo-100 text-indigo-700 font-black text-xs px-3 py-1 rounded-lg">{officers.length} Total</span>
            </div>
            
            <div className="p-6 space-y-4">
              {officers.map((officer: any, idx: number) => {
                const isPsc = officer.roles.includes("PSC");
                const isStandalonePsc = officer.roles.length === 1 && isPsc;

                return (
                  <div key={idx} className={`border rounded-xl p-5 shadow-sm transition-colors ${isStandalonePsc ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 pb-4 border-b border-slate-100 gap-3">
                      <div>
                         <h4 className="font-black text-lg text-slate-900 leading-tight">{officer.firstName} {officer.surname} {officer.otherName || ''}</h4>
                         {isPsc && officer.pscDetails?.isPep && (
                           <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mt-1">Politically Exposed Person (PEP)</span>
                         )}
                      </div>
                      <div className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest self-start sm:self-auto ${isStandalonePsc ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                        {formatRoles(officer.roles)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-4">
                      <div className="flex items-center gap-2.5"><EnvelopeSimple className="text-slate-400 h-4 w-4" weight="bold"/> <span className="text-sm font-black text-slate-700 truncate">{officer.email}</span></div>
                      <div className="flex items-center gap-2.5"><Phone className="text-slate-400 h-4 w-4" weight="bold"/> <span className="text-sm font-black text-slate-700">{officer.phoneCode} {officer.phone}</span></div>
                      
                      <div className="col-span-full border-t border-slate-100 pt-5 mt-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                         <DetailItem label="Date of Birth" value={officer.dob} />
                         <DetailItem label="Gender" value={officer.gender} />
                         <DetailItem label="Nationality" value={officer.nationality} />
                         <DetailItem label="Occupation" value={officer.occupation} />
                      </div>
                      
                      <div className="col-span-full border-t border-slate-100 pt-5 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><IdentificationCard weight="fill" className="text-indigo-400"/> Identification</span>
                          <p className="font-black text-slate-900 text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 inline-block">{officer.idType || 'N/A'}: {officer.idNumber || 'N/A'}</p>
                        </div>
                        {officer.roles.includes("SHAREHOLDER") && (
                          <div>
                            <span className="text-slate-500 block mb-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"><Bank weight="fill" className="text-indigo-400"/> Share Allotment</span>
                            <p className="font-black text-indigo-700 text-sm bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100 inline-block">
                               {officer.sharesAllotted ? officer.sharesAllotted.toLocaleString() + ' Units' : 'See Breakdown'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {officers.length === 0 && <p className="text-sm font-bold text-slate-500 italic p-4 text-center border-2 border-dashed rounded-xl">No officers added.</p>}
            </div>
          </section>

          {/* SECTION 4: Compliance & Uploads */}
          <section className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
              <FileText weight="fill" className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Compliance & Uploads</h3>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                 <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                   <CheckCircle weight="fill" /> Statement of Compliance
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="Declarant Name" value={`${declarant.firstName || ''} ${declarant.surname || ''}`} />
                    <DetailItem label="Accreditation" value={declarant.accreditationNumber || 'N/A'} />
                 </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Uploaded Documents</h4>
                {Object.keys(uploads).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(uploads).map(([key, url]) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-200 transition-colors">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <CheckCircle weight="fill" className="text-emerald-500 h-5 w-5 shrink-0" />
                          <span className="text-xs font-black text-slate-700 truncate tracking-wide">{getUploadLabel(key)}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.preventDefault(); setPreviewDoc({ url: url as string, label: getUploadLabel(key) }); }}
                          className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg shrink-0 ml-2 transition-colors shadow-sm"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-4 rounded-xl text-sm border border-amber-200 font-bold">
                    <WarningCircle weight="fill" className="h-5 w-5" />
                    No documents uploaded.
                  </div>
                )}
              </div>

            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: DB Pricing & Payment */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white sticky top-8 shadow-2xl border border-slate-800">
            <h3 className="text-lg font-black mb-6 border-b border-slate-800 pb-4 flex items-center gap-2">
               <Bank weight="fill" className="text-indigo-400" /> Checkout Summary
            </h3>

            {isLoadingPricing ? (
              <div className="space-y-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                <div className="h-12 bg-slate-800 rounded-xl w-full mt-8"></div>
              </div>
            ) : pricingError ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm font-bold flex items-start gap-2">
                  <WarningCircle weight="fill" className="h-5 w-5 shrink-0 mt-0.5" />
                  {pricingError}
                </div>
                <Button 
                  onClick={fetchPricing}
                  variant="outline"
                  className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800 font-bold rounded-xl h-12"
                >
                  Retry Loading Pricing
                </Button>
              </div>
            ) : pricing ? (
              <div className="space-y-5 text-sm">
                
                {pricing.baseFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">CAC Registration</span>
                    <span className="font-black text-white">{formatCurrency(pricing.baseFee)}</span>
                  </div>
                )}
                
                {Number(pricing.extraSharesFee) > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">Extra Shares Fee</span>
                    <span className="font-black text-white">{formatCurrency(pricing.extraSharesFee)}</span>
                  </div>
                )}

                {pricing.stampDuty !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">Stamp Duty</span>
                    <span className="font-black text-white">{formatCurrency(pricing.stampDuty)}</span>
                  </div>
                )}

                {pricing.serviceFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-5">
                    <span className="font-medium">Service Fee</span>
                    <span className="font-black text-white">{formatCurrency(pricing.serviceFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total</span>
                  <span className="text-3xl font-black text-emerald-400">{formatCurrency(pricing.total)}</span>
                </div>

                {/* Back and Submit Buttons Group */}
                <div className="flex flex-col gap-3 mt-8 pt-4">
                  <Button 
                    onClick={handleProceedToPayment}
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-xl font-black text-base shadow-[0_0_0_4px_rgba(79,70,229,0.2)] transition-all"
                  >
                    {isSubmitting ? 'Processing...' : 'Pay & Submit'}
                    {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" weight="bold" />}
                  </Button>

                  <Button 
                    onClick={onBack}
                    disabled={isSubmitting}
                    variant="ghost"
                    className="w-full text-slate-400 hover:text-white hover:bg-slate-800 h-12 rounded-xl font-bold"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" weight="bold" /> Go Back to Edit
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* MOBILE-OPTIMIZED FULLSCREEN DOCUMENT VIEWER MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl sm:max-w-4xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <FilePdf weight="fill" className="text-indigo-600 h-6 w-6" />
                <h3 className="font-black text-slate-800 truncate pr-4">{previewDoc.label}</h3>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-slate-400 hover:text-slate-900 p-2 -mr-2 rounded-full hover:bg-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <X weight="bold" className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 bg-slate-200 overflow-hidden relative w-full h-full">
               <iframe 
                 src={previewDoc.url} 
                 className="w-full h-full border-0 absolute inset-0" 
                 title={previewDoc.label}
               />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
