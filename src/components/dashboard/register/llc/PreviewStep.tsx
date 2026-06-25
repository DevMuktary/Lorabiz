"use client";

import { useState, useEffect } from "react";
import { 
  Buildings, 
  Users, 
  Bank, 
  FilePdf,
  WarningCircle,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Money
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

export default function PreviewStep({ data, onComplete, isSubmitting }: any) {
  const [pricing, setPricing] = useState<{
    baseFee: number;
    extraSharesFee: number;
    stampDuty: number;
    serviceFee: number;
    total: number;
  } | null>(null);
  
  const [isLoadingPricing, setIsLoadingPricing] = useState(true);

  // Read directly from the flat DB structure provided by the API
  const shares = data.shareCapital || {};
  const officers = data.officers || [];
  const uploads = data.uploads || {};
  const registeredAddress = data.registeredAddress || {};

  // Safely extract the share array if it exists to get the class type
  const shareClassesArray = Array.isArray(shares.shareClasses) ? shares.shareClasses : [];
  const primaryShareType = shareClassesArray[0]?.class || 'ORDINARY';

  useEffect(() => {
    const fetchPricing = async () => {
      setIsLoadingPricing(true);
      try {
        // Correctly read from totalIssuedCapital as formatted by your GET API
        const totalShares = Number(shares.totalIssuedCapital || data.totalShareCapital) || 1000000;
        const companyType = shares.companyType || data.companyType || 'PRIVATE UNLIMITED COMPANY';
        
        // Attempt to fetch exact breakdown from your pricing API
        const res = await fetch('/api/pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'llc',
            shares: totalShares,
            companyType: companyType
          })
        });

        if (res.ok) {
          const apiPricing = await res.json();
          setPricing(apiPricing);
        } else {
          throw new Error("API fallback triggered");
        }
      } catch (error) {
        // Fallback to strict CAC & FIRS calculation logic
        const totalShares = Number(shares.totalIssuedCapital || data.totalShareCapital) || 1000000;
        
        const baseCACFee = 10000; // Base CAC fee for first 1M shares
        const extraSharesCACFee = Math.max(0, Math.ceil((totalShares - 1000000) / 1000000)) * 5000; // N5k per additional 1M
        const stampDuty = totalShares * 0.0075; // 0.75% FIRS Stamp Duty
        const lumebizServiceFee = 20000; // Standard Lumebiz agency fee
        
        setPricing({
          baseFee: baseCACFee,
          extraSharesFee: extraSharesCACFee,
          stampDuty: stampDuty,
          serviceFee: lumebizServiceFee,
          total: baseCACFee + extraSharesCACFee + stampDuty + lumebizServiceFee
        });
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricing();
  }, [shares.totalIssuedCapital, data.totalShareCapital, shares.companyType, data.companyType]);

  const handleProceedToPayment = () => {
    onComplete({
      ...data,
      calculatedPricing: pricing
    });
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
      <div className="mb-6 flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-6 w-6" weight="fill" />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900">Review & Payment</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Please review all provided information carefully before proceeding to payment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Data Preview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Company Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-slate-100 pb-3">
              <Buildings weight="duotone" className="h-5 w-5 text-indigo-500" />
              Company Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Proposed Name 1</span>
                <span className="font-semibold text-slate-900">{data.proposedName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Alternative Name 1</span>
                <span className="font-semibold text-slate-900">{data.altName1 || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Alternative Name 2</span>
                <span className="font-semibold text-slate-900">{data.altName2 || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Company Type</span>
                <span className="font-semibold text-slate-900">{data.companyType || shares.companyType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Email</span>
                <span className="font-semibold text-slate-900">{data.email || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-1 text-xs">Registered Address</span>
                <span className="font-semibold text-slate-900">
                  {registeredAddress.street 
                    ? `${registeredAddress.street}, ${registeredAddress.city || ''}, ${registeredAddress.lga || ''}, ${registeredAddress.state || ''}` 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Share Capital */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-slate-100 pb-3">
              <Bank weight="duotone" className="h-5 w-5 text-indigo-500" />
              Share Capital
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Total Issued Shares</span>
                <span className="font-semibold text-slate-900">
                  {Number(shares.totalIssuedCapital || data.totalShareCapital || 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 text-xs">Primary Share Type</span>
                <span className="font-semibold text-slate-900">{primaryShareType}</span>
              </div>
            </div>
          </div>

          {/* Officers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-slate-100 pb-3">
              <Users weight="duotone" className="h-5 w-5 text-indigo-500" />
              Company Officers ({officers.length})
            </h3>
            <div className="space-y-4">
              {officers.map((officer: any, idx: number) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-900">{officer.firstName} {officer.surname}</div>
                    <div className="text-slate-500 text-xs">{officer.email}</div>
                  </div>
                  <div className="text-xs font-bold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {formatRoles(officer.roles)}
                  </div>
                </div>
              ))}
              {officers.length === 0 && <p className="text-sm text-slate-500 italic">No officers added.</p>}
            </div>
          </div>

          {/* Uploads */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-4 uppercase tracking-widest border-b border-slate-100 pb-3">
              <FilePdf weight="duotone" className="h-5 w-5 text-indigo-500" />
              Uploaded Documents
            </h3>
            {Object.keys(uploads).length > 0 ? (
              <ul className="space-y-2">
                {Object.entries(uploads).map(([key, url]) => (
                  <li key={key} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckCircle weight="fill" className="text-emerald-500 h-5 w-5" />
                      <span className="text-sm font-medium text-slate-700">{getUploadLabel(key)}</span>
                    </div>
                    <a 
                      href={url as string} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      View File
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm font-medium">
                <WarningCircle weight="fill" className="h-5 w-5" />
                No documents have been uploaded yet.
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Pricing & Payment */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <Money weight="duotone" className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Payment Summary</h3>
            </div>

            {isLoadingPricing ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
                <div className="h-8 bg-white/20 rounded w-full mt-6"></div>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                
                <div className="flex justify-between items-center text-slate-300">
                  <span>CAC Base Registration</span>
                  <span className="font-medium text-white">{formatCurrency(pricing?.baseFee || 0)}</span>
                </div>
                
                {Number(pricing?.extraSharesFee) > 0 && (
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Extra Shares Fee</span>
                    <span className="font-medium text-white">{formatCurrency(pricing?.extraSharesFee || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-300">
                  <span>Stamp Duty <span className="text-[10px] opacity-70">(0.75%)</span></span>
                  <span className="font-medium text-white">{formatCurrency(pricing?.stampDuty || 0)}</span>
                </div>

                <div className="flex justify-between items-center text-slate-300 border-b border-white/10 pb-4">
                  <span>Lumebiz Service Fee</span>
                  <span className="font-medium text-white">{formatCurrency(pricing?.serviceFee || 0)}</span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-base font-medium text-slate-200">Total Amount</span>
                  <span className="text-2xl font-black text-emerald-400">{formatCurrency(pricing?.total || 0)}</span>
                </div>

                <Button 
                  onClick={handleProceedToPayment}
                  disabled={isSubmitting || isLoadingPricing}
                  className="w-full mt-6 bg-indigo-500 hover:bg-indigo-600 text-white h-12 rounded-xl font-bold text-base transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Payment'}
                  {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" weight="bold" />}
                </Button>

                <p className="text-[11px] text-center text-slate-400 mt-4 leading-relaxed">
                  By proceeding to payment, you confirm that all details provided are accurate and true.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
