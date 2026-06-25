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
  CheckCircle,
  MapPin,
  IdentificationCard,
  EnvelopeSimple,
  Phone,
  X
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
  
  // Modal State for Documents
  const [previewDoc, setPreviewDoc] = useState<{ url: string, label: string } | null>(null);

  // Safely extract all data blocks
  const company = data.companyDetails || {};
  const shares = data.shareCapital || {};
  const officers = data.officers || [];
  const uploads = data.uploads || {};
  
  const registeredAddress = data.registeredAddress || company.address || company.registeredAddress || {};
  const headOfficeAddress = data.headOfficeAddress || company.headOfficeAddress || {};
  const witness = data.witnessDetails || {};
  const declarant = data.declarantDetails || {};
  const memoObjects = data.memorandumObjects || [];

  // 1. ROBUST NAME EXTRACTION: Checks root level first, then nested company object
  const proposedName1 = data.proposedName || company.proposedName1 || company.proposedName;
  const proposedName2 = data.altName1 || company.proposedName2 || company.altName1;
  const proposedName3 = data.altName2 || company.proposedName3 || company.altName2;

  // 2. ROBUST SHARE CLASS EXTRACTION
  const shareClasses = Array.isArray(shares.shareClasses) ? shares.shareClasses : [];
  const totalShares = Number(shares.totalIssuedCapital || shares.totalShares || data.totalShareCapital || 0);
  const fallbackShareType = shares.shareType || shares.class || shares.type || data.shareType || 'ORDINARY';

  const fetchPricing = async () => {
    setIsLoadingPricing(true);
    setPricingError(null);
    try {
      const companyType = shares.companyType || company.companyType || data.companyType || 'LTD';
      
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
        throw new Error("Failed to fetch pricing");
      }
      
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
  }, [totalShares, shares.companyType, company.companyType]);

  const handleProceedToPayment = () => {
    if (!pricing) return;
    onComplete({
      ...data,
      calculatedPricing: pricing
    });
  };

  return (
    <div className="py-6 space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <ShieldCheck className="h-6 w-6 text-indigo-600" weight="fill" />
        <h2 className="text-xl font-bold text-slate-900">Application Preview</h2>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Data Preview */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* SECTION 1: Company Information */}
          <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <Buildings weight="bold" className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Company Information</h3>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-5">
              <DetailItem label="Proposed Name 1" value={proposedName1} colSpan />
              <DetailItem label="Alternative Name 1" value={proposedName2} />
              <DetailItem label="Alternative Name 2" value={proposedName3} />
              <DetailItem label="Company Email" value={data.email || company.email} />
              
              <div className="col-span-full border-t border-slate-100 pt-5 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <DetailItem label="Principal Activity" value={data.principalActivity || company.principalActivity} />
                <DetailItem label="Specific Activity" value={data.specificActivity || company.specificActivity} />
                <DetailItem label="Business Description" value={data.description || company.description} colSpan />
              </div>

              <div className="col-span-full border-t border-slate-100 pt-5 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <span className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin weight="bold"/> Registered Address
                  </span>
                  <p className="font-medium text-slate-900 text-sm">
                    {formatAddress(registeredAddress) || 'Not provided'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <MapPin weight="bold"/> Head Office Address
                  </span>
                  <p className="font-medium text-slate-900 text-sm">
                    {formatAddress(headOfficeAddress) || <span className="italic text-slate-400">Same as Registered Address</span>}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Share Capital & Objects */}
          <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
             <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <Bank weight="bold" className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Capital & Objects</h3>
            </div>
            <div className="p-5 space-y-5">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                 <DetailItem label="Total Issued Capital" value={totalShares.toLocaleString()} />
                 <DetailItem label="Company Type" value={shares.companyType || company.companyType} colSpan />
               </div>

               {/* Share Classes */}
               <div>
                 <span className="text-slate-500 block mb-2 text-[11px] font-bold uppercase tracking-wider">Share Classes</span>
                 {shareClasses.length > 0 ? (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {shareClasses.map((cls: any, i: number) => (
                       <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded text-sm">
                         <span className="font-bold text-slate-800">{cls.class || fallbackShareType}</span>
                         <span className="font-medium text-slate-600">{Number(cls.units || 0).toLocaleString()} Units</span>
                       </div>
                     ))}
                   </div>
                 ) : (
                    <div className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded text-sm max-w-sm">
                      <span className="font-bold text-slate-800">{fallbackShareType}</span>
                      <span className="font-medium text-slate-600">{totalShares.toLocaleString()} Units</span>
                    </div>
                 )}
               </div>

               <div className="border-t border-slate-100 pt-5">
                 <span className="text-slate-500 block mb-2 text-[11px] font-bold uppercase tracking-wider">Objects of Memorandum</span>
                 <ul className="list-disc pl-4 space-y-1 text-sm font-medium text-slate-800">
                   {memoObjects.length > 0 ? (
                     memoObjects.map((obj: string, i: number) => <li key={i}>{obj}</li>)
                   ) : (
                     <li className="text-slate-400 italic list-none ml-[-1rem]">Using default objects / Not provided</li>
                   )}
                 </ul>
               </div>
            </div>
          </section>

          {/* SECTION 3: Officers */}
          <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users weight="bold" className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">Company Officers</h3>
              </div>
              <span className="text-slate-500 font-medium text-xs">{officers.length} Total</span>
            </div>
            
            <div className="p-5 space-y-4">
              {officers.map((officer: any, idx: number) => {
                const allottedUnits = Array.isArray(shares.allotments) 
                  ? shares.allotments.filter((a: any) => a.officerId === officer.id).reduce((sum: number, a: any) => sum + (Number(a.units) || 0), 0)
                  : null;

                return (
                  <div key={idx} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                      <h4 className="font-bold text-slate-900">{officer.firstName} {officer.surname} {officer.otherName || ''}</h4>
                      <div className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded uppercase tracking-wider">
                        {formatRoles(officer.roles)}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2"><EnvelopeSimple className="text-slate-400"/> <span className="text-sm font-medium">{officer.email}</span></div>
                      <div className="flex items-center gap-2"><Phone className="text-slate-400"/> <span className="text-sm font-medium">{officer.phone}</span></div>
                      <DetailItem label="Date of Birth" value={officer.dob} />
                      <DetailItem label="Gender" value={officer.gender} />
                      <DetailItem label="Nationality" value={officer.nationality} />
                      <DetailItem label="Occupation" value={officer.occupation} />
                      
                      <div className="col-span-full border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><IdentificationCard weight="bold"/> Identification</span>
                          <p className="font-medium text-slate-900 text-sm">{officer.idType || 'N/A'}: {officer.idNumber || 'N/A'}</p>
                        </div>
                        {officer.roles.includes("SHAREHOLDER") && (
                          <div>
                            <span className="text-slate-500 block mb-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><Bank weight="bold"/> Shares Allotted</span>
                            <p className="font-bold text-slate-900 text-sm">{allottedUnits ? allottedUnits.toLocaleString() + ' Units' : 'None specified'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {officers.length === 0 && <p className="text-sm text-slate-500 italic">No officers added.</p>}
            </div>
          </section>

          {/* SECTION 4: Uploads */}
          <section className="border border-slate-200 rounded-lg bg-white overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center gap-2">
              <FilePdf weight="bold" className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-800">Uploaded Documents</h3>
            </div>
            
            <div className="p-5">
              {Object.keys(uploads).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(uploads).map(([key, url]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <CheckCircle weight="fill" className="text-indigo-500 h-4 w-4 shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{getUploadLabel(key)}</span>
                      </div>
                      <button 
                        onClick={() => setPreviewDoc({ url: url as string, label: getUploadLabel(key) })}
                        className="text-xs font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 shrink-0 ml-2"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 p-3 rounded-lg text-sm border border-amber-200">
                  <WarningCircle weight="fill" className="h-4 w-4" />
                  No documents have been uploaded yet.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: DB Pricing & Payment */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-xl p-6 text-white sticky top-8 shadow-md">
            <h3 className="text-lg font-bold mb-6 border-b border-slate-800 pb-4">Checkout Summary</h3>

            {isLoadingPricing ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-full"></div>
                <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                <div className="h-12 bg-slate-800 rounded-lg w-full mt-6"></div>
              </div>
            ) : pricingError ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-sm">
                  {pricingError}
                </div>
                <Button 
                  onClick={fetchPricing}
                  variant="outline"
                  className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800"
                >
                  Retry
                </Button>
              </div>
            ) : pricing ? (
              <div className="space-y-4 text-sm">
                
                {pricing.baseFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>CAC Registration</span>
                    <span className="font-medium text-white">{formatCurrency(pricing.baseFee)}</span>
                  </div>
                )}
                
                {Number(pricing.extraSharesFee) > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Extra Shares Fee</span>
                    <span className="font-medium text-white">{formatCurrency(pricing.extraSharesFee)}</span>
                  </div>
                )}

                {pricing.stampDuty !== undefined && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Stamp Duty</span>
                    <span className="font-medium text-white">{formatCurrency(pricing.stampDuty)}</span>
                  </div>
                )}

                {pricing.serviceFee !== undefined && (
                  <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-4">
                    <span>Service Fee</span>
                    <span className="font-medium text-white">{formatCurrency(pricing.serviceFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-end pt-2">
                  <span className="text-sm font-bold text-slate-400 uppercase">Total</span>
                  <span className="text-2xl font-bold text-white">{formatCurrency(pricing.total)}</span>
                </div>

                <Button 
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-lg font-bold transition-all"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" weight="bold" />}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* 3. MOBILE-OPTIMIZED FULLSCREEN DOCUMENT VIEWER MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm sm:p-4">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:max-w-4xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <FilePdf weight="fill" className="text-indigo-600 h-5 w-5" />
                <h3 className="font-bold text-slate-800 truncate pr-4">{previewDoc.label}</h3>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-slate-400 hover:text-slate-700 p-2 -mr-2 rounded-md hover:bg-slate-200 transition-colors"
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
