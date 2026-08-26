"use client";

import { FileUpload } from "@/components/FileUpload";
import { CacFacts, CacSubType } from "../types";

interface CacCorporateFactsProps {
  facts: CacFacts;
  onChange: (updated: Partial<CacFacts>) => void;
}

export function CacCorporateFacts({ facts, onChange }: CacCorporateFactsProps) {
  return (
    <div className="space-y-4">
      {/* Sub-type selector */}
      <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border">
        <label className="text-xs font-bold text-foreground block mb-2">
          Select Corporate Matter
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: "CAC_LOSS_OF_CERTIFICATE", label: "Loss of CAC Certificate / MEMART" },
            { id: "CAC_SIGNATURE_CHANGE", label: "Change / Variation of Signature" },
            { id: "CAC_DIRECTOR_CORRECTION", label: "Correction of Director Details" },
          ].map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => onChange({ subType: sub.id as CacSubType })}
              className={`p-2.5 rounded-xl text-left text-xs font-bold border transition-all ${
                facts.subType === sub.id
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Company Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Registered Company / Business Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={facts.companyName}
            onChange={(e) => onChange({ companyName: e.target.value })}
            placeholder="e.g. LORABIZ ENTERPRISE LIMITED"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          />
        </div>

        {/* RC / BN Number */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            RC or BN Registration Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={facts.rcBnNumber}
            onChange={(e) => onChange({ rcBnNumber: e.target.value })}
            placeholder="e.g. RC-1928374 or BN-2839481"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary font-mono"
          />
        </div>

        {/* Position in Company */}
        <div className="sm:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-foreground">
            Deponent Position in Company / Business <span className="text-rose-500">*</span>
          </label>
          <select
            value={facts.positionInCompany}
            onChange={(e) => onChange({ positionInCompany: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
          >
            <option value="Director">Director</option>
            <option value="Proprietor / Partner">Proprietor / Partner</option>
            <option value="Company Secretary">Company Secretary / Legal Practitioner</option>
            <option value="Shareholder">Shareholder</option>
            <option value="Incorporated Trustee">Incorporated Trustee</option>
          </select>
        </div>

        {/* ========================================================================= */}
        {/* 1. LOSS OF CAC CERTIFICATE / MEMART                                       */}
        {/* ========================================================================= */}
        {facts.subType === "CAC_LOSS_OF_CERTIFICATE" && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Specific Document Lost</label>
              <select
                value={facts.documentLost || "Certificate of Incorporation"}
                onChange={(e) => onChange({ documentLost: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              >
                <option value="Certificate of Incorporation">Original Certificate of Incorporation</option>
                <option value="Memorandum and Articles of Association (MEMART)">MEMART (Certified Copy)</option>
                <option value="CAC Status Report / Form CAC 1.1">CAC Status Report / Form CAC 1.1</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Approximate Date of Loss</label>
              <input
                type="date"
                value={facts.lossDate || ""}
                onChange={(e) => onChange({ lossDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">Police Extract / Report Number (If Available)</label>
              <input
                type="text"
                value={facts.policeReportNo || ""}
                onChange={(e) => onChange({ policeReportNo: e.target.value })}
                placeholder="e.g. DPO/IKJ/CR/2026/91"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 2. CHANGE / VARIATION OF SIGNATURE ON CAC                                 */}
        {/* ========================================================================= */}
        {facts.subType === "CAC_SIGNATURE_CHANGE" && (
          <>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-foreground">Reason for Signature Variation</label>
              <input
                type="text"
                value={facts.signatureChangeReason || ""}
                onChange={(e) => onChange({ signatureChangeReason: e.target.value })}
                placeholder="e.g. Variation from portal signature specimen, change in handwriting, standardization"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Old / Previous Specimen Signature (Image / Scan)
              </label>
              <FileUpload
                label="Upload Old Signature"
                description="Upload previous signature on CAC records"
                value={facts.oldSignatureUrl || null}
                accept="image/jpeg, image/png"
                aspectRatio={2}
                onUploadSuccess={(url) => onChange({ oldSignatureUrl: url })}
                onRemove={() => onChange({ oldSignatureUrl: null })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                New / Current Specimen Signature (Image / Scan)
              </label>
              <FileUpload
                label="Upload New Signature"
                description="Upload new signature for CAC records"
                value={facts.newSignatureUrl || null}
                accept="image/jpeg, image/png"
                aspectRatio={2}
                onUploadSuccess={(url) => onChange({ newSignatureUrl: url })}
                onRemove={() => onChange({ newSignatureUrl: null })}
              />
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 3. CORRECTION OF DIRECTOR / SHAREHOLDER DETAILS                           */}
        {/* ========================================================================= */}
        {facts.subType === "CAC_DIRECTOR_CORRECTION" && (
          <>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Erroneous Entry on CAC Portal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={facts.erroneousDetail || ""}
                onChange={(e) => onChange({ erroneousDetail: e.target.value })}
                placeholder="e.g. John Adebayo (Wrong spelling or wrong DOB)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">
                Correct Legal Entry <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={facts.correctDetail || ""}
                onChange={(e) => onChange({ correctDetail: e.target.value })}
                placeholder="e.g. John Oluwaseun Adebayo"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm font-medium focus:outline-none focus:border-primary"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
