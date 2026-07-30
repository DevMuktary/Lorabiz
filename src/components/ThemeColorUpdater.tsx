"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // LoraBiz specific background colors
    const lightThemeColor = "#f8fafc"; 
    const darkThemeColor = "#020617"; 

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    // If the meta tag doesn't exist, create and inject it
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    // Instantly mutate the content attribute to force a Safari UI repaint
    metaThemeColor.setAttribute(
      "content",
      resolvedTheme === "dark" ? darkThemeColor : lightThemeColor
    );
  }, [resolvedTheme]);

  return null;
}
