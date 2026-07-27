"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import { useEffect, useState } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();
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

  return (
    <Script 
      src="https://support.lorabiz.com/lorabiz-chat.js?v=2.0" 
      strategy="afterInteractive" 
      onLoad={() => setScriptLoaded(true)}
    />
  );
}
