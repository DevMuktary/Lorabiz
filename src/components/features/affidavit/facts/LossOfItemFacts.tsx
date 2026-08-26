"use client";

import { LossOfItemFacts as ILossOfItemFacts } from "../types";

interface LossOfItemFactsProps {
  facts: ILossOfItemFacts;
  onChange: (updated: Partial<ILossOfItemFacts>) => void;
}

export function LossOfItemFacts({ facts, onChange }: LossOfItemFactsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Item or Document Lost <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={facts.itemLost}
          onChange={(e) => onChange({ itemLost: e.target.value })}
          placeholder="e.g. MTN SIM Card, Original WAEC Certificate, Driver License"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Identifying Number (Phone No / Cert No)
        </label>
        <input
          type="text"
          value={facts.identifyingNumber}
          onChange={(e) => onChange({ identifyingNumber: e.target.value })}
          placeholder="e.g. 0803XXXXXXX or WASSCE/2018/..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">Date of Loss</label>
        <input
          type="date"
          value={facts.lossDate}
          onChange={(e) => onChange({ lossDate: e.target.value })}
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">Location / Town Where Lost</label>
        <input
          type="text"
          value={facts.lossLocation}
          onChange={(e) => onChange({ lossLocation: e.target.value })}
          placeholder="e.g. En route Ikeja to Victoria Island, Lagos"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>

      <div className="sm:col-span-2 space-y-1.5">
        <label className="text-xs font-bold text-foreground">Police Extract / Report Number (Optional)</label>
        <input
          type="text"
          value={facts.policeReportNo || ""}
          onChange={(e) => onChange({ policeReportNo: e.target.value })}
          placeholder="e.g. DPO/IKJ/CR/2026/91"
          className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}
