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
       <h2 className="text-2xl font-black text-foreground mb-2 border-b border-border pb-4">Document Uploads</h2>
       <p className="text-muted-foreground mb-6 text-sm font-medium">Please upload valid IDs and signatures. Ensure documents are clear and readable.</p>

       <div className="space-y-6">
         {proprietors.map((p, idx) => (
           <div key={p.id} className="bg-card rounded-2xl p-5 md:p-6 border border-border shadow-sm transition-colors duration-300">
              <h3 className="font-black text-lg text-foreground mb-5 border-b border-border pb-3">{p.surname} {p.firstName}'s Documents</h3>
              
              <div className="flex flex-col gap-3">
                <FileUpload 
                  label="NIN Card/Slip"
                  description="PDF, JPG, or PNG"
                  accept="application/pdf, image/jpeg, image/png"
                  aspectRatio={1.6} // ID Card shape
                  value={p.documents.nin}
                  onUploadSuccess={(url) => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, nin: url } } : pr))}
                  onRemove={() => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, nin: null } } : pr))}
                />
                <FileUpload 
                  label="Passport Photo"
                  description="JPG or PNG ONLY (Square)"
                  accept="image/jpeg, image/png"
                  aspectRatio={1} // Perfect Square shape
                  value={p.documents.passport}
                  onUploadSuccess={(url) => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, passport: url } } : pr))}
                  onRemove={() => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, passport: null } } : pr))}
                />
                <FileUpload 
                  label="Signature"
                  description="JPG or PNG ONLY (Plain white paper)"
                  accept="image/jpeg, image/png"
                  aspectRatio={2.5} // Wide rectangle for signatures
                  value={p.documents.signature}
                  onUploadSuccess={(url) => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, signature: url } } : pr))}
                  onRemove={() => setProprietors(proprietors.map(pr => pr.id === p.id ? { ...pr, documents: { ...pr.documents, signature: null } } : pr))}
                />
              </div>
           </div>
         ))}
       </div>
    </div>
  );
}
