"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WarningCircle, CaretDown, CheckCircle } from "@phosphor-icons/react";
import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";

export default function CompanyDetailsStep({ data, updateData, draft, showErrors }: any) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const getError = (fieldKey: string, value: string, type: "text" | "email" = "text") => {
    if (!touched[fieldKey] && !showErrors) return null;
    
    if (!value || !value.trim()) {
      return "This field is required.";
    }
    
    if (type === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Please enter a valid email address.";
      }
    }
    return null; 
  };

  const handleBlur = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleAddressChange = (field: string, value: string, isHeadOffice = false) => {
    const target = isHeadOffice ? "headOfficeAddress" : "registeredAddress";
    
    updateData((prev: any) => {
      let newData = { ...prev };
      
      // Update the specific field
      if (field === "state") {
        newData[target] = { ...newData[target], state: value, lga: "" };
      } else {
        newData[target] = { ...newData[target], [field]: value };
      }

      // UX MAGIC: 
      // If they edit the Head Office manually, break the link.
      if (isHeadOffice) {
        newData.headOfficeSameAsRegistered = false;
      } 
      // If they edit Registered Address and it's still linked, live-update the Head Office!
      else if (newData.headOfficeSameAsRegistered) {
        newData.headOfficeAddress = { ...newData.registeredAddress };
      }

      return newData;
    });
  };

  const handleToggleSameAsRegistered = () => {
    const isNowSame = !data.headOfficeSameAsRegistered;
    
    if (isNowSame) {
      // Instantly copy data from Registered to Head Office
      updateData({
        ...data,
        headOfficeSameAsRegistered: true,
        headOfficeAddress: { ...data.registeredAddress }
      });
      // Clear head office errors since we are copying valid data
      setTouched(p => ({
        ...p, hoState: false, hoLga: false, hoCity: false, hoHouse: false, hoStreet: false
      }));
    } else {
      // Just uncheck it, leave the data there so they can edit it
      updateData({ ...data, headOfficeSameAsRegistered: false });
    }
  };

  const states = Object.keys(NIGERIA_STATES_LGA).sort();
  const getLgasForState = (stateName: string) => NIGERIA_STATES_LGA[stateName] || [];

  const ErrorMessage = ({ msg }: { msg: string | null }) => {
    if (!msg) return null;
    return (
      <div className="text-[11px] font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1.5 mt-2 border border-red-100 animate-in fade-in slide-in-from-top-1">
        <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {msg}
      </div>
    );
  };

  // Run validators
  const errEmail = getError("email", data.email, "email");
  const errDesc = getError("desc", data.description);
  const errRegState = getError("regState", data.registeredAddress.state);
  const errRegLga = getError("regLga", data.registeredAddress.lga);
  const errRegCity = getError("regCity", data.registeredAddress.city);
  const errRegHouse = getError("regHouse", data.registeredAddress.houseNo);
  const errRegStreet = getError("regStreet", data.registeredAddress.street);

  const errHoState = getError("hoState", data.headOfficeAddress.state);
  const errHoLga = getError("hoLga", data.headOfficeAddress.lga);
  const errHoCity = getError("hoCity", data.headOfficeAddress.city);
  const errHoHouse = getError("hoHouse", data.headOfficeAddress.houseNo);
  const errHoStreet = getError("hoStreet", data.headOfficeAddress.street);

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500 w-full overflow-hidden">
      
      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Company Information</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Provide the primary contact and operational details for this company.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Approved Company Name</Label>
            <div className="relative">
              <Input value={draft?.proposedName || ""} disabled className="h-12 bg-slate-50 font-black text-slate-900 border-slate-200 pr-10" />
              <CheckCircle className="absolute right-4 top-3.5 h-5 w-5 text-emerald-500" weight="fill" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errEmail ? "text-red-500" : "text-slate-500"}`}>Company Email <span className="text-red-500">*</span></Label>
            <Input 
              id="field-email"
              placeholder="hello@company.com" 
              value={data.email} 
              onChange={e => { updateData({...data, email: e.target.value}); setTouched(p => ({...p, email: true})); }}
              onBlur={() => handleBlur("email")}
              className={`h-12 font-bold transition-all ${errEmail ? "border-red-500 focus:ring-red-500 bg-red-50/30" : data.email && !errEmail ? "border-emerald-200 bg-emerald-50/10 focus:ring-emerald-500" : ""}`} 
            />
            <ErrorMessage msg={errEmail} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className={`text-xs font-bold uppercase ${errDesc ? "text-red-500" : "text-slate-500"}`}>Description of Business Activity <span className="text-red-500">*</span></Label>
            <textarea 
              id="field-desc"
              rows={3} placeholder="Briefly describe what this company will be doing..."
              value={data.description} 
              onChange={e => { updateData({...data, description: e.target.value}); setTouched(p => ({...p, desc: true})); }}
              onBlur={() => handleBlur("desc")}
              className={`w-full p-4 border rounded-xl font-bold text-sm outline-none resize-none transition-all ${errDesc ? "border-red-500 focus:ring-2 focus:ring-red-500 bg-red-50/30" : "border-slate-200 focus:ring-2 focus:ring-indigo-500"}`}
            />
            <ErrorMessage msg={errDesc} />
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      <section>
        <div className="mb-6">
          <h2 className="text-xl font-black text-slate-900">Registered Office Address</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">This is the official legal address of the company in Nigeria.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errRegState ? "text-red-500" : "text-slate-500"}`}>State <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                id="field-regState"
                value={data.registeredAddress.state} 
                onChange={e => { handleAddressChange("state", e.target.value); setTouched(p => ({...p, regState: true})); }}
                onBlur={() => handleBlur("regState")}
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errRegState ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
              >
                <option value="">-- Select State --</option>
                {states.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errRegState} />
          </div>
          
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errRegLga ? "text-red-500" : "text-slate-500"}`}>LGA <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                id="field-regLga"
                value={data.registeredAddress.lga} 
                disabled={!data.registeredAddress.state}
                onChange={e => { handleAddressChange("lga", e.target.value); setTouched(p => ({...p, regLga: true})); }}
                onBlur={() => handleBlur("regLga")}
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!data.registeredAddress.state ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60" : errRegLga ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
              >
                <option value="">-- Select LGA --</option>
                {getLgasForState(data.registeredAddress.state).map(lga => <option key={lga} value={lga}>{lga}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errRegLga} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errRegCity ? "text-red-500" : "text-slate-500"}`}>City / Town / Village <span className="text-red-500">*</span></Label>
            <Input id="field-regCity" placeholder="City name" value={data.registeredAddress.city} onChange={e => { handleAddressChange("city", e.target.value); setTouched(p => ({...p, regCity: true})); }} onBlur={() => handleBlur("regCity")} className={`h-12 font-bold ${errRegCity ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errRegCity} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Postal Code (Optional)</Label>
            <Input placeholder="E.g. 100001" value={data.registeredAddress.postCode} onChange={e => handleAddressChange("postCode", e.target.value)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errRegHouse ? "text-red-500" : "text-slate-500"}`}>House No. / Building Name <span className="text-red-500">*</span></Label>
            <Input id="field-regHouse" placeholder="E.g. 12 or Block B" value={data.registeredAddress.houseNo} onChange={e => { handleAddressChange("houseNo", e.target.value); setTouched(p => ({...p, regHouse: true})); }} onBlur={() => handleBlur("regHouse")} className={`h-12 font-bold ${errRegHouse ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errRegHouse} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errRegStreet ? "text-red-500" : "text-slate-500"}`}>Street Name <span className="text-red-500">*</span></Label>
            <Input id="field-regStreet" placeholder="E.g. Awolowo Way" value={data.registeredAddress.street} onChange={e => { handleAddressChange("street", e.target.value); setTouched(p => ({...p, regStreet: true})); }} onBlur={() => handleBlur("regStreet")} className={`h-12 font-bold ${errRegStreet ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errRegStreet} />
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* SECTION 3: HEAD OFFICE ADDRESS (ALWAYS VISIBLE NOW) */}
      <section>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">Head Office Address</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Where are the day-to-day operations managed?</p>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
            <span className="text-sm font-bold text-slate-700">Same as Registered Address?</span>
            <div className="relative shrink-0">
              <input 
                type="checkbox" className="sr-only" 
                checked={data.headOfficeSameAsRegistered}
                onChange={handleToggleSameAsRegistered}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${data.headOfficeSameAsRegistered ? "bg-indigo-500" : "bg-slate-300"}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${data.headOfficeSameAsRegistered ? "translate-x-4" : ""}`}></div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errHoState ? "text-red-500" : "text-slate-500"}`}>State <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                id="field-hoState"
                value={data.headOfficeAddress.state} 
                onChange={e => { handleAddressChange("state", e.target.value, true); setTouched(p => ({...p, hoState: true})); }}
                onBlur={() => handleBlur("hoState")}
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${errHoState ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
              >
                <option value="">-- Select State --</option>
                {states.map(state => <option key={state} value={state}>{state}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errHoState} />
          </div>
          
          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errHoLga ? "text-red-500" : "text-slate-500"}`}>LGA <span className="text-red-500">*</span></Label>
            <div className="relative">
              <select 
                id="field-hoLga"
                value={data.headOfficeAddress.lga} 
                disabled={!data.headOfficeAddress.state}
                onChange={e => { handleAddressChange("lga", e.target.value, true); setTouched(p => ({...p, hoLga: true})); }}
                onBlur={() => handleBlur("hoLga")}
                className={`w-full h-12 px-4 appearance-none border rounded-xl text-sm font-bold outline-none transition-colors ${!data.headOfficeAddress.state ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60" : errHoLga ? "border-red-500 bg-red-50 text-red-900" : "border-slate-200 bg-white text-slate-900 focus:border-indigo-500"}`}
              >
                <option value="">-- Select LGA --</option>
                {getLgasForState(data.headOfficeAddress.state).map(lga => <option key={lga} value={lga}>{lga}</option>)}
              </select>
              <CaretDown className="absolute right-4 top-3.5 h-5 w-5 text-slate-400 pointer-events-none" weight="bold" />
            </div>
            <ErrorMessage msg={errHoLga} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errHoCity ? "text-red-500" : "text-slate-500"}`}>City / Town / Village <span className="text-red-500">*</span></Label>
            <Input id="field-hoCity" placeholder="City name" value={data.headOfficeAddress.city} onChange={e => { handleAddressChange("city", e.target.value, true); setTouched(p => ({...p, hoCity: true})); }} onBlur={() => handleBlur("hoCity")} className={`h-12 font-bold ${errHoCity ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errHoCity} />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Postal Code (Optional)</Label>
            <Input placeholder="E.g. 100001" value={data.headOfficeAddress.postCode} onChange={e => handleAddressChange("postCode", e.target.value, true)} className="h-12 font-bold" />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errHoHouse ? "text-red-500" : "text-slate-500"}`}>House No. / Building Name <span className="text-red-500">*</span></Label>
            <Input id="field-hoHouse" placeholder="E.g. 12 or Block B" value={data.headOfficeAddress.houseNo} onChange={e => { handleAddressChange("houseNo", e.target.value, true); setTouched(p => ({...p, hoHouse: true})); }} onBlur={() => handleBlur("hoHouse")} className={`h-12 font-bold ${errHoHouse ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errHoHouse} />
          </div>

          <div className="space-y-2">
            <Label className={`text-xs font-bold uppercase ${errHoStreet ? "text-red-500" : "text-slate-500"}`}>Street Name <span className="text-red-500">*</span></Label>
            <Input id="field-hoStreet" placeholder="E.g. Awolowo Way" value={data.headOfficeAddress.street} onChange={e => { handleAddressChange("street", e.target.value, true); setTouched(p => ({...p, hoStreet: true})); }} onBlur={() => handleBlur("hoStreet")} className={`h-12 font-bold ${errHoStreet ? "border-red-500 bg-red-50/30" : ""}`} />
            <ErrorMessage msg={errHoStreet} />
          </div>
        </div>
      </section>

    </div>
  );
}
