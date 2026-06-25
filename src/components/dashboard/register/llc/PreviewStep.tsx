"use client";

import { useState, useEffect } from "react";
import { 
  Buildings, 
  Users, 
  Bank, 
  FilePdf,
  WarningCircle,
  ShieldCheck,
  Money,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Scales,
  MapPin,
  IdentificationCard,
  EnvelopeSimple,
  Phone
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
  return roles.join(' & ');
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
const DetailItem = ({ label, value, colSpan = false }: { label: string, value: any, colSpan?: boolean }) => (
  <div className={colSpan ? "sm:col-span-2 md:col-span-3" : ""}>
    <span className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider">{label}</span>
    <span className="font-medium text-slate-900 text-sm">{value || <span className="text-slate-300 italic">Not provided</span>}</span>
  </div>
);

// Reusable Address Formatter
const formatAddress = (addr: any) => {
  if (!addr || !addr.street) return null;
  const parts = [addr.buildingNo, addr.street, addr.city, addr.lga, addr.state].filter(Boolean);
  return parts.join(', ');
};

export default function PreviewStep({ data, onComplete, isSubmitting }: any) {
  const [pricing, setPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Extract all data blocks safely
  const shares = data.shareCapital || {};
  const officers = data.officers || [];
  const uploads = data.uploads || {};
  const registeredAddress = data.registeredAddress || {};
  const headOfficeAddress = data.headOfficeAddress || {};
  const witness = data.witnessDetails || {};
  const declarant = data.declarantDetails || {};
  const memoObjects = data.memorandumObjects || [];

  const fetchPricing = async () => {
    setIsLoadingPricing(true);
    setPricingError(null);
    try {
      const totalShares = Number(shares.totalIssuedCapital || data.totalShareCapital) || 0;
      const companyType = shares.companyType || data.companyType || 'LTD';
      
      // STRICTLY hit the database/API - NO FALLBACK MOCK MATH
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: 'llc',
          shares: totalShares,
          companyType: companyType
        })
      });

      if (!res.ok) {
        throw new Error("Failed to fetch pricing from the database.");
      }
      
      const apiPricing = await res.json();
      setPricing(apiPricing);
    } catch (error) {
      console.error(error);
      setPricingError("Unable to load pricing details from the database. Please try again.");
    } finally {
      setIsLoadingPricing(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [shares.totalIssuedCapital, data.totalShareCapital, shares.companyType, data.companyType]);

  const handleProceedToPayment = () => {
    if (!pricing) return;
    onComplete({
      ...data,
      calculatedPricing: pricing
    });
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
            <ShieldCheck className="h-7 w-7" weight="fill" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Comprehensive Review</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Verify every detail below. This exact information will be submitted to the CAC.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Data Preview */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SECTION 1: Company Information */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <Buildings weight="fill" className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">1. Company Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-6">
              <DetailItem label="Proposed Name 1" value={data.proposedName} colSpan />
              <DetailItem label="Alternative Name 1" value={data.altName1} />
              <DetailItem label="Alternative Name 2" value={data.altName2} />
              <DetailItem label="Company Email" value={data.email} />
              
              <div className="col-span-full border-t border-slate-100 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem label="Principal Activity" value={data.principalActivity} />
                <DetailItem label="Specific Activity" value={data.specificActivity} />
                <DetailItem label="Business Description" value={data.description} colSpan />
              </div>

              <div className="col-span-full border-t border-slate-100 pt-6 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <span className="text-slate-500 block mb-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><MapPin weight="bold"/> Registered Address</span>
                  <p className="font-medium text-slate-900 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {formatAddress(registeredAddress) || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><MapPin weight="bold"/> Head Office Address</span>
                  <p className="font-medium text-slate-900 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {formatAddress(headOfficeAddress) || <span className="italic text-slate-400">Same as Registered Address</span>}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Share Capital & Objects */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
             <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <Bank weight="fill" className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">2. Capital & Objects</h3>
            </div>
            <div className="p-6 space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <DetailItem label="Total Issued Capital" value={Number(shares.totalIssuedCapital || data.totalShareCapital || 0).toLocaleString()} />
                 <DetailItem label="Company Type" value={shares.companyType || data.companyType} colSpan />
               </div>

               {/* Share Classes */}
               {Array.isArray(shares.shareClasses) && shares.shareClasses.length > 0 && (
                 <div>
                   <span className="text-slate-500 block mb-3 text-[11px] font-bold uppercase tracking-wider">Share Classes</span>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {shares.shareClasses.map((cls: any, i: number) => (
                       <div key={i} className="flex justify-between items-center bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-sm">
                         <span className="font-bold text-indigo-900">{cls.class || 'ORDINARY'}</span>
                         <span className="font-medium text-slate-700">{Number(cls.units || 0).toLocaleString()} Units</span>
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               <div className="border-t border-slate-100 pt-6">
                 <span className="text-slate-500 block mb-3 text-[11px] font-bold uppercase tracking-wider">Objects of Memorandum</span>
                 <ul className="list-disc pl-5 space-y-2 text-sm font-medium text-slate-800">
                   {memoObjects.length > 0 ? (
                     memoObjects.map((obj: string, i: number) => <li key={i}>{obj}</li>)
                   ) : (
                     <li className="text-slate-400 italic list-none">No objects provided</li>
                   )}
                 </ul>
               </div>
            </div>
          </section>

          {/* SECTION 3: Officers */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users weight="fill" className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">3. Company Officers</h3>
              </div>
              <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-3 py-1 rounded-full">{officers.length} Total</span>
            </div>
            
            <div className="p-6 space-y-6">
              {officers.map((officer: any, idx: number) => {
                // Find shares allotted to this specific officer
                const allottedUnits = Array.isArray(shares.allotments) 
                  ? shares.allotments.filter((a: any) => a.officerId === officer.id).reduce((sum: number, a: any) => sum + (Number(a.units) || 0), 0)
                  : null;

                return (
                  <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <h4 className="font-black text-slate-900 text-base">{officer.firstName} {officer.surname} {officer.otherName || ''}</h4>
                      <div className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-full uppercase tracking-widest">
                        {formatRoles(officer.roles)}
                      </div>
                    </div>
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="flex items-center gap-2"><EnvelopeSimple className="text-slate-400"/> <span className="text-sm font-medium">{officer.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="text-slate-400"/> <span className="text-sm font-medium">{officer.phone}</span></div>
                      <DetailItem label="Date of Birth" value={officer.dob} />
                      <DetailItem label="Gender" value={officer.gender} />
                      <DetailItem label="Nationality" value={officer.nationality} />
                      <DetailItem label="Occupation" value={officer.occupation} />
                      
                      <div className="col-span-full border-t border-slate-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-slate-50 p-4 rounded-xl">
                          <span className="text-slate-500 block mb-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><IdentificationCard weight="bold"/> Identification</span>
                          <p className="font-medium text-slate-900 text-sm">{officer.idType || 'N/A'}: {officer.idNumber || 'N/A'}</p>
                        </div>
                        {officer.roles.includes("SHAREHOLDER") && (
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <span className="text-emerald-700 block mb-2 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><Bank weight="bold"/> Shares Allotted</span>
                            <p className="font-black text-emerald-900 text-sm">{allottedUnits ? allottedUnits.toLocaleString() + ' Units' : 'None specified'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {officers.length === 0 && <p className="text-sm text-slate-500 italic p-4 bg-slate-50 rounded-xl">No officers have been added to this registration.</p>}
            </div>
          </section>

          {/* SECTION 4: Statutory Compliance & Uploads */}
          <section className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
              <Scales weight="fill" className="h-5 w-5 text-indigo-500" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">4. Statutory & Documents</h3>
            </div>
            
            <div className="p-6 space-y-8">
              
              {/* Statutory Humans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 p-4 rounded-2xl">
                  <span className="text-slate-500 block mb-3 text-[11px] font-bold uppercase tracking-wider">Witness to Articles</span>
                  {witness.firstName ? (
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{witness.firstName} {witness.surname}</p>
                      <p className="text-sm text-slate-600">{witness.address?.street}, {witness.address?.city}</p>
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">No witness required (Using Default Articles)</p>}
                </div>
                
                <div className="border border-slate-200 p-4 rounded-2xl">
                  <span className="text-slate-500 block mb-3 text-[11px] font-bold uppercase tracking-wider">Deponent / Declarant</span>
                  {declarant.firstName ? (
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{declarant.firstName} {declarant.surname}</p>
                      <p className="text-sm text-slate-600">ID: {declarant.idType} ({declarant.idNumber})</p>
                    </div>
                  ) : <p className="text-sm text-slate-400 italic">Not provided</p>}
                </div>
              </div>

              {/* Uploads List */}
              <div className="border-t border-slate-100 pt-6">
                <span className="text-slate-500 block mb-4 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><FilePdf weight="bold"/> Uploaded Documents ({Object.keys(uploads).length})</span>
                {Object.keys(uploads).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(uploads).map(([key, url]) => (
                      <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50/30">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <CheckCircle weight="fill" className="text-emerald-500 h-5 w-5 shrink-0" />
                          <span className="text-sm font-bold text-slate-700 truncate">{getUploadLabel(key)}</span>
                        </div>
                        <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 shrink-0 ml-2">
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-xl text-sm font-bold border border-amber-200">
                    <WarningCircle weight="fill" className="h-5 w-5" />
                    No documents have been uploaded yet.
                  </div>
                )}
              </div>

            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: DB Pricing & Payment */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl sticky top-8 border border-slate-800">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Money weight="duotone" className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black tracking-tight">Checkout</h3>
            </div>

            {isLoadingPricing ? (
              <div className="space-y-5 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                <div className="h-12 bg-slate-800 rounded-xl w-full mt-8"></div>
              </div>
            ) : pricingError ? (
              <div className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-400 text-sm font-medium leading-relaxed">
                  <WarningCircle weight="fill" className="h-5 w-5 mb-2" />
                  {pricingError}
                </div>
                <Button 
                  onClick={fetchPricing}
                  variant="outline"
                  className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800 h-12 rounded-xl font-bold"
                >
                  Retry Loading Price
                </Button>
              </div>
            ) : pricing ? (
              <div className="space-y-5 text-sm">
                
                {pricing.baseFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">CAC Base Registration</span>
                    <span className="font-bold text-white">{formatCurrency(pricing.baseFee)}</span>
                  </div>
                )}
                
                {Number(pricing.extraSharesFee) > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">Extra Shares CAC Fee</span>
                    <span className="font-bold text-white">{formatCurrency(pricing.extraSharesFee)}</span>
                  </div>
                )}

                {pricing.stampDuty !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-medium">FIRS Stamp Duty</span>
                    <span className="font-bold text-white">{formatCurrency(pricing.stampDuty)}</span>
                  </div>
                )}

                {pricing.serviceFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-5">
                    <span className="font-medium">Lumebiz Service Fee</span>
                    <span className="font-bold text-white">{formatCurrency(pricing.serviceFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-3 pb-2">
                  <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Total Amount</span>
                  <span className="text-3xl font-black text-emerald-400 tracking-tight">{formatCurrency(pricing.total)}</span>
                </div>

                <Button 
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white h-14 rounded-xl font-black text-base transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
                >
                  {isSubmitting ? 'Processing Payment...' : 'Pay & Submit to CAC'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" weight="bold" />}
                </Button>

                <p className="text-[11px] text-center text-slate-500 mt-6 leading-relaxed font-medium">
                  By clicking submit, you confirm that all information provided is accurate and complies with CAMA 2020 regulations.
                </p>
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </div>
  );
}
