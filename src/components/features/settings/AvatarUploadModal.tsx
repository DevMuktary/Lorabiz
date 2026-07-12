"use client";

import { useState } from "react";
// FIX: Changed UploadCloud to UploadSimple
import { X, UploadSimple, Spinner, CheckCircle } from "@phosphor-icons/react";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string | null;
  onSuccess: (newUrl: string) => void;
}

export default function AvatarUploadModal({ isOpen, onClose, currentImage, onSuccess }: AvatarUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 2 * 1024 * 1024) {
        setError("Image size must be less than 2MB.");
        return;
      }
      setError(null);
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Upload file to your storage service
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      
      if (!uploadRes.ok || !uploadData.url) {
        throw new Error(uploadData.message || "Failed to upload image.");
      }

      // 2. Save URL to user profile
      const saveRes = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: uploadData.url }),
      });

      if (!saveRes.ok) throw new Error("Failed to save profile picture.");

      onSuccess(uploadData.url);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-6 relative">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 className="font-black text-base text-foreground">Update Profile Picture</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={20} weight="bold" /></button>
        </div>

        {error && <p className="text-xs font-bold text-red-500 bg-red-500/10 p-3 rounded-xl">{error}</p>}

        <div className="flex flex-col items-center gap-4">
          <div className="h-28 w-28 rounded-full border-2 border-dashed border-border overflow-hidden flex items-center justify-center bg-secondary/50 relative group">
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              // FIX: Using UploadSimple here
              <UploadSimple size={32} className="text-muted-foreground" />
            )}
            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-xs">
              Change
              <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground text-center">Supported: JPG, PNG, WEBP. Max size: 2MB.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} disabled={uploading} className="flex-1 h-11 bg-secondary font-bold rounded-xl text-sm">Cancel</button>
          <button onClick={handleUpload} disabled={!file || uploading} className="flex-1 h-11 bg-primary text-primary-foreground font-bold rounded-xl text-sm flex items-center justify-center disabled:opacity-50">
            {uploading ? <Spinner className="animate-spin h-5 w-5" /> : "Save Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}
