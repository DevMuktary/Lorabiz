"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { UploadSimple, FilePdf, CircleNotch, X, MagnifyingGlassPlus, MagnifyingGlassMinus, CheckCircle } from "@phosphor-icons/react";

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

// --- HELPER TO EXTRACT CROPPED IMAGE AS BLOB ---
const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.95);
  });
};

export function FileUpload({ label, description, value, accept = "image/jpeg, image/png", aspectRatio = 1, onUploadSuccess, onRemove, onError }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

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

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropAndUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    setIsUploading(true);
    setImageToCrop(null); // Close modal

    try {
      const blob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const file = new File([blob], "cropped_image.jpg", { type: "image/jpeg" });
      await uploadFileToServer(file);
    } catch (e) {
      showError("Failed to crop image.");
      setIsUploading(false);
    }
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isPdfPreview = value?.toLowerCase().endsWith(".pdf");

  return (
    <>
      <div 
        className={`relative border-2 rounded-xl flex flex-col items-center justify-center text-center transition-all h-44 group overflow-hidden ${value ? 'border-emerald-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-[#ff3f7a]/40 cursor-pointer'}`} 
        onClick={() => !value && !isUploading && fileInputRef.current?.click()}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3 text-[#ff3f7a]">
            <CircleNotch className="animate-spin h-8 w-8" weight="bold" />
            <span className="font-black text-xs uppercase tracking-widest">Uploading...</span>
          </div>
        ) : value ? (
          <div className="relative w-full h-full group">
            {isPdfPreview ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-600 gap-2">
                <FilePdf className="h-10 w-10" weight="fill" />
                <span className="font-bold text-xs uppercase">PDF Document</span>
              </div>
            ) : (
              <img src={value} alt="Preview" className="w-full h-full object-cover" />
            )}
            
            {/* OVERLAY ON HOVER TO REMOVE */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 type="button"
                 onClick={(e) => { e.stopPropagation(); onRemove(); }} 
                 className="flex items-center gap-1 bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
               >
                 <X weight="bold" /> Remove
               </button>
            </div>
            
            <div className="absolute top-2 left-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
              <CheckCircle weight="fill" className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center group-hover:bg-[#ff3f7a]/10 group-hover:text-[#ff3f7a] text-slate-400 transition-colors mb-3">
              <UploadSimple className="h-6 w-6" weight="bold" />
            </div>
            <span className="font-black text-sm text-slate-800">{label}</span>
            {description && <span className="text-xs font-bold text-slate-400 mt-1">{description}</span>}
            <input type="file" ref={fileInputRef} accept={accept} className="hidden" onChange={handleFileChange} />
          </div>
        )}
      </div>

      {/* --- CROP MODAL --- */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-lg text-slate-900">Adjust Image</h3>
              <button onClick={() => { setImageToCrop(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Cropper Area */}
              <div className="relative w-full h-72 bg-slate-900 rounded-2xl overflow-hidden mb-6">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={aspectRatio}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  showGrid={false}
                />
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-4 mb-8 bg-slate-50 p-4 rounded-xl">
                <MagnifyingGlassMinus className="text-slate-400 h-5 w-5 shrink-0" weight="bold"/>
                <input 
                  type="range" min={1} max={3} step={0.1} value={zoom} 
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#ff3f7a]" 
                />
                <MagnifyingGlassPlus className="text-slate-400 h-5 w-5 shrink-0" weight="bold"/>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button onClick={() => { setImageToCrop(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="flex-1 h-12 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleCropAndUpload} className="flex-1 h-12 rounded-xl font-bold text-white bg-[#ff3f7a] hover:bg-[#e02b62] shadow-md shadow-[#ff3f7a]/30 transition-colors">
                  Crop & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
