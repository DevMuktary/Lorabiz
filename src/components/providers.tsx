"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";

function StatusBarUpdater() {
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
        enableSystem 
        enableColorScheme // NATIVE FIX: Stops the dropdown flashing
        disableTransitionOnChange
      >
        <StatusBarUpdater />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
