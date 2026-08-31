"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Key, Code } from "@phosphor-icons/react";

export default function DeveloperDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically inject Scalar API Reference standalone bundle
    if (document.getElementById("scalar-api-reference-script")) return;

    const script = document.createElement("script");
    script.id = "scalar-api-reference-script";
    script.src = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
    script.async = true;

    // Configure Scalar options
    const config = {
      spec: {
        url: "/api/v1/openapi.json",
      },
      theme: "saturn",
      layout: "modern",
      darkMode: true,
      showSidebar: true,
      searchHotKey: "k",
      defaultHttpClient: {
        targetKey: "node",
        clientKey: "fetch",
      },
      metaData: {
        title: "Lorabiz API Reference",
      },
      customCss: `
        :root {
          --scalar-color-accent: #c7365f !important;
          --scalar-color-1: #ffffff !important;
        }
        .dark-mode {
          --scalar-background-1: #0B0F19 !important;
          --scalar-background-2: #111827 !important;
          --scalar-background-3: #1F2937 !important;
          --scalar-color-accent: #c7365f !important;
        }
      `,
    };

    script.setAttribute("data-configuration", JSON.stringify(config));
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      const el = document.getElementById("scalar-api-reference-script");
      if (el) el.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-50 bg-[#111827]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/developer"
            className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" weight="bold" />
            Back to Developer Dashboard
          </Link>
          <div className="h-4 w-px bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-300">v1.0.0 (Active)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/developer"
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-[#c7365f] text-white hover:bg-[#c7365f]/90 transition-colors shadow-sm"
          >
            <Key className="w-3.5 h-3.5" weight="bold" />
            API Keys
          </Link>
        </div>
      </header>

      {/* Scalar Container */}
      <main className="flex-1 w-full" ref={containerRef}>
        <noscript>
          <div className="p-8 text-center text-slate-400">
            Please enable JavaScript to view the interactive Scalar documentation.
          </div>
        </noscript>
      </main>
    </div>
  );
}
