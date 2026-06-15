"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WarningCircle, CaretDown } from "@phosphor-icons/react";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";

export default function CompanyDetailsStep({ data, updateData, draft, showErrors }: any) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleAddressChange = (field: string, value: string, isHeadOffice = false) => {
    const target = isHeadOffice ? "headOfficeAddress" : "registeredAddress";
    
    // Auto-reset LGA if State changes to prevent invalid State/LGA combos
    if (field === "state") {
      updateData((prev: any) => ({
        ...prev,
        [target]: { ...prev[target], state: value, lga: "" }
      }));
    } else {
      updateData((prev: any) => ({
        ...prev,
        [target]: { ...prev[target], [field]: value }
      }));
    }
  };

  // Helper function to check if a field has an error (either explicitly touched or "Next" was clicked)
  const hasError = (value: string, fieldKey: string) => {
    return (touched[fieldKey] || showErrors) && !value?.trim();
  };

  const states = Object.keys(NIGERIA_STATES_LGA).sort();
  const getLgasForState = (stateName: string) => NIGERIA_STATES_LGA[stateName] || [];

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
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${hasError(data.email, "email") ? "text-red-500" : "text-slate-500"}`}>Company Email <span className="text-red-500">*</span></Label>
            <Input 
              type="email" placeholder="hello@company.com" 
              value={data.email} 
              onChange={e => updateData({...data, email: e.target.value})}
              onBlur={() => handleBlur("email")}
              className={`h-12 font-medium ${hasError(data.email, "email") ? "border-red-500 focus:ring-red-500" : ""}`} 
            />
            {hasError(data.email, "email") && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><WarningCircle weight="fill" /> Email is required</p>}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className={`text-xs font-bold uppercase ${hasError(data.description, "desc") ? "text-red-500" : "text-slate-500"}`}>Description of Business Activity <span className="text-red-500">*</span></Label>
            <textarea 
              rows={3} placeholder="Briefly describe what this company will be doing..."
              value={data.description} 
              onChange={e => updateData({...data, description: e.target.value})}
              onBlur={() => handleBlur("desc")}
              className={`w-full p-4 border rounded-xl font-medium text-sm outline-none resize-none transition-colors ${hasError(data.description, "desc") ? "border-red-500 focus:ring-2 focus:ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-indigo-500"}`}
            />
            {hasError(data.description, "desc") && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><WarningCircle weight="fill" /> Description is required</p>}
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
            <Label className={`text-xs font-bold uppercase ${hasError(data.registeredAddress.state, "regState") ? "text-red-500" : "text-slate-500"}`}>State <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                value={data.registeredAddress.state} 
                onChange={e => handleAddressChange("state", e.target.value)}
                onBlur={() => handleBlur("regState")}
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${hasError(data.registeredAddress.state, "regState") ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
              >
                <option value="">-- Select State --</option>
                {states.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
            {hasError(data.registeredAddress.state, "regState") && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><WarningCircle weight="fill" /> State is required</p>}
          </div>
          
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${hasError(data.registeredAddress.lga, "regLga") ? "text-red-500" : "text-slate-500"}`}>LGA <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                value={data.registeredAddress.lga} 
                disabled={!data.registeredAddress.state}
                onChange={e => handleAddressChange("lga", e.target.value)}
                onBlur={() => handleBlur("regLga")}
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!data.registeredAddress.state ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60" : hasError(data.registeredAddress.lga, "regLga") ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
              >
                <option value="">-- Select LGA --</option>
                {getLgasForState(data.registeredAddress.state).map(lga => <option key={lga} value={lga}>{lga}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
            {hasError(data.registeredAddress.lga, "regLga") && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><WarningCircle weight="fill" /> LGA is required</p>}
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${hasError(data.registeredAddress.city, "regCity") ? "text-red-500" : "text-slate-500"}`}>City / Town / Village <span className="text-red-500">*</span></Label>
            <Input placeholder="City name" value={data.registeredAddress.city} onChange={e => handleAddressChange("city", e.target.value)} onBlur={() => handleBlur("regCity")} className={`h-12 ${hasError(data.registeredAddress.city, "regCity") ? "border-red-500" : ""}`} />
            {hasError(data.registeredAddress.city, "regCity") && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><WarningCircle weight="fill" /> City is required</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Postal Code (Optional)</Label>
            <Input placeholder="E.g. 100001" value={data.registeredAddress.postCode} onChange={e => handleAddressChange("postCode", e.target.value)} className="h-12" />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${hasError(data.registeredAddress.houseNo, "regHouse") ? "text-red-500" : "text-slate-500"}`}>House No. / Building Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. 12 or Block B" value={data.registeredAddress.houseNo} onChange={e => handleAddressChange("houseNo", e.target.value)} onBlur={() => handleBlur("regHouse")} className={`h-12 ${hasError(data.registeredAddress.houseNo, "regHouse") ? "border-red-500" : ""}`} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${hasError(data.registeredAddress.street, "regStreet") ? "text-red-500" : "text-slate-500"}`}>Street Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Awolowo Way" value={data.registeredAddress.street} onChange={e => handleAddressChange("street", e.target.value)} onBlur={() => handleBlur("regStreet")} className={`h-12 ${hasError(data.registeredAddress.street, "regStreet") ? "border-red-500" : ""}`} />
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
          
          <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
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
            
            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${hasError(data.headOfficeAddress.state, "hoState") ? "text-red-500" : "text-slate-500"}`}>State <span className="text-red-500">*</span></Label>
              <div className="relative">
                <select 
                  value={data.headOfficeAddress.state} 
                  onChange={e => handleAddressChange("state", e.target.value, true)}
                  onBlur={() => handleBlur("hoState")}
                  className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${hasError(data.headOfficeAddress.state, "hoState") ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
                >
                  <option value="">-- Select State --</option>
                  {states.map(state => <option key={state} value={state}>{state}</option>)}
                </select>
                <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${hasError(data.headOfficeAddress.lga, "hoLga") ? "text-red-500" : "text-slate-500"}`}>LGA <span className="text-red-500">*</span></Label>
              <div className="relative">
                <select 
                  value={data.headOfficeAddress.lga} 
                  disabled={!data.headOfficeAddress.state}
                  onChange={e => handleAddressChange("lga", e.target.value, true)}
                  onBlur={() => handleBlur("hoLga")}
                  className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!data.headOfficeAddress.state ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60" : hasError(data.headOfficeAddress.lga, "hoLga") ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
                >
                  <option value="">-- Select LGA --</option>
                  {getLgasForState(data.headOfficeAddress.state).map(lga => <option key={lga} value={lga}>{lga}</option>)}
                </select>
                <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${hasError(data.headOfficeAddress.city, "hoCity") ? "text-red-500" : "text-slate-500"}`}>City / Town / Village <span className="text-red-500">*</span></Label>
              <Input placeholder="City name" value={data.headOfficeAddress.city} onChange={e => handleAddressChange("city", e.target.value, true)} onBlur={() => handleBlur("hoCity")} className={`h-12 ${hasError(data.headOfficeAddress.city, "hoCity") ? "border-red-500" : ""}`} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Postal Code (Optional)</Label>
              <Input placeholder="E.g. 100001" value={data.headOfficeAddress.postCode} onChange={e => handleAddressChange("postCode", e.target.value, true)} className="h-12" />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${hasError(data.headOfficeAddress.houseNo, "hoHouse") ? "text-red-500" : "text-slate-500"}`}>House No. / Building Name <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. 12 or Block B" value={data.headOfficeAddress.houseNo} onChange={e => handleAddressChange("houseNo", e.target.value, true)} onBlur={() => handleBlur("hoHouse")} className={`h-12 ${hasError(data.headOfficeAddress.houseNo, "hoHouse") ? "border-red-500" : ""}`} />
            </div>

            <div className="space-y-2">
              <Label className={`text-xs font-bold uppercase ${hasError(data.headOfficeAddress.street, "hoStreet") ? "text-red-500" : "text-slate-500"}`}>Street Name <span className="text-red-500">*</span></Label>
              <Input placeholder="E.g. Awolowo Way" value={data.headOfficeAddress.street} onChange={e => handleAddressChange("street", e.target.value, true)} onBlur={() => handleBlur("hoStreet")} className={`h-12 ${hasError(data.headOfficeAddress.street, "hoStreet") ? "border-red-500" : ""}`} />
            </div>
          </div>
        )}
      </section>

    </div>
  );
}
