"use client";

import { useState, useRef, useCallback } from "react";
import { CloudArrowUp, CheckCircle, Spinner, X, Eye, Image as ImageIcon, FilePdf } from "@phosphor-icons/react";
import Image from "next/image";

// Optional: Cropper integration
import ReactCrop, { type Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface FileUploadProps {
  label: string;
  description?: string;
  accept?: string;
  value?: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove?: () => void;
  maxSizeMB?: number;
  // Cropper settings
  aspectRatio?: number; // e.g. 1 (square), 16/9, etc. If passed, image cropping is enabled.
}

export function FileUpload({
  label,
  description = "PDF, JPG, or PNG (Max 4MB)",
  accept = "application/pdf, image/jpeg, image/png",
  value,
  onUploadSuccess,
  onRemove,
  maxSizeMB = 4,
  aspectRatio
}: FileUploadProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cropper States
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewSrc, setImagePreviewSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // =======================================
  // 1. FILE SELECTION & VALIDATION
  // =======================================
  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Check Size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    // Check Type against Accept
    const fileType = file.type.toLowerCase();
    const isPdf = fileType === "application/pdf";
    const isImage = fileType.startsWith("image/");
    
    if (!isPdf && !isImage) {
      setError("Invalid file type. Please upload a PDF, JPG, or PNG.");
      return;
    }

    // If it's an image AND cropping is enabled, open cropper modal
    if (isImage && aspectRatio) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreviewSrc(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise, upload directly
    uploadToCloudinary(file);
  };

  // Drag & Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // =======================================
  // 2. CROPPER LOGIC
  // =======================================
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    // Auto-center default crop
    if (aspectRatio) {
      const cropWidth = width * 0.8;
      const cropHeight = cropWidth / aspectRatio;
      setCrop({
        unit: 'px',
        width: cropWidth,
        height: cropHeight,
        x: (width - cropWidth) / 2,
        y: (height - cropHeight) / 2
      });
    }
  }, [aspectRatio]);

  const generateCroppedImage = async () => {
    if (!imgRef.current || !completedCrop || !selectedImageFile) return;

    const canvas = document.createElement("canvas");
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    // Convert canvas to Blob
    return new Promise<void>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        // Construct a new File object from the Blob
        const croppedFile = new File([blob], selectedImageFile.name, {
          type: "image/jpeg",
          lastModified: Date.now()
        });
        
        // Close modal and upload
        setSelectedImageFile(null);
        setImagePreviewSrc(null);
        uploadToCloudinary(croppedFile);
        resolve();
      }, "image/jpeg", 0.9);
    });
  };

  // =======================================
  // 3. UPLOAD TO CLOUDINARY API ROUTE
  // =======================================
  const uploadToCloudinary = async (file: File) => {
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Hit our own secure Next.js API route instead of direct Cloudinary URL
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        onUploadSuccess(data.url);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload file. Please check your connection.");
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // =======================================
  // UI RENDERERS
  // =======================================

  const isPdfValue = value?.toLowerCase().endsWith(".pdf");

  return (
    <div className="w-full">
      {/* CROPPER MODAL (Overlays everything if open)
      */}
      {imagePreviewSrc && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden border border-border">
            <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
              <h3 className="font-black text-foreground">Crop Image</h3>
              <button 
                onClick={() => { setSelectedImageFile(null); setImagePreviewSrc(null); }}
                className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors cursor-pointer"
              >
                <X weight="bold" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-background min-h-[300px]">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                className="max-h-[60vh]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  ref={imgRef}
                  src={imagePreviewSrc} 
                  alt="Crop preview" 
                  onLoad={onImageLoad}
                  className="max-h-[60vh] object-contain"
                  crossOrigin="anonymous" // Important for canvas drawing
                />
              </ReactCrop>
            </div>

            <div className="p-4 border-t border-border bg-secondary/30 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setSelectedImageFile(null); setImagePreviewSrc(null); }} className="bg-background text-foreground border-border hover:bg-secondary cursor-pointer">
                Cancel
              </Button>
              <Button onClick={generateCroppedImage} disabled={!completedCrop?.width || !completedCrop?.height} className="bg-primary hover:opacity-90 text-primary-foreground font-bold cursor-pointer">
                Confirm & Upload
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN COMPONENT UI 
      */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
        <Label className="text-xs font-bold uppercase tracking-widest text-foreground">{label}</Label>
        {onRemove && value && (
          <button 
            type="button"
            onClick={onRemove}
            className="text-[10px] font-bold text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors uppercase tracking-widest cursor-pointer"
          >
            Remove & Replace
          </button>
        )}
      </div>

      {/* STATE: UPLOADED */}
      {value ? (
        <div className="relative group border-2 border-border bg-secondary/30 rounded-2xl p-4 flex items-center gap-4 transition-all">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            {isPdfValue ? <FilePdf className="h-6 w-6" weight="fill" /> : <ImageIcon className="h-6 w-6" weight="fill" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-foreground flex items-center gap-1.5 truncate">
              Document Uploaded <CheckCircle className="text-emerald-500" weight="fill" />
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate mt-0.5">
              Ready for submission
            </p>
          </div>
          
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer"
            className="h-10 px-4 rounded-lg bg-background border border-border text-foreground hover:bg-secondary flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Eye weight="bold" className="h-4 w-4" /> <span className="hidden sm:inline">Preview</span>
          </a>
        </div>

      // STATE: UPLOADING / DEFAULT
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept={accept}
            className="hidden"
          />
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative border-2 border-dashed rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer overflow-hidden
              ${isUploading ? "border-primary bg-primary/5 cursor-wait" : 
                isDragging ? "border-primary bg-primary/10 scale-[1.02]" : 
                "border-border bg-card hover:bg-secondary/50 hover:border-primary/50"}
              ${error ? "border-red-500 bg-red-500/5 hover:border-red-500" : ""}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <div className="relative h-16 w-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-secondary"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <CloudArrowUp className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" weight="fill" />
                </div>
                <h4 className="text-sm font-black text-primary">Uploading Securely...</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Please do not close this tab</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-4 transition-colors ${error ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"}`}>
                  <CloudArrowUp className="h-8 w-8" weight="duotone" />
                </div>
                <h4 className={`text-sm font-black mb-1 ${error ? "text-red-500" : "text-foreground"}`}>
                  {isDragging ? "Drop file here to upload" : "Click to browse or drag and drop"}
                </h4>
                <p className="text-xs font-medium text-muted-foreground">
                  {description}
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="mt-3 text-[11px] font-bold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-1.5 border border-red-500/20">
              <WarningCircle weight="fill" className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
