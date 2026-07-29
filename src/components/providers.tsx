"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";

// 1. The tiny component to handle the status bar color instantly
function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    const targetColor = resolvedTheme === "dark" ? "#020617" : "#f8fafc";
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", targetColor);
    } else {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = targetColor;
      document.head.appendChild(meta);
    }
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* 2. Drop the color updater right here */}
        <ThemeColorMeta />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
