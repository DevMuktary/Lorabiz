"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";
import React, { useEffect } from "react";

// This specifically targets the mobile status bar (theme-color) natively without DOM collisions
function MobileStatusBarSync() {
  const { resolvedTheme } = useTheme();

  const applyStatusBarColor = (theme: string | undefined) => {
    if (!theme) return;

    const color = theme === "dark" ? "#020617" : "#f8fafc";

    // Remove and recreate rather than mutate in place — Safari is far more
    // reliable at picking up a freshly inserted node than an attribute
    // mutation on an existing one.
    const existing = document.querySelectorAll('meta[name="theme-color"]');
    existing.forEach((el) => el.remove());

    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);

    // Nudge iOS Safari into re-sampling the chrome color. Some WebKit
    // versions only repaint the status bar/toolbar on scroll, navigation,
    // or tab-switch events — not on arbitrary DOM mutation.
    requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, window.scrollY + 1);
      window.scrollTo(window.scrollX, window.scrollY - 1);
    });
  };

  useEffect(() => {
    applyStatusBarColor(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    // Re-check whenever the tab regains visibility (e.g. after Control
    // Center or the home screen is dismissed). Covers the case where the
    // OS-level dark/light flip happened while the page didn't get — or
    // hasn't yet processed — the matchMedia change event.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        applyStatusBarColor(resolvedTheme);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handleVisibilityChange);
    };
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
