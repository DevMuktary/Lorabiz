"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";

// Targets the mobile status bar (theme-color) natively with the iOS Safari repaint hack
function MobileStatusBarSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    
    // Using your exact Tailwind palette colors
    const color = resolvedTheme === "dark" ? "#020617" : "#f8fafc";
    
    // 1. Remove the existing tag entirely instead of updating it (WebKit quirk)
    const existing = document.querySelector('meta[name="theme-color"]');
    if (existing) existing.remove();

    // 2. Inject a brand new tag
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);

    // 3. The Safari Nudge: Force the browser chrome to repaint
    requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, window.scrollY + 1);
      window.scrollTo(window.scrollX, window.scrollY - 1);
    });
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem={true}
        enableColorScheme={true} // <-- Keeps native dropdowns matching the theme perfectly
        disableTransitionOnChange
      >
        <MobileStatusBarSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
