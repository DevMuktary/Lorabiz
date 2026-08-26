"use client";

import { useState, useRef, useEffect } from "react";
import { Eraser, PencilSimple, UploadSimple, Check } from "@phosphor-icons/react";
import { FileUpload } from "@/components/FileUpload";

interface SignaturePadProps {
  label?: string;
  description?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  required?: boolean;
}

export function SignaturePad({
  label = "Deponent Signature",
  description = "Draw cleanly on the pad or upload a signed white paper",
  value,
  onChange,
  required = true,
}: SignaturePadProps) {
  const [mode, setMode] = useState<"DRAW" | "UPLOAD">("DRAW");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-foreground">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {description && (
            <p className="text-[11px] text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-border text-[11px]">
          <button
            type="button"
            onClick={() => setMode("DRAW")}
            className={`px-2.5 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              mode === "DRAW"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PencilSimple size={12} weight="bold" />
            <span>Draw</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("UPLOAD")}
            className={`px-2.5 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              mode === "UPLOAD"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UploadSimple size={12} weight="bold" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {mode === "DRAW" ? (
        <div className="space-y-1.5">
          <div className="border border-border rounded-2xl bg-white overflow-hidden shadow-inner relative">
            <canvas
              ref={canvasRef}
              width={500}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 touch-none cursor-crosshair"
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-2.5 py-1 rounded-lg bg-secondary/90 hover:bg-secondary border border-border text-foreground text-[10px] font-bold flex items-center gap-1 shadow-xs"
              >
                <Eraser size={12} weight="bold" /> Clear
              </button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground font-medium text-center">
            Sign clearly inside the box above.
          </p>
        </div>
      ) : (
        <div>
          <FileUpload
            label={label}
            description="Upload a photo or scan of signature on clean paper"
            value={value}
            accept="image/jpeg, image/png"
            aspectRatio={2}
            onUploadSuccess={(url) => onChange(url)}
            onRemove={() => onChange(null)}
          />
        </div>
      )}
    </div>
  );
}
