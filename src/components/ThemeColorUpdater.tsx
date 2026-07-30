"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    // LoraBiz strict theme colors
    const targetColor = resolvedTheme === "dark" ? "#020617" : "#f8fafc";

    // 1. Destroy ALL existing theme-color tags (Fixes Next.js multi-tag confusion)
    const existingTags = document.querySelectorAll('meta[name="theme-color"]');
    existingTags.forEach(tag => tag.remove());

    // 2. Inject ONE absolute source of truth for Safari
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", targetColor);
    document.head.appendChild(meta);

    // 3. NUCLEAR SAFARI FIX: Safari ignores the meta tag if the body background 
    // doesn't match perfectly. We force the HTML to match instantly.
    document.documentElement.style.backgroundColor = targetColor;
    document.body.style.backgroundColor = targetColor;

  }, [resolvedTheme]);

  return null;
}
