"use client";

import { Moon, Sun, Desktop } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-9" />;

  // Cycle: system -> dark -> light -> system
  const toggleTheme = () => {
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors rounded-full hover:bg-primary/10 cursor-pointer flex items-center justify-center h-9 w-9"
      aria-label="Toggle theme"
    >
      {theme === "system" ? (
        <Desktop className="h-5 w-5" weight="bold" />
      ) : theme === "dark" ? (
        <Sun className="h-5 w-5" weight="bold" />
      ) : (
        <Moon className="h-5 w-5" weight="bold" />
      )}
    </button>
  );
}
