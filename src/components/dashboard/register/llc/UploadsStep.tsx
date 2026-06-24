"use client";

import { UploadSimple, FilePdf, CheckCircle, Trash, WarningCircle, Eye } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// Helper to format roles beautifully: ["DIRECTOR", "PSC"] -> "DIRECTOR & PSC"
const formatRoles = (roles: string[]) => {
  if (!roles || roles.length === 0) return "OFFICER";
  if (roles.length === 1) return roles[0];
  if (roles.length === 2) return `${roles[0]} & ${roles[1]}`;
  return `${roles.slice(0, -1).join(', ')} & ${roles[roles.length - 1]}`;
};

// Reusable row for each document
function UploadRow({ title, isOptional = false, onUpload, fileUrl, onRemove, hasError }: any) {
  const isUploaded = !!fileUrl;

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-slate-50 border rounded-xl gap-4 transition-colors ${
      isUploaded ? 'border-emerald-200 bg-emerald-50/30' : 
      hasError ? 'border-red-400 bg-red-50/50 ring-2 ring-red-100' : 'border-slate-200'
    }`}>
      <div>
        <h4 className="text-sm font-black text-slate-900 leading-tight">
          {title} {!isOptional && <span className="text-red-500 ml-1">*</span>}
        </h4>
        <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${hasError && !isUploaded ? "text-red-500" : "text-slate-400"}`}>
          PDF, JPEG or PNG (Max 4MB)
        </p>
        {hasError && !isUploaded && (
          <div className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-2">
            <WarningCircle weight="fill" /> Document is required
          </div>
        )}
      </div>
      
      <div className="shrink-0 flex items-center justify-end">
        {isUploaded ? (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100 px-3 sm:px-4 py-2 rounded-lg font-bold text-sm border border-emerald-200 shadow-sm">
              <CheckCircle weight="fill" className="h-5 w-5 text-emerald-500 shrink-0" /> <span className="hidden sm:inline">Uploaded</span>
            </div>
            
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              title="View file" 
              className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
            >
              <Eye weight="bold" className="h-5 w-5" />
            </a>

            <button 
              onClick={onRemove} 
              title="Remove file" 
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
            >
              <Trash weight="bold" className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <Button variant="outline" className={`h-10 bg-white font-bold w-full sm:w-auto relative overflow-hidden group shadow-sm ${hasError ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'}`}>
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onUpload} accept=".pdf,.jpg,.jpeg,.png" />
            <UploadSimple weight="bold" className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-1" /> Browse File
          </Button>
        )}
      </div>
    </div>
  );
}

export default function UploadsStep({ data, updateData, showErrors }: any) {
  const officers = data.officers || [];
  const witness = data.witnessDetails || {};
  const declarant = data.declarantDetails || {};
  
  // Dummy upload handler (Replace with real Cloudinary/S3 logic when ready)
  const simulateUpload = (docKey: string) => (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Simulating an actual file URL so the "View" button has something to open
    const fakeUrl = URL.createObjectURL(file);
    
    updateData((prev: any) => ({
      ...prev,
      uploads: { ...(prev.uploads || {}), [docKey]: fakeUrl }
    }));
  };

  const removeUpload = (docKey: string) => () => {
    updateData((prev: any) => {
      const newUploads = { ...prev.uploads };
      delete newUploads[docKey];
      return { ...prev, uploads: newUploads };
    });
  };

  const uploads = data.uploads || {};

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

        <div className="space-y-3 mt-8">
          
          {/* IDENTIFICATION */}
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 mb-4 uppercase tracking-widest mt-8">Means of Identification</h3>
          {officers.map((officer: any) => (
            <UploadRow 
              key={`id-${officer.id}`} 
              title={`MEANS OF ID - ${officer.surname} ${officer.firstName}`} 
              fileUrl={uploads[`id-${officer.id}`]}
              onUpload={simulateUpload(`id-${officer.id}`)}
              onRemove={removeUpload(`id-${officer.id}`)}
              hasError={showErrors && !uploads[`id-${officer.id}`]}
            />
          ))}

          {/* SIGNATURES */}
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-10 uppercase tracking-widest">Signatures</h3>
          
          {/* Witness Signature */}
          {witness.firstName && (
             <UploadRow 
               title={`SIGNATURE OF WITNESS - ${witness.surname} ${witness.firstName}`} 
               fileUrl={uploads['witness-sig']}
               onUpload={simulateUpload('witness-sig')}
               onRemove={removeUpload('witness-sig')}
               hasError={showErrors && !uploads['witness-sig']}
             />
          )}

          {/* Declarant Signature */}
          {declarant.firstName && (
             <UploadRow 
               title={`SIGNATURE OF DEPONENT/DECLARANT - ${declarant.surname} ${declarant.firstName}`} 
               fileUrl={uploads['deponent-sig']}
               onUpload={simulateUpload('deponent-sig')}
               onRemove={removeUpload('deponent-sig')}
               hasError={showErrors && !uploads['deponent-sig']}
             />
          )}

          {/* Consolidated Officer Signatures */}
          {officers.map((officer: any) => (
             <UploadRow 
               key={`sig-${officer.id}`} 
               title={`SIGNATURE OF ${formatRoles(officer.roles)} - ${officer.surname} ${officer.firstName}`} 
               fileUrl={uploads[`sig-${officer.id}`]}
               onUpload={simulateUpload(`sig-${officer.id}`)}
               onRemove={removeUpload(`sig-${officer.id}`)}
               hasError={showErrors && !uploads[`sig-${officer.id}`]}
             />
          ))}

          {/* OPTIONAL DOCS */}
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-10 uppercase tracking-widest">Additional Documents (Optional)</h3>
          <UploadRow 
            title="REASON FOR RESTRICTION OF RESIDENTIAL ADDRESS" 
            isOptional 
            fileUrl={uploads['reason-restriction']} 
            onUpload={simulateUpload('reason-restriction')} 
            onRemove={removeUpload('reason-restriction')} 
          />
          <UploadRow 
            title="OTHERS" 
            isOptional 
            fileUrl={uploads['others']} 
            onUpload={simulateUpload('others')} 
            onRemove={removeUpload('others')} 
          />
        </div>
      </section>

    </div>
  );
}
