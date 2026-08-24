"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";
import Script from "next/script";
import { ArrowClockwise, ShieldCheck, WarningCircle } from "@phosphor-icons/react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  action?: string;
  theme?: "auto" | "light" | "dark";
  className?: string;
}

export const TurnstileWidget = memo(function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
  action = "turnstile-verify",
  theme = "auto",
  className = "",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const resetAndRetry = useCallback(() => {
    const win = window as any;
    if (widgetIdRef.current && win.turnstile) {
      try {
        win.turnstile.reset(widgetIdRef.current);
        setLoadError(false);
        setIsVerifying(true);
      } catch (e) {
        console.warn("[Turnstile] Reset failed, re-rendering...", e);
      }
    } else {
      setRetryCount((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let autoRetryTimeout: NodeJS.Timeout;

    const renderWidget = () => {
      const win = window as any;
      if (win.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          setIsVerifying(true);
          setLoadError(false);

          widgetIdRef.current = win.turnstile.render(containerRef.current, {
            sitekey: "0x4AAAAAAEA2i2RM9PiSsRCH",
            callback: (token: string) => {
              if (token) {
                (window as any).__lastTurnstileToken = token;
                setIsVerifying(false);
                setLoadError(false);
                onVerify(token);
              }
            },
            "error-callback": () => {
              console.warn("[Turnstile] Error encountered. Automatically retrying...");
              setLoadError(true);
              setIsVerifying(false);
              if (onError) onError();

              // Self-healing auto-retry after 1.2s
              clearTimeout(autoRetryTimeout);
              autoRetryTimeout = setTimeout(() => {
                const w = window as any;
                if (widgetIdRef.current && w.turnstile) {
                  try {
                    w.turnstile.reset(widgetIdRef.current);
                    setLoadError(false);
                    setIsVerifying(true);
                  } catch (e) {}
                }
              }, 1200);
            },
            "expired-callback": () => {
              console.warn("[Turnstile] Token expired. Auto-refreshing...");
              if (onExpire) onExpire();
              const w = window as any;
              if (widgetIdRef.current && w.turnstile) {
                try {
                  w.turnstile.reset(widgetIdRef.current);
                } catch (e) {}
              }
            },
            "timeout-callback": () => {
              console.warn("[Turnstile] Timed out. Auto-retrying...");
              const w = window as any;
              if (widgetIdRef.current && w.turnstile) {
                try {
                  w.turnstile.reset(widgetIdRef.current);
                } catch (e) {}
              }
            },
            action,
            theme,
            size: "normal",
            retry: "auto",
            "retry-interval": 1000,
            "refresh-expired": "auto",
            "refresh-timeout": "auto",
          });

          clearInterval(intervalId);
        } catch (e) {
          console.warn("[Turnstile] Render error:", e);
          setLoadError(true);
          setIsVerifying(false);
        }
      }
    };

    intervalId = setInterval(() => {
      if ((window as any).turnstile) {
        renderWidget();
      }
    }, 80);

    return () => {
      clearInterval(intervalId);
      clearTimeout(autoRetryTimeout);
      const win = window as any;
      if (widgetIdRef.current && win.turnstile) {
        try {
          win.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [onVerify, onError, onExpire, action, theme, retryCount]);

  return (
    <div className={`w-full flex flex-col items-center justify-center my-3 ${className}`}>
      <Script 
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" 
        strategy="afterInteractive" 
      />

      <div 
        ref={containerRef} 
        className="min-h-[65px] flex items-center justify-center transition-all duration-200"
      />

      {loadError && (
        <div className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
          <WarningCircle size={15} className="shrink-0" />
          <span>Security check retrying...</span>
          <button
            type="button"
            onClick={resetAndRetry}
            className="ml-1 inline-flex items-center gap-1 text-[11px] underline font-bold hover:text-amber-400 cursor-pointer"
          >
            <ArrowClockwise size={12} />
            <span>Tap to retry</span>
          </button>
        </div>
      )}
    </div>
  );
});
