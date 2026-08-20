"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const updateThemeColor = (theme: string) => {
      const isDark = theme === "dark";
      const targetColor = isDark ? "#020617" : "#f8fafc";

      // 1. Update/Ensure meta theme-color exists without DOM flickering
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", targetColor);

      // 2. Set color-scheme for native OS status bar rendering
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      document.documentElement.style.backgroundColor = targetColor;
      document.body.style.backgroundColor = targetColor;

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

    // Direct listener for OS system theme changes (e.g. mobile control center pull-down while scrolled)
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
