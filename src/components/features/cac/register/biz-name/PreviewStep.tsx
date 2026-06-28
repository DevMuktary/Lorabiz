"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CompanyInfo, Proprietor, COUNTRY_CODES } from "./schema";
import { X, FilePdf, MagnifyingGlassPlus } from "@phosphor-icons/react";

// --- HELPER COMPONENT FOR CLEAN DATA DISPLAY ---
const SummaryItem = ({ label, value }: { label: string, value: any }) => (
  <div className="flex flex-col border-b border-slate-100 py-2 last:border-0">
    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</span>
    <span className="font-bold text-slate-800 text-sm break-words">{value || "-"}</span>
  </div>
);

const getFlag = (code: string | undefined) => {
  const safeCode = code || "+234";
  const country = COUNTRY_CODES.find(c => c.code === safeCode);
  return country ? country.flag : "🇳🇬";
};

export default function PreviewStep({ 
  draft, companyInfo, proprietors, setCurrentStep 
}: { 
  draft: any, companyInfo: CompanyInfo, proprietors: Proprietor[], setCurrentStep: (step: number) => void 
}) {
  const [mounted, setMounted] = useState(false);
  const [viewFullScale, setViewFullScale] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const DocumentThumbnail = ({ label, url }: { label: string, url: string | null }) => {
    if (!url) return (
      <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-red-200 bg-red-50 rounded-xl h-32">
        <span className="text-red-500 font-bold text-xs uppercase tracking-widest text-center">{label}</span>
        <span className="text-red-400 font-bold text-[10px] mt-1">Missing</span>
      </div>
    );

    const isPdf = url.toLowerCase().endsWith('.pdf');

    return (
      <div 
        onClick={() => setViewFullScale(url)}
        className="group relative flex flex-col items-center justify-center border border-slate-200 bg-slate-50 rounded-xl h-32 overflow-hidden cursor-pointer hover:border-[#ff3f7a] transition-all"
      >
        {isPdf ? (
          <div className="flex flex-col items-center justify-center text-emerald-600 gap-2">
            <FilePdf className="h-8 w-8" weight="fill" />
            <span className="font-bold text-[10px] uppercase">PDF</span>
          </div>
        ) : (
          <img src={url} alt={label} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
          <MagnifyingGlassPlus className="text-white h-6 w-6 mb-1" weight="bold" />
          <span className="text-white font-bold text-[10px] uppercase tracking-widest">View</span>
        </div>
        
        {/* Label Strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 text-center">
          <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Final Review</h2>
      
      <div className="space-y-8">
        
        {/* ==================================== COMPANY SUMMARY ==================================== */}
        <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Company Information</h3>
            <button onClick={() => setCurrentStep(1)} className="text-[#ff3f7a] font-bold text-sm hover:underline bg-[#ff3f7a]/10 px-3 py-1 rounded-lg">Edit</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <SummaryItem label="Proposed Name" value={draft.proposedName} />
            <SummaryItem label="Nature of Business" value={draft.specificNature} />
            <SummaryItem label="Commencement Date" value={companyInfo.commencementDate} />
            <SummaryItem label="Company Email" value={companyInfo.email} />
            <SummaryItem label="State of Residence" value={companyInfo.state} />
            <SummaryItem label="City" value={companyInfo.city} />
            <SummaryItem label="Street Number" value={companyInfo.streetNo} />
            <div className="md:col-span-2"><SummaryItem label="Full Street Address" value={companyInfo.address} /></div>
          </div>
        </div>

        {/* ==================================== PROPRIETORS SUMMARY ==================================== */}
        <div className="bg-slate-50 p-5 md:p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-4">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Proprietors & Documents</h3>
            <div className="flex gap-2">
              <button onClick={() => setCurrentStep(2)} className="text-blue-600 font-bold text-xs hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">Edit Info</button>
              <button onClick={() => setCurrentStep(3)} className="text-emerald-600 font-bold text-xs hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">Edit Docs</button>
            </div>
          </div>
          
          <div className="space-y-6">
            {proprietors.map((p, idx) => {
              const pCode = p.phoneCode || "+234";

              return (
                <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-black text-slate-900 mb-4 pb-2 border-b text-lg border-slate-100">
                    {idx + 1}. {p.surname} {p.firstName}
                  </h4>
                  
                  {/* Text Data */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 mb-6">
                    <SummaryItem label="Surname" value={p.surname} />
                    <SummaryItem label="First Name" value={p.firstName} />
                    <SummaryItem label="Other Name" value={p.otherName} />
                    <SummaryItem label="Email" value={p.email} />
                    <SummaryItem label="Phone" value={`${getFlag(pCode)} ${pCode} ${p.phone}`} />
                    <SummaryItem label="Gender" value={p.gender} />
                    <SummaryItem label="Date of Birth" value={p.dob} />
                    <SummaryItem label="State" value={p.state} />
                    <SummaryItem label="LGA" value={p.lga} />
                    <SummaryItem label="City" value={p.city} />
                    <SummaryItem label="Street No." value={p.streetNo} />
                    <SummaryItem label="Service Address" value={p.serviceAddress} />
                  </div>

                  {/* Documents Data */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Uploaded Documents</p>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <DocumentThumbnail label="NIN Card/Slip" url={p.documents.nin} />
                        <DocumentThumbnail label="Passport" url={p.documents.passport} />
                        <DocumentThumbnail label="Signature" url={p.documents.signature} />
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================== FULL SCALE LIGHTBOX (Teleported) ==================================== */}
      {mounted && viewFullScale && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setViewFullScale(null)} 
        >
           <button 
             onClick={(e) => { e.stopPropagation(); setViewFullScale(null); }} 
             className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 text-white bg-white/10 hover:bg-red-500 px-4 py-2 rounded-full font-bold transition-colors z-50 shadow-lg border border-white/20"
           >
             <X weight="bold" size={20} /> Close Preview
           </button>

           <div 
             className="relative w-full max-w-5xl flex flex-col items-center"
             onClick={(e) => e.stopPropagation()}
           >
              {viewFullScale.toLowerCase().endsWith('.pdf') ? (
                 <iframe src={viewFullScale} className="w-full h-[85vh] rounded-2xl bg-white shadow-2xl border-4 border-slate-800" />
              ) : (
                 <img src={viewFullScale} alt="Full Scale Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-slate-800 bg-black" />
              )}
           </div>
        </div>,
        document.body
      )}
    </div>
  );
}
