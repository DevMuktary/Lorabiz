"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import { useEffect } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log(`[LORA: MAIN APP] Session Status: ${status}`);
    if (status === "loading") return;

    let authData = null;
    if (session?.user) {
      authData = {
        userId: (session.user as any).id || session.user.email,
        name: session.user.name || "",
        email: session.user.email || ""
      };
      console.log("[LORA: MAIN APP] Auth Data Extracted:", authData);
    } else {
      console.log("[LORA: MAIN APP] No user session found. Initializing as anonymous.");
    }

    if (typeof window !== 'undefined') {
      if ((window as any).LORA_INIT_WIDGET) {
        console.log("[LORA: MAIN APP] Calling LORA_INIT_WIDGET directly.");
        (window as any).LORA_INIT_WIDGET(authData);
      } else {
        console.log("[LORA: MAIN APP] Script not loaded yet. Saving to window.lorabizUserAuthData.");
        (window as any).lorabizUserAuthData = authData;
      }
    }
  }, [session, status]);

  return (
    <Script 
      src="https://support.lorabiz.com/lorabiz-chat.js" 
      strategy="afterInteractive" 
      onLoad={() => console.log("[LORA: MAIN APP] lorabiz-chat.js Script Loaded successfully.")}
      onError={() => console.error("[LORA: MAIN APP ERROR] Failed to load lorabiz-chat.js")}
    />
  );
}
