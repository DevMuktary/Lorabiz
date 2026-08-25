"use client";

import { useState, useEffect, useCallback } from "react";
import { UserLoyaltyProfile } from "@/lib/loyalty";

let cachedProfile: UserLoyaltyProfile | null = null;

export function useLoyalty() {
  const [profile, setProfile] = useState<UserLoyaltyProfile | null>(cachedProfile);
  const [isLoading, setIsLoading] = useState(!cachedProfile);
  const [error, setError] = useState<string | null>(null);

  const fetchLoyalty = useCallback(async () => {
    try {
      const res = await fetch("/api/user/loyalty", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.profile) {
          cachedProfile = json.profile;
          setProfile(json.profile);
          setError(null);
        }
      } else {
        setError("Failed to load loyalty tier");
      }
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLoyalty();
  }, [fetchLoyalty]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchLoyalty,
  };
}
