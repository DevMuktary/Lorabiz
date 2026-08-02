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
  const residentialObj = isLlc 
    ? parseJsonSafe(person.residentialAddress, null) 
    : { street: person.serviceAddress || person.streetNo, city: person.city, lga: person.lga, state: person.state };
    
  const serviceObj = isLlc ? parseJsonSafe(person.serviceAddress, null) : null;
  
  // Safely parse PSC details
  const pscData = showPsc ? parseJsonSafe(person.pscDetails, null) : null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
        <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-lg uppercase tracking-wide">
          {person.surname || "No Surname"}, <span className="font-semibold">{person.firstName || "No First Name"}</span>
        </h3>
      </div>
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
           <DataBlock label="Surname" value={person.surname} highlight />
           <DataBlock label="First Name" value={person.firstName} highlight />
           <DataBlock label="Other Name" value={person.otherName} />
        </div>

        <DataBlock label="Email" value={person.email} />
        <DataBlock label="Phone" value={`${person.phoneCode || ""}${person.phone}`} />
        <DataBlock label="Gender" value={person.gender} />
        <DataBlock label="Date of Birth" value={person.dob} />
        <DataBlock label="Nationality" value={person.nationality || person.country || "Nigeria"} />
        
        {isLlc ? (
          <>
            <DataBlock label="Occupation" value={person.occupation} />
            <DataBlock label="ID Document Type" value={person.idType} />
            <DataBlock label="ID Number" value={person.idNumber} highlight />
            
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

        {/* FIXED: EXACT PSC DECLARATIONS TABLE EXPOSING ALL 8 FIELDS */}
        {showPsc && pscData && (
          <div className="md:col-span-3 bg-rose-50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/20 rounded-xl shadow-sm overflow-hidden mt-2">
             <div className="bg-rose-100/50 dark:bg-rose-500/10 px-5 py-3 border-b border-rose-100 dark:border-rose-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">PSC Declarations (Extract EXACTLY for CAC Portal)</p>
             </div>
             
             <div className="p-0">
                <PscRow label="POLITICALLY EXPOSED PERSON?" value={pscData.isPep} />
                <PscRow label="HAS AFFILIATIONS?" value={pscData.hasAffiliation} />
                <PscRow label="DIRECT SHARES HELD" value={pscData.holdsSharesDirect} />
                <PscRow label="DIRECT VOTING RIGHTS" value={pscData.holdsVotingDirect} />
                <PscRow label="INDIRECT SHARES HELD" value={pscData.holdsSharesIndirect} />
                <PscRow label="INDIRECT VOTING RIGHTS" value={pscData.holdsVotingIndirect} />
                {/* NEW: Added the two missing fields from your JSON structure */}
                <PscRow label="RIGHT TO APPOINT/REMOVE DIRECTORS" value={pscData.canAppointRemove} />
                <PscRow label="EXERCISES SIGNIFICANT INFLUENCE" value={pscData.hasSignificantInfluence} />
             </div>
          </div>
        )}
        
        <div className="md:col-span-3 space-y-4 mt-2">
           <AddressBreakdown addressObj={residentialObj} title="Residential Address" />
           {serviceObj && <AddressBreakdown addressObj={serviceObj} title="Service Address" />}
        </div>
      </div>
    </div>
  );
}

// Helper to format the exact Table Row
function PscRow({ label, value }: { label: string, value: any }) {
  if (value === undefined || value === null || value === "") return null; 
  
  const isYes = String(value).toLowerCase().startsWith('yes');
  
  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-rose-100/50 dark:border-rose-500/10 last:border-0">
      <span className="text-xs font-bold text-rose-900/70 dark:text-rose-200/70 uppercase tracking-wide">{label}</span>
      <span className={`text-sm font-black ${isYes ? 'text-rose-700 dark:text-rose-300' : 'text-zinc-400'}`}>
        {value}
      </span>
    </div>
  );
}