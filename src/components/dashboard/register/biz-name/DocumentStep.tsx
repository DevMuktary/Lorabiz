"use client";

import { Proprietor } from "./schema";
import { FileUpload } from "@/components/FileUpload";

export default function DocumentStep({ 
  proprietors, setProprietors 
}: { 
  proprietors: Proprietor[], setProprietors: (p: Proprietor[]) => void 
}) {
  return (
    <div className="p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
       <h2 className="text-2xl font-black text-slate-900 mb-2 border-b pb-4">Document Uploads</h2>
       <p className="text-slate-500 mb-6 text-sm font-medium">Upload valid IDs and signatures. (JPEG/PNG)</p>

       <div className="space-y-6">
         {proprietors.map((p, idx) => (
           <div key={p.id} className="bg-slate-50 rounded-2xl p-4 md:p-6 border border-slate-200">
              <h3 className="font-black text-lg text-slate-800 mb-4">{p.surname} {p.firstName}'s Documents</h3>
              
              {/* COMPACT GRID FOR UPLOADS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="transform scale-95 origin-top-left">
                  <FileUpload 
                    label="NIN Card/Slip"
                    value={p.documents.nin}
                    onUploadSuccess={(url) => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, nin: url } } : pr))}
                    onRemove={() => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, nin: null } } : pr))}
                  />
                </div>
                <div className="transform scale-95 origin-top-left">
                  <FileUpload 
                    label="Passport Photo"
                    value={p.documents.passport}
                    onUploadSuccess={(url) => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, passport: url } } : pr))}
                    onRemove={() => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, passport: null } } : pr))}
                  />
                </div>
                <div className="transform scale-95 origin-top-left">
                  <FileUpload 
                    label="Signature"
                    value={p.documents.signature}
                    onUploadSuccess={(url) => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, signature: url } } : pr))}
                    onRemove={() => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, signature: null } } : pr))}
                  />
                </div>
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}
