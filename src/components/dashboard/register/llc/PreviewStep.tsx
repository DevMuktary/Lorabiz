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

// Reusable Table Row with MAXIMUM breathing space and OBVIOUS separators
const TableRow = ({ label, value, isHighlight = false, isLast = false }: { label: string, value: React.ReactNode, isHighlight?: boolean, isLast?: boolean }) => (
  <div className={`flex flex-col sm:flex-row border-slate-200 ${isLast ? '' : 'border-b'}`}>
    {/* LABEL COLUMN */}
    <div className={`w-full sm:w-1/3 shrink-0 py-4 px-6 sm:border-r border-slate-200 ${isHighlight ? 'bg-indigo-50/60' : 'bg-slate-50/80'}`}>
      <span className={`text-[11px] font-bold uppercase tracking-widest leading-relaxed ${isHighlight ? 'text-indigo-700' : 'text-slate-500'}`}>{label}</span>
    </div>
    {/* VALUE COLUMN */}
    <div className={`w-full sm:w-2/3 py-4 px-6 flex items-center ${isHighlight ? 'bg-indigo-50/20' : 'bg-white'}`}>
      <div className={`text-sm leading-relaxed w-full ${isHighlight ? 'font-black text-indigo-900' : 'font-black text-slate-900'}`}>
        {value || <span className="text-slate-400 italic font-medium">Not provided</span>}
      </div>
    </div>
  </div>
);

// Address Formatter
const formatAddress = (addr: any) => {
  if (!addr || !addr.state) return null;
  const parts = [addr.houseNo || addr.buildingNo, addr.street, addr.city, addr.lga, addr.state].filter(Boolean);
  return parts.join(', ');
};

export default function PreviewStep({ data, draft, onComplete, onBack, isSubmitting }: any) {
  const [pricing, setPricing] = useState<any>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);
  const [pricingError, setPricingError] = useState<string | null>(null);
  
  const [previewDoc, setPreviewDoc] = useState<{ url: string, label: string } | null>(null);

  // ==========================================
  // STATE MAPPING
  // ==========================================
  
  const proposedName1 = draft?.proposedName || data.proposedName || data.companyDetails?.proposedName || data.companyDetails?.proposedName1;
  const proposedName2 = draft?.altName1 || data.altName1 || data.companyDetails?.altName1 || data.companyDetails?.proposedName2;
  const proposedName3 = draft?.altName2 || data.altName2 || data.companyDetails?.altName2 || data.companyDetails?.proposedName3;
  
  const email = data.email || data.companyDetails?.email;
  const principalActivity = data.principalActivity || data.companyDetails?.principalActivity;
  const specificActivity = data.specificActivity || data.companyDetails?.specificActivity;
  const description = data.description || data.companyDetails?.description;
  const registeredAddress = data.registeredAddress || data.companyDetails?.registeredAddress || data.companyDetails?.address || {};
  const headOfficeAddress = data.headOfficeAddress || data.companyDetails?.headOfficeAddress || {};

  const totalShares = Number(data.totalShareCapital || data.shareCapital?.totalIssuedCapital || 0);
  const companyType = data.companyType || data.shareCapital?.companyType || data.companyDetails?.companyType || 'ENTITY WITH SHARES BELOW FIVE MILLION';
  const rawShareClasses = data.shareClasses || data.shareCapital?.shareClasses;
  const shareClassesArray = Array.isArray(rawShareClasses) ? rawShareClasses : (rawShareClasses?.shareClasses || []);

  const officers = data.officers || [];
  const uploads = data.uploads || {};
  const declarant = data.declarantDetails || {};
  const witness = data.witnessDetails || {};
  const memoObjects = data.memorandumObjects || [];
  
  const useDefaultArticles = data.useDefaultArticles ?? true;
  const customArticles = Array.isArray(data.customArticles) ? data.customArticles : [];

  // Safely extract witness address whether it's a string or object
  const witnessAddressStr = typeof witness.address === 'string' 
    ? witness.address 
    : formatAddress(witness.address);

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
    <div className="py-4 space-y-10 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
           <ShieldCheck className="h-6 w-6" weight="fill" />
        </div>
        <div>
           <h2 className="text-2xl font-black text-slate-900 leading-tight">Full Application Review</h2>
           <p className="text-sm font-medium text-slate-500 mt-1">Please verify all extracted details accurately before submission.</p>
        </div>
      </div>

      {/* FULL WIDTH DETAILS CARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* SECTION 1: Company Information */}
        <h3 className="bg-slate-900 text-white px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3">
          <span className="bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-[11px]">1</span>
          Company Information
        </h3>
        <div>
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
        <h3 className="bg-slate-900 border-t border-slate-800 text-white px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3">
          <span className="bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-[11px]">2</span>
          Capital, Objects & Articles
        </h3>
        <div>
          <TableRow label="Company Type" value={companyType} />
          <TableRow label="Total Issued Capital" value={`₦${totalShares.toLocaleString()}`} isHighlight />
          
          <TableRow 
            label="Share Classes" 
            value={
              shareClassesArray.length > 0 ? (
                <div className="flex flex-col gap-3 w-full">
                  {shareClassesArray.map((cls: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl text-sm w-full sm:w-2/3 lg:w-1/2">
                      <span className="font-black text-slate-800 tracking-wide uppercase">{cls.type || cls.class || 'ORDINARY'}</span>
                      <span className="font-bold text-indigo-700 bg-indigo-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        {Number(cls.units || 0).toLocaleString()} Units
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic font-medium">None defined</span>
              )
            } 
          />

          <TableRow 
            label="Objects of Memorandum" 
            value={
              <ul className="list-disc pl-5 space-y-2 text-sm font-black text-slate-800">
                {memoObjects.length > 0 ? (
                  memoObjects.map((obj: string, i: number) => <li key={i} className="leading-relaxed">{obj}</li>)
                ) : (
                  <li className="text-slate-400 italic list-none ml-[-1.25rem] font-medium">Using default objects / Not provided</li>
                )}
              </ul>
            } 
          />

          <TableRow 
            label="Articles of Association" 
            isLast
            value={
              <div className="space-y-3">
                {useDefaultArticles && customArticles.length === 0 ? (
                  <span className="inline-block bg-slate-100 text-slate-700 border border-slate-200 font-bold px-4 py-2 rounded-lg">
                    Standard Default Articles (As prescribed by CAMA 2020)
                  </span>
                ) : customArticles.length > 0 ? (
                  <ul className="list-decimal pl-5 space-y-3 text-sm font-medium text-slate-700">
                    {customArticles.map((art: string, i: number) => (
                      <li key={i} className="leading-relaxed">{art}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-slate-400 italic font-medium">No custom articles provided</span>
                )}
              </div>
            } 
          />
        </div>

        {/* SECTION 3: Officers */}
        <h3 className="bg-slate-900 border-t border-slate-800 text-white px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-[11px]">3</span>
            Company Officers
          </div>
          <span className="text-[11px] font-bold bg-slate-700 px-3 py-1.5 rounded-lg text-slate-200">{officers.length} Total</span>
        </h3>
        <div className="bg-slate-50/50 p-6 space-y-8">
          {officers.map((officer: any, idx: number) => {
            const isPsc = officer.roles.includes("PSC");

            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-indigo-50/50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h4 className="font-black text-base text-slate-900">{idx + 1}. {officer.firstName} {officer.surname} {officer.otherName || ''}</h4>
                  <div className="text-[11px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest self-start sm:self-auto bg-indigo-200 text-indigo-800">
                    {formatRoles(officer.roles)}
                  </div>
                </div>
                
                <div>
                  <TableRow label="Date of Birth & Gender" value={`${officer.dob} | ${officer.gender}`} />
                  <TableRow label="Nationality & Occupation" value={`${officer.nationality} | ${officer.occupation}`} />
                  <TableRow label="Contact Information" value={`${officer.phoneCode || ''} ${officer.phone} | ${officer.email}`} />
                  <TableRow label="Identification" value={`${officer.idType || 'N/A'}: ${officer.idNumber || 'N/A'}`} />
                  <TableRow label="Residential Address" value={formatAddress(officer.residentialAddress)} />
                  <TableRow label="Service Address" value={formatAddress(officer.serviceAddress) || <span className="italic">Same as Residential</span>} />
                  
                  {officer.roles.includes("SHAREHOLDER") && (
                     <TableRow isHighlight label="Shares Allotted" value={officer.sharesAllotted ? `${officer.sharesAllotted.toLocaleString()} Units` : 'See Breakdown'} />
                  )}

                  {isPsc && officer.pscDetails && (
                    <div className="bg-amber-50/50 border-t border-slate-200">
                      <div className="px-6 py-3 border-b border-slate-200">
                         <h5 className="text-[11px] font-black text-amber-700 uppercase tracking-widest">PSC Declarations</h5>
                      </div>
                      <TableRow label="Politically Exposed Person?" value={officer.pscDetails.isPep} />
                      <TableRow label="Has Affiliations?" value={officer.pscDetails.hasAffiliation} />
                      <TableRow label="Direct Voting Rights" value={officer.pscDetails.holdsVotingDirect} isLast />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {officers.length === 0 && <p className="text-base font-bold text-slate-500 italic p-6 text-center border-2 border-slate-200 border-dashed rounded-2xl bg-white">No officers added.</p>}
        </div>

        {/* SECTION 4: Compliance, Declarants, Witness */}
        <h3 className="bg-slate-900 border-t border-slate-800 text-white px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3">
          <span className="bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-[11px]">4</span>
          Statutory Details
        </h3>
        <div>
          {/* Witness Details */}
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-3.5">
             <h5 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Witness to Articles</h5>
          </div>
          {witness.firstName ? (
            <>
              <TableRow label="Witness Name" value={`${witness.firstName} ${witness.surname}`} />
              <TableRow label="Contact & Occupation" value={`${witness.phone} | ${witness.email} | ${witness.occupation}`} />
              <TableRow label="Witness Address" value={witnessAddressStr || 'Not Provided'} />
            </>
          ) : (
            <TableRow label="Witness Details" value="Using Default Articles (No Witness Required)" />
          )}

          {/* Declarant Details */}
          <div className="bg-slate-100 border-y border-slate-200 px-6 py-3.5 mt-4">
             <h5 className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Deponent / Declarant</h5>
          </div>
          {declarant.firstName ? (
            <>
              <TableRow label="Declarant Name" value={`${declarant.firstName} ${declarant.surname}`} />
              <TableRow label="Accreditation Number" value={declarant.accreditationNumber || 'N/A'} isLast />
            </>
          ) : (
            <TableRow label="Declarant Details" value="Not Provided" isLast />
          )}
        </div>

        {/* SECTION 5: Uploads */}
        <h3 className="bg-slate-900 border-t border-slate-800 text-white px-6 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-3">
          <span className="bg-indigo-500 text-white h-6 w-6 rounded-full flex items-center justify-center text-[11px]">5</span>
          Uploaded Documents
        </h3>
        <div className="p-6 bg-slate-50/50">
          {Object.keys(uploads).length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {Object.entries(uploads).map(([key, url]) => (
                <div key={key} className="flex flex-col p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3 mb-5">
                    <CheckCircle weight="fill" className="text-emerald-500 h-6 w-6 shrink-0" />
                    <span className="text-xs font-black text-slate-700 leading-snug">{getUploadLabel(key)}</span>
                  </div>
                  <button 
                    onClick={(e) => { e.preventDefault(); setPreviewDoc({ url: url as string, label: getUploadLabel(key) }); }}
                    className="mt-auto w-full text-[11px] font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 hover:bg-indigo-100 py-3 rounded-xl transition-colors border border-indigo-100"
                  >
                    View Document
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center gap-3 text-amber-700 bg-amber-50 p-6 rounded-2xl text-sm border border-amber-200 font-bold">
              <WarningCircle weight="fill" className="h-6 w-6" />
              No documents have been uploaded yet.
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM CENTERED PAYMENT CARD */}
      <div className="max-w-3xl mx-auto pt-8 pb-16">
        <div className="bg-slate-900 rounded-[2rem] p-8 md:p-10 text-white shadow-2xl border border-slate-800">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-6">
             <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CreditCard weight="fill" className="text-emerald-400 h-7 w-7" />
             </div>
             <div>
                <h3 className="text-2xl font-black tracking-wide">Payment Checkout</h3>
                <p className="text-sm text-slate-400 mt-1.5 font-medium">Final confirmation and fee breakdown</p>
             </div>
          </div>

          {isLoadingPricing ? (
            <div className="space-y-5 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-800 rounded w-3/4"></div>
              <div className="h-16 bg-slate-800 rounded-2xl w-full mt-8"></div>
            </div>
          ) : pricingError ? (
            <div className="space-y-5">
              <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl text-red-400 text-sm font-bold flex items-start gap-3">
                <WarningCircle weight="fill" className="h-6 w-6 shrink-0" />
                <span className="leading-relaxed">{pricingError}</span>
              </div>
              <Button 
                onClick={fetchPricing}
                variant="outline"
                className="w-full bg-transparent border-slate-700 text-white hover:bg-slate-800 font-bold rounded-xl h-14"
              >
                Retry Loading Pricing
              </Button>
            </div>
          ) : pricing ? (
            <div className="space-y-5 text-base">
              
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-medium">Base CAC Fee</span>
                <span className="font-black text-white">{formatCurrency(pricing.baseFee)}</span>
              </div>
              
              {/* Dynamically adds extra fee line if shares demand it */}
              {Number(pricing.extraSharesFee) > 0 && (
                <div className="flex justify-between items-center text-amber-200/90 bg-amber-500/10 -mx-5 px-5 py-3.5 rounded-xl border border-amber-500/20">
                  <span className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest">
                    Extra Shares Add-on
                  </span>
                  <span className="font-black text-lg">{formatCurrency(pricing.extraSharesFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-slate-300">
                <span className="font-medium">Stamp Duty (FIRS)</span>
                <span className="font-black text-white">{formatCurrency(pricing.stampDuty)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300 border-b border-slate-800 pb-6">
                <span className="font-medium">Processing Fee</span>
                <span className="font-black text-white">{formatCurrency(pricing.serviceFee)}</span>
              </div>

              <div className="flex justify-between items-end pt-4 mb-10 bg-slate-950 p-6 rounded-2xl border border-slate-800">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Due</span>
                <span className="text-4xl sm:text-5xl font-black text-emerald-400 leading-none tracking-tight">{formatCurrency(pricing.total)}</span>
              </div>

              {/* Submit & Back Buttons Group */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={onBack}
                  disabled={isSubmitting}
                  variant="ghost"
                  className="w-full sm:w-1/3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl h-16"
                >
                  <ArrowLeft className="h-6 w-6 mr-2" weight="bold" /> Go Back
                </Button>
                <Button 
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting}
                  className="w-full sm:w-2/3 bg-indigo-600 hover:bg-indigo-500 text-white h-16 rounded-2xl font-black text-lg shadow-[0_0_0_4px_rgba(79,70,229,0.2)] transition-all"
                >
                  {isSubmitting ? 'Processing...' : 'Pay & Submit Application'}
                  {!isSubmitting && <ArrowRight className="ml-3 h-6 w-6" weight="bold" />}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* MODAL: DOCUMENT VIEWER */}
      {previewDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm sm:p-6">
          <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:rounded-3xl sm:max-w-5xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <FilePdf weight="fill" className="text-indigo-600 h-7 w-7" />
                <h3 className="font-black text-lg text-slate-800 truncate pr-4">{previewDoc.label}</h3>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="text-slate-400 hover:text-slate-900 p-2.5 -mr-2.5 rounded-full hover:bg-slate-200 transition-colors"
                aria-label="Close modal"
              >
                <X weight="bold" className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 bg-slate-200 overflow-hidden relative w-full h-full min-h-[65vh]">
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
