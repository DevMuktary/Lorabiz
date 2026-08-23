"use client";

import { useEffect, useRef, memo } from "react";
import Script from "next/script";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
}

// React.memo is the secret here: It prevents this component from re-rendering 
// when the user types their password in the parent component.
export const TurnstileWidget = memo(function TurnstileWidget({ onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const renderWidget = () => {
      const win = window as any;
      if (win.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = win.turnstile.render(containerRef.current, {
          sitekey: "0x4AAAAAAEA2i2RM9PiSsRCH",
          callback: (token: string) => onVerify(token),
          action: "turnstile-spin-v2",
          theme: "auto",
          retry: "auto",
          "retry-interval": 2000,
        });
        clearInterval(intervalId); // Stop polling once rendered
      }
    };

    // Polling handles the Safari caching/soft-navigation issue
    intervalId = setInterval(() => {
      if ((window as any).turnstile) {
        renderWidget();
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      const win = window as any;
      if (widgetIdRef.current && win.turnstile) {
        win.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onVerify]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" />
      <div ref={containerRef} className="min-h-[65px]" />
    </>
  );
});
