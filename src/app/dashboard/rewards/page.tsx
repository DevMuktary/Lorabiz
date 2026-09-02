"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
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
  Lightning
} from "@phosphor-icons/react";
import { WheelSlice, DEFAULT_WHEEL_SLICES } from "@/lib/rewards";

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

    // Center Hub Pin
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = "#0F172A";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#F59E0B";
    ctx.stroke();

    // Center icon badge
    ctx.beginPath();
    ctx.arc(center, center, 14, 0, 2 * Math.PI);
    ctx.fillStyle = "#F59E0B";
    ctx.fill();
    ctx.restore();
  }, [slices, rotationAngle]);

  const handleSpinClick = async () => {
    if (isSpinning || availableTokens <= 0) return;

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

      // The top pointer is at 270 degrees (or -90 deg from 0 rad at 3 o'clock).
      // Calculate target angle to place the winning slice right under the top pointer
      const sliceCenterAngle = winningIndex * sliceDeg + sliceDeg / 2;
      const targetPointerAngle = 270;
      
      // Calculate delta to rotate so winning slice center aligns with top pointer
      const extraSpins = 360 * 6; // 6 full dramatic spins
      const currentNormalized = rotationAngle % 360;
      const targetSliceOffset = (targetPointerAngle - sliceCenterAngle + 360) % 360;
      const totalNewRotation = rotationAngle + extraSpins + (targetSliceOffset - currentNormalized + 360) % 360;

      // Smooth deceleration animation using requestAnimationFrame
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
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.6 },
            });
          } catch {}

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
                Lorabiz Reward Vault
                <span className="text-[10px] uppercase font-black tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Lucky Spin & Win
                </span>
              </h1>
              <p className="text-muted-foreground text-sm">
                Fund ₦{minDeposit.toLocaleString()} or more in a single deposit to unlock guaranteed reward tokens.
              </p>
            </div>
          </div>
        </div>

        {/* Link to Vouchers Hub */}
        <Link
          href="/dashboard/vouchers"
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-foreground text-sm font-bold rounded-xl border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group shrink-0"
        >
          <Ticket weight="bold" className="h-4 w-4" />
          <span>My Vouchers & Passes</span>
          <ArrowRight weight="bold" className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Campaign Notice Banner */}
      {!isCampaignActive && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded-2xl text-sm flex items-center gap-3">
          <Info weight="fill" className="h-5 w-5 shrink-0" />
          <span>The Reward Vault campaign is currently paused. Please check back shortly.</span>
        </div>
      )}

      {/* Main Wheel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Interactive Wheel (7 Cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
          
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Available Tokens Counter */}
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

          {/* Wheel Canvas Container */}
          <div className="relative my-2 flex items-center justify-center">
            
            {/* Pointer / Ticker Arrow at top */}
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
              disabled={isSpinning || availableTokens <= 0 || !isCampaignActive}
              className={`w-full py-4 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                availableTokens > 0 && !isSpinning && isCampaignActive
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-amber-500/25"
                  : "bg-secondary text-muted-foreground border border-border cursor-not-allowed opacity-75"
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
                  <span>SPIN & CLAIM REWARD</span>
                </>
              ) : (
                <span>No Spin Tokens Available</span>
              )}
            </button>

            {availableTokens <= 0 && (
              <p className="text-xs text-muted-foreground">
                Deposit <strong>₦{minDeposit.toLocaleString()}+</strong> into your wallet to automatically unlock a free Lucky Spin.
              </p>
            )}
          </div>
        </div>

        {/* Right Side: How It Works & Spin History (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* How It Works Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Lightning weight="fill" className="h-4 w-4 text-amber-500" />
              How Reward Vault Works
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
                  <strong className="text-foreground">Guaranteed Win</strong>: Spin the wheel to receive wallet cashback, free NIN slip passes, or CAC vouchers.
                </div>
              </li>

              <li className="flex gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </div>
                <div>
                  <strong className="text-foreground">Instant Fulfillment</strong>: Cashback is deposited straight into your wallet. Service passes are stored in your <Link href="/dashboard/vouchers" className="text-primary underline font-bold">Vouchers Vault</Link> to use whenever you wish.
                </div>
              </li>
            </ul>
          </div>

          {/* My Spin History */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-black text-foreground flex items-center gap-2">
                <Clock weight="bold" className="h-4 w-4 text-primary" />
                My Recent Spins
              </h2>
              <span className="text-xs text-muted-foreground">{spinHistory.length} Recorded</span>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">
                <Spinner weight="bold" className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : spinHistory.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-xs space-y-1">
                <Gift weight="duotone" className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p>No spins recorded yet.</p>
                <p className="text-[11px] opacity-75">Fund your wallet to get your first Lucky Spin!</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {spinHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">
                        {item.wonPrizeLabel || item.wonPrizeType || "Reward Won"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.spunAt ? new Date(item.spunAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently"}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle weight="fill" className="h-3 w-3" />
                      Claimed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Winning Celebration Modal */}
      {showCelebrationModal && wonPrize && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            <div className="h-20 w-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Gift weight="fill" className="h-10 w-10 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                🎉 Congratulations!
              </span>
              <h2 className="text-2xl font-black text-foreground pt-1">{wonPrize.label}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your reward has been processed and instantly added to your account!
              </p>
            </div>

            {/* Voucher Code Preview if applicable */}
            {wonPrize.details?.voucherCode && (
              <div className="p-3.5 bg-secondary border border-border rounded-2xl space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  Your Voucher Code
                </span>
                <div className="font-mono font-black text-base text-primary tracking-widest select-all">
                  {wonPrize.details.voucherCode}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard/vouchers"
                className="w-full sm:flex-1 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Ticket weight="bold" className="h-4 w-4" />
                <span>View in Vouchers</span>
              </Link>
              
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="w-full sm:flex-1 py-3.5 rounded-xl border border-border bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs transition-colors cursor-pointer"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
