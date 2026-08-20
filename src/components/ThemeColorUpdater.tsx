"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const updateThemeColor = (theme: string) => {
      const isDark = theme === "dark";
      const targetColor = isDark ? "#020617" : "#f8fafc";

      // 1. Update all meta[name="theme-color"] tags
      const metas = document.querySelectorAll('meta[name="theme-color"]');
      if (metas.length > 0) {
        metas.forEach((meta) => meta.setAttribute("content", targetColor));
      } else {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        meta.setAttribute("content", targetColor);
        document.head.appendChild(meta);
      }

      // 2. Set color-scheme for native OS status bar rendering
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";

      // 3. Apple status bar style for iOS Safari
      let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (!appleMeta) {
        appleMeta = document.createElement("meta");
        appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
        document.head.appendChild(appleMeta);
      }
      appleMeta.setAttribute("content", isDark ? "black-translucent" : "default");
    };

    if (resolvedTheme) {
      updateThemeColor(resolvedTheme);
    }

    // Direct listener for OS system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      updateThemeColor(newTheme);
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    return () => mediaQuery.removeEventListener("change", handleMediaChange);
  }, [resolvedTheme]);

  return null;
}
