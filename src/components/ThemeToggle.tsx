"use client";

import { Moon, Sun, Monitor } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Prevent React hydration errors
  useEffect(() => setMounted(true), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors rounded-full hover:bg-primary/10 cursor-pointer flex items-center justify-center h-9 w-9"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Moon className="h-5 w-5" weight="bold" />
        ) : theme === "light" ? (
          <Sun className="h-5 w-5" weight="bold" />
        ) : (
          <Monitor className="h-5 w-5" weight="bold" />
        )}
      </button>

      {/* 3-WAY DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-xl shadow-xl z-[50] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1.5 flex flex-col gap-0.5">
            <button
              onClick={() => { setTheme("light"); setIsOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${
                theme === "light" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Sun className="h-4 w-4 shrink-0" weight={theme === "light" ? "fill" : "bold"} />
              Light Mode
            </button>
            
            <button
              onClick={() => { setTheme("dark"); setIsOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${
                theme === "dark" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Moon className="h-4 w-4 shrink-0" weight={theme === "dark" ? "fill" : "bold"} />
              Dark Mode
            </button>
            
            <button
              onClick={() => { setTheme("system"); setIsOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-bold transition-colors ${
                theme === "system" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Monitor className="h-4 w-4 shrink-0" weight={theme === "system" ? "fill" : "bold"} />
              System (Auto)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
