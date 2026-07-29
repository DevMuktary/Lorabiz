"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";

// This instantly forces the UI, Dropdowns, and Mobile Status bar into alignment
function ThemeSyncFix() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;

    const targetColor = resolvedTheme === "dark" ? "#020617" : "#f8fafc";

    // 1. Fixes the Mobile Status Bar completely
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", targetColor);
    } else {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      metaThemeColor.setAttribute("content", targetColor);
      document.head.appendChild(metaThemeColor);
    }

    // 2. Fixes the Dropdown Flashing (Forces native HTML to match)
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem 
        enableColorScheme // <- Crucial for native dropdowns
        disableTransitionOnChange
      >
        <ThemeSyncFix />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
