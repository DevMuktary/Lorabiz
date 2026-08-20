"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme, theme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    // Synchronize native color-scheme
    document.documentElement.style.colorScheme = resolvedTheme === "dark" ? "dark" : "light";

    // If the user explicitly selected light/dark (not system), update meta tags
    if (theme === "light" || theme === "dark") {
      const targetColor = resolvedTheme === "dark" ? "#020617" : "#f8fafc";
      const metas = document.querySelectorAll('meta[name="theme-color"]');
      metas.forEach(meta => meta.setAttribute("content", targetColor));
    }
  }, [resolvedTheme, theme]);

  return null;
}
