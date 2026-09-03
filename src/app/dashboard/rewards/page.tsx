// src/app/dashboard/rewards/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  Sparkle, 
  Gift, 
  Ticket, 
  Coins, 
  Clock, 
  ShieldCheck, 
  Info,
  CheckCircle,
  WarningCircle,
  Spinner,
  CaretRight,
  Lightning,
  Wallet,
  X
} from "@phosphor-icons/react";
import { WheelSlice, DEFAULT_WHEEL_SLICES } from "@/lib/rewards";

function triggerNativeConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
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
      p.vy += 0.35; // gravity
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

export default function RewardsSpinPage() {
  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [spinHistory, setSpinHistory] = useState<any[]>([]);
  const [slices, setSlices] = useState<WheelSlice[]>(DEFAULT_WHEEL_SLICES);
  const [minDeposit, setMinDeposit] = useState<number>(20000);
  const [isCampaignActive, setIsCampaignActive] = useState<boolean>(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Spin State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [wonPrize, setWonPrize] = useState<any | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState<boolean>(false);
  const [showNoTokensModal, setShowNoTokensModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/rewards/spin");
      const data = await res.json();

      if (data.success) {
        setAvailableTokens(data.availableTokens || 0);
        setSpinHistory(data.spinHistory || []);
        if (data.slices && data.slices.length > 0) {
          setSlices(data.slices);
        }
        setMinDeposit(data.minDeposit || 20000);
        setIsCampaignActive(data.isCampaignActive ?? true);
        setWalletBalance(data.walletBalance || 0);
      }
    } catch (err) {
      console.error("Failed to load rewards data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Draw the wheel onto canvas whenever slices or rotation changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || slices.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 14;
    const sliceAngle = (2 * Math.PI) / slices.length;

    ctx.clearRect(0, 0, size, size);

    // Outer glow / border ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#1E293B";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#3B82F6";
    ctx.stroke();
    ctx.restore();

    // Draw slices
    slices.forEach((slice, index) => {
      const startAngle = index * sliceAngle + (rotationAngle * Math.PI) / 180;
      const endAngle = startAngle + sliceAngle;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.stroke();

      // Slice text & icon
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = slice.textColor || "#FFFFFF";
      ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 4;

      // Text positioned nicely along radius
      ctx.fillText(slice.shortLabel || slice.label, radius - 24, 5);
      ctx.restore();
    });

    // Center Hub Outer Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 32, 0, 2 * Math.PI);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#F59E0B";
    ctx.stroke();

    // Center Hub Inner Core with "SPIN" Label
    ctx.beginPath();
    ctx.arc(center, center, 24, 0, 2 * Math.PI);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 11px system-ui, -apple-system, sans-serif";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 3;
    ctx.fillText("SPIN", center, center);
    ctx.restore();
  }, [slices, rotationAngle]);

  const handleSpinClick = async () => {
    if (isSpinning) return;

    // If zero tokens, show the friendly branded modal instead of failing silently
    if (availableTokens <= 0) {
      setShowNoTokensModal(true);
      return;
    }

    setErrorMessage(null);
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

      // Calculate target angle to place the winning slice right under the top pointer
      const sliceCenterAngle = winningIndex * sliceDeg + sliceDeg / 2;
      const targetPointerAngle = 270;
      
      const extraSpins = 360 * 6; // 6 full dramatic spins
      const currentNormalized = rotationAngle % 360;
      const targetSliceOffset = (targetPointerAngle - sliceCenterAngle + 360) % 360;
      const totalNewRotation = rotationAngle + extraSpins + (targetSliceOffset - currentNormalized + 360) % 360;

      const startTime = performance.now();
      const spinDuration = 5500; // 5.5 seconds
      const initialAngle = rotationAngle;

      const animateWheel = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        // Cubic ease-out curve for thrilling deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = initialAngle + (totalNewRotation - initialAngle) * easeOut;

        setRotationAngle(currentAngle);

        if (progress < 1) {
          requestAnimationFrame(animateWheel);
        } else {
          // Animation Complete
          setIsSpinning(false);
          setAvailableTokens((prev) => Math.max(0, prev - 1));
          setWonPrize(data.prize);
          setShowCelebrationModal(true);

          // Confetti blast
          triggerNativeConfetti();

          // Refresh user history
          fetchRewardsData();
        }
      };

      requestAnimationFrame(animateWheel);
    } catch (err: any) {
      setErrorMessage(err.message || "Network error. Please try again.");
      setIsSpinning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2 group"
          >
            <ArrowLeft weight="bold" className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Gift weight="fill" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                Lorabiz Spin &amp; Win
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Instant Rewards
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Deposit ₦{minDeposit.toLocaleString()} or more into your wallet to earn free spins and win instant wallet cash, free NIN slips, and registration discounts.
              </p>
            </div>
          </div>
        </div>

        {/* Action button to My Won Rewards */}
        <Link
          href="/dashboard/vouchers"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-bold rounded-xl border border-border transition-colors group shrink-0"
        >
          <Ticket weight="fill" className="h-4 w-4 text-cyan-500" />
          <span>View My Won Rewards</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Main Wheel & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Spin Wheel Stage (7 Cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Top Token Pill */}
          <div className="mb-6 inline-flex items-center gap-2 bg-secondary/80 border border-border px-4 py-2 rounded-2xl">
            <Coins weight="fill" className="h-5 w-5 text-amber-500 animate-bounce" />
            <span className="text-xs text-muted-foreground font-bold">
              Available Spins:{" "}
              <strong className="text-foreground text-sm font-mono font-black">{availableTokens}</strong>
            </span>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-4 w-full max-w-md bg-destructive/10 border border-destructive/20 text-destructive p-3.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <WarningCircle weight="fill" className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Wheel Canvas Container (Clickable to trigger spin!) */}
          <div 
            onClick={handleSpinClick}
            className="relative my-2 flex items-center justify-center cursor-pointer group hover:scale-[1.01] active:scale-[0.99] transition-transform select-none"
            title="Click wheel to spin"
          >
            {/* Pointer Arrow at top */}
            <div className="absolute -top-3 z-20 flex flex-col items-center drop-shadow-md">
              <div className="w-6 h-7 bg-amber-500 border-2 border-white rounded-b-md transform rotate-180 flex items-center justify-center shadow-lg" />
              <div className="w-2 h-2 bg-amber-600 rounded-full -mt-1" />
            </div>

            {/* Canvas Wheel */}
            <canvas
              ref={canvasRef}
              width={420}
              height={420}
              className="max-w-[320px] sm:max-w-[400px] aspect-square rounded-full shadow-2xl transition-transform duration-75"
            />
          </div>

          {/* Spin Trigger Button */}
          <div className="mt-8 w-full max-w-sm space-y-3">
            <button
              type="button"
              onClick={handleSpinClick}
              disabled={isSpinning || !isCampaignActive}
              className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                availableTokens > 0 && !isSpinning && isCampaignActive
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-amber-500/25"
                  : "bg-secondary text-foreground hover:bg-secondary/80 border border-border"
              }`}
            >
              {isSpinning ? (
                <>
                  <Spinner weight="bold" className="h-5 w-5 animate-spin" />
                  <span>Spinning Wheel...</span>
                </>
              ) : availableTokens > 0 ? (
                <>
                  <Sparkle weight="fill" className="h-5 w-5" />
                  <span>SPIN &amp; CLAIM REWARD</span>
                </>
              ) : (
                <>
                  <Coins weight="fill" className="h-5 w-5 text-amber-500" />
                  <span>Get Spin Tokens</span>
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Deposit <strong>₦{minDeposit.toLocaleString()}+</strong> into your wallet to automatically earn 1 free Lucky Spin.
            </p>
          </div>
        </div>

        {/* Right Side: How It Works & Spin History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* How It Works Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Lightning weight="fill" className="h-4 w-4 text-amber-500" />
              How Spin &amp; Win Works
            </h2>

            <ul className="space-y-3 text-xs text-muted-foreground">
              <li className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </div>
                <div>
                  <strong className="text-foreground">Fund ₦{minDeposit.toLocaleString()}+</strong>: Every single wallet deposit of ₦{minDeposit.toLocaleString()} or more unlocks 1 Spin Token.
                </div>
              </li>

              <li className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </div>
                <div>
                  <strong className="text-foreground">Guaranteed Win</strong>: Spin the wheel to receive wallet cashback, free NIN slips, or business discounts.
                </div>
              </li>

              <li className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </div>
                <div>
                  <strong className="text-foreground">Instant Redemption</strong>: Free slips and discounts are ready to use in your forms, and cashback is immediately credited to your wallet!
                </div>
              </li>
            </ul>
          </div>

          {/* Spin History Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Clock weight="bold" className="h-4 w-4 text-primary" />
              Your Recent Rewards
            </h2>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Spinner weight="bold" className="h-5 w-5 animate-spin mx-auto text-primary mb-2" />
                <span>Loading rewards history...</span>
              </div>
            ) : spinHistory.length === 0 ? (
              <div className="py-8 text-center bg-secondary/30 rounded-2xl border border-border/50 text-xs text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">No Spins Yet</p>
                <p>Deposit ₦{minDeposit.toLocaleString()} or more to spin the wheel!</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1">
                {spinHistory.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <p className="font-bold text-foreground">{item.prizeLabel}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shrink-0">
                      {item.prizeType === "CASH"
                        ? `+₦${item.prizeValue.toLocaleString()} Cashback`
                        : "✓ Won"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* NO TOKENS AVAILABLE BRANDED MODAL */}
      {showNoTokensModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="h-16 w-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
              <Coins weight="fill" className="h-8 w-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-foreground">
                No Spin Tokens Remaining
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                You currently have <strong>0 Spin Tokens</strong>. Top up your wallet with <strong>₦{minDeposit.toLocaleString()}</strong> or more in a single deposit to unlock instant free Lucky Spins!
              </p>
            </div>

            <div className="p-3.5 bg-secondary/50 rounded-2xl border border-border text-left space-y-1 text-xs">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Gift weight="fill" className="h-4 w-4 text-amber-500" />
                <span>What can you win?</span>
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Wallet Cashbacks up to ₦10,000, 100% Free NIN Slip Passes, Free NIN Validation Passes, and CAC Discount Vouchers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNoTokensModal(false)}
                className="py-3 rounded-xl border border-border hover:bg-secondary text-foreground text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>

              <Link
                href="/dashboard"
                onClick={() => setShowNoTokensModal(false)}
                className="py-3 rounded-xl bg-primary text-primary-foreground text-xs font-black hover:opacity-90 flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Wallet size={14} weight="bold" />
                <span>Fund Wallet</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATION WIN MODAL */}
      {showCelebrationModal && wonPrize && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in zoom-in-95">
            <div className="h-20 w-20 bg-gradient-to-br from-amber-400 to-amber-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/25">
              <Gift weight="fill" className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                🎉 Congratulations!
              </span>
              <h2 className="text-2xl font-black text-foreground tracking-tight pt-1">
                {wonPrize.label}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {wonPrize.description}
              </p>
            </div>

            {wonPrize.type === "CASH" ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold text-xs space-y-1">
                <p>₦{wonPrize.value.toLocaleString()} has been credited to your wallet balance.</p>
              </div>
            ) : (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-600 dark:text-cyan-400 font-bold text-xs space-y-1">
                <p>This pass has been added to your Vouchers Vault and is ready for use!</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
              >
                Done
              </button>

              <Link
                href="/dashboard/vouchers"
                className="flex-1 py-3 bg-primary text-primary-foreground font-black text-xs rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>View Vouchers</span>
                <ArrowRight weight="bold" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
