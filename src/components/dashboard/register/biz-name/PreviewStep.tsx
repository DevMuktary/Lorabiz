"use client";

import { CompanyInfo, Proprietor } from "./schema";

export default function PreviewStep({ 
  draft, companyInfo, proprietors, setCurrentStep 
}: { 
  draft: any, companyInfo: CompanyInfo, proprietors: Proprietor[], setCurrentStep: (step: number) => void 
}) {
  return (
    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Final Review</h2>
      
      <div className="space-y-6">
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Company</h3>
            <button onClick={() => setCurrentStep(1)} className="text-[#ff3f7a] font-bold text-sm hover:underline">Edit</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-xs">Name</p><p className="font-bold text-slate-900">{draft.proposedName}</p></div>
            <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-xs">Nature</p><p className="font-bold text-slate-900">{draft.specificNature}</p></div>
            <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-xs">Address</p><p className="font-bold text-slate-900">{companyInfo.address}, {companyInfo.state}</p></div>
            <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-xs">Email</p><p className="font-bold text-slate-900">{companyInfo.email}</p></div>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Proprietors ({proprietors.length})</h3>
            <button onClick={() => setCurrentStep(2)} className="text-[#ff3f7a] font-bold text-sm hover:underline">Edit</button>
          </div>
          {proprietors.map((p, idx) => (
            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 mb-3 shadow-sm">
              <p className="font-black text-slate-900 mb-2">{idx + 1}. {p.surname} {p.firstName}</p>
              <div className="flex flex-wrap gap-6 text-sm">
                <div><p className="text-slate-400 font-bold uppercase text-xs">Phone</p><p className="font-bold text-slate-700">{p.phone}</p></div>
                <div><p className="text-slate-400 font-bold uppercase text-xs">Location</p><p className="font-bold text-slate-700">{p.city}, {p.state}</p></div>
                <div>
                  <p className="text-slate-400 font-bold uppercase text-xs">Docs</p>
                  <p className="font-bold text-emerald-600">
                    {p.documents.nin && p.documents.passport && p.documents.signature ? "Complete ✅" : <span className="text-red-500">Missing ❌</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
