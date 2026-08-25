"use client";

import React, { useState } from "react";
import { LoyaltyTierLevel } from "@/lib/loyalty";

interface TierAvatarProps {
  image?: string | null;
  initials: string;
  tierLevel?: LoyaltyTierLevel | string;
  size?: "sm" | "md" | "lg" | "xl";
  showRibbon?: boolean;
  className?: string;
  onClick?: () => void;
}

const TIER_STYLES: Record<string, {
  ringClass: string;
  badgeEmoji: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}> = {
  TIER_1: {
    ringClass: "ring-2 ring-amber-500/80 border-amber-600/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]",
    badgeEmoji: "🥉",
    badgeBg: "bg-amber-600 text-white",
    badgeText: "Bronze",
    label: "Tier 1 · Bronze",
  },
  TIER_2: {
    ringClass: "ring-2 ring-slate-300 dark:ring-slate-300 border-slate-400/50 shadow-[0_0_8px_rgba(203,213,225,0.4)]",
    badgeEmoji: "🥈",
    badgeBg: "bg-slate-500 text-white",
    badgeText: "Silver",
    label: "Tier 2 · Silver",
  },
  TIER_3: {
    ringClass: "ring-2 ring-yellow-400 border-yellow-500/60 shadow-[0_0_12px_rgba(234,179,8,0.5)]",
    badgeEmoji: "🥇",
    badgeBg: "bg-yellow-500 text-slate-950 font-black",
    badgeText: "Gold",
    label: "Tier 3 · Gold Pro",
  },
  TIER_4: {
    ringClass: "ring-2 ring-[#ff3f7a] border-sky-400 shadow-[0_0_14px_rgba(255,63,122,0.55)]",
    badgeEmoji: "💎",
    badgeBg: "bg-gradient-to-r from-[#ff3f7a] to-sky-500 text-white font-black",
    badgeText: "VIP",
    label: "Tier 4 · Platinum VIP",
  },
};

const SIZE_MAP = {
  sm: {
    container: "h-8 w-8 text-[11px]",
    badge: "-bottom-1 -right-1 h-3.5 w-3.5 text-[8px]",
  },
  md: {
    container: "h-9 w-9 text-[12px]",
    badge: "-bottom-1 -right-1 h-4 w-4 text-[9px]",
  },
  lg: {
    container: "h-14 w-14 text-base",
    badge: "-bottom-1.5 -right-1.5 h-5 w-5 text-[11px]",
  },
  xl: {
    container: "h-16 w-16 text-lg",
    badge: "-bottom-1.5 -right-1.5 h-6 w-6 text-[12px]",
  },
};

export default function TierAvatar({
  image,
  initials,
  tierLevel = "TIER_1",
  size = "md",
  showRibbon = true,
  className = "",
  onClick,
}: TierAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const tierConfig = TIER_STYLES[tierLevel] || TIER_STYLES.TIER_1;
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  return (
    <div 
      className={`relative inline-block select-none ${onClick ? "cursor-pointer" : ""} ${className}`}
      onClick={onClick}
      title={tierConfig.label}
    >
      <div
        className={`
          ${sizeConfig.container} rounded-full overflow-hidden 
          bg-gradient-to-tr from-primary to-[#ff7b9f] 
          flex items-center justify-center text-primary-foreground font-black 
          border border-background transition-transform duration-200 hover:scale-105
          ${tierConfig.ringClass}
        `}
      >
        {image && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Profile Avatar"
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {/* Tier Ribbon / Badge Indicator */}
      {showRibbon && (
        <span
          className={`
            absolute ${sizeConfig.badge} rounded-full flex items-center justify-center 
            shadow-md border border-background z-10 select-none
            ${tierConfig.badgeBg}
          `}
          title={tierConfig.label}
        >
          <span>{tierConfig.badgeEmoji}</span>
        </span>
      )}
    </div>
  );
}
