"use client";

import { useState } from "react";
import { UploadSimple, FilePdf, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// A reusable row for each document
function UploadRow({ title, isOptional = false, onUpload, isUploaded }: any) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900">{title} {!isOptional && <span className="text-red-500">*</span>}</h4>
        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
          PDF, JPEG or PNG (Max 4MB)
        </p>
      </div>
      
      <div className="shrink-0">
        {isUploaded ? (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-bold text-sm">
            <CheckCircle weight="fill" className="h-5 w-5" /> Uploaded
          </div>
        ) : (
          <Button variant="outline" className="h-10 bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold w-full sm:w-auto relative overflow-hidden group">
            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onUpload} accept=".pdf,.jpg,.jpeg,.png" />
            <UploadSimple weight="bold" className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-1" /> Browse File
          </Button>
        )}
      </div>
    </div>
  );
}

export default function UploadsStep({ data, updateData }: any) {
  const officers = data.officers || [];
  const witness = data.witnessDetails || {};
  const declarant = data.declarantDetails || {};
  
  // Dummy upload handler for the UI (Replace with real Cloudinary/S3 logic)
  const simulateUpload = (docKey: string) => (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // In production, upload the file and save the URL. Here we just set a boolean flag for the UI.
    updateData((prev: any) => ({
      ...prev,
      uploads: { ...(prev.uploads || {}), [docKey]: "https://dummy-url.com/file.pdf" }
    }));
  };

  const uploads = data.uploads || {};

  return (
    <div className="p-6 sm:p-10 space-y-8 animate-in fade-in duration-500">
      
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
          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4">Means of Identification</h3>
          {officers.map((officer: any) => (
            <UploadRow 
              key={`id-${officer.id}`} 
              title={`MEANS OF IDENTIFICATION - ${officer.surname} ${officer.firstName}`} 
              isUploaded={!!uploads[`id-${officer.id}`]}
              onUpload={simulateUpload(`id-${officer.id}`)}
            />
          ))}

          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4 mt-8">Signatures</h3>
          
          {/* Witness Signature */}
          {witness.firstName && (
             <UploadRow 
               title={`SIGNATURE OF WITNESS - ${witness.surname} ${witness.firstName}`} 
               isUploaded={!!uploads['witness-sig']}
               onUpload={simulateUpload('witness-sig')}
             />
          )}

          {/* Deponent / Declarant Signature */}
          {declarant.firstName && (
             <UploadRow 
               title={`SIGNATURE OF DEPONENT - ${declarant.surname} ${declarant.firstName}`} 
               isUploaded={!!uploads['deponent-sig']}
               onUpload={simulateUpload('deponent-sig')}
             />
          )}

          {/* Dynamic Role-Based Signatures */}
          {officers.map((officer: any) => (
            <div key={`sigs-${officer.id}`} className="space-y-3">
              {officer.roles.includes("DIRECTOR") && (
                <UploadRow 
                  title={`SIGNATURE OF DIRECTOR - ${officer.surname} ${officer.firstName}`} 
                  isUploaded={!!uploads[`dir-sig-${officer.id}`]}
                  onUpload={simulateUpload(`dir-sig-${officer.id}`)}
                />
              )}
              {officer.roles.includes("SHAREHOLDER") && (
                <UploadRow 
                  title={`SIGNATURE OF SHAREHOLDER - ${officer.surname} ${officer.firstName}`} 
                  isUploaded={!!uploads[`share-sig-${officer.id}`]}
                  onUpload={simulateUpload(`share-sig-${officer.id}`)}
                />
              )}
              {officer.roles.includes("PSC") && (
                <UploadRow 
                  title={`SIGNATURE OF PSC - ${officer.surname} ${officer.firstName}`} 
                  isUploaded={!!uploads[`psc-sig-${officer.id}`]}
                  onUpload={simulateUpload(`psc-sig-${officer.id}`)}
                />
              )}
            </div>
          ))}

          <h3 className="text-sm font-bold text-slate-900 border-b pb-2 mb-4 mt-8">Additional Documents (Optional)</h3>
          <UploadRow title="REASON FOR RESTRICTION OF RESIDENTIAL ADDRESS" isOptional isUploaded={!!uploads['reason-restriction']} onUpload={simulateUpload('reason-restriction')} />
          <UploadRow title="STATUTORY DECLARATION OF COMPLIANCE FOR LEGAL PRACTITIONERS" isOptional isUploaded={!!uploads['legal-declaration']} onUpload={simulateUpload('legal-declaration')} />
          <UploadRow title="OTHERS" isOptional isUploaded={!!uploads['others']} onUpload={simulateUpload('others')} />
        </div>
      </section>

    </div>
  );
}
