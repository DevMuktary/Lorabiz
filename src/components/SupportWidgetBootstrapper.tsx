"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import { useEffect, useState } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();
  const [scriptLoaded, setScriptLoaded] = useState(false);

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
      // Check if the script has attached our new function to the window
      if ((window as any).LORA_INIT_WIDGET) {
        console.log("[LORA: MAIN APP] Calling LORA_INIT_WIDGET directly.");
        (window as any).LORA_INIT_WIDGET(authData);
      } else {
        console.log("[LORA: MAIN APP] Script not loaded yet. Saving to window.lorabizUserAuthData.");
        (window as any).lorabizUserAuthData = authData;
      }
    }
  }, [session, status, scriptLoaded]); // Re-run this when the script successfully loads

  return (
    <Script 
      // THE FIX: Adding ?v=2.0 forces the browser to download the NEW script!
      src="https://support.lorabiz.com/lorabiz-chat.js?v=2.0" 
      strategy="afterInteractive" 
      onLoad={() => {
        console.log("[LORA: MAIN APP] lorabiz-chat.js Script Loaded successfully.");
        setScriptLoaded(true); // Tells the app the script is ready to receive data
      }}
      onError={() => console.error("[LORA: MAIN APP ERROR] Failed to load lorabiz-chat.js")}
    />
  );
}
