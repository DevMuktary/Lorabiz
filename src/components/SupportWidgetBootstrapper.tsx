"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Script from "next/script";
import { useEffect, useState } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    let authData = null;
    if (session?.user) {
      authData = {
        userId: (session.user as any).id || session.user.email,
        name: session.user.name || "",
        email: session.user.email || ""
      };
    }

    if (typeof window !== 'undefined') {
      if ((window as any).LORA_INIT_WIDGET) {
        (window as any).LORA_INIT_WIDGET(authData);
      } else {
        (window as any).lorabizUserAuthData = authData;
      }
    }
  }, [session, status, scriptLoaded]);

  // Sync theme changes to support widget iframe directly
  useEffect(() => {
    if (typeof window === "undefined" || !resolvedTheme) return;

    const iframe = document.getElementById("lorabiz-support-iframe") as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        { type: "LORA_THEME_CHANGE", theme: resolvedTheme },
        "*"
      );
    }
  }, [resolvedTheme]);

  return (
    <Script 
      src="https://support.lorabiz.com/lorabiz-chat.js?v=2.0" 
      strategy="afterInteractive" 
      onLoad={() => setScriptLoaded(true)}
    />
  );
}
