"use client";

import { useState, useRef } from "react";
import { UploadSimple, CheckCircle, Image as ImageIcon, FileText, CircleNotch } from "@phosphor-icons/react";
import { Label } from "@/components/ui/label";

interface FileUploadProps {
  label: string;
  description?: string;
  value: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
  accept?: string;
  type?: "image" | "document";
}

export function FileUpload({ label, description, value, onUploadSuccess, onRemove, accept = "image/jpeg, image/png", type = "image" }: FileUploadProps) {
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
    <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors h-48 group">
      {isUploading ? (
        <div className="flex flex-col items-center gap-3 text-[#ff3f7a]">
          <CircleNotch className="animate-spin h-8 w-8" weight="bold" />
          <span className="font-bold text-sm">Uploading securely...</span>
        </div>
      ) : value ? (
        <div className="flex flex-col items-center gap-3 text-emerald-600">
          <CheckCircle className="h-10 w-10" weight="fill" />
          <span className="font-bold text-sm">Uploaded Successfully</span>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }} 
            className="text-xs text-red-500 font-bold mt-2 hover:underline z-10"
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <UploadSimple className="h-10 w-10 text-slate-300 group-hover:text-[#ff3f7a] transition-colors mb-3" weight="bold" />
          <Label className="font-bold text-slate-700 cursor-pointer group-hover:text-[#ff3f7a] transition-colors">
            Upload {label}
          </Label>
          {description && <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">{description}</span>}
          <input 
            type="file" 
            ref={fileInputRef}
            accept={accept} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            onChange={handleFileChange} 
          />
        </>
      )}
    </div>
  );
}
