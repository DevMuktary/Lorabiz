"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle } from "@phosphor-icons/react";

export default function ComplianceStep({ data, updateData }: any) {

  const declarant = data.declarantDetails || {
    surname: "", firstName: "", accreditationNumber: "", 
    phone: "", email: "", state: "", lga: "", city: "", street: "", 
    isAcknowledged: false
  };

  const handleUpdate = (field: string, value: any) => {
    updateData((prev: any) => ({
      ...prev,
      declarantDetails: { ...declarant, [field]: value }
    }));
  };

  return (
    <div className="p-6 sm:p-10 space-y-10 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-8 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <FileText className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Statement of Compliance</h2>
            <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
              Details of the person making the statutory declaration that the requirements of the Companies and Allied Matters Act (CAMA) 2020 have been complied with.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-200">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Surname <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Doe" value={declarant.surname} onChange={e => handleUpdate("surname", e.target.value)} className="h-12 bg-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">First Name <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. Jane" value={declarant.firstName} onChange={e => handleUpdate("firstName", e.target.value)} className="h-12 bg-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Accreditation Number</Label>
            <Input placeholder="E.g. NBA/12345 (Optional if self-declaring)" value={declarant.accreditationNumber} onChange={e => handleUpdate("accreditationNumber", e.target.value)} className="h-12 bg-white" />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Phone Number <span className="text-red-500">*</span></Label>
            <Input placeholder="08012345678" value={declarant.phone} onChange={e => handleUpdate("phone", e.target.value)} className="h-12 bg-white" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Email Address <span className="text-red-500">*</span></Label>
            <Input type="email" placeholder="declarant@example.com" value={declarant.email} onChange={e => handleUpdate("email", e.target.value)} className="h-12 bg-white" />
          </div>
        </div>
      </section>

      <hr className="border-slate-100" />

      <section>
        <h3 className="text-sm font-bold text-slate-900 mb-4 border-b pb-2">Declarant Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">State <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. LAGOS" value={declarant.state} onChange={e => handleUpdate("state", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">LGA <span className="text-red-500">*</span></Label>
            <Input placeholder="Local Government Area" value={declarant.lga} onChange={e => handleUpdate("lga", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">City / Town <span className="text-red-500">*</span></Label>
            <Input placeholder="City name" value={declarant.city} onChange={e => handleUpdate("city", e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-slate-500">Street Name & Number <span className="text-red-500">*</span></Label>
            <Input placeholder="E.g. 12 Awolowo Way" value={declarant.street} onChange={e => handleUpdate("street", e.target.value)} className="h-12" />
          </div>
        </div>
      </section>

      <div 
        onClick={() => handleUpdate("isAcknowledged", !declarant.isAcknowledged)}
        className={`mt-8 p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
          declarant.isAcknowledged 
            ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10" 
            : "border-slate-200 hover:border-slate-300 bg-white"
        }`}
      >
        <p className={`text-sm font-bold leading-relaxed ${declarant.isAcknowledged ? "text-emerald-900" : "text-slate-600"}`}>
          I confirm that the requirements of the Companies and Allied Matters Act 2020 as to registration have been complied with.
        </p>
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ml-4 transition-colors ${declarant.isAcknowledged ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300 group-hover:bg-slate-200"}`}>
          <CheckCircle className="h-5 w-5" weight="bold" />
        </div>
      </div>

    </div>
  );
}
