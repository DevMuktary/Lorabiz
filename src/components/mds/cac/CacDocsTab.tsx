"use client";

import { useState } from "react";
import { DocumentPreview } from "./CacShared";

export default function CacDocsTab({ ticket, isLlc }: { ticket: any, isLlc: boolean }) {
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Force Download Helper
  const handleForceDownload = async (url: string, filename: string) => {
    try {
      setDownloadingFile(url);
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed, falling back to new tab", err);
      window.open(url, '_blank');
    } finally {
      setDownloadingFile(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl mx-auto pb-10">
      
      {/* Application Wide Documents */}
      {isLlc && (ticket.declarantSignatureUrl || ticket.witnessSignatureUrl) && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
            Company Legal Documents & Declarations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ticket.declarantSignatureUrl && (
              <DocumentPreview 
                label="Declarant Signature" 
                url={ticket.declarantSignatureUrl} 
                downloadName={`Declarant_Signature_${ticket.trackingId}`} 
                isDownloading={downloadingFile === ticket.declarantSignatureUrl}
                onDownload={handleForceDownload}
              />
            )}
            {ticket.witnessSignatureUrl && (
              <DocumentPreview 
                label="Witness Signature" 
                url={ticket.witnessSignatureUrl} 
                downloadName={`Witness_Signature_${ticket.trackingId}`} 
                isDownloading={downloadingFile === ticket.witnessSignatureUrl}
                onDownload={handleForceDownload}
              />
            )}
          </div>
        </div>
      )}

      {/* Personal Documents */}
      {ticket.people?.map((person: any, idx: number) => {
        const safeName = (person.firstName || "Client").replace(/\s+/g, '_');
        
        return (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4 flex justify-between items-center">
              <span>{person.firstName} {person.surname}</span>
              <span className="text-[10px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Documents</span>
            </h3>
            
            {isLlc ? (
              <DocumentPreview 
                label={`ID Card (${person.idType || "ID"})`} 
                url={person.idDocumentUrl} 
                downloadName={`ID_${safeName}_${ticket.trackingId}`} 
                isDownloading={downloadingFile === person.idDocumentUrl}
                onDownload={handleForceDownload}
              />
            ) : (
              <>
                <DocumentPreview 
                  label="NIN Slip / Card" 
                  url={person.ninUrl} 
                  downloadName={`NIN_${safeName}_${ticket.trackingId}`} 
                  isDownloading={downloadingFile === person.ninUrl}
                  onDownload={handleForceDownload}
                />
                <DocumentPreview 
                  label="Passport Photograph" 
                  url={person.passportUrl} 
                  downloadName={`Passport_${safeName}_${ticket.trackingId}`} 
                  isDownloading={downloadingFile === person.passportUrl}
                  onDownload={handleForceDownload}
                />
              </>
            )}
            <DocumentPreview 
              label="Specimen Signature" 
              url={person.signatureUrl} 
              downloadName={`Signature_${safeName}_${ticket.trackingId}`} 
              isDownloading={downloadingFile === person.signatureUrl}
              onDownload={handleForceDownload}
            />
          </div>
        );
      })}
    </div>
  );
}