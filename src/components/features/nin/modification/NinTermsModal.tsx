"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  ArrowDown,
  PenNib, 
  Eraser, 
  CheckCircle, 
  WarningCircle, 
  Spinner,
  ShieldCheck,
  X,
  ArrowLeft
} from "@phosphor-icons/react";

interface NinTermsModalProps {
  isOpen: boolean;
  userFullName?: string;
  onAgreed: () => void;
  onClose?: () => void;
}

export function NinTermsModal({ isOpen, userFullName = "", onAgreed, onClose }: NinTermsModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState(userFullName);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedSignature, setTypedSignature] = useState(userFullName);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userFullName) {
      setFullName((prev) => prev || userFullName);
      setTypedSignature((prev) => prev || userFullName);
    }
  }, [userFullName]);

  // High-DPI canvas setup
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    if (!isOpen || signatureMode !== "draw") return;
    const timer = setTimeout(() => {
      initCanvas();
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, signatureMode, initCanvas]);

  if (!isOpen || !mounted) return null;

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      router.push("/dashboard/nin");
    }
  };

  // Exact point calculation mapping client coordinates to internal canvas resolution
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    isDrawingRef.current = true;
    setHasDrawn(true);

    const pt = getCanvasPoint(e);
    lastPointRef.current = pt;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    ctx.fillStyle = "#0f172a";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.5 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw initial dot
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, (1.25 * dpr), 0, Math.PI * 2);
    ctx.fill();

    // Start continuous path
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPt = getCanvasPoint(e);
    
    // Continuous solid line to current point
    ctx.lineTo(currentPt.x, currentPt.y);
    ctx.stroke();

    lastPointRef.current = currentPt;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx && lastPointRef.current) {
          const pt = getCanvasPoint(e);
          ctx.lineTo(pt.x, pt.y);
          ctx.stroke();
          ctx.closePath();
        }
      }
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    lastPointRef.current = null;
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-background/98 sm:bg-black/90 backdrop-blur-md p-3 sm:p-6 py-6 sm:py-10 flex items-start sm:items-center justify-center animate-in fade-in duration-200">
      <div className="bg-card border border-border shadow-2xl rounded-3xl max-w-2xl w-full my-auto overflow-hidden text-foreground animate-in zoom-in-95 duration-200">
        
        {/* Modal Header with NIMC Logo & Close Button */}
        <div className="p-5 sm:p-6 border-b border-border bg-card flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center p-2 border border-border shrink-0 shadow-sm">
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
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-0.5">
                <ShieldCheck weight="bold" className="h-3 w-3" />
                National Identity Management Commission
              </div>
              <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                NIN Modification Terms & Authorization
              </h2>
              <p className="text-xs text-muted-foreground">
                Statutory authorization required prior to processing identity record updates.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer shrink-0"
            title="Close and return to NIN services"
          >
            <X weight="bold" className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* Scroll Down Indicator Pill */}
          <div className="p-3 rounded-2xl bg-secondary/60 border border-border flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-foreground font-medium">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse shrink-0" />
              <span>Please review all clauses below and sign to unlock service</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary text-[11px] shrink-0">
              <span>Scroll to sign</span>
              <ArrowDown weight="bold" className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Terms Content Clauses */}
          <div className="space-y-3 text-xs sm:text-sm text-foreground/90 leading-relaxed">
            
            {/* Clause 1 */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">1</span>
                <span>Authorization to Act on Your Behalf (Independent Agency)</span>
              </div>
              <p className="text-muted-foreground pl-7 text-xs sm:text-[13px]">
                I, the user, authorize <strong>LoraBiz</strong> and its designated technical agents to access, transmit, and submit my personal identification data (including my NIN) to process the requested record modification. I understand that <strong>LoraBiz is an independent processing agent and is NOT the National Identity Management Commission (NIMC)</strong>.
              </p>
            </div>

            {/* Clause 2 */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">2</span>
                <span>Voluntary Consent & Agency Engagement</span>
              </div>
              <p className="text-muted-foreground pl-7 text-xs sm:text-[13px]">
                NIMC recommends that NIN modifications be performed personally. By accepting this agreement, I confirm that due to technical difficulties, distance, or convenience, I voluntarily appoint LoraBiz to perform this modification on my behalf as an authorized agent.
              </p>
            </div>

            {/* Clause 3 */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">3</span>
                <span>Strict Ownership Declaration & Anti-Tampering Notice</span>
              </div>
              <p className="text-muted-foreground pl-7 text-xs sm:text-[13px]">
                I declare under penalty of perjury, the <strong>Nigeria Data Protection Act (NDPA) 2023</strong>, and the <strong>Cybercrimes Act 2015</strong> that I am the sole owner of the submitted NIN or possess verifiable written proxy consent from the owner. <strong>LoraBiz maintains complete non-repudiation audit logs (including IP address, browser fingerprint, digital signature, and timestamps)</strong> and cooperates fully with law enforcement in cases of identity theft or fraudulent submissions.
              </p>
            </div>

            {/* Clause 4 */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">4</span>
                <span>Service Fees & Non-Refundable Processing Policy</span>
              </div>
              <p className="text-muted-foreground pl-7 text-xs sm:text-[13px]">
                All service fees are non-refundable once work commences. Wallet funds are non-withdrawable. If a service fails due to a verified administrative error, refunds are credited back to your wallet at administrative discretion.
              </p>
            </div>

            {/* Clause 5 */}
            <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border space-y-1">
              <div className="flex items-center gap-2 font-bold text-foreground">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black shrink-0">5</span>
                <span>Third-Party Network Propagation Delays</span>
              </div>
              <p className="text-muted-foreground pl-7 text-xs sm:text-[13px]">
                I understand that downstream data synchronization across commercial banks, telecom operators (SIM-NIN links), and immigration portals is subject to external synchronization intervals outside LoraBiz&apos;s control.
              </p>
            </div>

          </div>

          {/* Signature & Authorization Form */}
          <form onSubmit={handleSubmit} className="pt-4 space-y-4 border-t border-border">
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Legal Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Chukwuma Olawale Danjuma"
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Must match your official government identification name.
                </p>
              </div>

              {/* Signature Mode Selector & Pad */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <PenNib weight="bold" className="h-3.5 w-3.5 text-primary" />
                    Digital Signature <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1 bg-secondary p-0.5 rounded-lg text-[10px] font-bold border border-border">
                    <button
                      type="button"
                      onClick={() => setSignatureMode("draw")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${signatureMode === "draw" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode("type")}
                      className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${signatureMode === "type" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {signatureMode === "draw" ? (
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerCancel}
                      style={{ touchAction: "none" }}
                      className="w-full h-24 sm:h-28 rounded-xl border border-border bg-white cursor-crosshair shadow-inner"
                    />
                    {hasDrawn && (
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        title="Clear Signature"
                      >
                        <Eraser weight="bold" className="h-3.5 w-3.5" />
                        Clear
                      </button>
                    )}
                    {!hasDrawn && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs font-medium select-none">
                        Sign with finger, stylus, or mouse
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={typedSignature}
                      onChange={(e) => setTypedSignature(e.target.value)}
                      placeholder="Type your full signature..."
                      className="w-full h-24 sm:h-28 px-4 py-2 rounded-xl bg-white border border-border text-slate-900 font-serif italic text-xl sm:text-2xl flex items-center justify-center text-center shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>

            </div>

            {/* Affirmation Checkbox */}
            <div className="pt-2 border-t border-border">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary transition-all cursor-pointer shrink-0"
                />
                <span className="text-xs text-foreground font-medium leading-relaxed">
                  I confirm that all statements provided are true and accurate. I voluntarily authorize LoraBiz to process my NIN modification under the stated terms.
                </span>
              </label>
            </div>

            {/* Actions: Cancel / Back & Agree */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={handleCancel}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
              >
                <ArrowLeft weight="bold" className="h-4 w-4" />
                <span>Cancel & Return to NIN Services</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !agreedToTerms || !fullName.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-black text-sm shadow-lg shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
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
    </div>
  );
}
