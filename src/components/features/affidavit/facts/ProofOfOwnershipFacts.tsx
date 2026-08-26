"use client";

import { ProofOfOwnershipFacts as IProofOfOwnershipFacts } from "../types";

interface ProofOfOwnershipFactsProps {
  facts: IProofOfOwnershipFacts;
  onChange: (updated: Partial<IProofOfOwnershipFacts>) => void;
}

export function ProofOfOwnershipFacts({ facts, onChange }: ProofOfOwnershipFactsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">Ownership Subject</label>
        <input
          type="text"
          value={facts.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          placeholder="e.g. Toyota Corolla 2018, Land Parcel, Apple iPhone"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Chassis / Engine / Serial / IMEI Number
        </label>
        <input
          type="text"
          value={facts.identifyingNumber}
          onChange={(e) => onChange({ identifyingNumber: e.target.value })}
          placeholder="e.g. JTD123456789 or Serial Number"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary font-mono"
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Acquisition &amp; Ownership Particulars
        </label>
        <textarea
          rows={3}
          value={facts.details}
          onChange={(e) => onChange({ details: e.target.value })}
          placeholder="Provide details of purchase date, vendor, source, and affirm that you are the lawful owner."
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
