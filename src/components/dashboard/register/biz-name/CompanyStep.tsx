"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CompanyInfo, NIGERIA_DATA, isValidEmail } from "./schema";

export default function CompanyStep({ 
  draft, companyInfo, setCompanyInfo 
}: { 
  draft: any, companyInfo: CompanyInfo, setCompanyInfo: (c: CompanyInfo) => void 
}) {
  return (
    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <h2 className="text-2xl font-black text-slate-900 mb-6 border-b pb-4">Company Details</h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <Label>Business Name</Label>
            <div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl font-bold uppercase text-slate-500 cursor-not-allowed">
              {draft.proposedName}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Nature of Business</Label>
            <div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-500 cursor-not-allowed">
              {draft.specificNature}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <Label>Company Email <span className="text-red-500">*</span></Label>
            <Input type="email" value={companyInfo.email} onChange={e => setCompanyInfo({...companyInfo, email: e.target.value})} className="h-12" />
            {companyInfo.email.length > 0 && !isValidEmail(companyInfo.email) && <p className="text-red-500 text-xs font-bold mt-1">Invalid email format</p>}
          </div>
          <div className="space-y-1">
            <Label>Commencement Date <span className="text-red-500">*</span></Label>
            <Input type="date" value={companyInfo.commencementDate} onChange={e => setCompanyInfo({...companyInfo, commencementDate: e.target.value})} className="h-12" />
            {!companyInfo.commencementDate && <p className="text-red-500 text-xs font-bold mt-1">Required</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <Label>State of Residence <span className="text-red-500">*</span></Label>
            <select value={companyInfo.state} onChange={e => setCompanyInfo({...companyInfo, state: e.target.value})} className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus:border-[#ff3f7a] focus:ring-1 outline-none">
              <option value="">Select State</option>
              {NIGERIA_DATA.map(s => <option key={s.state} value={s.state}>{s.state}</option>)}
            </select>
            {!companyInfo.state && <p className="text-red-500 text-xs font-bold mt-1">Required</p>}
          </div>
          <div className="space-y-1">
            <Label>City <span className="text-red-500">*</span></Label>
            <Input value={companyInfo.city} onChange={e => setCompanyInfo({...companyInfo, city: e.target.value})} className="h-12" />
            {!companyInfo.city && <p className="text-red-500 text-xs font-bold mt-1">Required</p>}
          </div>
          <div className="space-y-1">
            <Label>Street Number <span className="text-red-500">*</span></Label>
            <Input value={companyInfo.streetNo} onChange={e => setCompanyInfo({...companyInfo, streetNo: e.target.value})} className="h-12" />
            {!companyInfo.streetNo && <p className="text-red-500 text-xs font-bold mt-1">Required</p>}
          </div>
        </div>

        <div className="space-y-1">
          <Label>Full Street Address <span className="text-red-500">*</span></Label>
          <Input placeholder="E.g. 12 Awolowo Way, Ikeja" value={companyInfo.address} onChange={e => setCompanyInfo({...companyInfo, address: e.target.value})} className="h-12" />
          {!companyInfo.address && <p className="text-red-500 text-xs font-bold mt-1">Required</p>}
        </div>
      </div>
    </div>
  );
}
