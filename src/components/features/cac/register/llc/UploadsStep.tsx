"use client";

import { FilePdf, WarningCircle } from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";

// Helper to format roles beautifully: ["DIRECTOR", "PSC"] -> "DIRECTOR & PSC"
const formatRoles = (roles: string[]) => {
  if (!roles || roles.length === 0) return "OFFICER";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return `${roles.slice(0, -1).join(', ')} & ${roles[roles.length - 1]}`;
};

export default function UploadsStep({ data, updateData, showErrors }: any) {
  const officers = data.officers || [];
  const witness = data.witnessDetails || {};
  const declarant = data.declarantDetails || {};
  
  const uploads = data.uploads || {};

  // Real upload handler receiving Cloudinary URL from FileUpload component
  const handleUploadSuccess = (docKey: string) => (url: string) => {
    updateData((prev: any) => ({
      ...prev,
      uploads: { ...(prev.uploads || {}), [docKey]: url }
    }));
  };

  const handleRemove = (docKey: string) => () => {
    updateData((prev: any) => {
      const newUploads = { ...prev.uploads };
      delete newUploads[docKey];
      return { ...prev, uploads: newUploads };
    });
  };

  // Helper component to add error styling around FileUpload for required docs
  const RequiredUpload = ({ docKey, label, description, accept, aspectRatio }: any) => {
    const hasError = showErrors && !uploads[docKey];
    
    return (
      <div className={`relative mb-6 ${hasError ? 'rounded-xl ring-2 ring-red-400 p-1 bg-red-50/50' : ''}`}>
        <FileUpload
          label={label}
          description={description}
          accept={accept}
          aspectRatio={aspectRatio}
          value={uploads[docKey] || null}
          onUploadSuccess={handleUploadSuccess(docKey)}
          onRemove={handleRemove(docKey)}
        />
        {hasError && (
          <div className="absolute -bottom-6 left-2 text-[11px] font-bold text-red-600 flex items-center gap-1">
            <WarningCircle weight="fill" /> Document is required
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
      <section>
        <div className="mb-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <FilePdf className="h-6 w-6" weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Document Uploads</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Please upload clear, legible copies of the required identification and signatures.
            </p>
          </div>
        </div>

        <div className="space-y-6 mt-8">
          
          {/* IDENTIFICATION */}
          <div>
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest mt-8">Means of Identification</h3>
            <div className="space-y-6">
              {officers.map((officer: any) => (
                <RequiredUpload
                  key={`id-${officer.id}`}
                  docKey={`id-${officer.id}`}
                  label={`MEANS OF ID - ${officer.surname} ${officer.firstName}`}
                  description="PDF, JPG, or PNG (Max 4MB)"
                  accept="application/pdf, image/jpeg, image/png"
                  aspectRatio={1.6} // ID Card shape for cropper
                />
              ))}
            </div>
          </div>

          {/* SIGNATURES */}
          <div>
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-10 uppercase tracking-widest">Signatures</h3>
            <div className="space-y-6">
              {/* Witness Signature */}
              {witness.firstName && (
                <RequiredUpload
                  docKey="witness-sig"
                  label={`SIGNATURE OF WITNESS - ${witness.surname} ${witness.firstName}`}
                  description="JPG or PNG ONLY (Plain white paper)"
                  accept="image/jpeg, image/png"
                  aspectRatio={2.5} // Wide rectangle for signatures
                />
              )}

              {/* Declarant Signature */}
              {declarant.firstName && (
                <RequiredUpload
                  docKey="deponent-sig"
                  label={`SIGNATURE OF DEPONENT/DECLARANT - ${declarant.surname} ${declarant.firstName}`}
                  description="JPG or PNG ONLY (Plain white paper)"
                  accept="image/jpeg, image/png"
                  aspectRatio={2.5}
                />
              )}

              {/* Consolidated Officer Signatures */}
              {officers.map((officer: any) => (
                <RequiredUpload
                  key={`sig-${officer.id}`}
                  docKey={`sig-${officer.id}`}
                  label={`SIGNATURE OF ${formatRoles(officer.roles)} - ${officer.surname} ${officer.firstName}`}
                  description="JPG or PNG ONLY (Plain white paper)"
                  accept="image/jpeg, image/png"
                  aspectRatio={2.5}
                />
              ))}
            </div>
          </div>

          {/* OPTIONAL DOCS */}
          <div>
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-10 uppercase tracking-widest">Additional Documents (Optional)</h3>
            <div className="space-y-6">
              <FileUpload
                label="REASON FOR RESTRICTION OF RESIDENTIAL ADDRESS"
                description="PDF, JPG, or PNG (Optional)"
                accept="application/pdf, image/jpeg, image/png"
                value={uploads['reason-restriction'] || null}
                onUploadSuccess={handleUploadSuccess('reason-restriction')}
                onRemove={handleRemove('reason-restriction')}
              />
              <FileUpload
                label="OTHERS"
                description="PDF, JPG, or PNG (Optional)"
                accept="application/pdf, image/jpeg, image/png"
                value={uploads['others'] || null}
                onUploadSuccess={handleUploadSuccess('others')}
                onRemove={handleRemove('others')}
              />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
