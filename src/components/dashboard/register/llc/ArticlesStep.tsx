"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Info } from "@phosphor-icons/react";

export default function ArticlesStep({ data, updateData }: any) {

  const handleWitnessChange = (field: string, value: string) => {
    updateData((prev: any) => ({
      ...prev,
      witnessDetails: {
        ...(prev.witnessDetails || {}),
        [field]: value
      }
    }));
  };

  const witness = data.witnessDetails || {};

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
      
      {/* SECTION 1: ARTICLES SELECTION */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Articles of Association</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            These are the internal rules and regulations of your company.
          </p>
        </div>

        <div 
          onClick={() => updateData({ ...data, useDefaultArticles: true })}
          className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
            data.useDefaultArticles 
              ? "border-indigo-500 bg-indigo-50 ring-4 ring-indigo-500/10" 
              : "border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`font-bold text-lg ${data.useDefaultArticles ? "text-indigo-900" : "text-slate-900"}`}>
                Adopt Default Articles (Recommended)
              </h3>
              <p className={`text-sm mt-2 leading-relaxed ${data.useDefaultArticles ? "text-indigo-700" : "text-slate-500"}`}>
                Automatically apply the standard Articles of Association provided by the Companies and Allied Matters Act (CAMA) 2020. This is the safest and fastest option for standard private companies.
              </p>
            </div>
            {data.useDefaultArticles && (
              <CheckCircle className="h-8 w-8 text-indigo-500 shrink-0 ml-4" weight="fill" />
            )}
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SECTION 2: WITNESS DETAILS */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Details of Witness</h2>
          <div className="flex items-start gap-2 mt-2 bg-amber-50 p-3 rounded-xl border border-amber-200">
            <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" weight="fill" />
            <p className="text-xs font-medium text-amber-800 leading-relaxed">
              Legal requirement: The signing of the Articles must be witnessed by a third party who is at least 18 years old. <span className="font-bold">The witness cannot be a director or shareholder of this company.</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Surname <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Doe" value={witness.surname || ""} onChange={e => handleWitnessChange("surname", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">First Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. John" value={witness.firstName || ""} onChange={e => handleWitnessChange("firstName", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Other Name (Optional)</Label>
            <Input value={witness.otherName || ""} onChange={e => handleWitnessChange("otherName", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Date of Birth <span className="text-red-500">*</span></Label>
            <Input type="date" value={witness.dob || ""} onChange={e => handleWitnessChange("dob", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Gender <span className="text-red-500">*</span></Label>
            <select 
              className="w-full h-12 px-4 border border-slate-200 rounded-xl text-sm font-medium bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              value={witness.gender || ""} 
              onChange={e => handleWitnessChange("gender", e.target.value)}
            >
              <option value="">-- Select Gender --</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Occupation <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Teacher, Engineer" value={witness.occupation || ""} onChange={e => handleWitnessChange("occupation", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Phone Number <span className="text-red-500">*</span></Label>
            <div className="flex">
              <span className="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm font-bold text-slate-500">+234</span>
              <Input placeholder="8012345678" value={witness.phone || ""} onChange={e => handleWitnessChange("phone", e.target.value)} className="h-12 rounded-l-none" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Email Address <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="witness@example.com" value={witness.email || ""} onChange={e => handleWitnessChange("email", e.target.value)} className="h-12" />
          </div>

          {/* WITNESS ADDRESS */}
          <div className="md:col-span-2 mt-4">
             <h3 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Witness Residential Address</h3>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">State <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. LAGOS" value={witness.state || ""} onChange={e => handleWitnessChange("state", e.target.value)} className="h-12" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">LGA <span className="text-red-500">*</span></Label>
            <Input placeholder="Local Government Area" value={witness.lga || ""} onChange={e => handleWitnessChange("lga", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Full Street Address <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. 12 Awolowo Way, Ikeja" value={witness.street || ""} onChange={e => handleWitnessChange("street", e.target.value)} className="h-12" />
          </div>

        </div>
      </section>
    </div>
  );
}
