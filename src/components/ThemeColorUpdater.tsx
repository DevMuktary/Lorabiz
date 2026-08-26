"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  useEffect(() => {
    const isDark = resolvedTheme === "dark";
    const targetColor = isDark ? "#020617" : "#f8fafc";
    const statusBarStyle = isDark ? "black-translucent" : "default";

    // 1. Synchronize document element color-scheme & background
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    document.documentElement.style.backgroundColor = targetColor;
    document.body.style.backgroundColor = targetColor;

    // 2. Manage theme-color meta tag safely
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", targetColor);

    // 3. Apple status bar style for iOS Safari
    let metaAppleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!metaAppleStatus) {
      metaAppleStatus = document.createElement("meta");
      metaAppleStatus.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(metaAppleStatus);
    }
    metaAppleStatus.setAttribute("content", statusBarStyle);

  }, [resolvedTheme]);

  // Listen to OS-level system theme changes (phone notification shade / settings toggle)
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const isDark = e.matches;
        const targetColor = isDark ? "#020617" : "#f8fafc";
        document.documentElement.style.colorScheme = isDark ? "dark" : "light";
        document.documentElement.style.backgroundColor = targetColor;
        document.body.style.backgroundColor = targetColor;

        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
          metaThemeColor.setAttribute("content", targetColor);
        }
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme]);

  return null;
}
