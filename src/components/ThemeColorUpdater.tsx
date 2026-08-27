"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    // LoraBiz strict theme colors to match --background in globals.css
    // Light: 210 40% 98% -> #f8fafc
    // Dark: 222.2 84% 4.9% -> #020817
    const targetColor = resolvedTheme === "dark" ? "#020817" : "#f8fafc";

    // 1. Destroy ALL existing theme-color tags (Fixes Next.js multi-tag confusion)
    const existingTags = document.querySelectorAll('meta[name="theme-color"]');
    existingTags.forEach(tag => tag.remove());

    // 2. Inject ONE absolute source of truth for Safari
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", targetColor);
    document.head.appendChild(meta);

    // 3. Force Safari to respect it on HTML/Body
    document.documentElement.style.backgroundColor = targetColor;
    document.body.style.backgroundColor = targetColor;

  }, [resolvedTheme]);

  return null;
}
