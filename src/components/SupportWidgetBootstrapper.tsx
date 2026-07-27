"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import { useEffect } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    const authData = session?.user ? {
      userId: (session.user as any).id || session.user.email,
      name: session.user.name || "",
      email: session.user.email || ""
    } : null;

    // If the external script has already loaded and exposed its init function, call it.
    if (typeof window !== 'undefined' && (window as any).LORA_INIT_WIDGET) {
      (window as any).LORA_INIT_WIDGET(authData);
    } else {
      // If the script is still downloading, save it here so it can read it immediately when ready
      (window as any).lorabizUserAuthData = authData;
    }
  }, [session, status]);

  return (
    <Script 
      src="https://support.lorabiz.com/lorabiz-chat.js" 
      strategy="afterInteractive" 
    />
  );
}
