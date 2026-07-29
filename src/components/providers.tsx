"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";

// This specifically targets the mobile status bar (theme-color) natively without DOM collisions
function MobileStatusBarSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    
    const color = resolvedTheme === "dark" ? "#020617" : "#f8fafc";
    let meta = document.querySelector('meta[name="theme-color"]');
    
    if (meta) {
      meta.setAttribute("content", color);
    } else {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      meta.setAttribute("content", color);
      document.head.appendChild(meta);
    }
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
        enableColorScheme={true} // <-- NATIVE FIX: Forces HTML dropdowns to match theme with 0 flashing
        disableTransitionOnChange
      >
        <MobileStatusBarSync />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
