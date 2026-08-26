"use client";

import { ChangeOfNameFacts as IChangeOfNameFacts } from "../types";

interface ChangeOfNameFactsProps {
  facts: IChangeOfNameFacts;
  onChange: (updated: Partial<IChangeOfNameFacts>) => void;
}

export function ChangeOfNameFacts({ facts, onChange }: ChangeOfNameFactsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Former / Old Name (As on Old Records) <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={facts.oldName}
          onChange={(e) => onChange({ oldName: e.target.value })}
          placeholder="e.g. Mary Ngozi Okafor"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          New Desired Legal Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={facts.newName}
          onChange={(e) => onChange({ newName: e.target.value })}
          placeholder="e.g. Mary Ngozi Adeleke"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">Reason for Name Change</label>
        <select
          value={facts.reason}
          onChange={(e) => onChange({ reason: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        >
          <option value="Marriage">Marriage (Change of Marital Surname)</option>
          <option value="Correction of Typographical Error">Correction of Typographical Error on Records</option>
          <option value="Personal Decision / Re-arrangement">Personal Decision / Name Re-arrangement</option>
          <option value="Religious Conversion">Religious Conversion</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">Where It Will Be Presented</label>
        <input
          type="text"
          value={facts.usageDestination}
          onChange={(e) => onChange({ usageDestination: e.target.value })}
          placeholder="e.g. NIMC/NIN, Commercial Banks/BVN, NYSC, Passport"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
