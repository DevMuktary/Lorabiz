"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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

export function FileUpload({ 
  label, 
  description, 
  value, 
  accept = "application/pdf, image/jpeg, image/png", 
  aspectRatio = 1, 
  onUploadSuccess, 
  onRemove, 
  onError 
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // NEW: State to track percentage
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewFullScale, setViewFullScale] = useState<string | null>(null);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const showError = (msg: string) => {
    if (onError) onError(msg);
    else alert(msg);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { 
      showError("File size exceeds 5MB limit."); 
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

    setImageToCrop(null); 

    cropper.getCroppedCanvas().toBlob(async (blob) => {
      if (!blob) {
         showError("Failed to crop image.");
         return;
      }
      const file = new File([blob], "cropped_document.jpg", { type: "image/jpeg" });
      await uploadFileToServer(file);
    }, "image/jpeg", 0.95);
  };

  // NEW: Rewritten with XMLHttpRequest to support live progress tracking
  const uploadFileToServer = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const data = await new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(new Error("Invalid JSON response"));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(formData);
      });

      if (data.success && data.url) {
        onUploadSuccess(data.url);
      } else {
        showError("Upload failed. Please try again.");
      }
    } catch (error) {
      showError("Network error during upload.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isPdfPreview = value?.toLowerCase().endsWith(".pdf");

  return (
    <>
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-xl transition-all ${value ? 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border-border bg-card'}`}>
        
        <div className="flex items-center gap-3 mb-4 sm:mb-0">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${value ? 'bg-emerald-500/20 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
            {value ? <CheckCircle weight="fill" className="h-6 w-6" /> : isPdfPreview ? <FilePdf weight="fill" className="h-5 w-5" /> : <ImageIcon weight="fill" className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">{label}</p>
            {description && <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{description}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {!value && !isUploading && (
            // FIXED: Added type="button" to prevent form submission
            <Button type="button" onClick={() => fileInputRef.current?.click()} className="bg-primary hover:opacity-90 text-primary-foreground w-full sm:w-auto h-10 px-6 rounded-lg font-bold shadow-md cursor-pointer transition-opacity">
              Choose File
            </Button>
          )}
          
          {isUploading && (
            // NEW: Added visual progress indicator
            <div className="flex flex-col items-center gap-1 w-full sm:w-auto min-w-[140px]">
              <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg font-bold text-sm w-full justify-center border border-primary/20">
                <CircleNotch className="animate-spin h-4 w-4" weight="bold" /> {uploadProgress}%
              </div>
              <div className="w-full bg-secondary rounded-full h-1 overflow-hidden mt-0.5">
                <div className="bg-primary h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {value && !isUploading && (
            <div className="flex w-full sm:w-auto gap-2">
              <Button type="button" onClick={(e) => { e.preventDefault(); setViewFullScale(value); }} variant="outline" className="flex-1 sm:flex-none border-border bg-background text-foreground font-bold hover:bg-secondary h-10 cursor-pointer">
                View Document
              </Button>
              <Button type="button" onClick={(e) => { e.preventDefault(); onRemove(); }} variant="outline" className="flex-1 sm:flex-none border-red-500/30 text-red-500 font-bold bg-background hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 h-10 cursor-pointer transition-colors">
                Remove
              </Button>
            </div>
          )}
          
          <input type="file" ref={fileInputRef} accept={accept} className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {mounted && imageToCrop && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-secondary/50">
              <h3 className="font-black text-lg text-foreground">Crop Document ({label})</h3>
              <button type="button" onClick={() => { setImageToCrop(null); setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="p-2 hover:bg-secondary rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X weight="bold" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm font-medium text-muted-foreground mb-4">Drag the edges or corners of the box to select the area you want to upload.</p>
              
              <div className="w-full bg-secondary/30 rounded-xl overflow-hidden mb-6 border border-border">
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
                <Button type="button" onClick={handleCropAndUpload} className="flex-1 h-12 rounded-xl font-bold text-primary-foreground bg-primary hover:opacity-90 shadow-md cursor-pointer">
                  Crop & Upload
                </Button>
                <Button type="button" onClick={handleUploadOriginal} variant="outline" className="flex-1 h-12 rounded-xl font-bold text-foreground bg-background hover:bg-secondary border-border cursor-pointer">
                  Upload Original (Skip)
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {mounted && viewFullScale && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setViewFullScale(null)} 
        >
           <button 
             type="button"
             onClick={(e) => { e.stopPropagation(); setViewFullScale(null); }} 
             className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2 text-foreground bg-secondary/50 hover:bg-red-500 hover:text-white px-4 py-2 rounded-full font-bold transition-colors z-50 shadow-lg border border-border cursor-pointer"
           >
             <X weight="bold" size={20} /> Close Preview
           </button>

           <div 
             className="relative w-full max-w-4xl flex flex-col items-center animate-in zoom-in-95 duration-200"
             onClick={(e) => e.stopPropagation()}
           >
              {viewFullScale.toLowerCase().endsWith('.pdf') ? (
                 <iframe src={viewFullScale} className="w-full h-[80vh] rounded-2xl bg-card shadow-2xl border-2 border-border" />
              ) : (
                 <img src={viewFullScale} alt="Full Scale Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-border bg-card" />
              )}
           </div>
        </div>,
        document.body
      )}
    </>
  );
}
