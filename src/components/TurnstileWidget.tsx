"use client";

import { useEffect, useRef, memo } from "react";
import Script from "next/script";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
}

export const TurnstileWidget = memo(function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const renderWidget = () => {
      const win = window as any;
      if (win.turnstile && containerRef.current && !widgetIdRef.current) {
        try {
          widgetIdRef.current = win.turnstile.render(containerRef.current, {
            sitekey: "0x4AAAAAAEA2i2RM9PiSsRCH",
            callback: (token: string) => {
              if (token) onVerify(token);
            },
            action: "turnstile-spin-v2",
            theme: "auto",
            retry: "auto",
            "retry-interval": 2000,
          });
          clearInterval(intervalId);
        } catch (e) {
          console.warn("[Turnstile] Render error:", e);
        }
      }
    };

    intervalId = setInterval(() => {
      if ((window as any).turnstile) {
        renderWidget();
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      const win = window as any;
      if (widgetIdRef.current && win.turnstile) {
        try {
          win.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [onVerify]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={containerRef} className="hidden" />
    </>
  );
});
