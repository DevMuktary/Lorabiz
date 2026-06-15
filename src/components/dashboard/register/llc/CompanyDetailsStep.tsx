"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CompanyDetailsStep({ data, updateData, draft }: any) {
  
  const handleAddressChange = (field: string, value: string, isHeadOffice = false) => {
    const target = isHeadOffice ? "headOfficeAddress" : "registeredAddress";
    updateData((prev: any) => ({
      ...prev,
      [target]: { ...prev[target], [field]: value }
    }));
  };

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
      
      {/* SECTION 1: CORE DETAILS */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Company Information</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Provide the primary contact and operational details for this company.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Approved Company Name</Label>
            <Input value={draft?.proposedName || ""} disabled className="h-12 bg-slate-50 font-black text-slate-900 border-slate-200" />
            <p className="text-xs text-slate-400 font-medium">This name has passed compliance checks and cannot be edited here.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Company Email <span className="text-red-500">*</span></Label>
            <Input 
              type="email" placeholder="hello@company.com" 
              value={data.email} onChange={e => updateData({...data, email: e.target.value})}
              className="h-12 font-medium" 
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Description of Business Activity <span className="text-red-500">*</span></Label>
            <textarea 
              rows={3}
              placeholder="Briefly describe what this company will be doing..."
              value={data.description} onChange={e => updateData({...data, description: e.target.value})}
              className="w-full p-4 border rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none border-slate-200 resize-none"
            />
            <p className="text-xs text-slate-400 font-medium">Keep it simple. E.g., "General trading and logistics services."</p>
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SECTION 2: REGISTERED ADDRESS */}
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Registered Office Address</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">This is the official legal address of the company in Nigeria.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">State <span className="text-red-500">*</span></Label>
            {/* TODO: Swap with your custom searchable dropdown component for states */}
            <Input placeholder="E.g. LAGOS" value={data.registeredAddress.state} onChange={e => handleAddressChange("state", e.target.value)} className="h-12" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">LGA <span className="text-red-500">*</span></Label>
            <Input placeholder="Local Government Area" value={data.registeredAddress.lga} onChange={e => handleAddressChange("lga", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">City / Town / Village <span className="text-red-500">*</span></Label>
            <Input placeholder="City name" value={data.registeredAddress.city} onChange={e => handleAddressChange("city", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Postal Code</Label>
            <Input placeholder="Optional" value={data.registeredAddress.postCode} onChange={e => handleAddressChange("postCode", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">House No. / Building Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. 12 or Block B" value={data.registeredAddress.houseNo} onChange={e => handleAddressChange("houseNo", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Street Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Awolowo Way" value={data.registeredAddress.street} onChange={e => handleAddressChange("street", e.target.value)} className="h-12" />
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SECTION 3: HEAD OFFICE ADDRESS */}
      <section>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Head Office Address</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Where are the day-to-day operations managed?</p>
          </div>
          
          {/* Custom Toggle Switch */}
          <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-sm font-bold text-slate-700">Same as Registered Address?</span>
            <div className="relative">
              <input 
                type="checkbox" className="sr-only" 
                checked={data.headOfficeSameAsRegistered}
                onChange={() => updateData({...data, headOfficeSameAsRegistered: !data.headOfficeSameAsRegistered})}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${data.headOfficeSameAsRegistered ? "bg-indigo-500" : "bg-slate-300"}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${data.headOfficeSameAsRegistered ? "translate-x-4" : ""}`}></div>
            </div>
          </label>
        </div>

        {!data.headOfficeSameAsRegistered && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
            {/* Same address fields, mapped to handleAddressChange(..., true) */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">State <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. LAGOS" value={data.headOfficeAddress.state} onChange={e => handleAddressChange("state", e.target.value, true)} className="h-12" />
            </div>
            {/* Add remaining LGA, City, Street inputs here pointing to headOfficeAddress */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Street Name <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Awolowo Way" value={data.headOfficeAddress.street} onChange={e => handleAddressChange("street", e.target.value, true)} className="h-12" />
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
