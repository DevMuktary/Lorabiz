"use client";

import { useState, useRef } from "react";
import { UploadSimple, CheckCircle, Image as ImageIcon, CircleNotch } from "@phosphor-icons/react";

interface FileUploadProps {
  label: string;
  description?: string;
  value: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

export function FileUpload({ label, description, value, onUploadSuccess, onRemove }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { 
      alert("File size exceeds 4MB limit."); 
      return; 
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.success && data.url) {
        onUploadSuccess(data.url);
      } else {
        alert("Upload failed. Please try again.");
      }
    } catch (error) {
      alert("Network error during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`relative border-2 rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all h-40 group ${value ? 'border-emerald-200 bg-emerald-50' : 'border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-[#ff3f7a]/40 cursor-pointer'}`} onClick={() => !value && !isUploading && fileInputRef.current?.click()}>
      {isUploading ? (
        <div className="flex flex-col items-center gap-2 text-[#ff3f7a]">
          <CircleNotch className="animate-spin h-6 w-6" weight="bold" />
          <span className="font-bold text-xs">Uploading...</span>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center gap-2 text-emerald-600">
          <CheckCircle className="h-8 w-8" weight="fill" />
          <span className="font-bold text-xs">Uploaded</span>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }} 
            className="text-[10px] uppercase tracking-widest text-red-500 font-bold mt-1 hover:underline z-10 bg-white px-2 py-1 rounded shadow-sm"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <UploadSimple className="h-8 w-8 text-slate-300 group-hover:text-[#ff3f7a] transition-colors mb-2" weight="bold" />
          <span className="font-bold text-sm text-slate-700 group-hover:text-[#ff3f7a] transition-colors">{label}</span>
          {description && <span className="text-[10px] font-medium text-slate-400 mt-1">{description}</span>}
          <input type="file" ref={fileInputRef} accept="image/jpeg, image/png" className="hidden" onChange={handleFileChange} />
        </>
      )}
    </div>
  );
}
