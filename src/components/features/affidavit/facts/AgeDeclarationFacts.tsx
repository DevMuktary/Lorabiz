"use client";

import { NIGERIA_STATES_LGA } from "@/lib/nigeria-states";
import { AgeDeclarationFacts as IAgeDeclarationFacts } from "../types";

interface AgeDeclarationFactsProps {
  facts: IAgeDeclarationFacts;
  onChange: (updated: Partial<IAgeDeclarationFacts>) => void;
}

export function AgeDeclarationFacts({ facts, onChange }: AgeDeclarationFactsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Correct Date of Birth <span className="text-rose-500">*</span>
        </label>
        <input
          type="date"
          value={facts.declaredDob}
          onChange={(e) => onChange({ declaredDob: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Place of Birth (Town / City) <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={facts.placeOfBirth}
          onChange={(e) => onChange({ placeOfBirth: e.target.value })}
          placeholder="e.g. Ikeja"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">State of Birth</label>
        <select
          value={facts.stateOfBirth}
          onChange={(e) => onChange({ stateOfBirth: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        >
          {Object.keys(NIGERIA_STATES_LGA).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">Reason for Affidavit</label>
        <input
          type="text"
          value={facts.reason}
          onChange={(e) => onChange({ reason: e.target.value })}
          placeholder="e.g. Birth certificate unavailable at time of birth / NIN regularization"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
