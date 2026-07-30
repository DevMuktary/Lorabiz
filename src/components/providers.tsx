"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import React from "react";
import { ThemeColorUpdater } from "./ThemeColorUpdater";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeColorUpdater />
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
