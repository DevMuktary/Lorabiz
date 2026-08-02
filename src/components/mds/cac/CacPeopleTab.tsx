"use client";

import { DataBlock, AddressBreakdown, parseJsonSafe } from "./CacShared";

export default function CacPeopleTab({ ticket, isLlc }: { ticket: any, isLlc: boolean }) {
  const directors = ticket.people?.filter((p: any) => p.roles?.includes("DIRECTOR")) || [];
  const shareholders = ticket.people?.filter((p: any) => p.roles?.includes("SHAREHOLDER")) || [];
  const secretaries = ticket.people?.filter((p: any) => p.roles?.includes("SECRETARY")) || [];
  const pscs = ticket.people?.filter((p: any) => p.isPsc || p.roles?.includes("PSC") || p.pscDetails) || [];
  const proprietors = ticket.people || []; // For Business Names

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto pb-10">
      
      {!isLlc && (
        <RoleSection title="Proprietors" count={proprietors.length} color="blue">
           {proprietors.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={false} />)}
        </RoleSection>
      )}

      {isLlc && directors.length > 0 && (
        <RoleSection title="Directors" count={directors.length} color="indigo">
           {directors.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} />)}
        </RoleSection>
      )}

      {isLlc && shareholders.length > 0 && (
        <RoleSection title="Shareholders" count={shareholders.length} color="emerald">
           {shareholders.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} showShares />)}
        </RoleSection>
      )}

      {isLlc && secretaries.length > 0 && (
        <RoleSection title="Secretaries" count={secretaries.length} color="amber">
           {secretaries.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} />)}
        </RoleSection>
      )}

      {isLlc && pscs.length > 0 && (
        <RoleSection title="Persons with Significant Control (PSC)" count={pscs.length} color="rose">
           {pscs.map((p: any, i: number) => <PersonCard key={i} person={p} isLlc={true} showPsc />)}
        </RoleSection>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// LOCAL UI HELPERS FOR PEOPLE
// ----------------------------------------------------------------------

function RoleSection({ title, count, color, children }: { title: string, count: number, color: string, children: React.ReactNode }) {
  const colorStyles: any = {
    blue: "text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    indigo: "text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20",
    emerald: "text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
    amber: "text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
    rose: "text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
  };

  return (
    <div className="space-y-4">
      <h3 className={`text-base font-black uppercase tracking-widest border-b pb-2 flex items-center gap-3 ${colorStyles[color]}`}>
        {title} 
        <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[10px]">{count}</span>
      </h3>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function PersonCard({ person, isLlc, showShares, showPsc }: any) {
  // Format Addresses for the Grid Layout
  const residentialObj = isLlc 
    ? parseJsonSafe(person.residentialAddress, null) 
    : { street: person.serviceAddress || person.streetNo, city: person.city, lga: person.lga, state: person.state };
    
  const serviceObj = isLlc ? parseJsonSafe(person.serviceAddress, null) : null;
  
  // Safely parse PSC details
  const pscData = showPsc ? parseJsonSafe(person.pscDetails, null) : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg uppercase tracking-wide">
          {person.surname || "No Surname"}, {person.firstName || "No First Name"}
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* NEW: Explicitly separated names for exact CAC data entry */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
           <DataBlock label="Surname" value={person.surname} highlight />
           <DataBlock label="First Name" value={person.firstName} highlight />
           <DataBlock label="Other Name" value={person.otherName} />
        </div>

        {/* Core Personal Details */}
        <DataBlock label="Email" value={person.email} />
        <DataBlock label="Phone" value={`${person.phoneCode || ""}${person.phone}`} />
        <DataBlock label="Gender" value={person.gender} />
        <DataBlock label="Date of Birth" value={person.dob} />
        
        {isLlc ? (
          <>
            <DataBlock label="Occupation" value={person.occupation} />
            <DataBlock label="Nationality" value={person.nationality} />
            <DataBlock label="ID Document Type" value={person.idType} />
            <DataBlock label="ID Number" value={person.idNumber} highlight />
            
            {/* Extended Details */}
            {person.formerName && <DataBlock label="Former Name" value={person.formerName} />}
            {person.formerNationality && <DataBlock label="Former Nationality" value={person.formerNationality} />}
            {person.taxResidency && <DataBlock label="Tax Residency" value={person.taxResidency} />}
            {person.tin && <DataBlock label="TIN" value={person.tin} highlight />}
          </>
        ) : (
          <DataBlock label="NIN Status" value={person.ninUrl ? "Uploaded" : "Missing"} highlight />
        )}
        
        {showShares && person.sharesAllotted && (
          <DataBlock label="Total Shares Allotted" value={`${Number(person.sharesAllotted).toLocaleString()} Units`} highlight />
        )}

        {/* NEW: Comprehensive PSC Declarations Breakdown */}
        {showPsc && pscData && (
          <div className="md:col-span-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 p-5 rounded-xl shadow-sm space-y-5">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rose-100 dark:border-rose-500/10 pb-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Significant Control (PSC) Declarations</p>
                <div className="flex gap-2">
                  {pscData.isPep && (
                     <span className="text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 px-2 py-1 rounded">
                       Politically Exposed (PEP)
                     </span>
                  )}
                  {pscData.hasAffiliation && (
                     <span className="text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-2 py-1 rounded">
                       PEP Affiliation
                     </span>
                  )}
                </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/60 dark:bg-black/20 p-4 rounded-lg border border-rose-100 dark:border-rose-500/10">
                  <p className="text-[9px] font-bold uppercase text-rose-400 mb-1">Percentage of Shares</p>
                  <p className="text-base font-black text-rose-700 dark:text-rose-300">
                    {pscData.percentageOfShares || pscData.sharesPercentage || pscData.percentage || "N/A"}
                  </p>
                </div>
                <div className="bg-white/60 dark:bg-black/20 p-4 rounded-lg border border-rose-100 dark:border-rose-500/10">
                  <p className="text-[9px] font-bold uppercase text-rose-400 mb-1">Percentage of Voting Rights</p>
                  <p className="text-base font-black text-rose-700 dark:text-rose-300">
                    {pscData.percentageOfVotingRights || pscData.votingPercentage || "N/A"}
                  </p>
                </div>
             </div>

             <div className="bg-white/60 dark:bg-black/20 p-4 rounded-lg border border-rose-100 dark:border-rose-500/10">
               <p className="text-[9px] font-bold uppercase text-rose-400 mb-2">Control Matrix (User Selections)</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 text-sm font-medium text-rose-900 dark:text-rose-200">
                  <BooleanRow label="Holds Direct Shares" value={pscData.holdsDirectShares} />
                  <BooleanRow label="Holds Indirect Shares" value={pscData.holdsIndirectShares} />
                  <BooleanRow label="Holds Direct Voting Rights" value={pscData.holdsDirectVotingRights} />
                  <BooleanRow label="Holds Indirect Voting Rights" value={pscData.holdsIndirectVotingRights} />
                  <BooleanRow label="Right to Appoint/Remove Directors" value={pscData.canAppointDirectors} />
                  <BooleanRow label="Exercises Significant Influence" value={pscData.exercisesSignificantInfluence} />
               </div>
             </div>

             {(pscData.natureOfControl || pscData.details) && (
               <div>
                 <p className="text-[10px] font-bold uppercase text-rose-400 mb-2">Additional Control Details</p>
                 <ul className="list-disc list-inside text-sm font-medium text-rose-900 dark:text-rose-200 space-y-1 ml-1">
                   {pscData.natureOfControl?.map((control: string, i: number) => <li key={i}>{control}</li>) || <li>{pscData.details}</li>}
                 </ul>
               </div>
             )}
          </div>
        )}
        
        {/* Explicit Address Grids */}
        <div className="md:col-span-3 space-y-4">
           <AddressBreakdown addressObj={residentialObj} title="Residential Address" />
           {serviceObj && <AddressBreakdown addressObj={serviceObj} title="Service Address" />}
        </div>
      </div>
    </div>
  );
}

// Local helper to nicely format Yes/No Booleans for PSC
function BooleanRow({ label, value }: { label: string, value: boolean | undefined | null }) {
  if (value === undefined || value === null) return null; // Don't show if not filled out
  return (
    <div className="flex justify-between items-center py-1 border-b border-rose-100/50 dark:border-rose-500/10 last:border-0">
      <span className="opacity-80">{label}</span>
      <span className={`font-bold ${value ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'}`}>
        {value ? "YES" : "NO"}
      </span>
    </div>
  );
}