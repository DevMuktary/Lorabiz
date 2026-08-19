"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { 
  ArrowDown,
  PenNib, 
  Eraser, 
  CheckCircle,
  WarningCircle,
  Spinner
} from "@phosphor-icons/react";

interface NinTermsModalProps {
  isOpen: boolean;
  userFullName?: string;
  onAgreed: () => void;
}

export function NinTermsModal({ isOpen, userFullName = "", onAgreed }: NinTermsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState(userFullName);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState(userFullName);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (userFullName) {
      setFullName((prev) => prev || userFullName);
      setTypedSignature((prev) => prev || userFullName);
    }
  }, [userFullName]);

  // Set up signature canvas
  useEffect(() => {
    if (!isOpen || signatureMode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [isOpen, signatureMode]);

  if (!isOpen || !mounted) return null;

  // Drawing handlers
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full legal name.");
      return;
    }

    let signatureData = "";
    if (signatureMode === "draw") {
      if (!hasDrawn || !canvasRef.current) {
        setErrorMsg("Please draw your digital signature on the signature pad.");
        return;
      }
      signatureData = canvasRef.current.toDataURL("image/png");
    } else {
      if (!typedSignature.trim()) {
        setErrorMsg("Please type your legal signature.");
        return;
      }
      signatureData = `TYPED:${typedSignature.trim()}`;
    }

    if (!agreedToTerms) {
      setErrorMsg("You must accept the terms to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/nin/modification/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          signature: signatureData,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onAgreed();
      } else {
        setErrorMsg(data.message || "Failed to record consent. Please try again.");
      }
    } catch (err) {
      console.error("Consent submission error:", err);
      setErrorMsg("Network error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 min-h-screen w-screen z-[99999] overflow-y-auto bg-background/95 dark:bg-background/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-2xl w-full mx-auto bg-card border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden text-foreground my-auto flex flex-col max-h-[92vh]">
        
        {/* Header with NIMC Official Logo */}
        <div className="p-4 sm:p-6 border-b border-border bg-card flex items-center gap-3.5 shrink-0">
          <div className="h-12 w-12 rounded-2xl bg-secondary/80 flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
            <Image 
              src="/nimc.png" 
              alt="NIMC Logo" 
              width={40} 
              height={40} 
              className="object-contain" 
              priority 
            />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-black text-foreground tracking-tight">
              NIN Modification Terms & Authorization
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Read the terms of agreement and sign below to proceed.
            </p>
          </div>
        </div>

        {/* Scrollable Terms Content Area */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
          
          {/* Prominent Scroll Down Indicator Pill */}
          <div className="p-3 rounded-xl bg-secondary/60 border border-border flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span>Please review all clauses & scroll down to sign</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary animate-bounce text-[11px] shrink-0">
              <span>Scroll down</span>
              <ArrowDown weight="bold" className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Section 1 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">1</span>
              <span>Authorization to Act on Your Behalf (Independent Agency)</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              I, the user, authorize <strong>LoraBiz</strong> and its designated technical agents to access, transmit, and submit my personal identification data (including my NIN) to process the requested record modification. I understand that <strong>LoraBiz is an independent processing agent and is NOT the National Identity Management Commission (NIMC)</strong>.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">2</span>
              <span>Voluntary Consent & Agency Engagement</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              NIMC recommends that NIN modifications be performed personally. By accepting this agreement, I confirm that due to technical difficulties, distance, or convenience, I voluntarily appoint LoraBiz to perform this modification on my behalf as an authorized agent.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">3</span>
              <span>Strict Ownership Declaration & Anti-Tampering Notice</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              I declare under penalty of perjury and cybercrime laws that I am the sole owner of the submitted NIN or possess verifiable written consent from the owner. <strong>LoraBiz maintains complete audit logs (including IP address, browser fingerprint, digital signature, and timestamps)</strong> and cooperates fully with law enforcement in cases of identity theft or fraudulent submissions.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">4</span>
              <span>Service Fees & No-Refund Policy</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              All service fees are non-refundable once work commences. Wallet funds are non-withdrawable. If a service fails due to a verified administrative error, refunds are credited back to your wallet at administrative discretion.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-secondary/30 border border-border space-y-1.5">
            <div className="flex items-center gap-2.5 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">5</span>
              <span>Third-Party Network Propagation Delays</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              I understand that downstream data synchronization across commercial banks, telecom operators (SIM-NIN links), and immigration portals is subject to external synchronization intervals outside LoraBiz's control.
            </p>
          </div>

          {/* Bottom Signature & Authorization Form */}
          <form onSubmit={handleSubmit} className="pt-3 space-y-4 border-t border-border">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chukwuma Olawale Danjuma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-background transition-all"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Enter your official identification name.
                </p>
              </div>

              {/* Signature Mode Selector & Pad */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PenNib weight="bold" className="h-3.5 w-3.5 text-primary" />
                    Digital Signature <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg text-[10px] font-bold border border-border">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("draw")}
                      className={`px-2 py-0.5 rounded-md transition-all ${signatureMode === "draw" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode("type")}
                      className={`px-2 py-0.5 rounded-md transition-all ${signatureMode === "type" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {signatureMode === "draw" ? (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-24 sm:h-28 rounded-xl border border-border bg-white cursor-crosshair touch-none shadow-inner"
                    />
                    {hasDrawn && (
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        title="Clear Signature"
                      >
                        <Eraser weight="bold" className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    )}
                    {!hasDrawn && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium">
                        Sign with finger or mouse here
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your signature..."
                      className="w-full h-24 sm:h-28 px-4 py-2 rounded-xl bg-white border border-border text-slate-900 font-serif italic text-xl sm:text-2xl flex items-center justify-center text-center shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Shortened Agreement Checkbox */}
            <div className="pt-2 border-t border-border">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary transition-all cursor-pointer"
                />
                <span className="text-xs text-foreground font-medium">
                  I confirm that all statements provided are true and accurate. I voluntarily authorize LoraBiz to process my NIN modification under the stated terms.
                </span>
              </label>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end pt-1 pb-2">
              <button
                type="submit"
                disabled={isSubmitting || !agreedToTerms || !fullName.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold text-sm shadow-md transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4 animate-spin" />
                    Recording Consent...
                  </>
                ) : (
                  <>
                    <CheckCircle weight="bold" className="h-4 w-4" />
                    Agree & Authorize LoraBiz
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>,
    document.body
  );
}
