"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Eraser, Check, Pen, ArrowClockwise } from "@phosphor-icons/react";

interface CanvasSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  signerName?: string;
}

export default function CanvasSignatureModal({
  isOpen,
  onClose,
  onSave,
  signerName = "Director / Signatory",
}: CanvasSignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState<"#000000" | "#0f2b5c">("#000000");

  useEffect(() => {
    if (!isOpen) return;

    // Initialize canvas resolution and background
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = inkColor;
      }
      setHasDrawn(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen, inkColor]);

  if (!isOpen) return null;

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasDrawn(true);

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = inkColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;

    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg bg-card text-card-foreground rounded-3xl border border-border shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Pen className="h-5 w-5" weight="bold" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Draw Digital Signature</h3>
              <p className="text-xs text-muted-foreground">Sign for: <strong className="text-foreground">{signerName}</strong></p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
        </div>

        {/* Signature Canvas Area */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>Use your finger, stylus, or mouse to sign on the pad below:</span>
              
              {/* Ink Color Selector */}
              <div className="flex items-center gap-2">
                <span className="text-[11px]">Ink:</span>
                <button
                  type="button"
                  onClick={() => setInkColor("#000000")}
                  className={`h-5 w-5 rounded-full bg-black border-2 transition-transform cursor-pointer ${
                    inkColor === "#000000" ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-60"
                  }`}
                  title="Black Ink"
                />
                <button
                  type="button"
                  onClick={() => setInkColor("#0f2b5c")}
                  className={`h-5 w-5 rounded-full bg-[#0f2b5c] border-2 transition-transform cursor-pointer ${
                    inkColor === "#0f2b5c" ? "border-primary scale-110 shadow-sm" : "border-transparent opacity-60"
                  }`}
                  title="Navy Blue Ink"
                />
              </div>
            </div>

            <div className="relative w-full h-52 bg-white rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden shadow-inner touch-none cursor-crosshair">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="w-full h-full block touch-none"
              />

              {/* Baseline guideline */}
              <div className="absolute bottom-10 left-8 right-8 border-b border-dashed border-slate-200 pointer-events-none flex items-center justify-between text-[10px] text-slate-300 font-sans uppercase tracking-widest select-none">
                <span>Sign Above This Line</span>
                <span>✖</span>
              </div>

              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold select-none">
                  Draw your signature here
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasDrawn}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <Eraser className="h-4 w-4" weight="bold" />
              <span>Clear Pad</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!hasDrawn}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40"
              >
                <Check className="h-4 w-4" weight="bold" />
                <span>Save Signature</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
