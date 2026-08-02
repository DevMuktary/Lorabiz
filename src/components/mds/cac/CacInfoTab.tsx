"use client";

import { FileText, PieChart, Scale, UserPlus, CheckCircle, MapPin } from "lucide-react";
import { Section, DataBlock, AddressBreakdown, parseJsonSafe } from "./CacShared";

export default function CacInfoTab({ ticket, isLlc }: { ticket: any, isLlc: boolean }) {
  const companyEmail = ticket.email || ticket.companyEmail || "Not Provided";
  const categoryLabel = isLlc ? ticket.principalActivity : ticket.category;
  const specificObjLabel = isLlc ? ticket.specificActivity : ticket.specificNature;
  
  // Format Addresses strictly for the Breakdown Grid
  const registeredAddressObj = isLlc 
    ? parseJsonSafe(ticket.registeredAddress, null) 
    : { street: ticket.companyAddress || ticket.companyStreetNo, city: ticket.companyCity, state: ticket.companyState };
  
  const headOfficeAddressObj = isLlc && ticket.headOfficeAddress 
    ? parseJsonSafe(ticket.headOfficeAddress, null) 
    : null;

  const shareClassesData = isLlc ? parseJsonSafe(ticket.shareClasses, []) : [];
  const customArticlesData = isLlc ? parseJsonSafe(ticket.customArticles, []) : [];
  const declarant = isLlc ? parseJsonSafe(ticket.declarantDetails, null) : null;
  const witness = isLlc ? parseJsonSafe(ticket.witnessDetails, null) : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
      
      <Section title="Proposed Names & Core Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DataBlock label="Option 1 (Primary)" value={ticket.proposedName} highlight />
          <DataBlock label="Option 2" value={ticket.altName1} />
          <DataBlock label="Option 3" value={ticket.altName2} />
          <DataBlock label="Company Email" value={companyEmail} />
          {!isLlc && ticket.commencementDate && <DataBlock label="Commencement Date" value={ticket.commencementDate} />}
        </div>
      </Section>

      <Section title="Classification & Objectives">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DataBlock label="Business Category" value={categoryLabel} />
          <DataBlock label="Specific Objective" value={specificObjLabel} />
          
          {ticket.description && (
            <div className="md:col-span-2">
              <DataBlock label="Nature of Business / Detailed Description" value={ticket.description} />
            </div>
          )}
        </div>

        {isLlc && ticket.memorandumObjects && ticket.memorandumObjects.length > 0 && (
          <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
              <FileText size={14} className="text-indigo-500" /> Memorandum Objects (To submit to CAC)
            </p>
            <ul className="list-decimal list-outside space-y-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 ml-4">
              {ticket.memorandumObjects.map((obj: string, i: number) => (
                <li key={i} className="leading-relaxed pl-2 pb-2 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">{obj}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      {isLlc && (
        <Section title="Share Capital Structure">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataBlock label="Total Share Capital" value={ticket.totalShareCapital ? `₦${Number(ticket.totalShareCapital).toLocaleString()}` : "N/A"} highlight />
            <DataBlock label="Company Type" value={ticket.companyType || "Private Company Limited by Shares"} />
          </div>
          
          {shareClassesData && shareClassesData.length > 0 && (
            <div className="mt-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 flex items-center gap-2">
                <PieChart size={14} className="text-indigo-500" /> Breakdown of Share Classes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shareClassesData.map((sc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">{sc.type || sc.className || "Ordinary"}</span>
                      <span className="text-indigo-700 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-lg">
                        {Number(sc.value || sc.allotted || 0).toLocaleString()} Units
                      </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {isLlc && (declarant || witness) && (
        <Section title="Legal Declarations & Witnesses">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {declarant && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2"><Scale size={14} /> Declarant Details</p>
                <div className="space-y-4">
                  <DataBlock label="Full Name" value={`${declarant.firstName || ""} ${declarant.lastName || declarant.surname || ""}`.trim()} />
                  <DataBlock label="Occupation" value={declarant.occupation} />
                  <DataBlock label="Identity Document" value={`${declarant.identityType || "ID"} - ${declarant.identityNumber || "N/A"}`} />
                  <AddressBreakdown addressObj={parseJsonSafe(declarant.residentialAddress || declarant, null)} title="Declarant Address" />
                </div>
              </div>
            )}
            {witness && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-4 flex items-center gap-2"><UserPlus size={14} /> Witness Details</p>
                <div className="space-y-4">
                  <DataBlock label="Full Name" value={`${witness.firstName || ""} ${witness.lastName || witness.surname || ""}`.trim()} />
                  <DataBlock label="Occupation" value={witness.occupation} />
                  <AddressBreakdown addressObj={parseJsonSafe(witness.residentialAddress || witness, null)} title="Witness Address" />
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {isLlc && (
        <Section title="Articles of Association">
          {ticket.useDefaultArticles ? (
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-5 flex items-start gap-3 shadow-sm">
              <CheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={20} />
              <div>
                <p className="font-bold text-emerald-800 dark:text-emerald-400">Adopted Default CAC Articles</p>
                <p className="text-sm font-medium text-emerald-600/80 dark:text-emerald-500/80 mt-1">The client chose to use the standard prescribed Articles of Association. No custom typing required.</p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-3">Custom Articles Provided by Client</p>
              <ul className="list-disc list-inside space-y-3 text-sm font-medium text-zinc-900 dark:text-zinc-100 ml-2">
                {customArticlesData && customArticlesData.length > 0 ? customArticlesData.map((art: any, i: number) => (
                  <li key={i} className="leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">{art.article || art.text || art}</li>
                )) : <li className="text-zinc-500 italic list-none">No custom articles parsed.</li>}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* NEW: Explicit Company Address Grids */}
      <Section title="Company Addresses">
        <div className="grid grid-cols-1 gap-4">
          <AddressBreakdown 
            addressObj={registeredAddressObj} 
            title="Registered Address" 
            icon={<MapPin className="text-indigo-500 shrink-0" size={16} />} 
          />

          {headOfficeAddressObj && (
            <AddressBreakdown 
              addressObj={headOfficeAddressObj} 
              title="Head Office Address" 
              icon={<MapPin className="text-indigo-500 shrink-0" size={16} />} 
            />
          )}
        </div>
      </Section>
      
    </div>
  );
}