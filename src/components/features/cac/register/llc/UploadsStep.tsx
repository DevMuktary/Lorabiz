"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadSimple, FilePdf, Image as ImageIcon, CheckCircle, Trash, XCircle, SpinnerGap } from "@phosphor-icons/react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  maxSizeMB?: number;
  value?: string | null; // Cloudinary URL
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
  aspectRatio?: number; // E.g. 1.6 for ID card, 2.5 for signature
}

export function FileUpload({ 
  label, 
  description = "PDF, JPG, or PNG (Max 4MB)", 
  accept = "application/pdf, image/jpeg, image/png", 
  maxSizeMB = 4, 
  value, 
  onUploadSuccess, 
  onRemove,
  aspectRatio
}: FileUploadProps) {
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Cropper State
  const [fileToCrop, setFileToCrop] = useState<string | null>(null);
  const [rawFileParams, setRawFileParams] = useState<{name: string, type: string} | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const getAcceptedFilesObject = () => {
    const acc: Record<string, string[]> = {};
    if (accept.includes('pdf')) acc['application/pdf'] = ['.pdf'];
    if (accept.includes('jpeg')) acc['image/jpeg'] = ['.jpg', '.jpeg'];
    if (accept.includes('png')) acc['image/png'] = ['.png'];
    return acc;
  };

  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Upload failed");
      
      onUploadSuccess(data.url);
    } catch (err: any) {
      setUploadError(err.message || "Something went wrong during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setUploadError(null);

    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === "file-too-large") setUploadError(`File is too large. Max size is ${maxSizeMB}MB.`);
      else if (error.code === "file-invalid-type") setUploadError("Invalid file type.");
      else setUploadError(error.message);
      return;
    }

    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    if (file.type.startsWith('image/') && aspectRatio) {
      const url = URL.createObjectURL(file);
      setFileToCrop(url);
      setRawFileParams({ name: file.name, type: file.type });
    } else {
      uploadToCloudinary(file);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxSizeMB, aspectRatio]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptedFilesObject(),
    maxSize: maxSizeMB * 1024 * 1024,
    multiple: false,
  });

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!fileToCrop || !croppedAreaPixels || !rawFileParams) return;
    setIsUploading(true);
    
    try {
      // Create a canvas to crop the image
      const image = new window.Image();
      image.src = fileToCrop;
      await new Promise(resolve => image.onload = resolve);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas not supported");

      const { x, y, width, height } = croppedAreaPixels as any;
      canvas.width = width;
      canvas.height = height;
      
      ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Canvas is empty");
        const newFile = new File([blob], rawFileParams.name, { type: rawFileParams.type });
        uploadToCloudinary(newFile);
        setFileToCrop(null);
      }, rawFileParams.type);

    } catch (err: any) {
      setUploadError("Failed to crop image.");
      setIsUploading(false);
      setFileToCrop(null);
    }
  };

  const isPdf = value?.toLowerCase().endsWith(".pdf");

  // ==========================================
  // VIEW: 1. CROPPER MODAL
  // ==========================================
  if (fileToCrop) {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh] border border-border">
          <div className="p-5 border-b border-border flex justify-between items-center bg-secondary/50 shrink-0">
            <div>
              <h3 className="font-black text-lg text-foreground">Crop Image</h3>
              <p className="text-xs font-bold text-muted-foreground mt-0.5">Please ensure the important details fill the box.</p>
            </div>
            <button onClick={() => setFileToCrop(null)} className="p-2 bg-secondary hover:bg-secondary/80 rounded-full text-foreground transition-colors cursor-pointer">
              <XCircle className="h-5 w-5" weight="fill" />
            </button>
          </div>
          <div className="flex-1 relative bg-black/50">
            <Cropper
              image={fileToCrop}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio || 1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="p-5 border-t border-border bg-secondary/30 shrink-0 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="w-full sm:w-1/2 flex items-center gap-3">
              <span className="text-xs font-bold text-muted-foreground shrink-0">Zoom:</span>
              <input 
                type="range" 
                value={zoom} 
                min={1} 
                max={3} 
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => setFileToCrop(null)} className="flex-1 sm:flex-none h-12 px-6 rounded-xl font-bold bg-background text-foreground border border-border hover:bg-secondary transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleCropSave} className="flex-1 sm:flex-none h-12 px-8 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-md transition-colors cursor-pointer">Crop & Upload</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2">
        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      </div>

      {/* ========================================== */}
      {/* VIEW: 2. ALREADY UPLOADED STATE            */}
      {/* ========================================== */}
      {value ? (
        <div className="relative w-full h-32 rounded-2xl border-2 border-emerald-500/50 bg-emerald-500/5 overflow-hidden flex items-center justify-between p-4 group transition-colors">
          <div className="flex items-center gap-4 z-10 w-full pr-12">
            <div className="h-14 w-14 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              {isPdf ? <FilePdf className="h-7 w-7" weight="fill" /> : <ImageIcon className="h-7 w-7" weight="fill" />}
            </div>
            <div className="flex flex-col truncate w-full">
              <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm truncate w-full">Document Uploaded Successfully</span>
              <span className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400/70 truncate flex items-center gap-1 mt-1">
                <CheckCircle weight="fill" /> File Secured
              </span>
            </div>
          </div>
          
          <button 
            onClick={(e) => { e.preventDefault(); onRemove(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 bg-background/80 hover:bg-red-500 hover:text-white text-muted-foreground rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer z-20"
            title="Remove File"
          >
            <Trash className="h-5 w-5" weight="bold" />
          </button>
        </div>
      ) : (

      /* ========================================== */
      /* VIEW: 3. DROPZONE / LOADING STATE          */
      /* ========================================== */
        <div 
          {...getRootProps()} 
          className={`relative w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-4 transition-all cursor-pointer ${
            isDragActive 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : uploadError 
                ? "border-red-500 bg-red-500/5 hover:bg-red-500/10" 
                : "border-border bg-secondary/30 hover:bg-secondary/50 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          
          {isUploading ? (
            <div className="flex flex-col items-center text-primary">
              <SpinnerGap className="h-8 w-8 animate-spin mb-2" weight="bold" />
              <p className="text-xs font-black uppercase tracking-widest">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${uploadError ? 'bg-red-500/20 text-red-500' : 'bg-background border border-border text-muted-foreground'}`}>
                {uploadError ? <WarningCircle className="h-5 w-5" weight="fill" /> : <UploadSimple className="h-5 w-5" weight="bold" />}
              </div>
              <p className={`text-sm font-bold ${uploadError ? 'text-red-500' : 'text-foreground'}`}>
                {uploadError || (isDragActive ? "Drop file here" : "Click or drag to upload")}
              </p>
              {!uploadError && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{description}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
