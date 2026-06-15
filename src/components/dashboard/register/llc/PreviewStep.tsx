"use client";

import { useState, useEffect } from "react";
import { CreditCard, WarningCircle, Buildings, Users, ShieldCheck, Receipt, CircleNotch } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function PreviewStep({ data, draft, onSubmit, isSubmitting }: any) {
  
  // DYNAMIC PRICING STATE
  const [pricing, setPricing] = useState<{ LLC_BASE: number; LLC_EXTRA_MILLION: number; SERVICE_CHARGE: number } | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(true);

  // Fetch Live Prices from the Database
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch("/api/pricing");
        const json = await res.json();
        if (json.success) {
          setPricing(json.data);
        }
      } catch (error) {
        console.error("Failed to load pricing.");
      } finally {
        setLoadingPricing(false);
      }
    };
    fetchPricing();
  }, []);

  const totalShares = data.shareCapital?.totalIssuedCapital || 0;
  const isElevatedCapital = totalShares > 1000000;
  
  // Calculate Totals Safely
  const baseFee = pricing?.LLC_BASE || 0;
  const extraFee = isElevatedCapital ? (pricing?.LLC_EXTRA_MILLION || 0) : 0;
  const serviceCharge = pricing?.SERVICE_CHARGE || 0;
  
  const totalAmount = baseFee + extraFee + serviceCharge;

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
      
      {/* FINAL REVIEW WARNING */}
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4">
        <WarningCircle className="h-8 w-8 text-amber-500 shrink-0" weight="fill" />
        <div>
          <h2 className="text-sm font-black text-amber-900">Final Review</h2>
          <p className="text-xs font-medium text-amber-700 mt-1 leading-relaxed">
            Please review the summary below carefully. Once submitted and paid, making changes requires a formal query resolution process with the CAC.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: DATA SUMMARY */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Company Details */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
              <Buildings className="h-5 w-5 text-slate-500" weight="duotone"/>
              <h3 className="text-sm font-bold text-slate-900">Company Information</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Approved Name</p>
                <p className="text-base font-black text-slate-900">{draft?.proposedName || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-700">{data.email || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Principal Activity</p>
                  <p className="text-sm font-bold text-slate-700">{data.principalActivity || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered Address</p>
                <p className="text-sm font-medium text-slate-700">
                  {data.registeredAddress?.houseNo} {data.registeredAddress?.street}, {data.registeredAddress?.city}, {data.registeredAddress?.state}
                </p>
              </div>
            </div>
          </div>

          {/* Officers & Capital */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" weight="duotone"/>
              <h3 className="text-sm font-bold text-slate-900">Structure & Capital</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Issued Capital</p>
                <p className="text-lg font-black text-indigo-600">₦ {totalShares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Appointed Officers</p>
                <div className="space-y-2">
                  {(data.officers || []).map((o: any) => (
                    <div key={o.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg px-3">
                      <p className="text-sm font-bold text-slate-700">{o.firstName} {o.surname}</p>
                      <p className="text-xs font-bold text-slate-500">{o.roles.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CHECKOUT SUMMARY */}
        <div className="lg:col-span-1">
          <div className="border-2 border-indigo-100 rounded-2xl overflow-hidden bg-white shadow-xl sticky top-24">
            <div className="bg-indigo-600 px-5 py-4 flex items-center gap-2 text-white">
              <Receipt className="h-6 w-6" weight="duotone"/>
              <h3 className="text-base font-black">Checkout Summary</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {loadingPricing ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                  <CircleNotch className="h-8 w-8 animate-spin mb-2" weight="bold" />
                  <p className="text-xs font-bold uppercase tracking-widest">Loading Live Pricing...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-500">LLC Registration (Base)</p>
                    <p className="text-sm font-black text-slate-900">₦{baseFee.toLocaleString()}</p>
                  </div>

                  {/* DYNAMIC ELEVATED CAPITAL FEE */}
                  {isElevatedCapital && (
                    <div className="flex justify-between items-center animate-in fade-in">
                      <div>
                        <p className="text-sm font-bold text-slate-500">Elevated Capital Fee</p>
                        <p className="text-[10px] font-bold text-indigo-500">Shares > 1,000,000</p>
                      </div>
                      <p className="text-sm font-black text-slate-900">₦{extraFee.toLocaleString()}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-500">Agency Service Charge</p>
                    <p className="text-sm font-black text-slate-900">₦{serviceCharge.toLocaleString()}</p>
                  </div>

                  <hr className="border-slate-200 border-dashed" />

                  <div className="flex justify-between items-center">
                    <p className="text-lg font-black text-slate-900">Total Amount</p>
                    <p className="text-2xl font-black text-indigo-600">₦{totalAmount.toLocaleString()}</p>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={onSubmit}
                      disabled={isSubmitting || !pricing}
                      className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-base shadow-[0_4px_14px_rgba(5,150,105,0.3)] flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      {isSubmitting ? (
                         <CircleNotch className="animate-spin h-6 w-6" weight="bold" />
                      ) : (
                         <><CreditCard className="h-6 w-6" weight="fill" /> Pay & Submit Application</>
                      )}
                    </Button>
                    <p className="text-[10px] font-bold text-center text-slate-400 mt-3 uppercase tracking-widest flex items-center justify-center gap-1">
                      <ShieldCheck className="h-4 w-4" weight="fill" /> SECURE ENCRYPTED PAYMENT
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
