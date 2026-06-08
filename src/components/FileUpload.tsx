"use client";

import { useState, useRef } from "react";
import Cropper, { ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { CircleNotch, X, CheckCircle, FilePdf, Image as ImageIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  label: string;
  description?: string;
  value: string | null;
  accept?: string;
  aspectRatio?: number;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
  onError?: (msg: string) => void;
}

export function FileUpload({ label, description, value, accept = "image/jpeg, image/png", aspectRatio = 1, onUploadSuccess, onRemove, onError }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  // Raw File & Preview State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewFullScale, setViewFullScale] = useState<string | null>(null);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const showError = (msg: string) => {
    if (onError) onError(msg);
    else alert(msg);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) { 
      showError("File size exceeds 4MB limit."); 
      if (fileInputRef.current) fileInputRef.current.value = "";
      return; 
    }

    setSelectedFile(file);

    // If PDF, skip cropper and upload directly
    if (file.type === "application/pdf") {
      await uploadFileToServer(file);
    } else {
      // If Image, open Crop Modal
      const reader = new FileReader();
      reader.onload = () => setImageToCrop(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadOriginal = async () => {
    if (!selectedFile) return;
    setImageToCrop(null); 
    await uploadFileToServer(selectedFile);
  };

  const handleCropAndUpload = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsUploading(true);
    setImageToCrop(null); 

    // Extract the cropped area straight from the library
    cropper.getCroppedCanvas().toBlob(async (blob) => {
      if (!blob) {
         showError("Failed to crop image.");
         setIsUploading(false);
         return;
      }
      const file = new File([blob], "cropped_document.jpg", { type: "image/jpeg" });
      await uploadFileToServer(file);
    }, "image/jpeg", 0.95);
  };

  const uploadFileToServer = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.success && data.url) {
        onUploadSuccess(data.url);
      } else {
        showError("Upload failed. Please try again.");
      }
    } catch (error) {
      showError("Network error during upload.");
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isPdfPreview = value?.toLowerCase().endsWith(".pdf");

  return (
    <>
      {/* --- COMPACT ROW UI (No Placards) --- */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-xl transition-all ${value ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200 bg-slate-50'}`}>
        
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${value ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
            {value ? <CheckCircle weight="fill" className="h-6 w-6" /> : isPdfPreview ? <FilePdf weight="fill" className="h-5 w-5" /> : <ImageIcon weight="fill" className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-bold text-sm text-slate-800">{label}</p>
            {description && <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {!value && !isUploading && (
            <Button onClick={() => fileInputRef.current?.click()} className="bg-slate-900 text-white w-full sm:w-auto hover:bg-slate-800 h-10 px-6 rounded-lg font-bold">
              Choose File
            </Button>
          )}
          
          {isUploading && (
            <div className="flex items-center gap-2 px-4 py-2 bg-[#ff3f7a]/10 text-[#ff3f7a] rounded-lg font-bold text-sm w-full sm:w-auto justify-center">
              <CircleNotch className="animate-spin h-5 w-5" weight="bold" /> Uploading...
            </div>
          )}

          {value && !isUploading && (
            <div className="flex w-full sm:w-auto gap-2">
              <Button onClick={() => setViewFullScale(value)} variant="outline" className="flex-1 sm:flex-none border-slate-300 text-slate-700 font-bold hover:bg-slate-100 h-10">
                View Document
              </Button>
              <Button onClick={onRemove} variant="outline" className="flex-1 sm:flex-none border-red-200 text-red-600 font-bold hover:bg-red-50 hover:text-red-700 hover:border-red-300 h-10">
                Remove
              </Button>
            </div>
          )}
          
          <input type="file" ref={fileInputRef} accept={accept} className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* --- DRAGGABLE CROP MODAL (React-Cropper) --- */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-900">Crop Document ({label})</h3>
              <button onClick={() => { setImageToCrop(null); setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm font-medium text-slate-500 mb-4">Drag the edges or corners of the box to select the area you want to upload.</p>
              
              <div className="w-full bg-slate-100 rounded-xl overflow-hidden mb-6 border border-slate-200">
                <Cropper
                  src={imageToCrop}
                  style={{ height: 400, width: "100%" }}
                  initialAspectRatio={aspectRatio}
                  aspectRatio={aspectRatio}
                  guides={true}
                  ref={cropperRef}
                  viewMode={1}
                  dragMode="move"
                  background={false}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleCropAndUpload} className="flex-1 h-12 rounded-xl font-bold text-white bg-[#ff3f7a] hover:bg-[#e02b62]">
                  Crop & Upload
                </Button>
                <Button onClick={handleUploadOriginal} variant="outline" className="flex-1 h-12 rounded-xl font-bold text-slate-700 bg-white hover:bg-slate-50 border-slate-300">
                  Upload Original (Skip)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MIDDLE OF SCREEN LIGHTBOX (View Document) --- */}
      {viewFullScale && (
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setViewFullScale(null)} // Click outside to close
        >
           {/* PINNED CLOSE BUTTON (Always visible at top right) */}
           <button 
             onClick={(e) => { e.stopPropagation(); setViewFullScale(null); }} 
             className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 text-white bg-white/10 hover:bg-red-500 px-4 py-2 rounded-full font-bold transition-colors z-50 shadow-lg border border-white/20"
           >
             <X weight="bold" size={20} /> Close Preview
           </button>

           <div 
             className="relative w-full max-w-4xl flex flex-col items-center"
             onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
           >
              {viewFullScale.toLowerCase().endsWith('.pdf') ? (
                 <iframe src={viewFullScale} className="w-full h-[80vh] rounded-2xl bg-white shadow-2xl border-4 border-slate-800" />
              ) : (
                 <img src={viewFullScale} alt="Full Scale Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-4 border-slate-800 bg-black" />
              )}
           </div>
        </div>
      )}
    </>
  );
}
