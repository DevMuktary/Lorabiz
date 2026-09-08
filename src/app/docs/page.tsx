"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, Sparkles, FileCode2 } from "lucide-react";

declare global {
  interface Window {
    Scalar?: {
      createApiReference: (
        element: HTMLElement | null,
        configuration: {
          spec: { url?: string; content?: any };
          theme?: string;
          layout?: "modern" | "classic";
          darkMode?: boolean;
          showSidebar?: boolean;
          searchHotKey?: string;
          customCss?: string;
          metaData?: {
            title?: string;
            description?: string;
          };
          authentication?: {
            preferredSecurityScheme?: string;
          };
        }
      ) => void;
    };
  }
}

export default function DocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const scriptId = "scalar-api-reference-cdn-script";

    const initScalar = () => {
      if (!isMounted || !containerRef.current || !window.Scalar) return;
      try {
        containerRef.current.innerHTML = "";
        window.Scalar.createApiReference(containerRef.current, {
          spec: {
            url: `/api/openapi.json?t=${Date.now()}`,
          },
          theme: "purple",
          layout: "modern",
          darkMode: true,
          showSidebar: true,
          customCss: `
            /* Interactive Collapsible Slip Previews */
            .scalar-api-reference details {
              margin: 10px 0;
              border: 1px solid rgba(255, 255, 255, 0.14);
              border-radius: 8px;
              background: rgba(255, 255, 255, 0.03);
              overflow: hidden;
              transition: border-color 0.2s ease, background-color 0.2s ease;
            }
            .scalar-api-reference details:hover {
              border-color: rgba(16, 185, 129, 0.35);
              background: rgba(255, 255, 255, 0.05);
            }
            .scalar-api-reference details[open] {
              border-color: rgba(16, 185, 129, 0.5);
              background: rgba(16, 185, 129, 0.03);
            }
            .scalar-api-reference summary {
              padding: 9px 14px;
              font-size: 13px;
              font-weight: 500;
              color: #f1f5f9;
              cursor: pointer;
              user-select: none;
              outline: none;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: color 0.15s ease;
            }
            .scalar-api-reference summary:hover {
              color: #34d399;
            }
            .scalar-api-reference details img[src*="/examples/"] {
              display: block;
              max-width: 320px;
              width: 100%;
              height: auto;
              margin: 10px auto 16px auto;
              border-radius: 8px;
              border: 1px solid rgba(255, 255, 255, 0.12);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
            }

            /* Visible Section Dividers & Endpoint Separation */
            .scalar-api-reference .section,
            .scalar-api-reference .tag-section,
            .scalar-api-reference .endpoint-section {
              border-bottom: 2px solid rgba(255, 255, 255, 0.12) !important;
              padding-bottom: 28px !important;
              margin-bottom: 28px !important;
            }
            .scalar-api-reference hr {
              border-color: rgba(255, 255, 255, 0.18) !important;
              border-width: 1.5px !important;
            }

            @media (max-width: 640px) {
              .scalar-api-reference details img[src*="/examples/"] {
                max-width: 100%;
              }
            }
          `,
          metaData: {
            title: "Lorabiz Developer API Reference",
            description: "Interactive REST API Reference for Lorabiz Identity & NIN Verification Services",
          },
        });
        setLoading(false);
      } catch (err) {
        console.error("Failed to mount Scalar API Reference:", err);
        setLoading(false);
      }
    };

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.jsdelivr.net/npm/@scalar/api-reference";
      script.async = true;
      script.onload = () => {
        initScalar();
      };
      document.body.appendChild(script);
    } else {
      if (window.Scalar) {
        initScalar();
      } else {
        script.addEventListener("load", initScalar);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans">
      {/* Mobile-Optimized Top Navbar */}
      <header className="sticky top-0 z-50 flex h-12 w-full shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#090d16]/95 px-3 sm:px-4 backdrop-blur-md">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/dashboard/developer"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Developer Portal</span>
            <span className="sm:hidden">Portal</span>
          </Link>
          <div className="h-3.5 w-px bg-slate-800 shrink-0" />
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-xs sm:text-sm text-white tracking-tight truncate">
              Lorabiz API Docs
            </span>
            <span className="hidden md:inline rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20 shrink-0">
              v1.0 (OpenAPI 3.1)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link
            href="/api/openapi.json"
            target="_blank"
            className="hidden sm:flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors"
            title="Raw OpenAPI 3.1 JSON"
          >
            <FileCode2 className="h-3.5 w-3.5 text-blue-400" />
            <span>OpenAPI</span>
          </Link>

          <Link
            href="/llms.txt"
            target="_blank"
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-800/60 hover:text-emerald-400 transition-colors"
            title="AI & LLM Markdown Discovery Endpoint"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden xs:inline">llms.txt</span>
          </Link>

          <Link
            href="/dashboard/developer"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 sm:px-3 sm:py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Keys</span>
          </Link>
        </div>
      </header>

      {/* Scalar Container with Natural Browser Flow */}
      <main className="w-full relative min-h-[calc(100vh-48px)]">
        {loading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400 text-sm gap-3 px-4 text-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="font-medium text-slate-300">Loading interactive Scalar documentation...</p>
            <p className="text-xs text-slate-500">Parsing OpenAPI 3.1 specification at /api/openapi.json</p>
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </main>
    </div>
  );
}
