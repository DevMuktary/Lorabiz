"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import React from "react";
import { SupportWidgetBootstrapper } from "@/components/SupportWidgetBootstrapper";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <SupportWidgetBootstrapper />
      </ThemeProvider>
    </SessionProvider>
  );
}
