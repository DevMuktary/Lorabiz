"use client";

import { useSession } from "next-auth/react";
import Script from "next/script";
import { useEffect } from "react";

export function SupportWidgetBootstrapper() {
  const { data: session } = useSession();

  useEffect(() => {
    // If the user is logged in, attach their data to the window object
    // so the lorabiz-chat.js script can grab it when the iframe asks for it.
    if (session?.user) {
      (window as any).lorabizUserAuthData = {
        // NOTE: If your NextAuth session uses a different key for the ID (like 'sub' or '_id'), 
        // change `session.user.id` to match your schema.
        userId: (session.user as any).id || session.user.email, 
        name: session.user.name || "",
        email: session.user.email || ""
      };
    } else {
      // Clear auth data if logged out so strangers don't hijack sessions
      (window as any).lorabizUserAuthData = null;
    }
  }, [session]);

  return (
    <Script 
      // Replace this URL with your actual deployed support URL
      src="https://support.lorabiz.com/lorabiz-chat.js" 
      strategy="afterInteractive" 
    />
  );
}
