"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useTheme } from "next-themes";

const CHATWOOT_BASE_URL = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || "https://support.lorabiz.com";
const CHATWOOT_TOKEN = process.env.NEXT_PUBLIC_CHATWOOT_WEBSITE_TOKEN || "";

export function SupportWidgetBootstrapper() {
  const { data: session, status } = useSession();
  const { resolvedTheme } = useTheme();

  // 1. Initialize Chatwoot SDK
  useEffect(() => {
    if (!CHATWOOT_TOKEN || typeof window === "undefined") return;

    (function(d: Document, t: string) {
      const BASE_URL = CHATWOOT_BASE_URL;
      const g = d.createElement(t) as HTMLScriptElement;
      const s = d.getElementsByTagName(t)[0];
      g.src = `${BASE_URL}/packs/js/sdk.js`;
      g.defer = true;
      g.async = true;
      s.parentNode?.insertBefore(g, s);
      g.onload = function() {
        (window as any).chatwootSDK?.run({
          websiteToken: CHATWOOT_TOKEN,
          baseUrl: BASE_URL,
        });
      };
    })(document, "script");
  }, []);

  // 2. Identify Logged-in User
  useEffect(() => {
    if (status === "loading" || !CHATWOOT_TOKEN) return;

    if (session?.user && typeof window !== "undefined" && (window as any).$chatwoot) {
      try {
        (window as any).$chatwoot.setUser((session.user as any).id || session.user.email, {
          name: session.user.name || "",
          email: session.user.email || "",
        });
      } catch (e) {}
    }
  }, [session, status]);

  // 3. Sync Dark/Light Mode with Next-Themes
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).$chatwoot && resolvedTheme) {
      try {
        (window as any).$chatwoot.setDarkMode?.(resolvedTheme === "dark");
      } catch (e) {}
    }
  }, [resolvedTheme]);

  return null;
}

