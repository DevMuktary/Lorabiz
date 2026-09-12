"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import React from "react";
import { SupportWidgetBootstrapper } from "@/components/SupportWidgetBootstrapper";
import { ThemeColorUpdater } from "@/components/ThemeColorUpdater";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {/* Must live inside ThemeProvider — it reads the resolved theme. */}
        <ThemeColorUpdater />
        {children}
        <SupportWidgetBootstrapper />
      </ThemeProvider>
    </SessionProvider>
  );
}
