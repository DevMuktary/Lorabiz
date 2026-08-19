"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ShieldCheck, 
  WarningCircle, 
  CheckCircle, 
  PenNib, 
  Eraser, 
  LockKey, 
  ArrowRight,
  Spinner,
  FileText
} from "@phosphor-icons/react";

interface NinTermsModalProps {
  isOpen: boolean;
  userFullName?: string;
  onAgreed: () => void;
}

export function NinTermsModal({ isOpen, userFullName = "", onAgreed }: NinTermsModalProps) {
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
    if (userFullName) {
      setFullName((prev) => prev || userFullName);
      setTypedSignature((prev) => prev || userFullName);
    }
  }, [userFullName]);

  // Set up high-DPI canvas
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
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [isOpen, signatureMode]);

  if (!isOpen) return null;

  // Drawing helpers
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
      setErrorMsg("You must accept the terms and legal authorization to proceed.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-background border border-border shadow-2xl rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-foreground">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-border bg-card/60 flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <ShieldCheck weight="duotone" className="h-6 w-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1">
              Legal Compliance & Verification
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
              NIN Modification Authorization & Terms of Agreement
            </h2>
            <p className="text-xs text-muted-foreground">
              Please read carefully and execute your digital signature before accessing NIN Modification services.
            </p>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-foreground/90 leading-relaxed max-h-[45vh] bg-secondary/10 border-b border-border">
          
          {/* Section 1 */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">1</span>
              <span>Authorization to Act on Your Behalf (Independent Agency)</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              I, the applicant/user, explicitly authorize <strong>LoraBiz</strong> (operated by <strong>Quadrox Technologies Ltd</strong>) and its licensed technical partners to securely access, transmit, and process my National Identification Number (NIN) data solely for the requested modification. I understand that <strong>LoraBiz is an independent technology and agency partner and is NOT the National Identity Management Commission (NIMC)</strong>.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">2</span>
              <span>Voluntary Consent & Agency Engagement</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              NIMC recommends that NIN modifications be performed personally. By accepting this agreement, I confirm that due to technical difficulties, digital literacy constraints, geographic distance, or personal convenience, I voluntarily appoint and authorize LoraBiz to perform this modification as my authorized processing agent.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400">
              <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-center font-black">3</span>
              <span>Zero-Tolerance Policy on Identity Fraud & Strict Anti-Tampering</span>
            </div>
            <p className="text-amber-900/80 dark:text-amber-200/80 pl-7 text-xs">
              <strong>CRITICAL STATUTORY NOTICE:</strong> You certify under penalty of perjury, the NIMC Act (No. 23 of 2007), and the Cybercrimes (Prohibition, Prevention, etc.) Act that you are either the legitimate, registered owner of the NIN or hold explicit, lawful, and written power of attorney from the NIN holder. <strong>LoraBiz maintains complete forensic audit trails (including IP address, browser fingerprint, digital signature, and submission timestamps)</strong> and will immediately hand over all records to law enforcement (DSS, EFCC, and Nigerian Police Force) in the event of unauthorized modifications or identity impersonation.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">4</span>
              <span>Service Fees, Processing Liberty & No-Refund Policy</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              All fees charged for NIN modifications are non-refundable once work commences. Wallet funds are non-withdrawable. In the event of a processing failure arising exclusively from verified administrative or provider registry errors, refunds are granted strictly as wallet credits at administrative discretion. Submissions containing fraudulent or unverifiable data will be rejected with forfeiture of fees.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-black">5</span>
              <span>Registry Synchronization & Third-Party Propagation Delays</span>
            </div>
            <p className="text-muted-foreground pl-7 text-xs">
              I acknowledge that upon successful conclusion of the modification by LoraBiz, reflecting the updated details across commercial banks, telecom operators (SIM-NIN linking), and third-party portals depends entirely on external replication schedules over which LoraBiz has no direct control.
            </p>
          </div>

        </div>

        {/* Form: Full Name, Signature Pad, and Binding Agreement */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 bg-card">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Full Legal Name */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Full Legal Name of Applicant / Authorized Agent <span className="text-rose-500">*</span>
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
                Must match your legal government identification name.
              </p>
            </div>

            {/* Signature Mode Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <PenNib weight="bold" className="h-3.5 w-3.5 text-primary" />
                  Digital Signature <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1 bg-secondary/60 p-0.5 rounded-lg text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSignatureMode("draw")}
                    className={`px-2 py-0.5 rounded-md transition-all ${signatureMode === "draw" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                  >
                    Draw
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureMode("type")}
                    className={`px-2 py-0.5 rounded-md transition-all ${signatureMode === "type" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
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
                    className="w-full h-24 rounded-xl border border-border bg-white cursor-crosshair touch-none shadow-inner"
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
                      Sign with mouse or finger here
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    placeholder="Type your signature here..."
                    className="w-full h-24 px-4 py-2 rounded-xl bg-white border border-border text-slate-900 font-serif italic text-2xl flex items-center justify-center text-center shadow-inner focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>

          </div>

          {/* Agreement Checkbox */}
          <div className="pt-2 border-t border-border">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
              />
              <span className="text-xs text-foreground font-medium">
                I hereby declare that all statements provided are true and accurate. I explicitly authorize LoraBiz (Quadrox Technologies Ltd) to process my NIN modification, accept the no-refund policy, and acknowledge that falsification of identity details constitutes a criminal offense under Nigerian Law.
              </span>
            </label>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <LockKey weight="bold" className="h-3.5 w-3.5 text-emerald-500" />
              <span>Signed records are cryptographically timestamped & stored.</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !agreedToTerms || !fullName.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md transition-all"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4 animate-spin" />
                  Recording Consent...
                </>
              ) : (
                <>
                  <CheckCircle weight="bold" className="h-4 w-4" />
                  I Agree & Authorize LoraBiz
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
