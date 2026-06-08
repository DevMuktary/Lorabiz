"use client";

import { useState, useRef } from "react";
import { UploadSimple, CheckCircle, Image as ImageIcon, FileText, SpinnerGap } from "@phosphor-icons/react";

interface FileUploadProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  type?: "image" | "document";
}

export function FileUpload({ label, description, value, onChange, accept = "image/*", type = "image" }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // ==========================================
      // CLOUDINARY UPLOAD LOGIC HERE
      // Replace this FormData block with your actual Cloudinary/S3 endpoint
      // ==========================================
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "YOUR_CLOUDINARY_PRESET"); // Update this
      
      /* 
      const res = await fetch("https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      onChange(data.secure_url);
      */

      // SIMULATED UPLOAD FOR NOW (Remove this timeout when connected to Cloudinary)
      setTimeout(() => {
        onChange(URL.createObjectURL(file)); 
        setIsUploading(false);
      }, 2000);

    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload file. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</label>
      
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-all
          ${value ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-[#ff3f7a] hover:bg-[#ff3f7a]/5 cursor-pointer"}
          ${isUploading ? "opacity-70 cursor-not-allowed border-slate-300 bg-slate-50" : ""}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept={accept} 
          className="hidden" 
        />

        {isUploading ? (
          <div className="flex flex-col items-center text-slate-500">
            <SpinnerGap className="h-6 w-6 animate-spin text-[#ff3f7a] mb-2" weight="bold" />
            <span className="text-xs font-bold">Uploading to secure vault...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center text-emerald-600">
            <CheckCircle className="h-8 w-8 mb-1" weight="fill" />
            <span className="text-xs font-bold text-emerald-700">Uploaded Successfully</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400 group-hover:text-[#ff3f7a] transition-colors">
            {type === "image" ? <ImageIcon className="h-6 w-6 mb-1" weight="duotone" /> : <FileText className="h-6 w-6 mb-1" weight="duotone" />}
            <span className="text-sm font-bold text-slate-700">Click to browse files</span>
            {description && <span className="text-[10px] font-medium mt-1 uppercase tracking-widest">{description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
