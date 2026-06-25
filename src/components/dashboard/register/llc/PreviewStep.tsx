"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  WarningCircle,
  Bank,
  CheckCircle,
  FilePdf,
  X,
  CreditCard
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

// Reusable Table Row for clean key-value display
const TableRow = ({ label, value, isHighlight = false, isLast = false }: { label: string, value: React.ReactNode, isHighlight?: boolean, isLast?: boolean }) => (
  <div className={`flex flex-col sm:flex-row sm:items-start py-3 gap-2 sm:gap-6 ${isLast ? '' : 'border-b border-slate-100'} ${isHighlight ? 'bg-indigo-50/50 -mx-6 px-6' : ''}`}>
    <div className="w-full sm:w-1/3 shrink-0">
      <span className={`text-[11px] font-bold uppercase tracking-widest ${isHighlight ? 'text-indigo-600' : 'text-slate-500'}`}>{label}</span>
    </div>
    <div className="w-full sm:w-2/3">
      <span className={`text-sm ${isHighlight ? 'font-black text-indigo-900' : 'font-black text-slate-900'}`}>{value || <span className="text-slate-400 italic font-medium">Not provided</span>}</span>
    </div>
  </div>
);

// Address Formatter
const formatAddress = (addr: any) => {
  if (!addr || !addr.state) return null;
  const parts = [addr.houseNo, addr.street, addr.city, addr.lga, addr.state].filter(Boolean);
  return parts.join(', ');
};

export default function PreviewStep({ data, draft, onComplete, onBack, isSubmitting }: any) {
  const [pricing, setPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  
  const [previewDoc, setPreviewDoc] = useState<{ url: string, label: string } | null>(null);

  // ==========================================
  // EXACT PRISMA & STATE MAPPING FIXES
  // ==========================================
  
  // 1. Company Details
  const proposedName1 = draft?.proposedName || data.proposedName || data.companyDetails?.proposedName || data.companyDetails?.proposedName1;
  const proposedName2 = draft?.altName1 || data.altName1 || data.companyDetails?.altName1 || data.companyDetails?.proposedName2;
  const proposedName3 = draft?.altName2 || data.altName2 || data.companyDetails?.altName2 || data.companyDetails?.proposedName3;
  
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
  const shareClassesArray = Array.isArray(rawShareClasses) ? rawShareClasses : (rawShareClasses?.shareClasses || []);

  // 3. Officers & Compliance
  const officers = data.officers || [];
  const uploads = data.uploads || {};
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
    <div className="py-4 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
           <ShieldCheck className="h-5 w-5" weight="fill" />
        </div>
        <div>
           <h2 className="text-xl font-black text-slate-900 leading-tight">Application Review</h2>
           <p className="text-xs font-medium text-slate-500 mt-0.5">Please verify all details before payment.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        
        {/* LEFT COLUMN: ONE LONG CARD FOR ALL DATA */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          
          {/* SECTION 1: Company Information */}
          <h3 className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">1</span>
            Company Information
          </h3>
          <div className="px-6 py-2">
            <TableRow label="Proposed Name 1" value={proposedName1} isHighlight />
            <TableRow label="Alternative Name 1" value={proposedName2} />
            <TableRow label="Alternative Name 2" value={proposedName3} />
            <TableRow label="Company Email" value={email} />
            <TableRow label="Principal Activity" value={principalActivity} />
            <TableRow label="Specific Activity" value={specificActivity} />
            <TableRow label="Business Description" value={description} />
            <TableRow label="Registered Address" value={formatAddress(registeredAddress)} />
            <TableRow label="Head Office Address" value={formatAddress(headOfficeAddress) || "Same as Registered Address"} isLast />
          </div>

          {/* SECTION 2: Share Capital & Objects */}
          <h3 className="bg-slate-50 border-y border-slate-200 px-6 py-3.5 text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">2</span>
            Capital & Objects
          </h3>
          <div className="px-6 py-2">
            <TableRow label="Company Type" value={companyType} />
            <TableRow label="Total Issued Capital" value={`₦${totalShares.toLocaleString()}`} isHighlight />
            
            <div className="flex flex-col sm:flex-row sm:items-start py-3 gap-2 sm:gap-6 border-b border-slate-100">
              <div className="w-full sm:w-1/3 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Share Classes</span>
              </div>
              <div className="w-full sm:w-2/3">
                {shareClassesArray.length > 0 ? (
                  <div className="space-y-2">
                    {shareClassesArray.map((cls: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm">
                        <span className="font-black text-slate-800">{cls.type || cls.class || 'ORDINARY'}</span>
                        <span className="font-bold text-indigo-600">{Number(cls.units || 0).toLocaleString()} Units</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic font-medium">None defined</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start py-3 gap-2 sm:gap-6">
              <div className="w-full sm:w-1/3 shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Objects of Memorandum</span>
              </div>
              <div className="w-full sm:w-2/3">
                <ul className="list-disc pl-4 space-y-1 text-sm font-black text-slate-800">
                  {memoObjects.length > 0 ? (
                    memoObjects.map((obj: string, i: number) => <li key={i}>{obj}</li>)
                  ) : (
                    <li className="text-slate-400 italic list-none ml-[-1rem] font-medium">Using default objects / Not provided</li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 3: Officers */}
          <h3 className="bg-slate-50 border-y border-slate-200 px-6 py-3.5 text-xs font-black text-slate-800 uppercase tracking-widest flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-700 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">3</span>
              Company Officers
            </div>
            <span className="text-[10px] bg-slate-200 px-2 py-1 rounded text-slate-600">{officers.length} Total</span>
          </h3>
          <div className="p-6 space-y-6">
            {officers.map((officer: any, idx: number) => {
              const isPsc = officer.roles.includes("PSC");
              const isStandalonePsc = officer.roles.length === 1 && isPsc;

              return (
                <div key={idx} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className={`px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b ${isStandalonePsc ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <h4 className="font-black text-sm text-slate-900">{idx + 1}. {officer.firstName} {officer.surname} {officer.otherName || ''}</h4>
                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest self-start sm:self-auto ${isStandalonePsc ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                      {formatRoles(officer.roles)}
                    </div>
                  </div>
                  
                  <div className="px-5 py-1">
                    <TableRow label="Date of Birth" value={officer.dob} />
                    <TableRow label="Gender" value={officer.gender} />
                    <TableRow label="Nationality / Occupation" value={`${officer.nationality} | ${officer.occupation}`} />
                    <TableRow label="Contact" value={`${officer.phoneCode || ''} ${officer.phone} | ${officer.email}`} />
                    <TableRow label="Identification" value={`${officer.idType || 'N/A'}: ${officer.idNumber || 'N/A'}`} />
                    
                    {officer.roles.includes("SHAREHOLDER") && (
                       <TableRow label="Shares Allotted" value={officer.sharesAllotted ? `${officer.sharesAllotted.toLocaleString()} Units` : 'See Breakdown'} />
                    )}

                    {isPsc && officer.pscDetails && (
                      <div className="mt-2 bg-slate-50 rounded-lg p-3 border border-slate-200 mb-3">
                         <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">PSC Declarations</h5>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4 text-xs font-bold text-slate-700">
                           <div className="flex justify-between border-b border-slate-200 pb-1"><span>Is PEP?</span> <span className="text-slate-900">{officer.pscDetails.isPep}</span></div>
                           <div className="flex justify-between border-b border-slate-200 pb-1"><span>Has Affiliation?</span> <span className="text-slate-900">{officer.pscDetails.hasAffiliation}</span></div>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {officers.length === 0 && <p className="text-sm font-bold text-slate-500 italic p-4 text-center border-2 border-dashed rounded-xl">No officers added.</p>}
          </div>

          {/* SECTION 4: Compliance & Uploads */}
          <h3 className="bg-slate-50 border-y border-slate-200 px-6 py-3.5 text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <span className="bg-indigo-100 text-indigo-700 h-5 w-5 rounded-full flex items-center justify-center text-[10px]">4</span>
            Compliance & Uploads
          </h3>
          <div className="p-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                   <CheckCircle weight="fill" /> Statement of Compliance
                 </h4>
                 <span className="text-sm font-black text-emerald-900 block">{`${declarant.firstName || 'Not'} ${declarant.surname || 'Provided'}`}</span>
               </div>
               <div className="text-left sm:text-right">
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Accreditation No.</span>
                 <span className="text-sm font-black text-emerald-900 block">{declarant.accreditationNumber || 'N/A'}</span>
               </div>
            </div>

            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Uploaded Documents</h4>
            {Object.keys(uploads).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(uploads).map(([key, url]) => (
                  <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FilePdf weight="fill" className="text-indigo-500 h-5 w-5 shrink-0" />
                      <span className="text-xs font-black text-slate-700 truncate tracking-wide">{getUploadLabel(key)}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.preventDefault(); setPreviewDoc({ url: url as string, label: getUploadLabel(key) }); }}
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-3 py-1.5 rounded-lg shrink-0 ml-2 transition-colors"
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

        {/* RIGHT COLUMN: COMPACT PAYMENT CARD */}
        <div className="lg:col-span-1 sticky top-8">
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl border border-slate-800">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
               <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <CreditCard weight="fill" className="text-emerald-400 h-5 w-5" />
               </div>
               <h3 className="text-base font-black tracking-wide">Payment Checkout</h3>
            </div>

            {isLoadingPricing ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-3 bg-slate-800 rounded w-full"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                <div className="h-10 bg-slate-800 rounded-lg w-full mt-6"></div>
              </div>
            ) : pricingError ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-red-400 text-xs font-bold flex items-start gap-2">
                  <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                  {pricingError}
                </div>
                <Button 
                  onClick={fetchPricing}
                  variant="outline"
                  className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800 font-bold rounded-lg h-10"
                >
                  Retry Loading Pricing
                </Button>
              </div>
            ) : pricing ? (
              <div className="space-y-3 text-sm">
                
                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium text-xs">Base CAC Fee</span>
                  <span className="font-black text-white">{formatCurrency(pricing.baseFee)}</span>
                </div>
                
                {/* Dynamically adds extra fee line if shares demand it */}
                {Number(pricing.extraSharesFee) > 0 && (
                  <div className="flex justify-between items-center text-amber-200/80 bg-amber-500/10 -mx-3 px-3 py-1.5 rounded-lg">
                    <span className="font-medium text-xs flex items-center gap-1">
                      Extra Shares Add-on
                    </span>
                    <span className="font-black">{formatCurrency(pricing.extraSharesFee)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-300">
                  <span className="font-medium text-xs">Stamp Duty (FIRS)</span>
                  <span className="font-black text-white">{formatCurrency(pricing.stampDuty)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-3">
                  <span className="font-medium text-xs">Processing Fee</span>
                  <span className="font-black text-white">{formatCurrency(pricing.serviceFee)}</span>
                </div>

                <div className="flex justify-between items-end pt-2 mb-6">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Due</span>
                  <span className="text-2xl font-black text-emerald-400 leading-none">{formatCurrency(pricing.total)}</span>
                </div>

                {/* Submit & Back Buttons Group */}
                <div className="flex gap-2">
                  <Button 
                    onClick={onBack}
                    disabled={isSubmitting}
                    variant="ghost"
                    className="w-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl h-12 shrink-0 p-0"
                    title="Go Back"
                  >
                    <ArrowLeft className="h-5 w-5" weight="bold" />
                  </Button>
                  <Button 
                    onClick={handleProceedToPayment}
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white h-12 rounded-xl font-black text-sm shadow-[0_0_0_2px_rgba(79,70,229,0.2)] transition-all"
                  >
                    {isSubmitting ? 'Processing...' : 'Pay & Submit'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

      </div>

      {/* MODAL: DOCUMENT VIEWER */}
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
