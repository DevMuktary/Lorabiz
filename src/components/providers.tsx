"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { SessionProvider } from "next-auth/react";

// 1. Component that aggressively forces the mobile status bar to match the theme instantly
function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();
  
  React.useEffect(() => {
    // 2. Find the meta tag and change it the exact millisecond the theme flips
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    // Using #020617 for dark mode (Slate 950) and #f8fafc for light mode (Slate 50)
    const targetColor = resolvedTheme === "dark" ? "#020617" : "#f8fafc";
    
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", targetColor);
    } else {
      // If it doesn't exist yet, create it and inject it into the head
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = targetColor;
      document.head.appendChild(meta);
    }
  }, [resolvedTheme]);

  return null;
}

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <SessionProvider>
      <NextThemesProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem 
        disableTransitionOnChange
        {...props}
      >
        <ThemeColorMeta /> {/* 3. Inject the dynamic meta updater */}
        {children}
      </NextThemesProvider>
    </SessionProvider>
  );
}
