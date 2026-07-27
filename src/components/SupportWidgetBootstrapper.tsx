"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import { useEffect } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait until NextAuth has fully checked the session
    if (status === "loading") return;

    const authData = session?.user ? {
      userId: (session.user as any).id || session.user.email, 
      name: session.user.name || "",
      email: session.user.email || ""
    } : null;

    (window as any).lorabizUserAuthData = authData;

    // PROACTIVE PUSH: If the iframe loaded faster than NextAuth, 
    // forcefully push the user data into the widget now!
    const iframe = document.getElementById('lorabiz-support-iframe') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
       iframe.contentWindow.postMessage({ 
         type: 'LORA_INIT_AUTH', 
         payload: authData
       }, '*');
    }
  }, [session, status]);

  return (
    <Script 
      src="https://support.lorabiz.com/lorabiz-chat.js" 
      strategy="afterInteractive" 
    />
  );
}
