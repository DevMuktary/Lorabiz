// src/components/features/rewards/DashboardLuckySpinModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { 
  X, 
  Sparkle, 
  Gift, 
  Coins, 
  Spinner, 
  ArrowRight, 
  WarningCircle, 
  Wallet,
  CheckCircle,
  Ticket
} from "@phosphor-icons/react";
import { WheelSlice, DEFAULT_WHEEL_SLICES } from "@/lib/rewards";

interface DashboardLuckySpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshBalance?: () => void;
  onOpenFundWallet?: () => void;
}

function triggerNativeConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    canvas.remove();
    return;
  }

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4"];
  const particles: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vx: number;
    vy: number;
    rotation: number;
    vRot: number;
    opacity: number;
  }> = [];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width * 0.5 + (Math.random() - 0.5) * 200,
      y: canvas.height * 0.5,
      w: Math.random() * 8 + 4,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 18,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1,
    });
  }

  const startTime = performance.now();
  const duration = 2800;

  function render(time: number) {
    const elapsed = time - startTime;
    if (elapsed > duration || !ctx) {
      canvas.remove();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const progress = elapsed / duration;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35;
      p.rotation += p.vRot;
      p.opacity = Math.max(0, 1 - progress);

      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

export default function DashboardLuckySpinModal({
  isOpen,
  onClose,
  onRefreshBalance,
  onOpenFundWallet,
}: DashboardLuckySpinModalProps) {
  const [mounted, setMounted] = useState(false);
  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [slices, setSlices] = useState<WheelSlice[]>(DEFAULT_WHEEL_SLICES);
  const [minDeposit, setMinDeposit] = useState<number>(20000);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Spin animation state
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hook 1: Mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Hook 2: Prevent background scroll bleed
  useEffect(() => {
    if (isOpen && mounted) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen, mounted]);

  // Hook 3: Fetch rewards state on open
  useEffect(() => {
    if (isOpen) {
      fetchRewards();
      setWonPrize(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  const fetchRewards = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/rewards/spin", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setAvailableTokens(data.availableTokens || 0);
        if (data.slices && data.slices.length > 0) {
          setSlices(data.slices);
        }
        setMinDeposit(data.minDeposit || 20000);
      }
    } catch (err) {
      console.error("Failed to load rewards for modal:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Hook 4: Draw Canvas Wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || slices.length === 0 || !isOpen) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;
    const sliceAngle = (2 * Math.PI) / slices.length;

    ctx.clearRect(0, 0, size, size);

    // Outer glow / border ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 6, 0, 2 * Math.PI);
    ctx.fillStyle = "#1E293B";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#3B82F6";
    ctx.stroke();
    ctx.restore();

    // Draw slices
    slices.forEach((slice, index) => {
      const startAngle = index * sliceAngle + (rotationAngle * Math.PI) / 180;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.stroke();

      // Slice text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = slice.textColor || "#FFFFFF";
      ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 3;
      ctx.fillText(slice.shortLabel || slice.label, radius - 18, 4);
      ctx.restore();
    });

    // Center Hub Outer Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 26, 0, 2 * Math.PI);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#F59E0B";
    ctx.stroke();

    // Center Hub Inner Core
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 10px system-ui, -apple-system, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 2;
    ctx.fillText("SPIN", center, center);
    ctx.restore();
  }, [slices, rotationAngle, isOpen]);

  if (!isOpen || !mounted || typeof document === "undefined") return null;

  const handleSpinClick = async () => {
    if (isSpinning) return;

    if (availableTokens <= 0) {
      setErrorMessage(`You have 0 Spin Tokens. Top up ₦${minDeposit.toLocaleString()}+ to unlock spins!`);
      return;
    }

    setErrorMessage(null);
    setWonPrize(null);
    setIsSpinning(true);

    try {
      const response = await fetch("/api/rewards/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Unable to spin wheel. Please try again.");
        setIsSpinning(false);
        return;
      }

      const winningIndex = data.winningSliceIndex;
      const totalSlices = slices.length;
      const sliceDeg = 360 / totalSlices;

      const sliceCenterAngle = winningIndex * sliceDeg + sliceDeg / 2;
      const targetPointerAngle = 270;
      
      const extraSpins = 360 * 5;
      const currentNormalized = rotationAngle % 360;
      const targetSliceOffset = (targetPointerAngle - sliceCenterAngle + 360) % 360;
      const totalNewRotation = rotationAngle + extraSpins + (targetSliceOffset - currentNormalized + 360) % 360;

      const startTime = performance.now();
      const spinDuration = 4800;
      const initialAngle = rotationAngle;

      const animateWheel = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = initialAngle + (totalNewRotation - initialAngle) * easeOut;

        setRotationAngle(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          setIsSpinning(false);
          setAvailableTokens((prev) => Math.max(0, prev - 1));
          setWonPrize(data.prize);
          triggerNativeConfetti();
          onRefreshBalance?.();
        }
      };

      requestAnimationFrame(animateWheel);
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
      setIsSpinning(false);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-background/80 dark:bg-background/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={!isSpinning ? onClose : undefined}
    >
      <div 
        className="relative w-full max-w-md bg-card text-card-foreground border border-border rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-300 text-center my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSpinning}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer z-10 disabled:opacity-50"
        >
          <X size={15} weight="bold" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-[11px] font-black uppercase tracking-wider">
            <Sparkle weight="fill" className="h-3.5 w-3.5 animate-pulse" />
            <span>Lucky Spin &amp; Win</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Claim Your Reward
          </h2>
          <p className="text-xs text-muted-foreground">
            {availableTokens > 0 
              ? `You have ${availableTokens} spin token${availableTokens > 1 ? "s" : ""}! Tap the wheel to spin.`
              : `Fund ₦${minDeposit.toLocaleString()}+ to unlock free spins, cashback, and passes.`}
          </p>
        </div>

        {/* Available Spins Badge */}
        <div className="inline-flex items-center gap-2 bg-secondary/80 border border-border px-3 py-1.5 rounded-xl text-xs font-bold">
          <Coins weight="fill" className="h-4 w-4 text-amber-500 animate-bounce" />
          <span className="text-muted-foreground">
            Spins Remaining: <strong className="text-foreground font-mono font-black">{availableTokens}</strong>
          </span>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 text-left animate-in fade-in">
            <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* WON PRIZE CELEBRATION VIEW (Replaces wheel so modal never stretches!) */}
        {wonPrize ? (
          <div className="py-2 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
              <Sparkle weight="fill" className="h-8 w-8 animate-pulse text-emerald-500" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500 text-white px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                <CheckCircle weight="fill" className="h-3 w-3" />
                <span>Prize Unlocked!</span>
              </span>
              <h3 className="text-xl font-black text-foreground pt-1">{wonPrize.label}</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">{wonPrize.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground">
              {wonPrize.type === "CASH"
                ? "✓ Cash prize added directly to your wallet balance!"
                : "✓ Saved to your Won Rewards & ready to use immediately!"}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {availableTokens > 0 ? (
                <button
                  type="button"
                  onClick={() => setWonPrize(null)}
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Sparkle weight="fill" size={13} />
                  <span>Spin Again ({availableTokens})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 rounded-xl border border-border hover:bg-secondary text-foreground text-xs font-bold transition-colors cursor-pointer"
                >
                  Done
                </button>
              )}

              <Link
                href="/dashboard/vouchers"
                onClick={onClose}
                className="py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 flex items-center justify-center gap-1 transition-all shadow-sm"
              >
                <Ticket weight="bold" size={13} />
                <span>My Rewards</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ACTIVE SPIN WHEEL VIEW */
          <div className="space-y-3">
            {/* Interactive Canvas Wheel */}
            <div 
              onClick={handleSpinClick}
              className="relative my-1 flex items-center justify-center cursor-pointer group hover:scale-[1.01] active:scale-[0.99] transition-transform select-none"
              title="Click wheel to spin!"
            >
              {/* Top Ticker Pointer */}
              <div className="absolute -top-2 z-20 flex flex-col items-center drop-shadow-md">
                <div className="w-4 h-5 bg-amber-500 border-2 border-white rounded-b-md transform rotate-180 flex items-center justify-center shadow-lg" />
                <div className="w-1.5 h-1.5 bg-amber-600 rounded-full -mt-0.5" />
              </div>

              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="max-w-[230px] sm:max-w-[250px] aspect-square rounded-full shadow-lg"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {availableTokens > 0 ? (
                <button
                  type="button"
                  onClick={handleSpinClick}
                  disabled={isSpinning}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                >
                  {isSpinning ? (
                    <>
                      <Spinner weight="bold" className="h-4 w-4 animate-spin" />
                      <span>Spinning Wheel...</span>
                    </>
                  ) : (
                    <>
                      <Sparkle weight="fill" className="h-4 w-4" />
                      <span>TAP TO SPIN &amp; WIN</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 rounded-xl border border-border hover:bg-secondary text-foreground text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFundWallet?.();
                    }}
                    className="py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <Wallet size={13} weight="bold" />
                    <span>Fund Wallet</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
